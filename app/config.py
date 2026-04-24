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
            return secret

    secret = secrets.token_hex(32)
    SECRET_FILE.write_text(secret, encoding="utf-8")
    return secret


class Config:
    SECRET_KEY = _load_secret_key()

    DATA_DIR = DATA_DIR
    USERS_FILE = DATA_DIR / "users.json"
    PROJECTS_DIR = DATA_DIR / "projects"
    AUDIT_FILE = DATA_DIR / "audit_log.json"
    IXC_CONFIG_FILE = DATA_DIR / "ixc_integration.json"
    DEFAULT_ADMIN_PASSWORD = os.environ.get("DEFAULT_ADMIN_PASSWORD", "admin123")

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "").lower() in {"1", "true", "yes"}
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)

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
