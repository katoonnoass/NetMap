import 'package:flutter/material.dart';
import 'package:flutter_map_tile_caching/flutter_map_tile_caching.dart';
import 'package:workmanager/workmanager.dart';
import 'app.dart';
import 'config/api_config.dart';
import 'di/service_locator.dart';
import 'services/background_sync.dart';
import 'services/storage_service.dart';
import 'services/offline_service.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Workmanager().initialize(callbackDispatcher);
  await Workmanager().registerPeriodicTask(
    'netmap_background_sync',
    bgSyncTaskName,
    frequency: const Duration(minutes: 15),
    constraints: Constraints(networkType: NetworkType.connected),
    existingWorkPolicy: ExistingPeriodicWorkPolicy.keep,
  );

  await StorageService.init();
  setupServiceLocator();
  await OfflineService.instance.init();

  final savedUrl = await StorageService.instance.getServerUrl();
  if (savedUrl != null && savedUrl.isNotEmpty) {
    ApiConfig.baseUrl = savedUrl;
    ApiService.resetInstance();
  }

  await FMTCObjectBoxBackend().initialise();

  runApp(const NetMapMobileApp());
}
