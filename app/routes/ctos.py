"""
Rotas de CTOs e gerenciamento de portas.
"""
from flask import Blueprint, jsonify, request, session

from ..services import audit_service, project_service
from ..utils.auth import require_login, require_perm

ctos_bp = Blueprint("ctos", __name__)

DEFAULT_CTO_PORTS = 16


def _default_ports(count: int = DEFAULT_CTO_PORTS) -> list[dict]:
    return [
        {
            "num": index + 1,
            "status": "livre",
            "client_id": None,
            "client_nome": "",
            "obs": "",
            "splitter_type": None,
            "parent_port": None,
            "subport_index": None,
        }
        for index in range(count)
    ]


def _load_cto_ports(pid: str, cto_id: int) -> tuple[dict | None, list[dict] | None]:
    db = project_service.load_project(pid)
    if not db:
        return None, None

    cto_ports = db.setdefault("cto_ports", {})
    ports = cto_ports.get(str(cto_id))
    if ports:
        return db, ports

    cto_element = next(
        (element for element in db.get("elements", []) if element["id"] == cto_id and element.get("tipo") == "cto"),
        None,
    )
    if not cto_element:
        return db, None

    capacity = cto_element.get("capacity", DEFAULT_CTO_PORTS)
    ports = _default_ports(capacity)
    cto_ports[str(cto_id)] = ports
    db["cto_ports"] = cto_ports
    project_service.save_project(pid, db)
    return db, ports


@ctos_bp.route("/api/projects/<pid>/ctos/<int:cto_id>/ports")
@require_login
def get_cto_ports(pid, cto_id):
    db, ports = _load_cto_ports(pid, cto_id)
    if db is None:
        return jsonify({"error": "Not found"}), 404
    if ports is None:
        return jsonify({"error": "CTO not found"}), 404
    return jsonify(ports)


@ctos_bp.route("/api/projects/<pid>/ctos/<int:cto_id>/ports/<int:port_num>", methods=["PUT"])
@require_perm("edit_dio")
def update_cto_port(pid, cto_id, port_num):
    db, ports = _load_cto_ports(pid, cto_id)
    if db is None:
        return jsonify({"error": "Not found"}), 404
    if ports is None:
        return jsonify({"error": "CTO not found"}), 404

    port = next((item for item in ports if item["num"] == port_num), None)
    if not port:
        return jsonify({"error": "Port not found"}), 404

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Payload invalido"}), 400

    port.update(payload)
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


@ctos_bp.route("/api/projects/<pid>/ctos/<int:cto_id>/ports/<int:port_num>/split", methods=["POST"])
@require_perm("edit_dio")
def split_port(pid, cto_id, port_num):
    db, ports = _load_cto_ports(pid, cto_id)
    if db is None:
        return jsonify({"error": "Project not found"}), 404
    if ports is None:
        return jsonify({"error": "CTO ports not initialized"}), 404

    parent_port = next((item for item in ports if item["num"] == port_num), None)
    if not parent_port:
        return jsonify({"error": "Port not found"}), 404
    if parent_port.get("splitter_type"):
        return jsonify({"error": f"Porta {port_num} ja possui splitter {parent_port['splitter_type']}"}), 400

    data = request.get_json(silent=True) or {}
    split_type = data.get("type")
    if split_type not in {"1:2", "1:4"}:
        return jsonify({"error": "Tipo invalido. Use '1:2' ou '1:4'"}), 400

    sub_count = 2 if split_type == "1:2" else 4
    max_num = max(item["num"] for item in ports) if ports else 0
    subports = []
    for index in range(1, sub_count + 1):
        subports.append({
            "num": max_num + index,
            "status": "livre",
            "client_id": None,
            "client_nome": "",
            "obs": f"Subporta {index} do splitter {split_type} da porta {port_num}",
            "splitter_type": None,
            "parent_port": port_num,
            "subport_index": index,
        })

    parent_port["splitter_type"] = split_type
    parent_port["status"] = "splitter"
    parent_port["client_id"] = None
    parent_port["client_nome"] = ""

    ports.extend(subports)
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


@ctos_bp.route("/api/projects/<pid>/ctos/<int:cto_id>/ports/<int:port_num>/split", methods=["DELETE"])
@require_perm("edit_dio")
def remove_split(pid, cto_id, port_num):
    db, ports = _load_cto_ports(pid, cto_id)
    if db is None:
        return jsonify({"error": "Project not found"}), 404
    if ports is None:
        return jsonify({"error": "CTO ports not initialized"}), 404

    parent_port = next((item for item in ports if item["num"] == port_num), None)
    if not parent_port:
        return jsonify({"error": "Port not found"}), 404
    if not parent_port.get("splitter_type"):
        return jsonify({"error": "Porta nao possui splitter"}), 400

    filtered = [item for item in ports if item.get("parent_port") != port_num]
    parent_port["splitter_type"] = None
    parent_port["status"] = "livre"
    parent_port["client_id"] = None
    parent_port["client_nome"] = ""
    parent_port["obs"] = ""

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
