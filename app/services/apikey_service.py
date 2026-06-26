"""
Servico de chaves API para integracao externa.
Chaves armazenadas em ficheiro JSON separado (data/api_keys.json).
"""

import os
import secrets
from datetime import datetime

from ..utils.storage import load_json, save_json


def _keys_path(data_dir: str) -> str:
    return os.path.join(data_dir, "api_keys.json")


def _load_keys(data_dir: str) -> list[dict]:
    path = _keys_path(data_dir)
    data = load_json(path, {"keys": []})
    return data.get("keys", []) if data else []


def _save_keys(data_dir: str, keys: list[dict]):
    path = _keys_path(data_dir)
    save_json(path, {"keys": keys})


def list_keys(data_dir: str) -> list[dict]:
    keys = _load_keys(data_dir)
    return [
        {
            "id": k["id"],
            "name": k.get("name", ""),
            "key_prefix": k.get("key", "")[:8] + "..." + k.get("key", "")[-4:],
            "role": k.get("role", "viewer"),
            "created_at": k.get("created_at", ""),
            "last_used": k.get("last_used", ""),
            "active": k.get("active", True),
        }
        for k in keys
    ]


def create_key(data_dir: str, name: str, role: str = "viewer") -> dict:
    keys = _load_keys(data_dir)
    kid = max((k.get("id", 0) for k in keys), default=0) + 1
    raw_key = f"nm_{secrets.token_hex(24)}"
    entry = {
        "id": kid,
        "name": name or f"API Key {kid}",
        "key": raw_key,
        "role": role,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "last_used": "",
        "active": True,
    }
    keys.append(entry)
    _save_keys(data_dir, keys)
    return {
        "id": entry["id"],
        "name": entry["name"],
        "key": raw_key,
        "role": entry["role"],
        "created_at": entry["created_at"],
    }


def revoke_key(data_dir: str, key_id: int) -> bool:
    keys = _load_keys(data_dir)
    for k in keys:
        if k.get("id") == key_id:
            k["active"] = False
            _save_keys(data_dir, keys)
            return True
    return False


def delete_key(data_dir: str, key_id: int) -> bool:
    keys = _load_keys(data_dir)
    before = len(keys)
    keys = [k for k in keys if k.get("id") != key_id]
    if len(keys) < before:
        _save_keys(data_dir, keys)
        return True
    return False


def validate_key(raw_key: str, data_dir: str) -> dict | None:
    keys = _load_keys(data_dir)
    for k in keys:
        if k.get("key") == raw_key and k.get("active", True):
            k["last_used"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            _save_keys(data_dir, keys)
            return {"username": f"apikey:{k['name']}", "role": k.get("role", "viewer")}
    return None
