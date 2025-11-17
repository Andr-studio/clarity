import 'package:cloud_firestore/cloud_firestore.dart';

class MeetingModel {
  final String id;
  final String adminId;
  final String adminNombre;
  final String adminCorreo;
  final String clienteId;
  final String clienteNombre;
  final String clienteCorreo;
  final String? proyectoId;
  final String? proyectoNombre;
  final String titulo;
  final String descripcion;
  final DateTime? fechaSolicitada;
  final String estado; // 'pendiente', 'aceptada', 'rechazada'
  final String? observacion;
  final DateTime? fechaAlternativa;
  final DateTime? fechaCreacion;
  final DateTime? fechaActualizacion;

  MeetingModel({
    required this.id,
    required this.adminId,
    required this.adminNombre,
    required this.adminCorreo,
    required this.clienteId,
    required this.clienteNombre,
    required this.clienteCorreo,
    this.proyectoId,
    this.proyectoNombre,
    required this.titulo,
    required this.descripcion,
    this.fechaSolicitada,
    required this.estado,
    this.observacion,
    this.fechaAlternativa,
    this.fechaCreacion,
    this.fechaActualizacion,
  });

  factory MeetingModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return MeetingModel.fromMap(data, doc.id);
  }

  factory MeetingModel.fromMap(Map<String, dynamic> data, String id) {
    return MeetingModel(
      id: id,
      adminId: data['adminId'] ?? '',
      adminNombre: data['adminNombre'] ?? '',
      adminCorreo: data['adminCorreo'] ?? '',
      clienteId: data['clienteId'] ?? '',
      clienteNombre: data['clienteNombre'] ?? '',
      clienteCorreo: data['clienteCorreo'] ?? '',
      proyectoId: data['proyectoId'],
      proyectoNombre: data['proyectoNombre'],
      titulo: data['titulo'] ?? '',
      descripcion: data['descripcion'] ?? '',
      fechaSolicitada: data['fechaSolicitada'] != null
          ? (data['fechaSolicitada'] as Timestamp).toDate()
          : null,
      estado: data['estado'] ?? 'pendiente',
      observacion: data['observacion'],
      fechaAlternativa: data['fechaAlternativa'] != null
          ? (data['fechaAlternativa'] as Timestamp).toDate()
          : null,
      fechaCreacion: data['fechaCreacion'] != null
          ? (data['fechaCreacion'] as Timestamp).toDate()
          : null,
      fechaActualizacion: data['fechaActualizacion'] != null
          ? (data['fechaActualizacion'] as Timestamp).toDate()
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'adminId': adminId,
      'adminNombre': adminNombre,
      'adminCorreo': adminCorreo,
      'clienteId': clienteId,
      'clienteNombre': clienteNombre,
      'clienteCorreo': clienteCorreo,
      'proyectoId': proyectoId,
      'proyectoNombre': proyectoNombre,
      'titulo': titulo,
      'descripcion': descripcion,
      'fechaSolicitada': fechaSolicitada != null
          ? Timestamp.fromDate(fechaSolicitada!)
          : null,
      'estado': estado,
      'observacion': observacion,
      'fechaAlternativa': fechaAlternativa != null
          ? Timestamp.fromDate(fechaAlternativa!)
          : null,
      'fechaCreacion': fechaCreacion != null
          ? Timestamp.fromDate(fechaCreacion!)
          : FieldValue.serverTimestamp(),
      'fechaActualizacion': FieldValue.serverTimestamp(),
    };
  }

  MeetingModel copyWith({
    String? id,
    String? adminId,
    String? adminNombre,
    String? adminCorreo,
    String? clienteId,
    String? clienteNombre,
    String? clienteCorreo,
    String? proyectoId,
    String? proyectoNombre,
    String? titulo,
    String? descripcion,
    DateTime? fechaSolicitada,
    String? estado,
    String? observacion,
    DateTime? fechaAlternativa,
    DateTime? fechaCreacion,
    DateTime? fechaActualizacion,
  }) {
    return MeetingModel(
      id: id ?? this.id,
      adminId: adminId ?? this.adminId,
      adminNombre: adminNombre ?? this.adminNombre,
      adminCorreo: adminCorreo ?? this.adminCorreo,
      clienteId: clienteId ?? this.clienteId,
      clienteNombre: clienteNombre ?? this.clienteNombre,
      clienteCorreo: clienteCorreo ?? this.clienteCorreo,
      proyectoId: proyectoId ?? this.proyectoId,
      proyectoNombre: proyectoNombre ?? this.proyectoNombre,
      titulo: titulo ?? this.titulo,
      descripcion: descripcion ?? this.descripcion,
      fechaSolicitada: fechaSolicitada ?? this.fechaSolicitada,
      estado: estado ?? this.estado,
      observacion: observacion ?? this.observacion,
      fechaAlternativa: fechaAlternativa ?? this.fechaAlternativa,
      fechaCreacion: fechaCreacion ?? this.fechaCreacion,
      fechaActualizacion: fechaActualizacion ?? this.fechaActualizacion,
    );
  }
}
