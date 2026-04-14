from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

from inbox_postgres import (
    INTERNAL_INBOX_SCHEMA,
    TOOLS_DOMAIN,
    TOOLS_MANAGER_KEY,
    TOOLS_MANAGER_NAME,
    apply_schema,
    configured_database_url,
    connect,
    database_status,
    manager_uuid,
    serialise_json,
    session_uuid,
    stale_payload,
    update_uuid,
)


HUB_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = HUB_DIR.parents[3]
DATA_DIR = HUB_DIR / "data"
SESSION_INDEX_PATH = DATA_DIR / "session-index.json"
SESSION_UPDATES_DIR = WORKSPACE_DIR / "_local" / "LOCAL-ONLY" / "session-updates" / "repos"
SESSION_UPDATE_STALE_HOURS = 18.0


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def session_index() -> dict:
    payload = load_json(SESSION_INDEX_PATH)
    return payload if isinstance(payload, dict) else {"sessions": []}


def session_update_payload(session_id: str) -> dict:
    json_path = SESSION_UPDATES_DIR / f"{session_id}.json"
    note_path = SESSION_UPDATES_DIR / f"{session_id}.md"

    payload = {
        "present": False,
        "sourcePath": str(json_path),
        "notePath": str(note_path) if note_path.exists() else None,
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
        "rawPayload": {},
    }

    if not json_path.exists():
        stale, stale_reason, age_hours = stale_payload(None, SESSION_UPDATE_STALE_HOURS)
        payload["stale"] = stale
        payload["staleReason"] = stale_reason
        payload["ageHours"] = age_hours
        payload["needsAttention"] = False
        return payload

    try:
        raw = load_json(json_path)
    except json.JSONDecodeError:
        payload["status"] = "invalid"
        payload["summary"] = "The session update file exists but could not be parsed."
        payload["stale"] = True
        payload["staleReason"] = "Fix the session update JSON."
        payload["needsAttention"] = True
        return payload

    if not isinstance(raw, dict):
        payload["status"] = "invalid"
        payload["summary"] = "The session update file must contain a JSON object."
        payload["stale"] = True
        payload["staleReason"] = "Fix the session update JSON."
        payload["needsAttention"] = True
        return payload

    payload["present"] = True
    payload["rawPayload"] = raw
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
    payload["notePath"] = raw.get("notePath") or payload["notePath"]

    stale, stale_reason, age_hours = stale_payload(payload["updatedAt"], SESSION_UPDATE_STALE_HOURS)
    payload["stale"] = stale
    payload["staleReason"] = stale_reason
    payload["ageHours"] = age_hours
    payload["needsAttention"] = payload["status"] in {"blocked", "needs-manager", "invalid"} or (
        stale and payload["status"] not in {"done", "idle"}
    )
    return payload


def upsert_manager(cursor) -> None:
    cursor.execute(
        f"""
        insert into {INTERNAL_INBOX_SCHEMA}.managers (id, manager_key, display_name, domain)
        values (%s, %s, %s, %s)
        on conflict (manager_key) do update set
            display_name = excluded.display_name,
            domain = excluded.domain,
            updated_at = now()
        """,
        (str(manager_uuid()), TOOLS_MANAGER_KEY, TOOLS_MANAGER_NAME, TOOLS_DOMAIN),
    )


def upsert_session(cursor, session: dict) -> None:
    cursor.execute(
        f"""
        insert into {INTERNAL_INBOX_SCHEMA}.sessions (
            id, session_key, manager_id, domain, display_name, workspace_folder, repo_url, handoff_path, note_path, is_active
        )
        values (%s, %s, %s, %s, %s, %s, %s, %s, %s, true)
        on conflict (session_key) do update set
            manager_id = excluded.manager_id,
            domain = excluded.domain,
            display_name = excluded.display_name,
            workspace_folder = excluded.workspace_folder,
            repo_url = excluded.repo_url,
            handoff_path = excluded.handoff_path,
            note_path = excluded.note_path,
            is_active = true,
            updated_at = now()
        """,
        (
            str(session_uuid(session["id"])),
            session["id"],
            str(manager_uuid()),
            TOOLS_DOMAIN,
            session["title"],
            session.get("workspaceFolder"),
            session.get("repoUrl"),
            session.get("handoffPath"),
            session.get("notePath"),
        ),
    )


