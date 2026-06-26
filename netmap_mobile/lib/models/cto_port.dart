class CtoPort {
  final int num;
  final String status;
  final int? clientId;
  final String? clientNome;
  final String? obs;
  final String? splitterType;
  final int? parentPort;
  final int? subportIndex;

  CtoPort({
    required this.num,
    required this.status,
    this.clientId,
    this.clientNome,
    this.obs,
    this.splitterType,
    this.parentPort,
    this.subportIndex,
  });

  bool get isOccupied => status == 'ocupado';
  bool get isSplitter => status == 'splitter';
  bool get isFree => status == 'livre';

  factory CtoPort.fromJson(Map<String, dynamic> json) {
    return CtoPort(
      num: json['num'] as int? ?? 0,
      status: json['status'] as String? ?? 'livre',
      clientId: json['client_id'] as int?,
      clientNome: json['client_nome'] as String?,
      obs: json['obs'] as String?,
      splitterType: json['splitter_type'] as String?,
      parentPort: json['parent_port'] as int?,
      subportIndex: json['subport_index'] as int?,
    );
  }
}
