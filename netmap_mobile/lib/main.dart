import 'package:flutter/material.dart';
import 'app.dart';
import 'config/api_config.dart';
import 'services/storage_service.dart';
import 'services/offline_service.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();
  await OfflineService.instance.init();

  final savedUrl = await StorageService.instance.getServerUrl();
  if (savedUrl != null && savedUrl.isNotEmpty) {
    ApiConfig.baseUrl = savedUrl;
    ApiService.resetInstance();
  }

  runApp(const NetMapMobileApp());
}
