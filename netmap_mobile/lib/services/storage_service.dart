import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService extends ChangeNotifier {
  static final StorageService instance = StorageService._();
  late final FlutterSecureStorage _storage;

  static const _keyCookie = 'session_cookie';
  static const _keyUsername = 'last_username';
  static const _keyApiKey = 'api_key';
  static const _keyApiKeyBg = 'api_key_bg';
  static const _keyCsrfToken = 'csrf_token';
  static const _keyServerUrl = 'server_url';
  static const _keyRememberMe = 'remember_me';

  bool _initialized = false;
  StorageService._();

  static Future<void> init() async {
    if (instance._initialized) return;
    instance._storage = const FlutterSecureStorage();
    instance._initialized = true;
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
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyApiKeyBg, key);
    notifyListeners();
  }

  Future<String?> getApiKey() async {
    final key = await _storage.read(key: _keyApiKey);
    if (key != null) return key;
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyApiKeyBg);
  }

  Future<void> deleteApiKey() async {
    await _storage.delete(key: _keyApiKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyApiKeyBg);
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
    final serverUrl = await getServerUrl();
    await _storage.deleteAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyApiKeyBg);
    if (serverUrl != null && serverUrl.isNotEmpty) {
      await saveServerUrl(serverUrl);
    }
  }

  // Server URL
  Future<void> saveServerUrl(String url) async {
    await _storage.write(key: _keyServerUrl, value: url);
  }

  Future<String?> getServerUrl() async {
    return await _storage.read(key: _keyServerUrl);
  }

  Future<void> saveRememberMe(bool value) async {
    await _storage.write(key: _keyRememberMe, value: value ? '1' : '0');
  }

  Future<bool> getRememberMe() async {
    final v = await _storage.read(key: _keyRememberMe);
    return v == '1';
  }
}
