"""
Rotas para integracoes externas, incluindo IXC Soft.
"""
from flask import Blueprint, jsonify, request, session

from .. import limiter
from ..services import audit_service, ixc_service
from ..utils.auth import require_login, require_perm

integrations_bp = Blueprint("integrations", __name__)


@integrations_bp.route("/api/integrations/ixc/config")
@require_login
def get_ixc_config():
    return jsonify(ixc_service.get_config(mask_secret=True))


@integrations_bp.route("/api/integrations/ixc/config", methods=["PUT"])
@limiter.limit("5 per minute")
@require_perm("manage_users")
def save_ixc_config():
    try:
        config = ixc_service.save_config(request.get_json(silent=True) or {})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    audit_service.log_event(
        None,
        action="ixc_config_updated",
        username=session.get("user", "system"),
        entity_type="integration",
        entity_id="ixc",
        message="Configuracao da integracao IXC atualizada",
    )
    return jsonify(config)


@integrations_bp.route("/api/integrations/ixc/test", methods=["POST"])
@limiter.limit("3 per minute")
@require_perm("manage_users")
def test_ixc_connection():
    try:
        result = ixc_service.test_connection(request.get_json(silent=True) or {})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    audit_service.log_event(
        None,
        action="ixc_connection_tested",
        username=session.get("user", "system"),
        entity_type="integration",
        entity_id="ixc",
        message="Teste de conectividade IXC executado",
        extra={"ok": result.get("ok", False)},
    )
    return jsonify(result)


@integrations_bp.route("/api/integrations/ixc/viability", methods=["POST"])
@limiter.limit("10 per minute")
@require_perm("manage_users")
def lookup_ixc_viability():
    try:
        result = ixc_service.lookup_viability(request.get_json(silent=True) or {})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    audit_service.log_event(
        None,
        action="ixc_viability_checked",
        username=session.get("user", "system"),
        entity_type="integration",
        entity_id="ixc",
        message="Consulta de viabilidade IXC executada",
    )
    return jsonify(result)


@integrations_bp.route("/api/projects/<pid>/integrations/ixc/sync", methods=["POST"])
@limiter.limit("3 per minute")
@require_perm("edit_elements")
def sync_project_ixc(pid):
    payload = request.get_json(silent=True) or {}
    logical_resource = str(payload.get("logical_resource", "customers")).strip() or "customers"
    target_type = str(payload.get("target_type", "")).strip() or None
    try:
        result = ixc_service.sync_project_from_ixc(pid, logical_resource=logical_resource, target_type=target_type)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    audit_service.log_event(
        pid,
        action="ixc_sync_completed",
        username=session.get("user", "system"),
        entity_type="integration",
        entity_id="ixc",
        message=f'Sincronizacao IXC concluida para recurso "{logical_resource}"',
        extra=result,
    )
    return jsonify(result)
