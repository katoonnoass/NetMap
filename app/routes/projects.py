"""
Rotas de projetos.
"""

import html as _html
import io

from flask import Blueprint, jsonify, render_template, render_template_string, request, send_file, session

from datetime import datetime

from .. import limiter
from ..services import audit_service, geodata_service, project_service
from ..utils.auth import require_login, require_perm
from ..utils.query import (
    parse_pagination,
    parse_sorting,
    parse_search,
    apply_search,
    apply_sorting,
    paginate,
)

projects_bp = Blueprint("projects", __name__)


@projects_bp.route("/")
@require_login
def index():
    project_service.ensure_demo()
    return render_template("index.html")


@projects_bp.route("/api/projects")
@require_login
def get_projects():
    project_service.ensure_demo()
    items = project_service.list_projects()

    # Apply search, sorting
    search = parse_search()
    sort, order = parse_sorting(["name", "id", "created_at"])

    if search:
        items = apply_search(items, search, ["name", "id"])
    items = apply_sorting(items, sort, order)

    # Paginate
    p = parse_pagination()
    items, meta = paginate(items, p)

    return jsonify({"items": items, **meta})


@projects_bp.route("/api/projects", methods=["POST"])
@limiter.limit("10 per minute")
@require_perm("manage_projects")
def create_project():
    data = request.get_json(silent=True) or {}
    result = project_service.create_project(
        name=str(data.get("name", "Projetos")).strip(),
        description=str(data.get("description", "")).strip(),
    )
    audit_service.log_event(
        result["id"],
        action="project_created",
        username=session.get("user", "system"),
        entity_type="project",
        entity_id=result["id"],
        message=f'Projeto "{result["name"]}" criado',
    )
    return jsonify(result), 201


@projects_bp.route("/api/projects/<pid>", methods=["PUT"])
@limiter.limit("15 per minute")
@require_perm("manage_projects")
def update_project(pid):
    try:
        result = project_service.update_project_meta(
            pid, request.get_json(silent=True) or {}
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    if not result:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="project_updated",
        username=session.get("user", "system"),
        entity_type="project",
        entity_id=pid,
        message="Metadados do projeto atualizados",
    )
    return jsonify(result)


@projects_bp.route("/api/projects/<pid>", methods=["DELETE"])
@limiter.limit("5 per minute")
@require_perm("manage_projects")
def delete_project(pid):
    project_service.delete_project(pid)
    audit_service.log_event(
        pid,
        action="project_deleted",
        username=session.get("user", "system"),
        entity_type="project",
        entity_id=pid,
        message=f'Projeto "{pid}" removido',
    )
    return jsonify({"ok": True})


@projects_bp.route("/api/projects/<pid>/duplicate", methods=["POST"])
@limiter.limit("5 per minute")
@require_perm("manage_projects")
def duplicate_project(pid):
    result = project_service.duplicate_project(pid)
    if not result:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        result["id"],
        action="project_duplicated",
        username=session.get("user", "system"),
        entity_type="project",
        entity_id=result["id"],
        message=f'Projeto duplicado a partir de "{pid}"',
        extra={"source_project": pid},
    )
    return jsonify(result), 201


