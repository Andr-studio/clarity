// src/services/firebaseAuth.js
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase';

class FirebaseAuthService {
  // Login de usuario
  async login(email, password) {
    try {
      // Autenticar con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Obtener datos adicionales del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('Datos de usuario no encontrados');
      }
      
      const userData = userDoc.data();
      
      // Formato compatible con tu app actual
      const userInfo = {
        id: user.uid,
        correo: user.email,
        nombre: userData.nombre,
        apellido: userData.apellido,
        rol: userData.rol,
        avatar: userData.avatar,
        fecha_creacion: userData.fechaCreacion
      };
      
      // Guardar en localStorage para compatibilidad con tu código actual
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      return {
        success: true,
        user: userInfo
      };
      
    } catch (error) {
      console.error('Error en login:', error);
      
      // Manejar errores específicos de Firebase
      let errorMessage = 'Error al iniciar sesión';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este correo';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo no es válido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
          break;
        default:
          errorMessage = error.message || 'Error al iniciar sesión';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Registro de nuevo usuario
  async register(userData) {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.correo,
        userData.password
      );
      
      const user = userCredential.user;
      
      // Actualizar el perfil con el nombre completo
      await updateProfile(user, {
        displayName: `${userData.nombre} ${userData.apellido}`
      });
      
      // Generar avatar con iniciales
      const avatar = `${userData.nombre[0]}${userData.apellido[0]}`.toUpperCase();
      
      // Guardar datos adicionales en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nombre: userData.nombre,
        apellido: userData.apellido,
        correo: userData.correo,
        rol: userData.rol || 'cliente',
        avatar: avatar,
        fechaCreacion: serverTimestamp()
      });
      
      return {
        success: true,
        message: 'Usuario registrado exitosamente',
        user_id: user.uid
      };
      
    } catch (error) {
      console.error('Error en registro:', error);
      
      let errorMessage = 'Error al registrar usuario';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'El correo ya está registrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo no es válido';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
          break;
        default:
          errorMessage = error.message || 'Error al registrar usuario';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Cerrar sesión
  async logout() {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      
      return {
        success: true
      };
      
    } catch (error) {
      console.error('Error en logout:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Recuperar contraseña
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      
      return {
        success: true,
        message: 'Se ha enviado un correo para restablecer tu contraseña'
      };
      
    } catch (error) {
      console.error('Error enviando email de recuperación:', error);
      
      let errorMessage = 'Error al enviar correo de recuperación';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este correo';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo no es válido';
          break;
        default:
          errorMessage = error.message || 'Error al enviar correo';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Obtener usuario actual
  getCurrentUser() {
    const user = auth.currentUser;
    
    if (!user) {
      // Intentar obtener de localStorage como fallback
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    }
    
    return user;
  }

  // Verificar si hay sesión activa
  isAuthenticated() {
    return auth.currentUser !== null || localStorage.getItem('user') !== null;
  }

  // Observer para cambios de autenticación
  onAuthChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario autenticado - obtener datos completos
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userInfo = {
              id: user.uid,
              correo: user.email,
              nombre: userData.nombre,
              apellido: userData.apellido,
              rol: userData.rol,
              avatar: userData.avatar,
              fecha_creacion: userData.fechaCreacion
            };
            
            localStorage.setItem('user', JSON.stringify(userInfo));
            callback(userInfo);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error obteniendo datos de usuario:', error);
          callback(null);
        }
      } else {
        // No hay usuario autenticado
        localStorage.removeItem('user');
        callback(null);
      }
    });
  }

  // Actualizar perfil de usuario
  async updateUserProfile(userId, updates) {
    try {
      const userRef = doc(db, 'usuarios', userId);
      await updateDoc(userRef, updates);
      
      // Actualizar localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return {
        success: true,
        user: updatedUser
      };
      
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Exportar instancia única del servicio
const firebaseAuthAPI = new FirebaseAuthService();

// Mantener compatibilidad con tu API actual
export const authAPI = {
  login: (email, password) => firebaseAuthAPI.login(email, password),
  register: (userData) => firebaseAuthAPI.register(userData),
  logout: () => firebaseAuthAPI.logout(),
  resetPassword: (email) => firebaseAuthAPI.resetPassword(email),
  getCurrentUser: () => firebaseAuthAPI.getCurrentUser(),
  isAuthenticated: () => firebaseAuthAPI.isAuthenticated(),
  onAuthChange: (callback) => firebaseAuthAPI.onAuthChange(callback),
  updateProfile: (userId, updates) => firebaseAuthAPI.updateUserProfile(userId, updates)
};

export default firebaseAuthAPI;