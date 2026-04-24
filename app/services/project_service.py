"""
Servico de projetos com persistencia em JSON.
"""
import copy
import re
from datetime import datetime
from pathlib import Path

from flask import current_app

from ..utils.storage import load_json, save_json

SEED_PROJECT = {
    "name": "Projeto Demo",
    "description": "Topologia de demonstracao ISP",
    "created_at": "",
    "elements": [
        {"id": 1, "nome": "BGP Upstream AS1234", "tipo": "bgp", "status": "ativo",
         "detalhes": "Transito IP - 10Gbps - AS1234", "endereco": "PTT Sao Paulo", "modelo": "Cisco ASR 9001"},
        {"id": 2, "nome": "Core Router DC Principal", "tipo": "core", "status": "ativo",
         "detalhes": "IP: 10.0.0.1 - Rack 1U01", "endereco": "Datacenter Principal, Rack 1", "modelo": "MikroTik CCR2004"},
        {"id": 3, "nome": "DIO Core 01", "tipo": "dio", "status": "ativo",
         "detalhes": "24 portas - 8 ocupadas", "endereco": "Rack 2, Datacenter", "modelo": "-"},
        {"id": 4, "nome": "OLT-01 Centro", "tipo": "olt", "status": "ativo",
         "detalhes": "Porta PON 1/0/1 ate 1/0/16", "endereco": "Rua 7 de Setembro, 100", "modelo": "Huawei MA5800-X7"},
        {"id": 5, "nome": "OLT-02 Bairro Norte", "tipo": "olt", "status": "alerta",
         "detalhes": "Temperatura alta", "endereco": "Av. Brasil, 450", "modelo": "ZTE C320"},
    ],
    "connections": [
        {"id": 100, "from": 1, "to": 2, "porta": "GE 0/0/0", "fibra": "Cabo 10G - Tubete Azul", "cor": "Azul"},
        {"id": 101, "from": 2, "to": 3, "porta": "SFP+ 1", "fibra": "Cordao Optico 10G", "cor": "Azul"},
        {"id": 102, "from": 3, "to": 4, "porta": "Porta DIO 01", "fibra": "Cabo Tronco 36FO - Verde", "cor": "Verde"},
        {"id": 103, "from": 3, "to": 5, "porta": "Porta DIO 02", "fibra": "Cabo Tronco 36FO - Laranja", "cor": "Laranja"},
    ],
    "dios": [{
        "id": "DIO-CORE-01",
        "name": "DIO Core 01",
        "location": "Rack 2, Datacenter Principal",
        "capacity": 24,
        "ports": [
            {
                "num": i + 1,
                "status": "ocupada" if i < 8 else "livre",
                "client": ["BGP Upstream", "OLT-01 Centro", "OLT-02 Norte", "Reserva",
                           "Reserva", "Reserva", "Reserva", "Reserva"][i] if i < 8 else "",
                "color": ["Azul", "Verde", "Laranja", "Marrom", "Cinza",
                          "Branco", "Vermelho", "Azul"][i] if i < 8 else "N/A",
            }
            for i in range(24)
        ],
    }],
    "incidents": [
        {
            "id": 300,
            "title": "Cabo de distribuicao com atenuacao",
            "status": "open",
            "severity": "high",
            "category": "rede",
            "assigned_to": "Operacao",
            "element_id": 5,
            "notes": "Validar temperatura e possivel troca de patch cord.",
            "created_at": "",
        }
    ],
    "service_orders": [
        {
            "id": 320,
            "title": "Vistoria preventiva no enlace da OLT-02",
            "status": "open",
            "priority": "high",
            "assigned_to": "Tecnico Campo",
            "customer_id": None,
            "element_id": 5,
            "incident_id": 300,
            "scheduled_for": "",
            "notes": "Validar aquecimento, limpeza e conectores.",
            "created_at": "",
        }
    ],
    "positions": {},
    "_nextId": 321,
}


