"""
Rotas de conexoes entre elementos.
"""

from flask import Blueprint, jsonify, request, session

from .. import limiter
from ..services import audit_service, connection_service, project_service
from ..utils.auth import require_login, require_perm
from ..utils.query import (
    parse_pagination,
    parse_sorting,
    parse_search,
    apply_search,
    apply_sorting,
    paginate,
)

connections_bp = Blueprint("connections", __name__)


@connections_bp.route("/api/projects/<pid>/connections")
@require_login
def get_connections(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    items = db.get("connections", [])

    # Handle broken filter manually (not in parse_filters)
    broken = request.args.get("broken", "").strip().lower()
    if broken == "true":
        items = [item for item in items if item.get("broken")]
    elif broken == "false":
        items = [item for item in items if not item.get("broken")]

    # Apply search, sorting
    search = parse_search()
    sort, order = parse_sorting(["id", "fibra", "length"])

    if search:
        items = apply_search(items, search, ["fibra", "obs", "porta"])
    items = apply_sorting(items, sort, order)

    # Paginate
    p = parse_pagination()
    items, meta = paginate(items, p)

    return jsonify({"items": items, **meta})


@connections_bp.route("/api/projects/<pid>/connections", methods=["POST"])
@limiter.limit("30 per minute")
@require_perm("edit_cables")
def add_connection(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(silent=True) or {}
    if "from" not in data or "to" not in data:
        return jsonify({"error": "Origem e destino sao obrigatorios"}), 400

    data.setdefault("length", None)
    data.setdefault("broken", False)
    data.setdefault("waypoints", [])

    try:
        connection = connection_service.add_connection(db, data)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="connection_created",
        username=session.get("user", "system"),
        entity_type="connection",
        entity_id=connection["id"],
        message=f"Conexao #{connection['id']} criada",
        extra={"from": connection.get("from"), "to": connection.get("to")},
    )
    return jsonify(connection), 201


@connections_bp.route("/api/projects/<pid>/connections/<int:cid>", methods=["PUT"])
@limiter.limit("30 per minute")
@require_perm("edit_cables")
def update_connection(pid, cid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(silent=True) or {}
    try:
        connection = connection_service.update_connection(db, cid, data)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    if not connection:
        return jsonify({"error": "Not found"}), 404

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="connection_updated",
        username=session.get("user", "system"),
        entity_type="connection",
        entity_id=cid,
        message=f"Conexao #{cid} atualizada",
        extra={"broken": connection.get("broken", False)},
    )
    return jsonify(connection)


@connections_bp.route("/api/projects/<pid>/connections/<int:cid>", methods=["DELETE"])
@limiter.limit("15 per minute")
@require_perm("edit_cables")
def delete_connection(pid, cid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    deleted = connection_service.delete_connection(db, cid)
    if not deleted:
        return jsonify({"error": "Not found"}), 404

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="connection_deleted",
        username=session.get("user", "system"),
        entity_type="connection",
        entity_id=cid,
        message=f"Conexao #{cid} removida",
    )
    return jsonify({"ok": True})
