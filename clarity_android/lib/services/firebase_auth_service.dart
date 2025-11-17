import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/user_model.dart';

class FirebaseAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Login de usuario
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      // Autenticar con Firebase Auth
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      final user = userCredential.user;
      if (user == null) {
        return {
          'success': false,
          'message': 'Error al iniciar sesión',
        };
      }

      // Obtener datos adicionales del usuario desde Firestore
      final userDoc = await _firestore.collection('usuarios').doc(user.uid).get();

      if (!userDoc.exists) {
        return {
          'success': false,
          'message': 'Datos de usuario no encontrados',
        };
      }

      final userData = userDoc.data()!;

      // Formato compatible con la app web
      final userInfo = {
        'id': user.uid,
        'correo': user.email,
        'nombre': userData['nombre'],
        'apellido': userData['apellido'],
        'rol': userData['rol'],
        'avatar': userData['avatar'],
        'fecha_creacion': userData['fechaCreacion'] ?? userData['fecha_creacion'],
      };

      // Guardar en SharedPreferences para persistencia
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(userInfo));

      return {
        'success': true,
        'user': userInfo,
      };
    } on FirebaseAuthException catch (e) {
      String errorMessage = 'Error al iniciar sesión';

      switch (e.code) {
        case 'user-not-found':
          errorMessage = 'No existe una cuenta con este correo';
          break;
        case 'wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'invalid-email':
          errorMessage = 'El formato del correo no es válido';
          break;
        case 'user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada';
          break;
        case 'too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
          break;
        default:
          errorMessage = e.message ?? 'Error al iniciar sesión';
      }

      return {
        'success': false,
        'message': errorMessage,
      };
    } catch (error) {
      return {
        'success': false,
        'message': 'Error al iniciar sesión',
      };
    }
  }

  // Registro de nuevo usuario
  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      // Crear usuario en Firebase Auth
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: userData['correo'],
        password: userData['password'],
      );

      final user = userCredential.user;
      if (user == null) {
        return {
          'success': false,
          'message': 'Error al registrar usuario',
        };
      }

      // Actualizar el perfil con el nombre completo
      await user.updateDisplayName('${userData['nombre']} ${userData['apellido']}');

      // Generar avatar con iniciales
      final avatar =
          '${userData['nombre'][0]}${userData['apellido'][0]}'.toUpperCase();

      // Guardar datos adicionales en Firestore (con doble nomenclatura)
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
        'message': 'Usuario registrado exitosamente',
        'user_id': user.uid,
      };
    } on FirebaseAuthException catch (e) {
      String errorMessage = 'Error al registrar usuario';

      switch (e.code) {
        case 'email-already-in-use':
          errorMessage = 'El correo ya está registrado';
          break;
        case 'invalid-email':
          errorMessage = 'El formato del correo no es válido';
          break;
        case 'weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
          break;
        default:
          errorMessage = e.message ?? 'Error al registrar usuario';
      }

      return {
        'success': false,
        'message': errorMessage,
      };
    } catch (error) {
      return {
        'success': false,
        'message': 'Error al registrar usuario',
      };
    }
  }

  // Cerrar sesión
  Future<Map<String, dynamic>> logout() async {
    try {
      await _auth.signOut();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user');

      return {
        'success': true,
      };
    } catch (error) {
      return {
        'success': false,
        'message': 'Error al cerrar sesión',
      };
    }
  }

  // Recuperar contraseña
  Future<Map<String, dynamic>> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);

      return {
        'success': true,
        'message': 'Se ha enviado un correo para restablecer tu contraseña',
      };
    } on FirebaseAuthException catch (e) {
      String errorMessage = 'Error al enviar correo de recuperación';

      switch (e.code) {
        case 'user-not-found':
          errorMessage = 'No existe una cuenta con este correo';
          break;
        case 'invalid-email':
          errorMessage = 'El formato del correo no es válido';
          break;
        default:
          errorMessage = e.message ?? 'Error al enviar correo';
      }

      return {
        'success': false,
        'message': errorMessage,
      };
    } catch (error) {
      return {
        'success': false,
        'message': 'Error al enviar correo de recuperación',
      };
    }
  }

  // Obtener usuario actual
  Future<Map<String, dynamic>?> getCurrentUser() async {
    final user = _auth.currentUser;

    if (user == null) {
      // Intentar obtener de SharedPreferences como fallback
      final prefs = await SharedPreferences.getInstance();
      final storedUser = prefs.getString('user');
      if (storedUser != null) {
        return jsonDecode(storedUser) as Map<String, dynamic>;
      }
      return null;
    }

    // Obtener datos completos de Firestore
    try {
      final userDoc = await _firestore.collection('usuarios').doc(user.uid).get();
      if (userDoc.exists) {
        final userData = userDoc.data()!;
        return {
          'id': user.uid,
          'correo': user.email,
          'nombre': userData['nombre'],
          'apellido': userData['apellido'],
          'rol': userData['rol'],
          'avatar': userData['avatar'],
          'fecha_creacion': userData['fechaCreacion'] ?? userData['fecha_creacion'],
        };
      }
    } catch (error) {
      print('Error obteniendo datos de usuario: $error');
    }

    return null;
  }

  // Verificar si hay sesión activa
  Future<bool> isAuthenticated() async {
    if (_auth.currentUser != null) return true;

    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey('user');
  }

  // Stream para cambios de autenticación
  Stream<Map<String, dynamic>?> get authStateChanges {
    return _auth.authStateChanges().asyncMap((user) async {
      if (user != null) {
        // Usuario autenticado - obtener datos completos
        try {
          final userDoc =
              await _firestore.collection('usuarios').doc(user.uid).get();

          if (userDoc.exists) {
            final userData = userDoc.data()!;
            final userInfo = {
              'id': user.uid,
              'correo': user.email,
              'nombre': userData['nombre'],
              'apellido': userData['apellido'],
              'rol': userData['rol'],
              'avatar': userData['avatar'],
              'fecha_creacion':
                  userData['fechaCreacion'] ?? userData['fecha_creacion'],
            };

            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('user', jsonEncode(userInfo));
            return userInfo;
          }
        } catch (error) {
          print('Error obteniendo datos de usuario: $error');
        }
      } else {
        // No hay usuario autenticado
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('user');
      }
      return null;
    });
  }

  // Actualizar perfil de usuario
  Future<Map<String, dynamic>> updateUserProfile(
      String userId, Map<String, dynamic> updates) async {
    try {
      await _firestore.collection('usuarios').doc(userId).update(updates);

      // Actualizar SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      final storedUser = prefs.getString('user');
      if (storedUser != null) {
        final currentUser = jsonDecode(storedUser) as Map<String, dynamic>;
        final updatedUser = {...currentUser, ...updates};
        await prefs.setString('user', jsonEncode(updatedUser));

        return {
          'success': true,
          'user': updatedUser,
        };
      }

      return {
        'success': true,
      };
    } catch (error) {
      return {
        'success': false,
        'message': 'Error actualizando perfil',
      };
    }
  }

  // Obtener usuario actual como UserModel
  Future<UserModel?> getCurrentUserModel() async {
    final userData = await getCurrentUser();
    if (userData == null) return null;

    try {
      final userDoc = await _firestore
          .collection('usuarios')
          .doc(userData['id'])
          .get();
      if (userDoc.exists) {
        return UserModel.fromFirestore(userDoc);
      }
    } catch (error) {
      print('Error obteniendo UserModel: $error');
    }
    return null;
  }
}
