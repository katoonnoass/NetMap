"""
Servico de sumario do projeto (dashboard).
Recebe o project dict ja carregado — nao faz load/save.
"""

from datetime import datetime


def build_project_summary(project: dict, pid: str) -> dict:
    elements = project.get("elements", [])
    connections = project.get("connections", [])
    cto_ports = project.get("cto_ports", {})

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
    avg_length = (
        round(
            sum(
                conn.get("length", 0)
                for conn in connections
                if isinstance(conn.get("length"), (int, float))
            )
            / max(
                1,
                len(
                    [
                        conn
                        for conn in connections
                        if isinstance(conn.get("length"), (int, float))
                    ]
                ),
            ),
            2,
        )
        if connections
        else 0
    )

    cto_capacity = []
    for element in elements:
        if element.get("tipo") != "cto":
            continue
        ports = cto_ports.get(str(element["id"]), [])
        used = len(
            [port for port in ports if port.get("status") not in {"livre", "", None}]
        )
        total = len(ports) or int(element.get("capacity", 0) or 0)
        occupancy = round((used / total) * 100, 1) if total else 0
        cto_capacity.append(
            {
                "id": element["id"],
                "nome": element.get("nome", f"CTO {element['id']}"),
                "used": used,
                "total": total,
                "occupancy": occupancy,
            }
        )

    cto_capacity.sort(key=lambda item: item["occupancy"], reverse=True)

    all_cto_occupancy = cto_capacity[:]
    total_cto_ports_used = sum(c["used"] for c in all_cto_occupancy)
    total_cto_ports_total = sum(c["total"] for c in all_cto_occupancy)
    global_cto_occupancy = round(
        (total_cto_ports_used / total_cto_ports_total) * 100, 1
    ) if total_cto_ports_total else 0

    return {
        "project_id": pid,
        "project_name": project.get("name", pid),
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "totals": {
            "elements": len(elements),
            "connections": len(connections),
            "clients": len(
                [element for element in elements if element.get("tipo") == "cliente"]
            ),
            "ctos": len(
                [element for element in elements if element.get("tipo") == "cto"]
            ),
            "dios": len(project.get("dios", [])),
            "open_incidents": len(
                [
                    incident
                    for incident in project.get("incidents", [])
                    if incident.get("status") != "closed"
                ]
            ),
            "broken_connections": len(broken_connections),
            "unpositioned_elements": unpositioned,
        },
        "status_counts": status_counts,
        "type_counts": type_counts,
        "average_connection_length": avg_length,
        "top_cto_occupancy": cto_capacity[:5],
        "all_cto_occupancy": all_cto_occupancy,
        "global_cto_occupancy": global_cto_occupancy,
        "total_cto_ports_used": total_cto_ports_used,
        "total_cto_ports_total": total_cto_ports_total,
        "alerts": {
            "offline_elements": [
                element["nome"]
                for element in elements
                if element.get("status") == "offline"
            ][:10],
            "broken_connections": [
                {
                    "id": conn["id"],
                    "from": conn.get("from"),
                    "to": conn.get("to"),
                    "fibra": conn.get("fibra", ""),
                }
                for conn in broken_connections[:10]
            ],
            "saturated_ctos": [cto for cto in cto_capacity if cto["occupancy"] >= 80][
                :10
            ],
        },
    }


def list_customers(project: dict) -> list[dict]:
    customers = []
    for customer in [
        element
        for element in project.get("elements", [])
        if element.get("tipo") == "cliente"
    ]:
        customer_id = customer["id"]
        linked_connections = [
            conn
            for conn in project.get("connections", [])
            if conn.get("from") == customer_id or conn.get("to") == customer_id
        ]
        customers.append(
            {
                "id": customer_id,
                "nome": customer.get("nome", f"Cliente {customer_id}"),
                "status": customer.get("status", "ativo"),
                "modelo": customer.get("modelo", ""),
                "endereco": customer.get("endereco", ""),
                "detalhes": customer.get("detalhes", ""),
                "connected": bool(linked_connections),
                "connection_count": len(linked_connections),
                "lat": customer.get("lat"),
                "lng": customer.get("lng"),
            }
        )

    return sorted(customers, key=lambda item: item["nome"].lower())
