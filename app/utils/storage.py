"""Storage helpers with PostgreSQL JSONB and atomic JSON fallback."""

from __future__ import annotations

import copy
import json
import os
import tempfile
import threading
import time
from contextlib import contextmanager
from pathlib import Path

from flask import current_app, has_app_context

_LOCKS: dict[str, threading.RLock] = {}
_LOCKS_GUARD = threading.Lock()
_PROJECT_NAMESPACE = "projects"
_FILE_NAMESPACE = "files"
_VERSION_FIELD = "__storage_version"


class StorageConflictError(RuntimeError):
    """Raised when an older project copy tries to overwrite newer data."""


def _database_url() -> str:
    if not has_app_context():
        return ""
    return str(current_app.config.get("DATABASE_URL", "") or "").strip()


def using_postgres() -> bool:
    return bool(_database_url())


def _load_driver():
    try:
        import psycopg2
        from psycopg2.extras import Json
    except ImportError as exc:
        raise RuntimeError(
            "DATABASE_URL is configured, but psycopg2 is not installed"
        ) from exc
    return psycopg2, Json


@contextmanager
def _db_connection():
    psycopg2, _ = _load_driver()
    connection = psycopg2.connect(_database_url(), connect_timeout=5)
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_storage() -> None:
    if not using_postgres():
        return
    with _db_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS netmap_documents (
                namespace TEXT NOT NULL,
                doc_key TEXT NOT NULL,
                payload JSONB NOT NULL,
                version BIGINT NOT NULL DEFAULT 1,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (namespace, doc_key)
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS netmap_audit_events (
                id BIGSERIAL PRIMARY KEY,
                project_id TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                payload JSONB NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_netmap_audit_project_id
            ON netmap_audit_events (project_id, id DESC)
            """
        )


def database_status() -> dict:
    if not using_postgres():
        return {"backend": "json", "ok": True}
    try:
        with _db_connection() as connection, connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return {"backend": "postgresql", "ok": True}
    except Exception as exc:
        return {"backend": "postgresql", "ok": False, "error": type(exc).__name__}


def _lock_for(path: Path | str) -> threading.RLock:
    key = str(Path(path).resolve())
    with _LOCKS_GUARD:
        if key not in _LOCKS:
            _LOCKS[key] = threading.RLock()
        return _LOCKS[key]


def _document_identity(path: Path | str) -> tuple[str, str]:
    target = Path(path)
    projects_dir = Path(current_app.config["PROJECTS_DIR"])
    if target.parent.resolve() == projects_dir.resolve() and target.suffix == ".json":
        return _PROJECT_NAMESPACE, target.stem
    return _FILE_NAMESPACE, target.name


def _get_document(namespace: str, key: str):
    with _db_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT payload, version
            FROM netmap_documents
            WHERE namespace = %s AND doc_key = %s
            """,
            (namespace, key),
        )
        return cursor.fetchone()


def _put_document(
    namespace: str,
    key: str,
    payload,
    expected_version: int | None = None,
    overwrite: bool = False,
) -> int:
    _, Json = _load_driver()
    with _db_connection() as connection, connection.cursor() as cursor:
        if expected_version is not None:
            cursor.execute(
                """
                UPDATE netmap_documents
                SET payload = %s, version = version + 1, updated_at = NOW()
                WHERE namespace = %s AND doc_key = %s AND version = %s
                RETURNING version
                """,
                (Json(payload), namespace, key, expected_version),
            )
        elif overwrite or namespace != _PROJECT_NAMESPACE:
            cursor.execute(
                """
                INSERT INTO netmap_documents (namespace, doc_key, payload)
                VALUES (%s, %s, %s)
                ON CONFLICT (namespace, doc_key) DO UPDATE
                SET payload = EXCLUDED.payload,
                    version = netmap_documents.version + 1,
                    updated_at = NOW()
                RETURNING version
                """,
                (namespace, key, Json(payload)),
            )
        else:
            cursor.execute(
                """
                INSERT INTO netmap_documents (namespace, doc_key, payload)
                VALUES (%s, %s, %s)
                ON CONFLICT (namespace, doc_key) DO NOTHING
                RETURNING version
                """,
                (namespace, key, Json(payload)),
            )
        row = cursor.fetchone()
        if row is None:
            raise StorageConflictError(
                "Os dados foram alterados por outra sessao. Recarregue e tente novamente."
            )
        return int(row[0])


def load_json(path: Path | str, default):
    if using_postgres():
        namespace, key = _document_identity(path)
        row = _get_document(namespace, key)
        if row is None:
            return copy.deepcopy(default)
        payload, version = row
        if namespace == _PROJECT_NAMESPACE and isinstance(payload, dict):
            payload = dict(payload)
            payload[_VERSION_FIELD] = int(version)
        return payload

    target = Path(path)
    if not target.exists():
        return copy.deepcopy(default)
    with _lock_for(target):
        with target.open(encoding="utf-8-sig") as handle:
            return json.load(handle)


def save_json(path: Path | str, payload) -> None:
    if using_postgres():
        namespace, key = _document_identity(path)
        clean_payload = copy.deepcopy(payload)
        expected_version = None
        if namespace == _PROJECT_NAMESPACE and isinstance(clean_payload, dict):
            expected_version = clean_payload.pop(_VERSION_FIELD, None)
        _put_document(namespace, key, clean_payload, expected_version=expected_version)
        return

    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    lock = _lock_for(target)
    with lock:
        fd, tmp_name = tempfile.mkstemp(
            dir=str(target.parent),
            prefix=f".{target.stem}_",
            suffix=target.suffix or ".tmp",
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(payload, handle, ensure_ascii=False, indent=2)
                handle.flush()
                os.fsync(handle.fileno())
            last_error = None
            for _ in range(5):
                try:
                    os.replace(tmp_name, target)
                    last_error = None
                    break
                except PermissionError as exc:
                    last_error = exc
                    time.sleep(0.05)
            if last_error:
                raise last_error
        finally:
            if os.path.exists(tmp_name):
                os.remove(tmp_name)


def json_exists(path: Path | str) -> bool:
    if not using_postgres():
        return Path(path).exists()
    namespace, key = _document_identity(path)
    with _db_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM netmap_documents WHERE namespace = %s AND doc_key = %s",
            (namespace, key),
        )
        return cursor.fetchone() is not None


def list_json_paths(directory: Path | str) -> list[Path]:
    directory = Path(directory)
    if not using_postgres():
        return sorted(directory.glob("*.json"))
    with _db_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            "SELECT doc_key FROM netmap_documents WHERE namespace = %s ORDER BY doc_key",
            (_PROJECT_NAMESPACE,),
        )
        return [directory / f"{row[0]}.json" for row in cursor.fetchall()]


