"""
Servico simples de auditoria para eventos do sistema.
"""
from datetime import datetime

from flask import current_app

from ..utils.storage import (
    append_audit_event,
    load_audit_events,
    load_json,
    save_json,
    using_postgres,
)


def _audit_file():
    return current_app.config["AUDIT_FILE"]


def load_events() -> list[dict]:
    if using_postgres():
        return load_audit_events()
    data = load_json(_audit_file(), [])
    return data if isinstance(data, list) else []


def save_events(events: list[dict]) -> None:
    save_json(_audit_file(), events[-5000:])


def _sanitize(value: str) -> str:
    return str(value).replace("\n", " ").replace("\r", " ").replace("\t", " ")[:256]


def log_event(
    project_id: str | None,
    action: str,
    username: str = "system",
    entity_type: str | None = None,
    entity_id=None,
    message: str = "",
    extra: dict | None = None,
) -> dict:
    event = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "project_id": _sanitize(project_id) if project_id else None,
        "action": _sanitize(action),
        "username": _sanitize(username or "system"),
        "entity_type": _sanitize(entity_type or ""),
        "entity_id": str(entity_id)[:128] if entity_id is not None else None,
        "message": _sanitize(message or action),
        "extra": extra or {},
    }
    if using_postgres():
        append_audit_event(event)
    else:
        events = load_events()
        events.append(event)
        save_events(events)
    return event


def list_project_events(project_id: str, limit: int = 50) -> list[dict]:
    events = [event for event in load_events() if event.get("project_id") == project_id]
    return list(reversed(events[-max(1, min(limit, 200)):]))
