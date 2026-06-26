class Connection {
  final int id;
  final int from;
  final int to;
  final String? fibra;
  final String? porta;
  final String? cor;
  final double? length;
  final bool broken;
  final List<Map<String, dynamic>> waypoints;
  final String? obs;

  Connection({
    required this.id,
    required this.from,
    required this.to,
    this.fibra,
    this.porta,
    this.cor,
    this.length,
    this.broken = false,
    this.waypoints = const [],
    this.obs,
  });

  factory Connection.fromJson(Map<String, dynamic> json) {
    return Connection(
      id: json['id'] as int? ?? 0,
      from: json['from'] as int? ?? 0,
      to: json['to'] as int? ?? 0,
      fibra: json['fibra'] as String?,
      porta: json['porta'] as String?,
      cor: json['cor'] as String?,
      length: (json['length'] as num?)?.toDouble(),
      broken: json['broken'] == true,
      waypoints: (json['waypoints'] as List<dynamic>?)
              ?.map((w) => w as Map<String, dynamic>)
              .toList() ??
          [],
      obs: json['obs'] as String?,
    );
  }
}
