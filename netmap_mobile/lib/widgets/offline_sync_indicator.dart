import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/services/offline_service.dart';
import 'package:netmap_mobile/screens/conflict_resolution_screen.dart';

class OfflineSyncIndicator extends StatelessWidget {
  const OfflineSyncIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<OfflineService>(
      builder: (ctx, offline, _) {
        final pending = offline.pendingCount;
        final conflicts = offline.conflictCount;
        if (pending == 0 && conflicts == 0) return const SizedBox.shrink();

        final icon = conflicts > 0 ? Icons.warning_amber_rounded : Icons.sync_problem;
        final color = conflicts > 0 ? Colors.red : Colors.orange;
        final tooltip = conflicts > 0
            ? '$conflicts conflito(s) pendente(s) de resolucao'
            : '$pending operacao(oes) pendente(s) de sincronizacao';
        final badgeCount = pending + conflicts;

        return Padding(
          padding: const EdgeInsets.only(right: 4),
          child: Badge(
            label: Text(
              badgeCount > 99 ? '99+' : '$badgeCount',
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
            ),
            child: IconButton(
              icon: Icon(icon, size: 20),
              tooltip: tooltip,
              onPressed: () => _showSyncDialog(context, offline),
              color: color,
            ),
          ),
        );
      },
    );
  }

  void _showSyncDialog(BuildContext context, OfflineService offline) {
    final conflicts = offline.conflictCount;
    final pending = offline.pendingCount;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Status Offline'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (pending > 0)
              Text('$pending operacao(oes) aguardando sincronizacao.')
            else
              const Text('Nenhuma operacao pendente de sincronizacao.'),
            if (conflicts > 0) ...[
              const SizedBox(height: 8),
              Text('$conflicts conflito(s) pendente(s) de resolucao.',
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
          ],
        ),
        actions: [
          if (conflicts > 0)
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.push(ctx, MaterialPageRoute(
                  builder: (_) => const ConflictResolutionScreen(),
                ));
              },
              child: const Text('Resolver conflitos'),
            ),
          if (pending > 0)
            FilledButton.icon(
              icon: const Icon(Icons.sync, size: 18),
              label: const Text('Sincronizar'),
              onPressed: () {
                Navigator.pop(ctx);
                offline.syncAll();
              },
            ),
          if (pending == 0 && conflicts == 0)
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Fechar'),
            ),
        ],
      ),
    );
  }
}
