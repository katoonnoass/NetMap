<p align="center">
  <img src="static/favicon.svg" alt="NetMap Pro" width="80" height="80">
  <h1 align="center">ISP NetMap Pro</h1>
  <p align="center">Sistema de inventário geoespacial para provedores ISP<br>
  <strong>Mapa • Topologia • Cabos de Fibra • DIO/CTO • Incidentes • Clientes • Auditoria • IXC</strong></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10-blue" alt="Python 3.10">
  <img src="https://img.shields.io/badge/Flask-3.x-green" alt="Flask">
  <img src="https://img.shields.io/badge/License-Proprietary-red" alt="License">
  <img src="https://img.shields.io/badge/Port-5005-orange" alt="Port 5005">
</p>

---

## Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack Tecnológico](#stack-tecnológico)
- [Início Rápido](#início-rápido)
- [Configuração](#configuração)
- [Docker](#docker)
- [Produção com systemd](#produção-com-systemd)
- [Migração JSON → PostgreSQL](#migração-json--postgresql)
- [Testes](#testes)
- [Arquitetura](#arquitetura)
- [API REST](#api-rest)
- [Segurança](#segurança)
- [Tipos de Elementos](#tipos-de-elementos)
- [Tipos de Cabos](#tipos-de-cabos)
- [Ferramentas](#ferramentas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [FASE 4-7 — Recursos Avançados](#fase-4-7--recursos-avançados)

---

## Visão Geral

O **ISP NetMap Pro** é uma aplicação Flask de página única (SPA) projetada para provedores de internet (ISPs) gerenciarem toda sua infraestrutura de rede fibra óptica em um único lugar:

- **Mapa geográfico interativo** com Leaflet — posicione elementos, trace cabos com waypoints, meça distâncias
- **Topologia de rede** visual com vis-network — diagrama interativo com fusões de fibra
- **Painéis DIO/CTO** — gerencie portas, fusões de fibra, splitters e ocupação
- **Dashboard** com métricas em tempo real, gráficos de pizza, sparklines de tendência e score de validação
- **Incidentes** com status, severidade, categorias, vínculo a elementos e comentários
- **Auditoria** completa — toda alteração registrada com timestamp, usuário e detalhes
- **Integração IXC Soft** — sincronize contratos, clientes e viabilidade

Toda a interface é em **português brasileiro**. Suporta tema claro/escuro com alternância em tempo real.

---

## Funcionalidades

### Mapa Geográfico
- 3 camadas de mapa: OpenStreetMap, Satélite (Esri), Dark Gray (Esri)
- Posicionamento de elementos por clique ou busca de endereço/CEP
- Traçado de cabos com waypoints intermediários e redraw de rota
- Ferramenta de medição de distância com marcadores
- Filtros por status do elemento (ativo/offline/alerta)
- Legenda interativa com grupos Core e Rua
- Clustering de marcadores automático
- Pesquisa global de elementos, clientes e cabos
- Pesquisa por raio com slider ajustável (100–5000m)
- Mapa de calor com seletor de fonte (elementos, clientes, incidentes)
- Impressão/PDF do mapa via captura de canvas

### Topologia
- Diagrama de rede interativo (arraste, zoom, seleção)
- Fusões de fibra visual entre conexões
- Destaque de caminho óptico entre dois pontos
- Posições salvas automaticamente

### Painéis DIO
- Rack visual com portas coloridas por status
- Edição de cada porta (status, fibra, observação, conexão)
- Redimensionamento de capacidade (único/duplo)
- Associação de portas a conexões de cabo

### Painéis CTO
- Grade de portas com Status visual
- Edição individual e **edição em lote** (seleção múltipla)
- Suporte a **splitters 1:2 e 1:4** por porta
- Status: livre, ocupada, manutenção, splitter

### Inventário
- Tabela com paginação, busca e filtros por tipo/status
- Exportação CSV com BOM para Excel
- Operações em lote: alterar status, alterar tipo, excluir
- Duplicação de elementos

### Cabos
- Listagem com paginação, busca e filtro de rompidos
- 34 tipos de cabo pré-definidos (tronco, distribuição, derivação, drop, indoor, elétrico)
- 24 cores de fibra (12 tubos + 12 anilhas)
- Edição modal com redraw de rota no mapa
- Distância automática via Haversine (considera waypoints)
- Suporte a cabos rascunho (tracejado, 45% opacidade)

### Incidentes
- CRUD completo com status (aberto, em andamento, resolvido, fechado)
- Severidades: baixa, média, alta, **crítica**
- Categorias: rede, hardware, software, segurança, atendimento, outro
- Vínculo a elementos e navegação direta
- **Comentários** com timeline e registro de autor/data

### Clientes
- Listagem derivada de elementos tipo `cliente`
- Contagem de conexões e status de rota
- Caminho óptico a partir do cliente
- Edição e exclusão

### Dashboard
- Contadores de status (ativo, offline, alerta)
- Gráfico de pizza por tipo de elemento (interativo com legenda clicável)
- Score de validação topológica com barra de progresso colorida
- Alertas automáticos (cabos rompidos, incidentes abertos)
- Sparklines de tendência (365 dias): elementos/clientes, cabos/metragem, incidentes/rompidos
- Ocupação CTO global e por projeto

### Relatórios
- Tabela de ocupação CTO
- Resumo por tipo e status
- Exportação HTML completa do projeto

### Auditoria
- Log de todas as ações (criação, edição, exclusão, login, importação)
- Filtros por ação, usuário e data
- Retenção de até 5000 eventos

### Integração IXC Soft
- Configuração com auto-detecção de modo de autenticação
- Teste de conexão
- Sincronização de clientes, contratos e fiber_clients
- Consulta de viabilidade
- Proteção SSRF (bloqueia IPs privados)

### Backup e Restore
- **Exportar backup** — ZIP com `project.json` + pasta de fotos
- **Restaurar backup** — sobrescreve dados do projeto ativo
- Botões na barra de ferramentas principal

### Histórico por Elemento
- Filtro `?entity_id=` no endpoint de auditoria
- Seção "Histórico" no painel lateral do elemento
- Exibe ações relevantes (criação, edição, exclusão)

### Distância Automática do Cabo
- Cálculo automático via fórmula de Haversine ao criar/editar cabo
- Distância total considerando waypoints intermediários
- Atualização em tempo real no modal de cabo

### Pesquisa por Raio no Mapa
- Modo de busca circular com slider de raio (100–5000m)
- Clique no mapa define centro, elementos dentro do raio são destacados
- Display do raio selecionado em metros

### Impressão/PDF do Mapa
- Captura do canvas Leaflet via `leaflet-image.js`
- Geração de PDF com `jsPDF` (A4, orientação paisagem)
- Download direto do arquivo PDF

### Cálculo de Atenuação Óptica
- Estimativa de nível de sinalvia `GET /api/projects/<pid>/signal/<element_id>`
- Perdas: fibra (0.35dB/km), conector (0.5dB), splitter (1:2=3.5dB, 1:4=7dB)
- TX: +3dBm, alerta -25dBm, crítico -28dBm
- Exibição no modal de traceroute com itens de perda

### Modo Rascunho/Planejamento
- Campo `draft` em elementos e conexões
- Toggle 📐 no toolbar ativa modo rascunho
- Elementos rascunho: borda tracejada + badge "R" + 50% opacidade
- Cabos rascunho: linha tracejada + 45% opacidade
- Botão "Promover para Real" converte rascunho em definitivo
- Checkbox na legenda controla visibilidade de rascunhos

### Dashboard Avançado
- Snapshots diários automáticos (até 365 dias)
- 3 sparklines de tendência: elementos/clientes, cabos/metragem, incidentes/rompidos
- Contagem automática de ocupação CTO (global e por projeto)
- Seção de ocupação CTO na aba de validação

### Mapa de Calor
- Camada de calor via `leaflet-heat.js`
- Toggle on/off e seletor de fonte (elementos, clientes, incidentes)
- Controles integrados na legenda do mapa

### Notificações SSE (Server-Sent Events)
- Endpoint `GET /api/events` com stream SSE e keepalive a cada 15s
- Pub/sub em memória com `queue.Queue` por subscriber
- Broadcast automático em CRUD de elementos/conexões
- Frontend reconecta automaticamente (10s de delay)
- Toast de notificação em mudanças de dados por outros usuários

### API Keys (Integração Externa)
- Geração de chaves API com prefixo `nm_` + 24 hex chars
- CRUD completo: `GET/POST/PUT/DELETE /api/apikeys`
- Autenticação Bearer token (bypass CSRF para API keys)
- Revogação e exclusão com registro de uso
- UI de gerenciamento no modal de usuários

### Geocercas
- CRUD completo de geocercas poligonais
- Modo 🛡️ no toolbar: clique para adicionar vértices, duplo-clique para finalizar
- Polígonos renderizados no mapa com tooltip
- Endpoint `GET /fences/<id>/elements` lista elementos dentro da cerca
- Algoritmo point-in-polygon para detecção

### Agendamento de Manutenção
- CRUD de agendamentos com data, tipo, descrição, elemento vinculado
- Endpoint `GET /maintenance/upcoming` para próximos agendamentos
- Seção 🗓️ abaixo da aba de incidentes
- Modal de criação/edição de agendamento

### Gestão de Postes
- Campos específicos: altura, material, proprietário, última inspeção
- Seção dedicada no painel lateral para atributos de poste
- Botão "Registrar Inspeção" preenche data automaticamente
- Campos condicionais no modal de edição

### Comparação de Projetos
- Endpoint `GET /api/projects/compare?a=<pid>&b=<pid>`
- Modal 📊 com seleção de dois projetos
- Grid de diferenças: contagem por tipo e status
- Quebra por tipo de elemento com indicadores +/-/=

### PWA / Offline
- Manifesto `manifest.json` (standalone, tema #1A73E8)
- Service Worker com cache-first e precache de assets estáticos
- Network-first fallback para URLs não-API
- Instalável como app no desktop e mobile

### Fotos
- Upload de fotos (JPG/PNG/WEBP, máx 5MB)
- Validação por magic bytes
- Galeria nos painéis de elemento
- Servido localmente com path traversal protection

---

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.10, Flask 3.x, Gunicorn |
| Banco de Dados | PostgreSQL 16 (produção) / JSON files (desenvolvimento) |
| Mapa | Leaflet 1.1.1 + MarkerCluster 1.5.3 + leaflet-heat (vendor local) |
| Topologia | vis-network (vendor local) |
| PDF | jsPDF (vendor local, carga lazy) |
| Frontend | Vanilla JS (sem build step), CSS custom properties, PWA |
| SSE | Server-Sent Events com keepalive e auto-reconexão |
| Autenticação | Flask-WTF CSRF, Werkzeug password hashing, session-based |
| Rate Limiting | Flask-Limiter (Redis ou in-memory) |
| Compressão | Flask-Compress, zstd |
| Containers | Docker, docker-compose, Gunicorn + Postgres |
| Deploy | systemd unit + backup diário |

---

## Início Rápido

### Desenvolvimento (JSON mode)

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
# edite .env e defina DEFAULT_ADMIN_PASSWORD
DEFAULT_ADMIN_PASSWORD=SuaSenhaForte123 .venv/bin/python run.py
```

Acesse **http://localhost:5005** — um projeto demo é criado automaticamente no primeiro acesso.

### Produção (PostgreSQL via Docker)

```bash
docker compose up -d
```

Veja [Docker](#docker) para detalhes.

---

## Configuração

### Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `SECRET_KEY` | Produção | Chave criptográfica (mín. 64 hex chars). Auto-gerada se não definida |
| `DEFAULT_ADMIN_PASSWORD` | Primeiro run | Senha inicial do admin (mín. 12 chars, maiúscula+minúscula+dígito) |
| `DATABASE_URL` | Não | URL PostgreSQL. Se omitido, usa arquivos JSON |
| `SESSION_COOKIE_SECURE` | Não | `true` para HTTPS (padrão: `false`) |
| `CORS_ORIGINS` | Não | Origens CORS separadas por vírgula |
| `TRUST_PROXY` | Não | `true` para habilitar ProxyFix (Nginx, etc.) |
| `REDIS_URL` | Não | Redis para rate limiting (fallback: in-memory) |
| `POSTGRES_PASSWORD` | Docker | Senha do PostgreSQL no docker-compose |

### Permissões por Papel

| Permissão | admin | editor | viewer |
|---|:---:|:---:|:---:|
| `view` | ✅ | ✅ | ✅ |
| `edit_elements` | ✅ | ✅ | — |
| `edit_cables` | ✅ | ✅ | — |
| `edit_dio` | ✅ | ✅ | — |
| `manage_projects` | ✅ | — | — |
| `manage_users` | ✅ | — | — |

---

## Docker

### docker-compose.yml

```yaml
# Serviços: db (postgres:16-alpine) + netmap (app)
# Porta: 5005
# Volume: netmap_postgres + ./data:/app/data
```

### Uso

```bash
# Configure as variáveis no .env ou docker-compose.yml
docker compose up -d

# Verificar saúde
curl http://localhost:5005/api/health
```

O `DATABASE_URL` é montado automaticamente como `postgresql://netmap:${POSTGRES_PASSWORD}@db:5432/netmap`.

### Dockerfile

- Base: `python:3.10-slim`
- Usuário não-root: `netmap` (UID 10001)
- CMD: `gunicorn --bind 0.0.0.0:5005 --workers 3 --threads 2 --timeout 60`

---

## Produção com systemd

```bash
sudo cp deploy/netmap.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now netmap
```

O unit file inclui:
- Gunicorn: 3 workers, 2 threads, 60s timeout
- Segurança: `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem=full`, `ProtectHome=true`
- Backup diário via timer systemd (02:30 com delay aleatório)
- Limpeza automática de backups com mais de 30 dias

---

## Migração JSON → PostgreSQL

```bash
set -a; . ./.env; set +a
.venv/bin/python tools/migrate_to_postgres.py
```

Os arquivos JSON permanecem como backup. O PostgreSQL torna-se a fonte oficial.

---

## Testes

### Unitários + Smoke

```bash
.venv/bin/pip install -r requirements-dev.txt
DEFAULT_ADMIN_PASSWORD=AdminTest@12345 .venv/bin/pytest -m "not e2e"
```

### E2E (Playwright)

```bash
.venv/bin/playwright install chromium
NETMAP_E2E_URL=http://127.0.0.1:5005 \
NETMAP_E2E_USER=admin \
NETMAP_E2E_PASSWORD='senha-atual' \
.venv/bin/pytest -m e2e
```

> Os testes E2E exigem uma instância rodando com credenciais reais.

---

## Arquitetura

```
NetMap/
├── app/                        # Aplicação Flask
│   ├── __init__.py             # Factory (create_app), blueprints, middleware
│   ├── config.py               # Configuração, permissões, constantes
│   ├── routes/                 # 20 blueprints REST
│   │   ├── auth.py             # Login, logout, CSRF, senha
│   │   ├── users.py            # CRUD de usuários
│   │   ├── projects.py         # CRUD de projetos, import/export, compare
│   │   ├── elements.py         # CRUD de elementos, bulk ops, CSV
│   │   ├── connections.py      # CRUD de conexões/cabos
│   │   ├── dios.py             # CRUD de DIOs e portas
│   │   ├── ctos.py             # Portas CTO, bulk update, splitter
│   │   ├── incidents.py        # CRUD de incidentes, comentários
│   │   ├── customers.py        # Listagem de clientes
│   │   ├── network_ops.py      # Cabos, saúde, traceroute, sinal óptico
│   │   ├── audit.py            # Log de auditoria, snapshots
│   │   ├── integrations.py     # IXC Soft (config, test, sync, viabilidade)
│   │   ├── photos.py           # Upload e serve de fotos
│   │   ├── address_cache.py    # Cache de CEP/endereços
│   │   ├── static_files.py     # Serve vis-network com gzip
│   │   ├── backup.py           # Export/import ZIP backup
│   │   ├── fences.py           # CRUD de geocercas + elementos na cerca
│   │   ├── maintenance.py      # CRUD de agendamentos de manutenção
│   │   ├── apikeys.py          # CRUD de chaves API
│   │   └── sse.py              # SSE stream endpoint
│   ├── services/               # Lógica de negócio
│   │   ├── project_service.py  # Projetos, normalização, seed
│   │   ├── element_service.py  # Elementos, cascata, bulk, draft, poste
│   │   ├── connection_service.py # Conexões, draft
│   │   ├── dio_service.py      # DIOs e portas
│   │   ├── cto_service.py      # CTOs, bulk update, splitter
│   │   ├── incident_service.py # Incidentes, comentários
│   │   ├── user_service.py     # Usuários, lockout, rotação de senha
│   │   ├── audit_service.py    # Auditoria (5000 eventos)
│   │   ├── network_service.py  # Saúde, score, traceroute BFS
│   │   ├── optical_service.py  # Cálculo de atenuação óptica
│   │   ├── ixc_service.py      # Integração IXC, SSRF protection
│   │   ├── geodata_service.py  # KML/KMZ import/export
│   │   ├── summary_service.py  # Dashboard, resumo, ocupação CTO
│   │   ├── snapshot_service.py # Snapshots diários para tendências
│   │   ├── backup_service.py   # Backup/restore ZIP com fotos
│   │   ├── fence_service.py    # Geocercas, point-in-polygon
│   │   ├── maintenance_service.py # Agendamento de manutenção
│   │   ├── apikey_service.py   # Chaves API (geração, validação, revogação)
│   │   ├── sse_service.py      # Pub/sub SSE em memória
│   │   ├── photo_service.py    # Fotos, validação magic bytes
│   │   └── address_cache_service.py # Cache CEP
│   └── utils/
│       ├── auth.py             # Decoradores require_login, require_perm, Bearer auth
│       ├── storage.py          # Dual-backend (JSON/Postgres), OCC
│       ├── query.py            # Paginação, sorting, filtros compartilhados
│       └── notify.py           # Helper de broadcast SSE para mudanças de dados
├── static/                     # Frontend (sem build step)
│   ├── app.js → app-core.js   # API, CRUD, toast
│   ├── app-auth.js            # Login/logout, gestão de usuários, API keys, SSE
│   ├── app-map.js             # Mapa Leaflet, markers, cabos, medida, calor, cercas, rascunho
│   ├── app-management.js      # DIO, CTO, fotos, modais, focus trap, poste, draft
│   ├── app-views.js           # Dashboard, tabela, validação, relatórios, sparklines, compare
│   ├── app-workflows.js       # Busca global, import, alertas, incidentes, manutenção
│   ├── app-shell.js           # Sidebar, tabs, painel, ctx-menu, bulk, backup
│   ├── app-state.js           # Estado global, TYPE_CONFIG, constantes, draftMode
│   ├── app-theme.js           # Tema claro/escuro, localStorage
│   ├── app.css                # Estilos, CSS variables, responsivo
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker (cache-first, precache)
│   └── vendor/                 # Leaflet, MarkerCluster, leaflet-heat, jspdf (local)
├── templates/
│   ├── index.html             # SPA principal (22 modais, 12 abas), PWA meta
│   └── login.html             # Página de login
├── data/                       # JSON mode (desenvolvimento)
│   ├── users.json
│   ├── audit_log.json
│   ├── ixc_integration.json
│   └── projects/
├── tests/
│   ├── test_smoke.py          # Smoke tests (17 testes)
│   ├── test_frontend_regressions.py # Contratos CSS/JS (4 testes)
│   └── conftest.py            # Fixtures, auth_client
├── tools/
│   ├── migrate_to_postgres.py # Migração completa JSON→Postgres
│   ├── fix_mojibake.py        # Correção de encoding duplo
│   └── rotate_admin_password.py # Rotação de senha admin
├── deploy/
│   ├── netmap.service         # Unit file systemd
│   ├── netmap-backup.service  # Backup service
│   ├── netmap-backup.timer    # Timer diário (02:30)
│   └── backup.sh              # pg_dump + tar + limpeza
├── Dockerfile                 # Produção container
├── docker-compose.yml         # App + Postgres
├── requirements.txt           # Dependências produção
├── requirements-dev.txt       # pytest, playwright
└── run.py                     # Dev server (:5005)
```

---

## API REST

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/auth/csrf-token` | Obter token CSRF |
| `POST` | `/api/auth/login` | Login (JSON: username, password) |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Sessão atual |
| `POST` | `/api/auth/change-password` | Alterar própria senha |

### Projetos

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/projects` | Listar (paginado, buscável) |
| `POST` | `/api/projects` | Criar projeto |
| `PUT` | `/api/projects/<pid>` | Atualizar |
| `DELETE` | `/api/projects/<pid>` | Excluir |
| `POST` | `/api/projects/<pid>/duplicate` | Duplicar |
| `GET` | `/api/projects/<pid>/all` | Todos os dados |
| `GET` | `/api/projects/<pid>/export` | Exportar JSON |
| `GET` | `/api/projects/<pid>/export/kml` | Exportar KML |
| `GET` | `/api/projects/<pid>/export/kmz` | Exportar KMZ |
| `POST` | `/api/projects/<pid>/import-geodata` | Importar KML/KMZ |
| `POST` | `/api/projects/<pid>/import-json` | Importar JSON (mesclar/substituir) |
| `GET` | `/api/projects/<pid>/report` | Relatório HTML |
| `GET` | `/api/projects/compare` | Comparar dois projetos (?a=&b=) |

### Elementos

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/projects/<pid>/elements` | Listar (paginado, filtros) |
| `POST` | `/api/projects/<pid>/elements` | Adicionar |
| `PUT` | `/api/projects/<pid>/elements/<eid>` | Atualizar |
| `DELETE` | `/api/projects/<pid>/elements/<eid>` | Excluir (cascata) |
| `POST` | `/api/projects/<pid>/elements/<eid>/duplicate` | Duplicar |
| `POST` | `/api/projects/<pid>/elements/bulk-update` | Atualização em lote |
| `POST` | `/api/projects/<pid>/elements/bulk-delete` | Exclusão em lote |
| `GET` | `/api/projects/<pid>/elements/export.csv` | CSV (com BOM) |

### Conexões/Cabos

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/projects/<pid>/connections` | Listar (filtro: broken) |
| `POST` | `/api/projects/<pid>/connections` | Adicionar |
| `PUT` | `/api/projects/<pid>/connections/<cid>` | Atualizar |
| `DELETE` | `/api/projects/<pid>/connections/<cid>` | Excluir |

### DIOs

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/projects/<pid>/dios` | Listar DIOs |
| `POST` | `/api/projects/<pid>/dios` | Criar DIO |
| `PUT` | `/api/projects/<pid>/dios/<dio_id>` | Atualizar |
| `DELETE` | `/api/projects/<pid>/dios/<dio_id>` | Excluir |
| `PUT` | `/api/projects/<pid>/dios/<dio_id>/ports/<port_num>` | Atualizar porta |

### CTOs

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/projects/<pid>/ctos/<cto_id>/ports` | Listar portas |
| `PUT` | `/api/projects/<pid>/ctos/<cto_id>/ports/<port_num>` | Atualizar porta |
| `POST` | `/api/projects/<pid>/ctos/<cto_id>/ports/bulk-update` | Atualização em lote |
| `POST` | `/api/projects/<pid>/ctos/<cto_id>/ports/<port_num>/split` | Adicionar splitter |
| `DELETE` | `/api/projects/<pid>/ctos/<cto_id>/ports/<port_num>/split` | Remover splitter |

### Incidentes

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/projects/<pid>/incidents` | Listar (filtros: status, severidade, categoria) |
| `POST` | `/api/projects/<pid>/incidents` | Criar |
| `PUT` | `/api/projects/<pid>/incidents/<id>` | Atualizar |
| `DELETE` | `/api/projects/<pid>/incidents/<id>` | Excluir |
| `POST` | `/api/projects/<pid>/incidents/<id>/comments` | Adicionar comentário |

### Rede

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/projects/<pid>/cables` | Inventário de cabos |
| `GET` | `/api/projects/<pid>/topology-health` | Score e issues |
| `GET` | `/api/projects/<pid>/trace/<start_id>` | Caminho óptico (BFS) |
| `GET` | `/api/projects/<pid>/signal/<element_id>` | Atenuação óptica e nível de sinal |

### IXC Soft

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/integrations/ixc/config` | Config (token mascarado) |
| `PUT` | `/api/integrations/ixc/config` | Salvar config |
| `POST` | `/api/integrations/ixc/test` | Testar conexão |
| `POST` | `/api/integrations/ixc/viability` | Viabilidade |
| `POST` | `/api/projects/<pid>/integrations/ixc/sync` | Sincronizar |

### Backup

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/backup` | Download ZIP (project.json + fotos) |
| `POST` | `/api/restore-backup` | Restaurar backup (multipart) |

### Geocercas

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/fences` | Listar geocercas |
| `POST` | `/api/fences` | Criar geocerca |
| `PUT` | `/api/fences/<id>` | Atualizar |
| `DELETE` | `/api/fences/<id>` | Excluir |
| `GET` | `/api/fences/<id>/elements` | Elementos dentro da cerca |

### Manutenção

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/maintenance` | Listar agendamentos |
| `POST` | `/api/maintenance` | Criar agendamento |
| `PUT` | `/api/maintenance/<id>` | Atualizar |
| `DELETE` | `/api/maintenance/<id>` | Excluir |
| `GET` | `/api/maintenance/upcoming` | Próximos agendamentos |

### API Keys

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/apikeys` | Listar chaves |
| `POST` | `/api/apikeys` | Criar chave |
| `PUT` | `/api/apikeys/<id>` | Atualizar (revogar) |
| `DELETE` | `/api/apikeys/<id>` | Excluir chave |

### SSE

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/events` | Stream SSE (mudanças em tempo real) |

### Snapshots

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/snapshots` | Listar snapshots diários |
| `POST` | `/api/snapshots` | Criar snapshot manual |

### Outros

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/projects/<pid>/audit` | Auditoria do projeto (filtro: entity_id) |
| `GET` | `/api/projects/<pid>/summary` | Resumo/dashboard |
| `GET` | `/api/audit` | Auditoria global |
| `GET` | `/api/projects/<pid>/customers` | Clientes |
| `GET` | `/api/projects/<pid>/elements/<eid>/photos` | Fotos do elemento |
| `POST` | `/api/projects/<pid>/elements/<eid>/photos` | Upload de foto |
| `DELETE` | `/api/projects/<pid>/elements/<eid>/photos/<filename>` | Excluir foto |
| `POST` | `/api/address-cache/lookup` | Buscar endereço por CEP |
| `POST` | `/api/address-cache/save` | Salvar coordenada |
| `GET` | `/api/health` | Status, versão, backend |

### Parâmetros de Query Comuns

| Parâmetro | Descrição |
|---|---|
| `page` | Página (padrão: 1) |
| `page_size` | Itens por página (padrão: 50, máx: 200) |
| `sort` | Campo de ordenação |
| `order` | `asc` ou `desc` |
| `search` | Busca full-text |
| `entity_id` | Filtrar auditoria por elemento/conexão específica |

---

## Segurança

| Medida | Detalhe |
|---|---|
| CSRF | Flask-WTF em todos os POST/PUT/DELETE (bypass para Bearer API keys) |
| Rate Limiting | 200/dia + 50/hora (login: 10/min, senha: 5/min) |
| Password Hashing | Werkzeug (pbkdf2:sha256), migração automática de SHA-256 legado |
| Password Policy | Mín 12 chars + maiúscula + minúscula + dígito |
| Account Lockout | 5 tentativas falhas → 5 min bloqueio |
| Session | HttpOnly, SameSite=Lax, 12h expiração |
| API Keys | Prefixo `nm_`, Bearer token auth, revogação, bypass CSRF |
| CSP | `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'` |
| HSTS | `max-age=63072000; includeSubDomains; preload` (HTTPS) |
| XSS | `esc()` global em todos os `innerHTML` com dados do DB |
| Photo Upload | Magic bytes validation, max 5MB, path traversal protection |
| IXC SSRF | Bloqueia IPs privados (RFC 1918, loopback, link-local) |
| Security Headers | X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy |

---

## Tipos de Elementos

| Tipo | Label | Cor | Categoria |
|---|---|---|---|
| `bgp` | BGP/Upstream | `#ff6b6b` | Core |
| `core` | Core/DC | `#ff9100` | Core |
| `dio` | DIO | `#c77dff` | Core |
| `olt` | OLT | `#0080ff` | Core |
| `onu` | ONU/ONT | `#40c4ff` | Rua |
| `ceo` | CEO | `#ffe066` | Rua |
| `cto` | CTO | `#00e676` | Rua |
| `splitter` | Splitter | `#00c8ff` | Core |
| `switch` | Switch | `#ff80ab` | Core |
| `roteador` | Roteador | `#69f0ae` | Core |
| `poste` | Poste | `#a1887f` | Rua |
| `cliente` | Cliente | `#a0f0c0` | Rua |

---

## Tipos de Cabos

| Grupo | Tipos |
|---|---|
| Tronco | 288FO, 216FO, 144FO, 96FO, 72FO, 48FO, 36FO, 24FO, 18FO, 12FO |
| Distribuição | 24FO, 12FO, 8FO, 6FO, 4FO |
| Derivação | 12FO, 6FO, 4FO |
| Drop | 1FO Flat, 2FO Flat, 4FO Flat, 1FO Redondo, 2FO Redondo |
| Indoor | Cordão Simplex 1FO, Cordão Duplex 2FO, Indoor 4FO/6FO/12FO |
| Elétrico | UTP Cat5e, UTP Cat6, UTP Cat6A, 10G SFP+, 40G QSFP+, Metálico Par Trançado, Coaxial RG6 |

### Cores de Fibra (24)

| Tubo | Cor | Anilha | Cor |
|---|---|---|---|
| 1 | Azul | 13 | Azul/Anilha |
| 2 | Laranja | 14 | Laranja/Anilha |
| 3 | Verde | 15 | Verde/Anilha |
| 4 | Marrom | 16 | Marrom/Anilha |
| 5 | Cinza | 17 | Cinza/Anilha |
| 6 | Branco | 18 | Branco/Anilha |
| 7 | Vermelho | 19 | Vermelho/Anilha |
| 8 | Preto | 20 | Preto/Anilha |
| 9 | Amarelo | 21 | Amarelo/Anilha |
| 10 | Violeta | 22 | Violeta/Anilha |
| 11 | Rosa | 23 | Rosa/Anilha |
| 12 | Aqua | 24 | Aqua/Anilha |

Fibras por tubo padrão: **12**

---

## Ferramentas

### `tools/migrate_to_postgres.py`

Migra todos os dados JSON (projetos, usuários, IXC, cache de endereços, auditoria) para PostgreSQL. Requer `DATABASE_URL` configurado.

### `tools/fix_mojibake.py`

Corrige codificação dupla UTF-8 (Latin-1/CP1252 interpretado incorretamente como UTF-8).

```bash
.venv/bin/python tools/fix_mojibake.py [--dry-run] <arquivo>
```

### `tools/rotate_admin_password.py`

Define uma senha admin temporária que deve ser trocada no próximo login.

```bash
NEW_ADMIN_PASSWORD=NovaSenha123 .venv/bin/python tools/rotate_admin_password.py
```

---

## Estrutura de Dados do Projeto

```json
{
  "name": "Projeto Exemplo",
  "description": "Descrição do projeto",
  "created_at": "2025-01-01T00:00:00",
  "elements": [
    {"id": 1, "nome": "OLT Central", "tipo": "olt", "status": "ativo", "lat": -16.82, "lng": -49.24, "draft": false}
  ],
  "connections": [
    {"id": 100, "from": 1, "to": 2, "porta": "1", "fibra": "1", "cor": "Azul", "broken": false, "length": 350, "waypoints": [], "draft": false}
  ],
  "dios": [
    {"id": "DIO-01", "name": "DIO Central", "capacity": 24, "ports": []}
  ],
  "incidents": [
    {"id": 300, "title": "Rompimento", "status": "open", "severity": "critical", "category": "rede", "element_id": 5, "comments": []}
  ],
  "positions": {"1": {"x": 100, "y": 200}},
  "cto_ports": {"7": [{"num": 1, "status": "livre", "client_id": null, "obs": ""}]},
  "geofences": [
    {"id": "f1", "name": "Zona Norte", "points": [{"lat": -16.8, "lng": -49.2}], "color": "#ff0000"}
  ],
  "maintenance": [
    {"id": "m1", "element_id": 1, "type": "preventiva", "scheduled_date": "2025-03-01", "description": "Inspeção"}
  ],
  "_nextId": 321
}
```

---

## Portas DIO/CTO — Status

| Status | DIO | CTO | Cor |
|---|:---:|:---:|---|
| `livre` | ✅ | ✅ | Cinza |
| `ocupada` | ✅ | ✅ | Verde |
| `manutencao` | ✅ | ✅ | Vermelho |
| `reservada` | ✅ | — | Laranja |
| `splitter` | — | ✅ | Roxo |

---

## Incidentes — Status e Severidade

| Status | Label | Severidade | Label |
|---|---|---|---|
| `open` | Aberto | `low` | Baixa |
| `in_progress` | Em andamento | `medium` | Média |
| `resolved` | Resolvido | `high` | Alta |
| `closed` | Fechado | `critical` | Crítica |

**Categorias**: rede, hardware, software, segurança, atendimento, outro

---

## FASE 4-7 — Recursos Avançados

Resumo das funcionalidades implementadas nas FASEs 4 a 7:

| FASE | Recurso | Destaques |
|---|---|---|
| 4.1 | Backup/Restore UI | ZIP com project.json + fotos, botões na toolbar |
| 4.2 | Histórico por Elemento | Filtro `entity_id` na auditoria, seção no painel lateral |
| 4.3 | Distância Automática do Cabo | Haversine com waypoints, auto-cálculo no modal |
| 4.4 | Pesquisa por Raio | Modo circular, slider 100-5000m, clique no mapa |
| 4.5 | Impressão/PDF | leaflet-image + jsPDF, captura canvas, A4 paisagem |
| 5.1 | Atenuação Óptica | Perda fibra/conector/splitter, TX +3dBm, warning/critical |
| 5.2 | Modo Rascunho | Campo `draft`, toggle, promover para real, visibilidade |
| 5.3 | Dashboard Avançado | Snapshots diários, sparklines 365 dias, ocupação CTO |
| 5.4 | Contagem CTO | Ocupação global e por projeto, seção na validação |
| 5.5 | Mapa de Calor | leaflet-heat.js, toggle, seletor de fonte |
| 6.1 | Notificações SSE | Stream com keepalive, pub/sub, auto-reconnect, toast |
| 6.2 | API Keys | Chaves `nm_`, CRUD, Bearer auth, bypass CSRF |
| 6.3 | Geocercas | Polígonos, point-in-polygon, elementos na cerca |
| 6.4 | Agendamento Manutenção | CRUD, upcoming, seção na sidebar |
| 7.1 | Gestão Postes | Campos específicos, inspeção, edição condicional |
| 7.2 | Comentários Incidentes | Timeline, autor/data, POST comments |
| 7.3 | Comparação Projetos | Grid diff, contagem por tipo, indicadores +/-/= |
| 7.4 | PWA/Offline | manifest.json, SW cache-first, instalável |

---

## Licença

Uso interno. Todos os direitos reservados.
