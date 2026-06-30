import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:netmap_mobile/models/element.dart';

class QrScannerScreen extends StatefulWidget {
  final String projectId;
  final List<NetmapElement> elements;
  const QrScannerScreen({
    super.key,
    required this.projectId,
    required this.elements,
  });
  @override State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _detected = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_detected) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null) return;
    final raw = barcode.rawValue;
    if (raw == null || raw.isEmpty) return;

    _detected = true;
    _controller.stop();

    final query = raw.trim().toLowerCase();
    final match = widget.elements.where((e) {
      if (e.id.toString() == query) return true;
      if (e.id.toString().padLeft(6, '0') == query) return true;
      if (e.nome.toLowerCase() == query) return true;
      return false;
    }).firstOrNull;

    if (match != null) {
      Navigator.pop(context, match);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Elemento nao encontrado para este QR Code')),
      );
      _detected = false;
      _controller.start();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Escanear QR Code')),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 3),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Text(
              'Aponte para o QR Code do elemento',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
