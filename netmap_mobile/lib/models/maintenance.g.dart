// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$MaintenanceImpl _$$MaintenanceImplFromJson(Map<String, dynamic> json) =>
    _$MaintenanceImpl(
      id: (json['id'] as num).toInt(),
      elementId: (json['elementId'] as num?)?.toInt(),
      elementName: json['elementName'] as String?,
      type: json['type'] as String? ?? 'preventiva',
      description: json['description'] as String? ?? '',
      scheduledDate: DateTime.parse(json['scheduledDate'] as String),
      status: json['status'] as String? ?? 'pending',
    );

Map<String, dynamic> _$$MaintenanceImplToJson(_$MaintenanceImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'elementId': instance.elementId,
      'elementName': instance.elementName,
      'type': instance.type,
      'description': instance.description,
      'scheduledDate': instance.scheduledDate.toIso8601String(),
      'status': instance.status,
    };
