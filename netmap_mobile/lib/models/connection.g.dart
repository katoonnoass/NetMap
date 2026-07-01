// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'connection.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ConnectionImpl _$$ConnectionImplFromJson(Map<String, dynamic> json) =>
    _$ConnectionImpl(
      id: (json['id'] as num).toInt(),
      from: (json['from'] as num).toInt(),
      to: (json['to'] as num).toInt(),
      fibra: json['fibra'] as String?,
      porta: json['porta'] as String?,
      cor: json['cor'] as String?,
      length: (json['length'] as num?)?.toDouble(),
      broken: json['broken'] as bool? ?? false,
      waypoints: (json['waypoints'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          const [],
      obs: json['obs'] as String?,
    );

Map<String, dynamic> _$$ConnectionImplToJson(_$ConnectionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'from': instance.from,
      'to': instance.to,
      'fibra': instance.fibra,
      'porta': instance.porta,
      'cor': instance.cor,
      'length': instance.length,
      'broken': instance.broken,
      'waypoints': instance.waypoints,
      'obs': instance.obs,
    };
