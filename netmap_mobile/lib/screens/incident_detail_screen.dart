import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/models/incident.dart';
import 'package:netmap_mobile/providers/auth_provider.dart';
import 'package:netmap_mobile/providers/incident_provider.dart';
import 'package:netmap_mobile/screens/incident_form_screen.dart';

class IncidentDetailScreen extends StatefulWidget {
  final String projectId;
  final Incident incident;
  const IncidentDetailScreen({
    super.key,
    required this.projectId,
    required this.incident,
  });

  @override
  State<IncidentDetailScreen> createState() => _IncidentDetailScreenState();
}

class _IncidentDetailScreenState extends State<IncidentDetailScreen> {
  final _commentCtrl = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendComment() async {
    final text = _commentCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _sending = true);
    final ip = Provider.of<IncidentProvider>(context, listen: false);
    await ip.addComment(widget.projectId, widget.incident.id, text);
    _commentCtrl.clear();
    setState(() => _sending = false);
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

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final canEdit = Provider.of<AuthProvider>(context).canEdit;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Incidente'),
        actions: [
          if (canEdit)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => IncidentFormScreen(
                    projectId: widget.projectId,
                    incident: widget.incident,
                  ),
                ));
              },
            ),
        ],
      ),
      body: Consumer<IncidentProvider>(
        builder: (context, ip, _) {
          final incident = ip.incidents.where((i) => i.id == widget.incident.id).firstOrNull
              ?? widget.incident;
          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(incident.title,
                      style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 12),
                    Row(children: [
                      _chip(incident.statusLabel, Colors.blue),
                      const SizedBox(width: 8),
                      _chip(incident.severityLabel, _severityColor(incident.severity)),
                      const SizedBox(width: 8),
                      _chip(incident.categoryLabel, Colors.blueGrey),
                    ]),
                    if (incident.assignedTo.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Row(children: [
                        Icon(Icons.person, size: 16, color: cs.onSurfaceVariant),
                        const SizedBox(width: 6),
                        Text(incident.assignedTo, style: TextStyle(color: cs.onSurfaceVariant)),
                      ]),
                    ],
                    const SizedBox(height: 4),
                    Text('Criado em: ${incident.createdAt}',
                      style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                    if (incident.notes.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text('Descrição', style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 4),
                      Text(incident.notes),
                    ],
                    const SizedBox(height: 24),
                    Text('Comentários (${incident.comments.length})',
                      style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    if (incident.comments.isEmpty)
                      Text('Nenhum comentário', style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13))
                    else
                      ...incident.comments.map((c) => _commentCard(c, cs)),
                  ],
                ),
              ),
              if (canEdit)
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 8, 8, 16),
                  decoration: BoxDecoration(
                    color: cs.surface,
                    border: Border(top: BorderSide(color: cs.outlineVariant)),
                  ),
                  child: Row(children: [
                    Expanded(
                      child: TextField(
                        controller: _commentCtrl,
                        decoration: const InputDecoration(
                          hintText: 'Adicionar comentário...',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        maxLines: 2,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _sendComment(),
                      ),
                    ),
                    IconButton(
                      onPressed: _sending ? null : _sendComment,
                      icon: _sending
                          ? const SizedBox(width: 20, height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : Icon(Icons.send, color: cs.primary),
                    ),
                  ]),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
    );
  }

  Widget _commentCard(IncidentComment c, ColorScheme cs) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(Icons.person, size: 16, color: cs.primary),
              const SizedBox(width: 6),
              Text(c.author, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const Spacer(),
              Text(c.createdAt.toIso8601String().split('T')[0], style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
            ]),
            const SizedBox(height: 6),
            Text(c.text, style: const TextStyle(fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
