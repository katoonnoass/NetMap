"""
Rotas de DIOs.
"""

from flask import Blueprint, jsonify, request, session

from .. import limiter
from ..services import audit_service, dio_service, project_service
from ..utils.auth import require_login, require_perm

dios_bp = Blueprint("dios", __name__)


@dios_bp.route("/api/projects/<pid>/dios")
@require_login
def get_dios(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify(db.get("dios", []))


@dios_bp.route("/api/projects/<pid>/dios/<dio_id>", methods=["PUT"])
@limiter.limit("15 per minute")
@require_perm("edit_dio")
def update_dio(pid, dio_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    payload = request.get_json(silent=True) or {}
    result = dio_service.update_dio(db, dio_id, payload)
    if result is None:
        return jsonify({"error": "DIO nao encontrado ou porta ocupada impede reducao"}), 404

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="dio_updated",
        username=session.get("user", "system"),
        entity_type="dio",
        entity_id=dio_id,
        message=f'DIO "{dio_id}" atualizado',
    )
    return jsonify(result)


@dios_bp.route("/api/projects/<pid>/dios", methods=["POST"])
@limiter.limit("15 per minute")
@require_perm("edit_dio")
def add_dio(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Payload invalido"}), 400
    if not payload.get("id") or not isinstance(payload.get("ports", []), list):
        return jsonify({"error": "DIO invalido"}), 400

    dio = dio_service.add_dio(db, payload)
    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="dio_created",
        username=session.get("user", "system"),
        entity_type="dio",
        entity_id=payload.get("id"),
        message=f'DIO "{payload.get("name", payload.get("id", ""))}" criado',
    )
    return jsonify(dio), 201


@dios_bp.route(
    "/api/projects/<pid>/dios/<dio_id>/ports/<int:port_num>", methods=["PUT"]
)
@limiter.limit("30 per minute")
@require_perm("edit_dio")
def update_port(pid, dio_id, port_num):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Payload invalido"}), 400

    port = dio_service.update_dio_port(db, dio_id, port_num, payload)
    if port is None:
        return jsonify({"error": "DIO or Port not found"}), 404

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="dio_port_updated",
        username=session.get("user", "system"),
        entity_type="dio_port",
        entity_id=f"{dio_id}:{port_num}",
        message=f"Porta {port_num} do DIO {dio_id} atualizada",
    )
    return jsonify(port)


@dios_bp.route("/api/projects/<pid>/dios/<dio_id>", methods=["DELETE"])
@limiter.limit("10 per minute")
@require_perm("edit_dio")
def delete_dio(pid, dio_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    deleted = dio_service.delete_dio(db, dio_id)
    if not deleted:
        return jsonify({"error": "DIO nao encontrado"}), 404

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="dio_deleted",
        username=session.get("user", "system"),
        entity_type="dio",
        entity_id=dio_id,
        message=f'DIO "{dio_id}" removido',
    )
    return jsonify({"ok": True}), 200
