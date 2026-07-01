import 'package:freezed_annotation/freezed_annotation.dart';

part 'address_result.freezed.dart';
part 'address_result.g.dart';

@freezed
class AddressResult with _$AddressResult {
  const AddressResult._();

  const factory AddressResult({
    required String cep,
    String? logradouro,
    String? bairro,
    String? localidade,
    String? uf,
    double? latitude,
    double? longitude,
    @Default('') String precision,
  }) = _AddressResult;

  bool get hasCoords => latitude != null && longitude != null;

  String get displayAddress =>
      '${logradouro ?? ''}, ${bairro ?? ''}, ${localidade ?? ''}, ${uf ?? ''}'
          .replaceAll(RegExp(r'^,\s*|,\s*,|,\s*$'), '')
          .trim();

  factory AddressResult.fromJson(Map<String, dynamic> json) =>
      _$AddressResultFromJson(json);
}
