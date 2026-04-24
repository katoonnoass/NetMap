"""
Application Factory — cria e configura a instância do Flask.
"""
from flask import Flask
from .config import Config


def create_app(config_class=Config):
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
    )
    app.config.from_object(config_class)

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
    from .routes.service_orders import service_orders_bp
    from .routes.customers import customers_bp
    from .routes.network_ops import network_ops_bp
    from .routes.integrations import integrations_bp

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
    app.register_blueprint(service_orders_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(network_ops_bp)
    app.register_blueprint(integrations_bp)

    return app
