"""
Rotas de clientes derivados da topologia.
"""

from flask import Blueprint, jsonify

from ..services import project_service, summary_service
from ..utils.auth import require_login
from ..utils.query import (
    parse_pagination,
    parse_sorting,
    parse_filters,
    parse_search,
    apply_filters,
    apply_search,
    apply_sorting,
    paginate,
)

customers_bp = Blueprint("customers", __name__)


@customers_bp.route("/api/projects/<pid>/customers")
@require_login
def get_customers(pid):
    db = project_service.load_project(pid)
    if not db:
        return jsonify({"error": "Not found"}), 404
    items = summary_service.list_customers(db)

    # Apply filters, search, sorting
    filters = parse_filters()
    search = parse_search()
    sort, order = parse_sorting(["nome", "status"])

    if filters:
        items = apply_filters(items, filters)
    if search:
        items = apply_search(items, search, ["nome", "endereco", "detalhes"])
    items = apply_sorting(items, sort, order)

    # Paginate
    p = parse_pagination()
    items, meta = paginate(items, p)

    return jsonify({"items": items, **meta})
