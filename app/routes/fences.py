"""
Rotas de geocercas (fences).
"""

from flask import Blueprint, jsonify, request

from ..services import project_service
from ..services.fence_service import (
    list_fences,
    create_fence,
    update_fence,
    delete_fence,
    elements_in_fence,
)
from .. import limiter
from ..utils.auth import require_login, require_perm

fence_bp = Blueprint("fences", __name__)


@fence_bp.route("/api/projects/<pid>/fences")
@require_login
def get_fences(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"items": list_fences(db)})


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
    fence = create_fence(db, pid, data)
    project_service.save_project(pid, db)
    return jsonify(fence), 201


@fence_bp.route("/api/projects/<pid>/fences/<int:fence_id>", methods=["PUT"])
@require_perm("edit_elements")
def edit_fence(pid, fence_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(silent=True) or {}
    fence = update_fence(db, fence_id, data)
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
    if not delete_fence(db, fence_id):
        return jsonify({"error": "Geocerca nao encontrada"}), 404
    project_service.save_project(pid, db)
    return jsonify({"ok": True})


@fence_bp.route("/api/projects/<pid>/fences/<int:fence_id>/elements")
@require_login
def get_fence_elements(pid, fence_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"items": elements_in_fence(db, fence_id)})
