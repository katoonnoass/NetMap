"""
Rotas de backup e restauracao de projetos.
"""

from flask import Blueprint, jsonify, request, send_file, session

from .. import limiter
from ..services import audit_service, backup_service
from ..utils.auth import require_login, require_perm

backup_bp = Blueprint("backup", __name__)


@backup_bp.route("/api/projects/<pid>/backup")
@require_login
def export_backup(pid):
    result = backup_service.export_backup(pid)
    if result is None:
        return jsonify({"error": "Projeto nao encontrado"}), 404
    filename, data = result
    return send_file(
        __import__("io").BytesIO(data),
        mimetype="application/zip",
        as_attachment=True,
        download_name=filename,
    )


@backup_bp.route("/api/projects/<pid>/restore-backup", methods=["POST"])
@limiter.limit("3 per minute")
@require_perm("manage_projects")
def import_backup(pid):
    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify({"error": "Selecione um arquivo ZIP"}), 400

    ext = (upload.filename.rsplit(".", 1)[-1] or "").lower()
    if ext != "zip":
        return jsonify({"error": "Formato invalido. Use arquivo .zip"}), 400

    raw = upload.read()
    if len(raw) > 200 * 1024 * 1024:
        return jsonify({"error": "Arquivo excede 200MB"}), 400

    result = backup_service.import_backup(pid, raw)
    if result is None:
        return jsonify({"error": "Projeto nao encontrado"}), 404
    if "error" in result:
        return jsonify(result), 400

    audit_service.log_event(
        pid,
        action="project_backup_restored",
        username=session.get("user", "system"),
        entity_type="project",
        entity_id=pid,
        message=f'Backup restaurado de "{upload.filename}"',
        extra={
            "file_name": upload.filename,
            "photos_restored": result.get("photos_restored", 0),
        },
    )
    return jsonify(result), 201
