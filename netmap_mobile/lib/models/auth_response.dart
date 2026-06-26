class AuthResponse {
  final bool ok;
  final String username;
  final String nome;
  final String role;
  final Map<String, dynamic> permissions;
  final bool passwordNeedsRotation;

  AuthResponse({
    required this.ok,
    required this.username,
    required this.nome,
    required this.role,
    required this.permissions,
    this.passwordNeedsRotation = false,
  });

  bool get canEdit => permissions['edit_elements'] == true;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      ok: json['ok'] as bool? ?? false,
      username: json['username'] as String? ?? '',
      nome: json['nome'] as String? ?? '',
      role: json['role'] as String? ?? 'viewer',
      permissions:
          json['permissions'] as Map<String, dynamic>? ?? {},
      passwordNeedsRotation:
          json['password_needs_rotation'] as bool? ?? false,
    );
  }
}
