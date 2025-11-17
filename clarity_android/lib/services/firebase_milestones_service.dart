import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';
import '../models/milestone_model.dart';
import '../models/multimedia_model.dart';

class FirebaseMilestonesService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Obtener todos los hitos de un proyecto
  Future<List<MilestoneModel>> getAll(String proyectoId) async {
    try {
      final querySnapshot = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .orderBy('fechaCreacion', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => MilestoneModel.fromFirestore(doc))
          .toList();
    } catch (error) {
      print('Error obteniendo hitos: $error');
      return [];
    }
  }

  // Stream de hitos (tiempo real)
  Stream<List<MilestoneModel>> streamMilestones(String proyectoId) {
    return _firestore
        .collection('proyectos')
        .doc(proyectoId)
        .collection('milestones')
        .orderBy('fechaCreacion', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => MilestoneModel.fromFirestore(doc))
          .toList();
    });
  }

  // Crear nuevo hito
  Future<Map<String, dynamic>> create(
      String proyectoId, Map<String, dynamic> hitoData) async {
    try {
      final docRef = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .add(hitoData);

      return {
        'success': true,
        'id': docRef.id,
        'message': 'Hito creado exitosamente',
      };
    } catch (error) {
      print('Error creando hito: $error');
      return {
        'success': false,
        'message': 'Error al crear hito',
      };
    }
  }

  // Actualizar hito
  Future<Map<String, dynamic>> update(
      String proyectoId, String hitoId, Map<String, dynamic> updates) async {
    try {
      await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .doc(hitoId)
          .update(updates);

      return {
        'success': true,
        'message': 'Hito actualizado exitosamente',
      };
    } catch (error) {
      print('Error actualizando hito: $error');
      return {
        'success': false,
        'message': 'Error al actualizar hito',
      };
    }
  }

  // Eliminar hito
  Future<Map<String, dynamic>> delete(String proyectoId, String hitoId) async {
    try {
      // Eliminar comentarios del hito
      final commentsSnapshot = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .doc(hitoId)
          .collection('comentarios')
          .get();

      for (var doc in commentsSnapshot.docs) {
        await doc.reference.delete();
      }

      // Eliminar multimedia del hito
      final multimediaSnapshot = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .doc(hitoId)
          .collection('multimedia')
          .get();

      for (var doc in multimediaSnapshot.docs) {
        // Eliminar archivo de Storage
        final data = doc.data();
        if (data['archivoPath'] != null) {
          try {
            await _storage.ref(data['archivoPath']).delete();
          } catch (e) {
            print('Error eliminando archivo: $e');
          }
        }
        await doc.reference.delete();
      }

      // Eliminar hito
      await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .doc(hitoId)
          .delete();

      return {
        'success': true,
        'message': 'Hito eliminado exitosamente',
      };
    } catch (error) {
      print('Error eliminando hito: $error');
      return {
        'success': false,
        'message': 'Error al eliminar hito',
      };
    }
  }

  // Agregar multimedia a un hito
  Future<Map<String, dynamic>> addMultimedia({
    required String proyectoId,
    required String hitoId,
    required File file,
    required Map<String, dynamic> metadata,
  }) async {
    try {
      // Subir archivo a Storage
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_${metadata['archivoNombre']}';
      final storagePath = 'proyectos/$proyectoId/milestones/$hitoId/$fileName';
      final ref = _storage.ref().child(storagePath);

      await ref.putFile(file);
      final downloadUrl = await ref.getDownloadURL();

      // Guardar referencia en Firestore
      final multimediaData = {
        ...metadata,
        'archivoUrl': downloadUrl,
        'archivoPath': storagePath,
        'fechaCreacion': FieldValue.serverTimestamp(),
      };

      final docRef = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .doc(hitoId)
          .collection('multimedia')
          .add(multimediaData);

      return {
        'success': true,
        'id': docRef.id,
        'url': downloadUrl,
        'message': 'Archivo subido exitosamente',
      };
    } catch (error) {
      print('Error subiendo multimedia: $error');
      return {
        'success': false,
        'message': 'Error al subir archivo',
      };
    }
  }

  // Obtener multimedia de un hito
  Future<List<MultimediaModel>> getMultimedia(
      String proyectoId, String hitoId) async {
    try {
      final querySnapshot = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .doc(hitoId)
          .collection('multimedia')
          .orderBy('fechaCreacion', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => MultimediaModel.fromFirestore(doc))
          .toList();
    } catch (error) {
      print('Error obteniendo multimedia: $error');
      return [];
    }
  }

  // Eliminar multimedia
  Future<Map<String, dynamic>> deleteMultimedia(
      String proyectoId, String hitoId, String multimediaId) async {
    try {
      // Obtener datos del archivo
      final doc = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .doc(hitoId)
          .collection('multimedia')
          .doc(multimediaId)
          .get();

      if (doc.exists) {
        final data = doc.data()!;
        // Eliminar de Storage
        if (data['archivoPath'] != null) {
          await _storage.ref(data['archivoPath']).delete();
        }
      }

      // Eliminar documento
      await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .doc(hitoId)
          .collection('multimedia')
          .doc(multimediaId)
          .delete();

      return {
        'success': true,
        'message': 'Archivo eliminado exitosamente',
      };
    } catch (error) {
      print('Error eliminando multimedia: $error');
      return {
        'success': false,
        'message': 'Error al eliminar archivo',
      };
    }
  }

  // Actualizar progreso de hito (y estado automático)
  Future<Map<String, dynamic>> updateProgress(
      String proyectoId, String hitoId, double progreso) async {
    try {
      String nuevoEstado = 'en_progreso';
      if (progreso == 0) {
        nuevoEstado = 'pendiente';
      } else if (progreso == 100) {
        nuevoEstado = 'completado';
      }

      await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('milestones')
          .doc(hitoId)
          .update({
        'progreso': progreso,
        'estado': nuevoEstado,
      });

      return {
        'success': true,
        'message': 'Progreso actualizado',
      };
    } catch (error) {
      print('Error actualizando progreso: $error');
      return {
        'success': false,
        'message': 'Error al actualizar progreso',
      };
    }
  }
}
