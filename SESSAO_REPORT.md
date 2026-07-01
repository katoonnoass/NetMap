# Relatório Completo — NetMap Mobile

## 1. Plano Original de Correção

### FASE 1 — Compilação
| # | Item | Status |
|---|------|--------|
| 1.1 | Arquivos faltantes (`element_types.dart`, `offline_service.dart`, `report_service.dart`, `incident_form_screen.dart`, `photo_grid.dart`) | ✅ Concluído |
| 1.2 | Endpoints faltantes em `api_config.dart` | ✅ Concluído |

### FASE 2 — Runtime
| # | Item | Status |
|---|------|--------|
| 2.1 | CSRF Token → Migrar para API Key Bearer | ✅ Concluído |
| 2.2 | Offline não funcional — OfflineService com fila persistente | ✅ Concluído |
| 2.3 | ElementProvider sem suporte offline | ✅ Concluído |

### FASE 3 — Campo
| # | Item | Status |
|---|------|--------|
| 3.1 | Marcar cabo como rompido | ✅ Concluído |
| 3.2 | Medição de sinal óptico | ✅ Concluído |
| 3.3 | Criar incidente do mapa | ✅ Concluído |
| 3.4 | Exclusão de elementos | ✅ Concluído |
| 3.5 | Checklist de instalação | ✅ Concluído |
| 3.6 | QR Code scanner | ✅ Concluído |
| 3.7 | Layer de satélite no mapa | ✅ Concluído |
| 3.8 | Navegação entre telas (Drawer + BottomNav) | ✅ Concluído |

---

## 2. Plano Expandido (P0/P1/P2)

### P0 — Crítico (Segurança e Estabilidade)
| # | Item | Status | Detalhes |
|---|------|--------|----------|
| P0.1 | Remover armazenamento de senha em texto plano | ✅ | `StorageService` não persiste senha |
| P0.2 | Race condition restore sessão | ✅ | AuthService trata `loading` + `mounted` |
| P0.3 | OfflineService com retry/backoff + dead letter | ✅ | 3 tentativas máx, move para dead letter |
| P0.4 | Validação URL do servidor | ✅ | `server_url` validada antes de salvar |
| P0.5 | Upload duplicado de fotos | ✅ | `photoPath` removido após upload bem-sucedido |
| P0.6 | `StorageService.clear()` preserva `server_url` | ✅ | Re-salva `server_url` após `deleteAll` |

### P1 — Qualidade (Manutenibilidade)
| # | Item | Status | Detalhes |
|---|------|--------|----------|
| P1.1 | Testes unitários OfflineService | ✅ | 9 testes: enqueue, persist, syncAll, retry |
| P1.2 | Testes unitários Models + ApiException | ✅ | 18 testes models + 5 testes api_service |
| P1.3 | Split ElementProvider (god object) | ✅ | → `ConnectionProvider` (146 linhas) + `CtoProvider` (173 linhas) |
| P1.4 | Migrar modelos para freezed | ✅ | 9 modelos com `@freezed`: `Project`, `NetmapElement`, `Connection`, `AuthResponse`, `Incident`, `CtoPort`, `Fence`, `AddressResult`, `Maintenance` |
| P1.5 | GoRouter rotas tipadas | ✅ | `/login`, `/projects`, `/project/:pid` com guarda de autenticação |
| P1.6 | ApiService error parsing robusto | ✅ | `_extractMessage()` extrai erro de múltiplas estruturas |
| P1.7 | AuthService trata falha criação API key | ✅ | Tratamento de `ApiException` no bootstrap |
| P1.8 | ProjectProvider normaliza response | ✅ | Trata lista direta e `{'items': [...]}` |
| P1.9 | CI/CD workflow | ✅ | `.github/workflows/mobile-ci.yml` — analyze + test --coverage |
| P1.10 | DI com GetIt | ✅ | `service_locator.dart` com `ApiService`, `StorageService`, `OfflineService` |

