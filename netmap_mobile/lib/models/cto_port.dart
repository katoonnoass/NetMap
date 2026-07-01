import 'package:freezed_annotation/freezed_annotation.dart';

part 'cto_port.freezed.dart';
part 'cto_port.g.dart';

@freezed
class CtoPort with _$CtoPort {
  const CtoPort._();

  const factory CtoPort({
    required int num,
    @Default('livre') String status,
    @JsonKey(name: 'client_id') int? clientId,
    @JsonKey(name: 'client_nome') String? clientNome,
    String? obs,
    @JsonKey(name: 'splitter_type') String? splitterType,
    @JsonKey(name: 'parent_port') int? parentPort,
    @JsonKey(name: 'subport_index') int? subportIndex,
  }) = _CtoPort;

  bool get isOccupied => status == 'ocupado';
  bool get isSplitter => status == 'splitter';
  bool get isFree => status == 'livre';

  factory CtoPort.fromJson(Map<String, dynamic> json) =>
      _$CtoPortFromJson(json);
}
