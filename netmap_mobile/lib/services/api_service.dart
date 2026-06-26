import 'package:dio/dio.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/services/storage_service.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiService {
  static ApiService? _instance;
  late final Dio _dio;

  ApiService._() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.timeout,
      receiveTimeout: ApiConfig.timeout,
      sendTimeout: ApiConfig.longTimeout,
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final cookie = await StorageService.instance.getCookie();
        if (cookie != null && cookie.isNotEmpty) {
          options.headers['Cookie'] = cookie;
        }
        handler.next(options);
      },
      onError: (error, handler) {
        handler.next(error);
      },
    ));
  }

  factory ApiService() {
    _instance ??= ApiService._();
    return _instance!;
  }

  Future<Response> get(String path, {Map<String, dynamic>? params}) async {
    try {
      return await _dio.get(path, queryParameters: params);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode,
        _extractMessage(e),
      );
    }
  }

  Future<Response> post(String path, {dynamic data, Options? options}) async {
    try {
      return await _dio.post(path, data: data, options: options);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode,
        _extractMessage(e),
      );
    }
  }

  Future<Response> put(String path, {dynamic data}) async {
    try {
      return await _dio.put(path, data: data);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode,
        _extractMessage(e),
      );
    }
  }

  Future<Response> delete(String path) async {
    try {
      return await _dio.delete(path);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode,
        _extractMessage(e),
      );
    }
  }

  String _extractMessage(DioException e) {
    if (e.response?.data is Map && e.response?.data['error'] != null) {
      return e.response?.data['error'] as String;
    }
    if (e.response?.statusMessage != null) {
      return e.response!.statusMessage!;
    }
    return e.message ?? 'Erro de conexao';
  }
}
