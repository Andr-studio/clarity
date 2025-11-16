// src/services/firebaseStorage.js
import { storage } from '../firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';

/**
 * Servicio para gestionar archivos en Firebase Storage
 */
export const firebaseStorageAPI = {
  /**
   * Sube un archivo a Firebase Storage
   * @param {File} file - Archivo a subir
   * @param {string} path - Ruta donde se guardará el archivo (ej: 'milestones/milestone123/imagen.jpg')
   * @returns {Promise<{url: string, path: string}>} - URL de descarga y ruta del archivo
   */
  async uploadFile(file, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      return {
        url,
        path: snapshot.ref.fullPath,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw new Error('Error al subir el archivo: ' + error.message);
    }
  },

  /**
   * Obtiene la URL de descarga de un archivo
   * @param {string} path - Ruta del archivo en Storage
   * @returns {Promise<string>} - URL de descarga
   */
  async getFileUrl(path) {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error al obtener URL del archivo:', error);
      throw new Error('Error al obtener la URL del archivo: ' + error.message);
    }
  },

  /**
   * Elimina un archivo de Firebase Storage
   * @param {string} path - Ruta del archivo a eliminar
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      throw new Error('Error al eliminar el archivo: ' + error.message);
    }
  },

  /**
   * Lista todos los archivos en una ruta
   * @param {string} path - Ruta a listar
   * @returns {Promise<Array>} - Array de archivos
   */
  async listFiles(path) {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);

      const files = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            path: itemRef.fullPath,
            url
          };
        })
      );

      return files;
    } catch (error) {
      console.error('Error al listar archivos:', error);
      throw new Error('Error al listar archivos: ' + error.message);
    }
  },

  /**
   * Sube múltiples archivos
   * @param {File[]} files - Array de archivos a subir
   * @param {string} basePath - Ruta base donde se guardarán los archivos
   * @returns {Promise<Array>} - Array con información de los archivos subidos
   */
  async uploadMultipleFiles(files, basePath) {
    try {
      const uploadPromises = files.map((file, index) => {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${index}_${file.name}`;
        const path = `${basePath}/${fileName}`;
        return this.uploadFile(file, path);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error al subir múltiples archivos:', error);
      throw new Error('Error al subir los archivos: ' + error.message);
    }
  }
};

export default firebaseStorageAPI;
