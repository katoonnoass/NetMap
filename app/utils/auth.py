"""
Decorators de autenticação e controle de permissões.
"""
from functools import wraps
from flask import request, jsonify, redirect, url_for, session, current_app
from ..services.user_service import get_user


def current_user():
    """Retorna o dict do usuário logado ou None."""
    uid = session.get("user")
    if not uid:
        return None
    return get_user(uid)


def require_login(fn):
    """Garante que o usuário está autenticado.
    - Rotas de API devem receber 401.
    - Rotas de página redirecionam para /login.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user():
            if request.path.startswith("/api/"):
                return jsonify({"error": "Não autenticado"}), 401
            return redirect(url_for("auth.login_page"))
        return fn(*args, **kwargs)
    return wrapper


def require_perm(perm):
    """Garante que o usuário tem a permissão indicada."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            u = current_user()
            if not u:
                return jsonify({"error": "Não autenticado"}), 401
            permissions = current_app.config["PERMISSIONS"]
            if not permissions.get(u.get("role", "viewer"), {}).get(perm):
                return jsonify({"error": "Sem permissão"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
