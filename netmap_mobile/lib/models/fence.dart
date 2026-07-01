import 'package:freezed_annotation/freezed_annotation.dart';

part 'fence.freezed.dart';
part 'fence.g.dart';

@freezed
class Fence with _$Fence {
  const factory Fence({
    required int id,
    required String name,
    @Default('#2196F3') String color,
    required List<Map<String, dynamic>> coordinates,
  }) = _Fence;

  factory Fence.fromJson(Map<String, dynamic> json) => _$FenceFromJson(json);
}
