# CLEANUP_PLAN.md — Diagnóstico de Limpeza e Refatoração

**Data:** 2026-06-26
**Baseline:** 21/21 testes passando, 2 e2e deselecionados
**Commit base:** `9270198`

---

## 1. Arquivos Candidatos à Remoção

### 1.1 Arquivo órfão: `=3.0.0`

| Campo | Valor |
|---|---|
| **Caminho** | `/opt/NetMap/=3.0.0` |
| **Tipo** | Arquivo vazio (0 bytes) |
| **Motivo** | Provavelmente criado por acidente ao rodar `pip install ==3.0.0` sem nome de pacote. Não é referenciado por nada. |
| **Referenciado?** | Não — listado no `.gitignore` (linha 16) |
| **Risco** | Nenhum |
| **Decisão** | **REMOVER** |

---

### 1.2 Backups antigos: `backups/`

| Campo | Valor |
|---|---|
| **Caminho** | `/opt/NetMap/backups/` |
| **Conteúdo** | `pre_production_20260618_143052.tar.gz` (89 MB), `working_tree_20260618_143052.patch` (2 MB), `working_tree_20260618_143052.status`, `data_pre_postgres_20260618_143052/` |
| **Motivo** | Backups de pré-produção de 8 dias atrás. São arquivos de uso único antes de migração para Postgres. Já estão no `.gitignore` (linha 9). Ocupam 91 MB em disco. |
| **Referenciado?** | Não — nenhuma importação ou referência no código |
| **Risco** | Baixo — se a migração Postgres precisar ser revertida, esses backups seriam úteis, mas já se passaram 8 dias |
| **Decisão** | **REMOVER** (avaliar se migração já foi consolidada) |

---

### 1.3 APK no static: `static/netmap_mobile.apk`

| Campo | Valor |
|---|---|
| **Caminho** | `/opt/NetMap/static/netmap_mobile.apk` |
| **Tamanho** | 106 MB |
| **Motivo** | Build do Flutter app colocado incorretamente em `static/`. Não é servido por nenhuma rota nem referenciado em template ou JS. Flask serve tudo em `static/` publicamente, o que significa este APK de 106 MB está acessível via URL e desperdiça largura de banda. |
| **Referenciado?** | Não — nenhuma referência em HTML, JS, Python ou docs. Listado no `.gitignore` (linha 23) |
| **Risco** | Nenhum — o build do Flutter é regenerável via `flutter build apk` |
| **Decisão** | **REMOVER** |

---

### 1.4 Cache do opencode: `.omo/`

| Campo | Valor |
|---|---|
| **Caminho** | `/opt/NetMap/.omo/` |
| **Conteúdo** | Sessões JSON do opencode (6 arquivos de 214 bytes cada) |
| **Motivo** | Dados temporários de ferramenta de desenvolvimento. Não fazem parte do projeto. |
| **Referenciado?** | Não — listado no `.gitignore` (linha 15) |
| **Risco** | Nenhum |
| **Decisão** | **REMOVER** |

---

### 1.5 `tools/__pycache__/`

| Campo | Valor |
|---|---|
| **Caminho** | `/opt/NetMap/tools/__pycache__/` |
| **Conteúdo** | `fix_mojibake.cpython-310.pyc` |
| **Motivo** | Bytecode cache de Python — não deve ser versionado |
| **Referenciado?** | Não — `.gitignore` cobre `__pycache__/` (linha 1) |
| **Risco** | Nenhum |
| **Decisão** | **REMOVER** |

---

## 2. Código Morto em Python

### 2.1 `parse_dates()` — `app/utils/query.py:46`

| Campo | Valor |
|---|---|
| **Função** | `parse_dates()` → retorna dict com `created_from`, `created_to`, `updated_from`, `updated_to` |
| **Motivo** | Definida e exportada mas nunca importada em nenhum endpoint. Nenhum route usa filtro por range de datas. |
| **Referenciado?** | Apenas definida — zero importações |
| **Risco** | Baixo — função utilitária, fácil de re-adicionar se necessário |
| **Decisão** | **REMOVER** |

---

### 2.2 `_mask_cep()` — `app/services/address_cache_service.py:38`

| Campo | Valor |
|---|---|
| **Função** | `_mask_cep(cep)` → mascara CEP para debug (ex: `12345-***`) |
| **Motivo** | Função privada nunca chamada. `_normalize_cep` é usada, mas `_mask_cep` não. |
| **Referenciado?** | Zero chamadas internas ou externas |
| **Risco** | Nenhum |
| **Decisão** | **REMOVER** |

---

### 2.3 `list_all()` — `app/services/address_cache_service.py:155`

| Campo | Valor |
|---|---|
| **Função** | `list_all()` → retorna todo o cache de endereços para debug/admin |
| **Motivo** | Nunca importada ou chamada de nenhum route. Nenhum endpoint expõe essa funcionalidade. |
| **Referenciado?** | Zero importações |
| **Risco** | Baixo — utilidade era debug, pode ser re-criada se necessário |
| **Decisão** | **REMOVER** |

---

### 2.4 `list_project_events()` — `app/services/audit_service.py:64`

