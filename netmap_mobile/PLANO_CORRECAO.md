# Plano de Correção — NetMap Mobile

## 1. Problemas de Compilação (CRÍTICO)

### 1.1 Arquivos faltantes
| # | Arquivo | Dependências | Ação |
|---|---------|-------------|------|
| 1 | `lib/config/element_types.dart` | Nenhuma | Criar com constantes de tipos, cores, ícones |
| 2 | `lib/services/offline_service.dart` | `shared_preferences` | Criar fila offline com persistência local |
| 3 | `lib/services/report_service.dart` | `pdf`, `share_plus`, `path_provider` | Criar gerador de PDF/CSV |
| 4 | `lib/screens/incident_form_screen.dart` | Providers, models | Criar formulário de incidente |
| 5 | `lib/widgets/photo_grid.dart` | `cached_network_image` | Criar grid de fotos com delete |

### 1.2 Endpoints faltantes em `api_config.dart`
- Adicionar `projectIncidentsEndpoint`, `projectIncidentEndpoint`, `projectIncidentCommentsEndpoint`

## 2. Problemas de Runtime (CRÍTICO)

### 2.1 CSRF Token — Migrar para API Key Bearer
- **Problema**: Flask exige CSRF para sessão; app mobile nunca envia
- **Solução**: Gerar/armazenar API Key (`nm_`) e usar `Authorization: Bearer` em todas as requisições
- **Arquivos**: `api_service.dart`, `auth_service.dart`, `storage_service.dart`

### 2.2 Offline não funcional
- **Problema**: `IncidentProvider` tem flag `_isOnline` mas OfflineService não existe
- **Solução**: Implementar OfflineService com fila persistente + sincronização

### 2.3 ElementProvider sem suporte offline
- **Problema**: `ElementProvider` não trata offline
- **Solução**: Adicionar fallback offline + fila de sincronização

## 3. Funcionalidades Faltantes para Campo

### 3.1 Marcar cabo como rompido (ALTA)
- Botão no bottom sheet do elemento com ação rápida
- Endpoint: `PUT /api/projects/<pid>/connections/<cid>` com `broken: true`

### 3.2 Medição de sinal óptico (ALTA)
- Formulário com campos: potência TX/RX, atenuação, foto do OTDR
- Vínculo ao elemento e ao incidente, se aplicável

### 3.3 Criar incidente do mapa (ALTA)
- Botão "Criar incidente" no bottom sheet do elemento
- Pré-preenche element_id, project_id

### 3.4 Exclusão de elementos (ALTA)
- Botão "Excluir" no bottom sheet com confirmação
- Feedback visual após exclusão

### 3.5 Checklist de instalação (MÉDIA)
- Template de checklist: splitter, porta CTO, potência, fotos
- Geração de PDF ao finalizar

### 3.6 QR Code scanner (MÉDIA)
- Ler código do equipamento para preencher formulário
- Usar `mobile_scanner` package

### 3.7 Layer de satélite no mapa (MÉDIA)
- Botão toggle entre OSM, Satélite (Esri), Dark

### 3.8 Navegação entre telas (MÉDIA)
- Drawer/bottom nav com: Mapa, Elementos, Incidentes, Cabos

## Ordem de Implementação

```
FASE 1 — Compilação (itens 1.1 + 1.2)
  ├── element_types.dart
  ├── offline_service.dart
  ├── report_service.dart
  ├── incident_form_screen.dart
  ├── photo_grid.dart
  └── api_config.dart (endpoints)

FASE 2 — Runtime (itens 2.1 + 2.2 + 2.3)
  ├── CSRF → Bearer API Key
  ├── OfflineService completo
  └── ElementProvider offline

FASE 3 — Campo (itens 3.1 a 3.8)
  ├── Cabo rompido
  ├── Medição sinal
  ├── Incidente do mapa
  ├── Exclusão elemento
  ├── Checklist
  ├── QR Code
  ├── Satélite
  └── Navegação
```
