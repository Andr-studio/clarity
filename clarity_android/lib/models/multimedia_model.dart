import 'package:cloud_firestore/cloud_firestore.dart';

class MultimediaModel {
  final String id;
  final String archivoUrl;
  final String archivoPath;
  final String archivoNombre;
  final int archivoSize;
  final String archivoTipo; // 'image/' o 'video/'
  final String descripcion;
  final String usuarioId;
  final String usuarioNombre;
  final DateTime? fechaCreacion;

  MultimediaModel({
    required this.id,
    required this.archivoUrl,
    required this.archivoPath,
    required this.archivoNombre,
    required this.archivoSize,
    required this.archivoTipo,
    required this.descripcion,
    required this.usuarioId,
    required this.usuarioNombre,
    this.fechaCreacion,
  });

  factory MultimediaModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return MultimediaModel.fromMap(data, doc.id);
  }

  factory MultimediaModel.fromMap(Map<String, dynamic> data, String id) {
    return MultimediaModel(
      id: id,
      archivoUrl: data['archivoUrl'] ?? '',
      archivoPath: data['archivoPath'] ?? '',
      archivoNombre: data['archivoNombre'] ?? '',
      archivoSize: data['archivoSize'] ?? 0,
      archivoTipo: data['archivoTipo'] ?? '',
      descripcion: data['descripcion'] ?? '',
      usuarioId: data['usuarioId'] ?? '',
      usuarioNombre: data['usuarioNombre'] ?? '',
      fechaCreacion: data['fechaCreacion'] != null
          ? (data['fechaCreacion'] as Timestamp).toDate()
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'archivoUrl': archivoUrl,
      'archivoPath': archivoPath,
      'archivoNombre': archivoNombre,
      'archivoSize': archivoSize,
      'archivoTipo': archivoTipo,
      'descripcion': descripcion,
      'usuarioId': usuarioId,
      'usuarioNombre': usuarioNombre,
      'fechaCreacion': fechaCreacion != null
          ? Timestamp.fromDate(fechaCreacion!)
          : FieldValue.serverTimestamp(),
    };
  }

  bool get esImagen => archivoTipo.startsWith('image/');
  bool get esVideo => archivoTipo.startsWith('video/');

  MultimediaModel copyWith({
    String? id,
    String? archivoUrl,
    String? archivoPath,
    String? archivoNombre,
    int? archivoSize,
    String? archivoTipo,
    String? descripcion,
    String? usuarioId,
    String? usuarioNombre,
    DateTime? fechaCreacion,
  }) {
    return MultimediaModel(
      id: id ?? this.id,
      archivoUrl: archivoUrl ?? this.archivoUrl,
      archivoPath: archivoPath ?? this.archivoPath,
      archivoNombre: archivoNombre ?? this.archivoNombre,
      archivoSize: archivoSize ?? this.archivoSize,
      archivoTipo: archivoTipo ?? this.archivoTipo,
      descripcion: descripcion ?? this.descripcion,
      usuarioId: usuarioId ?? this.usuarioId,
      usuarioNombre: usuarioNombre ?? this.usuarioNombre,
      fechaCreacion: fechaCreacion ?? this.fechaCreacion,
    );
  }
}
