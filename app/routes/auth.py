"""
Rotas de autenticacao: login, logout e sessao atual.
"""
from flask import Blueprint, current_app, jsonify, redirect, render_template, request, session, url_for

from ..services import audit_service
from ..services.user_service import authenticate, ensure_admin
from ..utils.auth import current_user, require_login

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login")
def login_page():
    if current_user():
        return redirect(url_for("projects.index"))
    return render_template("login.html")


@auth_bp.route("/api/auth/login", methods=["POST"])
def do_login():
    ensure_admin()
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip().lower()
    password = str(data.get("password", ""))

    if not username or not password:
        return jsonify({"error": "Usuario e senha sao obrigatorios"}), 400

    user = authenticate(username, password)
    if not user:
        return jsonify({"error": "Usuario ou senha invalidos"}), 401

    session.clear()
    session["user"] = username
    session.permanent = True
    audit_service.log_event(
        None,
        action="login",
        username=username,
        entity_type="session",
        entity_id=username,
        message=f'Login realizado por "{username}"',
    )

    role = user.get("role", "viewer")
    permissions = current_app.config["PERMISSIONS"]
    return jsonify({
        "ok": True,
        "username": username,
        "nome": user.get("nome", username),
        "role": role,
        "permissions": permissions.get(role, {}),
        "password_needs_rotation": user.get("password_needs_rotation", False),
    })


@auth_bp.route("/api/auth/logout", methods=["POST"])
def do_logout():
    session.clear()
    return jsonify({"ok": True})


@auth_bp.route("/api/auth/me")
@require_login
def me():
    user = current_user()
    role = user.get("role", "viewer")
    permissions = current_app.config["PERMISSIONS"]
    return jsonify({
        "username": session["user"],
        "nome": user.get("nome", session["user"]),
        "role": role,
        "permissions": permissions.get(role, {}),
        "password_needs_rotation": user.get("password_needs_rotation", False),
    })
