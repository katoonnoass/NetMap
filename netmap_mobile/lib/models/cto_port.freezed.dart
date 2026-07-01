// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'cto_port.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

CtoPort _$CtoPortFromJson(Map<String, dynamic> json) {
  return _CtoPort.fromJson(json);
}

/// @nodoc
mixin _$CtoPort {
  int get num => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  @JsonKey(name: 'client_id')
  int? get clientId => throw _privateConstructorUsedError;
  @JsonKey(name: 'client_nome')
  String? get clientNome => throw _privateConstructorUsedError;
  String? get obs => throw _privateConstructorUsedError;
  @JsonKey(name: 'splitter_type')
  String? get splitterType => throw _privateConstructorUsedError;
  @JsonKey(name: 'parent_port')
  int? get parentPort => throw _privateConstructorUsedError;
  @JsonKey(name: 'subport_index')
  int? get subportIndex => throw _privateConstructorUsedError;

  /// Serializes this CtoPort to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CtoPort
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CtoPortCopyWith<CtoPort> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CtoPortCopyWith<$Res> {
  factory $CtoPortCopyWith(CtoPort value, $Res Function(CtoPort) then) =
      _$CtoPortCopyWithImpl<$Res, CtoPort>;
  @useResult
  $Res call(
      {int num,
      String status,
      @JsonKey(name: 'client_id') int? clientId,
      @JsonKey(name: 'client_nome') String? clientNome,
      String? obs,
      @JsonKey(name: 'splitter_type') String? splitterType,
      @JsonKey(name: 'parent_port') int? parentPort,
      @JsonKey(name: 'subport_index') int? subportIndex});
}

/// @nodoc
class _$CtoPortCopyWithImpl<$Res, $Val extends CtoPort>
    implements $CtoPortCopyWith<$Res> {
  _$CtoPortCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CtoPort
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? num = null,
    Object? status = null,
    Object? clientId = freezed,
    Object? clientNome = freezed,
    Object? obs = freezed,
    Object? splitterType = freezed,
    Object? parentPort = freezed,
    Object? subportIndex = freezed,
  }) {
    return _then(_value.copyWith(
      num: null == num
          ? _value.num
          : num // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      clientId: freezed == clientId
          ? _value.clientId
          : clientId // ignore: cast_nullable_to_non_nullable
              as int?,
      clientNome: freezed == clientNome
          ? _value.clientNome
          : clientNome // ignore: cast_nullable_to_non_nullable
              as String?,
      obs: freezed == obs
          ? _value.obs
          : obs // ignore: cast_nullable_to_non_nullable
              as String?,
      splitterType: freezed == splitterType
          ? _value.splitterType
          : splitterType // ignore: cast_nullable_to_non_nullable
              as String?,
      parentPort: freezed == parentPort
          ? _value.parentPort
          : parentPort // ignore: cast_nullable_to_non_nullable
              as int?,
      subportIndex: freezed == subportIndex
          ? _value.subportIndex
          : subportIndex // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CtoPortImplCopyWith<$Res> implements $CtoPortCopyWith<$Res> {
  factory _$$CtoPortImplCopyWith(
          _$CtoPortImpl value, $Res Function(_$CtoPortImpl) then) =
      __$$CtoPortImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int num,
      String status,
      @JsonKey(name: 'client_id') int? clientId,
      @JsonKey(name: 'client_nome') String? clientNome,
      String? obs,
      @JsonKey(name: 'splitter_type') String? splitterType,
      @JsonKey(name: 'parent_port') int? parentPort,
      @JsonKey(name: 'subport_index') int? subportIndex});
}

