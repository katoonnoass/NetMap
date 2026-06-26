"""
Servico de CRUD de conexoes (dependency injection pattern).
Recebe o project dict ja carregado — nao faz load/save.
"""

from . import project_service

ALLOWED_CONNECTION_FIELDS = {
    "from", "to", "porta", "fibra", "cor", "broken", "length", "waypoints",
}


def add_connection(project: dict, payload: dict) -> dict:
    valid_ids = {element["id"] for element in project["elements"]}
    filtered = {k: v for k, v in payload.items() if k in ALLOWED_CONNECTION_FIELDS or k == "id"}
    connection = dict(filtered)
    connection["id"] = project_service.next_id(project)
    connection["from"] = int(connection["from"])
    connection["to"] = int(connection["to"])
    if connection["from"] not in valid_ids or connection["to"] not in valid_ids:
        raise ValueError("Elementos da conexao nao existem")

    normalized = project_service._normalize_connection(connection)
    project["connections"].append(normalized)
    return normalized


def update_connection(project: dict, cid: int, payload: dict) -> dict | None:
    connection = next(
        (item for item in project["connections"] if item["id"] == cid), None
    )
    if not connection:
        return None

    for key in ALLOWED_CONNECTION_FIELDS & payload.keys():
        connection[key] = payload[key]
    connection.update(project_service._normalize_connection(connection))
    return connection


def delete_connection(project: dict, cid: int) -> bool:
    before = len(project["connections"])
    project["connections"] = [
        conn for conn in project["connections"] if conn["id"] != cid
    ]
    if len(project["connections"]) == before:
        return False

    return True
