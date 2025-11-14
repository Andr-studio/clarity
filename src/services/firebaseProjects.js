// src/services/firebaseProjects.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const firebaseProjectsAPI = {
  // Obtener todos los proyectos según rol del usuario
getAll: async (userId = null, userRol = null) => {
  try {
    console.log('🔍 Buscando proyectos para:', { userId, userRol });
    
    let projectsQuery = query(
      collection(db, 'proyectos'),
      orderBy('fecha_creacion', 'desc')
    );
    
    const snapshot = await getDocs(projectsQuery);
    console.log('📊 Proyectos en Firebase:', snapshot.size);
    
    const projects = [];
    
    for (const docSnapshot of snapshot.docs) {
      const projectData = { 
        id: docSnapshot.id, 
        ...docSnapshot.data() 
      };
      
      console.log('📋 Proyecto encontrado:', projectData);
      
      // Filtrar según rol
      if (userRol === 'cliente') {
        // Convertir IDs a string para comparar
        const creadorIdStr = String(projectData.creador_id || projectData.creadorId);
        const userIdStr = String(userId);
        
        // ✅ NUEVO: Verificar si está en el equipo
        const equipo = projectData.equipo || [];
        const estaEnEquipo = equipo.some(miembro => String(miembro.userId) === userIdStr);
        const esCreador = creadorIdStr === userIdStr;
        
        console.log('🔐 Verificación:', { 
          esCreador, 
          estaEnEquipo, 
          equipoSize: equipo.length,
          userId: userIdStr 
        });
        
        // Si NO es creador Y NO está en el equipo, saltar
        if (!esCreador && !estaEnEquipo) {
          console.log('❌ Usuario no tiene acceso');
          continue;
        }
        
        console.log('✅ Usuario tiene acceso');
      }
      
      // Obtener hitos
      const milestonesSnapshot = await getDocs(
        collection(db, 'proyectos', docSnapshot.id, 'milestones')
      );
      
      let totalProgress = 0;
      let completedCount = 0;
      
      milestonesSnapshot.forEach(milestone => {
        const data = milestone.data();
        totalProgress += data.progreso || 0;
        if (data.estado === 'completado') completedCount++;
      });
      
      projectData.total_hitos = milestonesSnapshot.size;
      projectData.hitos_completados = completedCount;
      projectData.progreso = milestonesSnapshot.size > 0 
        ? Math.round(totalProgress / milestonesSnapshot.size)
        : 0;
      
      projectData.teamMembers = (projectData.equipo || []).filter(member => member.rol === 'team');
      projectData.teamCount = projectData.teamMembers.length;

      projects.push(projectData);
    }
    
    console.log('✅ Proyectos finales:', projects);
    return projects;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return [];
  }
},

  // Obtener proyecto por ID
 // Obtener proyecto por ID
getById: async (proyectoId) => {
  try {
    const projectDoc = await getDoc(doc(db, 'proyectos', String(proyectoId)));
    
    if (!projectDoc.exists()) {
      throw new Error('Proyecto no encontrado');
    }
    
    const projectData = {
      id: projectDoc.id,
      ...projectDoc.data()
    };
    
    // Asegurar que tecnologias sea un array
    if (typeof projectData.tecnologias === 'string') {
      projectData.tecnologias = projectData.tecnologias.split(',').map(t => t.trim());
    } else if (!Array.isArray(projectData.tecnologias)) {
      projectData.tecnologias = [];
    }
    
    // Asegurar que equipo sea un array
    if (!Array.isArray(projectData.equipo)) {
      projectData.equipo = [];
    }

    // Filtrar y contar solo miembros con rol 'team'
    projectData.teamMembers = projectData.equipo.filter(member => member.rol === 'team');
    projectData.teamCount = projectData.teamMembers.length;
    
    // Obtener hitos del proyecto
    const milestonesSnapshot = await getDocs(
      collection(db, 'proyectos', String(proyectoId), 'milestones')
    );
    
    projectData.hitos = milestonesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calcular progreso
    if (projectData.hitos.length > 0) {
      const totalProgress = projectData.hitos.reduce((sum, hito) => sum + (hito.progreso || 0), 0);
      projectData.progreso = Math.round(totalProgress / projectData.hitos.length);
    } else {
      projectData.progreso = 0;
    }
    
    // Obtener actividades recientes
    const activitiesQuery = query(
      collection(db, 'actividades'),
      where('proyecto_id', '==', String(proyectoId)),
      orderBy('fecha', 'desc')
    );
    
    const activitiesSnapshot = await getDocs(activitiesQuery);
    projectData.actividades_recientes = activitiesSnapshot.docs
      .slice(0, 10)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    
    return projectData;
    
  } catch (error) {
    console.error('Error obteniendo proyecto:', error);
    throw error;
  }
},

  // Crear nuevo proyecto
  create: async (proyectoData) => {
    try {
      const projectRef = await addDoc(collection(db, 'proyectos'), {
        nombre: proyectoData.nombre,
        descripcion: proyectoData.descripcion || '',
        estado: proyectoData.estado,
        presupuesto: proyectoData.presupuesto,
        tecnologias: proyectoData.tecnologias.split ? 
          proyectoData.tecnologias.split(',').map(t => t.trim()) : 
          proyectoData.tecnologias,
        creadorId: proyectoData.creador_id || proyectoData.creadorId,
        creadorNombre: proyectoData.creadorNombre,
        equipo: proyectoData.equipo || [],
        fechaCreacion: serverTimestamp()
      });
      
      // Registrar actividad
      await addDoc(collection(db, 'actividades'), {
        usuarioId: proyectoData.creador_id || proyectoData.creadorId,
        usuarioNombre: proyectoData.creadorNombre,
        descripcion: 'Creó un nuevo proyecto',
        tareaModificada: proyectoData.nombre,
        proyectoId: projectRef.id,
        proyectoNombre: proyectoData.nombre,
        fecha: serverTimestamp()
      });
      
      return {
        success: true,
        proyecto_id: projectRef.id,
        message: 'Proyecto creado exitosamente'
      };
      
    } catch (error) {
      console.error('Error creando proyecto:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Actualizar proyecto
  update: async (proyectoId, updates) => {
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        ...updates,
        fechaActualizacion: serverTimestamp()
      });
      
      return {
        success: true,
        message: 'Proyecto actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

export default firebaseProjectsAPI;