### P2 — UX/Campo
| # | Item | Status | Detalhes |
|---|------|--------|----------|
| P2.1 | OfflineSyncIndicator widget | ✅ | Badge + diálogo com opção de sync + conflitos |
| P2.2 | Background sync WorkManager | ✅ | `callbackDispatcher` + `registerPeriodicTask` a cada 15 min |
| P2.3 | Detecção e resolução de conflitos 409 | ✅ | `ConflictOp`, `ConflictResolutionScreen`, indicador vermelho |
| P2.4 | Mapa Offline (cache de tiles) | ✅ | `flutter_map_tile_caching 9.0.1`, `FMTCTileProvider`, download UI com progresso |
| P2.5 | Push Notifications FCM | ❌ Bloqueado | Requer Firebase project + config files |
| P2.6 | Acessibilidade (tooltips/semantics) | ✅ | Tooltips em todos IconButtons/FABs, Semantics no botão excluir foto |
| P2.7 | Logger + LogInterceptor | ✅ | `logger` package + `LogInterceptor` no Dio (sem headers de auth) |
| P2.8 | Gerar cliente Dart OpenAPI | ❌ Bloqueado | Requer backend servindo `/openapi.json` |
| — | iOS fallback: API key no SharedPreferences | ✅ | Mirror `api_key` para `api_key_bg` para background sync no iOS |

---

## 3. Estrutura Atual do Projeto

```
netmap_mobile/
├── lib/
│   ├── config/
│   │   ├── api_config.dart              # Endpoints, timeouts, URL base
│   │   └── element_types.dart           # Constantes: tipos, cores, ícones
│   ├── di/
│   │   └── service_locator.dart         # GetIt DI (ApiService, StorageService, OfflineService)
│   ├── models/
│   │   ├── address_result.dart          # @freezed
│   │   ├── auth_response.dart           # @freezed
│   │   ├── connection.dart              # @freezed
│   │   ├── cto_port.dart                # @freezed
│   │   ├── element.dart                 # @freezed
│   │   ├── fence.dart                   # @freezed
│   │   ├── incident.dart                # @freezed
│   │   ├── maintenance.dart             # @freezed
│   │   ├── project.dart                 # @freezed
│   │   ├── *.freezed.dart               # Gerado por build_runner
│   │   └── *.g.dart                     # Gerado por build_runner
│   ├── providers/
│   │   ├── auth_provider.dart           # Login/logout, permissões
│   │   ├── element_provider.dart        # CRUD elementos (322 linhas — god object resolvido)
│   │   ├── connection_provider.dart     # Cabos, toggle broken, offline-first (130 linhas)
│   │   ├── cto_provider.dart            # Portas CTO/DIO, splitters, offline-first (160 linhas)
│   │   ├── fence_provider.dart          # Geocercas
│   │   └── project_provider.dart        # Lista de projetos
│   ├── routes/
│   │   └── app_router.dart              # GoRouter: /login, /projects, /project/:pid
│   ├── screens/
│   │   ├── login_screen.dart            # Login com API key bootstrap
│   │   ├── project_list_screen.dart     # Lista de projetos
│   │   ├── map_screen.dart              # Mapa principal + offline download (1138 linhas)
│   │   ├── element_form_screen.dart     # Criar/editar elemento
│   │   ├── element_list_screen.dart     # Lista de elementos
│   │   ├── element_history_screen.dart  # Histórico do elemento
│   │   ├── incident_list_screen.dart    # Lista de incidentes
│   │   ├── incident_form_screen.dart    # Criar/editar incidente
│   │   ├── incident_detail_screen.dart  # Detalhe do incidente
│   │   ├── conflict_resolution_screen.dart  # Resolver conflitos 409
│   │   ├── cable_screen.dart            # Gerenciar cabos
│   │   ├── cto_clients_screen.dart      # Clientes CTO
│   │   ├── cto_port_edit_screen.dart    # Editar portas CTO
│   │   ├── dio_panel_screen.dart        # Painel DIO
│   │   ├── trace_screen.dart            # Caminho óptico
│   │   ├── dashboard_screen.dart        # Dashboard do projeto
│   │   ├── maintenance_screen.dart      # Agenda manutenção
│   │   ├── geodata_screen.dart          # GeoData & Backup
│   │   ├── ixc_screen.dart              # Integração IXC
│   │   ├── qr_scanner_screen.dart       # QR Code scanner
│   │   └── project_compare_screen.dart  # Comparar projetos
│   ├── services/
│   │   ├── api_service.dart             # Dio com Bearer/Cookie + LogInterceptor
│   │   ├── auth_service.dart            # Login CSRF → API key bootstrap
│   │   ├── storage_service.dart         # FlutterSecureStorage + SharedPreferences (dual)
│   │   ├── offline_service.dart         # Fila offline, dead letter, conflitos
│   │   └── background_sync.dart         # WorkManager callback dispatcher
│   ├── utils/
│   │   └── logger.dart                  # Logger global (PrettyPrinter)
│   ├── widgets/
│   │   ├── element_pin.dart             # Marcador do mapa
│   │   ├── loading_overlay.dart         # Overlay de carregamento
│   │   ├── photo_grid.dart              # Grid de fotos com delete
│   │   ├── signal_measurement_dialog.dart  # Medição de sinal
│   │   ├── service_checklist.dart       # Checklist de instalação
│   │   └── offline_sync_indicator.dart  # Badge de sync + conflitos
│   ├── app.dart                         # MultiProvider + GoRouter
│   └── main.dart                        # Init: WorkManager, FMTC, Storage, DI
├── test/
│   ├── api_service_test.dart            # 5 testes: ApiException
│   ├── models_test.dart                 # 18 testes: todos os modelos freezed
│   ├── offline_service_test.dart        # 9 testes: fila, persist, sync
│   └── widget_test.dart                 # 2 testes: smoke test
├── pubspec.yaml                         # 31 dependências
├── PLANO_CORRECAO.md
└── SESSAO_REPORT.md
```

