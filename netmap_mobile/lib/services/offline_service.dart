import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/utils/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum OpType { create, update, delete }

class ConflictOp {
  final OfflineOp localOp;
  final Map<String, dynamic> serverVersion;
  final DateTime detectedAt;

  ConflictOp({
    required this.localOp,
    required this.serverVersion,
    DateTime? detectedAt,
  }) : detectedAt = detectedAt ?? DateTime.now();

  ConflictOp copyWith({OfflineOp? localOp, Map<String, dynamic>? serverVersion}) =>
      ConflictOp(
        localOp: localOp ?? this.localOp,
        serverVersion: serverVersion ?? this.serverVersion,
        detectedAt: detectedAt,
      );

  Map<String, dynamic> toJson() => {
        'localOp': localOp.toJson(),
        'serverVersion': serverVersion,
        'detectedAt': detectedAt.toIso8601String(),
      };

  factory ConflictOp.fromJson(Map<String, dynamic> json) => ConflictOp(
        localOp: OfflineOp.fromJson(json['localOp'] as Map<String, dynamic>),
        serverVersion: json['serverVersion'] as Map<String, dynamic>,
        detectedAt: DateTime.parse(json['detectedAt'] as String),
      );
}

class OfflineOp {
  final OpType type;
  final String projectId;
  final String endpoint;
  final Map<String, dynamic>? data;
  final DateTime createdAt;
  final String? photoPath;
  final int retryCount;
  final String? lastError;

  OfflineOp({
    required this.type,
    required this.projectId,
    required this.endpoint,
    this.data,
    DateTime? createdAt,
    this.photoPath,
    this.retryCount = 0,
    this.lastError,
  }) : createdAt = createdAt ?? DateTime.now();

  static const int maxRetries = 3;

  bool get exceededRetries => retryCount >= maxRetries;

  OfflineOp copyWithRetry(String error) => OfflineOp(
        type: type,
        projectId: projectId,
        endpoint: endpoint,
        data: data,
        createdAt: createdAt,
        photoPath: photoPath,
        retryCount: retryCount + 1,
        lastError: error,
      );

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'projectId': projectId,
        'endpoint': endpoint,
        'data': data,
        'createdAt': createdAt.toIso8601String(),
        'photoPath': photoPath,
        'retryCount': retryCount,
        'lastError': lastError,
      };

  factory OfflineOp.fromJson(Map<String, dynamic> json) => OfflineOp(
        type: OpType.values.byName(json['type'] as String),
        projectId: json['projectId'] as String,
        endpoint: json['endpoint'] as String,
        data: json['data'] as Map<String, dynamic>?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        photoPath: json['photoPath'] as String?,
        retryCount: json['retryCount'] as int? ?? 0,
        lastError: json['lastError'] as String?,
      );
}

class OfflineService extends ChangeNotifier {
  static final OfflineService instance = OfflineService._();
  OfflineService._();

  static const _queueKey = 'offline_queue';
  static const _deadLetterKey = 'offline_dead_letter';
  static const _conflictsKey = 'offline_conflicts';
  List<OfflineOp> _queue = [];
  List<OfflineOp> _deadLetter = [];
  List<ConflictOp> _conflicts = [];
  bool _syncing = false;
  bool _isOnline = true;

  List<OfflineOp> get queue => List.unmodifiable(_queue);
  List<OfflineOp> get deadLetter => List.unmodifiable(_deadLetter);
  List<ConflictOp> get conflicts => List.unmodifiable(_conflicts);
  bool get syncing => _syncing;
  int get pendingCount => _queue.length;
  int get deadLetterCount => _deadLetter.length;
  int get conflictCount => _conflicts.length;
  bool get isOnline => _isOnline;

