import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:netmap_mobile/providers/auth_provider.dart';
import 'package:netmap_mobile/screens/login_screen.dart';
import 'package:netmap_mobile/screens/project_list_screen.dart';
import 'package:netmap_mobile/screens/map_screen.dart';
import 'package:netmap_mobile/models/project.dart';

final GlobalKey<NavigatorState> _rootNavigator = GlobalKey<NavigatorState>();

GoRouter createAppRouter(AuthProvider auth) {
  return GoRouter(
    navigatorKey: _rootNavigator,
    refreshListenable: auth,
    initialLocation: '/login',
    redirect: (_, state) {
      final isAuth = auth.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login';
      if (!isAuth && !isLoginRoute) return '/login';
      if (isAuth && isLoginRoute) return '/projects';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/projects',
        name: 'projects',
        builder: (_, __) => const ProjectListScreen(),
      ),
      GoRoute(
        path: '/project/:pid',
        name: 'project',
        builder: (_, state) {
          final project = state.extra as Project?;
          return MapScreen(
            project: project ?? Project(id: state.pathParameters['pid']!, nome: ''),
          );
        },
      ),
    ],
  );
}
