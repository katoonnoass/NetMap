"""
Rotas de incidentes operacionais por projeto.
"""

from flask import Blueprint, jsonify, request, session

from .. import limiter
from ..services import audit_service, incident_service, project_service
from ..utils.auth import require_login, require_perm
from ..utils.query import (
    parse_pagination,
    parse_sorting,
    parse_filters,
    parse_search,
    apply_filters,
    apply_search,
    apply_sorting,
    paginate,
)

incidents_bp = Blueprint("incidents", __name__)


@incidents_bp.route("/api/projects/<pid>/incidents")
@require_login
def get_incidents(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    items = incident_service.list_incidents(db)

    # Apply filters, search, sorting
    filters = parse_filters()
    search = parse_search()
    sort, order = parse_sorting(["title", "severity", "status", "created_at"])

    if filters:
        items = apply_filters(items, filters)
    if search:
        items = apply_search(items, search, ["title", "notes"])
    items = apply_sorting(items, sort, order)

    # Paginate
    p = parse_pagination()
    items, meta = paginate(items, p)

    return jsonify({"items": items, **meta})


@incidents_bp.route("/api/projects/<pid>/incidents", methods=["POST"])
@limiter.limit("15 per minute")
@require_perm("edit_elements")
def create_incident(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    try:
        incident = incident_service.create_incident(
            db, request.get_json(silent=True) or {}
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    project_service.save_project(pid, db)
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
@limiter.limit("15 per minute")
@require_perm("edit_elements")
def update_incident(pid, incident_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    try:
        incident = incident_service.update_incident(
            db, incident_id, request.get_json(silent=True) or {}
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    if not incident:
        return jsonify({"error": "Not found"}), 404

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="incident_updated",
        username=session.get("user", "system"),
        entity_type="incident",
        entity_id=incident_id,
        message=f'Incidente "{incident["title"]}" atualizado',
    )
    return jsonify(incident)


@incidents_bp.route(
    "/api/projects/<pid>/incidents/<int:incident_id>", methods=["DELETE"]
)
@limiter.limit("10 per minute")
@require_perm("edit_elements")
def delete_incident(pid, incident_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    deleted = incident_service.delete_incident(db, incident_id)
    if not deleted:
        return jsonify({"error": "Not found"}), 404

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="incident_deleted",
        username=session.get("user", "system"),
        entity_type="incident",
        entity_id=incident_id,
        message=f"Incidente #{incident_id} removido",
    )
    return jsonify({"ok": True})


@incidents_bp.route(
    "/api/projects/<pid>/incidents/<int:incident_id>/comments", methods=["POST"]
)
@limiter.limit("30 per minute")
@require_perm("edit_elements")
def add_incident_comment(pid, incident_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()
    if not text:
        return jsonify({"error": "Comentario vazio"}), 400
    author = session.get("user", "system")
    comment = incident_service.add_comment(db, incident_id, author, text)
    if not comment:
        return jsonify({"error": "Incidente nao encontrado"}), 404
    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="incident_comment",
        username=author,
        entity_type="incident",
        entity_id=incident_id,
        message=f"Comentario adicionado ao incidente #{incident_id}",
    )
    return jsonify(comment), 201
