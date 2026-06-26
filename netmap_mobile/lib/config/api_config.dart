class ApiConfig {
  // Altere para o IP/host do servidor NetMap
  static const String baseUrl = 'http://100.122.38.53:5005';

  static const Duration timeout = Duration(seconds: 15);
  static const Duration longTimeout = Duration(seconds: 30);

  // Endpoints
  static const String loginEndpoint = '/api/auth/login';
  static const String logoutEndpoint = '/api/auth/logout';
  static const String meEndpoint = '/api/auth/me';
  static const String projectsEndpoint = '/api/projects';
  static const String elementsEndpoint = '/api/projects';
  static const String positionsEndpoint = '/api/projects';
  static const String addressCacheLookup = '/api/address-cache/lookup';
  static const String addressCacheSave = '/api/address-cache/save';

  static String projectAllEndpoint(String pid) => '/api/projects/$pid/all';
  static String projectElementsEndpoint(String pid) =>
      '/api/projects/$pid/elements';
  static String projectElementEndpoint(String pid, int eid) =>
      '/api/projects/$pid/elements/$eid';
  static String projectPositionsEndpoint(String pid) =>
      '/api/projects/$pid/positions';
  static String projectConnectionsEndpoint(String pid) =>
      '/api/projects/$pid/connections';
  static String projectCtoPortsEndpoint(String pid, int ctoId) =>
      '/api/projects/$pid/ctos/$ctoId/ports';
  static String projectPhotosEndpoint(String pid, int eid) =>
      '/api/projects/$pid/elements/$eid/photos';
}
