import 'package:get_it/get_it.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/services/storage_service.dart';
import 'package:netmap_mobile/services/offline_service.dart';

final getIt = GetIt.instance;

void setupServiceLocator() {
  getIt.registerSingleton<ApiService>(ApiService());
  getIt.registerSingleton<StorageService>(StorageService.instance);
  getIt.registerSingleton<OfflineService>(OfflineService.instance);
}
