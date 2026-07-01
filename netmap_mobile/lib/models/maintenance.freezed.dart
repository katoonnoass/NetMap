// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'maintenance.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Maintenance _$MaintenanceFromJson(Map<String, dynamic> json) {
  return _Maintenance.fromJson(json);
}

/// @nodoc
mixin _$Maintenance {
  int get id => throw _privateConstructorUsedError;
  int? get elementId => throw _privateConstructorUsedError;
  String? get elementName => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  DateTime get scheduledDate => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;

  /// Serializes this Maintenance to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Maintenance
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MaintenanceCopyWith<Maintenance> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MaintenanceCopyWith<$Res> {
  factory $MaintenanceCopyWith(
          Maintenance value, $Res Function(Maintenance) then) =
      _$MaintenanceCopyWithImpl<$Res, Maintenance>;
  @useResult
  $Res call(
      {int id,
      int? elementId,
      String? elementName,
      String type,
      String description,
      DateTime scheduledDate,
      String status});
}

/// @nodoc
class _$MaintenanceCopyWithImpl<$Res, $Val extends Maintenance>
    implements $MaintenanceCopyWith<$Res> {
  _$MaintenanceCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Maintenance
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? elementId = freezed,
    Object? elementName = freezed,
    Object? type = null,
    Object? description = null,
    Object? scheduledDate = null,
    Object? status = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      elementId: freezed == elementId
          ? _value.elementId
          : elementId // ignore: cast_nullable_to_non_nullable
              as int?,
      elementName: freezed == elementName
          ? _value.elementName
          : elementName // ignore: cast_nullable_to_non_nullable
              as String?,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      scheduledDate: null == scheduledDate
          ? _value.scheduledDate
          : scheduledDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$MaintenanceImplCopyWith<$Res>
    implements $MaintenanceCopyWith<$Res> {
  factory _$$MaintenanceImplCopyWith(
          _$MaintenanceImpl value, $Res Function(_$MaintenanceImpl) then) =
      __$$MaintenanceImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int? elementId,
      String? elementName,
      String type,
      String description,
      DateTime scheduledDate,
      String status});
}

/// @nodoc
class __$$MaintenanceImplCopyWithImpl<$Res>
    extends _$MaintenanceCopyWithImpl<$Res, _$MaintenanceImpl>
    implements _$$MaintenanceImplCopyWith<$Res> {
  __$$MaintenanceImplCopyWithImpl(
      _$MaintenanceImpl _value, $Res Function(_$MaintenanceImpl) _then)
      : super(_value, _then);

  /// Create a copy of Maintenance
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? elementId = freezed,
    Object? elementName = freezed,
    Object? type = null,
    Object? description = null,
    Object? scheduledDate = null,
    Object? status = null,
  }) {
    return _then(_$MaintenanceImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      elementId: freezed == elementId
          ? _value.elementId
          : elementId // ignore: cast_nullable_to_non_nullable
              as int?,
      elementName: freezed == elementName
          ? _value.elementName
          : elementName // ignore: cast_nullable_to_non_nullable
              as String?,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      scheduledDate: null == scheduledDate
          ? _value.scheduledDate
          : scheduledDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$MaintenanceImpl extends _Maintenance {
  const _$MaintenanceImpl(
      {required this.id,
      this.elementId,
      this.elementName,
      this.type = 'preventiva',
      this.description = '',
      required this.scheduledDate,
      this.status = 'pending'})
      : super._();

  factory _$MaintenanceImpl.fromJson(Map<String, dynamic> json) =>
      _$$MaintenanceImplFromJson(json);

  @override
  final int id;
  @override
  final int? elementId;
  @override
  final String? elementName;
  @override
  @JsonKey()
  final String type;
  @override
  @JsonKey()
  final String description;
  @override
  final DateTime scheduledDate;
  @override
  @JsonKey()
  final String status;

  @override
  String toString() {
    return 'Maintenance(id: $id, elementId: $elementId, elementName: $elementName, type: $type, description: $description, scheduledDate: $scheduledDate, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MaintenanceImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.elementId, elementId) ||
                other.elementId == elementId) &&
            (identical(other.elementName, elementName) ||
                other.elementName == elementName) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.scheduledDate, scheduledDate) ||
                other.scheduledDate == scheduledDate) &&
            (identical(other.status, status) || other.status == status));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, elementId, elementName, type,
      description, scheduledDate, status);

  /// Create a copy of Maintenance
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MaintenanceImplCopyWith<_$MaintenanceImpl> get copyWith =>
      __$$MaintenanceImplCopyWithImpl<_$MaintenanceImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$MaintenanceImplToJson(
      this,
    );
  }
}

abstract class _Maintenance extends Maintenance {
  const factory _Maintenance(
      {required final int id,
      final int? elementId,
      final String? elementName,
      final String type,
      final String description,
      required final DateTime scheduledDate,
      final String status}) = _$MaintenanceImpl;
  const _Maintenance._() : super._();

  factory _Maintenance.fromJson(Map<String, dynamic> json) =
      _$MaintenanceImpl.fromJson;

  @override
  int get id;
  @override
  int? get elementId;
  @override
  String? get elementName;
  @override
  String get type;
  @override
  String get description;
  @override
  DateTime get scheduledDate;
  @override
  String get status;

  /// Create a copy of Maintenance
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MaintenanceImplCopyWith<_$MaintenanceImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
