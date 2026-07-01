import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_response.freezed.dart';

@freezed
class AuthResponse with _$AuthResponse {
  const AuthResponse._();

  const factory AuthResponse({
    @Default(false) bool ok,
    @Default('') String username,
    @Default('') String nome,
    @Default('viewer') String role,
    @Default({}) Map<String, dynamic> permissions,
    @Default(false) bool passwordNeedsRotation,
    String? error,
    @Default(false) bool usingApiKey,
  }) = _AuthResponse;

  bool get canEdit => permissions['edit_elements'] == true;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      ok: json['ok'] as bool? ?? false,
      username: json['username'] as String? ?? '',
      nome: json['nome'] as String? ?? '',
      role: json['role'] as String? ?? 'viewer',
      permissions: json['permissions'] as Map<String, dynamic>? ?? {},
      passwordNeedsRotation: json['password_needs_rotation'] as bool? ?? false,
      error: json['error'] as String?,
    );
  }
}
