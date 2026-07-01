// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'project.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$Project {
  String get id => throw _privateConstructorUsedError;
  String get nome => throw _privateConstructorUsedError;
  String? get cliente => throw _privateConstructorUsedError;
  String? get cidade => throw _privateConstructorUsedError;
  String? get uf => throw _privateConstructorUsedError;
  String? get status => throw _privateConstructorUsedError;
  int get elementCount => throw _privateConstructorUsedError;
  int get connectionCount => throw _privateConstructorUsedError;

  /// Create a copy of Project
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ProjectCopyWith<Project> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ProjectCopyWith<$Res> {
  factory $ProjectCopyWith(Project value, $Res Function(Project) then) =
      _$ProjectCopyWithImpl<$Res, Project>;
  @useResult
  $Res call(
      {String id,
      String nome,
      String? cliente,
      String? cidade,
      String? uf,
      String? status,
      int elementCount,
      int connectionCount});
}

/// @nodoc
class _$ProjectCopyWithImpl<$Res, $Val extends Project>
    implements $ProjectCopyWith<$Res> {
  _$ProjectCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Project
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? nome = null,
    Object? cliente = freezed,
    Object? cidade = freezed,
    Object? uf = freezed,
    Object? status = freezed,
    Object? elementCount = null,
    Object? connectionCount = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      nome: null == nome
          ? _value.nome
          : nome // ignore: cast_nullable_to_non_nullable
              as String,
      cliente: freezed == cliente
          ? _value.cliente
          : cliente // ignore: cast_nullable_to_non_nullable
              as String?,
      cidade: freezed == cidade
          ? _value.cidade
          : cidade // ignore: cast_nullable_to_non_nullable
              as String?,
      uf: freezed == uf
          ? _value.uf
          : uf // ignore: cast_nullable_to_non_nullable
              as String?,
      status: freezed == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String?,
      elementCount: null == elementCount
          ? _value.elementCount
          : elementCount // ignore: cast_nullable_to_non_nullable
              as int,
      connectionCount: null == connectionCount
          ? _value.connectionCount
          : connectionCount // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ProjectImplCopyWith<$Res> implements $ProjectCopyWith<$Res> {
  factory _$$ProjectImplCopyWith(
          _$ProjectImpl value, $Res Function(_$ProjectImpl) then) =
      __$$ProjectImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String nome,
      String? cliente,
      String? cidade,
      String? uf,
      String? status,
      int elementCount,
      int connectionCount});
}

/// @nodoc
class __$$ProjectImplCopyWithImpl<$Res>
    extends _$ProjectCopyWithImpl<$Res, _$ProjectImpl>
    implements _$$ProjectImplCopyWith<$Res> {
  __$$ProjectImplCopyWithImpl(
      _$ProjectImpl _value, $Res Function(_$ProjectImpl) _then)
      : super(_value, _then);

  /// Create a copy of Project
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? nome = null,
    Object? cliente = freezed,
    Object? cidade = freezed,
    Object? uf = freezed,
    Object? status = freezed,
    Object? elementCount = null,
    Object? connectionCount = null,
  }) {
    return _then(_$ProjectImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      nome: null == nome
          ? _value.nome
          : nome // ignore: cast_nullable_to_non_nullable
              as String,
      cliente: freezed == cliente
          ? _value.cliente
          : cliente // ignore: cast_nullable_to_non_nullable
              as String?,
      cidade: freezed == cidade
          ? _value.cidade
          : cidade // ignore: cast_nullable_to_non_nullable
              as String?,
      uf: freezed == uf
          ? _value.uf
          : uf // ignore: cast_nullable_to_non_nullable
              as String?,
      status: freezed == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String?,
      elementCount: null == elementCount
          ? _value.elementCount
          : elementCount // ignore: cast_nullable_to_non_nullable
              as int,
      connectionCount: null == connectionCount
          ? _value.connectionCount
          : connectionCount // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc

class _$ProjectImpl extends _Project {
  const _$ProjectImpl(
      {required this.id,
      required this.nome,
      this.cliente,
      this.cidade,
      this.uf,
      this.status,
      this.elementCount = 0,
      this.connectionCount = 0})
      : super._();

  @override
  final String id;
  @override
  final String nome;
  @override
  final String? cliente;
  @override
  final String? cidade;
  @override
  final String? uf;
  @override
  final String? status;
  @override
  @JsonKey()
  final int elementCount;
  @override
  @JsonKey()
  final int connectionCount;

  @override
  String toString() {
    return 'Project(id: $id, nome: $nome, cliente: $cliente, cidade: $cidade, uf: $uf, status: $status, elementCount: $elementCount, connectionCount: $connectionCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ProjectImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.nome, nome) || other.nome == nome) &&
            (identical(other.cliente, cliente) || other.cliente == cliente) &&
            (identical(other.cidade, cidade) || other.cidade == cidade) &&
            (identical(other.uf, uf) || other.uf == uf) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.elementCount, elementCount) ||
                other.elementCount == elementCount) &&
            (identical(other.connectionCount, connectionCount) ||
                other.connectionCount == connectionCount));
  }

  @override
  int get hashCode => Object.hash(runtimeType, id, nome, cliente, cidade, uf,
      status, elementCount, connectionCount);

  /// Create a copy of Project
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ProjectImplCopyWith<_$ProjectImpl> get copyWith =>
      __$$ProjectImplCopyWithImpl<_$ProjectImpl>(this, _$identity);
}

abstract class _Project extends Project {
  const factory _Project(
      {required final String id,
      required final String nome,
      final String? cliente,
      final String? cidade,
      final String? uf,
      final String? status,
      final int elementCount,
      final int connectionCount}) = _$ProjectImpl;
  const _Project._() : super._();

  @override
  String get id;
  @override
  String get nome;
  @override
  String? get cliente;
  @override
  String? get cidade;
  @override
  String? get uf;
  @override
  String? get status;
  @override
  int get elementCount;
  @override
  int get connectionCount;

  /// Create a copy of Project
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ProjectImplCopyWith<_$ProjectImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
