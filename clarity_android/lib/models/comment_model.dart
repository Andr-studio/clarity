import 'package:cloud_firestore/cloud_firestore.dart';

class CommentModel {
  final String id;
  final String usuarioId;
  final String usuarioNombre;
  final String avatar;
  final String comentario;
  final String? parentId; // Para respuestas anidadas
  final bool editado;
  final DateTime? fecha;
  final List<CommentModel> respuestas; // Comentarios hijos

  CommentModel({
    required this.id,
    required this.usuarioId,
    required this.usuarioNombre,
    required this.avatar,
    required this.comentario,
    this.parentId,
    this.editado = false,
    this.fecha,
    this.respuestas = const [],
  });

  factory CommentModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return CommentModel.fromMap(data, doc.id);
  }

  factory CommentModel.fromMap(Map<String, dynamic> data, String id) {
    return CommentModel(
      id: id,
      usuarioId: data['usuarioId'] ?? data['usuario_id'] ?? '',
      usuarioNombre: data['usuarioNombre'] ?? '',
      avatar: data['avatar'] ?? '',
      comentario: data['comentario'] ?? '',
      parentId: data['parent_id'],
      editado: data['editado'] ?? false,
      fecha: data['fecha'] != null
          ? (data['fecha'] as Timestamp).toDate()
          : null,
      respuestas: [], // Se cargan por separado
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'usuarioId': usuarioId,
      'usuario_id': usuarioId, // Doble nomenclatura
      'usuarioNombre': usuarioNombre,
      'avatar': avatar,
      'comentario': comentario,
      'parent_id': parentId,
      'editado': editado,
      'fecha': fecha != null ? Timestamp.fromDate(fecha!) : FieldValue.serverTimestamp(),
    };
  }

  CommentModel copyWith({
    String? id,
    String? usuarioId,
    String? usuarioNombre,
    String? avatar,
    String? comentario,
    String? parentId,
    bool? editado,
    DateTime? fecha,
    List<CommentModel>? respuestas,
  }) {
    return CommentModel(
      id: id ?? this.id,
      usuarioId: usuarioId ?? this.usuarioId,
      usuarioNombre: usuarioNombre ?? this.usuarioNombre,
      avatar: avatar ?? this.avatar,
      comentario: comentario ?? this.comentario,
      parentId: parentId ?? this.parentId,
      editado: editado ?? this.editado,
      fecha: fecha ?? this.fecha,
      respuestas: respuestas ?? this.respuestas,
    );
  }
}
