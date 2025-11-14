// =====================================================
// src/services/firebaseUsers.js
// =====================================================
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const firebaseUsersAPI = {
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