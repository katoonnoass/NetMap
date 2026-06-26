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

  Future<void> fetchProjects() async {
    if (_isLoading) return;
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(ApiConfig.projectsEndpoint);
      final data = response.data;
      if (data is List) {
        _projects = data
            .map((j) => Project.fromJson(j as Map<String, dynamic>))
            .toList();
      } else if (data is Map<String, dynamic> && data.containsKey('projects')) {
        _projects = (data['projects'] as List)
            .map((j) => Project.fromJson(j as Map<String, dynamic>))
            .toList();
      } else if (data is Map<String, dynamic> && data.containsKey('items')) {
        _projects = (data['items'] as List)
            .map((j) => Project.fromJson(j as Map<String, dynamic>))
            .toList();
      } else {
        _projects = [];
      }
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
