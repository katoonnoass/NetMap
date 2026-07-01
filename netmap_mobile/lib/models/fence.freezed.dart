// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'fence.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Fence _$FenceFromJson(Map<String, dynamic> json) {
  return _Fence.fromJson(json);
}

/// @nodoc
mixin _$Fence {
  int get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get color => throw _privateConstructorUsedError;
  List<Map<String, dynamic>> get coordinates =>
      throw _privateConstructorUsedError;

  /// Serializes this Fence to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Fence
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $FenceCopyWith<Fence> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $FenceCopyWith<$Res> {
  factory $FenceCopyWith(Fence value, $Res Function(Fence) then) =
      _$FenceCopyWithImpl<$Res, Fence>;
  @useResult
  $Res call(
      {int id,
      String name,
      String color,
      List<Map<String, dynamic>> coordinates});
}

/// @nodoc
class _$FenceCopyWithImpl<$Res, $Val extends Fence>
    implements $FenceCopyWith<$Res> {
  _$FenceCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Fence
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? color = null,
    Object? coordinates = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      color: null == color
          ? _value.color
          : color // ignore: cast_nullable_to_non_nullable
              as String,
      coordinates: null == coordinates
          ? _value.coordinates
          : coordinates // ignore: cast_nullable_to_non_nullable
              as List<Map<String, dynamic>>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$FenceImplCopyWith<$Res> implements $FenceCopyWith<$Res> {
  factory _$$FenceImplCopyWith(
          _$FenceImpl value, $Res Function(_$FenceImpl) then) =
      __$$FenceImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String name,
      String color,
      List<Map<String, dynamic>> coordinates});
}

/// @nodoc
class __$$FenceImplCopyWithImpl<$Res>
    extends _$FenceCopyWithImpl<$Res, _$FenceImpl>
    implements _$$FenceImplCopyWith<$Res> {
  __$$FenceImplCopyWithImpl(
      _$FenceImpl _value, $Res Function(_$FenceImpl) _then)
      : super(_value, _then);

  /// Create a copy of Fence
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? color = null,
    Object? coordinates = null,
  }) {
    return _then(_$FenceImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      color: null == color
          ? _value.color
          : color // ignore: cast_nullable_to_non_nullable
              as String,
      coordinates: null == coordinates
          ? _value._coordinates
          : coordinates // ignore: cast_nullable_to_non_nullable
              as List<Map<String, dynamic>>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$FenceImpl implements _Fence {
  const _$FenceImpl(
      {required this.id,
      required this.name,
      this.color = '#2196F3',
      required final List<Map<String, dynamic>> coordinates})
      : _coordinates = coordinates;

  factory _$FenceImpl.fromJson(Map<String, dynamic> json) =>
      _$$FenceImplFromJson(json);

  @override
  final int id;
  @override
  final String name;
  @override
  @JsonKey()
  final String color;
  final List<Map<String, dynamic>> _coordinates;
  @override
  List<Map<String, dynamic>> get coordinates {
    if (_coordinates is EqualUnmodifiableListView) return _coordinates;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_coordinates);
  }

  @override
  String toString() {
    return 'Fence(id: $id, name: $name, color: $color, coordinates: $coordinates)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$FenceImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.color, color) || other.color == color) &&
            const DeepCollectionEquality()
                .equals(other._coordinates, _coordinates));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, color,
      const DeepCollectionEquality().hash(_coordinates));

  /// Create a copy of Fence
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$FenceImplCopyWith<_$FenceImpl> get copyWith =>
      __$$FenceImplCopyWithImpl<_$FenceImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$FenceImplToJson(
      this,
    );
  }
}

abstract class _Fence implements Fence {
  const factory _Fence(
      {required final int id,
      required final String name,
      final String color,
      required final List<Map<String, dynamic>> coordinates}) = _$FenceImpl;

  factory _Fence.fromJson(Map<String, dynamic> json) = _$FenceImpl.fromJson;

  @override
  int get id;
  @override
  String get name;
  @override
  String get color;
  @override
  List<Map<String, dynamic>> get coordinates;

  /// Create a copy of Fence
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$FenceImplCopyWith<_$FenceImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
