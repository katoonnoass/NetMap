"""
Servico de calculo de atenuacao optica para caminhos de rede.
Estima nivel de sinal em dBm com base em fusoes, splitters,
conectores e distancia da fibra.
"""

from . import network_service


FIBER_ATTENUATION_DB_KM = 0.35
CONNECTOR_LOSS_DB = 0.5
FUSION_LOSS_DB = 0.1
MECHANICAL_SPLICE_LOSS_DB = 0.5
SPLITTER_LOSS_DB = {"1:2": 3.5, "1:4": 7.0, "1:8": 10.5}
TX_POWER_DBM = 3.0
THRESHOLD_WARNING_DBM = -25.0
THRESHOLD_CRITICAL_DBM = -28.0


def estimate_signal_level(project: dict, pid: str, element_id: int) -> dict:
    trace = network_service.build_path_trace(project, pid, element_id)

    total_loss = 0.0
    loss_items = []

    nodes = trace.get("nodes", [])
    connections = trace.get("connections", [])

    for conn in connections:
        length = conn.get("length")
        if isinstance(length, (int, float)) and length > 0:
            fiber_loss = round((length / 1000.0) * FIBER_ATTENUATION_DB_KM, 3)
            total_loss += fiber_loss
            loss_items.append({
                "type": "fiber",
                "length_m": length,
                "loss_db": fiber_loss,
            })

        connector_loss = CONNECTOR_LOSS_DB * 2
        total_loss += connector_loss
        loss_items.append({
            "type": "connector_pair",
            "loss_db": connector_loss,
        })

    cto_ports = project.get("cto_ports", {})
    elements = project.get("elements", [])
    element_map = {e["id"]: e for e in elements if "id" in e}

    for node in nodes:
        nid = node.get("id")
        elem = element_map.get(nid)
        if not elem:
            continue

        if elem.get("tipo") == "cto":
            ports = cto_ports.get(str(nid), [])
            for port in ports:
                st = port.get("splitter_type")
                if st and st in SPLITTER_LOSS_DB:
                    sp_loss = SPLITTER_LOSS_DB[st]
                    total_loss += sp_loss
                    loss_items.append({
                        "type": "splitter",
                        "splitter_type": st,
                        "port": port.get("num"),
                        "loss_db": sp_loss,
                    })
                    break

    signal_level = round(TX_POWER_DBM - total_loss, 2)

    if signal_level < THRESHOLD_CRITICAL_DBM:
        status = "critical"
        status_label = "Sinal critico"
    elif signal_level < THRESHOLD_WARNING_DBM:
        status = "warning"
        status_label = "Sinal baixo"
    else:
        status = "ok"
        status_label = "Sinal adequado"

    return {
        "project_id": pid,
        "start_id": element_id,
        "tx_power_dbm": TX_POWER_DBM,
        "total_loss_db": round(total_loss, 2),
        "signal_level_dbm": signal_level,
        "status": status,
        "status_label": status_label,
        "loss_items": loss_items,
        "path": trace,
        "threshold_warning_dbm": THRESHOLD_WARNING_DBM,
        "threshold_critical_dbm": THRESHOLD_CRITICAL_DBM,
    }
