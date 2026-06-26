"""
Servico de projetos com persistencia em JSON.
"""

import copy
import re
from datetime import datetime
from pathlib import Path

from flask import current_app

from ..utils.storage import (
    delete_json,
    json_exists,
    list_json_paths,
    load_json,
    save_json,
)

SEED_PROJECT = {
    "name": "Projeto Demo",
    "description": "Topologia de demonstracao ISP",
    "created_at": "",
    "elements": [
        {
            "id": 1,
            "nome": "BGP Upstream AS1234",
            "tipo": "bgp",
            "status": "ativo",
            "detalhes": "Transito IP - 10Gbps - AS1234",
            "endereco": "PTT Sao Paulo",
            "modelo": "Cisco ASR 9001",
        },
        {
            "id": 2,
            "nome": "Core Router DC Principal",
            "tipo": "core",
            "status": "ativo",
            "detalhes": "IP: 10.0.0.1 - Rack 1U01",
            "endereco": "Datacenter Principal, Rack 1",
            "modelo": "MikroTik CCR2004",
        },
        {
            "id": 3,
            "nome": "DIO Core 01",
            "tipo": "dio",
            "status": "ativo",
            "detalhes": "24 portas - 8 ocupadas",
            "endereco": "Rack 2, Datacenter",
            "modelo": "-",
        },
        {
            "id": 4,
            "nome": "OLT-01 Centro",
            "tipo": "olt",
            "status": "ativo",
            "detalhes": "Porta PON 1/0/1 ate 1/0/16",
            "endereco": "Rua 7 de Setembro, 100",
            "modelo": "Huawei MA5800-X7",
        },
        {
            "id": 5,
            "nome": "OLT-02 Bairro Norte",
            "tipo": "olt",
            "status": "alerta",
            "detalhes": "Temperatura alta",
            "endereco": "Av. Brasil, 450",
            "modelo": "ZTE C320",
        },
    ],
    "connections": [
        {
            "id": 100,
            "from": 1,
            "to": 2,
            "porta": "GE 0/0/0",
            "fibra": "Cabo 10G - Tubete Azul",
            "cor": "Azul",
        },
        {
            "id": 101,
            "from": 2,
            "to": 3,
            "porta": "SFP+ 1",
            "fibra": "Cordao Optico 10G",
            "cor": "Azul",
        },
        {
            "id": 102,
            "from": 3,
            "to": 4,
            "porta": "Porta DIO 01",
            "fibra": "Cabo Tronco 36FO - Verde",
            "cor": "Verde",
        },
        {
            "id": 103,
            "from": 3,
            "to": 5,
            "porta": "Porta DIO 02",
            "fibra": "Cabo Tronco 36FO - Laranja",
            "cor": "Laranja",
        },
    ],
    "dios": [
        {
            "id": "DIO-CORE-01",
            "name": "DIO Core 01",
            "location": "Rack 2, Datacenter Principal",
            "capacity": 24,
            "ports": [
                {
                    "num": i + 1,
                    "status": "ocupada" if i < 8 else "livre",
                    "client": [
                        "BGP Upstream",
                        "OLT-01 Centro",
                        "OLT-02 Norte",
                        "Reserva",
                        "Reserva",
                        "Reserva",
                        "Reserva",
                        "Reserva",
                    ][i]
                    if i < 8
                    else "",
                    "color": [
                        "Azul",
                        "Verde",
                        "Laranja",
                        "Marrom",
                        "Cinza",
                        "Branco",
                        "Vermelho",
                        "Azul",
                    ][i]
                    if i < 8
                    else "N/A",
                }
                for i in range(24)
            ],
        }
    ],
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
    "positions": {},
    "_nextId": 321,
}


def _projects_dir() -> Path:
    return Path(current_app.config["PROJECTS_DIR"])


def _project_file(pid: str) -> Path:
    _validate_pid(pid)
    return _projects_dir() / f"{pid}.json"


_PID_RE = re.compile(r"^[a-z0-9_]{1,64}$")


def _validate_pid(pid: str) -> None:
    if not _PID_RE.fullmatch(pid):
        raise ValueError("ID do projeto invalido")


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
    normalized["status"] = (
        str(normalized.get("status", "ativo")).strip().lower() or "ativo"
    )

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
    normalized["dios"] = [
        dio for dio in normalized.get("dios", []) if isinstance(dio, dict)
    ]
    normalized["incidents"] = [
        incident
        for incident in normalized.get("incidents", [])
        if isinstance(incident, dict) and incident.get("id") not in ("", None)
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
        [
            int(incident["id"])
            for incident in normalized["incidents"]
            if str(incident.get("id", "")).isdigit()
        ],
        default=1,
    )
    normalized["_nextId"] = max(
        int(normalized.get("_nextId", 1)), max_seen_id + 1, incident_max + 1
    )
    return normalized


def load_project(pid: str) -> dict | None:
    path = _project_file(pid)
    if not json_exists(path):
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
    if list_json_paths(projects_dir):
        return

    seed = copy.deepcopy(SEED_PROJECT)
    seed["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    save_project("projeto_demo", seed)


def list_projects() -> list[dict]:
    projects_dir = _projects_dir()
    projects_dir.mkdir(parents=True, exist_ok=True)
    result = []
    for path in list_json_paths(projects_dir):
        data = load_project(path.stem)
        if not data:
            continue
        result.append(
            {
                "id": path.stem,
                "name": data.get("name", path.stem),
                "description": data.get("description", ""),
                "created_at": data.get("created_at", ""),
                "elements": len(data.get("elements", [])),
                "connections": len(data.get("connections", [])),
            }
        )
    return result


def create_project(name: str, description: str = "") -> dict:
    clean_name = (name or "").strip() or "Projetos"
    base = slugify(clean_name)
    pid = base
    counter = 2
    while json_exists(_project_file(pid)):
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
    delete_json(_project_file(pid))


def duplicate_project(pid: str) -> dict | None:
    db = load_project(pid)
    if not db:
        return None

    new_name = f"{db['name']} (copia)"
    base = slugify(new_name)
    new_pid = base
    counter = 2
    while json_exists(_project_file(new_pid)):
        new_pid = f"{base}_{counter}"
        counter += 1

    new_db = copy.deepcopy(db)
    new_db["name"] = new_name
    new_db["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    save_project(new_pid, new_db)
    return {"id": new_pid, "name": new_name}


def sanitize_all_projects() -> list[str]:
    touched = []
    for path in list_json_paths(_projects_dir()):
        data = load_json(path, None)
        if not isinstance(data, dict):
            continue
        normalized = _normalize_project(data)
        if normalized != data:
            save_json(path, normalized)
            touched.append(path.stem)
    return touched
