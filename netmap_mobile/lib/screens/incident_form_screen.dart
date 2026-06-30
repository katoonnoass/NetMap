import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/models/incident.dart';
import 'package:netmap_mobile/providers/incident_provider.dart';
import 'package:netmap_mobile/widgets/error_banner.dart';

class IncidentFormScreen extends StatefulWidget {
  final String projectId;
  final Incident? incident;
  final int? elementId;

  const IncidentFormScreen({
    super.key,
    required this.projectId,
    this.incident,
    this.elementId,
  });

  @override
  State<IncidentFormScreen> createState() => _IncidentFormScreenState();
}

class _IncidentFormScreenState extends State<IncidentFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _assignedCtrl = TextEditingController();
  String _status = 'open';
  String _severity = 'medium';
  String _category = 'rede';
  bool _loading = false;
  String? _error;
  bool get _edit => widget.incident != null;

  static const _statuses = ['open', 'in_progress', 'resolved', 'closed'];
  static const _severities = ['low', 'medium', 'high', 'critical'];
  static const _categories = ['rede', 'hardware', 'software', 'seguranca', 'atendimento', 'outro'];

  static const _statusLabels = {
    'open': 'Aberto', 'in_progress': 'Em Andamento',
    'resolved': 'Resolvido', 'closed': 'Fechado',
  };
  static const _severityLabels = {
    'low': 'Baixa', 'medium': 'Média', 'high': 'Alta', 'critical': 'Crítica',
  };
  static const _categoryLabels = {
    'rede': 'Rede', 'hardware': 'Hardware', 'software': 'Software',
    'seguranca': 'Segurança', 'atendimento': 'Atendimento', 'outro': 'Outro',
  };

  @override
  void initState() {
    super.initState();
    if (_edit) {
      final i = widget.incident!;
      _titleCtrl.text = i.title;
      _notesCtrl.text = i.notes;
      _assignedCtrl.text = i.assignedTo;
      _status = i.status;
      _severity = i.severity;
      _category = i.category;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _notesCtrl.dispose();
    _assignedCtrl.dispose();
    super.dispose();
  }

  Color _colorFor(String severity) {
    switch (severity) {
      case 'critical': return Colors.red;
      case 'high': return Colors.orange;
      case 'medium': return Colors.amber;
      default: return Colors.grey;
    }
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });

    final data = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'status': _status,
      'severity': _severity,
      'category': _category,
      'assigned_to': _assignedCtrl.text.trim(),
      'notes': _notesCtrl.text.trim(),
    };
    if (widget.elementId != null) {
      data['element_id'] = widget.elementId;
    }

    final ip = Provider.of<IncidentProvider>(context, listen: false);
    try {
      if (_edit) {
        await ip.updateIncident(widget.projectId, widget.incident!.id, data);
      } else {
        await ip.createIncident(widget.projectId, data);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      setState(() => _error = 'Erro ao salvar: $e');
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(_edit ? 'Editar Incidente' : 'Novo Incidente')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            ErrorBanner(message: _error, onDismiss: () => setState(() => _error = null)),
            const SizedBox(height: 16),
            TextFormField(
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Titulo *', border: OutlineInputBorder()),
              validator: (v) => v == null || v.trim().isEmpty ? 'Titulo obrigatorio' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder()),
              items: _statuses.map((s) => DropdownMenuItem(
                value: s, child: Text(_statusLabels[s] ?? s),
              )).toList(),
              onChanged: (v) => setState(() => _status = v!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _severity,
              decoration: const InputDecoration(labelText: 'Severidade', border: OutlineInputBorder()),
              items: _severities.map((s) => DropdownMenuItem(
                value: s,
                child: Row(children: [
                  Container(width: 12, height: 12, decoration: BoxDecoration(
                    color: _colorFor(s), shape: BoxShape.circle,
                  )),
                  const SizedBox(width: 8),
                  Text(_severityLabels[s] ?? s),
                ]),
              )).toList(),
              onChanged: (v) => setState(() => _severity = v!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Categoria', border: OutlineInputBorder()),
              items: _categories.map((c) => DropdownMenuItem(
                value: c, child: Text(_categoryLabels[c] ?? c),
              )).toList(),
              onChanged: (v) => setState(() => _category = v!),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _assignedCtrl,
              decoration: const InputDecoration(labelText: 'Responsavel', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(labelText: 'Descricao', border: OutlineInputBorder(), alignLabelWithHint: true),
              maxLines: 4,
            ),
            if (widget.elementId != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: cs.primaryContainer.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(children: [
                  Icon(Icons.link, size: 16, color: cs.primary),
                  const SizedBox(width: 8),
                  Text('Vinculado ao elemento #${widget.elementId}',
                    style: TextStyle(fontSize: 12, color: cs.primary)),
                ]),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity, height: 48,
              child: FilledButton(
                onPressed: _loading ? null : _salvar,
                child: _loading
                    ? const SizedBox(width: 24, height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Salvar'),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
