import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/models/project.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/config/api_config.dart';

class ProjectProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<Project> _projects = [];
  bool _isLoading = false;
  String? _error;

  List<Project> get projects => _projects;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Normaliza resposta da API, extraindo lista independente do formato
  List<dynamic> _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map<String, dynamic>) {
      if (data.containsKey('items') && data['items'] is List) return data['items'] as List;
      if (data.containsKey('projects') && data['projects'] is List) return data['projects'] as List;
    }
    return [];
  }

  Future<void> fetchProjects() async {
    if (_isLoading) return;
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(ApiConfig.projectsEndpoint);
      final rawList = _extractList(response.data);
      _projects = rawList
          .map((j) => Project.fromJson(j as Map<String, dynamic>))
          .toList();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> fetchProjectAll(String pid) async {
    try {
      final response = await _api.get(ApiConfig.projectAllEndpoint(pid));
      return response.data as Map<String, dynamic>?;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return null;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
