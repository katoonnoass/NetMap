"""
Rotas de geocercas (fences).
"""

from flask import Blueprint, jsonify, request

from ..services import fence_service, project_service
from .. import limiter
from ..utils.auth import require_login, require_perm

fence_bp = Blueprint("fences", __name__)


@fence_bp.route("/api/projects/<pid>/fences")
@require_login
def get_fences(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"items": fence_service.list_fences(db)})


@fence_bp.route("/api/projects/<pid>/fences", methods=["POST"])
@limiter.limit("30 per minute")
@require_perm("edit_elements")
def add_fence(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(silent=True) or {}
    if not data.get("coordinates") or len(data["coordinates"]) < 3:
        return jsonify({"error": "Coordenadas insuficientes (min 3 pontos)"}), 400
    fence = fence_service.create_fence(db, pid, data)
    project_service.save_project(pid, db)
    return jsonify(fence), 201


@fence_bp.route("/api/projects/<pid>/fences/<int:fence_id>", methods=["PUT"])
@require_perm("edit_elements")
def edit_fence(pid, fence_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(silent=True) or {}
    fence = fence_service.update_fence(db, fence_id, data)
    if not fence:
        return jsonify({"error": "Geocerca nao encontrada"}), 404
    project_service.save_project(pid, db)
    return jsonify(fence)


@fence_bp.route("/api/projects/<pid>/fences/<int:fence_id>", methods=["DELETE"])
@require_perm("edit_elements")
def remove_fence(pid, fence_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    if not fence_service.delete_fence(db, fence_id):
        return jsonify({"error": "Geocerca nao encontrada"}), 404
    project_service.save_project(pid, db)
    return jsonify({"ok": True})


@fence_bp.route("/api/projects/<pid>/fences/<int:fence_id>/elements")
@require_login
def get_fence_elements(pid, fence_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"items": fence_service.elements_in_fence(db, fence_id)})
