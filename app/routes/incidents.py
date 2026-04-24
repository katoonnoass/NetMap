"""
Rotas de incidentes operacionais por projeto.
"""
from flask import Blueprint, jsonify, request, session

from ..services import audit_service, project_service
from ..utils.auth import require_login, require_perm

incidents_bp = Blueprint("incidents", __name__)


@incidents_bp.route("/api/projects/<pid>/incidents")
@require_login
def get_incidents(pid):
    incidents = project_service.list_incidents(pid)
    if incidents is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(incidents)


@incidents_bp.route("/api/projects/<pid>/incidents", methods=["POST"])
@require_perm("edit_elements")
def create_incident(pid):
    try:
        incident = project_service.create_incident(pid, request.get_json(silent=True) or {})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    if not incident:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="incident_created",
        username=session.get("user", "system"),
        entity_type="incident",
        entity_id=incident["id"],
        message=f'Incidente "{incident["title"]}" criado',
    )
    return jsonify(incident), 201


@incidents_bp.route("/api/projects/<pid>/incidents/<int:incident_id>", methods=["PUT"])
@require_perm("edit_elements")
def update_incident(pid, incident_id):
    try:
        incident = project_service.update_incident(pid, incident_id, request.get_json(silent=True) or {})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    if not incident:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="incident_updated",
        username=session.get("user", "system"),
        entity_type="incident",
        entity_id=incident_id,
        message=f'Incidente "{incident["title"]}" atualizado',
    )
    return jsonify(incident)


@incidents_bp.route("/api/projects/<pid>/incidents/<int:incident_id>", methods=["DELETE"])
@require_perm("edit_elements")
def delete_incident(pid, incident_id):
    deleted = project_service.delete_incident(pid, incident_id)
    if not deleted:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="incident_deleted",
        username=session.get("user", "system"),
        entity_type="incident",
        entity_id=incident_id,
        message=f"Incidente #{incident_id} removido",
    )
    return jsonify({"ok": True})