/// @nodoc
class __$$CtoPortImplCopyWithImpl<$Res>
    extends _$CtoPortCopyWithImpl<$Res, _$CtoPortImpl>
    implements _$$CtoPortImplCopyWith<$Res> {
  __$$CtoPortImplCopyWithImpl(
      _$CtoPortImpl _value, $Res Function(_$CtoPortImpl) _then)
      : super(_value, _then);

  /// Create a copy of CtoPort
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? num = null,
    Object? status = null,
    Object? clientId = freezed,
    Object? clientNome = freezed,
    Object? obs = freezed,
    Object? splitterType = freezed,
    Object? parentPort = freezed,
    Object? subportIndex = freezed,
  }) {
    return _then(_$CtoPortImpl(
      num: null == num
          ? _value.num
          : num // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      clientId: freezed == clientId
          ? _value.clientId
          : clientId // ignore: cast_nullable_to_non_nullable
              as int?,
      clientNome: freezed == clientNome
          ? _value.clientNome
          : clientNome // ignore: cast_nullable_to_non_nullable
              as String?,
      obs: freezed == obs
          ? _value.obs
          : obs // ignore: cast_nullable_to_non_nullable
              as String?,
      splitterType: freezed == splitterType
          ? _value.splitterType
          : splitterType // ignore: cast_nullable_to_non_nullable
              as String?,
      parentPort: freezed == parentPort
          ? _value.parentPort
          : parentPort // ignore: cast_nullable_to_non_nullable
              as int?,
      subportIndex: freezed == subportIndex
          ? _value.subportIndex
          : subportIndex // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CtoPortImpl extends _CtoPort {
  const _$CtoPortImpl(
      {required this.num,
      this.status = 'livre',
      @JsonKey(name: 'client_id') this.clientId,
      @JsonKey(name: 'client_nome') this.clientNome,
      this.obs,
      @JsonKey(name: 'splitter_type') this.splitterType,
      @JsonKey(name: 'parent_port') this.parentPort,
      @JsonKey(name: 'subport_index') this.subportIndex})
      : super._();

  factory _$CtoPortImpl.fromJson(Map<String, dynamic> json) =>
      _$$CtoPortImplFromJson(json);

  @override
  final int num;
  @override
  @JsonKey()
  final String status;
  @override
  @JsonKey(name: 'client_id')
  final int? clientId;
  @override
  @JsonKey(name: 'client_nome')
  final String? clientNome;
  @override
  final String? obs;
  @override
  @JsonKey(name: 'splitter_type')
  final String? splitterType;
  @override
  @JsonKey(name: 'parent_port')
  final int? parentPort;
  @override
  @JsonKey(name: 'subport_index')
  final int? subportIndex;

  @override
  String toString() {
    return 'CtoPort(num: $num, status: $status, clientId: $clientId, clientNome: $clientNome, obs: $obs, splitterType: $splitterType, parentPort: $parentPort, subportIndex: $subportIndex)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CtoPortImpl &&
            (identical(other.num, num) || other.num == num) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.clientId, clientId) ||
                other.clientId == clientId) &&
            (identical(other.clientNome, clientNome) ||
                other.clientNome == clientNome) &&
            (identical(other.obs, obs) || other.obs == obs) &&
            (identical(other.splitterType, splitterType) ||
                other.splitterType == splitterType) &&
            (identical(other.parentPort, parentPort) ||
                other.parentPort == parentPort) &&
            (identical(other.subportIndex, subportIndex) ||
                other.subportIndex == subportIndex));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, num, status, clientId,
      clientNome, obs, splitterType, parentPort, subportIndex);

  /// Create a copy of CtoPort
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CtoPortImplCopyWith<_$CtoPortImpl> get copyWith =>
      __$$CtoPortImplCopyWithImpl<_$CtoPortImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CtoPortImplToJson(
      this,
    );
  }
}

abstract class _CtoPort extends CtoPort {
  const factory _CtoPort(
      {required final int num,
      final String status,
      @JsonKey(name: 'client_id') final int? clientId,
      @JsonKey(name: 'client_nome') final String? clientNome,
      final String? obs,
      @JsonKey(name: 'splitter_type') final String? splitterType,
      @JsonKey(name: 'parent_port') final int? parentPort,
      @JsonKey(name: 'subport_index') final int? subportIndex}) = _$CtoPortImpl;
  const _CtoPort._() : super._();

  factory _CtoPort.fromJson(Map<String, dynamic> json) = _$CtoPortImpl.fromJson;

  @override
  int get num;
  @override
  String get status;
  @override
  @JsonKey(name: 'client_id')
  int? get clientId;
  @override
  @JsonKey(name: 'client_nome')
  String? get clientNome;
  @override
  String? get obs;
  @override
  @JsonKey(name: 'splitter_type')
  String? get splitterType;
  @override
  @JsonKey(name: 'parent_port')
  int? get parentPort;
  @override
  @JsonKey(name: 'subport_index')
  int? get subportIndex;

  /// Create a copy of CtoPort
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CtoPortImplCopyWith<_$CtoPortImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
