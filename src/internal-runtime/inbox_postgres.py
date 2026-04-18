from __future__ import annotations

import json
import os
import ssl
import uuid
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

try:
    import pg8000.dbapi as pg_dbapi
except ImportError:  # pragma: no cover - optional dependency
    pg_dbapi = None


DB_STATUS_CACHE_TTL_SECONDS = 15.0
DB_STATUS_CACHE: dict[str, tuple[float, dict]] = {}
DB_APPLICATION_NAME = "repo-foundry-local"
INTERNAL_INBOX_SCHEMA = "internal_inbox"
TOOLS_MANAGER_KEY = "repos-manager"
TOOLS_MANAGER_NAME = "Repos Manager"
TOOLS_DOMAIN = "repos"


def configured_database_url() -> str | None:
    for key in ("REPOS_HUB_DATABASE_URL", "TOOL_HUB_DATABASE_URL", "DATABASE_URL"):
        value = os.environ.get(key)
        if value:
            return value.strip()
    return None


def pg_client_available() -> bool:
    return pg_dbapi is not None


def _ssl_context_for_query(parsed) -> ssl.SSLContext | None:
    query = parse_qs(parsed.query)
    sslmode = (query.get("sslmode", [""])[0] or "").lower()
    if sslmode in {"disable", "allow"}:
        return None
    if sslmode in {"require", "prefer", "verify-ca", "verify-full"}:
        return ssl.create_default_context()
    if parsed.hostname and parsed.hostname not in {"localhost", "127.0.0.1"}:
        return ssl.create_default_context()
    return None


def parse_database_url(url: str | None) -> dict:
    if not url:
        return {}

    parsed = urlparse(url)
    database = unquote(parsed.path.lstrip("/")) if parsed.path else None
    return {
        "scheme": parsed.scheme,
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 5432,
        "database": database,
        "user": unquote(parsed.username) if parsed.username else None,
        "password": unquote(parsed.password) if parsed.password else None,
        "ssl_context": _ssl_context_for_query(parsed),
    }


def safe_database_display(url: str | None) -> dict:
    parsed = parse_database_url(url)
    return {
        "host": parsed.get("host"),
        "port": parsed.get("port"),
        "database": parsed.get("database"),
        "driver": "pg8000" if pg_client_available() else "missing",
    }


def connect(url: str | None = None):
    database_url = url or configured_database_url()
    if not database_url:
        raise RuntimeError("No database URL configured.")
    if pg_dbapi is None:
        raise RuntimeError("pg8000 is not installed.")

    parsed = parse_database_url(database_url)
    connection = pg_dbapi.connect(
        user=parsed.get("user"),
        password=parsed.get("password"),
        host=parsed.get("host"),
        port=parsed.get("port", 5432),
        database=parsed.get("database"),
        ssl_context=parsed.get("ssl_context"),
        timeout=5,
        application_name=DB_APPLICATION_NAME,
    )
    connection.autocommit = True
    return connection


def database_status(now_monotonic: float | None = None) -> dict:
    url = configured_database_url()
    display = safe_database_display(url)
    cache_key = url or "__missing__"
    now_value = now_monotonic if now_monotonic is not None else __import__("time").monotonic()
    cached = DB_STATUS_CACHE.get(cache_key)
    if cached and now_value - cached[0] < DB_STATUS_CACHE_TTL_SECONDS:
        return dict(cached[1])

    status = {
        "configured": bool(url),
        "clientInstalled": pg_client_available(),
        "ready": False,
        "mode": "file",
        "status": "not-configured",
        "detail": "No REPOS_HUB_DATABASE_URL, TOOL_HUB_DATABASE_URL, or DATABASE_URL is set.",
        **display,
    }

    if not url:
        DB_STATUS_CACHE[cache_key] = (now_value, status)
        return dict(status)

    if not pg_client_available():
        status["status"] = "client-missing"
        status["detail"] = "pg8000 is not installed in this Python environment."
        DB_STATUS_CACHE[cache_key] = (now_value, status)
        return dict(status)

    try:
        connection = connect(url)
        cursor = connection.cursor()
        cursor.execute("select 1")
        cursor.close()
        connection.close()
    except Exception as exc:  # pragma: no cover - depends on local db
        status["status"] = "unreachable"
        status["detail"] = str(exc)
        DB_STATUS_CACHE[cache_key] = (now_value, status)
        return dict(status)

    status["ready"] = True
    status["mode"] = "postgres-hybrid"
    status["status"] = "ready"
    status["detail"] = "PostgreSQL is configured and reachable."
    DB_STATUS_CACHE[cache_key] = (now_value, status)
    return dict(status)


