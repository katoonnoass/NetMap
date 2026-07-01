# Sessão — Mapa Offline (P2.4)

## O que foi feito

### P2.4 — Mapa Offline (flutter_map_tile_caching)

**Arquivos modificados:**

- **`main.dart`**: Corrigida inicialização do FMTC — `MapCachingManager.instance.initialise()` (API v8 inexistente) → `FMTCObjectBoxBackend().initialise()` (API v9.0.1 correta)

- **`map_screen.dart`**:
  - Removidas classes `_OsmTileProvider` e `_PlainTileProvider` (substituídas pelo `FMTCTileProvider` do FMTC)
  - Adicionado `FMTCStore('offline_map')` — store única para cache de tiles
  - `TileLayer` agora usa `store.getTileProvider()` com `FMTCTileProviderSettings(behavior: CacheBehavior.cacheFirst)` — cache transparente para as 3 camadas (OSM, satélite, dark)
  - Drawer: item **"Mapa Offline"** com subtítulo exibindo status do cache (ex: "342 tiles, 12.3 MB")
  - Diálogo de download: seleção de zoom mínimo (5–14) e máximo (11–18), área baseada no viewport atual, validação min < max
  - Diálogo de progresso: `LinearProgressIndicator`, percentual, tiles baixados/falhas/pulados, total, velocidade (t/s), botão cancelar
  - Ao concluir: stats do store são atualizados automaticamente no drawer

### Fix adicional (main.dart)
- Troca de `MapCachingManager.instance.initialise()` (não existe em FMTC 9.0.1) por `FMTCObjectBoxBackend().initialise()` — API correta do FMTC v9

## Resultados da verificação

| Comando | Resultado |
|---|---|
| `flutter analyze` | **0 erros** (5 warnings preexistentes, 109 infos) |
| `flutter test` | **34/34 passando** |

## Pendências (não implementadas)

### P2.5 — Push Notifications (FCM)
- **Status:** Bloqueado
- **Motivo:** Requer Firebase project + `google-services.json` + `GoogleService-Info.plist`
- **Próximo passo:** Criar projeto Firebase, adicionar Android/iOS apps, baixar configs, implementar `firebase_messaging`

### P2.8 — Gerar cliente Dart OpenAPI
- **Status:** Bloqueado
- **Motivo:** Requer backend Flask servindo `/openapi.json`
- **Próximo passo:** Verificar endpoint OpenAPI no backend, gerar cliente com `openapi-generator`
