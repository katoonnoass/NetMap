import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/models/incident.dart';
import 'package:netmap_mobile/models/project.dart';
import 'package:netmap_mobile/providers/element_provider.dart';
import 'package:netmap_mobile/providers/incident_provider.dart';
import 'package:netmap_mobile/providers/project_provider.dart';
import 'package:netmap_mobile/services/report_service.dart';
import 'package:netmap_mobile/screens/incident_form_screen.dart';
import 'package:netmap_mobile/screens/incident_detail_screen.dart';

class IncidentListScreen extends StatefulWidget {
  final String projectId;
  const IncidentListScreen({super.key, required this.projectId});

  @override
  State<IncidentListScreen> createState() => _IncidentListScreenState();
}

class _IncidentListScreenState extends State<IncidentListScreen> {
  String _statusFilter = '';
  String _severityFilter = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<IncidentProvider>(context, listen: false)
          .fetchIncidents(widget.projectId);
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<Incident> _filter(List<Incident> items) {
    var filtered = items;
    if (_statusFilter.isNotEmpty) {
      filtered = filtered.where((i) => i.status == _statusFilter).toList();
    }
    if (_severityFilter.isNotEmpty) {
      filtered = filtered.where((i) => i.severity == _severityFilter).toList();
    }
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isNotEmpty) {
      filtered = filtered.where((i) =>
        i.title.toLowerCase().contains(q) ||
        i.notes.toLowerCase().contains(q)
      ).toList();
    }
    return filtered;
  }

  Color _severityColor(String severity) {
    switch (severity) {
      case 'critical': return Colors.red;
      case 'high': return Colors.orange;
      case 'medium': return Colors.amber;
      case 'low': return Colors.grey;
      default: return Colors.grey;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'open': return Colors.red;
      case 'in_progress': return Colors.orange;
      case 'resolved': return Colors.green;
      case 'closed': return Colors.grey;
      default: return Colors.grey;
    }
  }

  Widget _chip(String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 3),
        Text(label, style: TextStyle(fontSize: 11, color: color)),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ip = Provider.of<IncidentProvider>(context);
    final filtered = _filter(ip.incidents);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Incidentes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_download),
            tooltip: 'Exportar Relatório',
            onPressed: _showExportDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Buscar incidentes...',
                prefixIcon: const Icon(Icons.search, size: 20),
                border: const OutlineInputBorder(),
                contentPadding: const EdgeInsets.symmetric(vertical: 8),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () { _searchCtrl.clear(); setState(() {}); },
                      )
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
              _filterChip('Status', '', _statusFilter, (v) => setState(() => _statusFilter = v),
                {'': 'Todos', 'open': 'Aberto', 'in_progress': 'Em Andamento', 'resolved': 'Resolvido', 'closed': 'Fechado'}),
              const SizedBox(width: 8),
              _filterChip('Severidade', '', _severityFilter, (v) => setState(() => _severityFilter = v),
                {'': 'Todas', 'low': 'Baixa', 'medium': 'Média', 'high': 'Alta', 'critical': 'Crítica'}),
            ]),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ip.isLoading && ip.incidents.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ip.incidents.isEmpty
                    ? _emptyState(cs)
                    : filtered.isEmpty
                        ? _emptyFilter(cs)
                        : RefreshIndicator(
                            onRefresh: () => ip.fetchIncidents(widget.projectId),
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              itemCount: filtered.length,
                              itemBuilder: (_, i) => _incidentCard(filtered[i], cs),
                            ),
                          ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'add_incident',
        onPressed: () => _openForm(),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _filterChip(String label, String currentVal, String selectedVal,
      ValueChanged<String> onChanged, Map<String, String> options) {
    return PopupMenuButton<String>(
      onSelected: onChanged,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          border: Border.all(color: selectedVal.isNotEmpty
              ? Theme.of(context).colorScheme.primary : Colors.grey),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          '$label: ${options[selectedVal] ?? 'Todos'}',
          style: TextStyle(fontSize: 12,
            color: selectedVal.isNotEmpty
                ? Theme.of(context).colorScheme.primary : null),
        ),
      ),
      itemBuilder: (_) => options.entries.map((e) =>
        PopupMenuItem(value: e.key, child: Text(e.value))).toList(),
    );
  }

  Widget _emptyState(ColorScheme cs) => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.report_outlined, size: 64, color: cs.onSurfaceVariant),
      const SizedBox(height: 16),
      Text('Nenhum incidente', style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 8),
      Text('Toque em + para criar um', style: TextStyle(color: cs.onSurfaceVariant)),
    ]),
  );

  Widget _emptyFilter(ColorScheme cs) => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.filter_alt_off, size: 64, color: cs.onSurfaceVariant),
      const SizedBox(height: 16),
      Text('Nenhum incidente corresponde ao filtro',
        style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
    ]),
  );

  Widget _incidentCard(Incident inc, ColorScheme cs) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _openDetail(inc),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(inc.title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14))),
                _chip(inc.statusLabel, Icons.circle, _statusColor(inc.status)),
              ]),
              const SizedBox(height: 6),
              Row(children: [
                _chip(inc.severityLabel, Icons.warning_amber, _severityColor(inc.severity)),
                const SizedBox(width: 6),
                _chip(inc.categoryLabel, Icons.category_outlined, Colors.blueGrey),
              ]),
              if (inc.assignedTo.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(children: [
                  Icon(Icons.person, size: 14, color: cs.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text(inc.assignedTo, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                ]),
              ],
              const SizedBox(height: 2),
                Text(inc.createdAt.toIso8601String().split('T')[0], style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
              if (inc.comments.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(children: [
                  Icon(Icons.comment, size: 14, color: cs.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text('${inc.comments.length} comentário(s)',
                    style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                ]),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _openForm({Incident? incident}) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => IncidentFormScreen(
        projectId: widget.projectId,
        incident: incident,
      ),
    ));
  }

  void _openDetail(Incident incident) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => IncidentDetailScreen(
        projectId: widget.projectId,
        incident: incident,
      ),
    ));
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
