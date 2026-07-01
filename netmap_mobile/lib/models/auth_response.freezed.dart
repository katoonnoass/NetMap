// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'auth_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$AuthResponse {
  bool get ok => throw _privateConstructorUsedError;
  String get username => throw _privateConstructorUsedError;
  String get nome => throw _privateConstructorUsedError;
  String get role => throw _privateConstructorUsedError;
  Map<String, dynamic> get permissions => throw _privateConstructorUsedError;
  bool get passwordNeedsRotation => throw _privateConstructorUsedError;
  String? get error => throw _privateConstructorUsedError;
  bool get usingApiKey => throw _privateConstructorUsedError;

  /// Create a copy of AuthResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AuthResponseCopyWith<AuthResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AuthResponseCopyWith<$Res> {
  factory $AuthResponseCopyWith(
          AuthResponse value, $Res Function(AuthResponse) then) =
      _$AuthResponseCopyWithImpl<$Res, AuthResponse>;
  @useResult
  $Res call(
      {bool ok,
      String username,
      String nome,
      String role,
      Map<String, dynamic> permissions,
      bool passwordNeedsRotation,
      String? error,
      bool usingApiKey});
}

/// @nodoc
class _$AuthResponseCopyWithImpl<$Res, $Val extends AuthResponse>
    implements $AuthResponseCopyWith<$Res> {
  _$AuthResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AuthResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? ok = null,
    Object? username = null,
    Object? nome = null,
    Object? role = null,
    Object? permissions = null,
    Object? passwordNeedsRotation = null,
    Object? error = freezed,
    Object? usingApiKey = null,
  }) {
    return _then(_value.copyWith(
      ok: null == ok
          ? _value.ok
          : ok // ignore: cast_nullable_to_non_nullable
              as bool,
      username: null == username
          ? _value.username
          : username // ignore: cast_nullable_to_non_nullable
              as String,
      nome: null == nome
          ? _value.nome
          : nome // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
      permissions: null == permissions
          ? _value.permissions
          : permissions // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      passwordNeedsRotation: null == passwordNeedsRotation
          ? _value.passwordNeedsRotation
          : passwordNeedsRotation // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      usingApiKey: null == usingApiKey
          ? _value.usingApiKey
          : usingApiKey // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AuthResponseImplCopyWith<$Res>
    implements $AuthResponseCopyWith<$Res> {
  factory _$$AuthResponseImplCopyWith(
          _$AuthResponseImpl value, $Res Function(_$AuthResponseImpl) then) =
      __$$AuthResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {bool ok,
      String username,
      String nome,
      String role,
      Map<String, dynamic> permissions,
      bool passwordNeedsRotation,
      String? error,
      bool usingApiKey});
}

/// @nodoc
class __$$AuthResponseImplCopyWithImpl<$Res>
    extends _$AuthResponseCopyWithImpl<$Res, _$AuthResponseImpl>
    implements _$$AuthResponseImplCopyWith<$Res> {
  __$$AuthResponseImplCopyWithImpl(
      _$AuthResponseImpl _value, $Res Function(_$AuthResponseImpl) _then)
      : super(_value, _then);

  /// Create a copy of AuthResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? ok = null,
    Object? username = null,
    Object? nome = null,
    Object? role = null,
    Object? permissions = null,
    Object? passwordNeedsRotation = null,
    Object? error = freezed,
    Object? usingApiKey = null,
  }) {
    return _then(_$AuthResponseImpl(
      ok: null == ok
          ? _value.ok
          : ok // ignore: cast_nullable_to_non_nullable
              as bool,
      username: null == username
          ? _value.username
          : username // ignore: cast_nullable_to_non_nullable
              as String,
      nome: null == nome
          ? _value.nome
          : nome // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
      permissions: null == permissions
          ? _value._permissions
          : permissions // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      passwordNeedsRotation: null == passwordNeedsRotation
          ? _value.passwordNeedsRotation
          : passwordNeedsRotation // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      usingApiKey: null == usingApiKey
          ? _value.usingApiKey
          : usingApiKey // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc

class _$AuthResponseImpl extends _AuthResponse {
  const _$AuthResponseImpl(
      {this.ok = false,
      this.username = '',
      this.nome = '',
      this.role = 'viewer',
      final Map<String, dynamic> permissions = const {},
      this.passwordNeedsRotation = false,
      this.error,
      this.usingApiKey = false})
      : _permissions = permissions,
        super._();

  @override
  @JsonKey()
  final bool ok;
  @override
  @JsonKey()
  final String username;
  @override
  @JsonKey()
  final String nome;
  @override
  @JsonKey()
  final String role;
  final Map<String, dynamic> _permissions;
  @override
  @JsonKey()
  Map<String, dynamic> get permissions {
    if (_permissions is EqualUnmodifiableMapView) return _permissions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_permissions);
  }

  @override
  @JsonKey()
  final bool passwordNeedsRotation;
  @override
  final String? error;
  @override
  @JsonKey()
  final bool usingApiKey;

  @override
  String toString() {
    return 'AuthResponse(ok: $ok, username: $username, nome: $nome, role: $role, permissions: $permissions, passwordNeedsRotation: $passwordNeedsRotation, error: $error, usingApiKey: $usingApiKey)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthResponseImpl &&
            (identical(other.ok, ok) || other.ok == ok) &&
            (identical(other.username, username) ||
                other.username == username) &&
            (identical(other.nome, nome) || other.nome == nome) &&
            (identical(other.role, role) || other.role == role) &&
            const DeepCollectionEquality()
                .equals(other._permissions, _permissions) &&
            (identical(other.passwordNeedsRotation, passwordNeedsRotation) ||
                other.passwordNeedsRotation == passwordNeedsRotation) &&
            (identical(other.error, error) || other.error == error) &&
            (identical(other.usingApiKey, usingApiKey) ||
                other.usingApiKey == usingApiKey));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      ok,
      username,
      nome,
      role,
      const DeepCollectionEquality().hash(_permissions),
      passwordNeedsRotation,
      error,
      usingApiKey);

  /// Create a copy of AuthResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthResponseImplCopyWith<_$AuthResponseImpl> get copyWith =>
      __$$AuthResponseImplCopyWithImpl<_$AuthResponseImpl>(this, _$identity);
}

abstract class _AuthResponse extends AuthResponse {
  const factory _AuthResponse(
      {final bool ok,
      final String username,
      final String nome,
      final String role,
      final Map<String, dynamic> permissions,
      final bool passwordNeedsRotation,
      final String? error,
      final bool usingApiKey}) = _$AuthResponseImpl;
  const _AuthResponse._() : super._();

  @override
  bool get ok;
  @override
  String get username;
  @override
  String get nome;
  @override
  String get role;
  @override
  Map<String, dynamic> get permissions;
  @override
  bool get passwordNeedsRotation;
  @override
  String? get error;
  @override
  bool get usingApiKey;

  /// Create a copy of AuthResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AuthResponseImplCopyWith<_$AuthResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
