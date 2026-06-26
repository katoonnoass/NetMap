import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static final StorageService instance = StorageService._();
  late final FlutterSecureStorage _storage;

  static const _keyCookie = 'session_cookie';
  static const _keyUsername = 'last_username';

  StorageService._();

  static Future<void> init() async {
    instance._storage = const FlutterSecureStorage();
  }

  Future<void> saveCookie(String cookie) async {
    await _storage.write(key: _keyCookie, value: cookie);
  }

  Future<String?> getCookie() async {
    return await _storage.read(key: _keyCookie);
  }

  Future<void> saveUsername(String username) async {
    await _storage.write(key: _keyUsername, value: username);
  }

  Future<String?> getUsername() async {
    return await _storage.read(key: _keyUsername);
  }

  Future<void> clear() async {
    await _storage.deleteAll();
  }
}
