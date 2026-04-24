# ISP NetMap Pro — Arquitetura Modular

## Como rodar

```bash
pip install -r requirements.txt
python run.py
```

Acesse: http://localhost:5000  
Login padrão: `admin` / `admin123`

---

## Estrutura de arquivos

```
isp_netmap_modular/
│
├── run.py                        # Ponto de entrada — inicia o servidor
│
├── requirements.txt
│
├── app/                          # Pacote principal da aplicação
│   ├── __init__.py               # Application Factory (create_app)
│   ├── config.py                 # Configurações (SECRET_KEY, caminhos, permissões)
│   │
│   ├── routes/                   # ★ Uma responsabilidade por arquivo
│   │   ├── auth.py               # /login, /api/auth/login|logout|me
│   │   ├── users.py              # /api/users (CRUD de usuários)
│   │   ├── projects.py           # /api/projects (CRUD + export + duplicar)
│   │   ├── elements.py           # /api/projects/<pid>/elements + positions
│   │   ├── connections.py        # /api/projects/<pid>/connections
│   │   ├── dios.py               # /api/projects/<pid>/dios + portas
│   │   ├── ctos.py               # /api/projects/<pid>/ctos/<id>/ports
│   │   └── static_files.py      # Serve vis-network.min.js com gzip
│   │
│   ├── services/                 # ★ Toda a lógica de negócio (sem Flask aqui)
│   │   ├── user_service.py       # Autenticação, CRUD de usuários, hash de senha
│   │   └── project_service.py   # CRUD de projetos, seed demo, slugify, next_id
│   │
│   └── utils/
│       └── auth.py               # Decorators: @require_login, @require_perm
│
├── data/                         # Persistência em JSON (sem banco de dados)
│   ├── users.json
│   └── projects/
│       └── *.json
│
├── static/
│   └── vis-network.min.js
│
└── templates/
    ├── index.html
    └── login.html
```

---

## Por que essa estrutura?

| Antes (monolito) | Depois (modular) |
|---|---|
| 1 arquivo `app.py` com ~350 linhas | Cada módulo tem ~30–80 linhas |
| Tudo misturado: rotas, lógica, dados | Separação clara: rota → service → dados |
| Difícil adicionar nova feature | Cria um novo arquivo em `routes/` |
| Difícil testar | Services podem ser testados sem Flask |
| Secret key hardcoded | Configuração centralizada em `config.py` |

---

## Como adicionar uma nova funcionalidade

**Exemplo: adicionar relatórios**

1. Crie `app/services/report_service.py` com a lógica
2. Crie `app/routes/reports.py` com as rotas
3. Registre o blueprint em `app/__init__.py`:
   ```python
   from .routes.reports import reports_bp
   app.register_blueprint(reports_bp)
   ```

Pronto. Os outros módulos não precisam ser tocados.

---

## Dados

Os dados ficam em `data/projects/<slug>.json`. Cada projeto é um arquivo JSON independente. Para migrar para banco de dados no futuro, basta reescrever apenas os `services/` — as rotas não mudam.
