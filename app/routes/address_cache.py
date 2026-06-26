"""
API de cache de endereco por CEP.
Usa address_cache_service para storage seguro.
"""
from flask import Blueprint, request, jsonify, current_app
from .. import limiter
from ..utils.auth import require_login
from ..services import address_cache_service

cache_bp = Blueprint("address_cache", __name__)


@cache_bp.route("/api/address-cache/lookup", methods=["POST"])
@limiter.limit("20 per minute")
@require_login
def lookup_cache():
    payload = request.get_json(silent=True) or {}
    cep = payload.get("cep", "")
    logradouro = payload.get("logradouro", "")
    entry = address_cache_service.lookup(cep, logradouro)
    if entry:
        return jsonify(entry)
    return jsonify(None)


@cache_bp.route("/api/address-cache/save", methods=["POST"])
@limiter.limit("10 per minute")
@require_login
def save_cache():
    payload = request.get_json(silent=True) or {}
    lat = payload.get("lat")
    lng = payload.get("lng")
    if not lat or not lng:
        return jsonify({"error": "Coordenadas obrigatorias"}), 400
    try:
        entry = address_cache_service.save(
            lat=lat, lng=lng,
            cep=payload.get("cep", ""),
            logradouro=payload.get("logradouro", ""),
            bairro=payload.get("bairro", ""),
            cidade=payload.get("cidade", ""),
            uf=payload.get("uf", ""),
        )
        return jsonify(entry), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
