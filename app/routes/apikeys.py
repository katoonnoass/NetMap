"""
Rotas de gestão de chaves API.
"""

from flask import Blueprint, jsonify, request, current_app, session

from .. import limiter
from ..services import apikey_service
from ..utils.auth import require_login, require_perm

apikey_bp = Blueprint("apikeys", __name__)


def _data_dir():
    return current_app.config.get("DATA_DIR", "data")


@apikey_bp.route("/api/apikeys")
@require_perm("manage_users")
def list_apikeys():
    return jsonify({"items": apikey_service.list_keys(_data_dir())})


@apikey_bp.route("/api/apikeys", methods=["POST"])
@limiter.limit("5 per minute")
@require_perm("manage_users")
def create_apikey():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Nome obrigatorio"}), 400
    role = data.get("role", "viewer")
    result = apikey_service.create_key(_data_dir(), name, role)
    return jsonify(result), 201


@apikey_bp.route("/api/apikeys/<int:key_id>", methods=["PUT"])
@require_perm("manage_users")
def revoke_apikey(key_id):
    data = request.get_json(silent=True) or {}
    action = data.get("action", "")
    if action == "revoke":
        if not apikey_service.revoke_key(_data_dir(), key_id):
            return jsonify({"error": "Chave nao encontrada"}), 404
        return jsonify({"ok": True})
    return jsonify({"error": "Acao desconhecida"}), 400


@apikey_bp.route("/api/apikeys/<int:key_id>", methods=["DELETE"])
@require_perm("manage_users")
def delete_apikey(key_id):
    if not apikey_service.delete_key(_data_dir(), key_id):
        return jsonify({"error": "Chave nao encontrada"}), 404
    return jsonify({"ok": True})
