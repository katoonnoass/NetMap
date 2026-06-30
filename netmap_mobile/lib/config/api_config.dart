class ApiConfig {
  static String baseUrl = 'http://192.168.1.134:5005';

  static const Duration timeout = Duration(seconds: 15);
  static const Duration longTimeout = Duration(seconds: 30);

  // Endpoints
  static const String loginEndpoint = '/api/auth/login';
  static const String logoutEndpoint = '/api/auth/logout';
  static const String meEndpoint = '/api/auth/me';
  static const String csrfTokenEndpoint = '/api/auth/csrf-token';
  static const String projectsEndpoint = '/api/projects';
  static const String apikeysEndpoint = '/api/apikeys';
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
  static String projectIncidentsEndpoint(String pid) =>
      '/api/projects/$pid/incidents';
  static String projectIncidentEndpoint(String pid, int iid) =>
      '/api/projects/$pid/incidents/$iid';
  static String projectIncidentCommentsEndpoint(String pid, int iid) =>
      '/api/projects/$pid/incidents/$iid/comments';
  static String projectCablesEndpoint(String pid) =>
      '/api/projects/$pid/cables';
  static String projectConnectionEndpoint(String pid, int cid) =>
      '/api/projects/$pid/connections/$cid';
  static String projectSignalEndpoint(String pid, int elementId) =>
      '/api/projects/$pid/signal/$elementId';
  static String projectPhotosEndpoint(String pid, int eid) =>
      '/api/projects/$pid/elements/$eid/photos';

  // DIO
  static String projectDiosEndpoint(String pid) =>
      '/api/projects/$pid/dios';
  static String projectDioEndpoint(String pid, dynamic dioId) =>
      '/api/projects/$pid/dios/$dioId';
  static String projectDioPortEndpoint(String pid, dynamic dioId, int portNum) =>
      '/api/projects/$pid/dios/$dioId/ports/$portNum';

  // CTO port update + split
  static String projectCtoPortEndpoint(String pid, int ctoId, int portNum) =>
      '/api/projects/$pid/ctos/$ctoId/ports/$portNum';
  static String projectCtoPortSplitEndpoint(String pid, int ctoId, int portNum) =>
      '/api/projects/$pid/ctos/$ctoId/ports/$portNum/split';
  static String projectCtoBulkPortsEndpoint(String pid, int ctoId) =>
      '/api/projects/$pid/ctos/$ctoId/ports/bulk-update';

  // Audit / History
  static String projectAuditEndpoint(String pid, {int? entityId}) {
    final base = '/api/projects/$pid/audit';
    if (entityId != null) return '$base?entity_id=$entityId';
    return base;
  }

  // Trace (caminho óptico)
  static String projectTraceEndpoint(String pid, int startId) =>
      '/api/projects/$pid/trace/$startId';

  // Summary (dashboard)
  static String projectSummaryEndpoint(String pid) =>
      '/api/projects/$pid/summary';

  // Geofences
  static String projectFencesEndpoint(String pid) =>
      '/api/projects/$pid/fences';
  static String projectFenceEndpoint(String pid, int fenceId) =>
      '/api/projects/$pid/fences/$fenceId';
  static String projectFenceElementsEndpoint(String pid, int fenceId) =>
      '/api/projects/$pid/fences/$fenceId/elements';

  // Maintenance
  static String projectMaintenanceEndpoint(String pid) =>
      '/api/projects/$pid/maintenance';
  static String projectMaintenanceUpcomingEndpoint(String pid) =>
      '/api/projects/$pid/maintenance/upcoming';
  static String projectMaintenanceItemEndpoint(String pid, int schedId) =>
      '/api/projects/$pid/maintenance/$schedId';

  // Backup
  static String projectBackupEndpoint(String pid) =>
      '/api/projects/$pid/backup';
  static String projectRestoreBackupEndpoint(String pid) =>
      '/api/projects/$pid/restore-backup';

  // Export
  static String projectExportKmlEndpoint(String pid) =>
      '/api/projects/$pid/export/kml';

  // Compare
  static String projectCompareEndpoint(String pidA, String pidB) =>
      '/api/projects/compare?a=$pidA&b=$pidB';

  // Signal calculation
  static String projectSignalCalcEndpoint(String pid, int elementId, {int? toId}) {
    final base = '/api/projects/$pid/signal/$elementId';
    if (toId != null) return '$base?to=$toId';
    return base;
  }

  // IXC integration
  static const String ixcConfigEndpoint = '/api/integrations/ixc/config';
  static const String ixcTestEndpoint = '/api/integrations/ixc/test';
  static const String ixcViabilityEndpoint = '/api/integrations/ixc/viability';
  static String projectIxcSyncEndpoint(String pid) =>
      '/api/projects/$pid/integrations/ixc/sync';
}
