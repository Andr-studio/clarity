// =====================================================
// src/services/firebaseActivities.js  
// =====================================================
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const firebaseActivitiesAPI = {
  // Obtener actividades con filtros
  getAll: async (filters = {}) => {
    try {
      const activitiesRef = collection(db, 'actividades');
      const constraints = [];
      
      // Filtro por proyecto
      if (filters.proyecto_id) {
        constraints.push(where('proyectoId', '==', String(filters.proyecto_id)));
      }
      
      // Filtro por usuario
      if (filters.usuario_id) {
        constraints.push(where('usuarioId', '==', String(filters.usuario_id)));
      }
      
      // Ordenar por fecha descendente
      constraints.push(orderBy('fecha', 'desc'));
      
      // Límite de resultados
      if (filters.limit) {
        constraints.push(limit(parseInt(filters.limit)));
      } else {
        constraints.push(limit(20)); // Límite por defecto
      }
      
      const q = query(activitiesRef, ...constraints);
      const snapshot = await getDocs(q);
      
      // Mapear y formatear las actividades
      const activities = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          
          // Obtener nombre del proyecto si no viene en la actividad
          let proyectoNombre = data.proyectoNombre;
          if (!proyectoNombre && data.proyectoId) {
            try {
              const projectDoc = await getDoc(doc(db, 'proyectos', data.proyectoId));
              if (projectDoc.exists()) {
                proyectoNombre = projectDoc.data().nombre;
              }
            } catch (error) {
              console.error('Error obteniendo proyecto:', error);
            }
          }
          
          return {
            id: docSnapshot.id,
            usuarioId: data.usuarioId,
            usuarioNombre: data.usuarioNombre,
            avatar: data.avatar || data.usuarioNombre?.charAt(0).toUpperCase() || 'U',
            descripcion: data.descripcion,
            tareaModificada: data.tareaModificada || '',
            proyectoId: data.proyectoId,
            proyectoNombre: proyectoNombre || 'Proyecto',
            fecha: data.fecha,
            // Formatear fecha para mejor uso
            fechaFormateada: data.fecha?.toDate?.() || new Date()
          };
        })
      );
      
      return activities;
    } catch (error) {
      console.error('Error obteniendo actividades:', error);
      throw error;
    }
  },

  // Obtener actividades recientes de un usuario específico
  getByUser: async (userId, limitCount = 10) => {
    try {
      const activitiesRef = collection(db, 'actividades');
      const q = query(
        activitiesRef,
        where('usuarioId', '==', String(userId)),
        orderBy('fecha', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo actividades del usuario:', error);
      return [];
    }
  },

  // Obtener actividades recientes de un proyecto específico
  getByProject: async (projectId, limitCount = 20) => {
    try {
      const activitiesRef = collection(db, 'actividades');
      const q = query(
        activitiesRef,
        where('proyectoId', '==', String(projectId)),
        orderBy('fecha', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaFormateada: doc.data().fecha?.toDate?.() || new Date()
      }));
    } catch (error) {
      console.error('Error obteniendo actividades del proyecto:', error);
      return [];
    }
  }
};

export default firebaseActivitiesAPI;