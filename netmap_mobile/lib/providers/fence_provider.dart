import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/models/fence.dart';
import 'package:netmap_mobile/services/api_service.dart';

class FenceProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  List<Fence> _fences = [];
  bool _isLoading = false;
  String? _error;

  List<Fence> get fences => _fences;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchFences(String pid) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(ApiConfig.projectFencesEndpoint(pid));
      final data = response.data;
      final List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map && data['items'] != null) {
        rawList = data['items'] as List;
      } else {
        rawList = [];
      }
      _fences = rawList.map((j) => Fence.fromJson(j as Map<String, dynamic>)).toList();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> addFence(String pid, Map<String, dynamic> data) async {
    try {
      final response = await _api.post(
        ApiConfig.projectFencesEndpoint(pid),
        data: data,
      );
      if (response.statusCode == 201) {
        final fence = Fence.fromJson(response.data as Map<String, dynamic>);
        _fences.add(fence);
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

  Future<bool> deleteFence(String pid, int fenceId) async {
    try {
      final response = await _api.delete(
        ApiConfig.projectFenceEndpoint(pid, fenceId),
      );
      if (response.statusCode == 200) {
        _fences.removeWhere((f) => f.id == fenceId);
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
