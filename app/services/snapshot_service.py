"""
Servico de snapshots diarios para trend do dashboard.
Armazena counters em ficheiro JSON separado (data/snapshots/<pid>.json).
"""

import os
from datetime import datetime, timedelta
from ..utils.storage import load_json, save_json


def _snap_dir(data_dir):
    d = os.path.join(data_dir, "snapshots")
    os.makedirs(d, exist_ok=True)
    return d


def _snap_path(data_dir, pid):
    return os.path.join(_snap_dir(data_dir), f"{pid}.json")


def take_snapshot(project: dict, pid: str, data_dir: str) -> dict:
    elements = project.get("elements", [])
    connections = project.get("connections", [])
    incidents = project.get("incidents", [])
    cto_ports = project.get("cto_ports", {})
    today = datetime.now().strftime("%Y-%m-%d")
    clientes = len([e for e in elements if e.get("tipo") == "cliente"])
    ctos = len([e for e in elements if e.get("tipo") == "cto"])
    onus = len([e for e in elements if e.get("tipo") == "onu"])
    incidents_open = len([i for i in incidents if i.get("status") != "closed"])
    broken = len([c for c in connections if c.get("broken")])
    draft_els = len([e for e in elements if e.get("draft")])
    draft_cabs = len([c for c in connections if c.get("draft")])
    total_m = sum(
        c.get("length", 0) for c in connections if isinstance(c.get("length"), (int, float))
    )
    cto_used = 0
    cto_total = 0
    for e in elements:
        if e.get("tipo") != "cto":
            continue
        ports = cto_ports.get(str(e["id"]), [])
        used = len([p for p in ports if p.get("status") not in {"livre", "", None}])
        tot = len(ports) or int(e.get("capacity", 0) or 0)
        cto_used += used
        cto_total += tot
    snap = {
        "date": today,
        "elements": len(elements),
        "connections": len(connections),
        "clientes": clientes,
        "ctos": ctos,
        "onus": onus,
        "incidents_open": incidents_open,
        "broken": broken,
        "draft_elements": draft_els,
        "draft_cables": draft_cabs,
        "total_cable_m": round(total_m, 1),
        "cto_used": cto_used,
        "cto_total": cto_total,
    }
    path = _snap_path(data_dir, pid)
    history = load_json(path) or {"snapshots": []}
    existing = [i for i, s in enumerate(history["snapshots"]) if s.get("date") == today]
    if existing:
        history["snapshots"][existing[0]] = snap
    else:
        history["snapshots"].append(snap)
    cutoff = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    history["snapshots"] = [s for s in history["snapshots"] if s.get("date", "") >= cutoff]
    history["snapshots"].sort(key=lambda s: s.get("date", ""))
    save_json(path, history)
    return snap


def get_snapshots(pid: str, data_dir: str, days: int = 30) -> list[dict]:
    path = _snap_path(data_dir, pid)
    history = load_json(path) or {"snapshots": []}
    cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    return [s for s in history.get("snapshots", []) if s.get("date", "") >= cutoff]
