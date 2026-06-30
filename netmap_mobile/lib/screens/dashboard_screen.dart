import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/providers/element_provider.dart';

class DashboardScreen extends StatefulWidget {
  final String projectId;
  const DashboardScreen({super.key, required this.projectId});
  @override State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _summary;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final ep = Provider.of<ElementProvider>(context, listen: false);
    final summary = await ep.fetchSummary(widget.projectId);
    if (mounted) setState(() { _summary = summary; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _summary == null
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.dashboard, size: 48, color: cs.onSurfaceVariant.withOpacity(0.5)),
                    const SizedBox(height: 8),
                    Text('Nao foi possivel carregar metricas',
                        style: TextStyle(color: cs.onSurfaceVariant)),
                    const SizedBox(height: 16),
                    OutlinedButton(onPressed: _load, child: const Text('Tentar novamente')),
                  ]),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Status counts
                      Text('Status dos Elementos',
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      _buildStatusCards(cs),
                      const SizedBox(height: 24),
                      // Type counts
                      Text('Por Tipo',
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      _buildTypeCards(cs),
                      const SizedBox(height: 24),
                      // General metrics
                      Text('Metricas Gerais',
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      _buildGeneralCards(cs),
                    ],
                  ),
                ),
    );
  }

  Widget _buildStatusCards(ColorScheme cs) {
    final statusCounts = _summary!['status_counts'] as Map<String, dynamic>? ?? {};
    final colors = {
      'ativo': Colors.green,
      'online': Colors.green,
      'offline': Colors.red,
      'alerta': Colors.orange,
      'manutencao': Colors.blueGrey,
      'inativo': Colors.grey,
    };
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: statusCounts.entries.map((e) {
        final color = colors[e.key] ?? cs.primary;
        return SizedBox(
          width: 100,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(children: [
                Text('${e.value}',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
                Text(e.key, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
              ]),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTypeCards(ColorScheme cs) {
    final typeCounts = _summary!['type_counts'] as Map<String, dynamic>? ?? {};
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: typeCounts.entries.map((e) {
        final color = Colors.primaries[e.key.hashCode % Colors.primaries.length];
        return SizedBox(
          width: 90,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(children: [
                Text('${e.value}',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
                Text(e.key, style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant)),
              ]),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildGeneralCards(ColorScheme cs) {
    final totalElements = _summary!['total_elements'] as int? ?? 0;
    final totalConnections = _summary!['total_connections'] as int? ?? 0;
    final totalCableM = (_summary!['total_cable_m'] as num?)?.toDouble() ?? 0;
    final brokenConnections = _summary!['broken_connections'] as int? ?? 0;
    final openIncidents = _summary!['open_incidents'] as int? ?? 0;
    final totalIncidents = _summary!['total_incidents'] as int? ?? 0;

    return Column(children: [
      Row(children: [
        Expanded(child: _metricCard(Icons.devices, '$totalElements', 'Elementos', cs.primary, cs)),
        const SizedBox(width: 8),
        Expanded(child: _metricCard(Icons.link, '$totalConnections', 'Conexoes', cs.primary, cs)),
      ]),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(child: _metricCard(Icons.straighten, '${totalCableM.toStringAsFixed(0)}m', 'Cabos', cs.primary, cs)),
        const SizedBox(width: 8),
        Expanded(child: _metricCard(Icons.link_off, '$brokenConnections', 'Rompidos', brokenConnections > 0 ? Colors.red : Colors.green, cs)),
      ]),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(child: _metricCard(Icons.warning, '$openIncidents', 'Incidentes abertos', openIncidents > 0 ? Colors.orange : Colors.green, cs)),
        const SizedBox(width: 8),
        Expanded(child: _metricCard(Icons.checklist, '$totalIncidents', 'Total incidentes', cs.primary, cs)),
      ]),
    ]);
  }

  Widget _metricCard(IconData icon, String value, String label, Color color, ColorScheme cs) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
          ]),
        ]),
      ),
    );
  }
}