  void setOnline(bool online) {
    _isOnline = online;
    if (online && _queue.isNotEmpty) {
      syncAll();
    }
    notifyListeners();
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_queueKey);
    if (raw != null) {
      final list = jsonDecode(raw) as List;
      _queue = list.map((e) => OfflineOp.fromJson(e as Map<String, dynamic>)).toList();
    }
    final deadRaw = prefs.getString(_deadLetterKey);
    if (deadRaw != null) {
      final list = jsonDecode(deadRaw) as List;
      _deadLetter = list.map((e) => OfflineOp.fromJson(e as Map<String, dynamic>)).toList();
    }
    final conflictRaw = prefs.getString(_conflictsKey);
    if (conflictRaw != null) {
      final list = jsonDecode(conflictRaw) as List;
      _conflicts = list.map((e) => ConflictOp.fromJson(e as Map<String, dynamic>)).toList();
    }
  }

  Future<void> enqueue(OfflineOp op) async {
    _queue.add(op);
    await _persist();
    notifyListeners();
    log.d('[OfflineSync] enfileirado ${op.type.name} ${op.endpoint} (fila: ${_queue.length})');
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = jsonEncode(_queue.map((e) => e.toJson()).toList());
    await prefs.setString(_queueKey, raw);
    final deadRaw = jsonEncode(_deadLetter.map((e) => e.toJson()).toList());
    await prefs.setString(_deadLetterKey, deadRaw);
    final conflictRaw = jsonEncode(_conflicts.map((e) => e.toJson()).toList());
    await prefs.setString(_conflictsKey, conflictRaw);
  }

  Future<SyncResult> syncAll() async {
    if (_syncing || _queue.isEmpty) {
      log.d('[OfflineSync] syncAll — sem operacoes pendentes');
      return SyncResult(0, 0, 0, []);
    }
    _syncing = true;
    notifyListeners();
    log.i('[OfflineSync] syncAll — ${_queue.length} operacoes');

    final api = ApiService();
    int synced = 0;
    int failed = 0;
    int conflicts = 0;
    final remaining = <OfflineOp>[];

    for (final op in _queue) {
      try {
        log.d('[OfflineSync] executando ${op.type.name} ${op.endpoint}');
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
        log.d('[OfflineSync] OK — ${op.endpoint}');
      } on ApiException catch (e, s) {
        failed++;
        log.w('[OfflineSync] falha (tentativa ${op.retryCount + 1}) ${op.endpoint}: $e');
        log.d('[OfflineSync] stacktrace: $s');
        if (e.statusCode == 409) {
          conflicts++;
          log.w('[OfflineSync] CONFLITO 409 — ${op.endpoint}');
          _conflicts.add(ConflictOp(
            localOp: op.copyWithRetry(e.toString()),
            serverVersion: {'error': e.message},
          ));
        } else {
          final updated = op.copyWithRetry(e.toString());
          if (updated.exceededRetries) {
            log.e('[OfflineSync] dead letter — ${op.endpoint} apos ${OfflineOp.maxRetries} tentativas');
            _deadLetter.add(updated);
          } else {
            remaining.add(updated);
          }
        }
      } catch (e, s) {
        failed++;
        log.w('[OfflineSync] falha (tentativa ${op.retryCount + 1}) ${op.endpoint}: $e');
        log.d('[OfflineSync] stacktrace: $s');
        final updated = op.copyWithRetry(e.toString());
        if (updated.exceededRetries) {
          log.e('[OfflineSync] dead letter — ${op.endpoint} apos ${OfflineOp.maxRetries} tentativas');
          _deadLetter.add(updated);
        } else {
          remaining.add(updated);
        }
      }
    }

    _queue = remaining;
    await _persist();
    _syncing = false;
    notifyListeners();
    log.i('[OfflineSync] concluido — ${synced} sync, $failed falha, ${_deadLetter.length} dead letter, $conflicts conflitos');
    return SyncResult(synced, failed, _deadLetter.length, _deadLetter);
  }

  Future<SyncResult> retryDeadLetter() async {
    if (_deadLetter.isEmpty) return SyncResult(0, 0, 0, []);
    final ops = List<OfflineOp>.from(_deadLetter)
        .map((op) => OfflineOp(
              type: op.type,
              projectId: op.projectId,
              endpoint: op.endpoint,
              data: op.data,
              photoPath: op.photoPath,
              retryCount: 0,
            ))
        .toList();
    _deadLetter.clear();
    _queue.addAll(ops);
    await _persist();
    notifyListeners();
    return syncAll();
  }

  Future<void> resolveConflict(int index, {bool keepLocal = true}) async {
    if (index < 0 || index >= _conflicts.length) return;
    final conflict = _conflicts[index];
    _conflicts.removeAt(index);
    if (keepLocal) {
      final op = conflict.localOp;
      _queue.add(OfflineOp(
        type: op.type,
        projectId: op.projectId,
        endpoint: op.endpoint,
        data: op.data,
        photoPath: op.photoPath,
        retryCount: 0,
        lastError: null,
      ));
      log.i('[OfflineSync] conflito resolvido — mantido local ${op.endpoint}');
    } else {
      log.i('[OfflineSync] conflito resolvido — aceito servidor ${conflict.localOp.endpoint}');
    }
    await _persist();
    notifyListeners();
  }

  Future<void> clear() async {
    _queue = [];
    _deadLetter = [];
    _conflicts = [];
    await _persist();
    notifyListeners();
  }

  Future<void> clearDeadLetter() async {
    _deadLetter = [];
    await _persist();
    notifyListeners();
  }

  Future<void> clearConflicts() async {
    _conflicts = [];
    await _persist();
    notifyListeners();
  }
}

class SyncResult {
  final int synced;
  final int failed;
  final int deadLetter;
  final List<OfflineOp> deadLetterItems;

  SyncResult(this.synced, this.failed, this.deadLetter, this.deadLetterItems);
  bool get allOk => failed == 0 && deadLetter == 0;
}
