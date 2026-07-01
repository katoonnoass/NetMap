// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'address_result.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AddressResult _$AddressResultFromJson(Map<String, dynamic> json) {
  return _AddressResult.fromJson(json);
}

/// @nodoc
mixin _$AddressResult {
  String get cep => throw _privateConstructorUsedError;
  String? get logradouro => throw _privateConstructorUsedError;
  String? get bairro => throw _privateConstructorUsedError;
  String? get localidade => throw _privateConstructorUsedError;
  String? get uf => throw _privateConstructorUsedError;
  double? get latitude => throw _privateConstructorUsedError;
  double? get longitude => throw _privateConstructorUsedError;
  String get precision => throw _privateConstructorUsedError;

  /// Serializes this AddressResult to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AddressResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AddressResultCopyWith<AddressResult> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AddressResultCopyWith<$Res> {
  factory $AddressResultCopyWith(
          AddressResult value, $Res Function(AddressResult) then) =
      _$AddressResultCopyWithImpl<$Res, AddressResult>;
  @useResult
  $Res call(
      {String cep,
      String? logradouro,
      String? bairro,
      String? localidade,
      String? uf,
      double? latitude,
      double? longitude,
      String precision});
}

/// @nodoc
class _$AddressResultCopyWithImpl<$Res, $Val extends AddressResult>
    implements $AddressResultCopyWith<$Res> {
  _$AddressResultCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AddressResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? cep = null,
    Object? logradouro = freezed,
    Object? bairro = freezed,
    Object? localidade = freezed,
    Object? uf = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? precision = null,
  }) {
    return _then(_value.copyWith(
      cep: null == cep
          ? _value.cep
          : cep // ignore: cast_nullable_to_non_nullable
              as String,
      logradouro: freezed == logradouro
          ? _value.logradouro
          : logradouro // ignore: cast_nullable_to_non_nullable
              as String?,
      bairro: freezed == bairro
          ? _value.bairro
          : bairro // ignore: cast_nullable_to_non_nullable
              as String?,
      localidade: freezed == localidade
          ? _value.localidade
          : localidade // ignore: cast_nullable_to_non_nullable
              as String?,
      uf: freezed == uf
          ? _value.uf
          : uf // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      precision: null == precision
          ? _value.precision
          : precision // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AddressResultImplCopyWith<$Res>
    implements $AddressResultCopyWith<$Res> {
  factory _$$AddressResultImplCopyWith(
          _$AddressResultImpl value, $Res Function(_$AddressResultImpl) then) =
      __$$AddressResultImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String cep,
      String? logradouro,
      String? bairro,
      String? localidade,
      String? uf,
      double? latitude,
      double? longitude,
      String precision});
}

/// @nodoc
class __$$AddressResultImplCopyWithImpl<$Res>
    extends _$AddressResultCopyWithImpl<$Res, _$AddressResultImpl>
    implements _$$AddressResultImplCopyWith<$Res> {
  __$$AddressResultImplCopyWithImpl(
      _$AddressResultImpl _value, $Res Function(_$AddressResultImpl) _then)
      : super(_value, _then);

  /// Create a copy of AddressResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? cep = null,
    Object? logradouro = freezed,
    Object? bairro = freezed,
    Object? localidade = freezed,
    Object? uf = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? precision = null,
  }) {
    return _then(_$AddressResultImpl(
      cep: null == cep
          ? _value.cep
          : cep // ignore: cast_nullable_to_non_nullable
              as String,
      logradouro: freezed == logradouro
          ? _value.logradouro
          : logradouro // ignore: cast_nullable_to_non_nullable
              as String?,
      bairro: freezed == bairro
          ? _value.bairro
          : bairro // ignore: cast_nullable_to_non_nullable
              as String?,
      localidade: freezed == localidade
          ? _value.localidade
          : localidade // ignore: cast_nullable_to_non_nullable
              as String?,
      uf: freezed == uf
          ? _value.uf
          : uf // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      precision: null == precision
          ? _value.precision
          : precision // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AddressResultImpl extends _AddressResult {
  const _$AddressResultImpl(
      {required this.cep,
      this.logradouro,
      this.bairro,
      this.localidade,
      this.uf,
      this.latitude,
      this.longitude,
      this.precision = ''})
      : super._();

  factory _$AddressResultImpl.fromJson(Map<String, dynamic> json) =>
      _$$AddressResultImplFromJson(json);

  @override
  final String cep;
  @override
  final String? logradouro;
  @override
  final String? bairro;
  @override
  final String? localidade;
  @override
  final String? uf;
  @override
  final double? latitude;
  @override
  final double? longitude;
  @override
  @JsonKey()
  final String precision;

  @override
  String toString() {
    return 'AddressResult(cep: $cep, logradouro: $logradouro, bairro: $bairro, localidade: $localidade, uf: $uf, latitude: $latitude, longitude: $longitude, precision: $precision)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AddressResultImpl &&
            (identical(other.cep, cep) || other.cep == cep) &&
            (identical(other.logradouro, logradouro) ||
                other.logradouro == logradouro) &&
            (identical(other.bairro, bairro) || other.bairro == bairro) &&
            (identical(other.localidade, localidade) ||
                other.localidade == localidade) &&
            (identical(other.uf, uf) || other.uf == uf) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.precision, precision) ||
                other.precision == precision));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, cep, logradouro, bairro,
      localidade, uf, latitude, longitude, precision);

  /// Create a copy of AddressResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AddressResultImplCopyWith<_$AddressResultImpl> get copyWith =>
      __$$AddressResultImplCopyWithImpl<_$AddressResultImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AddressResultImplToJson(
      this,
    );
  }
}

abstract class _AddressResult extends AddressResult {
  const factory _AddressResult(
      {required final String cep,
      final String? logradouro,
      final String? bairro,
      final String? localidade,
      final String? uf,
      final double? latitude,
      final double? longitude,
      final String precision}) = _$AddressResultImpl;
  const _AddressResult._() : super._();

  factory _AddressResult.fromJson(Map<String, dynamic> json) =
      _$AddressResultImpl.fromJson;

  @override
  String get cep;
  @override
  String? get logradouro;
  @override
  String? get bairro;
  @override
  String? get localidade;
  @override
  String? get uf;
  @override
  double? get latitude;
  @override
  double? get longitude;
  @override
  String get precision;

  /// Create a copy of AddressResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AddressResultImplCopyWith<_$AddressResultImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
