import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/project_model.dart';

class FirebaseProjectsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Obtener todos los proyectos (filtrados según rol y usuario)
  Future<List<ProjectModel>> getAll(String userId, String userRol) async {
    try {
      Query query = _firestore.collection('proyectos');

      // Filtrar según el rol del usuario
      if (userRol == 'cliente') {
        // Clientes solo ven sus propios proyectos
        query = query.where('creadorId', isEqualTo: userId);
      } else if (userRol == 'team') {
        // Miembros del equipo ven proyectos donde están asignados
        query = query.where('equipo', arrayContains: {'userId': userId});
      }
      // Admin ve todos los proyectos (sin filtro adicional)

      final querySnapshot = await query.get();

      return querySnapshot.docs
          .map((doc) => ProjectModel.fromFirestore(doc))
          .toList();
    } catch (error) {
      print('Error obteniendo proyectos: $error');
      return [];
    }
  }

  // Obtener proyecto por ID
  Future<ProjectModel?> getById(String proyectoId) async {
    try {
      final doc =
          await _firestore.collection('proyectos').doc(proyectoId).get();

      if (doc.exists) {
        return ProjectModel.fromFirestore(doc);
      }
      return null;
    } catch (error) {
      print('Error obteniendo proyecto: $error');
      return null;
    }
  }

  // Crear nuevo proyecto
  Future<Map<String, dynamic>> create(Map<String, dynamic> proyectoData) async {
    try {
      final docRef = await _firestore.collection('proyectos').add(proyectoData);

      return {
        'success': true,
        'id': docRef.id,
        'message': 'Proyecto creado exitosamente',
      };
    } catch (error) {
      print('Error creando proyecto: $error');
      return {
        'success': false,
        'message': 'Error al crear proyecto',
      };
    }
  }

  // Actualizar proyecto
  Future<Map<String, dynamic>> update(
      String proyectoId, Map<String, dynamic> updates) async {
    try {
      await _firestore.collection('proyectos').doc(proyectoId).update(updates);

      return {
        'success': true,
        'message': 'Proyecto actualizado exitosamente',
      };
    } catch (error) {
      print('Error actualizando proyecto: $error');
      return {
        'success': false,
        'message': 'Error al actualizar proyecto',
      };
    }
  }

  // Eliminar proyecto
  Future<Map<String, dynamic>> delete(String proyectoId) async {
    try {
      // Eliminar hitos primero
      final milestonesSnapshot = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .get();

      for (var doc in milestonesSnapshot.docs) {
        await doc.reference.delete();
      }

      // Eliminar documentación
      final docsSnapshot = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('documentacion')
          .get();

      for (var doc in docsSnapshot.docs) {
        await doc.reference.delete();
      }

      // Eliminar proyecto
      await _firestore.collection('proyectos').doc(proyectoId).delete();

      return {
        'success': true,
        'message': 'Proyecto eliminado exitosamente',
      };
    } catch (error) {
      print('Error eliminando proyecto: $error');
      return {
        'success': false,
        'message': 'Error al eliminar proyecto',
      };
    }
  }

  // Stream de proyectos (para actualizaciones en tiempo real)
  Stream<List<ProjectModel>> streamProjects(String userId, String userRol) {
    Query query = _firestore.collection('proyectos');

    if (userRol == 'cliente') {
      query = query.where('creadorId', isEqualTo: userId);
    } else if (userRol == 'team') {
      // Para team, necesitamos una consulta diferente
      // Firebase no soporta array-contains con objetos complejos directamente
      // Alternativa: cargar todos y filtrar en cliente
      query = query;
    }

    return query.snapshots().map((snapshot) {
      return snapshot.docs
          .map((doc) => ProjectModel.fromFirestore(doc))
          .where((project) {
        if (userRol == 'team') {
          // Filtrar proyectos donde el usuario está en el equipo
          return project.equipo.any((member) => member.userId == userId);
        }
        return true;
      }).toList();
    });
  }

  // Calcular progreso del proyecto basado en hitos
  Future<double> calculateProgress(String proyectoId) async {
    try {
      final milestonesSnapshot = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .get();

      if (milestonesSnapshot.docs.isEmpty) return 0;

      double totalProgress = 0;
      for (var doc in milestonesSnapshot.docs) {
        final data = doc.data();
        totalProgress += (data['progreso'] ?? 0).toDouble();
      }

      return totalProgress / milestonesSnapshot.docs.length;
    } catch (error) {
      print('Error calculando progreso: $error');
      return 0;
    }
  }
}
