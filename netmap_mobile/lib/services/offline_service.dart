import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum OpType { create, update, delete }

class OfflineOp {
  final OpType type;
  final String projectId;
  final String endpoint;
  final Map<String, dynamic>? data;
  final DateTime createdAt;
  final String? photoPath;

  OfflineOp({
    required this.type,
    required this.projectId,
    required this.endpoint,
    this.data,
    DateTime? createdAt,
    this.photoPath,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'projectId': projectId,
        'endpoint': endpoint,
        'data': data,
        'createdAt': createdAt.toIso8601String(),
        'photoPath': photoPath,
      };

  factory OfflineOp.fromJson(Map<String, dynamic> json) => OfflineOp(
        type: OpType.values.byName(json['type'] as String),
        projectId: json['projectId'] as String,
        endpoint: json['endpoint'] as String,
        data: json['data'] as Map<String, dynamic>?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        photoPath: json['photoPath'] as String?,
      );
}

class OfflineService extends ChangeNotifier {
  static final OfflineService instance = OfflineService._();
  OfflineService._();

  static const _queueKey = 'offline_queue';
  List<OfflineOp> _queue = [];
  bool _syncing = false;
  bool _isOnline = true;

  List<OfflineOp> get queue => List.unmodifiable(_queue);
  bool get syncing => _syncing;
  int get pendingCount => _queue.length;
  bool get isOnline => _isOnline;

  void setOnline(bool online) {
    _isOnline = online;
    notifyListeners();
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_queueKey);
    if (raw != null) {
      final list = jsonDecode(raw) as List;
      _queue = list.map((e) => OfflineOp.fromJson(e as Map<String, dynamic>)).toList();
    }
  }

  Future<void> enqueue(OfflineOp op) async {
    _queue.add(op);
    await _persist();
    notifyListeners();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = jsonEncode(_queue.map((e) => e.toJson()).toList());
    await prefs.setString(_queueKey, raw);
  }

  Future<SyncResult> syncAll() async {
    if (_syncing || _queue.isEmpty) return SyncResult(0, 0);
    _syncing = true;
    notifyListeners();

    final api = ApiService();
    int synced = 0;
    int failed = 0;
    final remaining = <OfflineOp>[];

    for (final op in _queue) {
      try {
        if (op.photoPath != null && op.type == OpType.create) {
          final formData = FormData.fromMap({
            if (op.data != null) ...op.data!.map((k, v) => MapEntry(k, v)),
            'file': await MultipartFile.fromFile(op.photoPath!,
                filename: op.photoPath!.split(RegExp(r'[/\\]')).last),
          });
          await api.multipartPost(op.endpoint, formData);
        } else {
          switch (op.type) {
            case OpType.create:
              await api.post(op.endpoint, data: op.data);
              break;
            case OpType.update:
              await api.put(op.endpoint, data: op.data);
              break;
            case OpType.delete:
              await api.delete(op.endpoint);
              break;
          }
        }
        synced++;
      } catch (_) {
        failed++;
        remaining.add(op);
      }
    }

    _queue = remaining;
    await _persist();
    _syncing = false;
    notifyListeners();
    return SyncResult(synced, failed);
  }

  Future<void> clear() async {
    _queue = [];
    await _persist();
    notifyListeners();
  }
}

class SyncResult {
  final int synced;
  final int failed;
  SyncResult(this.synced, this.failed);
  bool get allOk => failed == 0;
}
