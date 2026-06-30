import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService extends ChangeNotifier {
  static final StorageService instance = StorageService._();
  late final FlutterSecureStorage _storage;

  static const _keyCookie = 'session_cookie';
  static const _keyUsername = 'last_username';
  static const _keyApiKey = 'api_key';
  static const _keyCsrfToken = 'csrf_token';
  static const _keyServerUrl = 'server_url';
  static const _keySavedPassword = 'saved_password';
  static const _keyRememberMe = 'remember_me';

  StorageService._();

  static Future<void> init() async {
    instance._storage = const FlutterSecureStorage();
  }

  // Session cookie (used only during API key bootstrap)
  Future<void> saveCookie(String cookie) async {
    await _storage.write(key: _keyCookie, value: cookie);
  }

  Future<String?> getCookie() async {
    return await _storage.read(key: _keyCookie);
  }

  Future<void> deleteCookie() async {
    await _storage.delete(key: _keyCookie);
  }

  // API Key (Bearer token, CSRF bypass)
  Future<void> saveApiKey(String key) async {
    await _storage.write(key: _keyApiKey, value: key);
    notifyListeners();
  }

  Future<String?> getApiKey() async {
    return await _storage.read(key: _keyApiKey);
  }

  Future<void> deleteApiKey() async {
    await _storage.delete(key: _keyApiKey);
  }

  // CSRF token (used only during API key bootstrap)
  Future<void> saveCsrfToken(String token) async {
    await _storage.write(key: _keyCsrfToken, value: token);
  }

  Future<String?> getCsrfToken() async {
    return await _storage.read(key: _keyCsrfToken);
  }

  Future<void> deleteCsrfToken() async {
    await _storage.delete(key: _keyCsrfToken);
  }

  // Username (UX convenience)
  Future<void> saveUsername(String username) async {
    await _storage.write(key: _keyUsername, value: username);
  }

  Future<String?> getUsername() async {
    return await _storage.read(key: _keyUsername);
  }

  Future<void> clear() async {
    await _storage.deleteAll();
  }

  // Server URL
  Future<void> saveServerUrl(String url) async {
    await _storage.write(key: _keyServerUrl, value: url);
  }

  Future<String?> getServerUrl() async {
    return await _storage.read(key: _keyServerUrl);
  }

  // Saved credentials (remember me)
  Future<void> savePassword(String password) async {
    await _storage.write(key: _keySavedPassword, value: password);
  }

  Future<String?> getPassword() async {
    return await _storage.read(key: _keySavedPassword);
  }

  Future<void> deletePassword() async {
    await _storage.delete(key: _keySavedPassword);
  }

  Future<void> saveRememberMe(bool value) async {
    await _storage.write(key: _keyRememberMe, value: value ? '1' : '0');
  }

  Future<bool> getRememberMe() async {
    final v = await _storage.read(key: _keyRememberMe);
    return v == '1';
  }
}
