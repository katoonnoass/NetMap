import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/project_provider.dart';
import 'providers/element_provider.dart';
import 'providers/connection_provider.dart';
import 'providers/cto_provider.dart';
import 'providers/incident_provider.dart';
import 'providers/fence_provider.dart';
import 'providers/maintenance_provider.dart';
import 'routes/app_router.dart';
import 'services/offline_service.dart';

class NetMapMobileApp extends StatefulWidget {
  const NetMapMobileApp({super.key});

  @override
  State<NetMapMobileApp> createState() => _NetMapMobileAppState();
}

class _NetMapMobileAppState extends State<NetMapMobileApp> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await OfflineService.instance.init();
    if (OfflineService.instance.pendingCount > 0) {
      OfflineService.instance.syncAll();
    }
    if (mounted) setState(() => _ready = true);
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ProjectProvider()),
        ChangeNotifierProvider(create: (_) => ElementProvider()),
        ChangeNotifierProvider(create: (_) => ConnectionProvider()),
        ChangeNotifierProvider(create: (_) => CtoProvider()),
        ChangeNotifierProvider(create: (_) => IncidentProvider()),
        ChangeNotifierProvider(create: (_) => FenceProvider()),
        ChangeNotifierProvider(create: (_) => MaintenanceProvider()),
        ChangeNotifierProvider.value(value: OfflineService.instance),
      ],
      child: _AppBody(ready: _ready),
    );
  }
}

class _AppBody extends StatelessWidget {
  final bool ready;
  const _AppBody({required this.ready});

  @override
  Widget build(BuildContext context) {
    final theme = ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF1A73E8),
        brightness: Brightness.light,
      ),
      useMaterial3: true,
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
      ),
    );

    final darkTheme = ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF1A73E8),
        brightness: Brightness.dark,
      ),
      useMaterial3: true,
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
      ),
    );

    if (!ready) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: theme,
        darkTheme: darkTheme,
        themeMode: ThemeMode.system,
        home: const Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    final auth = context.watch<AuthProvider>();
    final router = createAppRouter(auth);

    return MaterialApp.router(
      title: 'NetMap Mobile',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      theme: theme,
      darkTheme: darkTheme,
      themeMode: ThemeMode.system,
    );
  }
}