def _projects_dir() -> Path:
    return Path(current_app.config["PROJECTS_DIR"])


def _project_file(pid: str) -> Path:
    return _projects_dir() / f"{pid}.json"


def slugify(name: str) -> str:
    text = re.sub(r"[^\w\s-]", "", (name or "").lower())
    text = re.sub(r"[\s_-]+", "_", text).strip("_")
    return text or "projeto"


def _normalize_element(element: dict) -> dict:
    normalized = dict(element)
    if "id" in normalized and normalized["id"] not in ("", None):
        normalized["id"] = int(normalized["id"])
    normalized["nome"] = str(normalized.get("nome", "")).strip()
    normalized["tipo"] = str(normalized.get("tipo", "")).strip().lower()
    normalized["status"] = str(normalized.get("status", "ativo")).strip().lower() or "ativo"

    if normalized.get("tipo") == "cto":
        try:
            normalized["capacity"] = max(1, int(normalized.get("capacity", 16)))
        except (TypeError, ValueError):
            normalized["capacity"] = 16

    for coord in ("lat", "lng"):
        if coord in normalized and normalized[coord] in ("", None):
            normalized.pop(coord, None)

    return normalized


def _normalize_connection(connection: dict) -> dict:
    normalized = dict(connection)
    normalized["id"] = int(normalized["id"])
    normalized["from"] = int(normalized["from"])
    normalized["to"] = int(normalized["to"])
    normalized["broken"] = bool(normalized.get("broken", False))
    normalized["length"] = normalized.get("length")
    normalized["waypoints"] = normalized.get("waypoints", [])
    return normalized


def _safe_normalize_element(element: dict) -> dict | None:
    try:
        normalized = _normalize_element(element)
    except (TypeError, ValueError, KeyError):
        return None
    return normalized if "id" in normalized else None


def _safe_normalize_connection(connection: dict, valid_ids: set[int]) -> dict | None:
    try:
        normalized = _normalize_connection(connection)
    except (TypeError, ValueError, KeyError):
        return None
    if normalized["from"] not in valid_ids or normalized["to"] not in valid_ids:
        return None
    return normalized


def _normalize_project(db: dict) -> dict:
    normalized = dict(db or {})
    normalized.setdefault("name", "Projeto")
    normalized.setdefault("description", "")
    normalized.setdefault("created_at", "")
    normalized_elements = []
    for element in normalized.get("elements", []):
        if not isinstance(element, dict):
            continue
        parsed = _safe_normalize_element(element)
        if parsed:
            normalized_elements.append(parsed)
    normalized["elements"] = normalized_elements
    valid_ids = {element["id"] for element in normalized["elements"]}
    normalized_connections = []
    for connection in normalized.get("connections", []):
        if not isinstance(connection, dict):
            continue
        parsed = _safe_normalize_connection(connection, valid_ids)
        if parsed:
            normalized_connections.append(parsed)
    normalized["connections"] = normalized_connections
    normalized["dios"] = [dio for dio in normalized.get("dios", []) if isinstance(dio, dict)]
    normalized["incidents"] = [
        incident
        for incident in normalized.get("incidents", [])
        if isinstance(incident, dict) and incident.get("id") not in ("", None)
    ]
    normalized["service_orders"] = [
        order
        for order in normalized.get("service_orders", [])
        if isinstance(order, dict) and order.get("id") not in ("", None)
    ]
    normalized["positions"] = {
        str(key): value
        for key, value in normalized.get("positions", {}).items()
        if str(key).isdigit() and int(key) in valid_ids and isinstance(value, dict)
    }
    normalized["cto_ports"] = {
        str(key): value
        for key, value in normalized.get("cto_ports", {}).items()
        if str(key).isdigit() and int(key) in valid_ids and isinstance(value, list)
    }

    max_seen_id = max(
        [normalized.get("_nextId", 1)]
        + [element["id"] for element in normalized["elements"]]
        + [connection["id"] for connection in normalized["connections"]],
        default=1,
    )
    incident_max = max(
        [int(incident["id"]) for incident in normalized["incidents"] if str(incident.get("id", "")).isdigit()],
        default=1,
    )
    order_max = max(
        [int(order["id"]) for order in normalized["service_orders"] if str(order.get("id", "")).isdigit()],
        default=1,
    )
    normalized["_nextId"] = max(int(normalized.get("_nextId", 1)), max_seen_id + 1, incident_max + 1, order_max + 1)
    return normalized


