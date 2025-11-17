import 'package:cloud_firestore/cloud_firestore.dart';

class ActivityModel {
  final String id;
  final String usuarioId;
  final String usuarioNombre;
  final String avatar;
  final String descripcion;
  final String tareaModificada;
  final String proyectoId;
  final String proyectoNombre;
  final DateTime? fecha;

  ActivityModel({
    required this.id,
    required this.usuarioId,
    required this.usuarioNombre,
    required this.avatar,
    required this.descripcion,
    required this.tareaModificada,
    required this.proyectoId,
    required this.proyectoNombre,
    this.fecha,
  });

  factory ActivityModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return ActivityModel.fromMap(data, doc.id);
  }

  factory ActivityModel.fromMap(Map<String, dynamic> data, String id) {
    return ActivityModel(
      id: id,
      usuarioId: data['usuarioId'] ?? data['usuario_id'] ?? '',
      usuarioNombre: data['usuarioNombre'] ?? '',
      avatar: data['avatar'] ?? '',
      descripcion: data['descripcion'] ?? '',
      tareaModificada: data['tareaModificada'] ?? data['tarea_modificada'] ?? '',
      proyectoId: data['proyectoId'] ?? data['proyecto_id'] ?? '',
      proyectoNombre: data['proyectoNombre'] ?? data['proyecto_nombre'] ?? '',
      fecha: data['fecha'] != null
          ? (data['fecha'] as Timestamp).toDate()
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'usuarioId': usuarioId,
      'usuario_id': usuarioId, // Doble nomenclatura
      'usuarioNombre': usuarioNombre,
      'avatar': avatar,
      'descripcion': descripcion,
      'tareaModificada': tareaModificada,
      'tarea_modificada': tareaModificada, // Doble nomenclatura
      'proyectoId': proyectoId,
      'proyecto_id': proyectoId, // Doble nomenclatura
      'proyectoNombre': proyectoNombre,
      'proyecto_nombre': proyectoNombre, // Doble nomenclatura
      'fecha': fecha != null ? Timestamp.fromDate(fecha!) : FieldValue.serverTimestamp(),
    };
  }

  ActivityModel copyWith({
    String? id,
    String? usuarioId,
    String? usuarioNombre,
    String? avatar,
    String? descripcion,
    String? tareaModificada,
    String? proyectoId,
    String? proyectoNombre,
    DateTime? fecha,
  }) {
    return ActivityModel(
      id: id ?? this.id,
      usuarioId: usuarioId ?? this.usuarioId,
      usuarioNombre: usuarioNombre ?? this.usuarioNombre,
      avatar: avatar ?? this.avatar,
      descripcion: descripcion ?? this.descripcion,
      tareaModificada: tareaModificada ?? this.tareaModificada,
      proyectoId: proyectoId ?? this.proyectoId,
      proyectoNombre: proyectoNombre ?? this.proyectoNombre,
      fecha: fecha ?? this.fecha,
    );
  }
}
