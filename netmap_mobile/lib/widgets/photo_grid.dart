import 'package:flutter/material.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/services/api_service.dart';

class PhotoGrid extends StatefulWidget {
  final String projectId;
  final int elementId;
  final List<Map<String, dynamic>> photos;

  const PhotoGrid({
    super.key,
    required this.projectId,
    required this.elementId,
    required this.photos,
  });

  @override
  State<PhotoGrid> createState() => _PhotoGridState();
}

class _PhotoGridState extends State<PhotoGrid> {
  final _api = ApiService();
  late List<Map<String, dynamic>> _photos;

  @override
  void initState() {
    super.initState();
    _photos = List.from(widget.photos);
  }

  Future<void> _delete(String filename) async {
    try {
      await _api.delete(
        '${ApiConfig.projectPhotosEndpoint(widget.projectId, widget.elementId)}/$filename',
      );
      setState(() => _photos.removeWhere((p) => p['filename'] == filename));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erro ao excluir foto')),
        );
      }
    }
  }

  String _imageUrl(Map<String, dynamic> photo) {
    final base = ApiConfig.baseUrl;
    final path = photo['url'] as String? ?? '';
    return path.startsWith('http') ? path : '$base$path';
  }

  @override
  Widget build(BuildContext context) {
    if (_photos.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(
            'Nenhuma foto',
            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: _photos.length,
      itemBuilder: (_, i) {
        final photo = _photos[i];
        final filename = photo['filename'] as String? ?? '';
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.network(
                _imageUrl(photo),
                fit: BoxFit.cover,
                loadingBuilder: (_, child, progress) {
                  if (progress == null) return child;
                  return Container(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  );
                },
                errorBuilder: (_, __, ___) => Container(
                  color: Theme.of(context).colorScheme.errorContainer,
                  child: const Icon(Icons.broken_image, color: Colors.grey),
                ),
              ),
              Positioned(
                top: 4, right: 4,
                child: Semantics(
                  label: 'Excluir foto',
                  button: true,
                  child: GestureDetector(
                    onTap: () => _delete(filename),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.close, size: 14, color: Colors.white),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
