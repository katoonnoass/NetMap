import 'dart:io';
import 'package:netmap_mobile/models/project.dart';
import 'package:netmap_mobile/providers/element_provider.dart';
import 'package:netmap_mobile/providers/incident_provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class ReportService {
  static Future<void> generateAndShareReport({
    required Project project,
    required ElementProvider elementProvider,
    required IncidentProvider incidentProvider,
    required String format,
  }) async {
    final dir = await getTemporaryDirectory();
    final timestamp = DateTime.now().millisecondsSinceEpoch;

    if (format == 'csv') {
      final path = '${dir.path}/relatorio_${project.id}_$timestamp.csv';
      final buffer = StringBuffer();

      buffer.writeln('=== NETMAP - RELATORIO DE ELEMENTOS ===');
      buffer.writeln('Projeto: ${project.nome}');
      buffer.writeln('ID,Nome,Tipo,Status,Lat,Lng,Endereco,Observacao');
      for (final e in elementProvider.elements) {
        buffer.writeln(
          '${e.id},${e.nome},${e.tipo},${e.status ?? ""},'
          '${e.lat ?? ""},${e.lng ?? ""},${e.endereco ?? ""},${e.observacao ?? ""}',
        );
      }

      buffer.writeln();
      buffer.writeln('=== NETMAP - RELATORIO DE INCIDENTES ===');
      buffer.writeln('ID,Titulo,Status,Severidade,Categoria,Data');
      for (final inc in incidentProvider.incidents) {
        buffer.writeln(
          '${inc.id},"${inc.title}",${inc.status},${inc.severity},'
          '${inc.category},${inc.createdAt.toIso8601String().split("T")[0]}',
        );
      }

      await File(path).writeAsString(buffer.toString());
      await Share.shareXFiles([XFile(path)], text: 'Relatorio NetMap');
    } else {
      final path = '${dir.path}/relatorio_${project.id}_$timestamp.txt';
      final buffer = StringBuffer();

      buffer.writeln('========================================');
      buffer.writeln('  NETMAP - RELATORIO DO PROJETO');
      buffer.writeln('========================================');
      buffer.writeln();
      buffer.writeln('Projeto: ${project.nome}');
      buffer.writeln('Total de Elementos: ${elementProvider.elements.length}');
      buffer.writeln('Total de Incidentes: ${incidentProvider.incidents.length}');
      buffer.writeln();

      buffer.writeln('--- ELEMENTOS ---');
      for (final e in elementProvider.elements) {
        buffer.writeln('  #${e.id} ${e.nome} (${e.tipo}) - ${e.status ?? "sem status"}');
      }

      buffer.writeln();
      buffer.writeln('--- INCIDENTES ---');
      for (final inc in incidentProvider.incidents) {
        buffer.writeln(
          '  #${inc.id} ${inc.title} [${inc.statusLabel}] '
          'Severidade: ${inc.severityLabel} - ${inc.createdAt.toIso8601String().split("T")[0]}',
        );
        if (inc.comments.isNotEmpty) {
          buffer.writeln('  Comentarios: ${inc.comments.length}');
        }
        buffer.writeln();
      }

      buffer.writeln('========================================');
      buffer.writeln('  Gerado em: ${DateTime.now().toIso8601String()}');
      buffer.writeln('========================================');

      await File(path).writeAsString(buffer.toString());
      await Share.shareXFiles([XFile(path)], text: 'Relatorio NetMap');
    }
  }
}
