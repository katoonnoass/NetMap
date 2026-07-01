import 'package:freezed_annotation/freezed_annotation.dart';

part 'incident.freezed.dart';

DateTime _parseDateTime(String? dateStr) {
  if (dateStr == null || dateStr.isEmpty) return DateTime.now();
  try {
    return DateTime.parse(dateStr);
  } catch (_) {
    try {
      return DateTime.parse(dateStr.replaceFirst(' ', 'T'));
    } catch (_) {
      return DateTime.now();
    }
  }
}

@freezed
class Incident with _$Incident {
  const Incident._();

  const factory Incident({
    required int id,
    required String title,
    @Default('open') String status,
    @Default('medium') String severity,
    @Default('rede') String category,
    @Default('') String assignedTo,
    int? elementId,
    @Default('') String notes,
    @Default([]) List<IncidentComment> comments,
    required DateTime createdAt,
    required String projectId,
  }) = _Incident;

  String get severityLabel {
    switch (severity) {
      case 'low':
        return 'Baixa';
      case 'medium':
        return 'Média';
      case 'high':
        return 'Alta';
      case 'critical':
        return 'Crítica';
      default:
        return severity;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'open':
        return 'Aberto';
      case 'in_progress':
        return 'Em Andamento';
      case 'resolved':
        return 'Resolvido';
      case 'closed':
        return 'Fechado';
      default:
        return status;
    }
  }

  String get categoryLabel {
    switch (category) {
      case 'rede':
        return 'Rede';
      case 'hardware':
        return 'Hardware';
      case 'software':
        return 'Software';
      case 'seguranca':
        return 'Segurança';
      case 'atendimento':
        return 'Atendimento';
      case 'outro':
        return 'Outro';
      default:
        return category;
    }
  }

  factory Incident.fromJson(Map<String, dynamic> json, {String projectId = ''}) {
    final commentsRaw = json['comments'] as List<dynamic>? ?? [];
    return Incident(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      status: json['status'] as String? ?? 'open',
      severity: json['severity'] as String? ?? 'medium',
      category: json['category'] as String? ?? 'rede',
      assignedTo: json['assigned_to'] as String? ?? '',
      elementId: json['element_id'] as int?,
      notes: json['notes'] as String? ?? '',
      comments: commentsRaw
          .map((c) => IncidentComment.fromJson(c as Map<String, dynamic>))
          .toList(),
      createdAt: _parseDateTime(json['created_at'] as String?),
      projectId: projectId.isNotEmpty
          ? projectId
          : (json['project_id'] as String? ?? ''),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'status': status,
        'severity': severity,
        'category': category,
        'assigned_to': assignedTo,
        'element_id': elementId,
        'notes': notes,
        'comments': comments.map((c) => c.toJson()).toList(),
        'created_at': createdAt.toIso8601String(),
        'project_id': projectId,
      };
}

class IncidentComment {
  final int id;
  final String author;
  final String text;
  final DateTime createdAt;

  IncidentComment({
    required this.id,
    required this.author,
    required this.text,
    required this.createdAt,
  });

  factory IncidentComment.fromJson(Map<String, dynamic> json) {
    return IncidentComment(
      id: json['id'] as int? ?? 0,
      author: json['author'] as String? ?? '',
      text: json['text'] as String? ?? '',
      createdAt: _parseDateTime(json['created_at'] as String?),
    );
  }

  IncidentComment copyWith({
    int? id,
    String? author,
    String? text,
    DateTime? createdAt,
  }) {
    return IncidentComment(
      id: id ?? this.id,
      author: author ?? this.author,
      text: text ?? this.text,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'author': author,
        'text': text,
        'created_at': createdAt.toIso8601String(),
      };
}
