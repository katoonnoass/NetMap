import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/models/cto_port.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/services/offline_service.dart';
import 'package:netmap_mobile/config/api_config.dart';

class CtoProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  String? _error;
  bool _isOnline = true;

  String? get error => _error;
  bool get isOnline => _isOnline;

  void setOnline(bool online) {
    _isOnline = online;
  }

  Future<List<CtoPort>> fetchCtoPorts(String pid, int ctoId) async {
    try {
      final response = await _api.get(ApiConfig.projectCtoPortsEndpoint(pid, ctoId));
      final List<dynamic> data = response.data is List
          ? response.data as List<dynamic>
          : (response.data['items'] as List<dynamic>? ?? []);
      return data.map((j) => CtoPort.fromJson(j as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<bool> updateCtoPort(
      String pid, int ctoId, int portNum, Map<String, dynamic> data) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.update,
        projectId: pid,
        endpoint: ApiConfig.projectCtoPortEndpoint(pid, ctoId, portNum),
        data: data,
      ));
      return true;
    }
    try {
      final response = await _api.put(
        ApiConfig.projectCtoPortEndpoint(pid, ctoId, portNum),
        data: data,
      );
      return response.statusCode == 200;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateDioPort(
      String pid, dynamic dioId, int portNum, Map<String, dynamic> data) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.update,
        projectId: pid,
        endpoint: ApiConfig.projectDioPortEndpoint(pid, dioId, portNum),
        data: data,
      ));
      return true;
    }
    try {
      final response = await _api.put(
        ApiConfig.projectDioPortEndpoint(pid, dioId, portNum),
        data: data,
      );
      return response.statusCode == 200;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateDio(
      String pid, dynamic dioId, Map<String, dynamic> data) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.update,
        projectId: pid,
        endpoint: ApiConfig.projectDioEndpoint(pid, dioId),
        data: data,
      ));
      return true;
    }
    try {
      final response = await _api.put(
        ApiConfig.projectDioEndpoint(pid, dioId),
        data: data,
      );
      return response.statusCode == 200;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> addSplitter(
      String pid, int ctoId, int portNum, String splitType) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.update,
        projectId: pid,
        endpoint: ApiConfig.projectCtoPortSplitEndpoint(pid, ctoId, portNum),
        data: {'type': splitType},
      ));
      return true;
    }
    try {
      final response = await _api.post(
        ApiConfig.projectCtoPortSplitEndpoint(pid, ctoId, portNum),
        data: {'type': splitType},
      );
      return response.statusCode == 200;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> removeSplitter(String pid, int ctoId, int portNum) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.delete,
        projectId: pid,
        endpoint: ApiConfig.projectCtoPortSplitEndpoint(pid, ctoId, portNum),
      ));
      return true;
    }
    try {
      final response = await _api.delete(
        ApiConfig.projectCtoPortSplitEndpoint(pid, ctoId, portNum),
      );
      return response.statusCode == 200;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
