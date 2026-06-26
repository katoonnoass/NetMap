"""
Rotas de auditoria e visao operacional.
"""

from flask import Blueprint, jsonify, request

from ..services import audit_service, project_service, summary_service
from ..utils.auth import require_login
from ..utils.query import (
    parse_pagination,
    parse_sorting,
    parse_search,
    apply_search,
    apply_sorting,
    paginate,
)

audit_bp = Blueprint("audit", __name__)


def _paginate_with_limit_compat() -> dict:
    """Paginate, falling back to legacy ?limit= as page_size if ?page= absent."""
    if "page" not in request.args and "limit" in request.args:
        limit = max(1, min(int(request.args.get("limit", 50)), 200))
        return {"page": 1, "page_size": limit, "offset": 0}
    return parse_pagination()


@audit_bp.route("/api/projects/<pid>/audit")
@require_login
def get_project_audit(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404

    items = [
        event for event in audit_service.load_events() if event.get("project_id") == pid
    ]

    # Apply search, sorting
    search = parse_search()
    sort, order = parse_sorting(["timestamp", "action", "username"])

    if search:
        items = apply_search(items, search, ["action", "message", "username"])
    items = apply_sorting(items, sort, order)

    # Paginate (with legacy ?limit= compatibility)
    p = _paginate_with_limit_compat()
    items, meta = paginate(items, p)

    return jsonify({"items": items, **meta})


@audit_bp.route("/api/projects/<pid>/summary")
@require_login
def get_project_summary(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    summary = summary_service.build_project_summary(db, pid)
    return jsonify(summary)


@audit_bp.route("/api/audit", methods=["GET"])
@require_login
def get_global_audit():
    items = audit_service.load_events()

    search = parse_search()
    sort, order = parse_sorting(["timestamp", "action", "username"])

    if search:
        items = apply_search(items, search, ["action", "message", "username"])
    items = apply_sorting(items, sort, order)

    p = _paginate_with_limit_compat()
    items, meta = paginate(items, p)

    return jsonify({"items": items, **meta})
