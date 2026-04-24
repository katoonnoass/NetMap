"""
Rotas de DIOs.
"""
from flask import Blueprint, jsonify, request, session

from ..services import audit_service, project_service
from ..utils.auth import require_login, require_perm

dios_bp = Blueprint("dios", __name__)


@dios_bp.route("/api/projects/<pid>/dios")
@require_login
def get_dios(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify(db.get("dios", []))


@dios_bp.route("/api/projects/<pid>/dios", methods=["POST"])
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

    db["dios"].append(payload)
    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="dio_created",
        username=session.get("user", "system"),
        entity_type="dio",
        entity_id=payload.get("id"),
        message=f'DIO "{payload.get("name", payload.get("id", ""))}" criado',
    )
    return jsonify(payload), 201


@dios_bp.route("/api/projects/<pid>/dios/<dio_id>/ports/<int:port_num>", methods=["PUT"])
@require_perm("edit_dio")
def update_port(pid, dio_id, port_num):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    dio = next((item for item in db.get("dios", []) if item.get("id") == dio_id), None)
    if not dio:
        return jsonify({"error": "DIO not found"}), 404

    port = next((item for item in dio.get("ports", []) if item.get("num") == port_num), None)
    if not port:
        return jsonify({"error": "Port not found"}), 404

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Payload invalido"}), 400

    port.update(payload)
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
