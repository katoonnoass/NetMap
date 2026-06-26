"""
Servico de integracao com IXC Soft.

Baseado na documentacao publica:
- endpoint base em HOST/webservice/v1
- uso de token de usuario com acesso a webservice
- recursos como cliente, cliente_contrato, radpop_radio_cliente_fibra
"""
from __future__ import annotations

import base64
import copy
import ipaddress
import json
import logging
import ssl
from datetime import datetime
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from flask import current_app

from ..utils.storage import load_json, save_json
from . import project_service

DEFAULT_IXC_CONFIG = {
    "enabled": False,
    "base_url": "",
    "token": "",
    "self_signed": False,
    "auth_mode": "auto",
    "timeout_seconds": 15,
    "resource_names": {
        "customers": "cliente",
        "contracts": "cliente_contrato",
        "fiber_clients": "radpop_radio_cliente_fibra",
        "viability": "viabilidade_tecnica",
    },
}


def _config_file():
    return current_app.config["IXC_CONFIG_FILE"]


def _normalize_base_url(url: str) -> str:
    clean = str(url or "").strip().rstrip("/")
    if not clean:
        return ""
    parsed = urlparse(clean)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("A URL do IXC deve iniciar com http:// ou https://")
    _validate_url_hostname(parsed.hostname)
    if clean.endswith("/webservice/v1"):
        return clean
    return f"{clean}/webservice/v1"


def _validate_url_hostname(hostname: str | None) -> None:
    if not hostname:
        raise ValueError("A URL do IXC deve conter um hostname valido")
    try:
        resolved_ips = __import__("socket").getaddrinfo(hostname, None, proto=__import__("socket").IPPROTO_TCP)
    except Exception:
        return
    for family, _, _, _, sockaddr in resolved_ips:
        ip = sockaddr[0]
        try:
            addr = ipaddress.ip_address(ip)
            if addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved:
                raise ValueError(
                    f"A URL do IXC resolve para um endereco interno ({ip}). "
                    "Nao e permitido acessar redes privadas."
                )
        except ValueError as exc:
            if "interno" in str(exc) or "privada" in str(exc):
                raise


def _normalize_config(payload: dict | None, previous: dict | None = None) -> dict:
    base = copy.deepcopy(DEFAULT_IXC_CONFIG)
    if isinstance(previous, dict):
        for key, value in previous.items():
            if key == "resource_names" and isinstance(value, dict):
                base["resource_names"].update(value)
            else:
                base[key] = value

    payload = payload if isinstance(payload, dict) else {}
    if "enabled" in payload:
        base["enabled"] = bool(payload.get("enabled"))
    if "base_url" in payload:
        base["base_url"] = _normalize_base_url(payload.get("base_url", ""))
    if "token" in payload:
        token = str(payload.get("token", "") or "").strip()
        if token:
            base["token"] = token
    if "self_signed" in payload:
        base["self_signed"] = bool(payload.get("self_signed"))
    if "auth_mode" in payload:
        auth_mode = str(payload.get("auth_mode", "auto")).strip().lower() or "auto"
        if auth_mode not in {"auto", "bearer", "authorization", "x-auth-token", "query", "basic", "ixcsoft"}:
            raise ValueError("Modo de autenticacao IXC invalido")
        base["auth_mode"] = auth_mode
    if "timeout_seconds" in payload:
        try:
            timeout = int(payload.get("timeout_seconds", 15))
        except (TypeError, ValueError):
            raise ValueError("Timeout da integracao IXC invalido") from None
        base["timeout_seconds"] = max(5, min(timeout, 60))
    if "resource_names" in payload:
        resources = payload.get("resource_names") or {}
        if not isinstance(resources, dict):
            raise ValueError("Mapeamento de recursos IXC invalido")
        for logical_name, default_name in DEFAULT_IXC_CONFIG["resource_names"].items():
            value = str(resources.get(logical_name, base["resource_names"].get(logical_name, default_name))).strip()
            base["resource_names"][logical_name] = value or default_name

    return base


def get_config(mask_secret: bool = True) -> dict:
    stored = load_json(_config_file(), copy.deepcopy(DEFAULT_IXC_CONFIG))
    config = _normalize_config(stored)
    if mask_secret:
        token = config.pop("token", "")
        config["has_token"] = bool(token)
        config["token_masked"] = "****" if token else ""
    return config


def get_raw_config() -> dict:
    return _normalize_config(load_json(_config_file(), copy.deepcopy(DEFAULT_IXC_CONFIG)))


