from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import time
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

MODULE_DIR = Path(__file__).resolve().parent
if str(MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(MODULE_DIR))

from inbox_postgres import database_status as postgres_database_status
from inbox_postgres import load_session_updates as load_postgres_session_updates

HUB_DIR = MODULE_DIR
WORKSPACE_DIR = HUB_DIR.parents[2]
LOCAL_ONLY_DIR = WORKSPACE_DIR / "_local" / "LOCAL-ONLY"
CANONICAL_REPO_DIR = WORKSPACE_DIR / "_My Open Source" / "repos-hub"
PUBLIC_PREVIEW_DIR = HUB_DIR / "public-preview"
DATA_DIR = HUB_DIR / "data"
REPO_INVENTORY_PATH = WORKSPACE_DIR / ".llatos" / "data" / "repo-estate-inventory.json"
RESEARCH_PATH = DATA_DIR / "repo-research.json"
BACKLOG_PATH = DATA_DIR / "extraction-backlog.json"
UPDATE_SCHEDULE_PATH = DATA_DIR / "repo-update-schedule.json"
KNOWLEDGE_INDEX_PATH = DATA_DIR / "knowledge-index.json"
SESSION_INDEX_PATH = DATA_DIR / "session-index.json"
SESSION_UPDATES_DIR = LOCAL_ONLY_DIR / "session-updates" / "repos"
ALLOWED_WEB_ROOTS = {
    "/internal": HUB_DIR,
    "/repos-hub/local-hub": HUB_DIR,
    "/preview": PUBLIC_PREVIEW_DIR,
    "/repos-docs": WORKSPACE_DIR / ".llatos" / "docs",
    "/LOCAL-ONLY": LOCAL_ONLY_DIR,
}
SESSION_UPDATE_STALE_HOURS = 18.0
GIT_TIMEOUT_SECONDS = 1.0
REPO_TELEMETRY_CACHE_TTL_SECONDS = 30.0
REPO_TELEMETRY_CACHE: dict[str, tuple[float, dict]] = {}
HOST_REFRESH_SECONDS = 15.0
TAILSCALE_EXE = Path(r"C:\Program Files\Tailscale\tailscale.exe")


def load_json(path: Path) -> dict | list:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def normalize_web_path(path: str | None) -> str | None:
    if not path:
        return None
    if path.startswith("/"):
        return path
    return f"/internal/{path.lstrip('/')}"


def web_path_to_disk(path: str | None) -> Path | None:
    if not path:
        return None
    normalized = "/" + path.lstrip("/")
    for prefix, root in ALLOWED_WEB_ROOTS.items():
        if normalized == prefix or normalized.startswith(f"{prefix}/"):
            relative = normalized[len(prefix) :].lstrip("/")
            candidate = (root / relative).resolve()
            try:
                candidate.relative_to(root.resolve())
            except ValueError:
                return None
            return candidate
    return None


def disk_path_to_web_path(path: Path | None) -> str | None:
    if not path:
        return None
    resolved = path.resolve()
    for prefix, root in ALLOWED_WEB_ROOTS.items():
        root_resolved = root.resolve()
        try:
            relative = resolved.relative_to(root_resolved)
        except ValueError:
            continue
        relative_path = str(relative).replace("\\", "/")
        return prefix if not relative_path else f"{prefix}/{relative_path}"
    return None


def enrich_doc_link(payload: dict) -> dict:
    item = dict(payload)
    path = normalize_web_path(item.get("path"))
    item["path"] = path
    disk_path = web_path_to_disk(path) if isinstance(path, str) else None
    item["exists"] = bool(disk_path and disk_path.exists())
    return item


