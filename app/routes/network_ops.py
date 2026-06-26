"""
Rotas tecnicas para operacao e saude da topologia.
"""

from flask import Blueprint, jsonify

from ..services import network_service, project_service
from ..utils.auth import require_login

network_ops_bp = Blueprint("network_ops", __name__)


@network_ops_bp.route("/api/projects/<pid>/cables")
@require_login
def get_project_cables(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    payload = network_service.build_cable_inventory(db, pid)
    return jsonify(payload)


@network_ops_bp.route("/api/projects/<pid>/topology-health")
@require_login
def get_topology_health(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    payload = network_service.build_topology_health(db, pid)
    return jsonify(payload)


@network_ops_bp.route("/api/projects/<pid>/trace/<int:start_id>")
@require_login
def get_path_trace(pid, start_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    payload = network_service.build_path_trace(db, pid, start_id)
    if payload is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(payload)
