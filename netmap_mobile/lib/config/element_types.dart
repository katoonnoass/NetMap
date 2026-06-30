import 'package:flutter/material.dart';

class ElementTypes {
  static const List<String> all = [
    'BGP', 'Core', 'DIO', 'OLT', 'ONU', 'CEO', 'CTO',
    'Splitter', 'Switch', 'Roteador', 'Poste', 'Cliente',
  ];

  static const List<String> statuses = [
    'ativo', 'inativo', 'alerta', 'offline', 'previsto',
  ];

  static Color colorFor(String tipo) {
    switch (tipo.toLowerCase()) {
      case 'bgp':     return const Color(0xFFFF6B6B);
      case 'core':    return const Color(0xFFFF9100);
      case 'dio':     return const Color(0xFFC77DFF);
      case 'olt':     return const Color(0xFF0080FF);
      case 'onu':     return const Color(0xFF40C4FF);
      case 'ceo':     return const Color(0xFFFFE066);
      case 'cto':     return const Color(0xFF00E676);
      case 'splitter':return const Color(0xFF00C8FF);
      case 'switch':  return const Color(0xFFFF80AB);
      case 'roteador':return const Color(0xFF69F0AE);
      case 'poste':   return const Color(0xFFA1887F);
      case 'cliente': return const Color(0xFFA0F0C0);
      default:        return Colors.grey;
    }
  }

  static IconData iconFor(String tipo) {
    switch (tipo.toLowerCase()) {
      case 'bgp':     return Icons.language;
      case 'core':    return Icons.dns;
      case 'dio':     return Icons.inventory_2;
      case 'olt':     return Icons.settings_input_component;
      case 'onu':     return Icons.wifi;
      case 'ceo':     return Icons.roofing;
      case 'cto':     return Icons.cabin;
      case 'splitter':return Icons.call_split;
      case 'switch':  return Icons.router;
      case 'roteador':return Icons.settings_ethernet;
      case 'poste':   return Icons.electrical_services;
      case 'cliente': return Icons.person_pin;
      default:        return Icons.circle;
    }
  }

  static String labelFor(String tipo) {
    switch (tipo.toLowerCase()) {
      case 'bgp':     return 'BGP/Upstream';
      case 'core':    return 'Core/DC';
      case 'dio':     return 'DIO';
      case 'olt':     return 'OLT';
      case 'onu':     return 'ONU/ONT';
      case 'ceo':     return 'CEO';
      case 'cto':     return 'CTO';
      case 'splitter':return 'Splitter';
      case 'switch':  return 'Switch';
      case 'roteador':return 'Roteador';
      case 'poste':   return 'Poste';
      case 'cliente': return 'Cliente';
      default:        return tipo;
    }
  }

  static String categoryFor(String tipo) {
    switch (tipo.toLowerCase()) {
      case 'bgp': case 'core': case 'dio': case 'olt':
      case 'splitter': case 'switch': case 'roteador':
        return 'core';
      default:
        return 'rua';
    }
  }
}