@projects_bp.route("/api/projects/<pid>/all")
@require_login
def get_all(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify(
        {
            "elements": db.get("elements", []),
            "connections": db.get("connections", []),
            "dios": db.get("dios", []),
            "positions": db.get("positions", {}),
            "cto_ports": db.get("cto_ports", {}),
            "incidents": db.get("incidents", []),
        }
    )


@projects_bp.route("/api/projects/<pid>/export")
@require_login
def export_project(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify(
        {
            "projeto": db.get("name"),
            "criado_em": db.get("created_at"),
            "elementos": db.get("elements", []),
            "conexoes": db.get("connections", []),
            "dios": db.get("dios", []),
            "cto_ports": db.get("cto_ports", {}),
            "incidentes": db.get("incidents", []),
        }
    )


@projects_bp.route("/api/projects/<pid>/export/kml")
@require_login
def export_project_kml(pid):
    exported = geodata_service.export_project_kml(pid)
    if not exported:
        return jsonify({"error": "Not found"}), 404
    project_name, kml = exported
    return send_file(
        io.BytesIO(kml.encode("utf-8")),
        mimetype="application/vnd.google-earth.kml+xml",
        as_attachment=True,
        download_name=f"{project_service.slugify(project_name)}.kml",
    )


@projects_bp.route("/api/projects/<pid>/export/kmz")
@require_login
def export_project_kmz(pid):
    exported = geodata_service.export_project_kmz(pid)
    if not exported:
        return jsonify({"error": "Not found"}), 404
    project_name, kmz_bytes = exported
    return send_file(
        io.BytesIO(kmz_bytes),
        mimetype="application/vnd.google-earth.kmz",
        as_attachment=True,
        download_name=f"{project_service.slugify(project_name)}.kmz",
    )


@projects_bp.route("/api/projects/<pid>/import-geodata", methods=["POST"])
@limiter.limit("5 per minute")
@require_perm("edit_elements")
def import_project_geodata(pid):
    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify({"error": "Selecione um arquivo KML ou KMZ"}), 400
    try:
        result = geodata_service.import_project_geodata(
            pid, upload.filename, upload.read()
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    if result is None:
        return jsonify({"error": "Not found"}), 404

    audit_service.log_event(
        pid,
        action="project_geodata_imported",
        username=session.get("user", "system"),
        entity_type="project",
        entity_id=pid,
        message=f'Importacao geoespacial de "{upload.filename}" concluida',
        extra={
            "file_name": upload.filename,
            "imported_elements": result["imported_elements"],
            "imported_connections": result["imported_connections"],
            "skipped_connections": result["skipped_connections"],
        },
    )
    return jsonify(result), 201


@projects_bp.route("/api/projects/<pid>/import-json", methods=["POST"])
@limiter.limit("5 per minute")
@require_perm("edit_elements")
def import_project_json(pid):
    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify({"error": "Selecione um arquivo JSON"}), 400
    import json as _json

    try:
        raw = upload.read()
        data = _json.loads(raw)
    except (UnicodeDecodeError, _json.JSONDecodeError) as exc:
        return jsonify({"error": f"JSON invalido: {exc}"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON deve ser um objeto com elementos, conexoes etc."}), 400

    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    mode = request.form.get("mode", "merge").strip().lower()
    if mode == "replace":
        db["elements"] = data.get("elementos", data.get("elements", []))
        db["connections"] = data.get("conexoes", data.get("connections", []))
        db["dios"] = data.get("dios", [])
        db["cto_ports"] = data.get("cto_ports", {})
        db["incidents"] = data.get("incidentes", data.get("incidents", []))
    else:
        existing_ids = {e["id"] for e in db.get("elements", [])}
        max_id = db.get("_nextId", 1)
        for el in data.get("elementos", data.get("elements", [])):
            if not isinstance(el, dict):
                continue
            if el.get("id") in existing_ids:
                el["id"] = max_id
            max_id = max(max_id, el.get("id", 0) + 1)
            db["elements"].append(el)
        conn_ids = {c["id"] for c in db.get("connections", [])}
        for conn in data.get("conexoes", data.get("connections", [])):
            if not isinstance(conn, dict):
                continue
            if conn.get("id") in conn_ids:
                conn["id"] = max_id
            max_id = max(max_id, conn.get("id", 0) + 1)
            db["connections"].append(conn)
        for dio in data.get("dios", []):
            if isinstance(dio, dict):
                db.setdefault("dios", []).append(dio)
        for k, v in data.get("cto_ports", {}).items():
            if isinstance(v, list):
                db.setdefault("cto_ports", {})[k] = v
        for inc in data.get("incidentes", data.get("incidents", [])):
            if isinstance(inc, dict):
                db.setdefault("incidents", []).append(inc)
        db["_nextId"] = max_id

    project_service.save_project(pid, db)
    audit_service.log_event(
        pid,
        action="project_json_imported",
        username=session.get("user", "system"),
        entity_type="project",
        entity_id=pid,
        message=f'Importacao JSON de "{upload.filename}" concluida (modo={mode})',
        extra={"file_name": upload.filename, "mode": mode},
    )
    return jsonify({"ok": True, "mode": mode}), 201


@projects_bp.route("/api/projects/<pid>/report")
@require_login
def project_report(pid):
    from datetime import datetime
    from ..services import summary_service, network_service, incident_service

    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    elements = db.get("elements", [])
    connections = db.get("connections", [])
    incidents = incident_service.list_incidents(db)

    type_counts = {}
    status_counts = {"ativo": 0, "alerta": 0, "offline": 0}
    for el in elements:
        t = el.get("tipo", "outro")
        s = el.get("status", "ativo")
        type_counts[t] = type_counts.get(t, 0) + 1
        status_counts[s] = status_counts.get(s, 0) + 1

    cables_total = len(connections)
    cables_broken = sum(1 for c in connections if c.get("broken"))

    open_incidents = [i for i in incidents if i.get("status") != "closed"]

    esc = _html.escape

    type_rows = "\n".join(
        f"<tr><td>{esc(t)}</td><td>{esc(str(n))}</td></tr>"
        for t, n in sorted(type_counts.items())
    )
    status_rows = "\n".join(
        f"<tr><td>{esc(s)}</td><td>{esc(str(n))}</td></tr>"
        for s, n in status_counts.items()
    )
    cable_rows = "\n".join(
        f"<tr><td>{esc(str(c.get('id', '')))}</td><td>{esc(str(c.get('fibra', '')))}</td><td>{esc(str(c.get('from_name', '')))}</td><td>{esc(str(c.get('to_name', '')))}</td><td>{esc(str(c.get('length', '-')))}</td><td>{'Rompido' if c.get('broken') else 'Integro'}</td></tr>"
        for c in connections[:50]
    )
    if open_incidents:
        incident_rows = (
            "<table><tr><th>Titulo</th><th>Severidade</th><th>Responsavel</th></tr>\n"
            + "\n".join(
                f"<tr><td>{esc(str(i.get('title', '')))}</td><td>{esc(str(i.get('severity', '')))}</td><td>{esc(str(i.get('assigned_to', '-')))}</td></tr>"
                for i in open_incidents
            )
            + "</table>"
        )
    else:
        incident_rows = "<p>Nenhum incidente aberto.</p>"

    tmpl = """<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatorio — {{ name }}</title>
<style>
body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px;color:#1a1a2e}
h1{border-bottom:2px solid #1A73E8;padding-bottom:8px;font-size:22px}
h2{font-size:16px;margin-top:24px;color:#1A73E8}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12px}
th,td{border:1px solid #e0e0e0;padding:6px 8px;text-align:left}
th{background:#f5f7fa}
.stat-grid{display:flex;gap:16px;flex-wrap:wrap;margin:12px 0}
.stat-card{flex:1;min-width:110px;border:1px solid #e0e0e0;border-radius:8px;padding:12px;text-align:center}
.stat-card .num{font-size:26px;font-weight:700;color:#1A73E8}
.stat-card .label{font-size:11px;color:#666;margin-top:4px}
.footer{margin-top:32px;font-size:10px;color:#999;text-align:center;border-top:1px solid #e0e0e0;padding-top:12px}
@media print{body{padding:0}.stat-card{border-color:#ccc}}
</style></head><body>
<h1>Relatorio: {{ name }}</h1>
<p style="color:#666;font-size:12px">Gerado em {{ date }}</p>

<h2>Resumo</h2>
<div class="stat-grid">
<div class="stat-card"><div class="num">{{ total_elements }}</div><div class="label">Elementos</div></div>
<div class="stat-card"><div class="num">{{ total_connections }}</div><div class="label">Conexoes</div></div>
<div class="stat-card"><div class="num">{{ total_clients }}</div><div class="label">Clientes</div></div>
<div class="stat-card"><div class="num">{{ total_incidents }}</div><div class="label">Incidentes</div></div>
</div>

<h2>Elementos por Tipo</h2>
<table><tr><th>Tipo</th><th>Quantidade</th></tr>
{{ type_rows|safe }}</table>

<h2>Status da Rede</h2>
<table><tr><th>Status</th><th>Quantidade</th></tr>
{{ status_rows|safe }}</table>

<h2>Cabos</h2>
<p style="font-size:12px;color:#666">Total: {{ cable_total }} cabos | Rompidos: {{ cable_broken }}</p>
<table><tr><th>ID</th><th>Fibra</th><th>Origem</th><th>Destino</th><th>Metragem</th><th>Status</th></tr>
{{ cable_rows|safe }}</table>

<h2>Incidentes Abertos</h2>
{{ incident_rows|safe }}

<div class="footer">NetMap Pro — Relatorio automatico</div>
</body></html>"""

    return render_template_string(
        tmpl,
        name=db.get("name", pid),
        date=datetime.now().strftime("%d/%m/%Y %H:%M"),
        total_elements=str(len(elements)),
        total_connections=str(len(connections)),
        total_clients=str(type_counts.get("cliente", 0)),
        total_incidents=str(len(open_incidents)),
        type_rows=type_rows,
        status_rows=status_rows,
        cable_total=str(cables_total),
        cable_broken=str(cables_broken),
        cable_rows=cable_rows,
        incident_rows=incident_rows,
    )


@projects_bp.route("/api/projects/compare")
@require_login
def compare_projects():
    pid_a = request.args.get("a", "").strip()
    pid_b = request.args.get("b", "").strip()
    if not pid_a or not pid_b:
        return jsonify({"error": "Parametros a e b obrigatorios"}), 400
    db_a = project_service.load_project(pid_a)
    db_b = project_service.load_project(pid_b)
    if not db_a or not db_b:
        return jsonify({"error": "Projeto nao encontrado"}), 404

    def _counts(db):
        elements = db.get("elements", [])
        connections = db.get("connections", [])
        tc = {}
        for e in elements:
            tc[e.get("tipo", "?")] = tc.get(e.get("tipo", "?"), 0) + 1
        sc = {}
        for e in elements:
            sc[e.get("status", "?")] = sc.get(e.get("status", "?"), 0) + 1
        incidents = db.get("incidents", [])
        return {
            "total_elements": len(elements),
            "total_connections": len(connections),
            "total_cable_m": round(
                sum(c.get("length", 0) for c in connections if isinstance(c.get("length"), (int, float))), 1
            ),
            "broken_connections": len([c for c in connections if c.get("broken")]),
            "type_counts": tc,
            "status_counts": sc,
            "open_incidents": len([i for i in incidents if i.get("status") != "closed"]),
            "total_incidents": len(incidents),
        }

    ca = _counts(db_a)
    cb = _counts(db_b)
    all_types = sorted(set(list(ca.get("type_counts", {}).keys()) + list(cb.get("type_counts", {}).keys())))
    type_diff = []
    for t in all_types:
        type_diff.append({
            "tipo": t,
            "a": ca.get("type_counts", {}).get(t, 0),
            "b": cb.get("type_counts", {}).get(t, 0),
            "diff": cb.get("type_counts", {}).get(t, 0) - ca.get("type_counts", {}).get(t, 0),
        })

    ids_a = {e["id"] for e in db_a.get("elements", [])}
    ids_b = {e["id"] for e in db_b.get("elements", [])}
    only_in_a = [e["id"] for e in db_a.get("elements", []) if e["id"] not in ids_b]
    only_in_b = [e["id"] for e in db_b.get("elements", []) if e["id"] not in ids_a]

    return jsonify({
        "a": {"id": pid_a, "name": db_a.get("name", pid_a), **ca},
        "b": {"id": pid_b, "name": db_b.get("name", pid_b), **cb},
        "type_diff": type_diff,
        "only_in_a": only_in_a[:50],
        "only_in_b": only_in_b[:50],
    })
