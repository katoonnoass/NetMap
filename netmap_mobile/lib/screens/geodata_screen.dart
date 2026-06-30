import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class GeodataScreen extends StatefulWidget {
  final String projectId;
  const GeodataScreen({super.key, required this.projectId});
  @override State<GeodataScreen> createState() => _GeodataScreenState();
}

class _GeodataScreenState extends State<GeodataScreen> {
  final _api = ApiService();
  bool _loading = false;

  Future<void> _exportKml() async {
    setState(() => _loading = true);
    try {
      final response = await _api.get(
        ApiConfig.projectExportKmlEndpoint(widget.projectId),
      );
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/netmap_${widget.projectId}.kml');
      await file.writeAsString(response.data is String ? response.data : '');
      await Share.shareXFiles([XFile(file.path)], text: 'NetMap KML');
    } catch (e) {
      if (mounted) _toast('Erro ao exportar KML');
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _exportBackup() async {
    setState(() => _loading = true);
    try {
      final response = await _api.get(
        ApiConfig.projectBackupEndpoint(widget.projectId),
      );
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/netmap_${widget.projectId}_backup.zip');
      if (response.data is List<int>) {
        await file.writeAsBytes(response.data as List<int>);
      } else {
        await file.writeAsString(response.data.toString());
      }
      await Share.shareXFiles([XFile(file.path)], text: 'NetMap Backup');
    } catch (e) {
      if (mounted) _toast('Erro ao exportar backup');
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _restoreBackup() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['zip'],
      );
      if (result == null || result.files.single.path == null) return;
      setState(() => _loading = true);
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          result.files.single.path!,
          filename: result.files.single.name,
        ),
      });
      final response = await _api.multipartPost(
        ApiConfig.projectRestoreBackupEndpoint(widget.projectId),
        formData,
      );
      if (mounted) {
        _toast(response.statusCode == 200 ? 'Backup restaurado' : 'Erro ao restaurar');
      }
    } catch (e) {
      if (mounted) _toast('Erro ao restaurar backup');
    }
    if (mounted) setState(() => _loading = false);
  }

  void _toast(String msg) => ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(msg)),
  );

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('GeoData & Backup')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Exportar', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _loading ? null : _exportKml,
                    icon: _loading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.map, size: 18),
                    label: const Text('Exportar KML'),
                  ),
                  const SizedBox(height: 8),
                  FilledButton.icon(
                    onPressed: _loading ? null : _exportBackup,
                    icon: const Icon(Icons.backup, size: 18),
                    label: const Text('Exportar Backup (ZIP)'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Importar', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _loading ? null : _restoreBackup,
                    icon: const Icon(Icons.restore, size: 18),
                    label: const Text('Restaurar Backup (ZIP)'),
                  ),
                  const SizedBox(height: 4),
                  Text('Selecione um arquivo .zip exportado anteriormente',
                      style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
