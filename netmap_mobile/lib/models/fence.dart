class Fence {
  final int id;
  final String name;
  final String color;
  final List<Map<String, dynamic>> coordinates;

  Fence({
    required this.id,
    required this.name,
    this.color = '#2196F3',
    required this.coordinates,
  });

  factory Fence.fromJson(Map<String, dynamic> json) {
    return Fence(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      color: json['color'] as String? ?? '#2196F3',
      coordinates: (json['coordinates'] as List<dynamic>?)
              ?.map((c) => c as Map<String, dynamic>)
              .toList() ??
          [],
    );
  }
}
