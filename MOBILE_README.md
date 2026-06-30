# NetMap Mobile — App Flutter para Tecnicos em Campo

## Estrutura do Projeto

```
netmap_mobile/
├── android/                    # Configuracao Android (Gradle, manifest, icones)
├── lib/
│   ├── config/
│   │   ├── api_config.dart         # Endpoints da API, baseUrl dinamica
│   │   └── element_types.dart      # Tipos de elementos, cores, icones, labels
│   ├── models/
│   │   ├── auth_response.dart      # Resposta de autenticacao
│   │   ├── connection.dart         # Modelo de cabo/conexao
│   │   ├── cto_port.dart           # Porta de CTO
│   │   ├── element.dart            # Elemento de rede (OLT, CTO, DIO, etc.)
│   │   ├── incident.dart           # Incidente + comentarios
│   │   └── project.dart            # Projeto
│   ├── providers/
│   │   ├── auth_provider.dart      # Estado de autenticacao
│   │   ├── element_provider.dart   # CRUD elementos, conexoes, portas CTO, sinal
│   │   ├── fence_provider.dart     # Geocercas
│   │   ├── incident_provider.dart  # Incidentes
│   │   ├── maintenance_provider.dart # Manutencao agendada
│   │   └── project_provider.dart   # Lista de projetos
│   ├── screens/
│   │   ├── login_screen.dart       # Tela de login com configuracao de servidor
│   │   ├── project_list_screen.dart # Lista de projetos com busca e criacao
│   │   ├── map_screen.dart         # Mapa principal (FlutterMap + marcadores)
│   │   ├── cable_screen.dart       # Gerenciamento de cabos/conexoes
│   │   ├── element_form_screen.dart # Formulario de elemento
│   │   ├── element_list_screen.dart # Lista de elementos
│   │   ├── element_history_screen.dart # Historico de auditoria
│   │   ├── incident_list_screen.dart # Lista de incidentes
│   │   ├── incident_form_screen.dart # Formulario de incidente
│   │   ├── qr_scanner_screen.dart  # Leitor QR Code
│   │   ├── cto_port_edit_screen.dart # Edicao de portas CTO
│   │   ├── cto_clients_screen.dart  # Clientes conectados ao CTO
│   │   ├── trace_screen.dart       # Caminho otico
│   │   ├── dashboard_screen.dart   # Dashboard do projeto
│   │   ├── dio_panel_screen.dart   # Painel DIO
│   │   ├── maintenance_screen.dart # Agenda de manutencao
│   │   ├── project_compare_screen.dart # Comparacao de projetos
│   │   ├── geodata_screen.dart     # GeoData, backup, restore, export
│   │   └── ixc_screen.dart        # Integracao IXC
│   ├── services/
│   │   ├── api_service.dart        # Cliente HTTP (Dio) com interceptors
│   │   ├── auth_service.dart       # Fluxo de autenticacao (login + API key)
│   │   ├── offline_service.dart    # Fila offline para operacoes sem internet
│   │   └── storage_service.dart    # Armazenamento seguro (FlutterSecureStorage)
│   ├── widgets/
│   │   ├── element_pin.dart        # Marcador visual no mapa por tipo
│   │   ├── loading_overlay.dart    # Overlay de carregamento
│   │   ├── photo_grid.dart         # Grade de fotos
│   │   ├── error_banner.dart       # Banner de erro
│   │   ├── signal_measurement_dialog.dart # Dialog de medicao de sinal
│   │   └── service_checklist.dart  # Checklist de servico
│   ├── app.dart                    # MaterialApp, providers, tema
│   └── main.dart                   # Ponto de entrada (inicializacao)
├── pubspec.yaml
└── README.md
```

## Funcionalidades (21 implementadas)

| # | Funcionalidade | Status |
|---|---------------|--------|
| 1 | Mapa com OpenStreetMap, Satelite Esri, Dark Esri | ✅ |
| 2 | CRUD elementos (OLT, CTO, DIO, Splitter, Cliente, etc.) | ✅ |
| 3 | Gerenciamento de cabos/conexoes (criar, editar, romper) | ✅ |
| 4 | Portas CTO com ocupacao, splitter, clientes | ✅ |
| 5 | Painel DIO | ✅ |
| 6 | Incidentes com comentarios e fotos | ✅ |
| 7 | Leitura de QR Code para localizar elementos | ✅ |
| 8 | Caminho otico (trace) | ✅ |
| 9 | Medicao de sinal otico | ✅ |
| 10 | Geocercas | ✅ |
| 11 | Dashboard do projeto | ✅ |
| 12 | Agenda de manutencao | ✅ |
| 13 | Comparacao entre projetos | ✅ |
| 14 | Historico de auditoria por elemento | ✅ |
| 15 | Upload de fotos offline com fila | ✅ |
| 16 | GeoData: backup, restore, export KML | ✅ |
| 17 | Integracao IXC (sincronizar) | ✅ |
| 18 | Modo rascunho (filtrar elementos draft) | ✅ |
| 19 | Pesquisa por raio (elementos num raio km) | ✅ |
| 20 | Calculo de atenuacao | ✅ |
| 21 | Login com API Key (Bearer) + CSRF bypass | ✅ |

