"""
Rotas de upload e listagem de fotos dos elementos.
"""

import os
from flask import Blueprint, jsonify, request, send_file, session, current_app

from .. import limiter
from ..services import photo_service, project_service
from ..utils.auth import require_login, require_perm

photos_bp = Blueprint("photos", __name__)


@photos_bp.route("/api/projects/<pid>/elements/<int:eid>/photos", methods=["GET"])
@require_login
def list_photos(pid, eid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    photos = photo_service.list_photos(pid, eid)
    return jsonify(photos)


@photos_bp.route("/api/projects/<pid>/elements/<int:eid>/photos", methods=["POST"])
@limiter.limit("15 per minute")
@require_perm("edit_elements")
def upload_photo(pid, eid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    uploaded = request.files["file"]
    if not uploaded.filename:
        return jsonify({"error": "Arquivo sem nome"}), 400

    data = uploaded.read()
    err = photo_service.validate_file(uploaded.filename, data)
    if err:
        return jsonify({"error": err}), 400

    result = photo_service.save_photo(pid, eid, uploaded.filename, data)
    return jsonify(result), 201


@photos_bp.route("/api/photos/<pid>/<int:eid>/<filename>")
@require_login
def serve_photo(pid, eid, filename):
    path = photo_service._validate_photo_path(pid, eid, filename)
    if not path:
        return jsonify({"error": "Not found"}), 404
    mime = photo_service.IMAGE_MIME_TYPES.get(os.path.splitext(filename)[1].lower(), "application/octet-stream")
    return send_file(path, mimetype=mime)


@photos_bp.route(
    "/api/projects/<pid>/elements/<int:eid>/photos/<filename>", methods=["DELETE"]
)
@limiter.limit("15 per minute")
@require_perm("edit_elements")
def delete_photo(pid, eid, filename):
    deleted = photo_service.delete_photo(pid, eid, filename)
    if not deleted:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"ok": True})
