import 'package:freezed_annotation/freezed_annotation.dart';

part 'connection.freezed.dart';
part 'connection.g.dart';

@freezed
class Connection with _$Connection {
  const factory Connection({
    required int id,
    required int from,
    required int to,
    String? fibra,
    String? porta,
    String? cor,
    double? length,
    @Default(false) bool broken,
    @Default([]) List<Map<String, dynamic>> waypoints,
    String? obs,
  }) = _Connection;

  factory Connection.fromJson(Map<String, dynamic> json) =>
      _$ConnectionFromJson(json);
}
