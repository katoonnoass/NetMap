"""
Rotas tecnicas para operacao e saude da topologia.
"""
from flask import Blueprint, jsonify

from ..services import project_service
from ..utils.auth import require_login

network_ops_bp = Blueprint("network_ops", __name__)


@network_ops_bp.route("/api/projects/<pid>/cables")
@require_login
def get_project_cables(pid):
    payload = project_service.build_cable_inventory(pid)
    if payload is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(payload)


@network_ops_bp.route("/api/projects/<pid>/topology-health")
@require_login
def get_topology_health(pid):
    payload = project_service.build_topology_health(pid)
    if payload is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(payload)


@network_ops_bp.route("/api/projects/<pid>/trace/<int:start_id>")
@require_login
def get_path_trace(pid, start_id):
    payload = project_service.build_path_trace(pid, start_id)
    if payload is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(payload)