def load_project(pid: str) -> dict | None:
    path = _project_file(pid)
    if not path.exists():
        return None
    data = load_json(path, None)
    if not isinstance(data, dict):
        return None
    return _normalize_project(data)


def save_project(pid: str, db: dict) -> None:
    save_json(_project_file(pid), _normalize_project(db))


def next_id(db: dict) -> int:
    db["_nextId"] = max(int(db.get("_nextId", 1)), 1)
    next_value = db["_nextId"]
    db["_nextId"] = next_value + 1
    return next_value


def ensure_demo() -> None:
    projects_dir = _projects_dir()
    projects_dir.mkdir(parents=True, exist_ok=True)
    if any(file.suffix == ".json" for file in projects_dir.iterdir()):
        return

    seed = copy.deepcopy(SEED_PROJECT)
    seed["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    save_project("projeto_demo", seed)


def list_projects() -> list[dict]:
    projects_dir = _projects_dir()
    projects_dir.mkdir(parents=True, exist_ok=True)
    result = []
    for path in sorted(projects_dir.glob("*.json")):
        data = load_project(path.stem)
        if not data:
            continue
        result.append({
            "id": path.stem,
            "name": data.get("name", path.stem),
            "description": data.get("description", ""),
            "created_at": data.get("created_at", ""),
            "elements": len(data.get("elements", [])),
            "connections": len(data.get("connections", [])),
        })
    return result


def create_project(name: str, description: str = "") -> dict:
    clean_name = (name or "").strip() or "Novo Projeto"
    base = slugify(clean_name)
    pid = base
    counter = 2
    while _project_file(pid).exists():
        pid = f"{base}_{counter}"
        counter += 1

    db = {
        "name": clean_name,
        "description": (description or "").strip(),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "elements": [],
        "connections": [],
        "dios": [],
        "incidents": [],
        "service_orders": [],
        "positions": {},
        "cto_ports": {},
        "_nextId": 1,
    }
    save_project(pid, db)
    return {"id": pid, "name": clean_name}


def update_project_meta(pid: str, data: dict) -> dict | None:
    db = load_project(pid)
    if not db:
        return None
    if not isinstance(data, dict):
        raise ValueError("Payload invalido")

    name = str(data.get("name", db["name"])).strip()
    if not name:
        raise ValueError("Nome do projeto e obrigatorio")

    db["name"] = name
    db["description"] = str(data.get("description", db.get("description", ""))).strip()
    save_project(pid, db)
    return {"ok": True}


def delete_project(pid: str) -> None:
    path = _project_file(pid)
    if path.exists():
        path.unlink()


def duplicate_project(pid: str) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    new_name = f'{db["name"]} (copia)'
    base = slugify(new_name)
    new_pid = base
    counter = 2
    while _project_file(new_pid).exists():
        new_pid = f"{base}_{counter}"
        counter += 1

    new_db = copy.deepcopy(db)
    new_db["name"] = new_name
    new_db["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    save_project(new_pid, new_db)
    return {"id": new_pid, "name": new_name}


def add_element(pid: str, payload: dict) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    element = _normalize_element(payload)
    element["id"] = next_id(db)
    db["elements"].append(element)
    save_project(pid, db)
    return element


def update_element(pid: str, eid: int, payload: dict) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    element = next((item for item in db["elements"] if item["id"] == eid), None)
    if not element:
        return None

    candidate = dict(element)
    candidate.update(payload)
    candidate["id"] = eid
    normalized = _normalize_element(candidate)
    element.clear()
    element.update(normalized)

    save_project(pid, db)
    return element


def delete_element(pid: str, eid: int) -> bool:
    db = load_project(pid)
    if not db:
        return False

    existing_ids = {element["id"] for element in db["elements"]}
    if eid not in existing_ids:
        return False

    db["elements"] = [element for element in db["elements"] if element["id"] != eid]
    db["connections"] = [conn for conn in db["connections"] if conn["from"] != eid and conn["to"] != eid]
    db.get("positions", {}).pop(str(eid), None)
    db.get("cto_ports", {}).pop(str(eid), None)

    for ports in db.get("cto_ports", {}).values():
        for port in ports:
            if port.get("client_id") == eid:
                port["client_id"] = None
                port["client_nome"] = ""
                port["status"] = "livre"

    save_project(pid, db)
    return True


def save_positions(pid: str, positions: dict) -> bool:
    db = load_project(pid)
    if not db:
        return False

    valid_ids = {element["id"] for element in db["elements"]}
    db["positions"] = {
        str(key): value
        for key, value in (positions or {}).items()
        if str(key).isdigit() and int(key) in valid_ids and isinstance(value, dict)
    }
    save_project(pid, db)
    return True


def add_connection(pid: str, payload: dict) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    valid_ids = {element["id"] for element in db["elements"]}
    connection = dict(payload)
    connection["id"] = next_id(db)
    connection["from"] = int(connection["from"])
    connection["to"] = int(connection["to"])
    if connection["from"] not in valid_ids or connection["to"] not in valid_ids:
        raise ValueError("Elementos da conexao nao existem")

    normalized = _normalize_connection(connection)
    db["connections"].append(normalized)
    save_project(pid, db)
    return normalized


def update_connection(pid: str, cid: int, payload: dict) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    connection = next((item for item in db["connections"] if item["id"] == cid), None)
    if not connection:
        return None

    for field in ("length", "broken", "fibra", "cor", "porta", "obs", "waypoints"):
        if field in payload:
            connection[field] = payload[field]

    connection.update(_normalize_connection(connection))
    save_project(pid, db)
    return connection


def delete_connection(pid: str, cid: int) -> bool:
    db = load_project(pid)
    if not db:
        return False

    before = len(db["connections"])
    db["connections"] = [conn for conn in db["connections"] if conn["id"] != cid]
    if len(db["connections"]) == before:
        return False

    save_project(pid, db)
    return True


def sanitize_all_projects() -> list[str]:
    touched = []
    for path in sorted(_projects_dir().glob("*.json")):
        data = load_json(path, None)
        if not isinstance(data, dict):
            continue
        normalized = _normalize_project(data)
        if normalized != data:
            save_json(path, normalized)
            touched.append(path.stem)
    return touched


def build_project_summary(pid: str) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    elements = db.get("elements", [])
    connections = db.get("connections", [])
    cto_ports = db.get("cto_ports", {})

    status_counts = {"ativo": 0, "offline": 0, "alerta": 0}
    type_counts = {}
    unpositioned = 0
    for element in elements:
        status = element.get("status", "ativo")
        status_counts[status] = status_counts.get(status, 0) + 1
        elem_type = element.get("tipo", "desconhecido")
        type_counts[elem_type] = type_counts.get(elem_type, 0) + 1
        if not (element.get("lat") and element.get("lng")):
            unpositioned += 1

    broken_connections = [conn for conn in connections if conn.get("broken")]
    avg_length = round(
        sum(conn.get("length", 0) for conn in connections if isinstance(conn.get("length"), (int, float)))
        / max(1, len([conn for conn in connections if isinstance(conn.get("length"), (int, float))])),
        2,
    ) if connections else 0

    cto_capacity = []
    for element in elements:
        if element.get("tipo") != "cto":
            continue
        ports = cto_ports.get(str(element["id"]), [])
        used = len([port for port in ports if port.get("status") not in {"livre", "", None}])
        total = len(ports) or int(element.get("capacity", 0) or 0)
        occupancy = round((used / total) * 100, 1) if total else 0
        cto_capacity.append({
            "id": element["id"],
            "nome": element.get("nome", f"CTO {element['id']}"),
            "used": used,
            "total": total,
            "occupancy": occupancy,
        })

    cto_capacity.sort(key=lambda item: item["occupancy"], reverse=True)

    return {
        "project_id": pid,
        "project_name": db.get("name", pid),
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "totals": {
            "elements": len(elements),
            "connections": len(connections),
            "clients": len([element for element in elements if element.get("tipo") == "cliente"]),
            "ctos": len([element for element in elements if element.get("tipo") == "cto"]),
            "dios": len(db.get("dios", [])),
            "open_incidents": len([incident for incident in db.get("incidents", []) if incident.get("status") != "closed"]),
            "open_orders": len([order for order in db.get("service_orders", []) if order.get("status") != "closed"]),
            "broken_connections": len(broken_connections),
            "unpositioned_elements": unpositioned,
        },
        "status_counts": status_counts,
        "type_counts": type_counts,
        "average_connection_length": avg_length,
        "top_cto_occupancy": cto_capacity[:5],
        "alerts": {
            "offline_elements": [element["nome"] for element in elements if element.get("status") == "offline"][:10],
            "broken_connections": [
                {
                    "id": conn["id"],
                    "from": conn.get("from"),
                    "to": conn.get("to"),
                    "fibra": conn.get("fibra", ""),
                }
                for conn in broken_connections[:10]
            ],
            "saturated_ctos": [cto for cto in cto_capacity if cto["occupancy"] >= 80][:10],
        },
    }


def build_cable_inventory(pid: str) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    elements_by_id = {element["id"]: element for element in db.get("elements", [])}
    cables = []
    for connection in db.get("connections", []):
        from_element = elements_by_id.get(connection.get("from"))
        to_element = elements_by_id.get(connection.get("to"))
        route_points = connection.get("waypoints", []) or []
        cables.append({
            "id": connection["id"],
            "status": "rompido" if connection.get("broken") else "integro",
            "from_id": connection.get("from"),
            "from_name": from_element.get("nome", f'#{connection.get("from")}') if from_element else f'#{connection.get("from")}',
            "from_type": from_element.get("tipo", "") if from_element else "",
            "to_id": connection.get("to"),
            "to_name": to_element.get("nome", f'#{connection.get("to")}') if to_element else f'#{connection.get("to")}',
            "to_type": to_element.get("tipo", "") if to_element else "",
            "porta": connection.get("porta", ""),
            "fibra": connection.get("fibra", ""),
            "cor": connection.get("cor", ""),
            "length": connection.get("length"),
            "waypoints": len(route_points),
            "has_route": len(route_points) >= 2,
            "has_geo_endpoints": bool(from_element and to_element and from_element.get("lat") and from_element.get("lng") and to_element.get("lat") and to_element.get("lng")),
            "obs": connection.get("obs", ""),
        })

    cables.sort(key=lambda item: (item["status"] != "rompido", str(item.get("fibra", "")), item["id"]))
    return {
        "project_id": pid,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "totals": {
            "cables": len(cables),
            "broken": len([cable for cable in cables if cable["status"] == "rompido"]),
            "without_length": len([cable for cable in cables if cable.get("length") in ("", None)]),
            "without_route": len([cable for cable in cables if not cable.get("has_route")]),
        },
        "cables": cables,
    }


def build_topology_health(pid: str) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    elements = db.get("elements", [])
    connections = db.get("connections", [])
    cto_ports = db.get("cto_ports", {})
    issues = []
    seen_pairs = {}

    def add_issue(severity: str, code: str, message: str, entity_type: str, entity_id=None, extra: dict | None = None):
        issues.append({
            "severity": severity,
            "code": code,
            "message": message,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "extra": extra or {},
        })

    for element in elements:
        if not (element.get("lat") and element.get("lng")):
            add_issue(
                "medium",
                "element_without_coordinates",
                f'Elemento "{element.get("nome", element["id"])}" sem coordenadas',
                "element",
                element["id"],
                {"tipo": element.get("tipo")},
            )
        if element.get("tipo") == "cliente":
            linked = [
                conn for conn in connections
                if conn.get("from") == element["id"] or conn.get("to") == element["id"]
            ]
            if not linked:
                add_issue(
                    "high",
                    "client_without_link",
                    f'Cliente "{element.get("nome", element["id"])}" sem conexao',
                    "element",
                    element["id"],
                )

    for connection in connections:
        pair = tuple(sorted([connection.get("from"), connection.get("to")]))
        seen_pairs[pair] = seen_pairs.get(pair, 0) + 1
        if connection.get("from") == connection.get("to"):
            add_issue(
                "high",
                "self_loop_connection",
                f'Conexao #{connection["id"]} liga o elemento nele mesmo',
                "connection",
                connection["id"],
            )
        if connection.get("broken"):
            add_issue(
                "high",
                "broken_connection",
                f'Conexao #{connection["id"]} marcada como rompida',
                "connection",
                connection["id"],
                {"fibra": connection.get("fibra", "")},
            )
        if connection.get("length") in ("", None):
            add_issue(
                "medium",
                "connection_without_length",
                f'Conexao #{connection["id"]} sem metragem informada',
                "connection",
                connection["id"],
            )
        if not connection.get("fibra"):
            add_issue(
                "low",
                "connection_without_fiber_label",
                f'Conexao #{connection["id"]} sem identificacao de cabo',
                "connection",
                connection["id"],
            )

    for pair, count in seen_pairs.items():
        if count > 1:
            add_issue(
                "medium",
                "duplicated_connection_pair",
                f"Existem {count} conexoes repetidas entre os elementos {pair[0]} e {pair[1]}",
                "connection_pair",
                f"{pair[0]}-{pair[1]}",
                {"count": count},
            )

    for element in elements:
        if element.get("tipo") != "cto":
            continue
        ports = cto_ports.get(str(element["id"]), [])
        used = len([port for port in ports if port.get("status") not in {"livre", "", None}])
        total = len(ports) or int(element.get("capacity", 0) or 0)
        occupancy = round((used / total) * 100, 1) if total else 0
        if occupancy >= 90:
            add_issue(
                "high",
                "cto_capacity_critical",
                f'CTO "{element.get("nome", element["id"])}" acima de 90% de ocupacao',
                "element",
                element["id"],
                {"occupancy": occupancy},
            )
        elif occupancy >= 80:
            add_issue(
                "medium",
                "cto_capacity_warning",
                f'CTO "{element.get("nome", element["id"])}" acima de 80% de ocupacao',
                "element",
                element["id"],
                {"occupancy": occupancy},
            )

    severity_weights = {"high": 12, "medium": 5, "low": 2}
    score = max(0, 100 - sum(severity_weights.get(issue["severity"], 0) for issue in issues[:50]))
    severity_counts = {
        "high": len([issue for issue in issues if issue["severity"] == "high"]),
        "medium": len([issue for issue in issues if issue["severity"] == "medium"]),
        "low": len([issue for issue in issues if issue["severity"] == "low"]),
    }

    issues.sort(key=lambda item: ({"high": 0, "medium": 1, "low": 2}.get(item["severity"], 3), item["message"]))
    return {
        "project_id": pid,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "score": score,
        "severity_counts": severity_counts,
        "issues": issues[:100],
    }


def build_path_trace(pid: str, start_id: int) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    elements_by_id = {element["id"]: element for element in db.get("elements", [])}
    start = elements_by_id.get(start_id)
    if not start:
        return None

    preferred_targets = {"bgp", "core", "olt"}
    fallback_targets = {"dio", "ceo", "cto", "splitter", "switch", "roteador"}
    adjacency: dict[int, list[tuple[int, dict]]] = {}
    for connection in db.get("connections", []):
        source = connection.get("from")
        target = connection.get("to")
        if source not in elements_by_id or target not in elements_by_id:
            continue
        adjacency.setdefault(source, []).append((target, connection))
        adjacency.setdefault(target, []).append((source, connection))

    if start.get("tipo") in preferred_targets:
        path_nodes = [start]
        path_connections = []
    else:
        visited = {start_id}
        queue = [(start_id, [], [])]
        path_nodes = None
        path_connections = None
        while queue:
            current_id, node_ids, conn_ids = queue.pop(0)
            current = elements_by_id[current_id]
            is_target = current_id != start_id and (
                current.get("tipo") in preferred_targets
                or (start.get("tipo") in {"cliente", "onu"} and current.get("tipo") in fallback_targets)
            )
            if is_target:
                path_nodes = [elements_by_id[node_id] for node_id in node_ids + [current_id]]
                path_connections = conn_ids
                break
            for next_id, connection in adjacency.get(current_id, []):
                if next_id in visited:
                    continue
                visited.add(next_id)
                queue.append((next_id, node_ids + [current_id], conn_ids + [connection]))

        if path_nodes is None:
            path_nodes = [start]
            path_connections = []

    total_length = sum(
        connection.get("length", 0)
        for connection in path_connections
        if isinstance(connection.get("length"), (int, float))
    )
    broken_segments = [connection for connection in path_connections if connection.get("broken")]
    endpoint = path_nodes[-1] if path_nodes else start

    return {
        "project_id": pid,
        "start_id": start_id,
        "start_name": start.get("nome", f"Elemento {start_id}"),
        "target_id": endpoint.get("id"),
        "target_name": endpoint.get("nome", f"Elemento {endpoint.get('id')}"),
        "target_type": endpoint.get("tipo", ""),
        "hop_count": max(0, len(path_nodes) - 1),
        "total_length": round(total_length, 2),
        "broken_segments": len(broken_segments),
        "reachable": len(path_nodes) > 1 or start.get("tipo") in preferred_targets,
        "nodes": [
            {
                "id": node["id"],
                "nome": node.get("nome", f"Elemento {node['id']}"),
                "tipo": node.get("tipo", ""),
                "status": node.get("status", "ativo"),
            }
            for node in path_nodes
        ],
        "connections": [
            {
                "id": connection["id"],
                "fibra": connection.get("fibra", ""),
                "porta": connection.get("porta", ""),
                "length": connection.get("length"),
                "broken": bool(connection.get("broken")),
                "from": connection.get("from"),
                "to": connection.get("to"),
            }
            for connection in path_connections
        ],
    }


def list_incidents(pid: str) -> list[dict] | None:
    db = load_project(pid)
    if not db:
        return None
    incidents = sorted(db.get("incidents", []), key=lambda item: str(item.get("created_at", "")), reverse=True)
    return incidents


def create_incident(pid: str, payload: dict) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    incident = {
        "id": next_id(db),
        "title": str(payload.get("title", "")).strip(),
        "status": str(payload.get("status", "open")).strip() or "open",
        "severity": str(payload.get("severity", "medium")).strip() or "medium",
        "category": str(payload.get("category", "rede")).strip() or "rede",
        "assigned_to": str(payload.get("assigned_to", "")).strip(),
        "element_id": payload.get("element_id"),
        "notes": str(payload.get("notes", "")).strip(),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    if not incident["title"]:
        raise ValueError("Titulo do incidente e obrigatorio")

    db.setdefault("incidents", []).append(incident)
    save_project(pid, db)
    return incident


def update_incident(pid: str, incident_id: int, payload: dict) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    incident = next((item for item in db.get("incidents", []) if int(item.get("id")) == incident_id), None)
    if not incident:
        return None

    for field in ("title", "status", "severity", "category", "assigned_to", "element_id", "notes"):
        if field in payload:
            incident[field] = payload[field]
    incident["title"] = str(incident.get("title", "")).strip()
    if not incident["title"]:
        raise ValueError("Titulo do incidente e obrigatorio")

    save_project(pid, db)
    return incident


def delete_incident(pid: str, incident_id: int) -> bool:
    db = load_project(pid)
    if not db:
        return False

    before = len(db.get("incidents", []))
    db["incidents"] = [item for item in db.get("incidents", []) if int(item.get("id")) != incident_id]
    if len(db["incidents"]) == before:
        return False
    save_project(pid, db)
    return True


def list_service_orders(pid: str) -> list[dict] | None:
    db = load_project(pid)
    if not db:
        return None
    return sorted(db.get("service_orders", []), key=lambda item: str(item.get("created_at", "")), reverse=True)


def create_service_order(pid: str, payload: dict) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    order = {
        "id": next_id(db),
        "title": str(payload.get("title", "")).strip(),
        "status": str(payload.get("status", "open")).strip() or "open",
        "priority": str(payload.get("priority", "medium")).strip() or "medium",
        "assigned_to": str(payload.get("assigned_to", "")).strip(),
        "customer_id": payload.get("customer_id"),
        "element_id": payload.get("element_id"),
        "incident_id": payload.get("incident_id"),
        "scheduled_for": str(payload.get("scheduled_for", "")).strip(),
        "notes": str(payload.get("notes", "")).strip(),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    if not order["title"]:
        raise ValueError("Titulo da ordem de servico e obrigatorio")

    db.setdefault("service_orders", []).append(order)
    save_project(pid, db)
    return order


def update_service_order(pid: str, order_id: int, payload: dict) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    order = next((item for item in db.get("service_orders", []) if int(item.get("id")) == order_id), None)
    if not order:
        return None

    for field in ("title", "status", "priority", "assigned_to", "customer_id", "element_id", "incident_id", "scheduled_for", "notes"):
        if field in payload:
            order[field] = payload[field]
    order["title"] = str(order.get("title", "")).strip()
    if not order["title"]:
        raise ValueError("Titulo da ordem de servico e obrigatorio")

    save_project(pid, db)
    return order


def delete_service_order(pid: str, order_id: int) -> bool:
    db = load_project(pid)
    if not db:
        return False
    before = len(db.get("service_orders", []))
    db["service_orders"] = [item for item in db.get("service_orders", []) if int(item.get("id")) != order_id]
    if len(db["service_orders"]) == before:
        return False
    save_project(pid, db)
    return True


def list_customers(pid: str) -> list[dict] | None:
    db = load_project(pid)
    if not db:
        return None

    customers = []
    for customer in [element for element in db.get("elements", []) if element.get("tipo") == "cliente"]:
        customer_id = customer["id"]
        linked_connections = [
            conn for conn in db.get("connections", [])
            if conn.get("from") == customer_id or conn.get("to") == customer_id
        ]
        related_orders = [
            order for order in db.get("service_orders", [])
            if str(order.get("customer_id")) == str(customer_id)
        ]
        customers.append({
            "id": customer_id,
            "nome": customer.get("nome", f"Cliente {customer_id}"),
            "status": customer.get("status", "ativo"),
            "modelo": customer.get("modelo", ""),
            "endereco": customer.get("endereco", ""),
            "detalhes": customer.get("detalhes", ""),
            "connected": bool(linked_connections),
            "connection_count": len(linked_connections),
            "open_orders": len([order for order in related_orders if order.get("status") != "closed"]),
            "lat": customer.get("lat"),
            "lng": customer.get("lng"),
        })

    return sorted(customers, key=lambda item: item["nome"].lower())
