import 'package:cloud_firestore/cloud_firestore.dart';

class DocumentationModel {
  final String id;
  final String titulo;
  final String descripcion;
  final String archivoUrl;
  final String archivoPath;
  final String archivoNombre;
  final int archivoSize;
  final String archivoTipo;
  final String proyectoId;
  final DateTime? fechaCreacion;
  final DateTime? fechaActualizacion;

  // Campos de aprobación/rechazo
  final String estado; // 'pendiente', 'aprobado', 'rechazado'
  final String? motivoRechazo;
  final DateTime? fechaAprobacion;
  final DateTime? fechaRechazo;

  DocumentationModel({
    required this.id,
    required this.titulo,
    required this.descripcion,
    required this.archivoUrl,
    required this.archivoPath,
    required this.archivoNombre,
    required this.archivoSize,
    required this.archivoTipo,
    required this.proyectoId,
    this.fechaCreacion,
    this.fechaActualizacion,
    this.estado = 'pendiente',
    this.motivoRechazo,
    this.fechaAprobacion,
    this.fechaRechazo,
  });

  factory DocumentationModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return DocumentationModel.fromMap(data, doc.id);
  }

  factory DocumentationModel.fromMap(Map<String, dynamic> data, String id) {
    return DocumentationModel(
      id: id,
      titulo: data['titulo'] ?? '',
      descripcion: data['descripcion'] ?? '',
      archivoUrl: data['archivoUrl'] ?? '',
      archivoPath: data['archivoPath'] ?? '',
      archivoNombre: data['archivoNombre'] ?? '',
      archivoSize: data['archivoSize'] ?? 0,
      archivoTipo: data['archivoTipo'] ?? '',
      proyectoId: data['proyectoId'] ?? '',
      fechaCreacion: data['fechaCreacion'] != null
          ? (data['fechaCreacion'] as Timestamp).toDate()
          : null,
      fechaActualizacion: data['fechaActualizacion'] != null
          ? (data['fechaActualizacion'] as Timestamp).toDate()
          : null,
      estado: data['estado'] ?? 'pendiente',
      motivoRechazo: data['motivoRechazo'],
      fechaAprobacion: data['fechaAprobacion'] != null
          ? (data['fechaAprobacion'] as Timestamp).toDate()
          : null,
      fechaRechazo: data['fechaRechazo'] != null
          ? (data['fechaRechazo'] as Timestamp).toDate()
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'titulo': titulo,
      'descripcion': descripcion,
      'archivoUrl': archivoUrl,
      'archivoPath': archivoPath,
      'archivoNombre': archivoNombre,
      'archivoSize': archivoSize,
      'archivoTipo': archivoTipo,
      'proyectoId': proyectoId,
      'fechaCreacion': fechaCreacion != null
          ? Timestamp.fromDate(fechaCreacion!)
          : FieldValue.serverTimestamp(),
      'fechaActualizacion': FieldValue.serverTimestamp(),
      'estado': estado,
      'motivoRechazo': motivoRechazo,
      'fechaAprobacion': fechaAprobacion != null
          ? Timestamp.fromDate(fechaAprobacion!)
          : null,
      'fechaRechazo': fechaRechazo != null
          ? Timestamp.fromDate(fechaRechazo!)
          : null,
    };
  }

  DocumentationModel copyWith({
    String? id,
    String? titulo,
    String? descripcion,
    String? archivoUrl,
    String? archivoPath,
    String? archivoNombre,
    int? archivoSize,
    String? archivoTipo,
    String? proyectoId,
    DateTime? fechaCreacion,
    DateTime? fechaActualizacion,
    String? estado,
    String? motivoRechazo,
    DateTime? fechaAprobacion,
    DateTime? fechaRechazo,
  }) {
    return DocumentationModel(
      id: id ?? this.id,
      titulo: titulo ?? this.titulo,
      descripcion: descripcion ?? this.descripcion,
      archivoUrl: archivoUrl ?? this.archivoUrl,
      archivoPath: archivoPath ?? this.archivoPath,
      archivoNombre: archivoNombre ?? this.archivoNombre,
      archivoSize: archivoSize ?? this.archivoSize,
      archivoTipo: archivoTipo ?? this.archivoTipo,
      proyectoId: proyectoId ?? this.proyectoId,
      fechaCreacion: fechaCreacion ?? this.fechaCreacion,
      fechaActualizacion: fechaActualizacion ?? this.fechaActualizacion,
      estado: estado ?? this.estado,
      motivoRechazo: motivoRechazo ?? this.motivoRechazo,
      fechaAprobacion: fechaAprobacion ?? this.fechaAprobacion,
      fechaRechazo: fechaRechazo ?? this.fechaRechazo,
    );
  }
}
