import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/models/cto_port.dart';
import 'package:netmap_mobile/models/element.dart';
import 'package:netmap_mobile/providers/element_provider.dart';

class CtoClientsScreen extends StatefulWidget {
  final String projectId;
  const CtoClientsScreen({super.key, required this.projectId});
  @override State<CtoClientsScreen> createState() => _CtoClientsScreenState();
}

class _CtoClientsScreenState extends State<CtoClientsScreen> {
  List<_CtoWithClients>? _ctos;
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final ep = Provider.of<ElementProvider>(context, listen: false);
    if (ep.elements.isEmpty) {
      await ep.fetchElements(widget.projectId);
    }
    final ctos = ep.elements.where((e) => e.tipo.toLowerCase() == 'cto').toList();
    final result = <_CtoWithClients>[];
    for (final cto in ctos) {
      final ports = await ep.fetchCtoPorts(widget.projectId, cto.id);
      final clients = ports.where((p) => p.isOccupied && p.clientNome != null).toList();
      result.add(_CtoWithClients(cto: cto, ports: ports, clients: clients));
    }
    if (mounted) setState(() { _ctos = result; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clientes do CTO'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _ctos == null || _ctos!.isEmpty
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.hub, size: 48, color: cs.onSurfaceVariant.withOpacity(0.5)),
                    const SizedBox(height: 8),
                    Text('Nenhum CTO encontrado',
                        style: TextStyle(color: cs.onSurfaceVariant)),
                  ]),
                )
              : Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(8),
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Buscar cliente...',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        onChanged: (v) => setState(() => _search = v.toLowerCase()),
                      ),
                    ),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(8),
                          itemCount: _ctos!.length,
                          itemBuilder: (_, i) {
                            final item = _ctos![i];
                            final filtered = _search.isEmpty
                                ? item.clients
                                : item.clients.where((c) =>
                                    c.clientNome!.toLowerCase().contains(_search)).toList();
                            if (_search.isNotEmpty && filtered.isEmpty) return const SizedBox.shrink();
                            final ocupadas = item.ports.where((p) => p.isOccupied).length;
                            final total = item.ports.length;
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ExpansionTile(
                                leading: CircleAvatar(
                                  backgroundColor: cs.primary.withOpacity(0.15),
                                  child: Text('$ocupadas/$total',
                                      style: TextStyle(fontSize: 11, color: cs.primary)),
                                ),
                                title: Text(item.cto.nome,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                                subtitle: Text('$ocupadas clientes | ${total - ocupadas} livres',
                                    style: const TextStyle(fontSize: 11)),
                                children: filtered.map((p) => ListTile(
                                  dense: true,
                                  leading: CircleAvatar(
                                    radius: 14,
                                    backgroundColor: Colors.green.withOpacity(0.15),
                                    child: Text('${p.num}',
                                        style: const TextStyle(fontSize: 10, color: Colors.green)),
                                  ),
                                  title: Text(p.clientNome ?? '',
                                      style: const TextStyle(fontSize: 13)),
                                  subtitle: p.obs != null
                                      ? Text(p.obs!, style: const TextStyle(fontSize: 10))
                                      : null,
                                  trailing: const Icon(Icons.chevron_right, size: 16),
                                  onTap: () {
                                    final clientEl = Provider.of<ElementProvider>(context, listen: false)
                                        .elements
                                        .where((e) => e.id == p.clientId)
                                        .firstOrNull;
                                    if (clientEl != null) {
                                      _showClientSheet(clientEl);
                                    }
                                  },
                                )).toList(),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  void _showClientSheet(NetmapElement el) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(el.nome, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            if (el.endereco != null)
              Text('Endereco: ${el.endereco}', style: const TextStyle(fontSize: 12)),
            if (el.observacao != null)
              Text('Obs: ${el.observacao}', style: const TextStyle(fontSize: 12)),
            const SizedBox(height: 12),
            if (el.hasCoords)
              FilledButton.icon(
                icon: const Icon(Icons.navigation, size: 16),
                label: const Text('Navegar'),
                onPressed: () => Navigator.pop(ctx),
              ),
          ]),
        ),
      ),
    );
  }
}

class _CtoWithClients {
  final NetmapElement cto;
  final List<CtoPort> ports;
  final List<CtoPort> clients;
  _CtoWithClients({
    required this.cto,
    required this.ports,
    required this.clients,
  });
}
