"""
Rotas de projetos.
"""
import io

from flask import Blueprint, jsonify, render_template, request, send_file, session

from ..services import audit_service, geodata_service, project_service
from ..utils.auth import require_login, require_perm

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
    return jsonify(project_service.list_projects())


@projects_bp.route("/api/projects", methods=["POST"])
@require_perm("manage_projects")
def create_project():
    data = request.get_json(silent=True) or {}
    result = project_service.create_project(
        name=str(data.get("name", "Novo Projeto")).strip(),
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
@require_perm("manage_projects")
def update_project(pid):
    try:
        result = project_service.update_project_meta(pid, request.get_json(silent=True) or {})
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
    return jsonify({
        "elements": db.get("elements", []),
        "connections": db.get("connections", []),
        "dios": db.get("dios", []),
        "positions": db.get("positions", {}),
        "cto_ports": db.get("cto_ports", {}),
        "incidents": db.get("incidents", []),
        "service_orders": db.get("service_orders", []),
    })


@projects_bp.route("/api/projects/<pid>/export")
@require_login
def export_project(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify({
        "projeto": db.get("name"),
        "criado_em": db.get("created_at"),
        "elementos": db.get("elements", []),
        "conexoes": db.get("connections", []),
        "dios": db.get("dios", []),
        "cto_ports": db.get("cto_ports", {}),
        "incidentes": db.get("incidents", []),
        "ordens_servico": db.get("service_orders", []),
    })


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
@require_perm("edit_elements")
def import_project_geodata(pid):
    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify({"error": "Selecione um arquivo KML ou KMZ"}), 400
    try:
        result = geodata_service.import_project_geodata(pid, upload.filename, upload.read())
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