def save_config(payload: dict) -> dict:
    current = get_raw_config()
    config = _normalize_config(payload, previous=current)
    save_json(_config_file(), config)
    return get_config(mask_secret=True)


def _ssl_context(self_signed: bool):
    if self_signed:
        logging.getLogger("netmap").warning(
            "IXC: SSL verification disabled (self_signed=True). "
            "Token transmitted without certificate validation."
        )
        return ssl._create_unverified_context()
    return ssl.create_default_context()


def _auth_attempts(config: dict) -> list[dict]:
    token = str(config.get("token", "") or "").strip()
    mode = str(config.get("auth_mode", "auto")).strip().lower() or "auto"
    attempts = []

    def add(label: str, headers: dict | None = None, query_token: bool = False):
        attempts.append({
            "label": label,
            "headers": headers or {},
            "query_token": query_token,
        })

    if not token:
        add("sem-token")
        return attempts

    if mode in {"auto", "bearer"}:
        add("bearer", {"Authorization": f"Bearer {token}"})
    if mode in {"auto", "authorization"}:
        add("authorization-token", {"Authorization": token})
    if mode in {"auto", "x-auth-token"}:
        add("x-auth-token", {"X-Auth-Token": token})
    if mode in {"auto", "ixcsoft"}:
        add("ixcsoft-header", {"ixcsoft": token})
    if mode in {"auto", "query"}:
        add("query-token", query_token=True)
    if mode in {"auto", "basic"}:
        encoded = base64.b64encode(f"{token}:".encode("utf-8")).decode("ascii")
        add("basic-token", {"Authorization": f"Basic {encoded}"})

    seen = set()
    deduped = []
    for attempt in attempts:
        key = (attempt["label"], tuple(sorted(attempt["headers"].items())), attempt["query_token"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(attempt)
    return deduped


def _build_url(base_url: str, resource: str | None = None, params: dict | None = None, query_token: str | None = None) -> str:
    url = base_url.rstrip("/")
    if resource:
        url = f"{url}/{resource.strip('/')}"
    clean_params = {}
    for key, value in (params or {}).items():
        if value is None:
            continue
        clean_params[key] = value
    if query_token:
        clean_params["token"] = query_token
    if clean_params:
        return f"{url}?{urlencode(clean_params, doseq=True)}"
    return url


def _request_json(url: str, timeout_seconds: int, headers: dict | None = None, self_signed: bool = True) -> dict:
    req = Request(url=url, method="GET", headers=headers or {})
    context = _ssl_context(self_signed)
    with urlopen(req, timeout=timeout_seconds, context=context) as response:
        content_type = response.headers.get("Content-Type", "")
        raw = response.read()
        text = raw.decode("utf-8", errors="replace")
        if "json" in content_type.lower():
            return {
                "ok": True,
                "status": response.status,
                "json": json.loads(text) if text.strip() else {},
                "text": text,
            }
        try:
            parsed = json.loads(text) if text.strip() else {}
        except json.JSONDecodeError:
            parsed = None
        return {
            "ok": True,
            "status": response.status,
            "json": parsed,
            "text": text,
        }


def _default_query_for_resource(logical_name: str, resource_name: str) -> dict:
    if logical_name == "customers":
        field = "cliente.id"
    elif logical_name == "contracts":
        field = "cliente_contrato.id"
    elif logical_name == "fiber_clients":
        field = "radpop_radio_cliente_fibra.id"
    else:
        field = "id"
    return {
        "qtype": field,
        "query": "0",
        "oper": ">=",
        "page": "1",
        "rp": "25",
        "sortname": field,
        "sortorder": "desc",
        "_resource": resource_name,
    }


def extract_records(payload: Any) -> list[dict]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("registros", "records", "items", "data", "resultado"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            nested = extract_records(value)
            if nested:
                return nested
    if all(not isinstance(value, (dict, list)) for value in payload.values()):
        return [payload]
    return []


def test_connection(payload: dict | None = None) -> dict:
    base_config = get_raw_config()
    config = _normalize_config(payload, previous=base_config)
    if not config.get("base_url"):
        raise ValueError("Informe a URL base do IXC")

    timeout_seconds = int(config.get("timeout_seconds", 15))
    attempts_log = []
    module_result = None
    try:
        module_result = _request_json(
            _build_url(config["base_url"]),
            timeout_seconds=timeout_seconds,
            headers={},
            self_signed=bool(config.get("self_signed", True)),
        )
    except HTTPError as exc:
        attempts_log.append({
            "stage": "module",
            "status": exc.code,
            "message": f"Modulo webservice respondeu HTTP {exc.code}",
        })
    except URLError as exc:
        raise ValueError(f"Falha ao acessar o IXC: {exc.reason}") from None

    logical_resource = str((payload or {}).get("logical_resource", "customers")).strip() or "customers"
    resource_name = config["resource_names"].get(logical_resource) or config["resource_names"]["customers"]
    params = _default_query_for_resource(logical_resource, resource_name)
    best_attempt = None

    for attempt in _auth_attempts(config):
        request_url = _build_url(
            config["base_url"],
            resource_name,
            params=params,
            query_token=config["token"] if attempt["query_token"] else None,
        )
        try:
            result = _request_json(
                request_url,
                timeout_seconds=timeout_seconds,
                headers=attempt["headers"],
                self_signed=bool(config.get("self_signed", True)),
            )
            records = extract_records(result.get("json"))
            best_attempt = {
                "stage": "resource",
                "mode": attempt["label"],
                "status": result.get("status", 200),
                "record_count": len(records),
                "resource_name": resource_name,
                "sample_keys": sorted(records[0].keys())[:10] if records else [],
                "message": "Conexao autenticada com sucesso",
            }
            break
        except HTTPError as exc:
            attempts_log.append({
                "stage": "resource",
                "mode": attempt["label"],
                "status": exc.code,
                "message": f"Recurso {resource_name} respondeu HTTP {exc.code}",
            })
        except URLError as exc:
            attempts_log.append({
                "stage": "resource",
                "mode": attempt["label"],
                "status": None,
                "message": f"Falha de rede: {exc.reason}",
            })

    return {
        "ok": bool(best_attempt),
        "tested_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ssl_verified": not bool(config.get("self_signed", False)),
        "module_reachable": bool(module_result) or any(item.get("stage") == "module" for item in attempts_log),
        "resource_name": resource_name,
        "selected_mode": best_attempt.get("mode") if best_attempt else None,
        "result": best_attempt,
        "attempts": attempts_log[-8:],
    }


def _fetch_resource(config: dict, logical_resource: str) -> tuple[list[dict], dict]:
    resource_name = config["resource_names"].get(logical_resource) or ""
    if not resource_name:
        raise ValueError(f"Recurso IXC nao configurado para {logical_resource}")

    params = _default_query_for_resource(logical_resource, resource_name)
    timeout_seconds = int(config.get("timeout_seconds", 15))
    last_error = None
    for attempt in _auth_attempts(config):
        request_url = _build_url(
            config["base_url"],
            resource_name,
            params=params,
            query_token=config["token"] if attempt["query_token"] else None,
        )
        try:
            result = _request_json(
                request_url,
                timeout_seconds=timeout_seconds,
                headers=attempt["headers"],
                self_signed=bool(config.get("self_signed", True)),
            )
            records = extract_records(result.get("json"))
            return records, {
                "mode": attempt["label"],
                "resource_name": resource_name,
                "status": result.get("status", 200),
            }
        except (HTTPError, URLError, json.JSONDecodeError) as exc:
            last_error = exc
    raise ValueError(f"Falha ao consultar o recurso {resource_name}: {last_error}") from None


def _normalize_status(value: Any) -> str:
    text = str(value or "").strip().lower()
    if text in {"a", "ativo", "active", "fa", "liberado", "online"}:
        return "ativo"
    if text in {"i", "inativo", "blocked", "bloqueado", "offline", "cancelado"}:
        return "offline"
    return "alerta" if text else "ativo"


def _compose_address(record: dict) -> str:
    fields = [
        record.get("endereco"),
        record.get("numero"),
        record.get("bairro"),
        record.get("cidade"),
        record.get("estado"),
        record.get("cep"),
    ]
    return ", ".join(str(value).strip() for value in fields if str(value or "").strip())


def _build_details(record: dict) -> str:
    detail_fields = []
    for label, key in (
        ("Contrato", "id_contrato"),
        ("Login", "login"),
        ("Plano", "contrato"),
        ("MAC", "mac"),
        ("Serial", "serial_number"),
        ("ONU", "onu"),
        ("OLT", "olt"),
        ("CTO", "cto"),
    ):
        value = record.get(key)
        if str(value or "").strip():
            detail_fields.append(f"{label}: {value}")
    return " | ".join(detail_fields)


def _logical_defaults(logical_resource: str) -> dict:
    if logical_resource == "fiber_clients":
        return {"tipo": "onu", "prefix": "ONU"}
    return {"tipo": "cliente", "prefix": "Cliente"}


def sync_project_from_ixc(pid: str, logical_resource: str = "customers", target_type: str | None = None) -> dict:
    config = get_raw_config()
    if not config.get("enabled"):
        raise ValueError("Integracao IXC desabilitada")
    if not config.get("base_url") or not config.get("token"):
        raise ValueError("Configure a URL e o token do IXC antes de sincronizar")

    db = project_service.load_project(pid)
    if not db:
        raise ValueError("Projeto nao encontrado")

    records, meta = _fetch_resource(config, logical_resource)
    defaults = _logical_defaults(logical_resource)
    final_type = (target_type or defaults["tipo"]).strip().lower() or defaults["tipo"]
    created = 0
    updated = 0
    skipped = 0
    imported_ids = []

    for record in records:
        record_id = record.get("id")
        if record_id in ("", None):
            skipped += 1
            continue

        record_id_text = str(record_id).strip()
        imported_ids.append(record_id_text)
        candidate_name = (
            record.get("razao")
            or record.get("fantasia")
            or record.get("nome")
            or record.get("cliente")
            or record.get("descricao")
            or f'{defaults["prefix"]} {record_id_text}'
        )
        element_payload = {
            "nome": str(candidate_name).strip(),
            "tipo": final_type,
            "status": _normalize_status(
                record.get("status")
                or record.get("status_internet")
                or record.get("situacao")
                or record.get("ativo")
            ),
            "modelo": str(record.get("modelo") or record.get("fabricante") or "").strip(),
            "endereco": _compose_address(record),
            "detalhes": _build_details(record),
            "ixc_id": record_id_text,
            "ixc_source": logical_resource,
            "ixc_last_sync_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "ixc_record": record,
        }

        existing = next(
            (
                element for element in db.get("elements", [])
                if str(element.get("ixc_id", "")).strip() == record_id_text
                and str(element.get("ixc_source", "")).strip() == logical_resource
            ),
            None,
        )
        if existing:
            existing.update(element_payload)
            updated += 1
        else:
            element_payload["id"] = project_service.next_id(db)
            db.setdefault("elements", []).append(element_payload)
            created += 1

    save_project = getattr(project_service, "save_project")
    save_project(pid, db)

    return {
        "ok": True,
        "project_id": pid,
        "logical_resource": logical_resource,
        "target_type": final_type,
        "resource_name": meta["resource_name"],
        "auth_mode_used": meta["mode"],
        "imported_total": len(imported_ids),
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "synced_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


def lookup_viability(payload: dict | None = None) -> dict:
    payload = payload if isinstance(payload, dict) else {}
    config = get_raw_config()
    if not config.get("base_url") or not config.get("token"):
        raise ValueError("Configure a URL e o token do IXC antes de consultar viabilidade")

    resource_name = config["resource_names"].get("viability") or "viabilidade_tecnica"
    params = {}
    latitude = str(payload.get("latitude", "") or "").strip()
    longitude = str(payload.get("longitude", "") or "").strip()
    if latitude and longitude:
        params["latitude"] = latitude
        params["longitude"] = longitude
    else:
        for required in ("endereco", "numero", "cidade", "estado"):
            value = str(payload.get(required, "") or "").strip()
            if not value:
                raise ValueError(f"Campo obrigatorio para viabilidade: {required}")
            params[required] = value
        for optional in ("bairro", "cep"):
            value = str(payload.get(optional, "") or "").strip()
            if value:
                params[optional] = value

    timeout_seconds = int(config.get("timeout_seconds", 15))
    last_error = None
    for attempt in _auth_attempts(config):
        request_url = _build_url(
            config["base_url"],
            resource_name,
            params=params,
            query_token=config["token"] if attempt["query_token"] else None,
        )
        try:
            result = _request_json(
                request_url,
                timeout_seconds=timeout_seconds,
                headers=attempt["headers"],
                self_signed=bool(config.get("self_signed", True)),
            )
            parsed = result.get("json")
            records = extract_records(parsed)
            return {
                "ok": True,
                "resource_name": resource_name,
                "auth_mode_used": attempt["label"],
                "query": params,
                "raw": parsed,
                "records": records,
                "tested_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        except (HTTPError, URLError, json.JSONDecodeError) as exc:
            last_error = exc
    raise ValueError(f"Falha ao consultar viabilidade no IXC: {last_error}") from None
