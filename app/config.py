"""
Configuracoes da aplicacao.
"""
import os
import secrets
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SECRET_FILE = DATA_DIR / ".secret_key"


def _load_secret_key() -> str:
    env_secret = os.environ.get("SECRET_KEY")
    if env_secret:
        return env_secret

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if SECRET_FILE.exists():
        secret = SECRET_FILE.read_text(encoding="utf-8").strip()
        if secret:
            try:
                SECRET_FILE.chmod(0o600)
            except OSError:
                pass
            return secret

    secret = secrets.token_hex(32)
    SECRET_FILE.write_text(secret, encoding="utf-8")
    try:
        SECRET_FILE.chmod(0o600)
    except OSError:
        pass
    return secret


class Config:
    DEBUG = False
    SECRET_KEY = _load_secret_key()

    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 3600
    WTF_CSRF_HEADERS = ["X-CSRFToken"]

    DATA_DIR = DATA_DIR
    USERS_FILE = DATA_DIR / "users.json"
    PROJECTS_DIR = DATA_DIR / "projects"
    AUDIT_FILE = DATA_DIR / "audit_log.json"
    IXC_CONFIG_FILE = DATA_DIR / "ixc_integration.json"
    DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
    DEFAULT_ADMIN_PASSWORD = os.environ.get("DEFAULT_ADMIN_PASSWORD", "").strip()
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]

    SESSION_COOKIE_NAME = "netmap_session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "").lower() in {"1", "true", "yes"}
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)
    MAX_CONTENT_LENGTH = 25 * 1024 * 1024

    ROLES = ["admin", "editor", "viewer"]
    PERMISSIONS = {
        "admin": {
            "view": True,
            "edit_elements": True,
            "edit_cables": True,
            "edit_dio": True,
            "manage_projects": True,
            "manage_users": True,
        },
        "editor": {
            "view": True,
            "edit_elements": True,
            "edit_cables": True,
            "edit_dio": True,
            "manage_projects": False,
            "manage_users": False,
        },
        "viewer": {
            "view": True,
            "edit_elements": False,
            "edit_cables": False,
            "edit_dio": False,
            "manage_projects": False,
            "manage_users": False,
        },
    }
