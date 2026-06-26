# CLEANUP_REPORT.md — Relatório Final de Limpeza e Refatoração

**Data:** 2026-06-26
**Baseline:** 21/21 testes passando
**Pós-limpeza:** 21/21 testes passando
**Commit base:** `9270198`

---

## Arquivos Removidos

| # | Arquivo | Tamanho | Motivo |
|---|---|---|---|
| 1 | `=3.0.0` | 0 B | Arquivo vazio acidental (pip sem nome de pacote) |
| 2 | `backups/` | 91 MB | Backups de pré-produção (8 dias), uso único concluído |
| 3 | `static/netmap_mobile.apk` | 106 MB | APK servido publicamente sem uso; build regenerável |
| 4 | `.omo/` | 1 KB | Cache de sessões do opencode |
| 5 | `tools/__pycache__/` | 3 KB | Bytecode cache |
| **Total** | | **~197 MB** | |

## Código Morto Removido

| # | Função | Arquivo | Motivo |
|---|---|---|---|
| 1 | `parse_dates()` | `app/utils/query.py:46` | Nunca importada ou chamada |
| 2 | `_mask_cep()` | `app/services/address_cache_service.py:38` | Nunca chamada |
| 3 | `list_all()` | `app/services/address_cache_service.py:155` | Nunca importada |
| 4 | `list_project_events()` | `app/services/audit_service.py:64` | Nunca importada; audit faz filtragem inline |
| 5 | `add_cache()` | `app/routes/static_files.py:12` | Duplicata de `response_policy` em `__init__.py:131` |

## Import Morto Removido

| # | Import | Arquivo | Motivo |
|---|---|---|---|
| 1 | `sanitize_all_projects` | `run.py:8,17` | Import + chamada comentada; função permanece no service |

## Padronização de Imports

### `app/services/__init__.py` — 8 serviços adicionados

Antes (14 serviços):
```
address_cache_service, audit_service, connection_service, cto_service,
dio_service, element_service, geodata_service, incident_service,
ixc_service, network_service, project_service, summary_service, user_service
```

Depois (22 serviços):
```
address_cache_service, apikey_service, audit_service, backup_service,
connection_service, cto_service, dio_service, element_service,
fence_service, geodata_service, incident_service, ixc_service,
maintenance_service, network_service, optical_service, photo_service,
project_service, snapshot_service, sse_service, summary_service, user_service
```

### Routes padronizadas para `from ..services import xxx`

| Route | Antes | Depois |
|---|---|---|
| `app/routes/maintenance.py` | `from ..services.maintenance_service import list_schedules, ...` | `from ..services import maintenance_service` |
| `app/routes/fences.py` | `from ..services.fence_service import list_fences, ...` | `from ..services import fence_service` |
| `app/routes/sse.py` | `from ..services.sse_service import subscribe, iter_events` | `from ..services import sse_service` |
| `app/routes/auth.py` | `from ..services.user_service import authenticate, ...` | `from ..services import user_service` |
| `app/routes/audit.py` | `from ..services.snapshot_service import take_snapshot, ...` | `from ..services import snapshot_service` |

---

## Testes Executados

```
$ DEFAULT_ADMIN_PASSWORD=AdminTest@12345 .venv/bin/pytest -m "not e2e" -v

tests/test_frontend_regressions.py::test_map_tiles_have_horizontal_pan_protection PASSED
tests/test_frontend_regressions.py::test_mobile_map_controls_do_not_share_vertical_bands PASSED
tests/test_frontend_regressions.py::test_mobile_sidebar_starts_collapsed PASSED
tests/test_frontend_regressions.py::test_map_dependencies_are_local PASSED
tests/test_smoke.py::TestAppBoots::test_app_exists PASSED
tests/test_smoke.py::TestAppBoots::test_index_redirects_to_login PASSED
tests/test_smoke.py::TestAppBoots::test_login_page_served PASSED
tests/test_smoke.py::TestAuthAPI::test_login_wrong_credentials PASSED
tests/test_smoke.py::TestAuthAPI::test_login_success PASSED
tests/test_smoke.py::TestAuthAPI::test_auth_me_requires_login PASSED
tests/test_smoke.py::TestAuthAPI::test_auth_me_authenticated PASSED
tests/test_smoke.py::TestAuthAPI::test_change_password_requires_current_password PASSED
tests/test_smoke.py::TestAuthAPI::test_change_password_rotates_session PASSED
tests/test_smoke.py::TestProjectsAPI::test_projects_requires_auth PASSED
tests/test_smoke.py::TestProjectsAPI::test_projects_list_authenticated PASSED
tests/test_smoke.py::TestProductionPolicies::test_health_reports_storage_backend PASSED
tests/test_smoke.py::TestProductionPolicies::test_security_headers_are_present PASSED
tests/test_smoke.py::TestFixMojibake::test_fix_mojibake_importable PASSED
tests/test_smoke.py::TestFixMojibake::test_fix_accented_portuguese PASSED
tests/test_smoke.py::TestFixMojibake::test_fix_idempotent PASSED
tests/test_smoke.py::TestFixMojibake::test_ascii_preserved PASSED

21 passed, 2 deselected in 4.08s
```

Servidor também reiniciou com sucesso sem erros.

---

## Riscos Restantes

| Item | Detalhe | Ação recomendada |
|---|---|---|
| `sanitize_all_projects()` | Permanece em `project_service.py` — função útil para manutenção, mas sem chamada no startup | Manter; pode ser invocada manualmente se necessário |
| SSE notificações parciais | Apenas `elements` e `connections` emitem notificação SSE. Outros routes (DIO, CTO, incidents, fences, etc.) não notificam. | Adicionar `notify_change()` nos demais routes como melhoria futura |
| Endpoints sem paginação | Alguns endpoints de lista não usam `parse_pagination()`, carregando tudo em memória | Avaliar paginação em endpoints com grande volume |

---

## Próximos Passos Recomendados

1. Padronizar SSE: adicionar `notify_change()` nos routes de DIO, CTO, incidents, fences, maintenance, users, photos
2. Paginação: revisar endpoints que fazem `list()` completo sem paginação
3. Criar testes para serviços FASE 4-7 (backup, fence, maintenance, apikey, sse, optical, snapshot, photo)
4. Considerar lint com `ruff check app/` para identificar imports não usados automaticamente
