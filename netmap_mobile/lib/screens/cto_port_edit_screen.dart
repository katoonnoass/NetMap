import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/models/cto_port.dart';
import 'package:netmap_mobile/providers/element_provider.dart';

class CtoPortEditScreen extends StatefulWidget {
  final String projectId;
  final int ctoId;
  final String ctoName;
  const CtoPortEditScreen({
    super.key,
    required this.projectId,
    required this.ctoId,
    required this.ctoName,
  });
  @override State<CtoPortEditScreen> createState() => _CtoPortEditScreenState();
}

class _CtoPortEditScreenState extends State<CtoPortEditScreen> {
  List<CtoPort>? _ports;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPorts();
  }

  Future<void> _loadPorts() async {
    setState(() => _loading = true);
    final ep = Provider.of<ElementProvider>(context, listen: false);
    final ports = await ep.fetchCtoPorts(widget.projectId, widget.ctoId);
    if (mounted) setState(() { _ports = ports; _loading = false; });
  }

  void _editPort(CtoPort port) {
    final clientCtrl = TextEditingController(
      text: port.clientNome ?? (port.clientId?.toString() ?? ''),
    );
    final obsCtrl = TextEditingController(text: port.obs ?? '');
    String selectedStatus = port.status;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
            left: 16, right: 16, top: 16,
          ),
          child: SafeArea(
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Porta #${port.num}', style: Theme.of(ctx).textTheme.titleMedium),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: selectedStatus,
                decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'livre', child: Text('Livre')),
                  DropdownMenuItem(value: 'ocupado', child: Text('Ocupado')),
                  DropdownMenuItem(value: 'manutencao', child: Text('Manutencao')),
                  DropdownMenuItem(value: 'reservado', child: Text('Reservado')),
                ],
                onChanged: (v) { if (v != null) setSheetState(() => selectedStatus = v); },
              ),
              const SizedBox(height: 8),
              TextField(
                controller: clientCtrl,
                decoration: const InputDecoration(
                  labelText: 'Cliente (nome ou ID)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: obsCtrl,
                decoration: const InputDecoration(labelText: 'Observacao', border: OutlineInputBorder()),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              if (selectedStatus == 'ocupado' && port.splitterType == null) ...[
                Row(children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.call_split, size: 16),
                      label: const Text('Splitter 1:2'),
                      onPressed: () async {
                        final ep = Provider.of<ElementProvider>(context, listen: false);
                        final ok = await ep.addSplitter(
                          widget.projectId, widget.ctoId, port.num, '1:2');
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: Text(ok ? 'Splitter adicionado' : 'Erro ao adicionar splitter')),
                          );
                          if (ok) { Navigator.pop(ctx); _loadPorts(); }
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.call_split, size: 16),
                      label: const Text('Splitter 1:4'),
                      onPressed: () async {
                        final ep = Provider.of<ElementProvider>(context, listen: false);
                        final ok = await ep.addSplitter(
                          widget.projectId, widget.ctoId, port.num, '1:4');
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: Text(ok ? 'Splitter adicionado' : 'Erro ao adicionar splitter')),
                          );
                          if (ok) { Navigator.pop(ctx); _loadPorts(); }
                        }
                      },
                    ),
                  ),
                ]),
              ],
              if (port.splitterType != null) ...[
                Chip(
                  label: Text('Splitter ${port.splitterType}'),
                  deleteIcon: const Icon(Icons.close, size: 16),
                  onDeleted: () async {
                    final ep = Provider.of<ElementProvider>(context, listen: false);
                    final ok = await ep.removeSplitter(
                      widget.projectId, widget.ctoId, port.num);
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        SnackBar(content: Text(ok ? 'Splitter removido' : 'Erro ao remover splitter')),
                      );
                      if (ok) { Navigator.pop(ctx); _loadPorts(); }
                    }
                  },
                ),
              ],
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () async {
                  final ep = Provider.of<ElementProvider>(context, listen: false);
                  final data = <String, dynamic>{'status': selectedStatus};
                  final clientVal = clientCtrl.text.trim();
                  if (clientVal.isNotEmpty) {
                    final parsed = int.tryParse(clientVal);
                    if (parsed != null) {
                      data['client_id'] = parsed;
                    } else {
                      data['client_nome'] = clientVal;
                    }
                  }
                  if (obsCtrl.text.trim().isNotEmpty) {
                    data['obs'] = obsCtrl.text.trim();
                  }
                  final ok = await ep.updateCtoPort(
                    widget.projectId, widget.ctoId, port.num, data);
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(content: Text(ok ? 'Porta atualizada' : 'Erro ao atualizar')),
                    );
                    if (ok) { Navigator.pop(ctx); _loadPorts(); }
                  }
                },
                child: const Text('Salvar'),
              ),
              const SizedBox(height: 8),
            ]),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Portas - ${widget.ctoName}'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _ports == null || _ports!.isEmpty
              ? const Center(child: Text('Nenhuma porta'))
              : RefreshIndicator(
                  onRefresh: _loadPorts,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: _ports!.length,
                    itemBuilder: (_, i) {
                      final p = _ports![i];
                      final color = p.isOccupied
                          ? Colors.green
                          : p.isSplitter
                              ? Colors.orange
                              : p.status == 'manutencao'
                                  ? Colors.red
                                  : Colors.grey;
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: color.withOpacity(0.2),
                            child: Text('${p.num}',
                                style: TextStyle(color: color, fontWeight: FontWeight.bold)),
                          ),
                          title: Text(
                            p.isOccupied && p.clientNome != null
                                ? p.clientNome!
                                : p.isSplitter
                                    ? 'Splitter ${p.splitterType}'
                                    : p.status,
                            style: const TextStyle(fontSize: 14),
                          ),
                          subtitle: p.obs != null
                              ? Text(p.obs!, style: const TextStyle(fontSize: 11))
                              : null,
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(p.status, style: TextStyle(fontSize: 10, color: color)),
                          ),
                          onTap: () => _editPort(p),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