def delete_json(path: Path | str) -> None:
    if not using_postgres():
        target = Path(path)
        if target.exists():
            target.unlink()
        return
    namespace, key = _document_identity(path)
    with _db_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            "DELETE FROM netmap_documents WHERE namespace = %s AND doc_key = %s",
            (namespace, key),
        )


def append_audit_event(event: dict) -> None:
    _, Json = _load_driver()
    with _db_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO netmap_audit_events (project_id, payload)
            VALUES (%s, %s)
            """,
            (event.get("project_id"), Json(event)),
        )


def load_audit_events(limit: int = 5000) -> list[dict]:
    with _db_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT payload
            FROM netmap_audit_events
            ORDER BY id DESC
            LIMIT %s
            """,
            (max(1, min(int(limit), 5000)),),
        )
        return [row[0] for row in reversed(cursor.fetchall())]


def _replace_audit_events(events: list[dict]) -> int:
    _, Json = _load_driver()
    clean_events = [event for event in events if isinstance(event, dict)][-5000:]
    with _db_connection() as connection, connection.cursor() as cursor:
        cursor.execute("TRUNCATE TABLE netmap_audit_events RESTART IDENTITY")
        for event in clean_events:
            cursor.execute(
                "INSERT INTO netmap_audit_events (project_id, payload) VALUES (%s, %s)",
                (event.get("project_id"), Json(event)),
            )
    return len(clean_events)


def migrate_json_to_postgres() -> dict:
    if not using_postgres():
        raise RuntimeError("DATABASE_URL is not configured")
    init_storage()
    data_dir = Path(current_app.config["DATA_DIR"])
    projects_dir = Path(current_app.config["PROJECTS_DIR"])
    result = {"projects": 0, "files": 0, "audit_events": 0}

    for path in sorted(projects_dir.glob("*.json")):
        with path.open(encoding="utf-8-sig") as handle:
            payload = json.load(handle)
        _put_document(_PROJECT_NAMESPACE, path.stem, payload, overwrite=True)
        result["projects"] += 1

    for name in ("users.json", "ixc_integration.json", "address_cache.json"):
        path = data_dir / name
        if not path.exists():
            continue
        with path.open(encoding="utf-8-sig") as handle:
            payload = json.load(handle)
        _put_document(_FILE_NAMESPACE, name, payload, overwrite=True)
        result["files"] += 1

    audit_path = Path(current_app.config["AUDIT_FILE"])
    if audit_path.exists():
        with audit_path.open(encoding="utf-8-sig") as handle:
            audit_payload = json.load(handle)
        if isinstance(audit_payload, list):
            result["audit_events"] = _replace_audit_events(audit_payload)
    return result
