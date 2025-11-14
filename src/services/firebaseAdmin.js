// src/services/firebaseAdmin.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';

const firebaseAdminAPI = {
  // Obtener todos los clientes
  getAllClients: async () => {
    try {
      const clientsQuery = query(
        collection(db, 'usuarios'),
        where('rol', '==', 'cliente'),
        orderBy('fechaCreacion', 'desc')
      );

      const snapshot = await getDocs(clientsQuery);

      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        clients
      };

    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      return {
        success: false,
        message: error.message,
        clients: []
      };
    }
  },

  // Obtener todos los usuarios
  getAllUsers: async () => {
    try {
      const usersQuery = query(
        collection(db, 'usuarios'),
        orderBy('fechaCreacion', 'desc')
      );

      const snapshot = await getDocs(usersQuery);

      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        users
      };

    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return {
        success: false,
        message: error.message,
        users: []
      };
    }
  },

  // Crear un nuevo cliente
  createClient: async (clientData) => {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        clientData.correo,
        clientData.password
      );

      const user = userCredential.user;

      // Actualizar el perfil con el nombre completo
      await updateProfile(user, {
        displayName: `${clientData.nombre} ${clientData.apellido}`
      });

      // Generar avatar con iniciales
      const avatar = `${clientData.nombre[0]}${clientData.apellido[0]}`.toUpperCase();

      // Guardar datos adicionales en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nombre: clientData.nombre,
        apellido: clientData.apellido,
        correo: clientData.correo,
        empresa: clientData.empresa || '',
        telefono: clientData.telefono || '',
        rol: 'cliente',
        avatar: avatar,
        fechaCreacion: serverTimestamp(),
        creadoPorAdmin: true
      });

      // Registrar actividad
      if (clientData.adminId) {
        await addDoc(collection(db, 'actividades'), {
          usuarioId: clientData.adminId,
          usuarioNombre: clientData.adminNombre || 'Administrador',
          descripcion: 'Creó un nuevo cliente',
          tareaModificada: `${clientData.nombre} ${clientData.apellido}`,
          fecha: serverTimestamp()
        });
      }

      return {
        success: true,
        message: 'Cliente creado exitosamente',
        clientId: user.uid
      };

    } catch (error) {
      console.error('Error creando cliente:', error);

      let errorMessage = 'Error al crear cliente';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'El correo ya está registrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo no es válido';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
          break;
        default:
          errorMessage = error.message || 'Error al crear cliente';
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Obtener cliente por ID
  getClientById: async (clientId) => {
    try {
      const clientDoc = await getDoc(doc(db, 'usuarios', clientId));

      if (!clientDoc.exists()) {
        throw new Error('Cliente no encontrado');
      }

      const clientData = {
        id: clientDoc.id,
        ...clientDoc.data()
      };

      return {
        success: true,
        client: clientData
      };

    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Actualizar información del cliente
  updateClient: async (clientId, updates) => {
    try {
      const clientRef = doc(db, 'usuarios', clientId);
      await updateDoc(clientRef, {
        ...updates,
        fechaActualizacion: serverTimestamp()
      });

      return {
        success: true,
        message: 'Cliente actualizado exitosamente'
      };

    } catch (error) {
      console.error('Error actualizando cliente:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Asignar proyecto a cliente
  assignProjectToClient: async (projectId, clientId, adminData) => {
    try {
      const projectRef = doc(db, 'proyectos', projectId);

      // Obtener datos del cliente
      const clientDoc = await getDoc(doc(db, 'usuarios', clientId));
      if (!clientDoc.exists()) {
        throw new Error('Cliente no encontrado');
      }

      const clientData = clientDoc.data();

      // Actualizar el proyecto con el clienteId
      await updateDoc(projectRef, {
        clienteId: clientId,
        clienteNombre: `${clientData.nombre} ${clientData.apellido}`,
        clienteCorreo: clientData.correo,
        clienteEmpresa: clientData.empresa || '',
        fechaAsignacion: serverTimestamp()
      });

      // Registrar actividad
      if (adminData) {
        await addDoc(collection(db, 'actividades'), {
          usuarioId: adminData.id,
          usuarioNombre: `${adminData.nombre} ${adminData.apellido}`,
          descripcion: 'Asignó un proyecto a un cliente',
          tareaModificada: `Cliente: ${clientData.nombre} ${clientData.apellido}`,
          proyectoId: projectId,
          fecha: serverTimestamp()
        });
      }

      return {
        success: true,
        message: 'Proyecto asignado exitosamente al cliente'
      };

    } catch (error) {
      console.error('Error asignando proyecto:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Obtener proyectos de un cliente
  getClientProjects: async (clientId) => {
    try {
      const projectsQuery = query(
        collection(db, 'proyectos'),
        where('clienteId', '==', clientId),
        orderBy('fecha_creacion', 'desc')
      );

      const snapshot = await getDocs(projectsQuery);

      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        projects
      };

    } catch (error) {
      console.error('Error obteniendo proyectos del cliente:', error);
      return {
        success: false,
        message: error.message,
        projects: []
      };
    }
  },

  // Obtener todos los proyectos (para admin)
  getAllProjects: async () => {
    try {
      const projectsQuery = query(
        collection(db, 'proyectos'),
        orderBy('fecha_creacion', 'desc')
      );

      const snapshot = await getDocs(projectsQuery);

      const projects = [];

      for (const docSnapshot of snapshot.docs) {
        const projectData = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        };

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

        projects.push(projectData);
      }

      return {
        success: true,
        projects
      };

    } catch (error) {
      console.error('Error obteniendo proyectos:', error);
      return {
        success: false,
        message: error.message,
        projects: []
      };
    }
  },

  // Remover asignación de cliente de un proyecto
  unassignClientFromProject: async (projectId, adminData) => {
    try {
      const projectRef = doc(db, 'proyectos', projectId);

      // Obtener datos del proyecto antes de remover
      const projectDoc = await getDoc(projectRef);
      const projectData = projectDoc.data();

      // Remover la asignación del cliente
      await updateDoc(projectRef, {
        clienteId: null,
        clienteNombre: null,
        clienteCorreo: null,
        clienteEmpresa: null,
        fechaDesasignacion: serverTimestamp()
      });

      // Registrar actividad
      if (adminData && projectData.clienteNombre) {
        await addDoc(collection(db, 'actividades'), {
          usuarioId: adminData.id,
          usuarioNombre: `${adminData.nombre} ${adminData.apellido}`,
          descripcion: 'Removió la asignación de cliente de un proyecto',
          tareaModificada: `Cliente: ${projectData.clienteNombre}`,
          proyectoId: projectId,
          fecha: serverTimestamp()
        });
      }

      return {
        success: true,
        message: 'Asignación de cliente removida exitosamente'
      };

    } catch (error) {
      console.error('Error removiendo asignación:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

export default firebaseAdminAPI;
