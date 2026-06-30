"""
Application Factory — cria e configura a instância do Flask.
"""

import os
import logging
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_compress import Compress
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect
from werkzeug.middleware.proxy_fix import ProxyFix

from .config import Config

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from .utils.storage import (
    StorageConflictError,
    database_status,
    init_storage,
)

_log = logging.getLogger("netmap")
_log.setLevel(logging.INFO)
if not _log.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(
        logging.Formatter(
            '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
            datefmt="%Y-%m-%dT%H:%M:%SZ",
        )
    )
    _log.addHandler(_h)

_redis_url = os.environ.get("REDIS_URL", "").strip()
_storage_uri = _redis_url if _redis_url else "memory://"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=_storage_uri,
)

csrf = CSRFProtect()


def create_app(config_class=Config):
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
    )
    app.config.from_object(config_class)
    app.config["WTF_CSRF_CHECK_DEFAULT"] = False
    csrf.init_app(app)
    if os.environ.get("TRUST_PROXY", "").lower() in {"1", "true", "yes"}:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
    if app.config.get("CORS_ORIGINS"):
        CORS(
            app,
            supports_credentials=True,
            origins=app.config["CORS_ORIGINS"],
        )
    Compress(app)
    limiter.init_app(app)
    with app.app_context():
        init_storage()

    @app.before_request
    def enforce_csrf():
        if not app.config.get("WTF_CSRF_ENABLED", True):
            return
        if request.method in ("GET", "HEAD", "OPTIONS", "TRACE"):
            return
        if request.path.startswith("/api/"):
            if request.path == "/api/auth/login":
                return
            auth = request.headers.get("Authorization", "")
            if auth.startswith("Bearer "):
                return
            csrf.protect()

    @app.context_processor
    def inject_csrf_token():
        from flask_wtf.csrf import generate_csrf
        return dict(csrf_token=generate_csrf)

    # ── Registra Blueprints ────────────────────────────────────────────────
    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.projects import projects_bp
    from .routes.elements import elements_bp
    from .routes.connections import connections_bp
    from .routes.dios import dios_bp
    from .routes.ctos import ctos_bp
    from .routes.static_files import static_bp
    from .routes.audit import audit_bp
    from .routes.incidents import incidents_bp
    from .routes.customers import customers_bp
    from .routes.network_ops import network_ops_bp
    from .routes.integrations import integrations_bp
    from .routes.address_cache import cache_bp
    from .routes.photos import photos_bp
    from .routes.backup import backup_bp
    from .routes.fences import fence_bp
    from .routes.maintenance import maintenance_bp
    from .routes.apikeys import apikey_bp
    from .routes.sse import sse_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(elements_bp)
    app.register_blueprint(connections_bp)
    app.register_blueprint(dios_bp)
    app.register_blueprint(ctos_bp)
    app.register_blueprint(static_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(incidents_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(network_ops_bp)
    app.register_blueprint(integrations_bp)
    app.register_blueprint(cache_bp)
    app.register_blueprint(photos_bp)
    app.register_blueprint(backup_bp)
    app.register_blueprint(fence_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(apikey_bp)
    app.register_blueprint(sse_bp)

    @app.after_request
    def response_policy(response):
        if request.path.startswith("/static/"):
            if request.args.get("v"):
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            else:
                response.headers["Cache-Control"] = "public, max-age=3600"
        else:
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://server.arcgisonline.com https://services.arcgisonline.com https://*.arcgisonline.com; "
            "connect-src 'self' https://nominatim.openstreetmap.org https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://server.arcgisonline.com https://services.arcgisonline.com https://*.arcgisonline.com https://viacep.com.br; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "object-src 'none'"
        )
        if request.is_secure:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return response

    # ── Health check / status ─────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        storage = database_status()
        payload = {
            "status": "ok" if storage["ok"] else "degraded",
            "service": "netmap",
            "version": "1.1.0",
            "database": storage["backend"],
            "database_ok": storage["ok"],
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        return jsonify(payload), 200 if storage["ok"] else 503

    # ── Global error handlers (JSON) ────────────────────────────────────────
    @app.errorhandler(500)
    def handle_500(e):
        return jsonify({"error": "Erro interno do servidor"}), 500

    @app.errorhandler(StorageConflictError)
    def handle_storage_conflict(error):
        return jsonify({"error": str(error), "code": "storage_conflict"}), 409

    @app.errorhandler(404)
    def handle_404(e):
        if request.path.startswith("/api/") or request.path.startswith("/static/"):
            return jsonify({"error": "Recurso nao encontrado"}), 404
        return render_template("index.html"), 200

    @app.errorhandler(405)
    def handle_405(e):
        return jsonify({"error": "Metodo nao permitido"}), 405

    @app.errorhandler(400)
    def handle_400(e):
        from flask_wtf.csrf import CSRFError
        if isinstance(e, CSRFError):
            return jsonify({"error": "Token CSRF invalido ou ausente", "code": "csrf_error"}), 400
        return jsonify({"error": str(e)}), 400

    return app
