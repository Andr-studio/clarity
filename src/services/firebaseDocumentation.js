// src/services/firebaseDocumentation.js
import { db } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { firebaseStorageAPI } from './firebaseStorage';

/**
 * Servicio para gestionar la documentación de proyectos en Firestore
 */
export const firebaseDocumentationAPI = {
  /**
   * Obtiene toda la documentación de un proyecto
   * @param {string} proyectoId - ID del proyecto
   * @returns {Promise<Array>} - Array de documentos
   */
  async getAll(proyectoId) {
    try {
      const documentosRef = collection(db, `proyectos/${proyectoId}/documentacion`);
      const q = query(documentosRef, orderBy('fechaCreacion', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate(),
        fechaActualizacion: doc.data().fechaActualizacion?.toDate()
      }));
    } catch (error) {
      console.error('Error al obtener documentación:', error);
      throw new Error('Error al obtener la documentación: ' + error.message);
    }
  },

  /**
   * Obtiene un documento específico
   * @param {string} proyectoId - ID del proyecto
   * @param {string} documentoId - ID del documento
   * @returns {Promise<Object>} - Documento
   */
  async getById(proyectoId, documentoId) {
    try {
      const docRef = doc(db, `proyectos/${proyectoId}/documentacion`, documentoId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Documento no encontrado');
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        fechaCreacion: docSnap.data().fechaCreacion?.toDate(),
        fechaActualizacion: docSnap.data().fechaActualizacion?.toDate()
      };
    } catch (error) {
      console.error('Error al obtener documento:', error);
      throw new Error('Error al obtener el documento: ' + error.message);
    }
  },

  /**
   * Crea un nuevo documento en un proyecto
   * @param {string} proyectoId - ID del proyecto
   * @param {Object} documentoData - Datos del documento
   * @param {File} file - Archivo a subir
   * @returns {Promise<Object>} - Documento creado
   */
  async create(proyectoId, documentoData, file) {
    try {
      // Subir el archivo a Storage
      const filePath = `proyectos/${proyectoId}/documentacion/${Date.now()}_${file.name}`;
      const fileInfo = await firebaseStorageAPI.uploadFile(file, filePath);

      // Crear el documento en Firestore
      const documentosRef = collection(db, `proyectos/${proyectoId}/documentacion`);
      const docRef = await addDoc(documentosRef, {
        ...documentoData,
        archivoUrl: fileInfo.url,
        archivoPath: fileInfo.path,
        archivoNombre: fileInfo.name,
        archivoSize: fileInfo.size,
        archivoTipo: fileInfo.type,
        proyectoId,
        estado: 'pendiente', // Estado inicial: pendiente
        motivoRechazo: null,
        fechaAprobacion: null,
        fechaRechazo: null,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });

      return {
        id: docRef.id,
        ...documentoData,
        archivoUrl: fileInfo.url,
        archivoPath: fileInfo.path,
        archivoNombre: fileInfo.name,
        estado: 'pendiente'
      };
    } catch (error) {
      console.error('Error al crear documento:', error);
      throw new Error('Error al crear el documento: ' + error.message);
    }
  },

  /**
   * Actualiza un documento
   * @param {string} proyectoId - ID del proyecto
   * @param {string} documentoId - ID del documento
   * @param {Object} updates - Campos a actualizar
   * @param {File} [newFile] - Nuevo archivo (opcional)
   * @returns {Promise<void>}
   */
  async update(proyectoId, documentoId, updates, newFile = null) {
    try {
      const docRef = doc(db, `proyectos/${proyectoId}/documentacion`, documentoId);

      // Si hay un nuevo archivo, subirlo
      if (newFile) {
        // Obtener el documento actual para eliminar el archivo anterior
        const docSnap = await getDoc(docRef);
        const oldPath = docSnap.data().archivoPath;

        // Subir el nuevo archivo
        const filePath = `proyectos/${proyectoId}/documentacion/${Date.now()}_${newFile.name}`;
        const fileInfo = await firebaseStorageAPI.uploadFile(newFile, filePath);

        // Eliminar el archivo anterior
        if (oldPath) {
          await firebaseStorageAPI.deleteFile(oldPath);
        }

        updates.archivoUrl = fileInfo.url;
        updates.archivoPath = fileInfo.path;
        updates.archivoNombre = fileInfo.name;
        updates.archivoSize = fileInfo.size;
        updates.archivoTipo = fileInfo.type;
      }

      updates.fechaActualizacion = serverTimestamp();
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error al actualizar documento:', error);
      throw new Error('Error al actualizar el documento: ' + error.message);
    }
  },

  /**
   * Elimina un documento
   * @param {string} proyectoId - ID del proyecto
   * @param {string} documentoId - ID del documento
   * @returns {Promise<void>}
   */
  async delete(proyectoId, documentoId) {
    try {
      const docRef = doc(db, `proyectos/${proyectoId}/documentacion`, documentoId);

      // Obtener el documento para eliminar el archivo de Storage
      const docSnap = await getDoc(docRef);
      const archivoPath = docSnap.data()?.archivoPath;

      // Eliminar el archivo de Storage
      if (archivoPath) {
        await firebaseStorageAPI.deleteFile(archivoPath);
      }

      // Eliminar el documento de Firestore
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      throw new Error('Error al eliminar el documento: ' + error.message);
    }
  },

  /**
   * Aprueba un documento
   * @param {string} proyectoId - ID del proyecto
   * @param {string} documentoId - ID del documento
   * @returns {Promise<void>}
   */
  async approve(proyectoId, documentoId) {
    try {
      const docRef = doc(db, `proyectos/${proyectoId}/documentacion`, documentoId);
      await updateDoc(docRef, {
        estado: 'aprobado',
        motivoRechazo: null,
        fechaAprobacion: serverTimestamp(),
        fechaRechazo: null,
        fechaActualizacion: serverTimestamp()
      });
    } catch (error) {
      console.error('Error al aprobar documento:', error);
      throw new Error('Error al aprobar el documento: ' + error.message);
    }
  },

  /**
   * Rechaza un documento
   * @param {string} proyectoId - ID del proyecto
   * @param {string} documentoId - ID del documento
   * @param {string} motivoRechazo - Motivo del rechazo
   * @returns {Promise<void>}
   */
  async reject(proyectoId, documentoId, motivoRechazo) {
    try {
      if (!motivoRechazo || motivoRechazo.trim() === '') {
        throw new Error('El motivo de rechazo es requerido');
      }

      const docRef = doc(db, `proyectos/${proyectoId}/documentacion`, documentoId);
      await updateDoc(docRef, {
        estado: 'rechazado',
        motivoRechazo: motivoRechazo.trim(),
        fechaRechazo: serverTimestamp(),
        fechaAprobacion: null,
        fechaActualizacion: serverTimestamp()
      });
    } catch (error) {
      console.error('Error al rechazar documento:', error);
      throw new Error('Error al rechazar el documento: ' + error.message);
    }
  }
};

export default firebaseDocumentationAPI;
