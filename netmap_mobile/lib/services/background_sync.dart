import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';
import 'package:logger/logger.dart';

const _bgApiKeyFallbackKey = 'api_key_bg';

final _bgLog = Logger(
  printer: PrettyPrinter(
    methodCount: 0,
    errorMethodCount: 4,
    lineLength: 120,
    colors: false,
    printEmojis: false,
    dateTimeFormat: DateTimeFormat.dateAndTime,
  ),
);

const bgSyncTaskName = 'netmap_bg_sync';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    if (task != bgSyncTaskName) return false;
    try {
      await _processOfflineQueue();
      return true;
    } catch (e) {
      _bgLog.e('[BgSync] erro no callback: $e');
      return false;
    }
  });
}

Future<void> _processOfflineQueue() async {
  const queueKey = 'offline_queue';
  const deadLetterKey = 'offline_dead_letter';

  final prefs = await SharedPreferences.getInstance();
  final raw = prefs.getString(queueKey);
  if (raw == null || raw == '[]') {
    _bgLog.d('[BgSync] fila vazia — nada a sincronizar');
    return;
  }

  var apiKey = prefs.getString(_bgApiKeyFallbackKey);
  var serverUrl = prefs.getString('server_url');
  if (apiKey == null || apiKey.isEmpty) {
    const storage = FlutterSecureStorage();
    apiKey = await storage.read(key: 'api_key');
    serverUrl ??= await storage.read(key: 'server_url');
  }
  if (apiKey == null || apiKey.isEmpty) {
    _bgLog.w('[BgSync] API key nao disponivel — abortando');
    return;
  }

  final ops = (jsonDecode(raw) as List)
      .map((e) => _BgOp.fromJson(e as Map<String, dynamic>))
      .toList();
  _bgLog.i('[BgSync] ${ops.length} operacoes pendentes');

  final dio = Dio(BaseOptions(
    baseUrl: serverUrl ?? 'http://192.168.1.134:5005',
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    sendTimeout: const Duration(seconds: 30),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $apiKey',
    },
  ));

  const conflictsKey = 'offline_conflicts';

  final remaining = <_BgOp>[];
  final deadLetter = <_BgOp>[];
  final newConflicts = <Map<String, dynamic>>[];

  for (final op in ops) {
    try {
      _bgLog.d('[BgSync] executando ${op.type} ${op.endpoint}');
      if (op.photoPath != null && op.type == 'create') {
        final formData = FormData.fromMap({
          if (op.data != null) ...op.data!,
          'file': await MultipartFile.fromFile(op.photoPath!,
              filename: op.photoPath!.split(RegExp(r'[/\\]')).last),
        });
        await dio.post(op.endpoint, data: formData,
            options: Options(headers: {'Content-Type': 'multipart/form-data'}));
      } else {
        switch (op.type) {
          case 'create':
            await dio.post(op.endpoint, data: op.data);
          case 'update':
            await dio.put(op.endpoint, data: op.data);
          case 'delete':
            await dio.delete(op.endpoint);
        }
      }
      _bgLog.d('[BgSync] OK — ${op.endpoint}');
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        _bgLog.w('[BgSync] CONFLITO 409 — ${op.endpoint}');
        newConflicts.add({
          'localOp': op.toJson(),
          'serverVersion': e.response?.data ?? {'error': e.message},
          'detectedAt': DateTime.now().toIso8601String(),
        });
        continue;
      }
      final retry = op.retryCount + 1;
      _bgLog.w('[BgSync] falha (tentativa $retry) ${op.endpoint}: $e');
      if (retry >= 3) {
        _bgLog.e('[BgSync] dead letter — ${op.endpoint}');
        deadLetter.add(op.copyWith(retryCount: retry, lastError: e.toString()));
      } else {
        remaining.add(op.copyWith(retryCount: retry, lastError: e.toString()));
      }
    } catch (e) {
      final retry = op.retryCount + 1;
      _bgLog.w('[BgSync] falha (tentativa $retry) ${op.endpoint}: $e');
      if (retry >= 3) {
        _bgLog.e('[BgSync] dead letter — ${op.endpoint}');
        deadLetter.add(op.copyWith(retryCount: retry, lastError: e.toString()));
      } else {
        remaining.add(op.copyWith(retryCount: retry, lastError: e.toString()));
      }
    }
  }

  await prefs.setString(queueKey, jsonEncode(remaining.map((e) => e.toJson()).toList()));

  final existingDeadRaw = prefs.getString(deadLetterKey);
  final existingDead = existingDeadRaw != null
      ? (jsonDecode(existingDeadRaw) as List)
          .map((e) => _BgOp.fromJson(e as Map<String, dynamic>))
          .toList()
      : <_BgOp>[];
  existingDead.addAll(deadLetter);
  await prefs.setString(deadLetterKey, jsonEncode(existingDead.map((e) => e.toJson()).toList()));

  if (newConflicts.isNotEmpty) {
    final existingConflictsRaw = prefs.getString(conflictsKey);
    final existingConflicts = existingConflictsRaw != null
        ? (jsonDecode(existingConflictsRaw) as List).cast<Map<String, dynamic>>()
        : <Map<String, dynamic>>[];
    existingConflicts.addAll(newConflicts);
    await prefs.setString(conflictsKey, jsonEncode(existingConflicts));
    _bgLog.w('[BgSync] ${newConflicts.length} conflito(s) salvos');
  }
}

class _BgOp {
  final String type;
  final String projectId;
  final String endpoint;
  final Map<String, dynamic>? data;
  final String? photoPath;
  final int retryCount;
  final String? lastError;

  _BgOp({
    required this.type,
    required this.projectId,
    required this.endpoint,
    this.data,
    this.photoPath,
    this.retryCount = 0,
    this.lastError,
  });

  _BgOp copyWith({int? retryCount, String? lastError}) => _BgOp(
        type: type,
        projectId: projectId,
        endpoint: endpoint,
        data: data,
        photoPath: photoPath,
        retryCount: retryCount ?? this.retryCount,
        lastError: lastError ?? this.lastError,
      );

  Map<String, dynamic> toJson() => {
        'type': type,
        'projectId': projectId,
        'endpoint': endpoint,
        'data': data,
        'createdAt': DateTime.now().toIso8601String(),
        'photoPath': photoPath,
        'retryCount': retryCount,
        'lastError': lastError,
      };

  factory _BgOp.fromJson(Map<String, dynamic> json) => _BgOp(
        type: json['type'] as String,
        projectId: json['projectId'] as String,
        endpoint: json['endpoint'] as String,
        data: json['data'] as Map<String, dynamic>?,
        photoPath: json['photoPath'] as String?,
        retryCount: json['retryCount'] as int? ?? 0,
        lastError: json['lastError'] as String?,
      );
}
