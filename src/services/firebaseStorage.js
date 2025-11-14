// src/services/firebaseStorage.js
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from '../firebase';

const firebaseStorageAPI = {
  /**
   * Sube un archivo a Firebase Storage
   * @param {File} file - Archivo a subir
   * @param {string} path - Ruta en Storage (ej: 'proyectos/proyecto-id/archivos')
   * @param {Function} onProgress - Callback para reportar progreso (recibe porcentaje 0-100)
   * @returns {Promise<{url: string, path: string}>} URL de descarga y ruta del archivo
   */
  uploadFile: async (file, path = 'uploads', onProgress = null) => {
    try {
      // Crear referencia con timestamp para evitar colisiones
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const storageRef = ref(storage, `${path}/${fileName}`);

      // Crear tarea de subida
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Calcular progreso
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(Math.round(progress));
            }
            console.log(`Upload progress: ${progress}%`);
          },
          (error) => {
            // Manejar errores
            console.error('Error uploading file:', error);
            reject(error);
          },
          async () => {
            // Subida completada exitosamente
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                url: downloadURL,
                path: uploadTask.snapshot.ref.fullPath,
                name: file.name,
                size: file.size,
                type: file.type
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  },

  /**
   * Sube múltiples archivos
   * @param {File[]} files - Array de archivos
   * @param {string} path - Ruta base en Storage
   * @param {Function} onProgress - Callback para progreso individual
   * @returns {Promise<Array>} Array de resultados de subida
   */
  uploadMultipleFiles: async (files, path = 'uploads', onProgress = null) => {
    try {
      const uploadPromises = files.map((file) =>
        firebaseStorageAPI.uploadFile(file, path, onProgress)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  },

  /**
   * Elimina un archivo de Firebase Storage
   * @param {string} filePath - Ruta completa del archivo en Storage
   * @returns {Promise<void>}
   */
  deleteFile: async (filePath) => {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      console.log('File deleted successfully:', filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  /**
   * Lista todos los archivos en una ruta
   * @param {string} path - Ruta en Storage
   * @returns {Promise<Array>} Array de referencias de archivos
   */
  listFiles: async (path) => {
    try {
      const listRef = ref(storage, path);
      const result = await listAll(listRef);

      // Obtener URLs de descarga para cada archivo
      const filesWithUrls = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            path: itemRef.fullPath,
            url: url
          };
        })
      );

      return filesWithUrls;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  },

  /**
   * Obtiene la URL de descarga de un archivo
   * @param {string} filePath - Ruta del archivo en Storage
   * @returns {Promise<string>} URL de descarga
   */
  getDownloadURL: async (filePath) => {
    try {
      const fileRef = ref(storage, filePath);
      const url = await getDownloadURL(fileRef);
      return url;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }
};

export default firebaseStorageAPI;
