// src/services/api.js
// Adaptador para transición gradual de Python Backend a Firebase

import { authAPI } from './firebaseAuth';
import firebaseProjectsAPI from './firebaseProjects';
import firebaseMilestonesAPI from './firebaseMillestones';
import firebaseActivitiesAPI from './firebaseActivities';
import firebaseUsersAPI from './firebaseUsers';
import firebaseCommentsAPI from './firebaseComments';
import firebaseDocumentationAPI from './firebaseDocumentation';
import firebaseMeetingsAPI from './firebaseMeetings';
import firebaseStorageAPI from './firebaseStorage';

// Configuración
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true' || true; // Por defecto usar Firebase
const PYTHON_API_URL = 'http://localhost:5000/api';

// =====================================================
// HELPER FUNCTIONS
// =====================================================
const handlePythonResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error en la petición');
  }
  
  return data;
};

// =====================================================
// AUTHENTICATION - Siempre usar Firebase
// =====================================================
export const authenticationAPI = {
  login: authAPI.login,
  register: authAPI.register,
  logout: authAPI.logout,
  resetPassword: authAPI.resetPassword,
  getCurrentUser: authAPI.getCurrentUser,
  isAuthenticated: authAPI.isAuthenticated
};

// =====================================================
// USUARIOS
// =====================================================
export const usuariosAPI = USE_FIREBASE ? firebaseUsersAPI : {
  getAll: async () => {
    const response = await fetch(`${PYTHON_API_URL}/usuarios`);
    return handlePythonResponse(response);
  },

  getTeam: async () => {
    const response = await fetch(`${PYTHON_API_URL}/usuarios/team`);
    return handlePythonResponse(response);
  },

  getById: async (userId) => {
    const response = await fetch(`${PYTHON_API_URL}/usuarios/${userId}`);
    return handlePythonResponse(response);
  }
};

// =====================================================
// PROYECTOS
// =====================================================
export const proyectosAPI = USE_FIREBASE ? firebaseProjectsAPI : {
  getAll: async (userId = null, userRol = null) => {
    let url = `${PYTHON_API_URL}/proyectos`;
    
    if (userId && userRol) {
      url += `?user_id=${userId}&user_rol=${userRol}`;
    }
    
    const response = await fetch(url);
    return handlePythonResponse(response);
  },

  getById: async (proyectoId) => {
    const response = await fetch(`${PYTHON_API_URL}/proyectos/${proyectoId}`);
    return handlePythonResponse(response);
  },

  create: async (proyectoData) => {
    const response = await fetch(`${PYTHON_API_URL}/proyectos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proyectoData),
    });
    return handlePythonResponse(response);
  }
};

// =====================================================
// HITOS
// =====================================================
export const hitosAPI = USE_FIREBASE ? firebaseMilestonesAPI : {
  getAll: async (proyectoId = null) => {
    const url = proyectoId 
      ? `${PYTHON_API_URL}/hitos?proyecto_id=${proyectoId}`
      : `${PYTHON_API_URL}/hitos`;
    const response = await fetch(url);
    return handlePythonResponse(response);
  },

  create: async (hitoData) => {
    const response = await fetch(`${PYTHON_API_URL}/hitos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hitoData),
    });
    return handlePythonResponse(response);
  },

  update: async (hitoId, hitoData) => {
    const response = await fetch(`${PYTHON_API_URL}/hitos/${hitoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hitoData),
    });
    return handlePythonResponse(response);
  }
};

// =====================================================
// COMENTARIOS - Ahora usa Firebase
// =====================================================
export const comentariosAPI = USE_FIREBASE ? firebaseCommentsAPI : {
  getByHito: async (hitoId) => {
    const response = await fetch(`${PYTHON_API_URL}/comentarios/${hitoId}`);
    return handlePythonResponse(response);
  },

  create: async (comentarioData) => {
    const response = await fetch(`${PYTHON_API_URL}/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comentarioData),
    });
    return handlePythonResponse(response);
  }
};

// =====================================================
// ACTIVIDADES
// =====================================================
export const actividadesAPI = USE_FIREBASE ? firebaseActivitiesAPI : {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.proyecto_id) params.append('proyecto_id', filters.proyecto_id);
    if (filters.usuario_id) params.append('usuario_id', filters.usuario_id);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await fetch(`${PYTHON_API_URL}/actividades?${params}`);
    return handlePythonResponse(response);
  }
};

// =====================================================
// ESTADÍSTICAS
// =====================================================
export const estadisticasAPI = USE_FIREBASE ? {
  getDashboard: async () => {
    // Implementar con Firebase
    return {
      total_proyectos: 0,
      total_team: 0,
      progreso_promedio: 0,
      hitos_completados: 0,
      total_hitos: 0
    };
  }
} : {
  getDashboard: async () => {
    const response = await fetch(`${PYTHON_API_URL}/estadisticas/dashboard`);
    return handlePythonResponse(response);
  }
};

