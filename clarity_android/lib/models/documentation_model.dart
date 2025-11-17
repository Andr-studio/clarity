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
    );
  }
}
