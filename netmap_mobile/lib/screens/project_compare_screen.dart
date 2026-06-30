import 'package:flutter/material.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/providers/project_provider.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/models/project.dart';

class ProjectCompareScreen extends StatefulWidget {
  const ProjectCompareScreen({super.key});
  @override State<ProjectCompareScreen> createState() => _ProjectCompareScreenState();
}

class _ProjectCompareScreenState extends State<ProjectCompareScreen> {
  final _api = ApiService();
  Project? _projA;
  Project? _projB;
  Map<String, dynamic>? _result;
  bool _loading = false;

  void _compare() async {
    if (_projA == null || _projB == null) return;
    setState(() => _loading = true);
    try {
      final response = await _api.get(
        ApiConfig.projectCompareEndpoint(_projA!.id, _projB!.id),
      );
      if (mounted) setState(() { _result = response.data as Map<String, dynamic>; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final projects = Provider.of<ProjectProvider>(context).projects;

    return Scaffold(
      appBar: AppBar(title: const Text('Comparar Projetos')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<Project>(
            value: _projA,
            decoration: const InputDecoration(labelText: 'Projeto A', border: OutlineInputBorder()),
            items: projects.map((p) => DropdownMenuItem(value: p, child: Text(p.nome))).toList(),
            onChanged: (v) => setState(() { _projA = v; _result = null; }),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<Project>(
            value: _projB,
            decoration: const InputDecoration(labelText: 'Projeto B', border: OutlineInputBorder()),
            items: projects.map((p) => DropdownMenuItem(value: p, child: Text(p.nome))).toList(),
            onChanged: (v) => setState(() { _projB = v; _result = null; }),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: (_projA == null || _projB == null || _loading) ? null : _compare,
            icon: _loading
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.compare_arrows),
            label: const Text('Comparar'),
          ),
          if (_result != null) ...[
            const SizedBox(height: 24),
            _buildDiffSection('Elementos', _result!['total_elements'], cs),
            _buildDiffSection('Conexoes', _result!['total_connections'], cs),
            _buildDiffSection('Cabos (m)', _result!['total_cable_m'], cs),
            _buildDiffSection('Cabos Rompidos', _result!['broken_connections'], cs),
            _buildDiffSection('Incidentes Abertos', _result!['open_incidents'], cs),
            _buildDiffSection('Total Incidentes', _result!['total_incidents'], cs),
            if (_result!['type_diff'] is List) ...[
              const SizedBox(height: 16),
              Text('Diferenca por Tipo', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ...(_result!['type_diff'] as List).map((diff) {
                final d = diff as Map<String, dynamic>;
                final diffVal = d['diff'] as int? ?? 0;
                final icon = diffVal > 0 ? Icons.trending_up : diffVal < 0 ? Icons.trending_down : Icons.remove;
                final color = diffVal > 0 ? Colors.green : diffVal < 0 ? Colors.red : Colors.grey;
                return ListTile(
                  dense: true,
                  leading: Icon(icon, color: color, size: 18),
                  title: Text(d['tipo'] as String? ?? '', style: const TextStyle(fontSize: 13)),
                  trailing: Text(
                    '${d['a']} -> ${d['b']} (${diffVal >= 0 ? '+' : ''}$diffVal)',
                    style: TextStyle(color: color, fontWeight: FontWeight.w500),
                  ),
                );
              }),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildDiffSection(String label, dynamic value, ColorScheme cs) {
    if (value == null) return const SizedBox.shrink();
    final aVal = value is Map ? value['a'] : value;
    final bVal = value is Map ? value['b'] : value;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        SizedBox(width: 140, child: Text(label, style: TextStyle(color: cs.onSurfaceVariant))),
        Text('$aVal', style: const TextStyle(fontWeight: FontWeight.w500)),
        const SizedBox(width: 8),
        Icon(Icons.arrow_forward, size: 14, color: cs.onSurfaceVariant),
        const SizedBox(width: 8),
        Text('$bVal', style: const TextStyle(fontWeight: FontWeight.w500)),
      ]),
    );
  }
}
