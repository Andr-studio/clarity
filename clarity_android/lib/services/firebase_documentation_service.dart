import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';
import '../models/documentation_model.dart';

class FirebaseDocumentationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Obtener toda la documentación de un proyecto
  Future<List<DocumentationModel>> getAll(String proyectoId) async {
    try {
      final querySnapshot = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('documentacion')
          .orderBy('fechaCreacion', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => DocumentationModel.fromFirestore(doc))
          .toList();
    } catch (error) {
      print('Error obteniendo documentación: $error');
      return [];
    }
  }

  // Obtener documento por ID
  Future<DocumentationModel?> getById(
      String proyectoId, String documentoId) async {
    try {
      final doc = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('documentacion')
          .doc(documentoId)
          .get();

      if (doc.exists) {
        return DocumentationModel.fromFirestore(doc);
      }
      return null;
    } catch (error) {
      print('Error obteniendo documento: $error');
      return null;
    }
  }

  // Crear/subir nuevo documento
  Future<Map<String, dynamic>> create(
      String proyectoId, Map<String, dynamic> documentoData, File file) async {
    try {
      // Subir archivo a Storage
      final fileName =
          '${DateTime.now().millisecondsSinceEpoch}_${documentoData['archivoNombre']}';
      final storagePath = 'proyectos/$proyectoId/documentacion/$fileName';
      final ref = _storage.ref().child(storagePath);

      await ref.putFile(file);
      final downloadUrl = await ref.getDownloadURL();

      // Guardar referencia en Firestore
      final docData = {
        'titulo': documentoData['titulo'],
        'descripcion': documentoData['descripcion'],
        'archivoUrl': downloadUrl,
        'archivoPath': storagePath,
        'archivoNombre': documentoData['archivoNombre'],
        'archivoSize': documentoData['archivoSize'],
        'archivoTipo': documentoData['archivoTipo'],
        'proyectoId': proyectoId,
        'fechaCreacion': FieldValue.serverTimestamp(),
        'fechaActualizacion': FieldValue.serverTimestamp(),
      };

      final docRef = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('documentacion')
          .add(docData);

      return {
        'success': true,
        'id': docRef.id,
        'url': downloadUrl,
        'message': 'Documento subido exitosamente',
      };
    } catch (error) {
      print('Error subiendo documento: $error');
      return {
        'success': false,
        'message': 'Error al subir documento',
      };
    }
  }

  // Actualizar documento
  Future<Map<String, dynamic>> update(String proyectoId, String documentoId,
      Map<String, dynamic> updates, File? newFile) async {
    try {
      Map<String, dynamic> updateData = {
        ...updates,
        'fechaActualizacion': FieldValue.serverTimestamp(),
      };

      // Si hay un nuevo archivo
      if (newFile != null) {
        // Obtener y eliminar archivo antiguo
        final oldDoc = await _firestore
            .collection('proyectos')
            .doc(proyectoId)
            .collection('documentacion')
            .doc(documentoId)
            .get();

        if (oldDoc.exists) {
          final oldData = oldDoc.data()!;
          if (oldData['archivoPath'] != null) {
            try {
              await _storage.ref(oldData['archivoPath']).delete();
            } catch (e) {
              print('Error eliminando archivo antiguo: $e');
            }
          }
        }

        // Subir nuevo archivo
        final fileName =
            '${DateTime.now().millisecondsSinceEpoch}_${updates['archivoNombre'] ?? 'documento'}';
        final storagePath = 'proyectos/$proyectoId/documentacion/$fileName';
        final ref = _storage.ref().child(storagePath);

        await ref.putFile(newFile);
        final downloadUrl = await ref.getDownloadURL();

        updateData['archivoUrl'] = downloadUrl;
        updateData['archivoPath'] = storagePath;
      }

      await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('documentacion')
          .doc(documentoId)
          .update(updateData);

      return {
        'success': true,
        'message': 'Documento actualizado exitosamente',
      };
    } catch (error) {
      print('Error actualizando documento: $error');
      return {
        'success': false,
        'message': 'Error al actualizar documento',
      };
    }
  }

  // Eliminar documento
  Future<Map<String, dynamic>> delete(
      String proyectoId, String documentoId) async {
    try {
      // Obtener datos del documento
      final doc = await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('documentacion')
          .doc(documentoId)
          .get();

      if (doc.exists) {
        final data = doc.data()!;
        // Eliminar archivo de Storage
        if (data['archivoPath'] != null) {
          try {
            await _storage.ref(data['archivoPath']).delete();
          } catch (e) {
            print('Error eliminando archivo: $e');
          }
        }
      }

      // Eliminar documento de Firestore
      await _firestore
          .collection('proyectos')
          .doc(proyectoId)
          .collection('documentacion')
          .doc(documentoId)
          .delete();

      return {
        'success': true,
        'message': 'Documento eliminado exitosamente',
      };
    } catch (error) {
      print('Error eliminando documento: $error');
      return {
        'success': false,
        'message': 'Error al eliminar documento',
      };
    }
  }

  // Stream de documentación
  Stream<List<DocumentationModel>> streamDocumentation(String proyectoId) {
    return _firestore
        .collection('proyectos')
        .doc(proyectoId)
        .collection('documentacion')
        .orderBy('fechaCreacion', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => DocumentationModel.fromFirestore(doc))
          .toList();
    });
  }
}
