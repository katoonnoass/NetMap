import 'package:flutter_test/flutter_test.dart';
import 'package:netmap_mobile/app.dart';
import 'package:netmap_mobile/services/storage_service.dart';

void main() {
  testWidgets('App inicia sem crash', (tester) async {
    await StorageService.init();
    await tester.pumpWidget(const NetMapMobileApp());
    await tester.pump();
    expect(find.byType(NetMapMobileApp), findsOneWidget);
  });
}
