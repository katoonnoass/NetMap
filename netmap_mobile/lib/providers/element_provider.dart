import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/models/element.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/services/offline_service.dart';
import 'package:netmap_mobile/config/api_config.dart';

class ElementProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<NetmapElement> _elements = [];
  bool _isLoading = false;
  String? _error;
  bool _isOnline = true;

  List<NetmapElement> get elements => _elements;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isOnline => _isOnline;

  void setOnline(bool online) {
    _isOnline = online;
  }

  List<NetmapElement> get elementsWithCoords =>
      _elements.where((e) => e.hasCoords).toList();

  List<NetmapElement> get elementsWithoutCoords =>
      _elements.where((e) => !e.hasCoords).toList();

  List<NetmapElement> elementsByType(String tipo) =>
      _elements.where((e) => e.tipo == tipo).toList();

  Future<void> fetchElements(String pid) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(ApiConfig.projectElementsEndpoint(pid));
      final raw = response.data;
      final items = raw is List ? raw : (raw['items'] as List<dynamic>? ?? []);
      _elements = items
          .map((j) => NetmapElement.fromJson(j as Map<String, dynamic>,
              projetoId: pid))
          .toList();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  // ─── Audit / History ────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> fetchElementHistory(
      String pid, int entityId) async {
    try {
      final response = await _api.get(
        ApiConfig.projectAuditEndpoint(pid, entityId: entityId),
      );
      final data = response.data;
      final items = data is List
          ? data
          : (data['items'] as List<dynamic>? ?? []);
      return items.cast<Map<String, dynamic>>();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return [];
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return [];
    }
  }

  // ─── Trace ──────────────────────────────────────────────────────

  Future<Map<String, dynamic>?> fetchTrace(String pid, int startId) async {
    try {
      final response = await _api.get(
        ApiConfig.projectTraceEndpoint(pid, startId),
      );
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

  // ─── Summary ────────────────────────────────────────────────────

  Future<Map<String, dynamic>?> fetchSummary(String pid) async {
    try {
      final response = await _api.get(
        ApiConfig.projectSummaryEndpoint(pid),
      );
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

  Future<NetmapElement?> addElement(
      String pid, Map<String, dynamic> data, {String? photoPath}) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.create,
        projectId: pid,
        endpoint: ApiConfig.projectElementsEndpoint(pid),
        data: data,
        photoPath: photoPath,
      ));
      notifyListeners();
      return null;
    }
    try {
      dynamic response;
      if (photoPath != null) {
        final formData = FormData.fromMap({
          ...data.map((k, v) => MapEntry(k, v is String ? v : v.toString())),
          'file': await MultipartFile.fromFile(photoPath,
              filename: photoPath.split(RegExp(r'[/\\]')).last),
        });
        response = await _api.multipartPost(
          ApiConfig.projectElementsEndpoint(pid),
          formData,
        );
      } else {
        response = await _api.post(
          ApiConfig.projectElementsEndpoint(pid),
          data: data,
        );
      }
      if (response.statusCode == 201 || response.statusCode == 200) {
        final element = NetmapElement.fromJson(
          response.data as Map<String, dynamic>,
          projetoId: pid,
        );
        _elements.add(element);
        notifyListeners();
        return element;
      }
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
    return null;
  }

  Future<NetmapElement?> updateElement(
      String pid, int eid, Map<String, dynamic> data) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.update,
        projectId: pid,
        endpoint: ApiConfig.projectElementEndpoint(pid, eid),
        data: data,
      ));
      notifyListeners();
      return null;
    }
    try {
      final response = await _api.put(
        ApiConfig.projectElementEndpoint(pid, eid),
        data: data,
      );
      if (response.statusCode == 200) {
        final updated = NetmapElement.fromJson(
          response.data as Map<String, dynamic>,
          projetoId: pid,
        );
        final idx = _elements.indexWhere((e) => e.id == eid);
        if (idx >= 0) {
          _elements[idx] = updated;
        } else {
          _elements.add(updated);
        }
        notifyListeners();
        return updated;
      }
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
    return null;
  }

  Future<bool> deleteElement(String pid, int eid) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.delete,
        projectId: pid,
        endpoint: ApiConfig.projectElementEndpoint(pid, eid),
      ));
      _elements.removeWhere((e) => e.id == eid);
      notifyListeners();
      return true;
    }
    try {
      final response =
          await _api.delete(ApiConfig.projectElementEndpoint(pid, eid));
      if (response.statusCode == 200) {
        _elements.removeWhere((e) => e.id == eid);
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

  /// Record optical signal measurement
  Future<bool> recordSignalMeasurement(
      String pid, int elementId, Map<String, dynamic> data) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.create,
        projectId: pid,
        endpoint: ApiConfig.projectSignalEndpoint(pid, elementId),
        data: data,
      ));
      return true;
    }
    try {
      final response = await _api.post(
        ApiConfig.projectSignalEndpoint(pid, elementId),
        data: data,
      );
      return response.statusCode == 200 || response.statusCode == 201;
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

  void reorder(int oldIndex, int newIndex) {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final item = _elements.removeAt(oldIndex);
    _elements.insert(newIndex, item);
    notifyListeners();
  }

  Future<bool> savePositions(String pid) async {
    try {
      final positions = _elements.asMap().entries.map((entry) => {
            'id': entry.value.id,
            'position': entry.key,
          }).toList();

      final response = await _api.post(
        ApiConfig.projectPositionsEndpoint(pid),
        data: {'positions': positions},
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

  void clear() {
    _elements = [];
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
