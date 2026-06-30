import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/config/element_types.dart';
import 'package:netmap_mobile/models/element.dart';
import 'package:netmap_mobile/models/project.dart';
import 'package:netmap_mobile/providers/auth_provider.dart';
import 'package:netmap_mobile/providers/element_provider.dart';
import 'package:netmap_mobile/providers/incident_provider.dart';
import 'package:netmap_mobile/providers/project_provider.dart';
import 'package:netmap_mobile/services/report_service.dart';

enum _Sort { nome, tipo, status }

class ElementListScreen extends StatefulWidget {
  final String projectId;
  const ElementListScreen({super.key, required this.projectId});

  @override
  State<ElementListScreen> createState() => _ElementListScreenState();
}

class _ElementListScreenState extends State<ElementListScreen> {
  final _searchCtrl = TextEditingController();
  String _tipoFilter = '';
  String _statusFilter = '';
  String _coordsFilter = '';
  _Sort _sort = _Sort.nome;
  bool _sortAsc = true;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<NetmapElement> _filter(List<NetmapElement> items) {
    var f = items.toList();

    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isNotEmpty) {
      f = f.where((e) =>
        e.nome.toLowerCase().contains(q) ||
        e.tipo.toLowerCase().contains(q) ||
        (e.endereco?.toLowerCase().contains(q) ?? false)
      ).toList();
    }

    if (_tipoFilter.isNotEmpty) {
      f = f.where((e) => e.tipo == _tipoFilter).toList();
    }
    if (_statusFilter.isNotEmpty) {
      f = f.where((e) => e.status == _statusFilter).toList();
    }
    if (_coordsFilter == 'com') {
      f = f.where((e) => e.hasCoords).toList();
    } else if (_coordsFilter == 'sem') {
      f = f.where((e) => !e.hasCoords).toList();
    }

    f.sort((a, b) {
      int cmp;
      switch (_sort) {
        case _Sort.nome: cmp = a.nome.compareTo(b.nome); break;
        case _Sort.tipo: cmp = a.tipo.compareTo(b.tipo); break;
        case _Sort.status: cmp = (a.status ?? '').compareTo(b.status ?? ''); break;
      }
      return _sortAsc ? cmp : -cmp;
    });