| Campo | Valor |
|---|---|
| **Função** | `list_project_events(project_id, limit=50)` → filtra eventos de auditoria por project_id |
| **Motivo** | Nunca importada. O endpoint de audit em `app/routes/audit.py:37` faz filtragem inline em vez de usar esta função. |
| **Referenciado?** | Zero importações |
| **Risco** | Baixo — lógica trivial, re-criável |
| **Decisão** | **REMOVER** |

---

### 2.5 `sanitize_all_projects()` — `app/services/project_service.py:417`

| Campo | Valor |
|---|---|
| **Função** | `sanitize_all_projects()` → normaliza todos os projetos em disco |
| **Motivo** | Importada em `run.py:8` mas **chamada comentada** em `run.py:17`. Funcionalmente morta no startup. Comentário diz "runs on every element anyway" sugerindo que a sanitização já ocorre incrementalmente. |
| **Referenciado?** | Import em `run.py:8`, chamada comentada em `run.py:17` |
| **Risco** | Médio — pode ser descomentada se necessário no futuro |
| **Decisão** | **REVER MANUALMENTE** — remover a import e linha comentada de `run.py`, manter a função no `project_service.py` (é uma ferramenta útil para manutenção) |

---

## 3. Código Duplicado

### 3.1 `add_cache()` em `app/routes/static_files.py:12`

| Campo | Valor |
|---|---|
| **O que** | After-request handler que adiciona `Cache-Control` para `/static/` |
| **Duplicata de** | `app/__init__.py:131-136` (handler `response_policy`) |
| **Motivo** | Ambos executam em sequência (blueprint before app-level). `add_cache` define o header, depois `response_policy` sobrescreve com o mesmo valor. Redundante. |
| **Impacto da remoção** | Nenhum — `response_policy` já define Cache-Control idêntico. O route `serve_vis()` (gzip do vis-network) permanece funcional. |
| **Risco** | Baixo — a lógica de gzip em `serve_vis()` é independente e não é afetada |
| **Decisão** | **REMOVER** `add_cache()` e deixar somente `response_policy` |

---

## 4. Organização e Padronização

### 4.1 `app/services/__init__.py` — Imports incompletos

| Campo | Valor |
|---|---|
| **Problema** | O `__init__.py` importa 14 serviços mas existem 22 módulos no diretório. Serviços FASE 4-7 faltam: `apikey_service`, `backup_service`, `fence_service`, `maintenance_service`, `optical_service`, `photo_service`, `snapshot_service`, `sse_service` |
| **Impacto** | Funcionalmente neutro — os routes importam diretamente `from ..services.xxx import yyy`. Mas a convenção é inconsistente: alguns routes usam `from ..services import x` (via `__init__`) e outros usam `from ..services.x_service import y` (direto). |
| **Risco** | Nenhum — ambos os padrões funcionam |
| **Decisão** | **PADRONIZAR** — adicionar os 8 serviços faltantes ao `__init__.py` e padronizar todos os routes para `from ..services import xxx` |

---

### 4.2 `run.py` — Import morto

| Campo | Valor |
|---|---|
| **Problema** | `from app.services.project_service import sanitize_all_projects` — import de função que nunca é chamada (linha comentada) |
| **Decisão** | **REMOVER** a import e a linha comentada. Manter a função no service. |

---

## 5. Arquivos Manter (Não Remover)

| Arquivo | Motivo para manter |
|---|---|
| `tools/fix_mojibake.py` | Testado ativamente (4 testes em `test_smoke.py::TestFixMojibake`) |
| `tools/migrate_to_postgres.py` | Script documentado, ferramenta de migração essencial |
| `tools/rotate_admin_password.py` | Script documentado, ferramenta de segurança |
| `tests/e2e/test_map_browser.py` | Teste E2E válido, marcado com `@pytest.mark.e2e` |
| `deploy/` (todos os 4 arquivos) | Systemd units e scripts de backup em produção |
| `netmap_mobile/` | App Flutter independente, documentado |
| `data/` (runtime data) | Dados de runtime, já no `.gitignore` |
| `static/vendor/` | Leaflet + MarkerCluster + jsPDF vendored, necessário |
| `static/vis-network.min.js` | Biblioteca vis.js, usada pela topologia |

---

## 6. Resumo de Decisões

| # | Item | Decisão | Risco |
|---|---|---|---|
| 1 | `=3.0.0` | REMOVER | Nenhum |
| 2 | `backups/` (91 MB) | REMOVER | Baixo |
| 3 | `static/netmap_mobile.apk` (106 MB) | REMOVER | Nenhum |
| 4 | `.omo/` | REMOVER | Nenhum |
| 5 | `tools/__pycache__/` | REMOVER | Nenhum |
| 6 | `parse_dates()` | REMOVER | Baixo |
| 7 | `_mask_cep()` | REMOVER | Nenhum |
| 8 | `list_all()` | REMOVER | Baixo |
| 9 | `list_project_events()` | REMOVER | Baixo |
| 10 | `add_cache()` (duplicata) | REMOVER | Baixo |
| 11 | `run.py` import morto | REMOVER | Baixo |
| 12 | `services/__init__.py` incompleto | PADRONIZAR | Nenhum |
| 13 | `sanitize_all_projects()` | REVER MANUALMENTE | Médio |

**Desconto total em disco:** ~197 MB (91 MB backups + 106 MB APK)

---

## 7. Baseline de Testes

```
21 passed, 2 deselected in 4.01s
```

Todos os testes unitários + de regressão passam antes de qualquer mudança.
