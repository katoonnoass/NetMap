import 'package:flutter/material.dart';

class ChecklistItem {
  final String id;
  final String label;
  final String category;
  bool checked;
  String? notes;

  ChecklistItem({
    required this.id,
    required this.label,
    required this.category,
    this.checked = false,
    this.notes,
  });
}

class ServiceChecklist extends StatefulWidget {
  final String projectId;
  final int? elementId;
  final String? elementName;

  const ServiceChecklist({
    super.key,
    required this.projectId,
    this.elementId,
    this.elementName,
  });

  @override
  State<ServiceChecklist> createState() => _ServiceChecklistState();
}

class _ServiceChecklistState extends State<ServiceChecklist> {
  late List<ChecklistItem> _items;

  @override
  void initState() {
    super.initState();
    _items = _buildDefaultChecklist();
  }

  List<ChecklistItem> _buildDefaultChecklist() {
    return [
      // Documentacao
      ChecklistItem(id: 'foto_antes', label: 'Foto do local (antes)', category: 'Documentacao'),
      ChecklistItem(id: 'foto_equipamento', label: 'Foto do equipamento instalado', category: 'Documentacao'),
      ChecklistItem(id: 'foto_cto', label: 'Foto da porta CTO utilizada', category: 'Documentacao'),
      ChecklistItem(id: 'foto_splitter', label: 'Foto do splitter', category: 'Documentacao'),

      // Instalacao
      ChecklistItem(id: 'cabo_ok', label: 'Cabo drop sem danos', category: 'Instalacao'),
      ChecklistItem(id: 'conector_limpo', label: 'Conector limpo e seco', category: 'Instalacao'),
      ChecklistItem(id: 'curva_minima', label: 'Raio de curvatura respeitado', category: 'Instalacao'),
      ChecklistItem(id: 'fixacao_ok', label: 'Cabo fixado corretamente', category: 'Instalacao'),

      // Medicao
      ChecklistItem(id: 'tx_power', label: 'Potencia TX medida', category: 'Medicao'),
      ChecklistItem(id: 'rx_power', label: 'Potencia RX medida', category: 'Medicao'),
      ChecklistItem(id: 'atenuacao', label: 'Atenuacao dentro do limite (-28dBm)', category: 'Medicao'),

      // Cliente
      ChecklistItem(id: 'sinal_ok', label: 'Cliente confirmou sinal OK', category: 'Cliente'),
      ChecklistItem(id: 'velocidade', label: 'Teste de velocidade realizado', category: 'Cliente'),
      ChecklistItem(id: 'assinatura', label: 'Assinatura do cliente coletada', category: 'Cliente'),
    ];
  }

  void _exportChecklist() {
    final checked = _items.where((i) => i.checked).length;
    final total = _items.length;
    final result = StringBuffer();
    result.writeln('=== CHECKLIST DE SERVICO ===');
    result.writeln('Projeto: ${widget.projectId}');
    if (widget.elementName != null) result.writeln('Elemento: ${widget.elementName}');
    result.writeln('Data: ${DateTime.now().toIso8601String().split("T")[0]}');
    result.writeln();
    result.writeln('Progresso: $checked/$total');
    result.writeln();

    String? lastCategory;
    for (final item in _items) {
      if (item.category != lastCategory) {
        result.writeln('--- ${item.category} ---');
        lastCategory = item.category;
      }
      result.writeln('${item.checked ? "[OK]" : "[  ]"} ${item.label}${item.notes != null ? " - ${item.notes}" : ""}');
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Checklist: $checked/$total itens concluidos')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final checked = _items.where((i) => i.checked).length;
    final total = _items.length;
    final progress = total > 0 ? checked / total : 0.0;

    return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Header
      Row(children: [
        Icon(Icons.checklist, color: cs.primary, size: 20),
        const SizedBox(width: 8),
        Text('Checklist de Servico', style: Theme.of(context).textTheme.titleSmall),
        const Spacer(),
        Text('$checked/$total', style: TextStyle(fontWeight: FontWeight.bold, color: cs.primary)),
      ]),
      const SizedBox(height: 4),
      ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(
          value: progress,
          backgroundColor: cs.surfaceContainerHighest,
          color: progress == 1.0 ? Colors.green : cs.primary,
          minHeight: 6,
        ),
      ),
      const SizedBox(height: 8),

      // Items grouped by category
      SizedBox(
        height: 300,
        child: ListView(
          shrinkWrap: true,
          children: _buildGroupedItems(cs),
        ),
      ),

      const SizedBox(height: 8),
      SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          icon: const Icon(Icons.share, size: 18),
          label: const Text('Exportar Checklist'),
          onPressed: _exportChecklist,
        ),
      ),
    ]);
  }

  List<Widget> _buildGroupedItems(ColorScheme cs) {
    final widgets = <Widget>[];
    String? lastCategory;

    for (final item in _items) {
      if (item.category != lastCategory) {
        if (lastCategory != null) widgets.add(const Divider(height: 4));
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 2),
          child: Text(item.category,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: cs.primary)),
        ));
        lastCategory = item.category;
      }
      widgets.add(
        CheckboxListTile(
          dense: true,
          visualDensity: VisualDensity.compact,
          value: item.checked,
          title: Text(item.label, style: const TextStyle(fontSize: 13)),
          subtitle: item.notes != null && item.notes!.isNotEmpty
              ? Text(item.notes!, style: const TextStyle(fontSize: 11))
              : null,
          onChanged: (v) {
            setState(() => item.checked = v ?? false);
          },
          secondary: InkWell(
            onTap: () => _addNote(item),
            child: Icon(Icons.edit_note, size: 18, color: cs.onSurfaceVariant),
          ),
        ),
      );
    }
    return widgets;
  }

  Future<void> _addNote(ChecklistItem item) async {
    final ctrl = TextEditingController(text: item.notes);
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Observacao: ${item.label}'),
        content: TextField(controller: ctrl, decoration: const InputDecoration(
          border: OutlineInputBorder(), hintText: 'Observacao...'), maxLines: 3),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text), child: const Text('Salvar')),
        ],
      ),
    );
    if (result != null) {
      setState(() => item.notes = result.isEmpty ? null : result);
    }
  }
}
