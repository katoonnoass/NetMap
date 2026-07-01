import 'package:flutter/material.dart';
import 'package:netmap_mobile/services/offline_service.dart';
import 'package:provider/provider.dart';

class ConflictResolutionScreen extends StatelessWidget {
  const ConflictResolutionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Conflitos')),
      body: Consumer<OfflineService>(
        builder: (_, os, __) {
          if (os.conflicts.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle, size: 64, color: cs.primary),
                  const SizedBox(height: 16),
                  Text('Nenhum conflito pendente',
                      style: Theme.of(context).textTheme.titleMedium),
                ],
              ),
            );
          }
          return ListView.builder(
            itemCount: os.conflicts.length,
            itemBuilder: (_, i) {
              final conflict = os.conflicts[i];
              final op = conflict.localOp;
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '${op.type.name.toUpperCase()} ${op.endpoint}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                      if (op.lastError != null) ...[
                        const SizedBox(height: 6),
                        Text(op.lastError!, style: TextStyle(fontSize: 12, color: cs.error)),
                      ],
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.cloud_upload, size: 16),
                              label: const Text('Manter local', style: TextStyle(fontSize: 12)),
                              onPressed: () => os.resolveConflict(i, keepLocal: true),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.cloud_download, size: 16),
                              label: const Text('Usar servidor', style: TextStyle(fontSize: 12)),
                              onPressed: () => os.resolveConflict(i, keepLocal: false),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
