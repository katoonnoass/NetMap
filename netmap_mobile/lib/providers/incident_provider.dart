import 'package:flutter/foundation.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/models/incident.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/services/offline_service.dart';

class IncidentProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<Incident> _incidents = [];
  bool _isLoading = false;
  String? _error;
  bool _isOnline = true;

  List<Incident> get incidents => _incidents;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void setOnline(bool online) {
    _isOnline = online;
  }

  Future<void> fetchIncidents(String pid) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(ApiConfig.projectIncidentsEndpoint(pid));
      final data = response.data;
      List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map && data['items'] != null) {
        rawList = data['items'] as List;
      } else {
        rawList = [];
      }
      _incidents = rawList
          .map((j) => Incident.fromJson(j as Map<String, dynamic>, projectId: pid))
          .toList();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Incident?> createIncident(String pid, Map<String, dynamic> data) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.create,
        projectId: pid,
        endpoint: ApiConfig.projectIncidentsEndpoint(pid),
        data: data,
      ));
      notifyListeners();
      return null;
    }
    try {
      final response = await _api.post(
        ApiConfig.projectIncidentsEndpoint(pid),
        data: data,
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
        final incident = Incident.fromJson(response.data as Map<String, dynamic>, projectId: pid);
        _incidents.insert(0, incident);
        notifyListeners();
        return incident;
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

  Future<Incident?> updateIncident(String pid, int iid, Map<String, dynamic> data) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.update,
        projectId: pid,
        endpoint: ApiConfig.projectIncidentEndpoint(pid, iid),
        data: data,
      ));
      notifyListeners();
      return null;
    }
    try {
      final response = await _api.put(
        ApiConfig.projectIncidentEndpoint(pid, iid),
        data: data,
      );
      if (response.statusCode == 200) {
        final updated = Incident.fromJson(response.data as Map<String, dynamic>);
        final idx = _incidents.indexWhere((i) => i.id == iid);
        if (idx >= 0) {
          _incidents[idx] = updated;
        } else {
          _incidents.add(updated);
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

  Future<bool> deleteIncident(String pid, int iid) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.delete,
        projectId: pid,
        endpoint: ApiConfig.projectIncidentEndpoint(pid, iid),
      ));
      notifyListeners();
      return true;
    }
    try {
      final response = await _api.delete(
        ApiConfig.projectIncidentEndpoint(pid, iid),
      );
      if (response.statusCode == 200) {
        _incidents.removeWhere((i) => i.id == iid);
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

  Future<IncidentComment?> addComment(String pid, int iid, String text) async {
    if (!_isOnline) {
      await OfflineService.instance.enqueue(OfflineOp(
        type: OpType.create,
        projectId: pid,
        endpoint: ApiConfig.projectIncidentCommentsEndpoint(pid, iid),
        data: {'text': text},
      ));
      notifyListeners();
      return null;
    }
    try {
      final response = await _api.post(
        ApiConfig.projectIncidentCommentsEndpoint(pid, iid),
        data: {'text': text},
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
        final comment = IncidentComment.fromJson(
          response.data as Map<String, dynamic>,
        );
        final idx = _incidents.indexWhere((i) => i.id == iid);
        if (idx >= 0) {
          _incidents[idx].comments.add(comment);
          notifyListeners();
        }
        return comment;
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

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
