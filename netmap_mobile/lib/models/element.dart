class NetmapElement {
  final int id;
  final String nome;
  final String tipo;
  final double? lat;
  final double? lng;
  final String? status;
  final String? observacao;
  final String? endereco;
  final String? cep;
  final String projetoId;

  NetmapElement({
    required this.id,
    required this.nome,
    required this.tipo,
    this.lat,
    this.lng,
    this.status,
    this.observacao,
    this.endereco,
    this.cep,
    this.projetoId = '',
  });

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

  NetmapElement copyWith({
    int? id,
    String? nome,
    String? tipo,
    double? lat,
    double? lng,
    String? status,
    String? observacao,
    String? endereco,
    String? cep,
  }) {
    return NetmapElement(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      tipo: tipo ?? this.tipo,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      status: status ?? this.status,
      observacao: observacao ?? this.observacao,
      endereco: endereco ?? this.endereco,
      cep: cep ?? this.cep,
      projetoId: projetoId,
    );
  }
}
