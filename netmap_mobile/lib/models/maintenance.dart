class Maintenance {
  final int id;
  final int? elementId;
  final String? elementName;
  final String type;
  final String description;
  final DateTime scheduledDate;
  final String status;

  Maintenance({
    required this.id,
    this.elementId,
    this.elementName,
    required this.type,
    this.description = '',
    required this.scheduledDate,
    this.status = 'pending',
  });

  String get typeLabel {
    switch (type) {
      case 'preventiva': return 'Preventiva';
      case 'corretiva': return 'Corretiva';
      case 'instalacao': return 'Instalacao';
      default: return type;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }

  factory Maintenance.fromJson(Map<String, dynamic> json) {
    return Maintenance(
      id: json['id'] as int? ?? 0,
      elementId: json['element_id'] as int?,
      elementName: json['element_name'] as String?,
      type: json['type'] as String? ?? 'preventiva',
      description: json['description'] as String? ?? '',
      scheduledDate: DateTime.tryParse(json['scheduled_date'] as String? ?? '') ?? DateTime.now(),
      status: json['status'] as String? ?? 'pending',
    );
  }
}