---

## 4. Fluxos Implementados

### 4.1 Autenticação
```
Login → GET /api/csrf/ (cookie)
      → POST /api/auth/login (CSRF token)
      → POST /api/apikeys (Bearer) → salva api_key
      → DELETE cookie
      → Próximas requests: Authorization: Bearer nm_xxx
```

### 4.2 Offline-First
```
Ação do usuário → Provider verifica _isOnline
  ├── Online → API direta (PUT/POST/DELETE)
  └── Offline → enfileira OfflineOp → update otimista local
                ↓
           Sync automático (setOnline)
           Background sync (WorkManager a cada 15 min)
                ↓
           syncAll():
             ├── Sucesso → remove da fila
             ├── 409 → ConflictOp → tela de resolução
             └── Erro → retry (max 3) → dead letter
```

### 4.3 Mapa Offline
```
Drawer > "Mapa Offline"
  → Diálogo: bounds atuais + zoom min/max
  → Iniciar download → FMTCStore.download.startForeground()
  → Progresso: barra, %, tiles/s, cancelar
  → Concluído: stats no drawer
  → TileLayer: CacheBehavior.cacheFirst
    ├── Cache hit → tile local (sem rede)
    ├── Cache miss + online → baixa e armazena
    └── Cache miss + offline → fallback (transparente)
```

---

## 5. Verificações

| Comando | Resultado |
|---------|-----------|
| `flutter analyze` | **0 erros**, 5 warnings (preexistentes `@JsonKey`), ~109 infos |
| `flutter test` | **34/34 passando** |

- Models test: 18 ✅
- OfflineService test: 9 ✅
- ApiService test: 5 ✅
- Widget smoke test: 2 ✅

---

## 6. Pendências

### P2.5 — Push Notifications FCM (❌ Bloqueado)
- **Motivo:** Requer Firebase project + `google-services.json` + `GoogleService-Info.plist`
- **Dependências a adicionar:** `firebase_messaging`, `firebase_core`
- **Próximo passo:** Criar projeto Firebase, configurar Android/iOS, implementar `FirebaseMessaging.onMessage`

### P2.8 — Gerar cliente Dart OpenAPI (❌ Bloqueado)  
- **Motivo:** Requer backend Flask servindo `/openapi.json`
- **Ferramenta:** `openapi-generator` CLI
- **Próximo passo:** Verificar endpoint OpenAPI no backend Flask, gerar e integrar cliente

---

## 7. Decisões Arquiteturais

| Decisão | Justificativa |
|---------|---------------|
| `@freezed` para modelos | `copyWith`/`==`/`hashCode`/`toString` gerados, `fromJson`/`toJson` automáticos |
| GoRouter + Navigator.push coexistindo | Sub-telas (formulários, detalhes) usam `Navigator.push` — GoRouter gerencia apenas rotas principais |
| DI com GetIt em vez de Provider | Testabilidade: `ApiService` factory checa GetIt primeiro, permite mock |
| `SharedPreferences` para fila offline | `FlutterSecureStorage` pode falhar em background no iOS com dispositivo bloqueado |
| iOS fallback: chave `api_key_bg` | Background sync no iOS acessa `SharedPreferences` diretamente |
| CacheBehavior.cacheFirst | Prioriza performance offline sem bloquear atualizações online |
| Conflitos 409: last-write-wins simples | Backend não expõe diff estruturado — usuário decide manter local ou aceitar servidor |
| Logger sem headers de autenticação | Segurança: `requestHeader: false` no `LogInterceptor` |
| WorkManager 15 min + NetworkType.connected | Economia de bateria, sincroniza apenas quando há conectividade |
