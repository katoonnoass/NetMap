"""
Servico de gerenciamento de portas CTO (dependency injection pattern).
Recebe o project dict ja carregado — nao faz load/save.
"""

DEFAULT_CTO_PORTS = 16


ALLOWED_PORT_FIELDS = {"status", "client_id", "client_nome", "color", "fibra", "obs"}


def default_ports(count: int = DEFAULT_CTO_PORTS) -> list[dict]:
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


def get_or_create_cto_ports(project: dict, cto_id: int) -> list[dict] | None:
    """Retorna as portas da CTO; cria-as se ainda nao existirem. Retorna None se a CTO nao for encontrada."""
    cto_ports = project.setdefault("cto_ports", {})
    ports = cto_ports.get(str(cto_id))
    if ports:
        return ports

    cto_element = next(
        (
            element
            for element in project.get("elements", [])
            if element["id"] == cto_id and element.get("tipo") == "cto"
        ),
        None,
    )
    if not cto_element:
        return None

    capacity = cto_element.get("capacity", DEFAULT_CTO_PORTS)
    ports = default_ports(capacity)
    cto_ports[str(cto_id)] = ports
    project["cto_ports"] = cto_ports
    return ports


def find_cto_port(ports: list[dict], port_num: int) -> dict | None:
    return next((item for item in ports if item["num"] == port_num), None)


def update_cto_port(port: dict, payload: dict) -> dict:
    for key in ALLOWED_PORT_FIELDS & payload.keys():
        port[key] = payload[key]
    return port


def bulk_update_cto_ports(ports: list[dict], port_nums: list[int], payload: dict) -> int:
    filtered_fields = {k: v for k, v in payload.items() if k in ALLOWED_PORT_FIELDS}
    if not filtered_fields:
        return 0
    count = 0
    for port in ports:
        if port["num"] in port_nums:
            for key, value in filtered_fields.items():
                port[key] = value
            count += 1
    return count


def add_cto_splitter(ports: list[dict], port_num: int, split_type: str) -> list[dict]:
    parent_port = find_cto_port(ports, port_num)
    if not parent_port:
        raise ValueError("Port not found")
    if parent_port.get("splitter_type"):
        raise ValueError(
            f"Porta {port_num} ja possui splitter {parent_port['splitter_type']}"
        )

    sub_count = 2 if split_type == "1:2" else 4
    max_num = max(item["num"] for item in ports) if ports else 0
    subports = []
    for index in range(1, sub_count + 1):
        subports.append(
            {
                "num": max_num + index,
                "status": "livre",
                "client_id": None,
                "client_nome": "",
                "obs": f"Subporta {index} do splitter {split_type} da porta {port_num}",
                "splitter_type": None,
                "parent_port": port_num,
                "subport_index": index,
            }
        )

    parent_port["splitter_type"] = split_type
    parent_port["status"] = "splitter"
    parent_port["client_id"] = None
    parent_port["client_nome"] = ""

    ports.extend(subports)
    return ports


def remove_cto_splitter(ports: list[dict], port_num: int) -> list[dict]:
    parent_port = find_cto_port(ports, port_num)
    if not parent_port:
        raise ValueError("Port not found")
    if not parent_port.get("splitter_type"):
        raise ValueError("Porta nao possui splitter")

    filtered = [item for item in ports if item.get("parent_port") != port_num]
    parent_port["splitter_type"] = None
    parent_port["status"] = "livre"
    parent_port["client_id"] = None
    parent_port["client_nome"] = ""
    parent_port["obs"] = ""

    return filtered
