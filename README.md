# ISP NetMap Pro

Aplicacao Flask para inventario, mapa geografico, topologia, cabos, DIO/CTO,
incidentes, clientes, auditoria e integracao IXC.

## Producao

O ambiente de producao usa:

- Gunicorn gerenciado por `systemd`;
- PostgreSQL com documentos JSONB versionados;
- backup diario em `/opt/NetMap/backups`;
- Leaflet e MarkerCluster hospedados localmente;
- segredos no arquivo `.env`, fora do Git.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
sudo cp deploy/netmap.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now netmap
```

O arquivo `.env` deve conter uma chave secreta forte, senha inicial aleatoria e
uma `DATABASE_URL` exclusiva. Nao existe senha administrativa padrao no codigo.

## Migracao JSON para PostgreSQL

Crie um backup de `data/`, configure `DATABASE_URL` e execute:

```bash
set -a
. ./.env
set +a
.venv/bin/python tools/migrate_to_postgres.py
```

Os arquivos JSON permanecem como copia de recuperacao. Em operacao normal, o
PostgreSQL passa a ser a fonte oficial dos dados.

## Testes

```bash
.venv/bin/pytest -m "not e2e"
```

Os testes reais de navegador verificam arrasto horizontal, tema escuro e layout
mobile:

```bash
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/playwright install chromium
NETMAP_E2E_URL=http://127.0.0.1:5005 \
NETMAP_E2E_USER=admin \
NETMAP_E2E_PASSWORD='senha-atual' \
.venv/bin/pytest -m e2e
```

## Desenvolvimento com JSON

Sem `DATABASE_URL`, a aplicacao usa arquivos JSON atomicos. Esse modo existe
para testes e desenvolvimento local, nao para execucao com multiplos workers.
