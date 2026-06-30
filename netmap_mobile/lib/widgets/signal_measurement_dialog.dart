import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/providers/element_provider.dart';

class SignalMeasurementDialog extends StatefulWidget {
  final String projectId;
  final int elementId;
  final String elementName;

  const SignalMeasurementDialog({
    super.key,
    required this.projectId,
    required this.elementId,
    required this.elementName,
  });

  @override
  State<SignalMeasurementDialog> createState() =>
      _SignalMeasurementDialogState();
}

class _SignalMeasurementDialogState extends State<SignalMeasurementDialog> {
  final _txPowerCtrl = TextEditingController();
  final _rxPowerCtrl = TextEditingController();
  final _attenuationCtrl = TextEditingController();
  final _distanceCtrl = TextEditingController();
  final _connectorsCtrl = TextEditingController(text: '2');
  final _notesCtrl = TextEditingController();
  bool _saving = false;
  bool _showEstimate = false;
  String? _photoPath;
  final _picker = ImagePicker();

  double _calcEstimatedAttenuation() {
    final distance = double.tryParse(_distanceCtrl.text.trim()) ?? 0;
    final connectors = int.tryParse(_connectorsCtrl.text.trim()) ?? 0;
    const fiberLossPerKm = 0.35;
    const connectorLoss = 0.5;
    return (distance * fiberLossPerKm) + (connectors * connectorLoss);
  }

  void _applyEstimate() {
    final tx = double.tryParse(_txPowerCtrl.text.trim());
    final rx = double.tryParse(_rxPowerCtrl.text.trim());
    if (tx != null && rx != null) {
      _attenuationCtrl.text = (tx - rx).toStringAsFixed(2);
    }
  }

  @override
  void dispose() {
    _txPowerCtrl.dispose();
    _rxPowerCtrl.dispose();
    _attenuationCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _tirarFoto() async {
    try {
      final foto = await _picker.pickImage(source: ImageSource.camera, imageQuality: 80);
      if (foto != null) setState(() => _photoPath = foto.path);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erro ao abrir camera')),
      );
    }
  }

  Future<void> _salvar() async {
    setState(() => _saving = true);
    final data = <String, dynamic>{
      'tx_power_dbm': double.tryParse(_txPowerCtrl.text.trim()),
      'rx_power_dbm': double.tryParse(_rxPowerCtrl.text.trim()),
      'attenuation_db': double.tryParse(_attenuationCtrl.text.trim()),
      'notes': _notesCtrl.text.trim(),
      'measured_at': DateTime.now().toIso8601String(),
    };
    data.removeWhere((_, v) => v == null || (v is String && v.isEmpty));

    final ep = Provider.of<ElementProvider>(context, listen: false);
    final ok = await ep.recordSignalMeasurement(
      widget.projectId, widget.elementId, data,
    );
    if (mounted) {
      Navigator.pop(context, ok);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ok ? 'Medicao registrada' : 'Erro ao registrar')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(children: [
        const Icon(Icons.speed, size: 24),
        const SizedBox(width: 8),
        Expanded(child: Text('Sinal Optico\n${widget.elementName}', style: const TextStyle(fontSize: 16))),
      ]),
      content: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          TextFormField(
            controller: _txPowerCtrl,
            decoration: const InputDecoration(
              labelText: 'Potencia TX (dBm)',
              border: OutlineInputBorder(),
              hintText: 'Ex: 3.0',
            ),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _rxPowerCtrl,
            decoration: const InputDecoration(
              labelText: 'Potencia RX (dBm)',
              border: OutlineInputBorder(),
              hintText: 'Ex: -18.5',
            ),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: TextFormField(
                controller: _attenuationCtrl,
                decoration: const InputDecoration(
                  labelText: 'Atenuacao (dB)',
                  border: OutlineInputBorder(),
                  hintText: 'TX - RX',
                ),
                keyboardType: TextInputType.number,
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.auto_fix_high, size: 20),
              tooltip: 'Calcular (TX - RX)',
              onPressed: _applyEstimate,
            ),
          ]),
          const SizedBox(height: 12),
          // Attenuation estimate toggle
          TextButton.icon(
            icon: Icon(_showEstimate ? Icons.expand_less : Icons.expand_more, size: 16),
            label: Text(_showEstimate ? 'Ocultar estimativa' : 'Calcular estimativa'),
            onPressed: () => setState(() => _showEstimate = !_showEstimate),
          ),
          if (_showEstimate) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(children: [
                Row(children: [
                  Expanded(
                    child: TextFormField(
                      controller: _distanceCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Distancia fibra (km)',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _connectorsCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Conectores',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ]),
                const SizedBox(height: 8),
                Text('Estimativa: ${_calcEstimatedAttenuation().toStringAsFixed(2)} dB',
                    style: TextStyle(fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary)),
                Text('(0.35 dB/km fibra + 0.5 dB/conector)',
                    style: TextStyle(fontSize: 10,
                        color: Theme.of(context).colorScheme.onSurfaceVariant)),
              ]),
            ),
          ],
          if (_photoPath != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.file(
                File(_photoPath!),
                height: 100,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 8),
          ],
          OutlinedButton.icon(
            icon: const Icon(Icons.camera_alt, size: 18),
            label: Text(_photoPath != null ? 'Trocar foto' : 'Foto do OTDR'),
            onPressed: _tirarFoto,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _notesCtrl,
            decoration: const InputDecoration(
              labelText: 'Observacoes',
              border: OutlineInputBorder(),
            ),
            maxLines: 3,
          ),
        ]),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
        FilledButton.icon(
          icon: _saving
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.save, size: 18),
          label: const Text('Salvar'),
          onPressed: _saving ? null : _salvar,
        ),
      ],
    );
  }
}