def run_git(args: list[str], cwd: Path, timeout_seconds: float = GIT_TIMEOUT_SECONDS) -> str:
    try:
        result = subprocess.run(
            ["git", "--no-optional-locks", *args],
            capture_output=True,
            text=True,
            cwd=str(cwd),
            timeout=timeout_seconds,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return ""
    if result.returncode != 0:
        return ""
    return result.stdout.strip()


def preferred_tailscale_ip() -> str | None:
    if not TAILSCALE_EXE.exists():
        return None

    try:
        result = subprocess.run(
            [str(TAILSCALE_EXE), "ip", "-4"],
            capture_output=True,
            text=True,
            timeout=1.0,
            check=False,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (subprocess.SubprocessError, OSError):
        return None

    if result.returncode != 0 or not result.stdout:
        return None

    for line in result.stdout.splitlines():
        value = line.strip()
        if value:
            return value

    return None


def resolved_hosts() -> list[str]:
    raw_hosts = os.environ.get("REPOS_HUB_HOSTS") or os.environ.get("REPOS_HUB_HOST")
    hosts = []
    if raw_hosts:
        for item in raw_hosts.split(","):
            value = item.strip()
            if value:
                hosts.append(value)
    if not hosts:
        hosts.append("127.0.0.1")
    return list(dict.fromkeys(hosts))


def start_bound_server(host: str, port: int) -> tuple[ThreadingHTTPServer, threading.Thread]:
    server = ThreadingHTTPServer((host, port), HubHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    print(f"Repos Hub ready at http://{host}:{port}/repos-hub/local-hub/index.html")
    return server, thread


def host_refresh_loop(
    port: int,
    servers: dict[str, ThreadingHTTPServer],
    lock: threading.Lock,
    stop_event: threading.Event,
) -> None:
    while not stop_event.wait(HOST_REFRESH_SECONDS):
        desired_hosts = resolved_hosts()
        with lock:
            current_hosts = set(servers.keys())

        for host in desired_hosts:
            if host in current_hosts:
                continue
            try:
                server, _thread = start_bound_server(host, port)
            except OSError:
                continue

            with lock:
                if host not in servers:
                    servers[host] = server
                else:
                    server.shutdown()
                    server.server_close()


def session_repo_telemetry(workspace_folder: str | None) -> dict:
    if not workspace_folder:
        return {
            "repoState": "missing",
            "branch": None,
            "dirty": False,
            "modifiedCount": 0,
            "untrackedCount": 0,
            "lastCommit": None,
        }

    folder = Path(workspace_folder)
    if not folder.exists():
        return {
            "repoState": "missing",
            "branch": None,
            "dirty": False,
            "modifiedCount": 0,
            "untrackedCount": 0,
            "lastCommit": None,
        }

    cache_key = str(folder.resolve())
    cached = REPO_TELEMETRY_CACHE.get(cache_key)
    now = time.monotonic()
    if cached and now - cached[0] < REPO_TELEMETRY_CACHE_TTL_SECONDS:
        return dict(cached[1])

    status_porcelain = run_git(["status", "--porcelain=2", "--branch"], folder)
    status_lines = [line for line in status_porcelain.splitlines() if line.strip()]
    branch = None
    modified_count = 0
    untracked_count = 0
    dirty = False

    for line in status_lines:
        if line.startswith("# branch.head "):
            branch_name = line.removeprefix("# branch.head ").strip()
            branch = None if branch_name == "(detached)" else branch_name
            continue
        if line.startswith("? "):
            untracked_count += 1
            dirty = True
            continue
        if line.startswith(("1 ", "2 ", "u ")):
            modified_count += 1
            dirty = True

    if not status_porcelain:
        telemetry = {
            "repoState": "unavailable",
            "branch": None,
            "dirty": False,
            "modifiedCount": 0,
            "untrackedCount": 0,
            "lastCommit": None,
        }
        REPO_TELEMETRY_CACHE[cache_key] = (now, telemetry)
        return dict(telemetry)

    commit_output = run_git(["log", "-1", "--pretty=format:%h%x1f%s%x1f%cI"], folder)
    last_commit = None
    if commit_output:
        parts = commit_output.split("\x1f")
        if len(parts) == 3:
            last_commit = {
                "sha": parts[0],
                "subject": parts[1],
                "committedAt": parts[2],
            }

    repo_state = "dirty" if dirty else "clean"
    telemetry = {
        "repoState": repo_state,
        "branch": branch,
        "dirty": dirty,
        "modifiedCount": modified_count,
        "untrackedCount": untracked_count,
        "lastCommit": last_commit,
    }
    REPO_TELEMETRY_CACHE[cache_key] = (now, telemetry)
    return dict(telemetry)


def stale_payload(updated_at: str | None) -> tuple[bool, str, float | None]:
    if not isinstance(updated_at, str):
        return True, "No timestamp recorded.", None
    try:
        updated_dt = datetime.fromisoformat(updated_at)
    except ValueError:
        return True, "Timestamp could not be parsed.", None

    age_hours = max((datetime.now().astimezone() - updated_dt.astimezone()).total_seconds() / 3600, 0)
    stale = age_hours > SESSION_UPDATE_STALE_HOURS
    reason = f"Last check-in is {age_hours:.1f}h old." if stale else "Session check-in is fresh."
    return stale, reason, age_hours


def session_update_payload(session_id: str) -> dict:
    json_path = SESSION_UPDATES_DIR / f"{session_id}.json"
    default_note_path = SESSION_UPDATES_DIR / f"{session_id}.md"

    payload = {
        "present": False,
        "status": "missing",
        "updatedAt": None,
        "owner": None,
        "currentFocus": None,
        "summary": "No direct session check-in has been recorded yet.",
        "recentDone": [],
        "nextSteps": [],
        "blockers": [],
        "managerQuestions": [],
        "links": [],
        "noteDoc": enrich_doc_link({"title": "Latest session note", "path": disk_path_to_web_path(default_note_path)})
        if default_note_path.exists()
        else None,
        "jsonPath": disk_path_to_web_path(json_path),
        "stale": True,
        "staleReason": "No session update file yet.",
        "needsAttention": False,
        "ageHours": None,
    }

    if not json_path.exists():
        return payload

    try:
        raw = json.loads(json_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        payload["status"] = "invalid"
        payload["summary"] = "The session update file exists but could not be parsed."
        payload["needsAttention"] = True
        payload["staleReason"] = "Fix the session update JSON."
        return payload

    if not isinstance(raw, dict):
        payload["status"] = "invalid"
        payload["summary"] = "The session update file must contain a JSON object."
        payload["needsAttention"] = True
        payload["staleReason"] = "Fix the session update JSON."
        return payload

    payload["present"] = True
    payload["status"] = raw.get("status") or "working"
    payload["updatedAt"] = raw.get("updatedAt")
    payload["owner"] = raw.get("owner")
    payload["currentFocus"] = raw.get("currentFocus")
    payload["summary"] = raw.get("summary") or payload["summary"]
    payload["recentDone"] = [str(item) for item in raw.get("recentDone", []) if str(item).strip()]
    payload["nextSteps"] = [str(item) for item in raw.get("nextSteps", []) if str(item).strip()]
    payload["blockers"] = [str(item) for item in raw.get("blockers", []) if str(item).strip()]
    payload["managerQuestions"] = [str(item) for item in raw.get("managerQuestions", []) if str(item).strip()]
    payload["links"] = [item for item in raw.get("links", []) if isinstance(item, dict)]

    stale, stale_reason, age_hours = stale_payload(payload["updatedAt"])
    payload["stale"] = stale
    payload["staleReason"] = stale_reason
    payload["ageHours"] = age_hours
    payload["needsAttention"] = payload["status"] in {"blocked", "needs-manager", "invalid"} or (
        stale and payload["status"] not in {"done", "idle"}
    )
    return payload


def merge_session_update_from_postgres(local_update: dict, db_update: dict | None) -> dict:
    if not db_update:
        return local_update

    merged = dict(local_update)
    merged.update(
        {
            "present": True,
            "status": db_update.get("status") or local_update.get("status"),
            "updatedAt": db_update.get("updatedAt") or local_update.get("updatedAt"),
            "owner": db_update.get("owner") or local_update.get("owner"),
            "currentFocus": db_update.get("currentFocus") or local_update.get("currentFocus"),
            "summary": db_update.get("summary") or local_update.get("summary"),
            "recentDone": db_update.get("recentDone") or local_update.get("recentDone"),
            "nextSteps": db_update.get("nextSteps") or local_update.get("nextSteps"),
            "blockers": db_update.get("blockers") or local_update.get("blockers"),
            "managerQuestions": db_update.get("managerQuestions") or local_update.get("managerQuestions"),
            "links": db_update.get("links") or local_update.get("links"),
            "stale": bool(db_update.get("stale")),
            "staleReason": db_update.get("staleReason") or local_update.get("staleReason"),
            "needsAttention": bool(db_update.get("needsAttention")),
            "ageHours": db_update.get("ageHours"),
        }
    )
    return merged


def session_index() -> dict:
    data = load_json(SESSION_INDEX_PATH)
    if not isinstance(data, dict):
        return {"ownerTitle": "Manager session", "sessions": []}

    result = dict(data)

    if result.get("managerUpdateGuide"):
        result["managerUpdateGuide"] = enrich_doc_link(result["managerUpdateGuide"])
    if result.get("managerUpdateTemplate"):
        result["managerUpdateTemplate"] = enrich_doc_link(result["managerUpdateTemplate"])
    if result.get("intakeDoc"):
        result["intakeDoc"] = enrich_doc_link(result["intakeDoc"])
    if result.get("managerHandoff"):
        result["managerHandoff"] = enrich_doc_link(result["managerHandoff"])

    db_status = postgres_database_status()
    postgres_updates: dict[str, dict] = {}
    if db_status.get("ready"):
        try:
            postgres_updates = load_postgres_session_updates(
                [str(session.get("id")) for session in result.get("sessions", []) if session.get("id")]
            )
        except Exception as exc:  # pragma: no cover - depends on local db
            db_status["ready"] = False
            db_status["status"] = "fallback"
            db_status["detail"] = f"PostgreSQL read failed, using file updates instead: {exc}"

    update_counts = {
        "ready-for-review": 0,
        "blocked": 0,
        "needs-manager": 0,
        "done": 0,
        "idle": 0,
        "missing": 0,
        "invalid": 0,
        "working": 0,
    }

    manager_attention = 0
    stale_count = 0
    sessions = []
    for session_payload in result.get("sessions", []):
        session_payload = dict(session_payload)
        telemetry = session_repo_telemetry(session_payload.get("workspaceFolder"))
        update = session_update_payload(session_payload.get("id", "unknown"))
        update = merge_session_update_from_postgres(update, postgres_updates.get(session_payload.get("id", "")))
        session_payload["telemetry"] = telemetry
        session_payload["update"] = update
        status = update.get("status", "missing")
        update_counts[status] = update_counts.get(status, 0) + 1
        if update.get("needsAttention"):
            manager_attention += 1
        if update.get("stale"):
            stale_count += 1
        sessions.append(session_payload)

    result["sessions"] = sessions
    result["updateSummary"] = {
        "counts": update_counts,
        "managerAttentionCount": manager_attention,
        "staleCount": stale_count,
    }
    result["storage"] = {
        "mode": "postgres-hybrid" if db_status.get("configured") else "file",
        "activeSource": "postgres" if db_status.get("ready") else "file",
        "database": db_status,
        "updateDirectory": disk_path_to_web_path(SESSION_UPDATES_DIR),
        "detail": (
            "Private hub reads PostgreSQL first and falls back to local session update files."
            if db_status.get("ready")
            else "Private hub currently reads local session update files directly."
        ),
    }

    return result


def knowledge_index() -> list[dict]:
    if not KNOWLEDGE_INDEX_PATH.exists():
        return []
    data = load_json(KNOWLEDGE_INDEX_PATH)
    if not isinstance(data, list):
        return []
    result = []
    for section in data:
        if not isinstance(section, dict):
            continue
        section_payload = dict(section)
        items = []
        for item in section_payload.get("items", []):
            if isinstance(item, dict):
                items.append(enrich_doc_link(item))
        section_payload["items"] = items
        result.append(section_payload)
    return result


def repo_inventory() -> dict:
    if not REPO_INVENTORY_PATH.exists():
        return {"generatedAt": None, "rootPath": None, "counts": {}, "repos": []}
    data = load_json(REPO_INVENTORY_PATH)
    if not isinstance(data, dict):
        return {"generatedAt": None, "rootPath": None, "counts": {}, "repos": []}
    zones = data.get("zones", {})
    repos = []
    for zone_key, zone_label in (
        ("rootClones", "Root clone"),
        ("ownedRootRepos", "Owned root repo"),
    ):
        for repo in zones.get(zone_key, []) or []:
            if isinstance(repo, dict):
                payload = dict(repo)
                payload["zoneLabel"] = zone_label
                repos.append(payload)
    return {
        "generatedAt": data.get("generatedAt"),
        "rootPath": data.get("rootPath"),
        "counts": data.get("counts", {}),
        "repos": repos,
    }


def research_index() -> dict:
    if not RESEARCH_PATH.exists():
        return {"generatedAt": None, "items": [], "summary": {}, "sources": []}
    data = load_json(RESEARCH_PATH)
    return data if isinstance(data, dict) else {"generatedAt": None, "items": [], "summary": {}, "sources": []}


def extraction_backlog() -> dict:
    if not BACKLOG_PATH.exists():
        return {"generatedAt": None, "items": []}
    data = load_json(BACKLOG_PATH)
    return data if isinstance(data, dict) else {"generatedAt": None, "items": []}


def update_schedule() -> dict:
    if not UPDATE_SCHEDULE_PATH.exists():
        return {"generatedAt": None, "items": [], "notes": []}
    data = load_json(UPDATE_SCHEDULE_PATH)
    return data if isinstance(data, dict) else {"generatedAt": None, "items": [], "notes": []}


class HubHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HUB_DIR), **kwargs)

    def translate_path(self, path: str) -> str:
        parsed_path = urlparse(path).path
        disk_path = web_path_to_disk(parsed_path)
        if disk_path:
            return str(disk_path)
        return str(HUB_DIR / "__not_found__")

    def list_directory(self, path: str):  # noqa: ANN001
        self.send_error(HTTPStatus.NOT_FOUND, "Directory listing is disabled.")
        return None

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path in {"/", "/hub", "/internal", "/repos-hub/local-hub", "/repos-hub/local-hub/"}:
            self.send_response(HTTPStatus.FOUND)
            self.send_header("Location", "/internal/")
            self.end_headers()
            return

        if parsed.path in {"/api/repos", "/api/internal/repos"}:
            self._write_json(repo_inventory())
            return

        if parsed.path in {"/api/research", "/api/internal/research"}:
            self._write_json(research_index())
            return

        if parsed.path in {"/api/backlog", "/api/internal/backlog"}:
            self._write_json(extraction_backlog())
            return

        if parsed.path in {"/api/updates", "/api/internal/updates"}:
            self._write_json(update_schedule())
            return

        if parsed.path in {"/api/knowledge", "/api/internal/knowledge"}:
            self._write_json(knowledge_index())
            return

        if parsed.path in {"/api/sessions", "/api/internal/sessions"}:
            self._write_json(session_index())
            return

        if parsed.path in {"/api/meta", "/api/internal/meta"}:
            self._write_json(
                {
                    "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
                    "canonicalRepoPath": str(CANONICAL_REPO_DIR),
                    "internalRuntimePath": str(HUB_DIR),
                    "legacyPath": str(WORKSPACE_DIR / "_local" / "surfaces" / "repos-hub" / "local-hub"),
                    "publicPreviewPath": str(PUBLIC_PREVIEW_DIR),
                }
            )
            return

        super().do_GET()

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Permissions-Policy", "accelerometer=(), autoplay=(), camera=(), geolocation=(), microphone=(), usb=()")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'",
        )
        super().end_headers()

    def _write_json(self, payload: dict | list, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    port = int(os.environ.get("REPOS_HUB_PORT", "4789"))
    hosts = resolved_hosts()
    servers: dict[str, ThreadingHTTPServer] = {}
    lock = threading.Lock()

    for host in hosts:
        server, _thread = start_bound_server(host, port)
        servers[host] = server

    if not servers:
        raise RuntimeError("No valid hosts to bind the repo hub.")

    stop_event = threading.Event()
    watcher = threading.Thread(
        target=host_refresh_loop,
        args=(port, servers, lock, stop_event),
        daemon=True,
    )
    watcher.start()

    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        stop_event.set()
        with lock:
            active_servers = list(servers.values())
        for server in active_servers:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