def upsert_update(cursor, session: dict, update: dict) -> None:
    if not update.get("present") and update.get("status") == "missing":
        return

    cursor.execute(
        f"""
        insert into {INTERNAL_INBOX_SCHEMA}.session_updates (
            id, session_id, source_path, source_note_path, source_updated_at, imported_at,
            status, current_focus, summary, recent_done, next_steps, blockers,
            manager_questions, links, is_stale, needs_attention, raw_payload
        )
        values (
            %s, %s, %s, %s, %s, now(),
            %s, %s, %s, cast(%s as jsonb), cast(%s as jsonb), cast(%s as jsonb),
            cast(%s as jsonb), cast(%s as jsonb), %s, %s, cast(%s as jsonb)
        )
        on conflict (id) do update set
            source_path = excluded.source_path,
            source_note_path = excluded.source_note_path,
            source_updated_at = excluded.source_updated_at,
            imported_at = now(),
            status = excluded.status,
            current_focus = excluded.current_focus,
            summary = excluded.summary,
            recent_done = excluded.recent_done,
            next_steps = excluded.next_steps,
            blockers = excluded.blockers,
            manager_questions = excluded.manager_questions,
            links = excluded.links,
            is_stale = excluded.is_stale,
            needs_attention = excluded.needs_attention,
            raw_payload = excluded.raw_payload
        """,
        (
            str(update_uuid(session["id"], update.get("updatedAt"))),
            str(session_uuid(session["id"])),
            update.get("sourcePath"),
            update.get("notePath"),
            update.get("updatedAt"),
            update.get("status"),
            update.get("currentFocus"),
            update.get("summary"),
            serialise_json(update.get("recentDone")),
            serialise_json(update.get("nextSteps")),
            serialise_json(update.get("blockers")),
            serialise_json(update.get("managerQuestions")),
            serialise_json(update.get("links")),
            bool(update.get("stale")),
            bool(update.get("needsAttention")),
            json.dumps(update.get("rawPayload") or {}),
        ),
    )


def sync_updates(apply_schema_first: bool = False, dry_run: bool = False) -> dict:
    status = database_status()
    if not configured_database_url() and not dry_run:
        raise RuntimeError("No TOOL_HUB_DATABASE_URL or DATABASE_URL is configured.")

    payload = session_index()
    sessions = payload.get("sessions", [])
    updates = {session["id"]: session_update_payload(session["id"]) for session in sessions}

    if dry_run:
        return {
            "database": status,
            "sessionCount": len(sessions),
            "presentUpdates": len([item for item in updates.values() if item.get("present")]),
            "missingUpdates": len([item for item in updates.values() if item.get("status") == "missing"]),
            "needsAttention": len([item for item in updates.values() if item.get("needsAttention")]),
        }

    connection = connect()
    try:
        cursor = connection.cursor()
        if apply_schema_first:
            apply_schema()
        upsert_manager(cursor)
        for session in sessions:
            upsert_session(cursor, session)
            upsert_update(cursor, session, updates[session["id"]])
        cursor.close()
    finally:
        connection.close()

    return {
        "database": database_status(),
        "sessionCount": len(sessions),
        "presentUpdates": len([item for item in updates.values() if item.get("present")]),
        "missingUpdates": len([item for item in updates.values() if item.get("status") == "missing"]),
        "needsAttention": len([item for item in updates.values() if item.get("needsAttention")]),
        "syncedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync Tools session update files into the internal Postgres inbox.")
    parser.add_argument("--apply-schema", action="store_true", help="Apply the inbox schema before syncing.")
    parser.add_argument("--dry-run", action="store_true", help="Read the local update files and print a summary without writing to Postgres.")
    args = parser.parse_args()

    try:
        result = sync_updates(apply_schema_first=args.apply_schema, dry_run=args.dry_run)
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 1

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
