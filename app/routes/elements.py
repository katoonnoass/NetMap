"""
Rotas de elementos de rede.
"""
from flask import Blueprint, jsonify, request, session

from ..services import audit_service, project_service
from ..utils.auth import require_login, require_perm

elements_bp = Blueprint("elements", __name__)


@elements_bp.route("/api/projects/<pid>/elements")
@require_login
def get_elements(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify(db.get("elements", []))


@elements_bp.route("/api/projects/<pid>/elements", methods=["POST"])
@require_perm("edit_elements")
def add_element(pid):
    data = request.get_json(silent=True) or {}
    if not data.get("tipo"):
        return jsonify({"error": "Tipo do elemento e obrigatorio"}), 400
    if not data.get("nome"):
        return jsonify({"error": "Nome do elemento e obrigatorio"}), 400

    try:
        element = project_service.add_element(pid, data)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    if not element:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="element_created",
        username=session.get("user", "system"),
        entity_type="element",
        entity_id=element["id"],
        message=f'Elemento "{element.get("nome", element["id"])}" criado',
        extra={"tipo": element.get("tipo")},
    )
    return jsonify(element), 201


@elements_bp.route("/api/projects/<pid>/elements/<int:eid>", methods=["PUT"])
@require_perm("edit_elements")
def update_element(pid, eid):
    data = request.get_json(silent=True) or {}
    try:
        element = project_service.update_element(pid, eid, data)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    if not element:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="element_updated",
        username=session.get("user", "system"),
        entity_type="element",
        entity_id=eid,
        message=f'Elemento "{element.get("nome", eid)}" atualizado',
        extra={"tipo": element.get("tipo")},
    )
    return jsonify(element)


@elements_bp.route("/api/projects/<pid>/elements/<int:eid>", methods=["DELETE"])
@require_perm("edit_elements")
def delete_element(pid, eid):
    existing = project_service.load_project(pid)
    element = next((item for item in existing.get("elements", []) if item["id"] == eid), None) if existing else None
    deleted = project_service.delete_element(pid, eid)
    if not deleted:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="element_deleted",
        username=session.get("user", "system"),
        entity_type="element",
        entity_id=eid,
        message=f'Elemento "{element.get("nome", eid) if element else eid}" removido',
        extra={"tipo": element.get("tipo") if element else ""},
    )
    return jsonify({"ok": True})


@elements_bp.route("/api/projects/<pid>/positions")
@require_login
def get_positions(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({}), 200
    return jsonify(db.get("positions", {}))


@elements_bp.route("/api/projects/<pid>/positions", methods=["POST"])
@require_perm("edit_elements")
def save_positions(pid):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Payload invalido"}), 400

    saved = project_service.save_positions(pid, payload)
    if not saved:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="positions_saved",
        username=session.get("user", "system"),
        entity_type="project",
        entity_id=pid,
        message="Posicoes da topologia atualizadas",
        extra={"count": len(payload)},
    )
    return jsonify({"ok": True})
