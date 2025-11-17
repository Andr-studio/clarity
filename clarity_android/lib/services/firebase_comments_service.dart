import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/comment_model.dart';

class FirebaseCommentsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Obtener comentarios de un hito (con respuestas anidadas)
  Future<List<CommentModel>> getByHito(
      String projectId, String milestoneId) async {
    try {
      final querySnapshot = await _firestore
          .collection('proyectos')
          .doc(projectId)
          .collection('milestones')
          .doc(milestoneId)
          .collection('comentarios')
          .orderBy('fecha', descending: false)
          .get();

      // Separar comentarios principales y respuestas
      List<CommentModel> allComments = querySnapshot.docs
          .map((doc) => CommentModel.fromFirestore(doc))
          .toList();

      // Construir árbol de comentarios
      Map<String, List<CommentModel>> respuestasPorParent = {};
      List<CommentModel> comentariosPrincipales = [];

      for (var comment in allComments) {
        if (comment.parentId == null) {
          comentariosPrincipales.add(comment);
        } else {
          if (!respuestasPorParent.containsKey(comment.parentId)) {
            respuestasPorParent[comment.parentId!] = [];
          }
          respuestasPorParent[comment.parentId!]!.add(comment);
        }
      }

      // Asignar respuestas a comentarios principales
      return comentariosPrincipales.map((comment) {
        return comment.copyWith(
          respuestas: respuestasPorParent[comment.id] ?? [],
        );
      }).toList();
    } catch (error) {
      print('Error obteniendo comentarios: $error');
      return [];
    }
  }

  // Stream de comentarios (tiempo real)
  Stream<List<CommentModel>> streamComments(
      String projectId, String milestoneId) {
    return _firestore
        .collection('proyectos')
        .doc(projectId)
        .collection('milestones')
        .doc(milestoneId)
        .collection('comentarios')
        .orderBy('fecha', descending: false)
        .snapshots()
        .map((snapshot) {
      List<CommentModel> allComments = snapshot.docs
          .map((doc) => CommentModel.fromFirestore(doc))
          .toList();

      Map<String, List<CommentModel>> respuestasPorParent = {};
      List<CommentModel> comentariosPrincipales = [];

      for (var comment in allComments) {
        if (comment.parentId == null) {
          comentariosPrincipales.add(comment);
        } else {
          if (!respuestasPorParent.containsKey(comment.parentId)) {
            respuestasPorParent[comment.parentId!] = [];
          }
          respuestasPorParent[comment.parentId!]!.add(comment);
        }
      }

      return comentariosPrincipales.map((comment) {
        return comment.copyWith(
          respuestas: respuestasPorParent[comment.id] ?? [],
        );
      }).toList();
    });
  }

  // Crear comentario o respuesta
  Future<Map<String, dynamic>> create(Map<String, dynamic> commentData) async {
    try {
      final docRef = await _firestore
          .collection('proyectos')
          .doc(commentData['projectId'])
          .collection('milestones')
          .doc(commentData['milestoneId'])
          .collection('comentarios')
          .add({
        'usuarioId': commentData['usuarioId'],
        'usuario_id': commentData['usuarioId'], // Doble nomenclatura
        'usuarioNombre': commentData['usuarioNombre'],
        'avatar': commentData['avatar'],
        'comentario': commentData['comentario'],
        'parent_id': commentData['parent_id'],
        'editado': false,
        'fecha': FieldValue.serverTimestamp(),
      });

      return {
        'success': true,
        'id': docRef.id,
        'message': 'Comentario agregado',
      };
    } catch (error) {
      print('Error creando comentario: $error');
      return {
        'success': false,
        'message': 'Error al agregar comentario',
      };
    }
  }

  // Eliminar comentario
  Future<Map<String, dynamic>> delete(
      String projectId, String milestoneId, String commentId) async {
    try {
      // Eliminar el comentario y todas sus respuestas
      final respuestasSnapshot = await _firestore
          .collection('proyectos')
          .doc(projectId)
          .collection('milestones')
          .doc(milestoneId)
          .collection('comentarios')
          .where('parent_id', isEqualTo: commentId)
          .get();

      // Eliminar respuestas
      for (var doc in respuestasSnapshot.docs) {
        await doc.reference.delete();
      }

      // Eliminar comentario principal
      await _firestore
          .collection('proyectos')
          .doc(projectId)
          .collection('milestones')
          .doc(milestoneId)
          .collection('comentarios')
          .doc(commentId)
          .delete();

      return {
        'success': true,
        'message': 'Comentario eliminado',
      };
    } catch (error) {
      print('Error eliminando comentario: $error');
      return {
        'success': false,
        'message': 'Error al eliminar comentario',
      };
    }
  }

  // Contar comentarios de un hito
  Future<int> countComments(String projectId, String milestoneId) async {
    try {
      final querySnapshot = await _firestore
          .collection('proyectos')
          .doc(projectId)
          .collection('milestones')
          .doc(milestoneId)
          .collection('comentarios')
          .get();

      return querySnapshot.docs.length;
    } catch (error) {
      print('Error contando comentarios: $error');
      return 0;
    }
  }
}
