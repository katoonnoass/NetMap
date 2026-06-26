"""
Decorators de autenticacao e controle de permissoes.
Suporta sessao de usuario e autenticacao via API Key (Bearer token).
"""
from functools import wraps
from flask import request, jsonify, redirect, url_for, session, current_app
from ..services.user_service import get_user


def current_user():
    """Retorna o dict do usuario logado ou None."""
    uid = session.get("user")
    if not uid:
        return None
    return get_user(uid)


def _api_key_user():
    """Check Authorization: Bearer nm_... header."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:].strip()
        if token.startswith("nm_"):
            from ..services.apikey_service import validate_key
            data_dir = current_app.config.get("DATA_DIR", "data")
            return validate_key(token, data_dir)
    return None


def require_login(fn):
    """Garante que o usuario esta autenticado.
    - Rotas de API aceitam sessao ou API Key (Bearer).
    - Rotas de pagina redirecionam para /login.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        u = current_user()
        if u:
            return fn(*args, **kwargs)
        api_user = _api_key_user()
        if api_user:
            session["_api_key_user"] = api_user
            return fn(*args, **kwargs)
        if request.path.startswith("/api/"):
            return jsonify({"error": "Não autenticado"}), 401
        return redirect(url_for("auth.login_page"))
    return wrapper


def require_perm(perm):
    """Garante que o usuario tem a permissao indicada."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            u = current_user()
            if not u:
                u = session.get("_api_key_user")
            if not u:
                return jsonify({"error": "Não autenticado"}), 401
            permissions = current_app.config["PERMISSIONS"]
            if not permissions.get(u.get("role", "viewer"), {}).get(perm):
                return jsonify({"error": "Sem permissão"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
