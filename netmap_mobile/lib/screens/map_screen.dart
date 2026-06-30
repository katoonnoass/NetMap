import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:netmap_mobile/models/element.dart';
import 'package:netmap_mobile/models/cto_port.dart';
import 'package:netmap_mobile/models/project.dart';
import 'package:netmap_mobile/config/element_types.dart';
import 'package:netmap_mobile/providers/element_provider.dart';
import 'package:netmap_mobile/providers/auth_provider.dart';
import 'package:netmap_mobile/widgets/element_pin.dart';
import 'package:netmap_mobile/widgets/loading_overlay.dart';
import 'package:netmap_mobile/screens/element_form_screen.dart';
import 'package:netmap_mobile/screens/element_list_screen.dart';
import 'package:netmap_mobile/screens/incident_list_screen.dart';
import 'package:netmap_mobile/screens/incident_form_screen.dart';
import 'package:netmap_mobile/screens/qr_scanner_screen.dart';
import 'package:netmap_mobile/screens/cto_port_edit_screen.dart';
import 'package:netmap_mobile/screens/element_history_screen.dart';
import 'package:netmap_mobile/screens/trace_screen.dart';
import 'package:netmap_mobile/screens/cto_clients_screen.dart';
import 'package:netmap_mobile/screens/dashboard_screen.dart';
import 'package:netmap_mobile/screens/dio_panel_screen.dart';
import 'package:netmap_mobile/screens/maintenance_screen.dart';
import 'package:netmap_mobile/screens/project_compare_screen.dart';
import 'package:netmap_mobile/screens/geodata_screen.dart';
import 'package:netmap_mobile/screens/ixc_screen.dart';
import 'package:netmap_mobile/screens/cable_screen.dart';
import 'package:netmap_mobile/providers/fence_provider.dart';
import 'package:netmap_mobile/widgets/signal_measurement_dialog.dart';
import 'package:netmap_mobile/widgets/service_checklist.dart';

enum _MapLayer { osm, satellite, dark }

class _OsmTileProvider extends TileProvider {
  static final _instance = _OsmTileProvider._();
  _OsmTileProvider._();
  factory _OsmTileProvider() => _instance;
  @override
  ImageProvider getImage(TileCoordinates coordinates, TileLayer options) {
    return NetworkImage(
      getTileUrl(coordinates, options),
      headers: const {'User-Agent': 'NetMapMobile/1.0'},
    );
  }
}

class _PlainTileProvider extends TileProvider {
  static final _instance = _PlainTileProvider._();
  _PlainTileProvider._();
  factory _PlainTileProvider() => _instance;
  @override
  ImageProvider getImage(TileCoordinates coordinates, TileLayer options) {
    return NetworkImage(getTileUrl(coordinates, options));
  }
}

