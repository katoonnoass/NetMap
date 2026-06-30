import 'package:flutter/material.dart';
import 'package:netmap_mobile/config/element_types.dart';
import 'package:netmap_mobile/models/element.dart';

class ElementPin extends StatelessWidget {
  final NetmapElement element;
  final VoidCallback onTap;
  final bool highlight;

  const ElementPin({
    super.key,
    required this.element,
    required this.onTap,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = ElementTypes.colorFor(element.tipo);
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(
                color: highlight ? Colors.orange : Colors.white,
                width: highlight ? 3 : 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: highlight ? Colors.orange.withOpacity(0.5) : Colors.black.withOpacity(0.3),
                  blurRadius: highlight ? 8 : 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(
              ElementTypes.iconFor(element.tipo),
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
