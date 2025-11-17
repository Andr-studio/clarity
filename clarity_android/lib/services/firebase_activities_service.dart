import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/activity_model.dart';

class FirebaseActivitiesService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Obtener todas las actividades (con filtros opcionales)
  Future<List<ActivityModel>> getAll({
    String? usuarioId,
    String? proyectoId,
    int? limit,
  }) async {
    try {
      Query query = _firestore.collection('actividades');

      if (usuarioId != null) {
        query = query.where('usuarioId', isEqualTo: usuarioId);
      }
      if (proyectoId != null) {
        query = query.where('proyectoId', isEqualTo: proyectoId);
      }

      query = query.orderBy('fecha', descending: true);

      if (limit != null) {
        query = query.limit(limit);
      }

      final querySnapshot = await query.get();

      return querySnapshot.docs
          .map((doc) => ActivityModel.fromFirestore(doc))
          .toList();
    } catch (error) {
      print('Error obteniendo actividades: $error');
      return [];
    }
  }

  // Obtener actividades de un usuario
  Future<List<ActivityModel>> getByUser(String userId,
      {int limitCount = 20}) async {
    return getAll(usuarioId: userId, limit: limitCount);
  }

  // Obtener actividades de un proyecto
  Future<List<ActivityModel>> getByProject(String projectId,
      {int limitCount = 20}) async {
    return getAll(proyectoId: projectId, limit: limitCount);
  }

  // Crear nueva actividad
  Future<Map<String, dynamic>> create(
      Map<String, dynamic> activityData) async {
    try {
      // Agregar doble nomenclatura
      final data = {
        'usuarioId': activityData['usuarioId'],
        'usuario_id': activityData['usuarioId'],
        'usuarioNombre': activityData['usuarioNombre'],
        'avatar': activityData['avatar'],
        'descripcion': activityData['descripcion'],
        'tareaModificada': activityData['tareaModificada'],
        'tarea_modificada': activityData['tareaModificada'],
        'proyectoId': activityData['proyectoId'],
        'proyecto_id': activityData['proyectoId'],
        'proyectoNombre': activityData['proyectoNombre'],
        'proyecto_nombre': activityData['proyectoNombre'],
        'fecha': FieldValue.serverTimestamp(),
      };

      final docRef = await _firestore.collection('actividades').add(data);

      return {
        'success': true,
        'id': docRef.id,
      };
    } catch (error) {
      print('Error creando actividad: $error');
      return {
        'success': false,
        'message': 'Error al crear actividad',
      };
    }
  }

  // Stream de actividades
  Stream<List<ActivityModel>> streamActivities({
    String? usuarioId,
    String? proyectoId,
    int? limit,
  }) {
    Query query = _firestore.collection('actividades');

    if (usuarioId != null) {
      query = query.where('usuarioId', isEqualTo: usuarioId);
    }
    if (proyectoId != null) {
      query = query.where('proyectoId', isEqualTo: proyectoId);
    }

    query = query.orderBy('fecha', descending: true);

    if (limit != null) {
      query = query.limit(limit);
    }

    return query.snapshots().map((snapshot) {
      return snapshot.docs
          .map((doc) => ActivityModel.fromFirestore(doc))
          .toList();
    });
  }

  // Registrar actividad de manera conveniente
  Future<void> logActivity({
    required String usuarioId,
    required String usuarioNombre,
    required String avatar,
    required String descripcion,
    required String tareaModificada,
    required String proyectoId,
    required String proyectoNombre,
  }) async {
    await create({
      'usuarioId': usuarioId,
      'usuarioNombre': usuarioNombre,
      'avatar': avatar,
      'descripcion': descripcion,
      'tareaModificada': tareaModificada,
      'proyectoId': proyectoId,
      'proyectoNombre': proyectoNombre,
    });
  }
}
