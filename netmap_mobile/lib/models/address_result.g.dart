// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'address_result.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AddressResultImpl _$$AddressResultImplFromJson(Map<String, dynamic> json) =>
    _$AddressResultImpl(
      cep: json['cep'] as String,
      logradouro: json['logradouro'] as String?,
      bairro: json['bairro'] as String?,
      localidade: json['localidade'] as String?,
      uf: json['uf'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      precision: json['precision'] as String? ?? '',
    );

Map<String, dynamic> _$$AddressResultImplToJson(_$AddressResultImpl instance) =>
    <String, dynamic>{
      'cep': instance.cep,
      'logradouro': instance.logradouro,
      'bairro': instance.bairro,
      'localidade': instance.localidade,
      'uf': instance.uf,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'precision': instance.precision,
    };
