import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:netmap_mobile/app.dart';
import 'package:netmap_mobile/services/storage_service.dart';
import 'package:netmap_mobile/services/offline_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('App inicia sem crash', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await StorageService.init();
    await OfflineService.instance.init();
    await tester.pumpWidget(const NetMapMobileApp());
    await tester.pump();
    expect(find.byType(NetMapMobileApp), findsOneWidget);
  });

  testWidgets('App renders without crashing and shows loading state', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await StorageService.init();
    await OfflineService.instance.init();
    await tester.pumpWidget(const NetMapMobileApp());
    // Initial render shows loading (CircularProgressIndicator)
    await tester.pump();
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
