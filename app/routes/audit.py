"""
Rotas de auditoria e visao operacional.
"""
from flask import Blueprint, jsonify, request

from ..services import audit_service, project_service
from ..utils.auth import require_login

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/api/projects/<pid>/audit")
@require_login
def get_project_audit(pid):
    limit = request.args.get("limit", default=25, type=int) or 25
    return jsonify(audit_service.list_project_events(pid, limit=limit))


@audit_bp.route("/api/projects/<pid>/summary")
@require_login
def get_project_summary(pid):
    summary = project_service.build_project_summary(pid)
    if not summary:
        return jsonify({"error": "Not found"}), 404
    return jsonify(summary)
