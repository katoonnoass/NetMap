// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cto_port.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CtoPortImpl _$$CtoPortImplFromJson(Map<String, dynamic> json) =>
    _$CtoPortImpl(
      num: (json['num'] as num).toInt(),
      status: json['status'] as String? ?? 'livre',
      clientId: (json['client_id'] as num?)?.toInt(),
      clientNome: json['client_nome'] as String?,
      obs: json['obs'] as String?,
      splitterType: json['splitter_type'] as String?,
      parentPort: (json['parent_port'] as num?)?.toInt(),
      subportIndex: (json['subport_index'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$CtoPortImplToJson(_$CtoPortImpl instance) =>
    <String, dynamic>{
      'num': instance.num,
      'status': instance.status,
      'client_id': instance.clientId,
      'client_nome': instance.clientNome,
      'obs': instance.obs,
      'splitter_type': instance.splitterType,
      'parent_port': instance.parentPort,
      'subport_index': instance.subportIndex,
    };
