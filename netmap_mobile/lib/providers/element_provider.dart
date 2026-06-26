import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/models/element.dart';
import 'package:netmap_mobile/models/connection.dart';
import 'package:netmap_mobile/models/cto_port.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/config/api_config.dart';

class ElementProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<NetmapElement> _elements = [];
  List<Connection> _connections = [];
  bool _isLoading = false;
  String? _error;

  List<NetmapElement> get elements => _elements;
  List<Connection> get connections => _connections;
  bool get isLoading => _isLoading;
  String? get error => _error;

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
      String pid, Map<String, dynamic> data) async {
    try {
      final response = await _api.post(
        ApiConfig.projectElementsEndpoint(pid),
        data: data,
      );
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

  /// Reorder elements within the local list (for drag-drop in the UI).
  void reorder(int oldIndex, int newIndex) {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final item = _elements.removeAt(oldIndex);
    _elements.insert(newIndex, item);
    notifyListeners();
  }

  /// Persist the current element order to the server.
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
