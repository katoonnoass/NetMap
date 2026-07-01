// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'connection.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Connection _$ConnectionFromJson(Map<String, dynamic> json) {
  return _Connection.fromJson(json);
}

/// @nodoc
mixin _$Connection {
  int get id => throw _privateConstructorUsedError;
  int get from => throw _privateConstructorUsedError;
  int get to => throw _privateConstructorUsedError;
  String? get fibra => throw _privateConstructorUsedError;
  String? get porta => throw _privateConstructorUsedError;
  String? get cor => throw _privateConstructorUsedError;
  double? get length => throw _privateConstructorUsedError;
  bool get broken => throw _privateConstructorUsedError;
  List<Map<String, dynamic>> get waypoints =>
      throw _privateConstructorUsedError;
  String? get obs => throw _privateConstructorUsedError;

  /// Serializes this Connection to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Connection
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ConnectionCopyWith<Connection> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ConnectionCopyWith<$Res> {
  factory $ConnectionCopyWith(
          Connection value, $Res Function(Connection) then) =
      _$ConnectionCopyWithImpl<$Res, Connection>;
  @useResult
  $Res call(
      {int id,
      int from,
      int to,
      String? fibra,
      String? porta,
      String? cor,
      double? length,
      bool broken,
      List<Map<String, dynamic>> waypoints,
      String? obs});
}

/// @nodoc
class _$ConnectionCopyWithImpl<$Res, $Val extends Connection>
    implements $ConnectionCopyWith<$Res> {
  _$ConnectionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Connection
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? from = null,
    Object? to = null,
    Object? fibra = freezed,
    Object? porta = freezed,
    Object? cor = freezed,
    Object? length = freezed,
    Object? broken = null,
    Object? waypoints = null,
    Object? obs = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      from: null == from
          ? _value.from
          : from // ignore: cast_nullable_to_non_nullable
              as int,
      to: null == to
          ? _value.to
          : to // ignore: cast_nullable_to_non_nullable
              as int,
      fibra: freezed == fibra
          ? _value.fibra
          : fibra // ignore: cast_nullable_to_non_nullable
              as String?,
      porta: freezed == porta
          ? _value.porta
          : porta // ignore: cast_nullable_to_non_nullable
              as String?,
      cor: freezed == cor
          ? _value.cor
          : cor // ignore: cast_nullable_to_non_nullable
              as String?,
      length: freezed == length
          ? _value.length
          : length // ignore: cast_nullable_to_non_nullable
              as double?,
      broken: null == broken
          ? _value.broken
          : broken // ignore: cast_nullable_to_non_nullable
              as bool,
      waypoints: null == waypoints
          ? _value.waypoints
          : waypoints // ignore: cast_nullable_to_non_nullable
              as List<Map<String, dynamic>>,
      obs: freezed == obs
          ? _value.obs
          : obs // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ConnectionImplCopyWith<$Res>
    implements $ConnectionCopyWith<$Res> {
  factory _$$ConnectionImplCopyWith(
          _$ConnectionImpl value, $Res Function(_$ConnectionImpl) then) =
      __$$ConnectionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int from,
      int to,
      String? fibra,
      String? porta,
      String? cor,
      double? length,
      bool broken,
      List<Map<String, dynamic>> waypoints,
      String? obs});
}