    return f;
  }

  Widget _filterChip(String label, String current, String selected,
      ValueChanged<String> onChanged, Map<String, String> options) {
    return PopupMenuButton<String>(
      onSelected: onChanged,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          border: Border.all(color: selected.isNotEmpty
              ? Theme.of(context).colorScheme.primary : Colors.grey),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          '$label: ${options[selected] ?? 'Todos'}',
          style: TextStyle(fontSize: 12,
            color: selected.isNotEmpty
                ? Theme.of(context).colorScheme.primary : null),
        ),
      ),
      itemBuilder: (_) => options.entries.map((e) =>
        PopupMenuItem(value: e.key, child: Text(e.value))).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ep = Provider.of<ElementProvider>(context);
    final canEdit = Provider.of<AuthProvider>(context).canEdit;
    final filtered = _filter(ep.elements);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text('Elementos (${filtered.length})'),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_download),
            tooltip: 'Exportar Relatório',
            onPressed: _showExportDialog,
          ),
          PopupMenuButton<_Sort>(
            icon: const Icon(Icons.sort),
            tooltip: 'Ordenar',
            onSelected: (v) {
              if (_sort == v) {
                setState(() => _sortAsc = !_sortAsc);
              } else {
                setState(() { _sort = v; _sortAsc = true; });
              }
            },
            itemBuilder: (_) => [
              PopupMenuItem(value: _Sort.nome,
                child: Row(children: [
                  if (_sort == _Sort.nome) Icon(_sortAsc ? Icons.arrow_upward : Icons.arrow_downward, size: 18),
                  const SizedBox(width: 8),
                  Text('Nome'),
                ])),
              PopupMenuItem(value: _Sort.tipo,
                child: Row(children: [
                  if (_sort == _Sort.tipo) Icon(_sortAsc ? Icons.arrow_upward : Icons.arrow_downward, size: 18),
                  const SizedBox(width: 8),
                  Text('Tipo'),
                ])),
              PopupMenuItem(value: _Sort.status,
                child: Row(children: [
                  if (_sort == _Sort.status) Icon(_sortAsc ? Icons.arrow_upward : Icons.arrow_downward, size: 18),
                  const SizedBox(width: 8),
                  Text('Status'),
                ])),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Buscar...',
                prefixIcon: const Icon(Icons.search, size: 20),
                border: const OutlineInputBorder(),
                contentPadding: const EdgeInsets.symmetric(vertical: 8),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () { _searchCtrl.clear(); setState(() {}); })
                    : null,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(children: [
              _filterChip('Tipo', '', _tipoFilter, (v) => setState(() => _tipoFilter = v),
                {'': 'Todos', ...{for (final t in ElementTypes.all) t: t}}),
              const SizedBox(width: 8),
              _filterChip('Status', '', _statusFilter, (v) => setState(() => _statusFilter = v),
                {'': 'Todos', 'ativo': 'Ativo', 'inativo': 'Inativo', 'previsto': 'Previsto'}),
              const SizedBox(width: 8),
              _filterChip('Coord', '', _coordsFilter, (v) => setState(() => _coordsFilter = v),
                {'': 'Todas', 'com': 'Com coordenada', 'sem': 'Sem coordenada'}),
            ]),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ep.isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? Center(
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.search_off, size: 64, color: cs.onSurfaceVariant),
                          const SizedBox(height: 16),
                          Text('Nenhum elemento encontrado',
                            style: Theme.of(context).textTheme.titleMedium),
                        ]),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) => _elementCard(filtered[i], cs, canEdit),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _elementCard(NetmapElement e, ColorScheme cs, bool canEdit) {
    final color = ElementTypes.colorFor(e.tipo);
    final icon = ElementTypes.iconFor(e.tipo);
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: CircleAvatar(
          radius: 18,
          backgroundColor: color.withOpacity(0.2),
          child: Icon(icon, size: 18, color: color),
        ),
        title: Text(e.nome, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        subtitle: Row(children: [
          Text(e.tipo, style: TextStyle(fontSize: 12, color: color)),
          if (e.status != null) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: e.status == 'ativo' ? Colors.green.withOpacity(0.15)
                    : e.status == 'inativo' ? Colors.red.withOpacity(0.15)
                    : Colors.grey.withOpacity(0.15),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(e.status!, style: TextStyle(fontSize: 10,
                color: e.status == 'ativo' ? Colors.green
                    : e.status == 'inativo' ? Colors.red : Colors.grey)),
            ),
          ],
          if (!e.hasCoords) ...[
            const SizedBox(width: 8),
            Icon(Icons.location_off, size: 12, color: cs.onSurfaceVariant),
          ],
        ]),
        trailing: e.endereco != null && e.endereco!.isNotEmpty
            ? Icon(Icons.location_on, size: 16, color: cs.onSurfaceVariant)
            : null,
        onTap: () => Navigator.pop(context, e),
      ),
    );
  }

  Future<void> _showExportDialog() async {
    final format = await showDialog<String>(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('Exportar Relatório'),
        children: [
          SimpleDialogOption(
            onPressed: () => Navigator.pop(context, 'pdf'),
            child: const Row(
              children: [
                Icon(Icons.picture_as_pdf, color: Colors.red),
                SizedBox(width: 12),
                Text('PDF (Relatório completo)'),
              ],
            ),
          ),
          SimpleDialogOption(
            onPressed: () => Navigator.pop(context, 'csv'),
            child: const Row(
              children: [
                Icon(Icons.table_chart, color: Colors.green),
                SizedBox(width: 12),
                Text('CSV (Planilhas separadas)'),
              ],
            ),
          ),
        ],
      ),
    );

    if (format != null && mounted) {
      await _exportReport(format);
    }
  }

  Future<void> _exportReport(String format) async {
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final elementProvider = context.read<ElementProvider>();
    final incidentProvider = context.read<IncidentProvider>();
    final projectProvider = context.read<ProjectProvider>();
    final project = projectProvider.projects.firstWhere(
      (p) => p.id == widget.projectId,
      orElse: () => Project(id: widget.projectId, nome: 'Projeto'),
    );

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      await ReportService.generateAndShareReport(
        project: project,
        elementProvider: elementProvider,
        incidentProvider: incidentProvider,
        format: format,
      );
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) Navigator.pop(context);
      if (mounted) {
        scaffoldMessenger.showSnackBar(
          SnackBar(content: Text('Erro ao exportar: $e')),
        );
      }
    }
  }
}
