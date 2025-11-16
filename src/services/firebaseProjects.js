// src/services/firebaseProjects.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
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
      // admin: puede ver TODOS los proyectos sin restricciones
      // team: puede ver proyectos donde está en el equipo
      // cliente: puede ver proyectos que creó o donde está en el equipo

      if (userRol === 'admin') {
        // Los administradores pueden ver todos los proyectos sin filtrado
        console.log('✅ Admin tiene acceso total');
      } else if (userRol === 'cliente') {
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
      } else if (userRol === 'team') {
        // Verificar si el usuario está en el equipo del proyecto
        const equipo = projectData.equipo || [];
        const userIdStr = String(userId);

        console.log('🔍 Verificando acceso de team:', {
          proyectoNombre: projectData.nombre,
          proyectoId: projectData.id,
          userId: userIdStr,
          equipo: equipo.map(m => ({
            userId: m.userId,
            nombre: m.nombre,
            rol: m.rol
          }))
        });

        const estaEnEquipo = equipo.some(miembro => {
          const miembroIdStr = String(miembro.userId);
          const coincide = miembroIdStr === userIdStr;
          console.log(`  Comparando: ${miembroIdStr} === ${userIdStr} = ${coincide}`);
          return coincide;
        });

        if (!estaEnEquipo) {
          console.log('❌ Usuario team no está en este proyecto');
          continue;
        }

        console.log('✅ Usuario team tiene acceso');
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
      // Procesar tecnologías
      const tecnologias = proyectoData.tecnologias?.split ?
        proyectoData.tecnologias.split(',').map(t => t.trim()) :
        (proyectoData.tecnologias || []);

      // Obtener ID del creador
      const creadorId = proyectoData.creador_id || proyectoData.creadorId;

      // Obtener datos del creador para el nombre
      let creadorNombre = proyectoData.creadorNombre || proyectoData.creador_nombre;
      if (!creadorNombre && creadorId) {
        try {
          const creadorDoc = await getDoc(doc(db, 'usuarios', String(creadorId)));
          if (creadorDoc.exists()) {
            const creadorData = creadorDoc.data();
            creadorNombre = `${creadorData.nombre} ${creadorData.apellido}`;
          }
        } catch (error) {
          console.error('Error obteniendo datos del creador:', error);
        }
      }

      // Crear documento con doble nomenclatura para compatibilidad
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
        clienteId: proyectoData.clienteId || null,
        clienteNombre: proyectoData.clienteNombre || null,
        clienteCorreo: proyectoData.clienteCorreo || null,
        clienteEmpresa: proyectoData.clienteEmpresa || null,
        fechaCreacion: serverTimestamp()
      });

      // Registrar actividad con doble nomenclatura
      await addDoc(collection(db, 'actividades'), {
        usuarioId: creadorId,
        usuario_id: creadorId,
        usuarioNombre: creadorNombre,
        descripcion: 'Creó un nuevo proyecto',
        tareaModificada: proyectoData.nombre,
        tarea_modificada: proyectoData.nombre,
        proyectoId: projectRef.id,
        proyecto_id: projectRef.id,
        proyectoNombre: proyectoData.nombre,
        proyecto_nombre: proyectoData.nombre,
        fecha: serverTimestamp()
      });

      // Retornar el proyecto creado con su ID
      return {
        id: projectRef.id,
        nombre: proyectoData.nombre,
        descripcion: proyectoData.descripcion || '',
        estado: proyectoData.estado || 'pendiente',
        presupuesto: Number(proyectoData.presupuesto) || 0,
        tecnologias: tecnologias,
        creadorId: creadorId,
        creador_id: creadorId,
        creadorNombre: creadorNombre,
        creador_nombre: creadorNombre,
        equipo: proyectoData.equipo || [],
        progreso: proyectoData.progreso || 0
      };

    } catch (error) {
      console.error('Error creando proyecto:', error);
      throw new Error(error.message || 'Error al crear proyecto');
    }
  },

  // Alias para compatibilidad - método 'crear' apunta a 'create'
  crear: async (proyectoData) => {
    return firebaseProjectsAPI.create(proyectoData);
  },

  // Actualizar proyecto
  update: async (proyectoId, updates) => {
    try {
      // Crear objeto con doble nomenclatura para campos importantes
      const updateData = { ...updates };

      // Agregar doble nomenclatura para fechas de actualización
      updateData.fechaActualizacion = serverTimestamp();
      updateData.fecha_actualizacion = serverTimestamp();

      // Si se actualiza creadorId, actualizar ambas versiones
      if (updates.creadorId) {
        updateData.creador_id = updates.creadorId;
      }
      if (updates.creador_id) {
        updateData.creadorId = updates.creador_id;
      }

      // Si se actualiza creadorNombre, actualizar ambas versiones
      if (updates.creadorNombre) {
        updateData.creador_nombre = updates.creadorNombre;
      }
      if (updates.creador_nombre) {
        updateData.creadorNombre = updates.creador_nombre;
      }

      await updateDoc(doc(db, 'proyectos', proyectoId), updateData);

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
  },

  // Eliminar proyecto
  delete: async (proyectoId) => {
    try {
      // Eliminar el proyecto
      await deleteDoc(doc(db, 'proyectos', proyectoId));

      // Opcional: Eliminar hitos asociados
      const milestonesSnapshot = await getDocs(
        collection(db, 'proyectos', proyectoId, 'milestones')
      );

      const deletePromises = milestonesSnapshot.docs.map(milestoneDoc =>
        deleteDoc(doc(db, 'proyectos', proyectoId, 'milestones', milestoneDoc.id))
      );

      await Promise.all(deletePromises);

      return {
        success: true,
        message: 'Proyecto eliminado exitosamente'
      };

    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

export default firebaseProjectsAPI;