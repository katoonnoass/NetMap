// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'fence.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$FenceImpl _$$FenceImplFromJson(Map<String, dynamic> json) => _$FenceImpl(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      color: json['color'] as String? ?? '#2196F3',
      coordinates: (json['coordinates'] as List<dynamic>)
          .map((e) => e as Map<String, dynamic>)
          .toList(),
    );

Map<String, dynamic> _$$FenceImplToJson(_$FenceImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'color': instance.color,
      'coordinates': instance.coordinates,
    };
