import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/models/maintenance.dart';
import 'package:netmap_mobile/services/api_service.dart';

class MaintenanceProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  List<Maintenance> _items = [];
  bool _isLoading = false;
  String? _error;

  List<Maintenance> get items => _items;
  List<Maintenance> get upcoming =>
      _items.where((m) => m.status != 'completed' && m.status != 'cancelled').toList();
  List<Maintenance> get past =>
      _items.where((m) => m.status == 'completed' || m.status == 'cancelled').toList();
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchMaintenance(String pid) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(ApiConfig.projectMaintenanceEndpoint(pid));
      final data = response.data;
      final List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map && data['items'] != null) {
        rawList = data['items'] as List;
      } else {
        rawList = [];
      }
      _items = rawList.map((j) => Maintenance.fromJson(j as Map<String, dynamic>)).toList();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> addMaintenance(String pid, Map<String, dynamic> data) async {
    try {
      final response = await _api.post(
        ApiConfig.projectMaintenanceEndpoint(pid),
        data: data,
      );
      if (response.statusCode == 201) {
        final item = Maintenance.fromJson(response.data as Map<String, dynamic>);
        _items.add(item);
        notifyListeners();
        return true;
      }
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
    return false;
  }

  Future<bool> updateMaintenance(String pid, int schedId, Map<String, dynamic> data) async {
    try {
      final response = await _api.put(
        ApiConfig.projectMaintenanceItemEndpoint(pid, schedId),
        data: data,
      );
      if (response.statusCode == 200) {
        final updated = Maintenance.fromJson(response.data as Map<String, dynamic>);
        final idx = _items.indexWhere((m) => m.id == schedId);
        if (idx >= 0) {
          _items[idx] = updated;
        }
        notifyListeners();
        return true;
      }
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
    return false;
  }

  Future<bool> deleteMaintenance(String pid, int schedId) async {
    try {
      final response = await _api.delete(
        ApiConfig.projectMaintenanceItemEndpoint(pid, schedId),
      );
      if (response.statusCode == 200) {
        _items.removeWhere((m) => m.id == schedId);
        notifyListeners();
        return true;
      }
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
    return false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
