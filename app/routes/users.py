"""
Rotas de gerenciamento de usuarios.
"""
from flask import Blueprint, jsonify, request, session

from ..services import audit_service, user_service
from ..utils.auth import require_perm

users_bp = Blueprint("users", __name__)


@users_bp.route("/api/users")
@require_perm("manage_users")
def get_users():
    return jsonify(user_service.list_users())


@users_bp.route("/api/users", methods=["POST"])
@require_perm("manage_users")
def create_user():
    data = request.get_json(silent=True) or {}
    try:
        result = user_service.create_user(
            username=str(data.get("username", "")).strip().lower(),
            password=str(data.get("password", "")).strip(),
            nome=str(data.get("nome", "")).strip(),
            role=str(data.get("role", "viewer")).strip(),
        )
        audit_service.log_event(
            None,
            action="user_created",
            username=session.get("user", "system"),
            entity_type="user",
            entity_id=result["username"],
            message=f'Usuario "{result["username"]}" criado',
        )
        return jsonify({"ok": True, **result}), 201
    except ValueError as exc:
        message = str(exc)
        status = 409 if "existe" in message else 400
        return jsonify({"error": message}), status


@users_bp.route("/api/users/<uid>", methods=["PUT"])
@require_perm("manage_users")
def update_user(uid):
    try:
        user_service.update_user(uid, request.get_json(silent=True) or {}, session.get("user"))
        audit_service.log_event(
            None,
            action="user_updated",
            username=session.get("user", "system"),
            entity_type="user",
            entity_id=uid,
            message=f'Usuario "{uid}" atualizado',
        )
        return jsonify({"ok": True})
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@users_bp.route("/api/users/<uid>", methods=["DELETE"])
@require_perm("manage_users")
def delete_user(uid):
    try:
        user_service.delete_user(uid, session.get("user"))
        audit_service.log_event(
            None,
            action="user_deleted",
            username=session.get("user", "system"),
            entity_type="user",
            entity_id=uid,
            message=f'Usuario "{uid}" removido',
        )
        return jsonify({"ok": True})
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
