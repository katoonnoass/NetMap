class AddressResult {
  final String cep;
  final String? logradouro;
  final String? bairro;
  final String? localidade;
  final String? uf;
  final double? latitude;
  final double? longitude;
  final String precision;

  AddressResult({
    required this.cep,
    this.logradouro,
    this.bairro,
    this.localidade,
    this.uf,
    this.latitude,
    this.longitude,
    this.precision = '',
  });

  bool get hasCoords => latitude != null && longitude != null;

  factory AddressResult.fromJson(Map<String, dynamic> json) {
    return AddressResult(
      cep: json['cep'] as String? ?? '',
      logradouro: json['logradouro'] as String?,
      bairro: json['bairro'] as String?,
      localidade: json['localidade'] as String?,
      uf: json['uf'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      precision: json['precision'] as String? ?? '',
    );
  }

  String get displayAddress =>
      '${logradouro ?? ''}, ${bairro ?? ''}, ${localidade ?? ''}, ${uf ?? ''}'
          .replaceAll(RegExp(r'^,\s*|,\s*,|,\s*$'), '')
          .trim();
}
