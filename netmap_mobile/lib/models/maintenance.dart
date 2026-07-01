import 'package:freezed_annotation/freezed_annotation.dart';

part 'maintenance.freezed.dart';
part 'maintenance.g.dart';

@freezed
class Maintenance with _$Maintenance {
  const Maintenance._();

  const factory Maintenance({
    required int id,
    int? elementId,
    String? elementName,
    @Default('preventiva') String type,
    @Default('') String description,
    required DateTime scheduledDate,
    @Default('pending') String status,
  }) = _Maintenance;

  String get typeLabel {
    switch (type) {
      case 'preventiva':
        return 'Preventiva';
      case 'corretiva':
        return 'Corretiva';
      case 'instalacao':
        return 'Instalacao';
      default:
        return type;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  factory Maintenance.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceFromJson(json);
}
