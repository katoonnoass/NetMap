"""
Rotas de clientes derivados da topologia.
"""
from flask import Blueprint, jsonify

from ..services import project_service
from ..utils.auth import require_login

customers_bp = Blueprint("customers", __name__)


@customers_bp.route("/api/projects/<pid>/customers")
@require_login
def get_customers(pid):
    customers = project_service.list_customers(pid)
    if customers is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(customers)
