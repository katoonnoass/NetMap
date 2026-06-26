"""
Camada de storage para cache de endereco por CEP.
Usa JSON flat-file com escrita atomica, backup e recuperacao.
Preparado para futura migracao para banco de dados.
"""

import os
import json
import logging
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from threading import RLock
from flask import current_app

from ..utils.storage import load_json, save_json, using_postgres

_log = logging.getLogger(__name__)

CACHE_FILENAME = "address_cache.json"
BACKUP_DIR = "address_cache_backups"
_lock = RLock()


def _get_cache_path():
    return os.path.join(current_app.config.get("DATA_DIR", "data"), CACHE_FILENAME)


def _get_backup_dir():
    return os.path.join(current_app.config.get("DATA_DIR", "data"), BACKUP_DIR)


def _normalize_cep(cep):
    return (cep or "").replace("-", "").strip()


def load_cache():
    """Carrega cache de forma segura. Se JSON estiver corrompido, faz backup e retorna []."""
    path = _get_cache_path()
    if using_postgres():
        data = load_json(path, [])
        return data if isinstance(data, list) else []
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            raise ValueError("Cache nao e uma lista")
        return data
    except (json.JSONDecodeError, ValueError) as e:
        _log.warning("Cache corrompido (%s). Recuperando...", str(e))
        backup_dir = _get_backup_dir()
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        corrupted_path = os.path.join(
            backup_dir, f"address_cache_corrupted_{timestamp}.json"
        )
        try:
            shutil.copy2(path, corrupted_path)
            _log.info("Arquivo corrompido preservado em %s", corrupted_path)
        except Exception as backup_err:
            _log.warning(
                "Nao foi possivel fazer backup do cache corrompido: %s", backup_err
            )
        _log.info("Cache corrompido substituido por cache vazio")
        return []


def save_cache(data):
    """Salva cache com escrita atomica (tempfile + os.replace)."""
    if not isinstance(data, list):
        raise ValueError("Cache deve ser uma lista")
    path = _get_cache_path()
    if using_postgres():
        save_json(path, data)
        return
    # Backup antes de sobrescrever
    if os.path.exists(path):
        backup_dir = _get_backup_dir()
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(backup_dir, f"address_cache_{timestamp}.json")
        try:
            shutil.copy2(path, backup_path)
        except Exception as backup_err:
            _log.warning("Falha ao criar backup antes de sobrescrever: %s", backup_err)
    # Escrita atomica
    fd, tmp_path = tempfile.mkstemp(dir=os.path.dirname(path), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, path)
    except OSError:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        _log.error("Falha na escrita atomica do cache de endereco", exc_info=True)
        raise


def lookup(cep, logradouro=""):
    """Busca entrada no cache por CEP (prioritario) ou logradouro."""
    cep = _normalize_cep(cep)
    logradouro = (logradouro or "").strip().lower()
    cache = load_cache()
    for entry in cache:
        if entry.get("cep") == cep:
            return entry
        if logradouro and entry.get("logradouro", "").strip().lower() == logradouro:
            return entry
    return None


def save(lat, lng, cep="", logradouro="", bairro="", cidade="", uf=""):
    """Salva coordenada manual no cache, evitando duplicidade por CEP."""
    cep = _normalize_cep(cep)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with _lock:
        cache = load_cache()
        existing_created = None
        for e in cache:
            if e.get("cep") == cep:
                existing_created = e.get("created_at")
                break
        # Remove entrada anterior para o mesmo CEP (evita duplicidade)
        cache = [e for e in cache if e.get("cep") != cep]
        entry = {
            "cep": cep,
            "logradouro": (logradouro or "").strip(),
            "bairro": (bairro or "").strip(),
            "cidade": (cidade or "").strip(),
            "uf": (uf or "").strip(),
            "latitude": float(lat),
            "longitude": float(lng),
            "precision": "MANUAL",
            "source": "MANUAL",
            "created_at": existing_created or now,
            "updated_at": now,
        }
        cache.append(entry)
        save_cache(cache)
        return entry
