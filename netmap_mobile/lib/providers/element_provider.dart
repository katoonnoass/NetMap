import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/models/element.dart';
import 'package:netmap_mobile/models/connection.dart';
import 'package:netmap_mobile/models/cto_port.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/services/offline_service.dart';
import 'package:netmap_mobile/config/api_config.dart';

class ElementProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<NetmapElement> _elements = [];
  List<Connection> _connections = [];
  bool _isLoading = false;
  String? _error;
  bool _isOnline = true;

  List<NetmapElement> get elements => _elements;
  List<Connection> get connections => _connections;
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

  Future<void> fetchConnections(String pid) async {
    try {
      final response = await _api.get(ApiConfig.projectConnectionsEndpoint(pid));
      final List<dynamic> data = response.data is List
          ? response.data as List<dynamic>
          : (response.data['items'] as List<dynamic>? ?? []);
      _connections = data
          .map((j) => Connection.fromJson(j as Map<String, dynamic>))
          .toList();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    }
    notifyListeners();
  }

  Future<void> fetchCableInventory(String pid) async {
    try {
      final response = await _api.get(ApiConfig.projectCablesEndpoint(pid));
      final data = response.data;
      final rawList = data is List
          ? data
          : (data['cables'] as List<dynamic>? ?? []);
      // Parse cables into connections for display
      // (cable inventory response has embedded from/to info)
      final cables = rawList.map((j) {
        final m = j as Map<String, dynamic>;
        return Connection(
          id: m['id'] as int? ?? 0,
          from: m['from_id'] as int? ?? 0,
          to: m['to_id'] as int? ?? 0,
          fibra: m['fibra'] as String?,
          porta: m['porta'] as String?,
          cor: m['cor'] as String?,
          length: (m['length'] as num?)?.toDouble(),
          broken: m['status'] == 'rompido',
          obs: m['obs'] as String?,
        );
      }).toList();
      _connections = cables;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // ─── DIO operations ─────────────────────────────────────────────

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

  // ─── CTO port operations ────────────────────────────────────────

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

  /// Toggle a connection's broken status
  Future<bool> toggleConnectionBroken(String pid, int cid, bool broken) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.update,
        projectId: pid,
        endpoint: ApiConfig.projectConnectionEndpoint(pid, cid),
        data: {'broken': broken},
      ));
      final idx = _connections.indexWhere((c) => c.id == cid);
      if (idx >= 0) {
        _connections[idx] = Connection(
          id: _connections[idx].id,
          from: _connections[idx].from,
          to: _connections[idx].to,
          fibra: _connections[idx].fibra,
          porta: _connections[idx].porta,
          cor: _connections[idx].cor,
          length: _connections[idx].length,
          broken: broken,
          waypoints: _connections[idx].waypoints,
          obs: _connections[idx].obs,
        );
        notifyListeners();
      }
      return true;
    }
    try {
      final response = await _api.put(
        ApiConfig.projectConnectionEndpoint(pid, cid),
        data: {'broken': broken},
      );
      if (response.statusCode == 200) {
        final idx = _connections.indexWhere((c) => c.id == cid);
        if (idx >= 0) {
          _connections[idx] = Connection(
            id: _connections[idx].id,
            from: _connections[idx].from,
            to: _connections[idx].to,
            fibra: _connections[idx].fibra,
            porta: _connections[idx].porta,
            cor: _connections[idx].cor,
            length: _connections[idx].length,
            broken: broken,
            waypoints: _connections[idx].waypoints,
            obs: _connections[idx].obs,
          );
          notifyListeners();
        }
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

  Connection? findConnectionBetween(int fromId, int toId) {
    for (final c in _connections) {
      if ((c.from == fromId && c.to == toId) ||
          (c.from == toId && c.to == fromId)) {
        return c;
      }
    }
    return null;
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
