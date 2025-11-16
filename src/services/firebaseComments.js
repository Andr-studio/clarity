// src/services/firebaseComments.js
import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const firebaseCommentsAPI = {
  // Obtener comentarios por hito
  getByHito: async (projectId, milestoneId) => {
    try {
      // Los comentarios están en la subcolección del milestone
      const commentsRef = collection(db, 'proyectos', String(projectId), 'milestones', String(milestoneId), 'comentarios');
      const q = query(commentsRef, orderBy('fecha', 'asc'));
      
      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      
      // Organizar comentarios con sus respuestas
      const commentsMap = new Map();
      const rootComments = [];
      
      comments.forEach(comment => {
        commentsMap.set(comment.id, { ...comment, replies: [] });
      });
      
      comments.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies.push(commentsMap.get(comment.id));
          }
        } else {
          rootComments.push(commentsMap.get(comment.id));
        }
      });
      
      return rootComments;
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
      return [];
    }
  },

  // Crear comentario
  create: async (commentData) => {
    try {
      const { projectId, milestoneId, usuario_id, usuarioNombre, usuarioAvatar, comentario, parent_id } = commentData;

      const commentsRef = collection(db, 'proyectos', String(projectId), 'milestones', String(milestoneId), 'comentarios');

      const docRef = await addDoc(commentsRef, {
        // Doble nomenclatura para usuarioId
        usuarioId: usuario_id,
        usuario_id: usuario_id,
        usuarioNombre: usuarioNombre,
        avatar: usuarioAvatar,
        author: usuarioNombre,
        comentario: comentario,
        parent_id: parent_id || null,
        editado: false,
        fecha: serverTimestamp()
      });

      // Registrar actividad con doble nomenclatura
      await addDoc(collection(db, 'actividades'), {
        usuarioId: usuario_id,
        usuario_id: usuario_id,
        usuarioNombre: usuarioNombre,
        avatar: usuarioAvatar,
        descripcion: parent_id ? 'Respondió a un comentario' : 'Agregó un comentario',
        tareaModificada: 'Comentario en hito',
        tarea_modificada: 'Comentario en hito',
        proyectoId: String(projectId),
        proyecto_id: String(projectId),
        fecha: serverTimestamp()
      });

      return {
        success: true,
        comentario_id: docRef.id
      };
    } catch (error) {
      console.error('Error creando comentario:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

export default firebaseCommentsAPI;