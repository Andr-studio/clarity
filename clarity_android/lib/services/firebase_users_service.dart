import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_model.dart';

class FirebaseUsersService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Crear usuario (Admin)
  Future<Map<String, dynamic>> crear(Map<String, dynamic> userData) async {
    try {
      // Crear usuario en Auth
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: userData['correo'],
        password: userData['password'],
      );

      final user = userCredential.user!;

      // Generar avatar
      final avatar = '${userData['nombre'][0]}${userData['apellido'][0]}'
          .toUpperCase();

      // Guardar en Firestore (con doble nomenclatura)
      await _firestore.collection('usuarios').doc(user.uid).set({
        'nombre': userData['nombre'],
        'apellido': userData['apellido'],
        'correo': userData['correo'],
        'rol': userData['rol'] ?? 'cliente',
        'avatar': avatar,
        'fechaCreacion': FieldValue.serverTimestamp(),
        'fecha_creacion': FieldValue.serverTimestamp(),
      });

      return {
        'success': true,
        'id': user.uid,
        'message': 'Usuario creado exitosamente',
      };
    } catch (error) {
      print('Error creando usuario: $error');
      return {
        'success': false,
        'message': 'Error al crear usuario',
      };
    }
  }

  // Obtener todos los usuarios
  Future<List<UserModel>> getAll() async {
    try {
      final querySnapshot = await _firestore
          .collection('usuarios')
          .orderBy('fechaCreacion', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => UserModel.fromFirestore(doc))
          .toList();
    } catch (error) {
      print('Error obteniendo usuarios: $error');
      return [];
    }
  }

  // Obtener usuarios del equipo (rol = 'team')
  Future<List<UserModel>> getTeam() async {
    try {
      final querySnapshot = await _firestore
          .collection('usuarios')
          .where('rol', isEqualTo: 'team')
          .orderBy('fechaCreacion', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => UserModel.fromFirestore(doc))
          .toList();
    } catch (error) {
      print('Error obteniendo equipo: $error');
      return [];
    }
  }

  // Obtener usuario por ID
  Future<UserModel?> getById(String userId) async {
    try {
      final doc = await _firestore.collection('usuarios').doc(userId).get();

      if (doc.exists) {
        return UserModel.fromFirestore(doc);
      }
      return null;
    } catch (error) {
      print('Error obteniendo usuario: $error');
      return null;
    }
  }

  // Actualizar usuario
  Future<Map<String, dynamic>> update(
      String userId, Map<String, dynamic> updates) async {
    try {
      await _firestore.collection('usuarios').doc(userId).update(updates);

      return {
        'success': true,
        'message': 'Usuario actualizado',
      };
    } catch (error) {
      print('Error actualizando usuario: $error');
      return {
        'success': false,
        'message': 'Error al actualizar usuario',
      };
    }
  }

  // Eliminar usuario
  Future<Map<String, dynamic>> delete(String userId) async {
    try {
      // Eliminar de Firestore
      await _firestore.collection('usuarios').doc(userId).delete();

      // Nota: Eliminar usuario de Auth requiere que el usuario esté actualmente logueado
      // o usar Firebase Admin SDK (no disponible en cliente)

      return {
        'success': true,
        'message': 'Usuario eliminado',
      };
    } catch (error) {
      print('Error eliminando usuario: $error');
      return {
        'success': false,
        'message': 'Error al eliminar usuario',
      };
    }
  }

  // Obtener usuarios por rol
  Future<List<UserModel>> getByRol(String rol) async {
    try {
      final querySnapshot = await _firestore
          .collection('usuarios')
          .where('rol', isEqualTo: rol)
          .orderBy('fechaCreacion', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => UserModel.fromFirestore(doc))
          .toList();
    } catch (error) {
      print('Error obteniendo usuarios por rol: $error');
      return [];
    }
  }

  // Stream de usuarios
  Stream<List<UserModel>> streamUsers() {
    return _firestore
        .collection('usuarios')
        .orderBy('fechaCreacion', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => UserModel.fromFirestore(doc))
          .toList();
    });
  }
}
