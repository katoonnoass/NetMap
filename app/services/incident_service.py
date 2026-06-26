"""
Servico de CRUD de incidentes operacionais (dependency injection pattern).
Recebe o project dict ja carregado — nao faz load/save.
"""

from datetime import datetime

from . import project_service

VALID_STATUSES = {"open", "in_progress", "resolved", "closed"}
VALID_SEVERITIES = {"low", "medium", "high", "critical"}
VALID_CATEGORIES = {"rede", "hardware", "software", "seguranca", "atendimento", "outro"}
ALLOWED_INCIDENT_FIELDS = {
    "title", "status", "severity", "category", "assigned_to", "element_id", "notes",
}


def list_incidents(project: dict) -> list[dict]:
    incidents = sorted(
        project.get("incidents", []),
        key=lambda item: str(item.get("created_at", "")),
        reverse=True,
    )
    return incidents


def create_incident(project: dict, payload: dict) -> dict:
    title = str(payload.get("title", "")).strip()
    if not title:
        raise ValueError("Titulo do incidente e obrigatorio")
    status = str(payload.get("status", "open")).strip().lower() or "open"
    if status not in VALID_STATUSES:
        raise ValueError(f"Status invalido. Valores permitidos: {', '.join(sorted(VALID_STATUSES))}")
    severity = str(payload.get("severity", "medium")).strip().lower() or "medium"
    if severity not in VALID_SEVERITIES:
        raise ValueError(f"Severidade invalida. Valores permitidos: {', '.join(sorted(VALID_SEVERITIES))}")
    category = str(payload.get("category", "rede")).strip().lower() or "rede"
    if category not in VALID_CATEGORIES:
        raise ValueError(f"Categoria invalida. Valores permitidos: {', '.join(sorted(VALID_CATEGORIES))}")
    incident = {
        "id": project_service.next_id(project),
        "title": title,
        "status": status,
        "severity": severity,
        "category": category,
        "assigned_to": str(payload.get("assigned_to", "")).strip(),
        "element_id": payload.get("element_id"),
        "notes": str(payload.get("notes", "")).strip(),
        "comments": [],
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    project.setdefault("incidents", []).append(incident)
    return incident


def update_incident(project: dict, incident_id: int, payload: dict) -> dict | None:
    incident = next(
        (
            item
            for item in project.get("incidents", [])
            if int(item.get("id")) == incident_id
        ),
        None,
    )
    if not incident:
        return None

    for field in ALLOWED_INCIDENT_FIELDS:
        if field in payload:
            incident[field] = payload[field]
    incident["title"] = str(incident.get("title", "")).strip()
    if not incident["title"]:
        raise ValueError("Titulo do incidente e obrigatorio")
    status = str(incident.get("status", "open")).strip().lower() or "open"
    if status not in VALID_STATUSES:
        raise ValueError(f"Status invalido. Valores permitidos: {', '.join(sorted(VALID_STATUSES))}")
    incident["status"] = status
    severity = str(incident.get("severity", "medium")).strip().lower() or "medium"
    if severity not in VALID_SEVERITIES:
        raise ValueError(f"Severidade invalida. Valores permitidos: {', '.join(sorted(VALID_SEVERITIES))}")
    incident["severity"] = severity
    category = str(incident.get("category", "rede")).strip().lower() or "rede"
    if category not in VALID_CATEGORIES:
        raise ValueError(f"Categoria invalida. Valores permitidos: {', '.join(sorted(VALID_CATEGORIES))}")
    incident["category"] = category

    return incident


def delete_incident(project: dict, incident_id: int) -> bool:
    before = len(project.get("incidents", []))
    project["incidents"] = [
        item
        for item in project.get("incidents", [])
        if int(item.get("id")) != incident_id
    ]
    if len(project["incidents"]) == before:
        return False
    return True


def add_comment(project: dict, incident_id: int, author: str, text: str) -> dict | None:
    incident = next(
        (item for item in project.get("incidents", []) if int(item.get("id")) == incident_id),
        None,
    )
    if not incident:
        return None
    comments = incident.setdefault("comments", [])
    comment = {
        "id": len(comments) + 1,
        "author": author,
        "text": text.strip(),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    comments.append(comment)
    return comment
