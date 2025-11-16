// src/services/firebaseMeetings.js
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
  where,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Servicio para gestionar reuniones entre admins y clientes
 */
export const firebaseMeetingsAPI = {
  /**
   * Obtiene todas las reuniones
   * @param {Object} filters - Filtros opcionales {adminId, clienteId, estado}
   * @returns {Promise<Array>} - Array de reuniones
   */
  async getAll(filters = {}) {
    try {
      let meetingsRef = collection(db, 'reuniones');
      let q = query(meetingsRef, orderBy('fechaSolicitada', 'desc'));

      // Aplicar filtros
      if (filters.adminId) {
        q = query(meetingsRef, where('adminId', '==', filters.adminId), orderBy('fechaSolicitada', 'desc'));
      } else if (filters.clienteId) {
        q = query(meetingsRef, where('clienteId', '==', filters.clienteId), orderBy('fechaSolicitada', 'desc'));
      } else if (filters.estado) {
        q = query(meetingsRef, where('estado', '==', filters.estado), orderBy('fechaSolicitada', 'desc'));
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaSolicitada: doc.data().fechaSolicitada?.toDate(),
        fechaPropuesta: doc.data().fechaPropuesta?.toDate(),
        fechaAlternativa: doc.data().fechaAlternativa?.toDate(),
        fechaCreacion: doc.data().fechaCreacion?.toDate(),
        fechaActualizacion: doc.data().fechaActualizacion?.toDate()
      }));
    } catch (error) {
      console.error('Error al obtener reuniones:', error);
      throw new Error('Error al obtener reuniones: ' + error.message);
    }
  },

  /**
   * Obtiene una reunión por ID
   * @param {string} reunionId - ID de la reunión
   * @returns {Promise<Object>} - Reunión
   */
  async getById(reunionId) {
    try {
      const reunionRef = doc(db, 'reuniones', reunionId);
      const reunionSnap = await getDoc(reunionRef);

      if (!reunionSnap.exists()) {
        throw new Error('Reunión no encontrada');
      }

      return {
        id: reunionSnap.id,
        ...reunionSnap.data(),
        fechaSolicitada: reunionSnap.data().fechaSolicitada?.toDate(),
        fechaPropuesta: reunionSnap.data().fechaPropuesta?.toDate(),
        fechaAlternativa: reunionSnap.data().fechaAlternativa?.toDate(),
        fechaCreacion: reunionSnap.data().fechaCreacion?.toDate(),
        fechaActualizacion: reunionSnap.data().fechaActualizacion?.toDate()
      };
    } catch (error) {
      console.error('Error al obtener reunión:', error);
      throw new Error('Error al obtener la reunión: ' + error.message);
    }
  },

  /**
   * Crea una nueva reunión
   * @param {Object} reunionData - Datos de la reunión
   * @returns {Promise<Object>} - Reunión creada
   */
  async create(reunionData) {
    try {
      const reunionesRef = collection(db, 'reuniones');

      const newReunion = {
        adminId: reunionData.adminId,
        adminNombre: reunionData.adminNombre,
        adminCorreo: reunionData.adminCorreo,
        clienteId: reunionData.clienteId,
        clienteNombre: reunionData.clienteNombre,
        clienteCorreo: reunionData.clienteCorreo,
        proyectoId: reunionData.proyectoId || null,
        proyectoNombre: reunionData.proyectoNombre || null,
        titulo: reunionData.titulo,
        descripcion: reunionData.descripcion || '',
        fechaSolicitada: reunionData.fechaSolicitada, // Fecha propuesta por el admin
        estado: 'pendiente', // 'pendiente', 'aceptada', 'rechazada'
        observacion: null,
        fechaAlternativa: null,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };

      const docRef = await addDoc(reunionesRef, newReunion);

      return {
        id: docRef.id,
        ...newReunion
      };
    } catch (error) {
      console.error('Error al crear reunión:', error);
      throw new Error('Error al crear la reunión: ' + error.message);
    }
  },

  /**
   * Actualiza una reunión
   * @param {string} reunionId - ID de la reunión
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<void>}
   */
  async update(reunionId, updates) {
    try {
      const reunionRef = doc(db, 'reuniones', reunionId);
      updates.fechaActualizacion = serverTimestamp();
      await updateDoc(reunionRef, updates);
    } catch (error) {
      console.error('Error al actualizar reunión:', error);
      throw new Error('Error al actualizar la reunión: ' + error.message);
    }
  },

  /**
   * Cliente acepta una reunión
   * @param {string} reunionId - ID de la reunión
   * @returns {Promise<void>}
   */
  async accept(reunionId) {
    try {
      await this.update(reunionId, {
        estado: 'aceptada',
        observacion: null,
        fechaAlternativa: null
      });
    } catch (error) {
      console.error('Error al aceptar reunión:', error);
      throw new Error('Error al aceptar la reunión: ' + error.message);
    }
  },

  /**
   * Cliente rechaza una reunión
   * @param {string} reunionId - ID de la reunión
   * @param {string} observacion - Observación del rechazo
   * @param {Date} [fechaAlternativa] - Fecha alternativa propuesta (opcional)
   * @returns {Promise<void>}
   */
  async reject(reunionId, observacion, fechaAlternativa = null) {
    try {
      await this.update(reunionId, {
        estado: 'rechazada',
        observacion,
        fechaAlternativa
      });
    } catch (error) {
      console.error('Error al rechazar reunión:', error);
      throw new Error('Error al rechazar la reunión: ' + error.message);
    }
  },

  /**
   * Elimina una reunión
   * @param {string} reunionId - ID de la reunión
   * @returns {Promise<void>}
   */
  async delete(reunionId) {
    try {
      const reunionRef = doc(db, 'reuniones', reunionId);
      await deleteDoc(reunionRef);
    } catch (error) {
      console.error('Error al eliminar reunión:', error);
      throw new Error('Error al eliminar la reunión: ' + error.message);
    }
  },

  /**
   * Obtiene las reuniones pendientes de un cliente
   * @param {string} clienteId - ID del cliente
   * @returns {Promise<Array>} - Array de reuniones pendientes
   */
  async getPendingByCliente(clienteId) {
    try {
      const reunionesRef = collection(db, 'reuniones');
      const q = query(
        reunionesRef,
        where('clienteId', '==', clienteId),
        where('estado', '==', 'pendiente'),
        orderBy('fechaSolicitada', 'asc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaSolicitada: doc.data().fechaSolicitada?.toDate(),
        fechaCreacion: doc.data().fechaCreacion?.toDate()
      }));
    } catch (error) {
      console.error('Error al obtener reuniones pendientes:', error);
      throw new Error('Error al obtener reuniones pendientes: ' + error.message);
    }
  },

  /**
   * Obtiene todas las reuniones de un admin
   * @param {string} adminId - ID del admin
   * @returns {Promise<Array>} - Array de reuniones
   */
  async getByAdmin(adminId) {
    try {
      const reunionesRef = collection(db, 'reuniones');
      const q = query(
        reunionesRef,
        where('adminId', '==', adminId),
        orderBy('fechaSolicitada', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaSolicitada: doc.data().fechaSolicitada?.toDate(),
        fechaAlternativa: doc.data().fechaAlternativa?.toDate(),
        fechaCreacion: doc.data().fechaCreacion?.toDate(),
        fechaActualizacion: doc.data().fechaActualizacion?.toDate()
      }));
    } catch (error) {
      console.error('Error al obtener reuniones del admin:', error);
      throw new Error('Error al obtener reuniones del admin: ' + error.message);
    }
  }
};

export default firebaseMeetingsAPI;
