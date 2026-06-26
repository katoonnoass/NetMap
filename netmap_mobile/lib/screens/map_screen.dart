import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:netmap_mobile/models/element.dart';
import 'package:netmap_mobile/models/cto_port.dart';
import 'package:netmap_mobile/models/project.dart';
import 'package:netmap_mobile/providers/element_provider.dart';
import 'package:netmap_mobile/widgets/element_pin.dart';
import 'package:netmap_mobile/widgets/loading_overlay.dart';
import 'package:netmap_mobile/screens/element_form_screen.dart';

class MapScreen extends StatefulWidget {
  final Project project;
  const MapScreen({super.key, required this.project});
  @override State<MapScreen> createState() => _MapScreenState();
}

class _OsmTileProvider extends TileProvider {
  @override
  ImageProvider getImage(TileCoordinates coordinates, TileLayer options) {
    return NetworkImage(
      getTileUrl(coordinates, options),
      headers: const {'User-Agent': 'NetMapMobile/1.0'},
    );
  }
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  bool _placement = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ep = Provider.of<ElementProvider>(context, listen: false);
      ep.fetchElements(widget.project.id);
      ep.fetchConnections(widget.project.id);
    });
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
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

  void _openForm({double? lat, double? lng, NetmapElement? element}) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ElementFormScreen(
        projectId: widget.project.id, element: element, initialLat: lat, initialLng: lng,
      ),
    ));
  }

  void _sheet(NetmapElement e) {
    final isCto = e.tipo.toLowerCase() == 'cto';
    showModalBottomSheet(context: context, builder: (ctx) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(e.nome, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text('Tipo: ${e.tipo}'), Text('Status: ${e.status ?? '-'}'),
          if (e.observacao != null && e.observacao!.isNotEmpty) Text('Obs: ${e.observacao}'),
          if (isCto) ...[
            const SizedBox(height: 8),
            _CtoPortsPanel(element: e),
          ],
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: OutlinedButton.icon(
              icon: const Icon(Icons.edit), label: const Text('Editar'),
              onPressed: () { Navigator.pop(ctx); _openForm(element: e); },
            )),
            const SizedBox(width: 12),
            Expanded(child: FilledButton.icon(
              icon: const Icon(Icons.navigation), label: const Text('Navegar'),
              onPressed: () async {
                Navigator.pop(ctx);
                final uri = Uri.parse(
                  'https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}',
                );
                final messenger = ScaffoldMessenger.of(context);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                } else {
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Não foi possível abrir o mapa')),
                  );
                }
              },
            )),
          ]),
        ]),
      ),
    ));
  }

  Future<void> _myLocation() async {
    if (!await Geolocator.isLocationServiceEnabled()) { _toast('GPS desativado'); return; }
    var p = await Geolocator.checkPermission();
    if (p == LocationPermission.denied) p = await Geolocator.requestPermission();
    if (p == LocationPermission.denied || p == LocationPermission.deniedForever) { _toast('Permissão negada'); return; }
    final pos = await Geolocator.getCurrentPosition();
    _mapController.move(LatLng(pos.latitude, pos.longitude), 16);
  }

  void _toast(String m) => ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(m), backgroundColor: Theme.of(context).colorScheme.error),
  );

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
    final ep = Provider.of<ElementProvider>(context);
    final markers = ep.elementsWithCoords.map((e) => Marker(
      point: LatLng(e.lat!, e.lng!), width: 80, height: 80,
      child: ElementPin(element: e, onTap: () => _sheet(e)),
    )).toList();

    final polylines = _buildConnectionPolylines(ep);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.project.nome),
        leading: BackButton(onPressed: () => Navigator.pop(context)),
        actions: [IconButton(icon: const Icon(Icons.add), onPressed: () => _openForm())],
      ),
      body: Stack(children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: const LatLng(-14.2350, -51.9253),
            initialZoom: 4, minZoom: 3, maxZoom: 18,
            onTap: _onTap, onLongPress: _onLongPress,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              tileProvider: _OsmTileProvider(),
            ),
            PolylineLayer(polylines: polylines),
            MarkerLayer(markers: markers),
          ],
        ),
        if (ep.isLoading) const LoadingOverlay(isLoading: true, message: 'Carregando...'),
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
      ]),
    );
  }
}

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
      setState(() {
        _ports = ports;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_loading) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
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
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: cs.primaryContainer.withOpacity(0.3),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
            ),
            child: Text(
              'Portas: $ocupadas ocupadas / $livres livres / ${ports.length} total',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
          SizedBox(
            height: 160,
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: ports.length,
              itemBuilder: (_, i) {
                final p = ports[i];
                final color = p.isOccupied ? Colors.green
                    : p.isSplitter ? Colors.orange
                    : Colors.grey;
                return ListTile(
                  dense: true,
                  visualDensity: VisualDensity.compact,
                  leading: CircleAvatar(
                    radius: 12,
                    backgroundColor: color.withOpacity(0.2),
                    child: Text('${p.num}', style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.bold)),
                  ),
                  title: Text(
                    p.isOccupied && p.clientNome != null
                        ? p.clientNome!
                        : p.isSplitter ? 'Splitter ${p.splitterType}'
                        : 'Livre',
                    style: const TextStyle(fontSize: 12),
                  ),
                  subtitle: p.obs != null ? Text(p.obs!, style: const TextStyle(fontSize: 10)) : null,
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
        ],
      ),
    );
  }
}
