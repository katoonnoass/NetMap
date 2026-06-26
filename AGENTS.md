# AGENTS.md

## Project

ISP NetMap Pro — Flask app for ISP geospatial network inventory (elements, cables, DIO/CTO, incidents, customers, audit, IXC integration). Port 5005.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # no DATABASE_URL → falls back to JSON files
```

Production adds PostgreSQL: set `DATABASE_URL` in `.env`.

## Run

```bash
.venv/bin/python run.py          # dev server on :5005 (JSON mode)
docker compose up                # production: Gunicorn + Postgres
```

Factory: `app.create_app()` (used by Gunicorn and tests).

## Tests

```bash
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/pytest -m "not e2e"                    # unit + smoke
.venv/bin/playwright install chromium
NETMAP_E2E_URL=http://127.0.0.1:5005 NETMAP_E2E_USER=admin \
  NETMAP_E2E_PASSWORD='current-password' .venv/bin/pytest -m e2e
```

- Tests use **JSON mode** (no `DATABASE_URL`), temp directories as data dir.
- `auth_client` fixture in `conftest.py` logs in as admin with `AdminTest@12345`.
- E2E tests require a **running instance** with real credentials.

## Architecture

- **`app/`** — Flask app factory (`__init__.py`), config (`config.py`), routes as blueprints (`routes/`), services (`services/`), utils (`utils/`).
- **`app/utils/storage.py`** — dual-backend persistence: PostgreSQL JSONB when `DATABASE_URL` is set, else atomic JSON files with per-file locks and `os.replace`. All data access goes through `load_json` / `save_json`. Project documents use optimistic concurrency via `__storage_version`.
- **`static/`** — vanilla JS modules (no build step): `app-map.js`, `app-core.js`, `app-auth.js`, `app-workflows.js`, etc. Leaflet + MarkerCluster vendored locally in `static/vendor/`.
- **`templates/`** — Jinja2.
- **`netmap_mobile/`** — separate Flutter app that talks to the same API. Independent build.
- **`tools/`** — one-off scripts: `migrate_to_postgres.py`, `fix_mojibake.py`, `rotate_admin_password.py`.
- **`deploy/`** — systemd unit + backup scripts.

## Key conventions

- App language is **Portuguese** (UI strings, error messages, log output).
- No ORM — storage layer uses raw psycopg2 queries against `netmap_documents` / `netmap_audit_events` tables.
- `SECRET_KEY` is auto-generated to `data/.secret_key` if not set via env var.
- Roles: `admin`, `editor`, `viewer` (defined in `Config.PERMISSIONS`).
- No default admin password in code; `DEFAULT_ADMIN_PASSWORD` env var is required on first run.
- Frontend has **no build/bundle step** — JS and CSS are served directly from `static/`.
- Frontend regression tests assert specific string patterns in `app.css` and JS files; changing CSS/JS may break them.
- Service imports padronizados: `from ..services import xxx_service` (via `__init__.py`); não usar `from ..services.xxx_service import func`.
- `app/services/__init__.py` deve importar todos os 22 módulos de serviço — manter atualizado ao adicionar novos.

## Cleanup (2026-06-26)

- **Removidos:** `=3.0.0` (arquivo vazio), `backups/` (91 MB), `static/netmap_mobile.apk` (106 MB), `.omo/` (cache opencode), `tools/__pycache__/`
- **Código morto removido:** `parse_dates()`, `_mask_cep()`, `list_all()`, `list_project_events()`, `add_cache()` (duplicata em static_files.py)
- **Import morto removido:** `sanitize_all_projects` do `run.py`
- **Padronizado:** `services/__init__.py` agora importa todos os 22 serviços; 5 routes padronizadas para `from ..services import xxx_service`
- **Testes:** 21/21 passando após todas as mudanças
- **Riscos restantes:** `sanitize_all_projects()` permanece em `project_service.py` (função útil para manutenção, mas não é chamada no startup)
- **Ver detalhes:** `CLEANUP_PLAN.md` e `CLEANUP_REPORT.md`

## Migration

```bash
set -a; . ./.env; set +a
.venv/bin/python tools/migrate_to_postgres.py
```

JSON files remain as backup; Postgres becomes source of truth.
