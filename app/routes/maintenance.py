"""
Rotas de agendamento de manutencao.
"""

from flask import Blueprint, jsonify, request

from ..services import project_service
from ..services.maintenance_service import (
    list_schedules,
    create_schedule,
    update_schedule,
    delete_schedule,
    upcoming_schedules,
)
from .. import limiter
from ..utils.auth import require_login, require_perm

maintenance_bp = Blueprint("maintenance", __name__)


@maintenance_bp.route("/api/projects/<pid>/maintenance")
@require_login
def get_maintenance(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"items": list_schedules(db)})


@maintenance_bp.route("/api/projects/<pid>/maintenance/upcoming")
@require_login
def get_upcoming_maintenance(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    days = max(1, min(int(request.args.get("days", 7)), 365))
    return jsonify({"items": upcoming_schedules(db, days)})


@maintenance_bp.route("/api/projects/<pid>/maintenance", methods=["POST"])
@limiter.limit("30 per minute")
@require_perm("edit_elements")
def add_maintenance(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(silent=True) or {}
    if not data.get("title"):
        return jsonify({"error": "Titulo obrigatorio"}), 400
    sched = create_schedule(db, pid, data)
    project_service.save_project(pid, db)
    return jsonify(sched), 201


@maintenance_bp.route("/api/projects/<pid>/maintenance/<int:sched_id>", methods=["PUT"])
@require_perm("edit_elements")
def edit_maintenance(pid, sched_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(silent=True) or {}
    sched = update_schedule(db, sched_id, data)
    if not sched:
        return jsonify({"error": "Agendamento nao encontrado"}), 404
    project_service.save_project(pid, db)
    return jsonify(sched)


@maintenance_bp.route("/api/projects/<pid>/maintenance/<int:sched_id>", methods=["DELETE"])
@require_perm("edit_elements")
def remove_maintenance(pid, sched_id):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    if not delete_schedule(db, sched_id):
        return jsonify({"error": "Agendamento nao encontrado"}), 404
    project_service.save_project(pid, db)
    return jsonify({"ok": True})
