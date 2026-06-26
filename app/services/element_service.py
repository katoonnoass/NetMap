"""
Servico de CRUD de elementos de rede (dependency injection pattern).
Recebe o project dict ja carregado — nao faz load/save.
"""

from . import project_service

ALLOWED_ELEMENT_FIELDS = {
    "nome", "tipo", "status", "lat", "lng", "endereco", "cep",
    "detalhes", "observacao", "modelo", "capacity",
}


def add_element(project: dict, payload: dict) -> dict:
    filtered = {k: v for k, v in payload.items() if k in ALLOWED_ELEMENT_FIELDS}
    element = project_service._normalize_element(filtered)
    element["id"] = project_service.next_id(project)
    project["elements"].append(element)
    return element


def update_element(project: dict, eid: int, payload: dict) -> dict | None:
    element = next((item for item in project["elements"] if item["id"] == eid), None)
    if not element:
        return None

    candidate = dict(element)
    for key in ALLOWED_ELEMENT_FIELDS & payload.keys():
        candidate[key] = payload[key]
    candidate["id"] = eid
    normalized = project_service._normalize_element(candidate)
    element.clear()
    element.update(normalized)

    return element


def delete_element(project: dict, eid: int) -> bool:
    existing_ids = {element["id"] for element in project["elements"]}
    if eid not in existing_ids:
        return False

    project["elements"] = [
        element for element in project["elements"] if element["id"] != eid
    ]
    project["connections"] = [
        conn
        for conn in project["connections"]
        if conn["from"] != eid and conn["to"] != eid
    ]
    project.get("positions", {}).pop(str(eid), None)
    project.get("cto_ports", {}).pop(str(eid), None)

    for ports in project.get("cto_ports", {}).values():
        for port in ports:
            if port.get("client_id") == eid:
                port["client_id"] = None
                port["client_nome"] = ""
                port["status"] = "livre"

    return True


def save_positions(project: dict, positions: dict) -> bool:
    valid_ids = {element["id"] for element in project["elements"]}
    project["positions"] = {
        str(key): value
        for key, value in (positions or {}).items()
        if str(key).isdigit() and int(key) in valid_ids and isinstance(value, dict)
    }
    return True
