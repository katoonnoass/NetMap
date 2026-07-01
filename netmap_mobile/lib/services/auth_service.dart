import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/models/auth_response.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/services/storage_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  /// Login via session cookie, then bootstrap an API key for Bearer auth.
  Future<AuthResponse> login(String username, String password) async {
    // 1. Login with user/pass to get session cookie
    final loginResponse = await _api.rawPost(
      ApiConfig.loginEndpoint,
      data: {'username': username, 'password': password},
    );

    final setCookie = loginResponse.headers.map['set-cookie'];
    if (setCookie != null && setCookie.isNotEmpty) {
      await StorageService.instance.saveCookie(setCookie.join('; '));
    }

    final authResp = AuthResponse.fromJson(
      loginResponse.data as Map<String, dynamic>,
    );
    if (!authResp.ok) return authResp;

    // 2. Get CSRF token needed to create API key
    final csrfResp = await _api.rawGet(ApiConfig.csrfTokenEndpoint);
    final csrfData = csrfResp.data as Map<String, dynamic>;
    final csrfToken = csrfData['csrf_token'] as String?;
    if (csrfToken != null) {
      await StorageService.instance.saveCsrfToken(csrfToken);
    }

    // 3. Create an API key for this mobile device
    bool hasApiKey = false;
    try {
      final keyResp = await _api.rawPost(
        ApiConfig.apikeysEndpoint,
        data: {
          'name': 'Mobile ${DateTime.now().toIso8601String().split('T')[0]}',
        },
        csrfToken: csrfToken,
      );
      if (keyResp.statusCode == 201 || keyResp.statusCode == 200) {
        final keyData = keyResp.data as Map<String, dynamic>;
        final apiKey = keyData['key'] as String?;
        if (apiKey != null) {
          await StorageService.instance.saveApiKey(apiKey);
          // Cookie no longer needed once we have the API key
          await StorageService.instance.deleteCookie();
          await StorageService.instance.deleteCsrfToken();
          hasApiKey = true;
        }
      }
    } catch (e) {
      // API key creation failed — continue with cookie + CSRF for reads
      debugPrint('AuthService: API key creation failed: $e');
    }

    return authResp.copyWith(usingApiKey: hasApiKey);
  }

  Future<AuthResponse?> checkSession() async {
    try {
      final response = await _api.get(ApiConfig.meEndpoint);
      final data = response.data as Map<String, dynamic>;
      return AuthResponse.fromJson({...data, 'ok': true});
    } on ApiException catch (e) {
      if (e.statusCode == 401) return null;
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
