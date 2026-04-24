"""
Rotas de ordens de servico por projeto.
"""
from flask import Blueprint, jsonify, request, session

from ..services import audit_service, project_service
from ..utils.auth import require_login, require_perm

service_orders_bp = Blueprint("service_orders", __name__)


@service_orders_bp.route("/api/projects/<pid>/service-orders")
@require_login
def get_service_orders(pid):
    orders = project_service.list_service_orders(pid)
    if orders is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(orders)


@service_orders_bp.route("/api/projects/<pid>/service-orders", methods=["POST"])
@require_perm("edit_elements")
def create_service_order(pid):
    try:
        order = project_service.create_service_order(pid, request.get_json(silent=True) or {})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    if not order:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="service_order_created",
        username=session.get("user", "system"),
        entity_type="service_order",
        entity_id=order["id"],
        message=f'Ordem de servico "{order["title"]}" criada',
    )
    return jsonify(order), 201


@service_orders_bp.route("/api/projects/<pid>/service-orders/<int:order_id>", methods=["PUT"])
@require_perm("edit_elements")
def update_service_order(pid, order_id):
    try:
        order = project_service.update_service_order(pid, order_id, request.get_json(silent=True) or {})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    if not order:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="service_order_updated",
        username=session.get("user", "system"),
        entity_type="service_order",
        entity_id=order_id,
        message=f'Ordem de servico "{order["title"]}" atualizada',
    )
    return jsonify(order)


@service_orders_bp.route("/api/projects/<pid>/service-orders/<int:order_id>", methods=["DELETE"])
@require_perm("edit_elements")
def delete_service_order(pid, order_id):
    deleted = project_service.delete_service_order(pid, order_id)
    if not deleted:
        return jsonify({"error": "Not found"}), 404
    audit_service.log_event(
        pid,
        action="service_order_deleted",
        username=session.get("user", "system"),
        entity_type="service_order",
        entity_id=order_id,
        message=f"Ordem de servico #{order_id} removida",
    )
    return jsonify({"ok": True})
