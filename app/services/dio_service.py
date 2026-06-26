"""
Servico de CRUD de DIOs (dependency injection pattern).
Recebe o project dict ja carregado — nao faz load/save.
"""


ALLOWED_PORT_FIELDS = {"status", "client", "color", "fibra", "obs", "nome"}
ALLOWED_DIO_FIELDS = {"name", "location", "capacity"}


def add_dio(project: dict, payload: dict) -> dict:
    project.setdefault("dios", []).append(payload)
    return payload


def delete_dio(project: dict, dio_id: str) -> bool:
    before = len(project.get("dios", []))
    project["dios"] = [d for d in project.get("dios", []) if d.get("id") != dio_id]
    if len(project["dios"]) == before:
        return False
    return True


def update_dio(project: dict, dio_id: str, payload: dict) -> dict | None:
    dio = next(
        (item for item in project.get("dios", []) if item.get("id") == dio_id), None
    )
    if not dio:
        return None
    for key in ALLOWED_DIO_FIELDS & payload.keys():
        dio[key] = payload[key]
    new_cap = payload.get("capacity")
    if new_cap is not None and isinstance(new_cap, int) and new_cap != len(dio.get("ports", [])):
        current = len(dio["ports"])
        if new_cap > current:
            for i in range(current, new_cap):
                dio["ports"].append({"num": i + 1, "status": "livre", "client": "", "color": "N/A"})
        elif new_cap < current:
            occupied = [p for p in dio["ports"][new_cap:] if p.get("status") == "ocupada"]
            if occupied:
                return None
            dio["ports"] = dio["ports"][:new_cap]
    return dio


def update_dio_port(
    project: dict, dio_id: str, port_num: int, payload: dict
) -> dict | None:
    dio = next(
        (item for item in project.get("dios", []) if item.get("id") == dio_id), None
    )
    if not dio:
        return None

    port = next(
        (item for item in dio.get("ports", []) if item.get("num") == port_num), None
    )
    if not port:
        return None

    for key in ALLOWED_PORT_FIELDS & payload.keys():
        port[key] = payload[key]
    return port
