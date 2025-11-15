// =====================================================
// src/services/firebaseUsers.js
// =====================================================
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  query,
  where,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';

const firebaseUsersAPI = {
  // Crear nuevo usuario
  crear: async (userData) => {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.correo,
        userData.contrasena
      );

      const user = userCredential.user;

      // Actualizar el perfil con el nombre completo
      await updateProfile(user, {
        displayName: `${userData.nombre} ${userData.apellido}`
      });

      // Guardar datos adicionales en Firestore con doble nomenclatura para compatibilidad
      const newUserData = {
        nombre: userData.nombre,
        apellido: userData.apellido,
        correo: userData.correo,
        rol: userData.rol || 'cliente',
        avatar: userData.avatar || `${userData.nombre[0]}${userData.apellido[0]}`.toUpperCase(),
        fechaCreacion: serverTimestamp(),
        fecha_creacion: serverTimestamp()
      };

      await setDoc(doc(db, 'usuarios', user.uid), newUserData);

      // Registrar actividad de creación de usuario
      await addDoc(collection(db, 'actividades'), {
        usuarioId: user.uid,
        usuario_id: user.uid,
        usuarioNombre: `${userData.nombre} ${userData.apellido}`,
        avatar: newUserData.avatar,
        descripcion: `Nuevo usuario ${userData.rol} registrado`,
        tareaModificada: `${userData.nombre} ${userData.apellido}`,
        tarea_modificada: `${userData.nombre} ${userData.apellido}`,
        fecha: serverTimestamp()
      });

      return {
        id: user.uid,
        ...newUserData
      };

    } catch (error) {
      console.error('Error creando usuario:', error);

      let errorMessage = 'Error al crear usuario';

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
          errorMessage = error.message || 'Error al crear usuario';
      }

      throw new Error(errorMessage);
    }
  },

  // Obtener todos los usuarios
  getAll: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'usuarios'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return [];
    }
  },

  // Obtener usuarios del equipo
  getTeam: async () => {
    try {
      const q = query(
        collection(db, 'usuarios'),
        where('rol', '==', 'team')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo equipo:', error);
      return [];
    }
  },

  // Obtener usuario por ID
  getById: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', userId));
      
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado');
      }
      
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  },

  // Actualizar usuario
  update: async (userId, updates) => {
    try {
      await updateDoc(doc(db, 'usuarios', userId), updates);
      
      return {
        success: true,
        message: 'Usuario actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

export default firebaseUsersAPI;