// =====================================================
// DOCUMENTACIÓN DE PROYECTOS
// =====================================================
export const documentacionAPI = USE_FIREBASE ? {
  ...firebaseDocumentationAPI,
  // Métodos de aprobación/rechazo
  approve: firebaseDocumentationAPI.approve,
  reject: firebaseDocumentationAPI.reject
} : {
  getAll: async (proyectoId) => {
    const response = await fetch(`${PYTHON_API_URL}/proyectos/${proyectoId}/documentacion`);
    return handlePythonResponse(response);
  },

  getById: async (proyectoId, documentoId) => {
    const response = await fetch(`${PYTHON_API_URL}/proyectos/${proyectoId}/documentacion/${documentoId}`);
    return handlePythonResponse(response);
  },

  create: async (proyectoId, documentoData, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('titulo', documentoData.titulo);
    formData.append('descripcion', documentoData.descripcion || '');
    formData.append('usuarioId', documentoData.usuarioId);

    const response = await fetch(`${PYTHON_API_URL}/proyectos/${proyectoId}/documentacion`, {
      method: 'POST',
      body: formData,
    });
    return handlePythonResponse(response);
  },

  delete: async (proyectoId, documentoId) => {
    const response = await fetch(`${PYTHON_API_URL}/proyectos/${proyectoId}/documentacion/${documentoId}`, {
      method: 'DELETE',
    });
    return handlePythonResponse(response);
  },

  approve: async (proyectoId, documentoId) => {
    const response = await fetch(`${PYTHON_API_URL}/proyectos/${proyectoId}/documentacion/${documentoId}/approve`, {
      method: 'POST',
    });
    return handlePythonResponse(response);
  },

  reject: async (proyectoId, documentoId, motivoRechazo) => {
    const response = await fetch(`${PYTHON_API_URL}/proyectos/${proyectoId}/documentacion/${documentoId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ motivoRechazo }),
    });
    return handlePythonResponse(response);
  }
};

// =====================================================
// REUNIONES
// =====================================================
export const reunionesAPI = USE_FIREBASE ? firebaseMeetingsAPI : {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.adminId) params.append('adminId', filters.adminId);
    if (filters.clienteId) params.append('clienteId', filters.clienteId);
    if (filters.estado) params.append('estado', filters.estado);

    const response = await fetch(`${PYTHON_API_URL}/reuniones?${params}`);
    return handlePythonResponse(response);
  },

  getById: async (reunionId) => {
    const response = await fetch(`${PYTHON_API_URL}/reuniones/${reunionId}`);
    return handlePythonResponse(response);
  },

  create: async (reunionData) => {
    const response = await fetch(`${PYTHON_API_URL}/reuniones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reunionData),
    });
    return handlePythonResponse(response);
  },

  accept: async (reunionId) => {
    const response = await fetch(`${PYTHON_API_URL}/reuniones/${reunionId}/accept`, {
      method: 'POST',
    });
    return handlePythonResponse(response);
  },

  reject: async (reunionId, observacion, fechaAlternativa = null) => {
    const response = await fetch(`${PYTHON_API_URL}/reuniones/${reunionId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ observacion, fechaAlternativa }),
    });
    return handlePythonResponse(response);
  },

  delete: async (reunionId) => {
    const response = await fetch(`${PYTHON_API_URL}/reuniones/${reunionId}`, {
      method: 'DELETE',
    });
    return handlePythonResponse(response);
  },

  getPendingByCliente: async (clienteId) => {
    const response = await fetch(`${PYTHON_API_URL}/reuniones/cliente/${clienteId}/pendientes`);
    return handlePythonResponse(response);
  },

  getByAdmin: async (adminId) => {
    const response = await fetch(`${PYTHON_API_URL}/reuniones/admin/${adminId}`);
    return handlePythonResponse(response);
  }
};

// =====================================================
// STORAGE
// =====================================================
export const storageAPI = USE_FIREBASE ? firebaseStorageAPI : {
  uploadFile: async (file, path) => {
    // Implementación placeholder para backend Python
    throw new Error('Storage no implementado para backend Python');
  },
  getFileUrl: async (path) => {
    throw new Error('Storage no implementado para backend Python');
  },
  deleteFile: async (path) => {
    throw new Error('Storage no implementado para backend Python');
  }
};

// =====================================================
// EXPORT DEFAULT - Mantener compatibilidad
// =====================================================
const API = {
  auth: authenticationAPI,
  usuarios: usuariosAPI,
  proyectos: proyectosAPI,
  hitos: hitosAPI,
  milestones: hitosAPI, // Alias para compatibilidad
  comentarios: comentariosAPI,
  actividades: actividadesAPI,
  estadisticas: estadisticasAPI,
  documentacion: documentacionAPI,
  reuniones: reunionesAPI,
  storage: storageAPI
};

export default API;