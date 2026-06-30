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

  BoxShape _shapeFor(String tipo) {
    switch (tipo.toLowerCase()) {
      case 'olt': case 'core': case 'bgp':
        return BoxShape.rectangle;
      case 'cto': case 'ceo':
        return BoxShape.circle;
      case 'dio':
        return BoxShape.rectangle;
      case 'splitter': case 'switch': case 'roteador':
        return BoxShape.rectangle;
      case 'poste':
        return BoxShape.circle;
      case 'cliente': case 'residence':
        return BoxShape.rectangle;
      default:
        return BoxShape.circle;
    }
  }

  BorderRadius? _borderRadiusFor(String tipo) {
    switch (tipo.toLowerCase()) {
      case 'olt': case 'core': case 'bgp':
        return BorderRadius.circular(6);
      case 'dio':
        return BorderRadius.circular(8);
      case 'splitter': case 'switch': case 'roteador':
        return BorderRadius.circular(4);
      case 'cliente': case 'residence':
        return BorderRadius.circular(4);
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = ElementTypes.colorFor(element.tipo);
    final isRect = _shapeFor(element.tipo) == BoxShape.rectangle;
    final borderRadius = _borderRadiusFor(element.tipo);
    final isBroken = element.status == 'rompido' || element.status == 'inativo';

    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isBroken ? Colors.grey : color,
              shape: isRect ? BoxShape.rectangle : BoxShape.circle,
              borderRadius: borderRadius,
              border: Border.all(
                color: highlight ? Colors.orange : Colors.white,
                width: highlight ? 3 : 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: highlight
                      ? Colors.orange.withValues(alpha: 0.5)
                      : Colors.black.withValues(alpha: 0.3),
                  blurRadius: highlight ? 8 : 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(
              ElementTypes.iconFor(element.tipo),
              color: Colors.white,
              size: 18,
            ),
          ),
          if (element.nome.isNotEmpty)
            Container(
              constraints: const BoxConstraints(maxWidth: 80),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                element.nome,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ),
        ],
      ),
    );
  }
}
