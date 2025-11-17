import 'package:cloud_firestore/cloud_firestore.dart';

class MilestoneModel {
  final String id;
  final String nombre;
  final String descripcion;
  final double progreso;
  final String estado; // 'pendiente', 'en_progreso', 'completado'
  final String responsableId;
  final String responsableNombre;
  final String responsableAvatar;
  final DateTime? fechaLimite;
  final DateTime? fechaCreacion;

  MilestoneModel({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.progreso,
    required this.estado,
    required this.responsableId,
    required this.responsableNombre,
    required this.responsableAvatar,
    this.fechaLimite,
    this.fechaCreacion,
  });

  factory MilestoneModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return MilestoneModel.fromMap(data, doc.id);
  }

  factory MilestoneModel.fromMap(Map<String, dynamic> data, String id) {
    return MilestoneModel(
      id: id,
      nombre: data['nombre'] ?? '',
      descripcion: data['descripcion'] ?? '',
      progreso: (data['progreso'] ?? 0).toDouble(),
      estado: data['estado'] ?? 'pendiente',
      responsableId: data['responsableId'] ?? data['responsable_id'] ?? '',
      responsableNombre: data['responsableNombre'] ?? data['responsable_nombre'] ?? '',
      responsableAvatar: data['responsableAvatar'] ?? '',
      fechaLimite: data['fechaLimite'] != null
          ? (data['fechaLimite'] as Timestamp).toDate()
          : (data['fecha_limite'] != null
              ? (data['fecha_limite'] as Timestamp).toDate()
              : null),
      fechaCreacion: data['fechaCreacion'] != null
          ? (data['fechaCreacion'] as Timestamp).toDate()
          : (data['fecha_creacion'] != null
              ? (data['fecha_creacion'] as Timestamp).toDate()
              : null),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'nombre': nombre,
      'descripcion': descripcion,
      'progreso': progreso,
      'estado': estado,
      'responsableId': responsableId,
      'responsable_id': responsableId, // Doble nomenclatura
      'responsableNombre': responsableNombre,
      'responsable_nombre': responsableNombre, // Doble nomenclatura
      'responsableAvatar': responsableAvatar,
      'fechaLimite': fechaLimite != null ? Timestamp.fromDate(fechaLimite!) : null,
      'fecha_limite': fechaLimite != null ? Timestamp.fromDate(fechaLimite!) : null,
      'fechaCreacion': fechaCreacion != null ? Timestamp.fromDate(fechaCreacion!) : FieldValue.serverTimestamp(),
      'fecha_creacion': fechaCreacion != null ? Timestamp.fromDate(fechaCreacion!) : FieldValue.serverTimestamp(),
    };
  }

  MilestoneModel copyWith({
    String? id,
    String? nombre,
    String? descripcion,
    double? progreso,
    String? estado,
    String? responsableId,
    String? responsableNombre,
    String? responsableAvatar,
    DateTime? fechaLimite,
    DateTime? fechaCreacion,
  }) {
    return MilestoneModel(
      id: id ?? this.id,
      nombre: nombre ?? this.nombre,
      descripcion: descripcion ?? this.descripcion,
      progreso: progreso ?? this.progreso,
      estado: estado ?? this.estado,
      responsableId: responsableId ?? this.responsableId,
      responsableNombre: responsableNombre ?? this.responsableNombre,
      responsableAvatar: responsableAvatar ?? this.responsableAvatar,
      fechaLimite: fechaLimite ?? this.fechaLimite,
      fechaCreacion: fechaCreacion ?? this.fechaCreacion,
    );
  }
}
