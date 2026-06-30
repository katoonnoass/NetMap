import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/models/connection.dart';
import 'package:netmap_mobile/providers/element_provider.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/config/element_types.dart';

class CableScreen extends StatefulWidget {
  final String projectId;
  const CableScreen({super.key, required this.projectId});
  @override State<CableScreen> createState() => _CableScreenState();
}

class _CableScreenState extends State<CableScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ep = Provider.of<ElementProvider>(context, listen: false);
      ep.fetchConnections(widget.projectId);
      if (ep.elements.isEmpty) ep.fetchElements(widget.projectId);
    });
  }

  void _showForm({Connection? cable}) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => CableFormScreen(projectId: widget.projectId, cable: cable),
    ));
  }

  Future<void> _toggleBroken(Connection c) async {
    final ep = Provider.of<ElementProvider>(context, listen: false);
    final ok = await ep.toggleConnectionBroken(widget.projectId, c.id, !c.broken);
    if (ok) {
      await ep.fetchConnections(widget.projectId);
    }
  }

  Future<void> _deleteCable(Connection c) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remover cabo'),
        content: Text('Remover cabo #${c.id} (${c.fibra ?? "sem fibra"})?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Remover')),
        ],
      ),
    );
    if (confirm == true) {
      final api = ApiService();
      try {
        await api.delete(ApiConfig.projectConnectionEndpoint(widget.projectId, c.id));
        final ep = Provider.of<ElementProvider>(context, listen: false);
        await ep.fetchConnections(widget.projectId);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Erro ao remover cabo')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ep = Provider.of<ElementProvider>(context);
    final cables = ep.connections;
    final elementMap = {for (final e in ep.elements) e.id: e.nome};

    return Scaffold(
      appBar: AppBar(title: const Text('Cabos')),
      body: RefreshIndicator(
        onRefresh: () => ep.fetchConnections(widget.projectId),
        child: cables.isEmpty
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.cable, size: 64, color: cs.onSurfaceVariant.withValues(alpha: 0.4)),
                    const SizedBox(height: 16),
                    Text('Nenhum cabo', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text('Toque em + para adicionar',
                      style: TextStyle(color: cs.onSurfaceVariant)),
                  ],
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: cables.length,
                itemBuilder: (_, i) {
                  final c = cables[i];
                  final fromNome = elementMap[c.from] ?? 'ID ${c.from}';
                  final toNome = elementMap[c.to] ?? 'ID ${c.to}';
                  return Card(
                    clipBehavior: Clip.antiAlias,
                    margin: const EdgeInsets.only(bottom: 8),
                    child: InkWell(
                      onTap: () => _showForm(cable: c),
                      onLongPress: () => _deleteCable(c),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: c.broken ? Colors.red.withValues(alpha: 0.15) : Colors.green.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  c.broken ? 'ROMPIDO' : 'ATIVO',
                                  style: TextStyle(
                                    fontSize: 10, fontWeight: FontWeight.bold,
                                    color: c.broken ? Colors.red : Colors.green,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text('Cabo #${c.id}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              ),
                              IconButton(
                                icon: Icon(
                                  c.broken ? Icons.link : Icons.link_off,
                                  size: 18, color: c.broken ? Colors.red : Colors.green,
                                ),
                                onPressed: () => _toggleBroken(c),
                                tooltip: c.broken ? 'Recuperar' : 'Romper',
                              ),
                            ]),
                            const SizedBox(height: 4),
                            Row(children: [
                              Icon(Icons.arrow_forward, size: 14, color: cs.onSurfaceVariant),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text('$fromNome  \u2192  $toNome',
                                  style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                              ),
                            ]),
                            if (c.fibra != null || c.porta != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                '${c.fibra != null ? "Fibra: ${c.fibra}" : ""}${c.fibra != null && c.porta != null ? " | " : ""}${c.porta != null ? "Porta: ${c.porta}" : ""}${c.cor != null ? " | Cor: ${c.cor}" : ""}',
                                style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant.withValues(alpha: 0.7)),
                              ),
                            ],
                            if (c.obs != null && c.obs!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(c.obs!, style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: cs.onSurfaceVariant)),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showForm(),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class CableFormScreen extends StatefulWidget {
  final String projectId;
  final Connection? cable;
  const CableFormScreen({super.key, required this.projectId, this.cable});
  @override State<CableFormScreen> createState() => _CableFormScreenState();
}

class _CableFormScreenState extends State<CableFormScreen> {
  final _formKey = GlobalKey<FormState>();
  int? _fromId, _toId;
  final _fibra = TextEditingController();
  final _porta = TextEditingController();
  final _cor = TextEditingController();
  final _length = TextEditingController();
  final _obs = TextEditingController();
  bool _broken = false;
  bool _loading = false;
  bool get _edit => widget.cable != null;

  @override
  void initState() {
    super.initState();
    if (_edit) {
      final c = widget.cable!;
      _fromId = c.from;
      _toId = c.to;
      _fibra.text = c.fibra ?? '';
      _porta.text = c.porta ?? '';
      _cor.text = c.cor ?? '';
      _length.text = c.length?.toString() ?? '';
      _obs.text = c.obs ?? '';
      _broken = c.broken;
    }
  }

  @override
  void dispose() {
    _fibra.dispose(); _porta.dispose(); _cor.dispose(); _length.dispose(); _obs.dispose();
    super.dispose();
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;
    if (_fromId == null || _toId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecione os elementos de origem e destino')),
      );
      return;
    }
    setState(() => _loading = true);
    final data = <String, dynamic>{
      'from': _fromId, 'to': _toId, 'broken': _broken,
      'fibra': _fibra.text.trim(), 'porta': _porta.text.trim(),
      'cor': _cor.text.trim(), 'obs': _obs.text.trim(),
    };
    if (_length.text.trim().isNotEmpty) data['length'] = double.tryParse(_length.text.trim());

    final api = ApiService();
    final ep = Provider.of<ElementProvider>(context, listen: false);
    try {
      if (_edit) {
        await api.put(
          ApiConfig.projectConnectionEndpoint(widget.projectId, widget.cable!.id),
          data: data,
        );
      } else {
        await api.post(
          ApiConfig.projectConnectionsEndpoint(widget.projectId),
          data: data,
        );
      }
      await ep.fetchConnections(widget.projectId);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao salvar cabo: ${e.toString().replaceFirst("ApiException", "Erro")}')),
        );
      }
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final ep = Provider.of<ElementProvider>(context);
    final elements = ep.elements.where((e) => e.id > 0).toList();

    return Scaffold(
      appBar: AppBar(title: Text(_edit ? 'Editar Cabo' : 'Novo Cabo')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DropdownButtonFormField<int>(
                value: _fromId != null && elements.any((e) => e.id == _fromId) ? _fromId : null,
                decoration: const InputDecoration(labelText: 'Origem *', border: OutlineInputBorder()),
                items: elements.map((e) => DropdownMenuItem(
                  value: e.id,
                  child: Row(children: [
                    Icon(ElementTypes.iconFor(e.tipo), size: 16, color: ElementTypes.colorFor(e.tipo)),
                    const SizedBox(width: 6),
                    Text('${e.nome} (${e.tipo})'),
                  ]),
                )).toList(),
                onChanged: (v) => setState(() => _fromId = v),
                validator: (v) => v == null ? 'Selecione a origem' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<int>(
                value: _toId != null && elements.any((e) => e.id == _toId) ? _toId : null,
                decoration: const InputDecoration(labelText: 'Destino *', border: OutlineInputBorder()),
                items: elements.map((e) => DropdownMenuItem(
                  value: e.id,
                  child: Row(children: [
                    Icon(ElementTypes.iconFor(e.tipo), size: 16, color: ElementTypes.colorFor(e.tipo)),
                    const SizedBox(width: 6),
                    Text('${e.nome} (${e.tipo})'),
                  ]),
                )).toList(),
                onChanged: (v) => setState(() => _toId = v),
                validator: (v) => v == null ? 'Selecione o destino' : null,
              ),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(
                  child: TextFormField(
                    controller: _fibra,
                    decoration: const InputDecoration(labelText: 'Fibra', border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _porta,
                    decoration: const InputDecoration(labelText: 'Porta', border: OutlineInputBorder()),
                  ),
                ),
              ]),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(
                  child: TextFormField(
                    controller: _cor,
                    decoration: const InputDecoration(labelText: 'Cor', border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _length,
                    decoration: const InputDecoration(labelText: 'Comprimento (m)', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ]),
              const SizedBox(height: 16),
              TextFormField(
                controller: _obs,
                decoration: const InputDecoration(labelText: 'Observacao', border: OutlineInputBorder()),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('Cabo rompido'),
                value: _broken,
                onChanged: (v) => setState(() => _broken = v),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: _loading ? null : _salvar,
                  child: _loading
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_edit ? 'Atualizar' : 'Criar'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
