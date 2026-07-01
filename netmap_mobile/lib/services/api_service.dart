import 'package:dio/dio.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/services/storage_service.dart';
import 'package:netmap_mobile/di/service_locator.dart';
import 'package:netmap_mobile/utils/logger.dart';

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
    _initDio();
  }

  void _initDio() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.timeout,
      receiveTimeout: ApiConfig.timeout,
      sendTimeout: ApiConfig.longTimeout,
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final apiKey = await StorageService.instance.getApiKey();
        if (apiKey != null && apiKey.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $apiKey';
        } else {
          final cookie = await StorageService.instance.getCookie();
          if (cookie != null && cookie.isNotEmpty) {
            options.headers['Cookie'] = cookie;
          }
          if (options.method != 'GET' && options.method != 'HEAD' && options.method != 'OPTIONS') {
            final csrf = await StorageService.instance.getCsrfToken();
            if (csrf != null) {
              options.headers['X-CSRFToken'] = csrf;
            }
          }
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 400 &&
            error.response?.data is Map &&
            (error.response?.data as Map)['code'] == 'csrf_error') {
          _refreshCsrfAndRetry(error.requestOptions, handler);
          return;
        }
        handler.next(error);
      },
    ));

    _dio.interceptors.add(LogInterceptor(
      request: true,
      requestHeader: false,
      requestBody: true,
      responseHeader: false,
      responseBody: true,
      error: true,
      logPrint: (obj) => log.d('[HTTP] $obj'),
    ));
  }

  factory ApiService() {
    if (getIt.isRegistered<ApiService>()) return getIt<ApiService>();
    _instance ??= ApiService._();
    return _instance!;
  }

  static void resetInstance() {
    _instance = null;
  }

  Future<void> _refreshCsrfAndRetry(RequestOptions req, ErrorInterceptorHandler handler) async {
    try {
      final resp = await _dio.get(ApiConfig.csrfTokenEndpoint);
      final data = resp.data as Map<String, dynamic>;
      final newToken = data['csrf_token'] as String?;
      if (newToken != null) {
        await StorageService.instance.saveCsrfToken(newToken);
      }
      req.headers['X-CSRFToken'] = newToken ?? '';
      try {
        final retryResp = await _dio.fetch(req);
        handler.resolve(retryResp);
        return;
      } catch (e) {
        handler.next(DioException(requestOptions: req, error: e));
        return;
      }
    } catch (_) {
      handler.next(DioException(requestOptions: req, message: 'Falha ao renovar token CSRF'));
    }
  }

  // --- Raw methods (cookie + CSRF bootstrap) ---

  Future<Response> rawGet(String path, {Map<String, dynamic>? params}) async {
    final cookie = await StorageService.instance.getCookie();
    final options = Options(headers: <String, dynamic>{
      if (cookie != null) 'Cookie': cookie,
    });
    try {
      return await _dio.get(path, queryParameters: params, options: options);
    } on DioException catch (e) {
      throw ApiException(e.response?.statusCode, _extractMessage(e));
    }
  }

  Future<Response> rawPost(String path,
      {dynamic data, String? csrfToken}) async {
    final cookie = await StorageService.instance.getCookie();
    final headers = <String, dynamic>{
      if (cookie != null) 'Cookie': cookie,
      if (csrfToken != null) 'X-CSRFToken': csrfToken,
    };
    try {
      return await _dio.post(path, data: data, options: Options(headers: headers));
    } on DioException catch (e) {
      throw ApiException(e.response?.statusCode, _extractMessage(e));
    }
  }

  // --- Normal methods (Bearer token auth by default) ---

  Future<Response> get(String path, {Map<String, dynamic>? params}) async {
    try {
      return await _dio.get(path, queryParameters: params);
    } on DioException catch (e) {
      throw ApiException(e.response?.statusCode, _extractMessage(e));
    }
  }

  Future<Response> post(String path, {dynamic data, Options? options}) async {
    try {
      return await _dio.post(path, data: data, options: options);
    } on DioException catch (e) {
      throw ApiException(e.response?.statusCode, _extractMessage(e));
    }
  }

  Future<Response> put(String path, {dynamic data}) async {
    try {
      return await _dio.put(path, data: data);
    } on DioException catch (e) {
      throw ApiException(e.response?.statusCode, _extractMessage(e));
    }
  }

  Future<Response> delete(String path) async {
    try {
      return await _dio.delete(path);
    } on DioException catch (e) {
      throw ApiException(e.response?.statusCode, _extractMessage(e));
    }
  }

  Future<Response> multipartPost(String path, FormData formData) async {
    try {
      return await _dio.post(path, data: formData,
          options: Options(headers: {'Content-Type': 'multipart/form-data'}));
    } on DioException catch (e) {
      throw ApiException(e.response?.statusCode, _extractMessage(e));
    }
  }

  String _extractMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map) {
      if (data['error'] is String) return data['error'] as String;
      if (data['error'] is Map) {
        final errMap = data['error'] as Map;
        return errMap['message']?.toString() ?? errMap['detail']?.toString() ?? 'Erro';
      }
      if (data['message'] is String) return data['message'] as String;
      if (data['detail'] is String) return data['detail'] as String;
    }
    if (e.response?.statusMessage != null) {
      return e.response!.statusMessage!;
    }
    return e.message ?? 'Erro de conexao';
  }
}
