// =====================================================
// src/services/firebaseMilestones.js
// =====================================================
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { firebaseStorageAPI } from './firebaseStorage';

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

      const responsableId = milestoneData.responsable_id || milestoneData.responsableId || null;
      const responsableNombre = milestoneData.responsableNombre || milestoneData.responsable_nombre || null;
      const fechaLimite = milestoneData.fecha_limite || milestoneData.fechaLimite || null;

      const docRef = await addDoc(
        collection(db, 'proyectos', projectIdStr, 'milestones'),
        {
          nombre: milestoneData.nombre,
          descripcion: milestoneData.descripcion || '',
          progreso: milestoneData.progreso || 0,
          estado: milestoneData.estado || 'pendiente',
          // Doble nomenclatura para responsableId
          responsableId: responsableId,
          responsable_id: responsableId,
          // Doble nomenclatura para responsableNombre
          responsableNombre: responsableNombre,
          responsable_nombre: responsableNombre,
          responsableAvatar: milestoneData.responsableAvatar || null,
          // Doble nomenclatura para fechaLimite
          fechaLimite: fechaLimite,
          fecha_limite: fechaLimite,
          // Doble nomenclatura para fechaCreacion
          fechaCreacion: serverTimestamp(),
          fecha_creacion: serverTimestamp()
        }
      );

      // Registrar actividad con doble nomenclatura
      if (milestoneData.usuario_id) {
        await addDoc(collection(db, 'actividades'), {
          usuarioId: String(milestoneData.usuario_id),
          usuario_id: String(milestoneData.usuario_id),
          usuarioNombre: milestoneData.usuarioNombre || milestoneData.usuario_nombre || 'Usuario',
          descripcion: 'Creó un nuevo hito',
          tareaModificada: milestoneData.nombre,
          tarea_modificada: milestoneData.nombre,
          proyectoId: projectIdStr,
          proyecto_id: projectIdStr,
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

      // Crear objeto con doble nomenclatura
      const updateData = { ...updates };

      // Agregar doble nomenclatura para fechas de actualización
      updateData.fechaActualizacion = serverTimestamp();
      updateData.fecha_actualizacion = serverTimestamp();

      // Si se actualiza responsableId, actualizar ambas versiones
      if (updates.responsableId) {
        updateData.responsable_id = updates.responsableId;
      }
      if (updates.responsable_id) {
        updateData.responsableId = updates.responsable_id;
      }

      // Si se actualiza responsableNombre, actualizar ambas versiones
      if (updates.responsableNombre) {
        updateData.responsable_nombre = updates.responsableNombre;
      }
      if (updates.responsable_nombre) {
        updateData.responsableNombre = updates.responsable_nombre;
      }

      // Si se actualiza fechaLimite, actualizar ambas versiones
      if (updates.fechaLimite) {
        updateData.fecha_limite = updates.fechaLimite;
      }
      if (updates.fecha_limite) {
        updateData.fechaLimite = updates.fecha_limite;
      }

      await updateDoc(
        doc(db, 'proyectos', projectIdStr, 'milestones', hitoIdStr),
        updateData
      );

      // Registrar actividad si se actualiza el progreso con doble nomenclatura
      if (updates.progreso !== undefined && hitoData.usuario_id) {
        await addDoc(collection(db, 'actividades'), {
          usuarioId: String(hitoData.usuario_id),
          usuario_id: String(hitoData.usuario_id),
          usuarioNombre: hitoData.usuarioNombre || hitoData.usuario_nombre || 'Usuario',
          descripcion: `Actualizó el progreso al ${updates.progreso}%`,
          tareaModificada: hitoData.nombre || 'Hito',
          tarea_modificada: hitoData.nombre || 'Hito',
          proyectoId: projectIdStr,
          proyecto_id: projectIdStr,
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
  },

  // Eliminar hito
  delete: async (proyectoId, hitoId) => {
    try {
      const projectIdStr = String(proyectoId);
      const hitoIdStr = String(hitoId);

      // Primero, eliminar todos los archivos multimedia asociados
      const multimediaRef = collection(db, 'proyectos', projectIdStr, 'milestones', hitoIdStr, 'multimedia');
      const multimediaSnapshot = await getDocs(multimediaRef);

      // Eliminar cada archivo multimedia de Storage
      for (const mediaDoc of multimediaSnapshot.docs) {
        const mediaData = mediaDoc.data();
        if (mediaData.archivoPath) {
          try {
            await firebaseStorageAPI.deleteFile(mediaData.archivoPath);
          } catch (error) {
            console.error('Error eliminando archivo multimedia:', error);
          }
        }
        await deleteDoc(mediaDoc.ref);
      }

      // Eliminar el hito
      await deleteDoc(doc(db, 'proyectos', projectIdStr, 'milestones', hitoIdStr));

      return { success: true };
    } catch (error) {
      console.error('Error eliminando hito:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // ==================== MULTIMEDIA EN HITOS ====================

  /**
   * Agrega multimedia (imagen o video) a un hito
   * @param {string} proyectoId - ID del proyecto
   * @param {string} hitoId - ID del hito
   * @param {File} file - Archivo a subir
   * @param {Object} metadata - Metadatos adicionales (descripcion, usuarioId, etc.)
   * @returns {Promise<Object>}
   */
  addMultimedia: async (proyectoId, hitoId, file, metadata = {}) => {
    try {
      const projectIdStr = String(proyectoId);
      const hitoIdStr = String(hitoId);

      // Validar que sea imagen o video
      const allowedTypes = ['image/', 'video/'];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));

      if (!isValidType) {
        throw new Error('Solo se permiten archivos de imagen o video');
      }

      // Subir el archivo a Storage
      const filePath = `proyectos/${projectIdStr}/milestones/${hitoIdStr}/multimedia/${Date.now()}_${file.name}`;
      const fileInfo = await firebaseStorageAPI.uploadFile(file, filePath);

      // Guardar la referencia en Firestore
      const multimediaRef = collection(db, 'proyectos', projectIdStr, 'milestones', hitoIdStr, 'multimedia');
      const docRef = await addDoc(multimediaRef, {
        archivoUrl: fileInfo.url,
        archivoPath: fileInfo.path,
        archivoNombre: fileInfo.name,
        archivoSize: fileInfo.size,
        archivoTipo: fileInfo.type,
        descripcion: metadata.descripcion || '',
        usuarioId: metadata.usuarioId || null,
        usuarioNombre: metadata.usuarioNombre || null,
        fechaCreacion: serverTimestamp()
      });

      return {
        success: true,
        multimedia_id: docRef.id,
        url: fileInfo.url
      };
    } catch (error) {
      console.error('Error agregando multimedia:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * Obtiene todos los archivos multimedia de un hito
   * @param {string} proyectoId - ID del proyecto
   * @param {string} hitoId - ID del hito
   * @returns {Promise<Array>}
   */
  getMultimedia: async (proyectoId, hitoId) => {
    try {
      const projectIdStr = String(proyectoId);
      const hitoIdStr = String(hitoId);

      const multimediaRef = collection(db, 'proyectos', projectIdStr, 'milestones', hitoIdStr, 'multimedia');
      const snapshot = await getDocs(multimediaRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate()
      }));
    } catch (error) {
      console.error('Error obteniendo multimedia:', error);
      return [];
    }
  },

  /**
   * Elimina un archivo multimedia de un hito
   * @param {string} proyectoId - ID del proyecto
   * @param {string} hitoId - ID del hito
   * @param {string} multimediaId - ID del archivo multimedia
   * @returns {Promise<Object>}
   */
  deleteMultimedia: async (proyectoId, hitoId, multimediaId) => {
    try {
      const projectIdStr = String(proyectoId);
      const hitoIdStr = String(hitoId);

      // Obtener la información del archivo para eliminarlo de Storage
      const mediaRef = doc(db, 'proyectos', projectIdStr, 'milestones', hitoIdStr, 'multimedia', multimediaId);
      const mediaSnap = await getDoc(mediaRef);

      if (mediaSnap.exists()) {
        const archivoPath = mediaSnap.data().archivoPath;

        // Eliminar el archivo de Storage
        if (archivoPath) {
          await firebaseStorageAPI.deleteFile(archivoPath);
        }

        // Eliminar el documento de Firestore
        await deleteDoc(mediaRef);
      }

      return { success: true };
    } catch (error) {
      console.error('Error eliminando multimedia:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

export default firebaseMilestonesAPI;