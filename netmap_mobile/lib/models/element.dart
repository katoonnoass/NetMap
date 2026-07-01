import 'package:freezed_annotation/freezed_annotation.dart';

part 'element.freezed.dart';

@freezed
class NetmapElement with _$NetmapElement {
  const NetmapElement._();

  const factory NetmapElement({
    required int id,
    required String nome,
    required String tipo,
    double? lat,
    double? lng,
    String? status,
    String? observacao,
    String? endereco,
    String? cep,
    @Default('') String projetoId,
  }) = _NetmapElement;

  bool get hasCoords => lat != null && lng != null;

  factory NetmapElement.fromJson(Map<String, dynamic> json,
      {String projetoId = ''}) {
    return NetmapElement(
      id: json['id'] as int? ?? 0,
      nome: json['nome'] as String? ?? '',
      tipo: json['tipo'] as String? ?? '',
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      status: json['status'] as String?,
      observacao: json['observacao'] as String?,
      endereco: json['endereco'] as String?,
      cep: json['cep'] as String?,
      projetoId: projetoId,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nome': nome,
        'tipo': tipo,
        'lat': lat,
        'lng': lng,
        'status': status,
        'observacao': observacao,
        'endereco': endereco,
        'cep': cep,
      };
}
