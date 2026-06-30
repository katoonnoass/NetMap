import 'package:flutter/material.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/services/api_service.dart';

class IxcScreen extends StatefulWidget {
  final String projectId;
  const IxcScreen({super.key, required this.projectId});
  @override State<IxcScreen> createState() => _IxcScreenState();
}

class _IxcScreenState extends State<IxcScreen> {
  final _api = ApiService();
  bool _loading = false;
  String? _statusMsg;
  int? _syncedCount;

  Future<void> _sync() async {
    setState(() { _loading = true; _statusMsg = null; _syncedCount = null; });
    try {
      final response = await _api.post(
        ApiConfig.projectIxcSyncEndpoint(widget.projectId),
      );
      final data = response.data as Map<String, dynamic>?;
      final count = data?['synced'] ?? data?['count'] ?? '';
      _syncedCount = int.tryParse(count.toString());
      _setStatus('Sincronizado com sucesso');
    } catch (e) {
      _setStatus('Erro ao sincronizar');
    }
    if (mounted) setState(() => _loading = false);
  }

  void _setStatus(String msg) {
    if (mounted) setState(() => _statusMsg = msg);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Integracao IXC')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.api, size: 64, color: cs.primary.withOpacity(0.5)),
              const SizedBox(height: 16),
              Text('Sincronizar com IXC',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(
                'Importar clientes e dados do IXC configurado no servidor.',
                textAlign: TextAlign.center,
                style: TextStyle(color: cs.onSurfaceVariant),
              ),
              const SizedBox(height: 32),
              FilledButton.icon(
                onPressed: _loading ? null : _sync,
                icon: _loading
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.sync, size: 20),
                label: Text(_loading ? 'Sincronizando...' : 'Sincronizar Agora'),
              ),
              if (_statusMsg != null) ...[
                const SizedBox(height: 20),
                Card(
                  color: _statusMsg!.contains('Erro')
                      ? Colors.red.withOpacity(0.1)
                      : Colors.green.withOpacity(0.1),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(children: [
                      Icon(
                        _statusMsg!.contains('Erro') ? Icons.error : Icons.check_circle,
                        color: _statusMsg!.contains('Erro') ? Colors.red : Colors.green,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_statusMsg!,
                                style: TextStyle(
                                  fontWeight: FontWeight.w500,
                                  color: _statusMsg!.contains('Erro')
                                      ? Colors.red : Colors.green,
                                )),
                            if (_syncedCount != null) ...[
                              const SizedBox(height: 4),
                              Text('$_syncedCount registros importados',
                                  style: TextStyle(fontSize: 12,
                                      color: cs.onSurfaceVariant)),
                            ],
                          ],
                        ),
                      ),
                    ]),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
