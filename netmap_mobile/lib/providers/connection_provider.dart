import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/models/connection.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/services/offline_service.dart';
import 'package:netmap_mobile/config/api_config.dart';

class ConnectionProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<Connection> _connections = [];
  String? _error;
  bool _isOnline = true;

  List<Connection> get connections => _connections;
  String? get error => _error;
  bool get isOnline => _isOnline;

  void setOnline(bool online) {
    _isOnline = online;
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
    _connections = [];
    _error = null;
    notifyListeners();
  }
}
