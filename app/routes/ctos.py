"""
Rotas de CTOs e gerenciamento de portas.
"""

from flask import Blueprint, jsonify, request, session

from .. import limiter
from ..services import audit_service, cto_service, project_service
from ..utils.auth import require_login, require_perm

ctos_bp = Blueprint("ctos", __name__)


@ctos_bp.route("/api/projects/<pid>/ctos/<int:cto_id>/ports")
@require_login
def get_cto_ports(pid, cto_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    ports = cto_service.get_or_create_cto_ports(db, cto_id)
    if ports is None:
        return jsonify({"error": "CTO not found"}), 404

    project_service.save_project(pid, db)
    return jsonify(ports)


@ctos_bp.route(
    "/api/projects/<pid>/ctos/<int:cto_id>/ports/<int:port_num>", methods=["PUT"]
)
@limiter.limit("30 per minute")
@require_perm("edit_dio")
def update_cto_port(pid, cto_id, port_num):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    ports = cto_service.get_or_create_cto_ports(db, cto_id)
    if ports is None:
        return jsonify({"error": "CTO not found"}), 404

    port = cto_service.find_cto_port(ports, port_num)
    if not port:
        return jsonify({"error": "Port not found"}), 404

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Payload invalido"}), 400

    cto_service.update_cto_port(port, payload)
    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="cto_port_updated",
        username=session.get("user", "system"),
        entity_type="cto_port",
        entity_id=f"{cto_id}:{port_num}",
        message=f"Porta {port_num} da CTO {cto_id} atualizada",
    )
    return jsonify(port)


@ctos_bp.route(
    "/api/projects/<pid>/ctos/<int:cto_id>/ports/bulk-update", methods=["POST"]
)
@limiter.limit("15 per minute")
@require_perm("edit_dio")
def bulk_update_cto_ports(pid, cto_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    ports = cto_service.get_or_create_cto_ports(db, cto_id)
    if ports is None:
        return jsonify({"error": "CTO not found"}), 404

    payload = request.get_json(silent=True) or {}
    port_nums = payload.get("port_nums", [])
    changes = payload.get("changes", {})
    if not isinstance(port_nums, list) or not port_nums:
        return jsonify({"error": "Lista de portas obrigatoria"}), 400
    if not isinstance(changes, dict) or not changes:
        return jsonify({"error": "Alteracoes obrigatorias"}), 400

    port_nums_int = []
    for n in port_nums:
        try:
            port_nums_int.append(int(n))
        except (TypeError, ValueError):
            pass
    if not port_nums_int:
        return jsonify({"error": "Nenhuma porta valida"}), 400

    updated = cto_service.bulk_update_cto_ports(ports, port_nums_int, changes)
    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="cto_ports_bulk_updated",
        username=session.get("user", "system"),
        entity_type="cto_port",
        entity_id=cto_id,
        message=f"{updated} portas da CTO {cto_id} atualizadas em lote",
        extra={"port_nums": port_nums_int, "changes": list(changes.keys())},
    )
    return jsonify({"updated": updated})


@ctos_bp.route(
    "/api/projects/<pid>/ctos/<int:cto_id>/ports/<int:port_num>/split", methods=["POST"]
)
@limiter.limit("15 per minute")
@require_perm("edit_dio")
def split_port(pid, cto_id, port_num):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Project not found"}), 404

    ports = cto_service.get_or_create_cto_ports(db, cto_id)
    if ports is None:
        return jsonify({"error": "CTO ports not initialized"}), 404

    data = request.get_json(silent=True) or {}
    split_type = data.get("type")
    if split_type not in {"1:2", "1:4"}:
        return jsonify({"error": "Tipo invalido. Use '1:2' ou '1:4'"}), 400

    try:
        ports = cto_service.add_cto_splitter(ports, port_num, split_type)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    db["cto_ports"][str(cto_id)] = ports
    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="cto_splitter_added",
        username=session.get("user", "system"),
        entity_type="cto_splitter",
        entity_id=f"{cto_id}:{port_num}",
        message=f"Splitter {split_type} aplicado na CTO {cto_id} porta {port_num}",
    )
    return jsonify(ports)


@ctos_bp.route(
    "/api/projects/<pid>/ctos/<int:cto_id>/ports/<int:port_num>/split",
    methods=["DELETE"],
)
@limiter.limit("15 per minute")
@require_perm("edit_dio")
def remove_split(pid, cto_id, port_num):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Project not found"}), 404

    ports = cto_service.get_or_create_cto_ports(db, cto_id)
    if ports is None:
        return jsonify({"error": "CTO ports not initialized"}), 404

    try:
        filtered = cto_service.remove_cto_splitter(ports, port_num)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    db["cto_ports"][str(cto_id)] = filtered
    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="cto_splitter_removed",
        username=session.get("user", "system"),
        entity_type="cto_splitter",
        entity_id=f"{cto_id}:{port_num}",
        message=f"Splitter removido da CTO {cto_id} porta {port_num}",
    )
    return jsonify(filtered)
