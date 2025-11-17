import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';

class FirebaseStorageService {
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Subir archivo
  Future<Map<String, dynamic>> uploadFile(File file, String path) async {
    try {
      final ref = _storage.ref().child(path);
      final uploadTask = await ref.putFile(file);
      final downloadUrl = await uploadTask.ref.getDownloadURL();

      return {
        'success': true,
        'url': downloadUrl,
        'path': path,
      };
    } catch (error) {
      print('Error subiendo archivo: $error');
      return {
        'success': false,
        'message': 'Error al subir archivo',
      };
    }
  }

  // Obtener URL de archivo
  Future<String?> getFileUrl(String path) async {
    try {
      final ref = _storage.ref().child(path);
      return await ref.getDownloadURL();
    } catch (error) {
      print('Error obteniendo URL: $error');
      return null;
    }
  }

  // Eliminar archivo
  Future<Map<String, dynamic>> deleteFile(String path) async {
    try {
      final ref = _storage.ref().child(path);
      await ref.delete();

      return {
        'success': true,
        'message': 'Archivo eliminado',
      };
    } catch (error) {
      print('Error eliminando archivo: $error');
      return {
        'success': false,
        'message': 'Error al eliminar archivo',
      };
    }
  }

  // Listar archivos en una ruta
  Future<List<Reference>> listFiles(String path) async {
    try {
      final ref = _storage.ref().child(path);
      final result = await ref.listAll();
      return result.items;
    } catch (error) {
      print('Error listando archivos: $error');
      return [];
    }
  }

  // Subir múltiples archivos
  Future<List<Map<String, dynamic>>> uploadMultipleFiles(
      List<File> files, String basePath) async {
    List<Map<String, dynamic>> results = [];

    for (var file in files) {
      final fileName = file.path.split('/').last;
      final path = '$basePath/$fileName';
      final result = await uploadFile(file, path);
      results.add(result);
    }

    return results;
  }

  // Obtener metadata de archivo
  Future<FullMetadata?> getMetadata(String path) async {
    try {
      final ref = _storage.ref().child(path);
      return await ref.getMetadata();
    } catch (error) {
      print('Error obteniendo metadata: $error');
      return null;
    }
  }

  // Actualizar metadata de archivo
  Future<Map<String, dynamic>> updateMetadata(
      String path, Map<String, String> metadata) async {
    try {
      final ref = _storage.ref().child(path);
      final settableMetadata = SettableMetadata(
        customMetadata: metadata,
      );
      await ref.updateMetadata(settableMetadata);

      return {
        'success': true,
        'message': 'Metadata actualizada',
      };
    } catch (error) {
      print('Error actualizando metadata: $error');
      return {
        'success': false,
        'message': 'Error al actualizar metadata',
      };
    }
  }
}
