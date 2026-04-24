"""
Rotas de conexoes entre elementos.
"""
from flask import Blueprint, jsonify, request, session

from ..services import audit_service, project_service
from ..utils.auth import require_login, require_perm

connections_bp = Blueprint("connections", __name__)


@connections_bp.route("/api/projects/<pid>/connections")
@require_login
def get_connections(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify(db.get("connections", []))


@connections_bp.route("/api/projects/<pid>/connections", methods=["POST"])
@require_perm("edit_cables")
def add_connection(pid):
    data = request.get_json(silent=True) or {}
    if "from" not in data or "to" not in data:
        return jsonify({"error": "Origem e destino sao obrigatorios"}), 400

    data.setdefault("length", None)
    data.setdefault("broken", False)
    data.setdefault("waypoints", [])

    try:
        connection = project_service.add_connection(pid, data)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    if not connection:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="connection_created",
        username=session.get("user", "system"),
        entity_type="connection",
        entity_id=connection["id"],
        message=f'Conexao #{connection["id"]} criada',
        extra={"from": connection.get("from"), "to": connection.get("to")},
    )
    return jsonify(connection), 201


@connections_bp.route("/api/projects/<pid>/connections/<int:cid>", methods=["PUT"])
@require_perm("edit_cables")
def update_connection(pid, cid):
    data = request.get_json(silent=True) or {}
    try:
        connection = project_service.update_connection(pid, cid, data)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    if not connection:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="connection_updated",
        username=session.get("user", "system"),
        entity_type="connection",
        entity_id=cid,
        message=f'Conexao #{cid} atualizada',
        extra={"broken": connection.get("broken", False)},
    )
    return jsonify(connection)


@connections_bp.route("/api/projects/<pid>/connections/<int:cid>", methods=["DELETE"])
@require_perm("edit_cables")
def delete_connection(pid, cid):
    deleted = project_service.delete_connection(pid, cid)
    if not deleted:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="connection_deleted",
        username=session.get("user", "system"),
        entity_type="connection",
        entity_id=cid,
        message=f"Conexao #{cid} removida",
    )
    return jsonify({"ok": True})
