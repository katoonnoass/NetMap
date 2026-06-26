# NetMap Mobile

Aplicativo Android para mapeamento de rede em campo.

## Pré-requisitos

- Flutter SDK >=3.0.0
- Android SDK (compileSdk 34)
- Servidor NetMap rodando (configurar IP em `lib/config/api_config.dart`)

## Setup

```bash
# Na primeira vez, gerar os arquivos de plataforma
flutter create --platforms=android .

# Instalar dependências
flutter pub get

# Rodar
flutter run
```

## Configuração

Edite `lib/config/api_config.dart` e altere `baseUrl` para o IP do servidor NetMap:

```dart
static const String baseUrl = 'http://SEU_IP:5005';
```

## Funcionalidades

- Login via sessão Flask do NetMap
- Lista de projetos com pull-to-refresh
- Mapa OpenStreetMap com pins coloridos por tipo de elemento
- Adicionar elemento tocando no mapa
- Editar elementos via bottom sheet
- Busca de endereço por CEP
- Localização GPS do técnico
- Modo de posicionamento rápido

## Estrutura

```
lib/
├── main.dart                 # Entry point
├── app.dart                  # Provider setup + AuthGate
├── config/
│   └── api_config.dart       # Endpoints da API
├── models/
│   ├── project.dart          # Projeto
│   ├── element.dart          # Elemento de rede
│   ├── auth_response.dart    # Resposta de login
│   └── address_result.dart   # Resultado de CEP
├── services/
│   ├── api_service.dart      # HTTP client (Dio)
│   ├── auth_service.dart     # Login/logout/sessão
│   └── storage_service.dart  # Secure storage
├── providers/
│   ├── auth_provider.dart    # Estado de autenticação
│   ├── project_provider.dart # Lista de projetos
│   └── element_provider.dart # Elementos do mapa
├── screens/
│   ├── login_screen.dart     # Tela de login
│   ├── project_list_screen.dart  # Lista de projetos
│   ├── map_screen.dart       # Mapa principal
│   └── element_form_screen.dart  # Formulário de elemento
└── widgets/
    ├── element_pin.dart      # Pin colorido no mapa
    ├── loading_overlay.dart  # Overlay de carregamento
    └── error_banner.dart     # Banner de erro
```
