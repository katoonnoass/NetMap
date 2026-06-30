import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/providers/element_provider.dart';
import 'package:netmap_mobile/config/element_types.dart';
import 'package:netmap_mobile/models/element.dart';

class TraceScreen extends StatefulWidget {
  final String projectId;
  final NetmapElement startElement;
  const TraceScreen({
    super.key,
    required this.projectId,
    required this.startElement,
  });
  @override State<TraceScreen> createState() => _TraceScreenState();
}

class _TraceScreenState extends State<TraceScreen> {
  Map<String, dynamic>? _trace;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final ep = Provider.of<ElementProvider>(context, listen: false);
    final trace = await ep.fetchTrace(widget.projectId, widget.startElement.id);
    if (mounted) setState(() { _trace = trace; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text('Caminho optico - ${widget.startElement.nome}'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _trace == null
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.route, size: 48, color: cs.onSurfaceVariant.withOpacity(0.5)),
                    const SizedBox(height: 8),
                    Text('Nao foi possivel calcular a rota',
                        style: TextStyle(color: cs.onSurfaceVariant)),
                  ]),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildSummaryCard(cs),
                      const SizedBox(height: 16),
                      if (_trace!['nodes'] is List && (_trace!['nodes'] as List).isNotEmpty)
                        _buildHopList(cs),
                    ],
                  ),
                ),
    );
  }

  Widget _buildSummaryCard(ColorScheme cs) {
    final hopCount = _trace!['hop_count'] as int? ?? 0;
    final totalLength = (_trace!['total_length'] as num?)?.toDouble() ?? 0;
    final broken = _trace!['broken_segments'] as int? ?? 0;
    final reachable = _trace!['reachable'] as bool? ?? false;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Icon(
            reachable ? Icons.check_circle : Icons.error,
            size: 48,
            color: reachable ? Colors.green : Colors.red,
          ),
          const SizedBox(height: 8),
          Text(reachable ? 'Sinal OK' : 'Sinal interrompido',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
            _statItem(Icons.hub, '$hopCount', 'Hops', cs),
            _statItem(Icons.straighten, '${totalLength}m', 'Distancia', cs),
            _statItem(Icons.link_off, '$broken', 'Rompidos', cs, broken > 0 ? Colors.red : null),
          ]),
        ]),
      ),
    );
  }

  Widget _statItem(IconData icon, String value, String label, ColorScheme cs, [Color? color]) {
    final c = color ?? cs.primary;
    return Column(children: [
      Icon(icon, color: c, size: 24),
      const SizedBox(height: 4),
      Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: c)),
      Text(label, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
    ]);
  }

  Widget _buildHopList(ColorScheme cs) {
    final nodes = _trace!['nodes'] as List;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Hops (${nodes.length})',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...nodes.asMap().entries.map((entry) {
          final i = entry.key;
          final node = entry.value as Map<String, dynamic>;
          final tipo = node['tipo'] as String? ?? '';
          final nome = node['nome'] as String? ?? '';
          final status = node['status'] as String? ?? '';
          final broken = node['broken'] as bool? ?? false;

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(children: [
                Container(
                  width: 28, height: 28,
                  decoration: BoxDecoration(
                    color: broken ? Colors.red.withOpacity(0.2)
                        : cs.primary.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text('${i + 1}',
                        style: TextStyle(fontSize: 11,
                            color: broken ? Colors.red : cs.primary,
                            fontWeight: FontWeight.bold)),
                  ),
                ),
                if (i < nodes.length - 1)
                  Container(
                    width: 2, height: 30,
                    color: broken ? Colors.red.withOpacity(0.4)
                        : cs.outlineVariant.withOpacity(0.5),
                  ),
              ]),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  margin: const EdgeInsets.only(bottom: 4),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: broken ? Colors.red.withOpacity(0.05)
                        : cs.surfaceContainerHighest.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                    border: broken ? Border.all(color: Colors.red.withOpacity(0.3)) : null,
                  ),
                  child: Row(children: [
                    Icon(ElementTypes.iconFor(tipo), size: 18,
                        color: ElementTypes.colorFor(tipo)),
                    const SizedBox(width: 8),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(nome,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                        Text('${ElementTypes.labelFor(tipo)} - $status',
                            style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                      ],
                    )),
                    if (broken)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('ROMPIDO',
                            style: TextStyle(fontSize: 9, color: Colors.red, fontWeight: FontWeight.bold)),
                      ),
                  ]),
                ),
              ),
            ],
          );
        }),
      ],
    );
  }
}
