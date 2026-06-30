import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/providers/element_provider.dart';
import 'package:netmap_mobile/models/element.dart';

class ElementHistoryScreen extends StatefulWidget {
  final String projectId;
  final NetmapElement element;
  const ElementHistoryScreen({
    super.key,
    required this.projectId,
    required this.element,
  });
  @override State<ElementHistoryScreen> createState() => _ElementHistoryScreenState();
}

class _ElementHistoryScreenState extends State<ElementHistoryScreen> {
  List<Map<String, dynamic>>? _events;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final ep = Provider.of<ElementProvider>(context, listen: false);
    final events = await ep.fetchElementHistory(widget.projectId, widget.element.id);
    if (mounted) setState(() { _events = events; _loading = false; });
  }

  IconData _iconForAction(String action) {
    if (action.contains('create') || action.contains('created')) return Icons.add_circle_outline;
    if (action.contains('update') || action.contains('updated')) return Icons.edit_outlined;
    if (action.contains('delete') || action.contains('deleted')) return Icons.delete_outline;
    if (action.contains('broken') || action.contains('rompido')) return Icons.link_off;
    if (action.contains('signal') || action.contains('sinal')) return Icons.speed;
    if (action.contains('photo') || action.contains('foto')) return Icons.photo;
    return Icons.info_outline;
  }

  Color _colorForAction(String action) {
    if (action.contains('create') || action.contains('created')) return Colors.green;
    if (action.contains('update') || action.contains('updated')) return Colors.blue;
    if (action.contains('delete') || action.contains('deleted')) return Colors.red;
    if (action.contains('broken') || action.contains('rompido')) return Colors.red;
    if (action.contains('signal') || action.contains('sinal')) return Colors.orange;
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text('Historico - ${widget.element.nome}'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _events == null || _events!.isEmpty
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.history, size: 48, color: cs.onSurfaceVariant.withOpacity(0.5)),
                    const SizedBox(height: 8),
                    Text('Nenhum evento encontrado', style: TextStyle(color: cs.onSurfaceVariant)),
                  ]),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _events!.length,
                    itemBuilder: (_, i) {
                      final ev = _events![i];
                      final action = ev['action'] as String? ?? '';
                      final message = ev['message'] as String? ?? '';
                      final username = ev['username'] as String? ?? 'sistema';
                      final timestamp = ev['timestamp'] as String? ?? '';
                      final dt = timestamp.isNotEmpty
                          ? DateTime.tryParse(timestamp)
                          : null;

                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(children: [
                            Container(
                              width: 32, height: 32,
                              decoration: BoxDecoration(
                                color: _colorForAction(action).withOpacity(0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(_iconForAction(action), size: 16,
                                  color: _colorForAction(action)),
                            ),
                            if (i < _events!.length - 1)
                              Container(
                                width: 2,
                                height: 40,
                                color: cs.outlineVariant.withOpacity(0.5),
                              ),
                          ]),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(message,
                                    style: const TextStyle(fontSize: 13)),
                                const SizedBox(height: 2),
                                Row(children: [
                                  Icon(Icons.person, size: 11,
                                      color: cs.onSurfaceVariant.withOpacity(0.6)),
                                  const SizedBox(width: 3),
                                  Text(username,
                                      style: TextStyle(fontSize: 11,
                                          color: cs.onSurfaceVariant.withOpacity(0.6))),
                                  if (dt != null) ...[
                                    const SizedBox(width: 8),
                                    Text(
                                      '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}',
                                      style: TextStyle(fontSize: 11,
                                          color: cs.onSurfaceVariant.withOpacity(0.5)),
                                    ),
                                  ],
                                ]),
                                const SizedBox(height: 12),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
    );
  }
}
