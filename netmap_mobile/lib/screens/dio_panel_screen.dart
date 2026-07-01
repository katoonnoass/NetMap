import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/providers/cto_provider.dart';

class DioPanelScreen extends StatefulWidget {
  final String projectId;
  const DioPanelScreen({super.key, required this.projectId});
  @override State<DioPanelScreen> createState() => _DioPanelScreenState();
}

class _DioPanelScreenState extends State<DioPanelScreen> {
  final _api = ApiService();
  List<Map<String, dynamic>>? _dios;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final response = await _api.get(
        ApiConfig.projectDiosEndpoint(widget.projectId),
      );
      final data = response.data;
      final List<dynamic> rawList;
      if (data is List) {
        rawList = data;
      } else if (data is Map && data['items'] != null) {
        rawList = data['items'] as List;
      } else {
        rawList = [];
      }
      if (mounted) {
        setState(() {
          _dios = rawList.cast<Map<String, dynamic>>();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'ocupado':
      case 'ocupada':
        return Colors.green;
      case 'manutencao':
        return Colors.red;
      case 'reservado':
      case 'reservada':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'ocupado':
      case 'ocupada':
        return 'OCUP';
      case 'manutencao':
        return 'MANUT';
      case 'reservado':
      case 'reservada':
        return 'RES';
      default:
        return 'LIVRE';
    }
  }

  void _editPort(dynamic dioId, int portNum, Map<String, dynamic> port) async {
    String selectedStatus = port['status'] ?? 'livre';

    final result = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: const EdgeInsets.all(16),
          child: SafeArea(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text('Porta #$portNum', style: Theme.of(ctx).textTheme.titleMedium),
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
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, selectedStatus),
                child: const Text('Salvar'),
              ),
            ]),
          ),
        ),
      ),
    );

    if (result != null && mounted) {
      try {
        final cp = Provider.of<CtoProvider>(context, listen: false);
        await cp.updateDioPort(widget.projectId, dioId, portNum, {'status': result});
        _load();
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Painel DIO')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _dios == null || _dios!.isEmpty
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.album, size: 48, color: cs.onSurfaceVariant.withOpacity(0.5)),
                    const SizedBox(height: 8),
                    Text('Nenhum DIO encontrado', style: TextStyle(color: cs.onSurfaceVariant)),
                  ]),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: _dios!.length,
                    itemBuilder: (_, i) {
                      final dio = _dios![i];
                      final dioId = dio['id'] ?? dio['name'] ?? 'DIO ${i + 1}';
                      final dioName = dio['name'] as String? ?? 'DIO $dioId';
                      final ports = dio['ports'] as List<dynamic>? ?? [];
                      final capacity = dio['capacity'] as int? ?? ports.length;
                      final ocupadas = ports.where((p) {
                        final s = (p as Map<String, dynamic>)['status'] as String? ?? '';
                        return s == 'ocupado' || s == 'ocupada';
                      }).length;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(children: [
                                Icon(Icons.album, color: cs.primary),
                                const SizedBox(width: 8),
                                Text(dioName, style: Theme.of(context).textTheme.titleMedium),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: cs.primary.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text('$ocupadas/$capacity',
                                      style: TextStyle(fontSize: 11, color: cs.primary)),
                                ),
                              ]),
                              const SizedBox(height: 12),
                              GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 6,
                                  childAspectRatio: 1,
                                  crossAxisSpacing: 4,
                                  mainAxisSpacing: 4,
                                ),
                                itemCount: ports.length,
                                itemBuilder: (_, pi) {
                                  final port = ports[pi] as Map<String, dynamic>;
                                  final portNum = port['num'] as int? ?? pi + 1;
                                  final pStatus = port['status'] as String? ?? 'livre';
                                  final color = _statusColor(pStatus);
                                  final label = _statusLabel(pStatus);

                                  return GestureDetector(
                                    onTap: () => _editPort(dioId, portNum, port),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: color.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: color.withOpacity(0.3)),
                                      ),
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text('$portNum',
                                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
                                          Text(label,
                                              style: TextStyle(fontSize: 7, color: color)),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
