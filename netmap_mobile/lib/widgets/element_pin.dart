import 'package:flutter/material.dart';
import 'package:netmap_mobile/models/element.dart';

class ElementPin extends StatelessWidget {
  final NetmapElement element;
  final VoidCallback onTap;

  const ElementPin({
    super.key,
    required this.element,
    required this.onTap,
  });

  Color _colorForTipo(String tipo) {
    switch (tipo.toUpperCase()) {
      case 'CTO':
        return Colors.blue;
      case 'DIO':
        return Colors.red;
      case 'POSTE':
        return Colors.green;
      case 'CAIXA':
        return Colors.orange;
      case 'CLIENTE':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  IconData _iconForTipo(String tipo) {
    switch (tipo.toUpperCase()) {
      case 'CTO':
        return Icons.account_tree;
      case 'DIO':
        return Icons.router;
      case 'POSTE':
        return Icons.electrical_services;
      case 'CAIXA':
        return Icons.inventory_2;
      case 'CLIENTE':
        return Icons.home;
      default:
        return Icons.location_on;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _colorForTipo(element.tipo),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(
              _iconForTipo(element.tipo),
              color: Colors.white,
              size: 20,
            ),
          ),
          if (element.nome.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                element.nome,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
      ),
    );
  }
}
