"""
Servico de operacoes de rede: inventario de cabos, saude da topologia e path-trace.
Recebe o project dict ja carregado — nao faz load/save.
"""

from datetime import datetime


def build_cable_inventory(project: dict, pid: str) -> dict:
    elements_by_id = {element["id"]: element for element in project.get("elements", [])}
    cables = []
    for connection in project.get("connections", []):
        from_element = elements_by_id.get(connection.get("from"))
        to_element = elements_by_id.get(connection.get("to"))
        route_points = connection.get("waypoints", []) or []
        cables.append(
            {
                "id": connection["id"],
                "status": "rompido" if connection.get("broken") else "integro",
                "from_id": connection.get("from"),
                "from_name": from_element.get("nome", f"#{connection.get('from')}")
                if from_element
                else f"#{connection.get('from')}",
                "from_type": from_element.get("tipo", "") if from_element else "",
                "to_id": connection.get("to"),
                "to_name": to_element.get("nome", f"#{connection.get('to')}")
                if to_element
                else f"#{connection.get('to')}",
                "to_type": to_element.get("tipo", "") if to_element else "",
                "porta": connection.get("porta", ""),
                "fibra": connection.get("fibra", ""),
                "cor": connection.get("cor", ""),
                "length": connection.get("length"),
                "waypoints": len(route_points),
                "has_route": len(route_points) >= 2,
                "has_geo_endpoints": bool(
                    from_element
                    and to_element
                    and from_element.get("lat")
                    and from_element.get("lng")
                    and to_element.get("lat")
                    and to_element.get("lng")
                ),
                "obs": connection.get("obs", ""),
            }
        )

    cables.sort(
        key=lambda item: (
            item["status"] != "rompido",
            str(item.get("fibra", "")),
            item["id"],
        )
    )
    return {
        "project_id": pid,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "totals": {
            "cables": len(cables),
            "broken": len([cable for cable in cables if cable["status"] == "rompido"]),
            "without_length": len(
                [cable for cable in cables if cable.get("length") in ("", None)]
            ),
            "without_route": len(
                [cable for cable in cables if not cable.get("has_route")]
            ),
        },
        "cables": cables,
    }


def build_topology_health(project: dict, pid: str) -> dict:
    elements = project.get("elements", [])
    connections = project.get("connections", [])
    cto_ports = project.get("cto_ports", {})
    issues = []
    seen_pairs = {}

    def add_issue(
        severity: str,
        code: str,
        message: str,
        entity_type: str,
        entity_id=None,
        extra: dict | None = None,
    ):
        issues.append(
            {
                "severity": severity,
                "code": code,
                "message": message,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "extra": extra or {},
            }
        )

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
                conn
                for conn in connections
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
                f"Conexao #{connection['id']} liga o elemento nele mesmo",
                "connection",
                connection["id"],
            )
        if connection.get("broken"):
            add_issue(
                "high",
                "broken_connection",
                f"Conexao #{connection['id']} marcada como rompida",
                "connection",
                connection["id"],
                {"fibra": connection.get("fibra", "")},
            )
        if connection.get("length") in ("", None):
            add_issue(
                "medium",
                "connection_without_length",
                f"Conexao #{connection['id']} sem metragem informada",
                "connection",
                connection["id"],
            )
        if not connection.get("fibra"):
            add_issue(
                "low",
                "connection_without_fiber_label",
                f"Conexao #{connection['id']} sem identificacao de cabo",
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
        used = len(
            [port for port in ports if port.get("status") not in {"livre", "", None}]
        )
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
    score = max(
        0,
        100 - sum(severity_weights.get(issue["severity"], 0) for issue in issues[:50]),
    )
    severity_counts = {
        "high": len([issue for issue in issues if issue["severity"] == "high"]),
        "medium": len([issue for issue in issues if issue["severity"] == "medium"]),
        "low": len([issue for issue in issues if issue["severity"] == "low"]),
    }

    issues.sort(
        key=lambda item: (
            {"high": 0, "medium": 1, "low": 2}.get(item["severity"], 3),
            item["message"],
        )
    )
    return {
        "project_id": pid,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "score": score,
        "severity_counts": severity_counts,
        "issues": issues[:100],
    }


def build_path_trace(project: dict, pid: str, start_id: int) -> dict | None:
    elements_by_id = {element["id"]: element for element in project.get("elements", [])}
    start = elements_by_id.get(start_id)
    if not start:
        return None

    preferred_targets = {"bgp", "core", "olt"}
    fallback_targets = {"dio", "ceo", "cto", "splitter", "switch", "roteador"}
    adjacency: dict[int, list[tuple[int, dict]]] = {}
    for connection in project.get("connections", []):
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
                or (
                    start.get("tipo") in {"cliente", "onu"}
                    and current.get("tipo") in fallback_targets
                )
            )
            if is_target:
                path_nodes = [
                    elements_by_id[node_id] for node_id in node_ids + [current_id]
                ]
                path_connections = conn_ids
                break
            for next_id, connection in adjacency.get(current_id, []):
                if next_id in visited:
                    continue
                visited.add(next_id)
                queue.append(
                    (next_id, node_ids + [current_id], conn_ids + [connection])
                )

        if path_nodes is None:
            path_nodes = [start]
            path_connections = []

    total_length = sum(
        connection.get("length", 0)
        for connection in path_connections
        if isinstance(connection.get("length"), (int, float))
    )
    broken_segments = [
        connection for connection in path_connections if connection.get("broken")
    ]
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
