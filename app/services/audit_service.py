"""
Servico simples de auditoria para eventos do sistema.
"""
from datetime import datetime

from flask import current_app

from ..utils.storage import load_json, save_json


def _audit_file():
    return current_app.config["AUDIT_FILE"]


def load_events() -> list[dict]:
    data = load_json(_audit_file(), [])
    return data if isinstance(data, list) else []


def save_events(events: list[dict]) -> None:
    save_json(_audit_file(), events[-5000:])


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
        "project_id": project_id,
        "action": action,
        "username": username or "system",
        "entity_type": entity_type or "",
        "entity_id": entity_id,
        "message": message or action,
        "extra": extra or {},
    }
    events = load_events()
    events.append(event)
    save_events(events)
    return event


def list_project_events(project_id: str, limit: int = 50) -> list[dict]:
    events = [event for event in load_events() if event.get("project_id") == project_id]
    return list(reversed(events[-max(1, min(limit, 200)):]))
