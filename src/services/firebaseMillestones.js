// =====================================================
// src/services/firebaseMilestones.js
// =====================================================
import { 
  collection, 
  doc,
  addDoc, 
  updateDoc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const firebaseMilestonesAPI = {
  // Obtener todos los hitos (opcionalmente por proyecto)
  getAll: async (proyectoId = null) => {
    try {
      if (proyectoId) {
        // ✅ CORRECCIÓN: Convertir proyectoId a string
        const projectIdStr = String(proyectoId);
        
        // Hitos de un proyecto específico
        const snapshot = await getDocs(
          collection(db, 'proyectos', projectIdStr, 'milestones')
        );
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          proyecto_id: projectIdStr,
          ...doc.data()
        }));
      } else {
        // Todos los hitos de todos los proyectos
        const projectsSnapshot = await getDocs(collection(db, 'proyectos'));
        const allMilestones = [];
        
        for (const projectDoc of projectsSnapshot.docs) {
          const milestonesSnapshot = await getDocs(
            collection(db, 'proyectos', projectDoc.id, 'milestones')
          );
          
          milestonesSnapshot.docs.forEach(milestoneDoc => {
            allMilestones.push({
              id: milestoneDoc.id,
              proyecto_id: projectDoc.id,
              proyecto_nombre: projectDoc.data().nombre,
              ...milestoneDoc.data()
            });
          });
        }
        
        return allMilestones;
      }
    } catch (error) {
      console.error('Error obteniendo hitos:', error);
      return [];
    }
  },

  // Crear nuevo hito
  create: async (hitoData) => {
    try {
      const { proyecto_id, ...milestoneData } = hitoData;
      
      // ✅ CORRECCIÓN: Convertir proyecto_id a string
      const projectIdStr = String(proyecto_id);
      
      const docRef = await addDoc(
        collection(db, 'proyectos', projectIdStr, 'milestones'),
        {
          nombre: milestoneData.nombre,
          descripcion: milestoneData.descripcion || '',
          progreso: milestoneData.progreso || 0,
          estado: milestoneData.estado || 'pendiente',
          responsableId: milestoneData.responsable_id || null,
          responsableNombre: milestoneData.responsableNombre || null,
          responsableAvatar: milestoneData.responsableAvatar || null,
          fechaLimite: milestoneData.fecha_limite || null,
          fechaCreacion: serverTimestamp()
        }
      );
      
      // Registrar actividad
      if (milestoneData.usuario_id) {
        await addDoc(collection(db, 'actividades'), {
          usuarioId: String(milestoneData.usuario_id),
          descripcion: 'Creó un nuevo hito',
          tareaModificada: milestoneData.nombre,
          proyectoId: projectIdStr,
          fecha: serverTimestamp()
        });
      }
      
      return {
        success: true,
        hito_id: docRef.id
      };
    } catch (error) {
      console.error('Error creando hito:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Actualizar hito
  update: async (hitoId, hitoData) => {
    try {
      const { proyecto_id, ...updates } = hitoData;
      
      // ✅ CORRECCIÓN: Convertir IDs a string
      const projectIdStr = String(proyecto_id);
      const hitoIdStr = String(hitoId);
      
      await updateDoc(
        doc(db, 'proyectos', projectIdStr, 'milestones', hitoIdStr),
        {
          ...updates,
          fechaActualizacion: serverTimestamp()
        }
      );
      
      // Registrar actividad si se actualiza el progreso
      if (updates.progreso !== undefined && hitoData.usuario_id) {
        await addDoc(collection(db, 'actividades'), {
          usuarioId: String(hitoData.usuario_id),
          descripcion: `Actualizó el progreso al ${updates.progreso}%`,
          tareaModificada: hitoData.nombre || 'Hito',
          proyectoId: projectIdStr,
          fecha: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error actualizando hito:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

export default firebaseMilestonesAPI;