class MapScreen extends StatefulWidget {
  final Project project;
  const MapScreen({super.key, required this.project});
  @override State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  bool _placement = false;
  _MapLayer _layer = _MapLayer.osm;
  bool _showCableLabels = false;
  bool _showFences = false;
  bool _draftMode = false;
  bool _radiusMode = false;
  double _radiusKm = 1.0;
  LatLng? _radiusCenter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ep = Provider.of<ElementProvider>(context, listen: false);
      ep.fetchElements(widget.project.id);
      ep.fetchConnections(widget.project.id);
      Provider.of<FenceProvider>(context, listen: false).fetchFences(widget.project.id);
    });
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  String get _tileUrl {
    switch (_layer) {
      case _MapLayer.satellite:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case _MapLayer.dark:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      default:
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  }

  void _togglePlacement() {
    setState(() => _placement = !_placement);
    if (_placement) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Clique no mapa para posicionar')),
      );
    }
  }

  void _onTap(TapPosition _, LatLng p) {
    if (_placement) {
      setState(() => _placement = false);
      _openForm(lat: p.latitude, lng: p.longitude);
    }
  }

  void _onLongPress(TapPosition _, LatLng p) =>
      _openForm(lat: p.latitude, lng: p.longitude);

  void _openQrScanner() {
    final ep = Provider.of<ElementProvider>(context, listen: false);
    Navigator.of(context).push<NetmapElement>(MaterialPageRoute(
      builder: (_) => QrScannerScreen(
        projectId: widget.project.id,
        elements: ep.elements,
      ),
    )).then((result) {
      if (result != null && mounted) {
        if (result.hasCoords) {
          _mapController.move(LatLng(result.lat!, result.lng!), 16);
        }
        _sheet(result);
      }
    });
  }

  void _openForm({double? lat, double? lng, NetmapElement? element}) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ElementFormScreen(
        projectId: widget.project.id, element: element, initialLat: lat, initialLng: lng,
      ),
    ));
  }

  void _openElementList() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ElementListScreen(projectId: widget.project.id),
    )).then((result) {
      if (result != null && result is NetmapElement) {
        final el = result;
        if (el.hasCoords) {
          _mapController.move(LatLng(el.lat!, el.lng!), 16);
        }
      }
    });
  }

  void _openIncidentList() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => IncidentListScreen(projectId: widget.project.id),
    ));
  }

  void _openIncidentForm({NetmapElement? element}) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => IncidentFormScreen(
        projectId: widget.project.id,
        elementId: element?.id,
      ),
    ));
  }

  void _sheet(NetmapElement e) {
    final isCto = e.tipo.toLowerCase() == 'cto';
    final ep = Provider.of<ElementProvider>(context, listen: false);
    final canEdit = Provider.of<AuthProvider>(context, listen: false).canEdit;

    // Find connections involving this element
    final relatedConnections = ep.connections.where((c) =>
      c.from == e.id || c.to == e.id
    ).toList();
    final brokenConnections = relatedConnections.where((c) => c.broken).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Header
            Row(children: [
              Icon(ElementTypes.iconFor(e.tipo), color: ElementTypes.colorFor(e.tipo)),
              const SizedBox(width: 8),
              Expanded(child: Text(e.nome, style: Theme.of(context).textTheme.headlineSmall)),
            ]),
            const SizedBox(height: 4),
            Text('Tipo: ${ElementTypes.labelFor(e.tipo)}  |  Status: ${e.status ?? '-'}',
              style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            if (e.endereco != null && e.endereco!.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text('Endereco: ${e.endereco}', style: const TextStyle(fontSize: 12)),
            ],
            if (e.observacao != null && e.observacao!.isNotEmpty)
              Padding(padding: const EdgeInsets.only(top: 4),
                child: Text('Obs: ${e.observacao}', style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic))),

            // Cable info if available
            if (relatedConnections.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Cabos (${relatedConnections.length})', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 4),
              ...relatedConnections.take(3).map((c) => Container(
                margin: const EdgeInsets.only(bottom: 4),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: c.broken ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(children: [
                  Icon(c.broken ? Icons.link_off : Icons.link, size: 14,
                    color: c.broken ? Colors.red : Colors.green),
                  const SizedBox(width: 4),
                  Text(c.fibra ?? 'Cabo #${c.id}', style: const TextStyle(fontSize: 12)),
                  if (c.broken) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text('ROMPIDO', style: TextStyle(fontSize: 9, color: Colors.red, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ]),
              )),
              if (relatedConnections.length > 3)
                Text('+ ${relatedConnections.length - 3} mais...', style: const TextStyle(fontSize: 11)),
            ],

            // CTO ports panel
            if (isCto) ...[
              const SizedBox(height: 12),
              _CtoPortsPanel(element: e),
            ],

            const SizedBox(height: 16),

            // Action buttons
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                // Edit
                if (canEdit)
                  _actionBtn(Icons.edit, 'Editar', () {
                    Navigator.pop(ctx);
                    _openForm(element: e);
                  }),
                // Navigate
                _actionBtn(Icons.navigation, 'Navegar', () async {
                  Navigator.pop(ctx);
                  final uri = Uri.parse(
                    'https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}',
                  );
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  } else {
                    if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Nao foi possivel abrir o mapa')),
                    );
                  }
                }),
                // Mark connection broken toggle
                if (canEdit && relatedConnections.isNotEmpty)
                  _actionBtn(
                    brokenConnections.isNotEmpty ? Icons.link : Icons.link_off,
                    brokenConnections.isNotEmpty ? 'Recuperar' : 'Romper cabo',
                    () => _toggleBroken(e, relatedConnections, ctx),
                  ),
                // Signal measurement
                if (canEdit)
                  _actionBtn(Icons.speed, 'Sinal', () {
                    Navigator.pop(ctx);
                    showDialog(
                      context: context,
                      builder: (_) => SignalMeasurementDialog(
                        projectId: widget.project.id,
                        elementId: e.id,
                        elementName: e.nome,
                      ),
                    );
                  }),
                // History
                _actionBtn(Icons.history, 'Historico', () {
                  Navigator.pop(ctx);
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => ElementHistoryScreen(
                      projectId: widget.project.id,
                      element: e,
                    ),
                  ));
                }),
                // Trace (caminho óptico)
                _actionBtn(Icons.route, 'Caminho optico', () {
                  Navigator.pop(ctx);
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => TraceScreen(
                      projectId: widget.project.id,
                      startElement: e,
                    ),
                  ));
                }),
                // Edit CTO ports
                if (isCto && canEdit)
                  _actionBtn(Icons.edit_note, 'Editar portas', () {
                    Navigator.pop(ctx);
                    Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => CtoPortEditScreen(
                        projectId: widget.project.id,
                        ctoId: e.id,
                        ctoName: e.nome,
                      ),
                    ));
                  }),
                // Service checklist
                if (canEdit)
                  _actionBtn(Icons.checklist, 'Checklist', () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      builder: (_) => Padding(
                        padding: const EdgeInsets.all(16),
                        child: SafeArea(
                          child: ServiceChecklist(
                            projectId: widget.project.id,
                            elementId: e.id,
                            elementName: e.nome,
                          ),
                        ),
                      ),
                    );
                  }),
                // Promote draft to real
                if (canEdit && e.status == 'draft')
                  _actionBtn(Icons.publish, 'Promover', () {
                    Navigator.pop(ctx);
                    Provider.of<ElementProvider>(context, listen: false).updateElement(
                      widget.project.id, e.id, {'status': 'ativo'},
                    );
                  }),
                // Create incident
                if (canEdit)
                  _actionBtn(Icons.warning_amber, 'Incidente', () {
                    Navigator.pop(ctx);
                    _openIncidentForm(element: e);
                  }),
                // Delete
                if (canEdit)
                  _actionBtn(Icons.delete_forever, 'Excluir', () {
                    Navigator.pop(ctx);
                    _confirmDelete(e);
                  }, destructive: true),
              ],
            ),
          ]),
        ),
      ),
    );
  }

  Widget _actionBtn(IconData icon, String label, VoidCallback onTap, {bool destructive = false}) {
    final color = destructive ? Colors.red : Theme.of(context).colorScheme.primary;
    return ActionChip(
      avatar: Icon(icon, size: 16, color: color),
      label: Text(label, style: TextStyle(fontSize: 12, color: color)),
      onPressed: onTap,
    );
  }

  Future<void> _toggleBroken(NetmapElement e, List connections, BuildContext ctx) async {
    final ep = Provider.of<ElementProvider>(context, listen: false);
    for (final c in connections) {
      await ep.toggleConnectionBroken(widget.project.id, c.id, !c.broken);
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Status dos cabos atualizados')),
      );
    }
  }

  Future<void> _confirmDelete(NetmapElement e) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Excluir elemento'),
        content: Text('Tem certeza que deseja excluir "${e.nome}"?\n\n'
            'Conexoes vinculadas tambem serao removidas.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      final ep = Provider.of<ElementProvider>(context, listen: false);
      final ok = await ep.deleteElement(widget.project.id, e.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ok ? 'Elemento excluido' : 'Erro ao excluir')),
        );
      }
    }
  }

  Future<void> _myLocation() async {
    if (!await Geolocator.isLocationServiceEnabled()) { _toast('GPS desativado'); return; }
    var p = await Geolocator.checkPermission();
    if (p == LocationPermission.denied) p = await Geolocator.requestPermission();
    if (p == LocationPermission.denied || p == LocationPermission.deniedForever) { _toast('Permissao negada'); return; }
    final pos = await Geolocator.getCurrentPosition();
    _mapController.move(LatLng(pos.latitude, pos.longitude), 16);
  }

  void _toast(String m) => ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(m), backgroundColor: Theme.of(context).colorScheme.error),
  );

  double _haversine(LatLng a, LatLng b) {
    const R = 6371.0;
    final dLat = (b.latitude - a.latitude) * (math.pi / 180);
    final dLon = (b.longitude - a.longitude) * (math.pi / 180);
    final sinDLat = math.sin(dLat / 2);
    final sinDLon = math.sin(dLon / 2);
    final aVal = sinDLat * sinDLat + math.cos(a.latitude * (math.pi / 180)) * math.cos(b.latitude * (math.pi / 180)) * sinDLon * sinDLon;
    return R * 2 * math.atan2(math.sqrt(aVal), math.sqrt(1 - aVal));
  }

  List<Polygon> _buildFencePolygons(BuildContext context) {
    final fp = Provider.of<FenceProvider>(context, listen: false);
    return fp.fences.map((f) {
      final color = _parseHexColor(f.color);
      final pts = f.coordinates.map((c) =>
        LatLng((c['lat'] as num).toDouble(), (c['lng'] as num).toDouble())
      ).toList();
      return Polygon(
        points: pts,
        color: color.withOpacity(0.15),
        borderColor: color.withOpacity(0.6),
        borderStrokeWidth: 2,
      );
    }).toList();
  }

  Color _parseHexColor(String hex) {
    final h = hex.replaceFirst('#', '');
    if (h.length == 6) {
      return Color(int.parse('FF$h', radix: 16));
    }
    return Colors.blue;
  }

  List<Polyline> _buildConnectionPolylines(ElementProvider ep) {
    final elementMap = {for (final e in ep.elements) e.id: e};
    return ep.connections.where((c) {
      final from = elementMap[c.from];
      final to = elementMap[c.to];
      return from?.hasCoords == true && to?.hasCoords == true;
    }).map((c) {
      final from = elementMap[c.from]!;
      final to = elementMap[c.to]!;
      return Polyline(
        points: [LatLng(from.lat!, from.lng!), LatLng(to.lat!, to.lng!)],
        color: c.broken ? Colors.red : Colors.blue.withOpacity(0.6),
        strokeWidth: c.broken ? 2.5 : 3,
        borderStrokeWidth: c.broken ? 0 : 1,
        borderColor: c.broken ? Colors.red : Colors.blue,
        isDotted: c.broken,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            children: [
              DrawerHeader(
                decoration: BoxDecoration(color: Theme.of(context).colorScheme.primaryContainer),
                child: Text(widget.project.nome, style: Theme.of(context).textTheme.titleLarge),
              ),
              ListTile(
                leading: const Icon(Icons.dashboard),
                title: const Text('Dashboard'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => DashboardScreen(projectId: widget.project.id),
                  ));
                },
              ),
              ListTile(
                leading: const Icon(Icons.album),
                title: const Text('Painel DIO'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => DioPanelScreen(projectId: widget.project.id),
                  ));
                },
              ),
              ListTile(
                leading: const Icon(Icons.calendar_month),
                title: const Text('Agenda Manutencao'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => MaintenanceScreen(projectId: widget.project.id),
                  ));
                },
              ),
              ListTile(
                leading: const Icon(Icons.compare_arrows),
                title: const Text('Comparar Projetos'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => const ProjectCompareScreen(),
                  ));
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.people),
                title: const Text('Clientes CTO'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => CtoClientsScreen(projectId: widget.project.id),
                  ));
                },
              ),
              ListTile(
                leading: const Icon(Icons.qr_code_scanner),
                title: const Text('Escanear QR Code'),
                onTap: () {
                  Navigator.pop(context);
                  _openQrScanner();
                },
              ),
              ListTile(
                leading: const Icon(Icons.cable),
                title: const Text('Cabos'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => CableScreen(projectId: widget.project.id),
                  ));
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.map_outlined),
                title: const Text('GeoData & Backup'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => GeodataScreen(projectId: widget.project.id),
                  ));
                },
              ),
              ListTile(
                leading: const Icon(Icons.api),
                title: const Text('Integracao IXC'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => IxcScreen(projectId: widget.project.id),
                  ));
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.swap_horiz),
                title: const Text('Trocar projeto'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        ),
      ),
      appBar: AppBar(
        title: Text(widget.project.nome),
        leading: Builder(builder: (ctx) => IconButton(
          icon: const Icon(Icons.menu),
          tooltip: 'Menu',
          onPressed: () => Scaffold.of(ctx).openDrawer(),
        )),
        actions: [
          PopupMenuButton<_MapLayer>(
            icon: Icon(_layer == _MapLayer.satellite
                ? Icons.satellite_alt
                : _layer == _MapLayer.dark ? Icons.dark_mode : Icons.map),
            tooltip: 'Camada do mapa',
            onSelected: (v) => setState(() => _layer = v),
            itemBuilder: (_) => [
              PopupMenuItem(value: _MapLayer.osm, child: Row(children: [
                if (_layer == _MapLayer.osm) const Icon(Icons.check, size: 18),
                const SizedBox(width: 8), const Text('OpenStreetMap'),
              ])),
              PopupMenuItem(value: _MapLayer.satellite, child: Row(children: [
                if (_layer == _MapLayer.satellite) const Icon(Icons.check, size: 18),
                const SizedBox(width: 8), const Text('Satelite (Esri)'),
              ])),
              PopupMenuItem(value: _MapLayer.dark, child: Row(children: [
                if (_layer == _MapLayer.dark) const Icon(Icons.check, size: 18),
                const SizedBox(width: 8), const Text('Dark (Esri)'),
              ])),
            ],
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            tooltip: 'Mais',
            onSelected: (v) {
              switch (v) {
                case 'draft':
                  setState(() => _draftMode = !_draftMode);
                  break;
                case 'radius':
                  setState(() { _radiusMode = true; _radiusKm = 1.0; });
                  _myLocation();
                  break;
                case 'fences':
                  setState(() => _showFences = !_showFences);
                  break;
                case 'labels':
                  setState(() => _showCableLabels = !_showCableLabels);
                  break;
                case 'qr':
                  _openQrScanner();
                  break;
                case 'cto':
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => CtoClientsScreen(projectId: widget.project.id),
                  ));
                  break;
              }
            },
            itemBuilder: (_) => [
              PopupMenuItem(value: 'draft', child: Row(children: [
                Icon(Icons.edit_note, size: 20, color: _draftMode ? Colors.orange : null),
                const SizedBox(width: 8),
                Text(_draftMode ? 'Rascunho: ativo' : 'Modo rascunho'),
              ])),
              PopupMenuItem(value: 'radius', child: Row(children: [
                Icon(Icons.my_location, size: 20, color: _radiusMode ? Colors.blue : null),
                const SizedBox(width: 8),
                Text(_radiusMode ? 'Raio: ${_radiusKm}km' : 'Pesquisa por raio'),
              ])),
              PopupMenuItem(value: 'fences', child: Row(children: [
                Icon(Icons.border_style, size: 20, color: _showFences ? null : null),
                const SizedBox(width: 8),
                Text(_showFences ? 'Geocercas: ativas' : 'Geocercas'),
              ])),
              PopupMenuItem(value: 'labels', child: Row(children: [
                Icon(_showCableLabels ? Icons.label : Icons.label_off, size: 20),
                const SizedBox(width: 8),
                Text(_showCableLabels ? 'Cabos: rotulados' : 'Rotular cabos'),
              ])),
              const PopupMenuDivider(),
              PopupMenuItem(value: 'qr', child: Row(children: [
                const Icon(Icons.qr_code_scanner, size: 20),
                const SizedBox(width: 8), const Text('Escanear QR Code'),
              ])),
              PopupMenuItem(value: 'cto', child: Row(children: [
                const Icon(Icons.people, size: 20),
                const SizedBox(width: 8), const Text('Clientes do CTO'),
              ])),
            ],
          ),
          IconButton(icon: const Icon(Icons.add), onPressed: () => _openForm()),
        ],
      ),
      body: RepaintBoundary(
        child: Consumer<ElementProvider>(
          builder: (ctx, ep, _) {
            final visibleElements = ep.elementsWithCoords.where((e) {
              if (_draftMode && e.status != 'draft') return false;
              if (_radiusCenter != null && _radiusMode) {
                final dist = _haversine(_radiusCenter!, LatLng(e.lat!, e.lng!));
                if (dist > _radiusKm) return false;
              }
              return true;
            }).toList();
            final markers = visibleElements.map((e) => Marker(
              point: LatLng(e.lat!, e.lng!), width: 80, height: 80,
              child: ElementPin(element: e, onTap: () => _sheet(e)),
            )).toList();
            final polylines = _buildConnectionPolylines(ep);
            List<Polygon> extraPolygons = [];
            if (_radiusCenter != null && _radiusMode) {
              final pts = <LatLng>[];
              final steps = 36;
              for (int i = 0; i < steps; i++) {
                final angle = (i / steps) * 2 * math.pi;
                final dx = _radiusKm / 111.32 * math.cos(angle);
                final dy = _radiusKm / (111.32 * math.cos(_radiusCenter!.latitude * math.pi / 180)) * math.sin(angle);
                pts.add(LatLng(_radiusCenter!.latitude + dx, _radiusCenter!.longitude + dy));
              }
              extraPolygons.add(Polygon(
                points: pts,
                color: Colors.blue.withOpacity(0.08),
                borderColor: Colors.blue.withOpacity(0.4),
                borderStrokeWidth: 2,
              ));
            }
            return Stack(children: [
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: const LatLng(-14.2350, -51.9253),
                  initialZoom: 4, minZoom: 3, maxZoom: 18,
                  onTap: _onTap, onLongPress: _onLongPress,
                ),
                children: [
                  TileLayer(
                    urlTemplate: _tileUrl,
                    tileProvider: _layer == _MapLayer.osm
                        ? _OsmTileProvider()
                        : _PlainTileProvider(),
                  ),
                  PolylineLayer(polylines: polylines),
                  if (_showFences) PolygonLayer(polygons: _buildFencePolygons(context)),
                  if (extraPolygons.isNotEmpty) PolygonLayer(polygons: extraPolygons),
                  MarkerLayer(markers: markers),
                ],
              ),
              if (ep.isLoading) const LoadingOverlay(isLoading: true, message: 'Carregando...'),
              // Bottom-right controls
              Positioned(
                right: 16, bottom: 16,
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  FloatingActionButton.small(heroTag: 'loc', onPressed: _myLocation, child: const Icon(Icons.my_location)),
                  const SizedBox(height: 8),
                  FloatingActionButton(
                    heroTag: 'add', onPressed: _togglePlacement,
                    backgroundColor: _placement ? Theme.of(context).colorScheme.tertiaryContainer : null,
                    child: Icon(_placement ? Icons.close : Icons.add_location_alt),
                  ),
                ]),
              ),
              // Layer indicator
              Positioned(
                left: 16, bottom: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.85),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(
                      _layer == _MapLayer.satellite ? Icons.satellite_alt
                          : _layer == _MapLayer.dark ? Icons.dark_mode : Icons.map,
                      size: 14, color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _layer == _MapLayer.satellite ? 'Satelite'
                          : _layer == _MapLayer.dark ? 'Dark' : 'OSM',
                      style: const TextStyle(fontSize: 11),
                    ),
                  ]),
                ),
              ),
            ]);
          },
        ),
      ),
      // Bottom navigation for quick access to other screens
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: 0,
        onTap: (i) {
          if (i == 1) _openElementList();
          if (i == 2) _openIncidentList();
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.map), label: 'Mapa'),
          BottomNavigationBarItem(icon: Icon(Icons.list), label: 'Elementos'),
          BottomNavigationBarItem(icon: Icon(Icons.warning), label: 'Incidentes'),
        ],
      ),
    );
  }
}

