import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/models/auth_response.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/services/auth_service.dart';
import 'package:netmap_mobile/services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  AuthResponse? _authResponse;
  bool _isLoading = true;
  String? _error;

  AuthResponse? get authResponse => _authResponse;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _authResponse?.ok == true;
  String? get error => _error;
  String get username => _authResponse?.username ?? '';
  String get displayName => _authResponse?.nome ?? '';
  String get role => _authResponse?.role ?? 'viewer';
  bool get canEdit => _authResponse?.canEdit ?? false;

  AuthProvider() {
    _checkExistingSession();
  }

  Future<void> _checkExistingSession() async {
    _isLoading = true;
    notifyListeners();

    try {
      final cookie = await StorageService.instance.getCookie();
      if (cookie != null && cookie.isNotEmpty) {
        final hasSession = await _authService.checkSession();
        if (hasSession) {
          _authResponse = await _authService.me();
        }
      }
    } on ApiException {
      // Session expired or invalid — that's fine, user needs to login.
    } catch (_) {
      // Best-effort session restore.
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _authResponse = await _authService.login(username, password);
      await StorageService.instance.saveUsername(username);
      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _authResponse = null;
    _error = null;
    notifyListeners();
  }

  /// Clears transient error without changing auth state.
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
