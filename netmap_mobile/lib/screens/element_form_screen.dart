import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/models/address_result.dart';
import 'package:netmap_mobile/models/element.dart';
import 'package:netmap_mobile/providers/element_provider.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/widgets/error_banner.dart';

class ElementFormScreen extends StatefulWidget {
  final String projectId;
  final NetmapElement? element;
  final double? initialLat;
  final double? initialLng;
  const ElementFormScreen({super.key, required this.projectId, this.element, this.initialLat, this.initialLng});
  @override State<ElementFormScreen> createState() => _ElementFormScreenState();
}

class _ElementFormScreenState extends State<ElementFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nome = TextEditingController();
  final _obs = TextEditingController();
  final _endereco = TextEditingController();
  final _cep = TextEditingController();
  String? _tipo, _status;
  bool _loading = false;
  String? _error;
  String? _fotoPath;
  final _picker = ImagePicker();
  final _api = ApiService();
  final _tipos = const ['CTO','DIO','POSTE','CAIXA','CLIENTE','OUTRO'];
  final _statuses = const ['ativo','inativo','previsto'];
  bool get _edit => widget.element != null;

  @override
  void initState() {
    super.initState();
    if (_edit) {
      final e = widget.element!;
      _nome.text = e.nome; _tipo = e.tipo; _status = e.status ?? 'ativo';
      _obs.text = e.observacao ?? ''; _endereco.text = e.endereco ?? ''; _cep.text = e.cep ?? '';
    } else { _status = 'ativo'; }
  }

  @override
  void dispose() {
    _nome.dispose(); _obs.dispose(); _endereco.dispose(); _cep.dispose();
    super.dispose();
  }

  Future<void> _buscarCep() async {
    final cep = _cep.text.trim();
    if (cep.isEmpty) return;
    setState(() => _loading = true);
    try {
      final r = await ApiService().post(ApiConfig.addressCacheLookup, data: {'cep': cep});
      if (r.statusCode == 200 && r.data != null) {
        setState(() => _endereco.text = AddressResult.fromJson(r.data).displayAddress);
      } else { setState(() => _error = 'CEP não encontrado'); }
    } catch (_) { setState(() => _error = 'Erro ao buscar CEP'); }
    setState(() => _loading = false);
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    final data = <String, dynamic>{
      'nome': _nome.text.trim(), 'tipo': _tipo, 'status': _status,
      'observacao': _obs.text.trim(), 'endereco': _endereco.text.trim(), 'cep': _cep.text.trim(),
    };
    if (widget.initialLat != null) { data['lat'] = widget.initialLat; }
    else if (_edit && widget.element!.lat != null) { data['lat'] = widget.element!.lat; }
    if (widget.initialLng != null) { data['lng'] = widget.initialLng; }
    else if (_edit && widget.element!.lng != null) { data['lng'] = widget.element!.lng; }

    final p = Provider.of<ElementProvider>(context, listen: false);
    try {
      if (_edit) { await p.updateElement(widget.projectId, widget.element!.id, data); }
      else {
        final el = await p.addElement(widget.projectId, data);
        if (el != null && _fotoPath != null) { await _uploadFoto(el.id); }
      }
      if (mounted) { Navigator.pop(context); }
    } catch (e) { setState(() => _error = 'Erro ao salvar: $e'); }
    setState(() => _loading = false);
  }

  Future<void> _tirarFoto() async {
    try {
      final XFile? foto = await _picker.pickImage(source: ImageSource.camera, imageQuality: 80);
      if (foto != null) { setState(() => _fotoPath = foto.path); }
    } catch (_) { setState(() => _error = 'Erro ao abrir câmera'); }
  }

  Future<void> _uploadFoto(int elementId) async {
    if (_fotoPath == null) return;
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(_fotoPath!),
      });
      await _api.post(
        ApiConfig.projectPhotosEndpoint(widget.projectId, elementId),
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
    } catch (_) {}
  }

  Widget _field(TextEditingController c, String label, {String? Function(String?)? validator, int? maxLines, TextInputType? keyboard}) =>
    TextFormField(controller: c, decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()), validator: validator, maxLines: maxLines, keyboardType: keyboard);

  Widget _gap() => const SizedBox(height: 16);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(_edit ? 'Editar Elemento' : 'Novo Elemento')),
      body: Stack(children: [
        SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              ErrorBanner(message: _error, onDismiss: () => setState(() => _error = null)),
              _gap(),
              _field(_nome, 'Nome *', validator: (v) => v == null || v.trim().isEmpty ? 'Nome obrigatório' : null),
              _gap(),
              DropdownButtonFormField<String>(value: _tipo, decoration: const InputDecoration(labelText: 'Tipo *', border: OutlineInputBorder()),
                items: _tipos.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                onChanged: (v) => setState(() => _tipo = v),
                validator: (v) => v == null || v.isEmpty ? 'Tipo obrigatório' : null),
              _gap(),
              DropdownButtonFormField<String>(value: _status, decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder()),
                items: _statuses.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) => setState(() => _status = v)),
              _gap(),
              _field(_obs, 'Observação', maxLines: 3),
              _gap(),
              Row(children: [
                Expanded(flex: 2, child: _field(_cep, 'CEP', keyboard: TextInputType.number)),
                const SizedBox(width: 8),
                Expanded(flex: 1, child: OutlinedButton.icon(onPressed: _loading ? null : _buscarCep, icon: const Icon(Icons.search), label: const Text('Buscar'))),
              ]),
              _gap(),
              _field(_endereco, 'Endereço'),
              _gap(),
              if (widget.initialLat != null || widget.initialLng != null)
                Container(width: double.infinity, padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: cs.secondaryContainer.withOpacity(0.3), borderRadius: BorderRadius.circular(8)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Coordenadas', style: Theme.of(context).textTheme.labelLarge),
                    Text('Lat: ${widget.initialLat?.toStringAsFixed(6) ?? '-'}\nLng: ${widget.initialLng?.toStringAsFixed(6) ?? '-'}'),
                   ])),
              _gap(),
              SizedBox(width: double.infinity, height: 48,
                child: FilledButton.icon(
                  icon: const Icon(Icons.camera_alt, size: 18),
                  label: Text(_fotoPath != null ? 'Foto selecionada' : 'Tirar foto'),
                  onPressed: _loading ? null : _tirarFoto,
                )),
              if (_fotoPath != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      File(_fotoPath!),
                      height: 120,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              const SizedBox(height: 24),
              SizedBox(width: double.infinity, height: 48,
                child: FilledButton(onPressed: _loading ? null : _salvar,
                  child: _loading ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Salvar'))),
            ]),
          ),
        ),
        if (_loading) Container(color: Colors.black26, child: const Center(child: CircularProgressIndicator())),
      ]),
    );
  }
}
