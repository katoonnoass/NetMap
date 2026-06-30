import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/models/maintenance.dart';
import 'package:netmap_mobile/providers/maintenance_provider.dart';

class MaintenanceScreen extends StatefulWidget {
  final String projectId;
  const MaintenanceScreen({super.key, required this.projectId});
  @override State<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends State<MaintenanceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<MaintenanceProvider>(context, listen: false)
          .fetchMaintenance(widget.projectId);
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  void _addMaintenance() {
    final descCtrl = TextEditingController();
    String selectedType = 'preventiva';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          left: 16, right: 16, top: 16,
        ),
        child: SafeArea(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text('Nova Manutencao', style: Theme.of(ctx).textTheme.titleMedium),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: selectedType,
              decoration: const InputDecoration(labelText: 'Tipo', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'preventiva', child: Text('Preventiva')),
                DropdownMenuItem(value: 'corretiva', child: Text('Corretiva')),
                DropdownMenuItem(value: 'instalacao', child: Text('Instalacao')),
              ],
              onChanged: (v) { if (v != null) selectedType = v; },
            ),
            const SizedBox(height: 8),
            TextField(
              controller: descCtrl,
              decoration: const InputDecoration(
                labelText: 'Descricao', border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () async {
                final mp = Provider.of<MaintenanceProvider>(context, listen: false);
                final ok = await mp.addMaintenance(widget.projectId, {
                  'type': selectedType,
                  'description': descCtrl.text.trim(),
                  'scheduled_date': DateTime.now().toIso8601String().split('T')[0],
                });
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    SnackBar(content: Text(ok ? 'Manutencao agendada' : 'Erro ao agendar')),
                  );
                  if (ok) Navigator.pop(ctx);
                }
              },
              child: const Text('Agendar'),
            ),
            const SizedBox(height: 8),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Agenda de Manutencao'),
        bottom: TabBar(
          controller: _tabCtrl,
          tabs: const [
            Tab(text: 'Proximos'),
            Tab(text: 'Passados'),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _addMaintenance),
        ],
      ),
      body: Consumer<MaintenanceProvider>(
        builder: (_, mp, __) {
          if (mp.isLoading) return const Center(child: CircularProgressIndicator());
          return TabBarView(
            controller: _tabCtrl,
            children: [
              _buildList(mp.upcoming, cs, false),
              _buildList(mp.past, cs, true),
            ],
          );
        },
      ),
    );
  }

  Widget _buildList(List<Maintenance> items, ColorScheme cs, bool isPast) {
    if (items.isEmpty) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.calendar_today, size: 48, color: cs.onSurfaceVariant.withOpacity(0.5)),
          const SizedBox(height: 8),
          Text(isPast ? 'Nenhum agendamento passado' : 'Nenhum agendamento pendente',
              style: TextStyle(color: cs.onSurfaceVariant)),
        ]),
      );
    }
    return RefreshIndicator(
      onRefresh: () => Provider.of<MaintenanceProvider>(context, listen: false)
          .fetchMaintenance(widget.projectId),
      child: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: items.length,
        itemBuilder: (_, i) {
          final m = items[i];
          final isToday = m.scheduledDate.day == DateTime.now().day &&
              m.scheduledDate.month == DateTime.now().month &&
              m.scheduledDate.year == DateTime.now().year;

          return Card(
            margin: const EdgeInsets.symmetric(vertical: 3),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: isToday
                    ? Colors.red.withOpacity(0.2)
                    : cs.primary.withOpacity(0.15),
                child: Icon(
                  m.type == 'preventiva' ? Icons.shield : Icons.build,
                  color: isToday ? Colors.red : cs.primary,
                  size: 18,
                ),
              ),
              title: Text(m.typeLabel,
                  style: TextStyle(fontSize: 13,
                      fontWeight: isToday ? FontWeight.bold : FontWeight.normal)),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (m.description.isNotEmpty)
                    Text(m.description, style: const TextStyle(fontSize: 11)),
                  Row(children: [
                    Icon(Icons.calendar_today, size: 11,
                        color: cs.onSurfaceVariant.withOpacity(0.6)),
                    const SizedBox(width: 4),
                    Text(
                      '${m.scheduledDate.day}/${m.scheduledDate.month}/${m.scheduledDate.year}',
                      style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant.withOpacity(0.6)),
                    ),
                    if (m.elementName != null) ...[
                      const SizedBox(width: 8),
                      Icon(Icons.devices, size: 11,
                          color: cs.onSurfaceVariant.withOpacity(0.6)),
                      const SizedBox(width: 4),
                      Text(m.elementName!, style: TextStyle(fontSize: 11,
                          color: cs.onSurfaceVariant.withOpacity(0.6))),
                    ],
                  ]),
                ],
              ),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: m.status == 'completed'
                      ? Colors.green.withOpacity(0.15)
                      : m.status == 'cancelled'
                          ? Colors.red.withOpacity(0.15)
                          : isToday
                              ? Colors.red.withOpacity(0.15)
                              : Colors.blue.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(m.statusLabel,
                    style: TextStyle(fontSize: 10,
                        color: m.status == 'completed'
                            ? Colors.green
                            : m.status == 'cancelled'
                                ? Colors.red
                                : isToday
                                    ? Colors.red
                                    : Colors.blue)),
              ),
            ),
          );
        },
      ),
    );
  }
}