/// @nodoc
class __$$ConnectionImplCopyWithImpl<$Res>
    extends _$ConnectionCopyWithImpl<$Res, _$ConnectionImpl>
    implements _$$ConnectionImplCopyWith<$Res> {
  __$$ConnectionImplCopyWithImpl(
      _$ConnectionImpl _value, $Res Function(_$ConnectionImpl) _then)
      : super(_value, _then);

  /// Create a copy of Connection
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? from = null,
    Object? to = null,
    Object? fibra = freezed,
    Object? porta = freezed,
    Object? cor = freezed,
    Object? length = freezed,
    Object? broken = null,
    Object? waypoints = null,
    Object? obs = freezed,
  }) {
    return _then(_$ConnectionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      from: null == from
          ? _value.from
          : from // ignore: cast_nullable_to_non_nullable
              as int,
      to: null == to
          ? _value.to
          : to // ignore: cast_nullable_to_non_nullable
              as int,
      fibra: freezed == fibra
          ? _value.fibra
          : fibra // ignore: cast_nullable_to_non_nullable
              as String?,
      porta: freezed == porta
          ? _value.porta
          : porta // ignore: cast_nullable_to_non_nullable
              as String?,
      cor: freezed == cor
          ? _value.cor
          : cor // ignore: cast_nullable_to_non_nullable
              as String?,
      length: freezed == length
          ? _value.length
          : length // ignore: cast_nullable_to_non_nullable
              as double?,
      broken: null == broken
          ? _value.broken
          : broken // ignore: cast_nullable_to_non_nullable
              as bool,
      waypoints: null == waypoints
          ? _value._waypoints
          : waypoints // ignore: cast_nullable_to_non_nullable
              as List<Map<String, dynamic>>,
      obs: freezed == obs
          ? _value.obs
          : obs // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ConnectionImpl implements _Connection {
  const _$ConnectionImpl(
      {required this.id,
      required this.from,
      required this.to,
      this.fibra,
      this.porta,
      this.cor,
      this.length,
      this.broken = false,
      final List<Map<String, dynamic>> waypoints = const [],
      this.obs})
      : _waypoints = waypoints;

  factory _$ConnectionImpl.fromJson(Map<String, dynamic> json) =>
      _$$ConnectionImplFromJson(json);

  @override
  final int id;
  @override
  final int from;
  @override
  final int to;
  @override
  final String? fibra;
  @override
  final String? porta;
  @override
  final String? cor;
  @override
  final double? length;
  @override
  @JsonKey()
  final bool broken;
  final List<Map<String, dynamic>> _waypoints;
  @override
  @JsonKey()
  List<Map<String, dynamic>> get waypoints {
    if (_waypoints is EqualUnmodifiableListView) return _waypoints;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_waypoints);
  }

  @override
  final String? obs;

  @override
  String toString() {
    return 'Connection(id: $id, from: $from, to: $to, fibra: $fibra, porta: $porta, cor: $cor, length: $length, broken: $broken, waypoints: $waypoints, obs: $obs)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ConnectionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.from, from) || other.from == from) &&
            (identical(other.to, to) || other.to == to) &&
            (identical(other.fibra, fibra) || other.fibra == fibra) &&
            (identical(other.porta, porta) || other.porta == porta) &&
            (identical(other.cor, cor) || other.cor == cor) &&
            (identical(other.length, length) || other.length == length) &&
            (identical(other.broken, broken) || other.broken == broken) &&
            const DeepCollectionEquality()
                .equals(other._waypoints, _waypoints) &&
            (identical(other.obs, obs) || other.obs == obs));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, from, to, fibra, porta, cor,
      length, broken, const DeepCollectionEquality().hash(_waypoints), obs);

  /// Create a copy of Connection
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ConnectionImplCopyWith<_$ConnectionImpl> get copyWith =>
      __$$ConnectionImplCopyWithImpl<_$ConnectionImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ConnectionImplToJson(
      this,
    );
  }
}

abstract class _Connection implements Connection {
  const factory _Connection(
      {required final int id,
      required final int from,
      required final int to,
      final String? fibra,
      final String? porta,
      final String? cor,
      final double? length,
      final bool broken,
      final List<Map<String, dynamic>> waypoints,
      final String? obs}) = _$ConnectionImpl;

  factory _Connection.fromJson(Map<String, dynamic> json) =
      _$ConnectionImpl.fromJson;

  @override
  int get id;
  @override
  int get from;
  @override
  int get to;
  @override
  String? get fibra;
  @override
  String? get porta;
  @override
  String? get cor;
  @override
  double? get length;
  @override
  bool get broken;
  @override
  List<Map<String, dynamic>> get waypoints;
  @override
  String? get obs;

  /// Create a copy of Connection
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ConnectionImplCopyWith<_$ConnectionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