def _normalise_json_field(value) -> list:
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    if value is None:
        return []
    return [value]


def _row_to_update(row: dict) -> dict:
    links = _normalise_json_field(row.get("links"))
    note_path = row.get("note_path")
    return {
        "present": True,
        "status": row.get("status") or "working",
        "updatedAt": row.get("source_updated_at") or row.get("imported_at"),
        "owner": row.get("owner"),
        "currentFocus": row.get("current_focus"),
        "summary": row.get("summary") or "Imported from PostgreSQL.",
        "recentDone": [str(item) for item in _normalise_json_field(row.get("recent_done")) if str(item).strip()],
        "nextSteps": [str(item) for item in _normalise_json_field(row.get("next_steps")) if str(item).strip()],
        "blockers": [str(item) for item in _normalise_json_field(row.get("blockers")) if str(item).strip()],
        "managerQuestions": [str(item) for item in _normalise_json_field(row.get("manager_questions")) if str(item).strip()],
        "links": [item for item in links if isinstance(item, dict)],
        "notePath": note_path,
        "jsonPath": row.get("source_path"),
        "stale": bool(row.get("is_stale")),
        "staleReason": row.get("stale_reason") or ("Imported from PostgreSQL." if row.get("status") else "No database update yet."),
        "needsAttention": bool(row.get("needs_attention")),
        "ageHours": row.get("age_hours"),
    }


def load_session_updates(session_keys: list[str]) -> dict[str, dict]:
    if not session_keys:
        return {}

    status = database_status()
    if not status.get("ready"):
        return {}

    placeholders = ", ".join(["%s"] * len(session_keys))
    query = f"""
        select
            s.session_key,
            s.note_path,
            u.source_path,
            u.source_updated_at,
            u.imported_at,
            u.status,
            u.current_focus,
            u.summary,
            u.recent_done,
            u.next_steps,
            u.blockers,
            u.manager_questions,
            u.links,
            u.is_stale,
            u.needs_attention
        from {INTERNAL_INBOX_SCHEMA}.sessions s
        left join {INTERNAL_INBOX_SCHEMA}.latest_session_update u
            on u.session_id = s.id
        where s.session_key in ({placeholders})
    """

    results: dict[str, dict] = {}
    connection = connect()
    try:
        cursor = connection.cursor()
        cursor.execute(query, tuple(session_keys))
        columns = [column[0] for column in cursor.description]
        for record in cursor.fetchall():
            row = dict(zip(columns, record))
            results[str(row.get("session_key"))] = _row_to_update(row)
        cursor.close()
    finally:
        connection.close()
    return results


@lru_cache(maxsize=1)
def schema_path() -> Path:
    return Path(__file__).resolve().parents[3] / "_local" / "LOCAL-ONLY" / "inbox-v2" / "postgres-schema.sql"


def apply_schema(sql_text: str | None = None) -> None:
    payload = sql_text if sql_text is not None else schema_path().read_text(encoding="utf-8")
    connection = connect()
    try:
        cursor = connection.cursor()
        cursor.execute(payload)
        cursor.close()
    finally:
        connection.close()


def manager_uuid() -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_URL, f"manager:{TOOLS_MANAGER_KEY}")


def session_uuid(session_key: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_URL, f"session:{TOOLS_DOMAIN}:{session_key}")


def update_uuid(session_key: str, updated_at: str | None) -> uuid.UUID:
    stamp = updated_at or "missing"
    return uuid.uuid5(uuid.NAMESPACE_URL, f"session-update:{TOOLS_DOMAIN}:{session_key}:{stamp}")


def stale_payload(updated_at: str | None, stale_hours: float) -> tuple[bool, str, float | None]:
    if not isinstance(updated_at, str):
        return True, "No timestamp recorded.", None
    try:
        updated_dt = datetime.fromisoformat(updated_at)
    except ValueError:
        return True, "Timestamp could not be parsed.", None

    age_hours = max((datetime.now().astimezone() - updated_dt.astimezone()).total_seconds() / 3600, 0)
    stale = age_hours > stale_hours
    reason = f"Last check-in is {age_hours:.1f}h old." if stale else "Session check-in is fresh."
    return stale, reason, age_hours


def serialise_json(value) -> str:
    return json.dumps(value or [])
