"""
Servico de usuarios com persistencia em JSON.
"""
import hashlib
import re
import time
from datetime import datetime

from flask import current_app
from werkzeug.security import check_password_hash, generate_password_hash

from ..utils.storage import load_json, save_json

LEGACY_HASH_RE = re.compile(r"^[a-f0-9]{64}$")
MIN_PASSWORD_LENGTH = 12
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_SECONDS = 300

_PASSWORD_COMPLEXITY_RE = re.compile(r"(?=.*[a-z])(?=.*[A-Z])(?=.*\d)")


def _validate_password_complexity(password: str) -> None:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"A senha precisa ter pelo menos {MIN_PASSWORD_LENGTH} caracteres")
    if not _PASSWORD_COMPLEXITY_RE.search(password):
        raise ValueError("A senha deve conter pelo menos uma letra maiuscula, uma minuscula e um numero")


def _users_file():
    return current_app.config["USERS_FILE"]


def load_users() -> dict:
    data = load_json(_users_file(), {})
    return data if isinstance(data, dict) else {}


def save_users(users: dict) -> None:
    save_json(_users_file(), users)


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def _hash_legacy(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _verify_password(stored_hash: str, password: str) -> tuple[bool, bool]:
    if not stored_hash:
        return False, False

    if LEGACY_HASH_RE.fullmatch(stored_hash):
        return _hash_legacy(password) == stored_hash, True

    return check_password_hash(stored_hash, password), False


def get_user(username: str) -> dict | None:
    return load_users().get(username)


def ensure_admin() -> None:
    users = load_users()
    if users:
        return

    admin_password = str(current_app.config.get("DEFAULT_ADMIN_PASSWORD", "") or "")
    if len(admin_password) < MIN_PASSWORD_LENGTH:
        raise RuntimeError(
            "DEFAULT_ADMIN_PASSWORD must contain at least 12 characters"
        )
    users["admin"] = {
        "username": "admin",
        "password": hash_password(admin_password),
        "role": "admin",
        "nome": "Administrador",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "active": True,
        "password_needs_rotation": True,
    }
    save_users(users)


def authenticate(username: str, password: str) -> dict | None:
    users = load_users()
    user = users.get(username)
    if not user or not user.get("active", True):
        return None

    lockout_until = user.get("lockout_until", 0)
    failed_attempts = user.get("failed_attempts", 0)
    if lockout_until and time.time() < lockout_until:
        return None

    valid, legacy = _verify_password(user.get("password", ""), password)
    if not valid:
        failed_attempts += 1
        user["failed_attempts"] = failed_attempts
        if failed_attempts >= MAX_LOGIN_ATTEMPTS:
            user["lockout_until"] = time.time() + LOCKOUT_SECONDS
            user["failed_attempts"] = 0
        else:
            user.pop("lockout_until", None)
        users[username] = user
        save_users(users)
        return None

    user["failed_attempts"] = 0
    user.pop("lockout_until", None)

    if legacy:
        user["password"] = hash_password(password)
        user["password_needs_rotation"] = False

    users[username] = user
    save_users(users)

    return user


def list_users() -> list[dict]:
    users = load_users()
    return [
        {
            "username": uid,
            "nome": data.get("nome", uid),
            "role": data.get("role", "viewer"),
            "active": data.get("active", True),
            "created_at": data.get("created_at", ""),
            "password_needs_rotation": data.get("password_needs_rotation", False),
        }
        for uid, data in sorted(users.items())
    ]


def create_user(username: str, password: str, nome: str, role: str) -> dict:
    roles = current_app.config["ROLES"]
    if not username or not password:
        raise ValueError("Username e senha sao obrigatorios")
    if not re.match(r"^[a-z0-9_]{3,32}$", username):
        raise ValueError("Username invalido (letras minusculas, numeros e _, 3-32 chars)")
    _validate_password_complexity(password)
    if role not in roles:
        raise ValueError("Role invalido")

    users = load_users()
    if username in users:
        raise ValueError("Usuario ja existe")

    users[username] = {
        "username": username,
        "password": hash_password(password),
        "role": role,
        "nome": nome or username,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "active": True,
        "password_needs_rotation": False,
    }
    save_users(users)
    return {"username": username}


def update_user(uid: str, data: dict, current_uid: str) -> None:
    users = load_users()
    if uid not in users:
        raise LookupError("Usuario nao encontrado")
    if not isinstance(data, dict):
        raise ValueError("Payload invalido")

    roles = current_app.config["ROLES"]
    user = users[uid]
    admins = [item for item in users.values() if item.get("role") == "admin" and item.get("active", True)]

    new_role = data.get("role", user.get("role"))
    if "role" in data and new_role not in roles:
        raise ValueError("Role invalido")

    if "password" in data and data["password"] and str(data["password"]).strip():
        _validate_password_complexity(str(data["password"]).strip())

    if user.get("role") == "admin":
        if new_role != "admin" and len(admins) <= 1:
            raise ValueError("Nao e possivel rebaixar o unico admin ativo")
        if "active" in data and not bool(data["active"]) and len(admins) <= 1:
            raise ValueError("Nao e possivel desativar o unico admin ativo")

    if uid == current_uid and "active" in data and not bool(data["active"]):
        raise ValueError("Nao e possivel desativar a propria conta")

    if "nome" in data:
        user["nome"] = str(data["nome"]).strip() or uid
    if "role" in data:
        user["role"] = new_role
    if "active" in data:
        user["active"] = bool(data["active"])
    if "password" in data and str(data["password"]).strip():
        user["password"] = hash_password(str(data["password"]).strip())
        user["password_needs_rotation"] = False

    users[uid] = user
    save_users(users)


def change_password(uid: str, current_password: str, new_password: str) -> None:
    users = load_users()
    user = users.get(uid)
    if not user or not user.get("active", True):
        raise LookupError("Usuario nao encontrado")
    valid, _ = _verify_password(user.get("password", ""), current_password)
    if not valid:
        raise ValueError("Senha atual invalida")
    _validate_password_complexity(new_password)
    if current_password == new_password:
        raise ValueError("A nova senha deve ser diferente da senha atual")
    user["password"] = hash_password(new_password)
    user["password_needs_rotation"] = False
    users[uid] = user
    save_users(users)


def set_initial_password(uid: str, password: str) -> None:
    _validate_password_complexity(password)
    users = load_users()
    if uid not in users:
        raise LookupError("Usuario nao encontrado")
    users[uid]["password"] = hash_password(password)
    users[uid]["password_needs_rotation"] = True
    save_users(users)


def delete_user(uid: str, current_uid: str) -> None:
    users = load_users()
    if uid not in users:
        raise LookupError("Usuario nao encontrado")
    if uid == current_uid:
        raise ValueError("Nao e possivel excluir a propria conta")

    if users[uid].get("role") == "admin":
        admins = [item for item in users.values() if item.get("role") == "admin" and item.get("active", True)]
        if len(admins) <= 1:
            raise ValueError("Nao e possivel excluir o unico admin")

    del users[uid]
    save_users(users)
