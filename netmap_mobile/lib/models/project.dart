import 'package:freezed_annotation/freezed_annotation.dart';

part 'project.freezed.dart';

@freezed
class Project with _$Project {
  const Project._();

  const factory Project({
    required String id,
    required String nome,
    String? cliente,
    String? cidade,
    String? uf,
    String? status,
    @Default(0) int elementCount,
    @Default(0) int connectionCount,
  }) = _Project;

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id']?.toString() ?? '',
      nome: (json['nome'] as String? ?? json['name'] as String?) ?? '',
      cliente: json['cliente'] as String? ?? json['client'] as String?,
      cidade: json['cidade'] as String? ?? json['city'] as String?,
      uf: json['uf'] as String?,
      status: json['status'] as String?,
      elementCount: json['element_count'] as int? ??
          (json['elements'] is int ? json['elements'] as int : 0),
      connectionCount: json['connection_count'] as int? ??
          (json['connections'] is int ? json['connections'] as int : 0),
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