## Autenticacao

O app usa **API Key (Bearer token, prefixo `nm_`)** para autenticar todas as requisicoes apos o login. O fluxo e:

1. `POST /api/auth/login` — usuario/senha → session cookie
2. `GET /api/auth/csrf-token` — obtem token CSRF
3. `POST /api/apikeys` — cria chave API (com CSRF token)
4. Todas as requisicoes subsequentes usam `Authorization: Bearer nm_...`

### CSRF

O servidor tem protecao CSRF para endpoints de mutacao (POST/PUT/DELETE). O app:
- Envia API Key (`Bearer`) que **bypasseia** a verificacao CSRF
- Caso nao tenha API Key, envia cookie + token CSRF no header `X-CSRFToken`
- Se receber erro CSRF (400), faz retry automatico renovando o token

## Configuracao do Servidor

O usuario pode configurar a URL do servidor diretamente no app (icone de engrenagem na tela de login):

- Aceita IP: `192.168.1.134:5005`
- Aceita dominio: `netmap.meuservidor.com`
- Aceita DNS: `mapa.rede.local`
- URL e persistida no SecureStorage
- Ao trocar, o estado de autenticacao e limpo e o singleton do ApiService e reiniciado

## Offline First

- Operacoes sem internet sao enfileiradas no `OfflineService` (SharedPreferences)
- Ao reconectar, a fila e sincronizada automaticamente
- Suporta: criar/atualizar/deletar elementos, incidentes, portas CTO

## Alteracoes Realizadas (Sessao 2026-06-30)

### Correcoes de Bugs
1. **Nomes de projetos vazios** — Servidor retorna `name`, app lia `nome`. Adicionado fallback.
2. **Login silencioso** — `AuthProvider.login()` nao setava `_error` quando `authResp.ok == false`.
3. **CSRF em elementos** — Interceptor do Dio nao enviava token CSRF em POST/PUT/DELETE quando sem API Key.
4. **setState apos pop** — `ElementFormScreen._salvar()` chamava `setState` depois de `Navigator.pop`.
5. **Loading duplicado** — Overlay full-screen + spinner no botao no formulario de elemento.

### Melhorias de UX
6. **Configuracao de servidor** — Dialogo na tela de login para alterar URL (IP, dominio, DNS).
7. **Lembrar credenciais** — Checkbox "Lembrar credenciais" salva usuario/senha criptografados.
8. **Logo customizado** — Icone vetorial de rede (nos conectados) substituindo `Icons.network_check`.
9. **Icone do app** — Adaptive icon Android com fundo azul e icone de rede.
10. **Overflow na AppBar** — 8 icones movidos para menu `⋮`, apenas 2 na AppBar principal.
11. **Teclado** — Login fecha teclado ao tocar fora.
12. **Shimmer** — Substituido spinner infinito por `CircularProgressIndicator`.

### Novas Funcionalidades
13. **Gerenciamento de Cabos** — Nova tela `CableScreen`: listar, criar, editar, romper/recuperar, deletar conexoes.
14. **Criar Projeto** — FAB `+` na lista de projetos com dialogo de nome + descricao.
15. **CSRF Retry** — Interceptor com retry automatico ao receber erro CSRF 400.

### Performance
16. **TileProvider caching** — Providers de tile sao singletons, evitando recriacao.
17. **Consumer no mapa** — Uso de `Consumer<ElementProvider>` + `RepaintBoundary` para evitar rebuild completo.
18. **Marcadores** — Formatos variados por tipo de elemento (circulo, retangulo, losango).

### Servidor (backend)
19. **load_dotenv()** — Adicionado `python-dotenv` para carregar `.env` automaticamente.
20. **Admin password** — Resetado users.json para usar `DEFAULT_ADMIN_PASSWORD` do `.env`.

## Build e Instalacao

```bash
# Debug APK (para teste)
cd netmap_mobile
flutter build apk --debug --android-skip-build-dependency-validation
adb install -r build/app/outputs/flutter-apk/app-debug.apk

# Release APK (requer keystore)
flutter build apk --release
```

> Nota: O aviso "16 KB page size" aparece apenas em APK debug. Compilar release resolve.

## Credenciais Padrao

- **Usuario:** admin
- **Senha:** AdminTest@12345

## Dependencias Principais

| Pacote | Versao | Uso |
|--------|--------|-----|
| flutter_map | ^6.1.0 | Renderizacao de mapas (OSM, Esri) |
| latlong2 | ^0.9.0 | Coordenadas geographicas |
| dio | ^5.4.0 | Cliente HTTP com interceptors |
| provider | ^6.1.1 | Gerenciamento de estado |
| flutter_secure_storage | ^9.0.0 | Armazenamento seguro (API key, cookie) |
| geolocator | ^11.0.0 | GPS e localizacao |
| mobile_scanner | ^5.2.0 | Leitura QR Code |
| image_picker | ^1.0.7 | Captura de fotos |
| url_launcher | ^6.2.0 | Abrir mapas externos |
