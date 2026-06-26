class Project {
  final String id;
  final String nome;
  final String? cliente;
  final String? cidade;
  final String? uf;
  final String? status;
  final int elementCount;
  final int connectionCount;

  Project({
    required this.id,
    required this.nome,
    this.cliente,
    this.cidade,
    this.uf,
    this.status,
    this.elementCount = 0,
    this.connectionCount = 0,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id']?.toString() ?? '',
      nome: json['nome'] as String? ?? '',
      cliente: json['cliente'] as String?,
      cidade: json['cidade'] as String?,
      uf: json['uf'] as String?,
      status: json['status'] as String?,
      elementCount: json['element_count'] as int? ??
          (json['elements'] is List ? (json['elements'] as List).length : 0),
      connectionCount: json['connection_count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nome': nome,
        'cliente': cliente,
        'cidade': cidade,
        'uf': uf,
        'status': status,
        'element_count': elementCount,
        'connection_count': connectionCount,
      };
}