// ─── CTO Ports Panel ───────────────────────────────────────────────

class _CtoPortsPanel extends StatefulWidget {
  final NetmapElement element;
  const _CtoPortsPanel({required this.element});

  @override
  State<_CtoPortsPanel> createState() => _CtoPortsPanelState();
}

class _CtoPortsPanelState extends State<_CtoPortsPanel> {
  List<CtoPort>? _ports;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadPorts();
  }

  Future<void> _loadPorts() async {
    setState(() => _loading = true);
    final ep = Provider.of<ElementProvider>(context, listen: false);
    final ports = await ep.fetchCtoPorts(
      widget.element.projetoId,
      widget.element.id,
    );
    if (mounted) {
      setState(() { _ports = ports; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (_loading) {
      return const Padding(padding: EdgeInsets.all(8),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)));
    }
    if (_ports == null || _ports!.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest.withOpacity(0.5),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Text('Nenhuma porta encontrada', style: TextStyle(fontSize: 12)),
      );
    }

    final ports = _ports!;
    final ocupadas = ports.where((CtoPort p) => p.isOccupied).length;
    final livres = ports.where((CtoPort p) => p.isFree).length;

    return Container(
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: cs.outline.withOpacity(0.3)),
      ),
      child: Column(children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: cs.primaryContainer.withOpacity(0.3),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
          ),
          child: Text('Portas: $ocupadas ocupadas / $livres livres / ${ports.length} total',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
        ),
        SizedBox(
          height: 160,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: ports.length,
            itemBuilder: (_, i) {
              final p = ports[i];
              final color = p.isOccupied ? Colors.green
                  : p.isSplitter ? Colors.orange : Colors.grey;
              return ListTile(
                dense: true,
                visualDensity: VisualDensity.compact,
                onTap: () {
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => CtoPortEditScreen(
                      projectId: widget.element.projetoId,
                      ctoId: widget.element.id,
                      ctoName: widget.element.nome,
                    ),
                  )).then((_) => _loadPorts());
                },
                leading: CircleAvatar(
                  radius: 12,
                  backgroundColor: color.withOpacity(0.2),
                  child: Text('${p.num}',
                    style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.bold)),
                ),
                title: Text(
                  p.isOccupied && p.clientNome != null
                      ? p.clientNome!
                      : p.isSplitter ? 'Splitter ${p.splitterType}' : 'Livre',
                  style: const TextStyle(fontSize: 12)),
                subtitle: p.obs != null
                    ? Text(p.obs!, style: const TextStyle(fontSize: 10))
                    : null,
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(p.status, style: TextStyle(fontSize: 9, color: color)),
                ),
              );
            },
          ),
        ),
      ]),
    );
  }
}
