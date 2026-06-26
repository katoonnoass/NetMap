import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/models/auth_response.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/services/storage_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<AuthResponse> login(String username, String password) async {
    final response = await _api.post(
      ApiConfig.loginEndpoint,
      data: {'username': username, 'password': password},
    );

    final cookie = response.headers.map['set-cookie'];
    if (cookie != null && cookie.isNotEmpty) {
      await StorageService.instance.saveCookie(cookie.join('; '));
    }

    return AuthResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AuthResponse?> me() async {
    final response = await _api.get(ApiConfig.meEndpoint);
    final data = response.data as Map<String, dynamic>;
    // /api/auth/me does not include "ok" top-level; wrap it.
    return AuthResponse.fromJson({...data, 'ok': true});
  }

  Future<bool> checkSession() async {
    try {
      await _api.get(ApiConfig.meEndpoint);
      return true;
    } on ApiException catch (e) {
      if (e.statusCode == 401) {
        return false;
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _api.post(ApiConfig.logoutEndpoint);
    } finally {
      await StorageService.instance.clear();
    }
  }
}
