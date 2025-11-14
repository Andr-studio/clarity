// src/services/geminiService.js
import { httpsCallable, getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { auth } from '../firebase'; // ⬅️ IMPORTANTE: Importar auth
import app from '../firebase';

// Inicializar Functions
const functions = getFunctions(app);

// Configuración para emuladores (solo en desarrollo)
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('🔧 Conectado a Functions Emulator');
}

/**
 * Servicio para interactuar con Gemini AI a través de Firebase Functions
 */
const geminiService = {
  /**
   * Genera un resumen ejecutivo de proyectos usando Gemini AI
   * @param {Array} proyectos - Array de proyectos a analizar
   * @param {Object} options - Opciones adicionales para la generación
   * @returns {Promise<Object>} Respuesta con el resumen generado
   */
  generateProjectSummary: async (proyectos, options = {}) => {
    try {
      // ✅ CRÍTICO: Verificar autenticación ANTES de llamar la función
      const user = auth.currentUser;
      
      if (!user) {
        console.error('❌ No hay usuario autenticado');
        throw new Error('Debes estar autenticado para generar resúmenes con IA');
      }

      // Obtener token fresco para asegurar que esté actualizado
      await user.getIdToken(true);
      console.log('✅ Usuario autenticado:', user.uid);
      console.log('✅ Email:', user.email);

      // Preparar datos de proyectos
      const proyectosData = proyectos.map(p => ({
        id: p.id,
        name: p.nombre || p.name,
        status: p.estado || p.status,
        budget: p.presupuesto || p.budget,
        team: p.equipo || p.team,
        technologies: p.tecnologias || p.technologies,
        description: p.descripcion || p.description,
        progress: p.progreso || p.progress,
        startDate: p.fechaInicio || p.startDate,
        endDate: p.fechaFin || p.endDate
      }));

      console.log(`📤 Llamando a Cloud Function con ${proyectosData.length} proyectos...`);
      
      const generateSummary = httpsCallable(functions, 'generateProjectSummary');
      
      const result = await generateSummary({
        proyectos: proyectosData,
        options: {
          includeRecommendations: options.includeRecommendations ?? true,
          includeRisks: options.includeRisks ?? true,
          language: options.language || 'es',
          ...options
        }
      });

      console.log('✅ Respuesta recibida de Cloud Function');

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('❌ Error al generar resumen con Gemini:', error);
      
      // Manejar diferentes tipos de errores
      if (error.code === 'unauthenticated') {
        return {
          success: false,
          error: 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.'
        };
      }
      
      if (error.code === 'permission-denied') {
        return {
          success: false,
          error: 'No tienes permisos para usar esta función. Contacta al administrador.'
        };
      }

      if (error.code === 'unavailable') {
        return {
          success: false,
          error: 'El servicio de IA no está disponible en este momento. Inténtalo más tarde.'
        };
      }

      return {
        success: false,
        error: error.message || 'Error al conectar con el servicio de IA'
      };
    }
  },

  /**
   * Analiza un proyecto específico y proporciona insights
   * @param {Object} proyecto - Proyecto a analizar
   * @returns {Promise<Object>} Análisis del proyecto
   */
  analyzeProject: async (proyecto) => {
    try {
      // Verificar autenticación
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Debes estar autenticado para usar esta función');
      }

      await user.getIdToken(true);
      console.log('✅ Usuario autenticado para análisis:', user.uid);

      const analyzeProject = httpsCallable(functions, 'analyzeProject');
      
      const result = await analyzeProject({
        proyecto: {
          id: proyecto.id,
          name: proyecto.nombre || proyecto.name,
          status: proyecto.estado || proyecto.status,
          budget: proyecto.presupuesto || proyecto.budget,
          team: proyecto.equipo || proyecto.team,
          technologies: proyecto.tecnologias || proyecto.technologies,
          description: proyecto.descripcion || proyecto.description,
          startDate: proyecto.fechaInicio || proyecto.startDate,
          endDate: proyecto.fechaFin || proyecto.endDate
        }
      });

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('❌ Error al analizar proyecto:', error);
      
      if (error.code === 'unauthenticated') {
        return {
          success: false,
          error: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        };
      }

      return {
        success: false,
        error: error.message || 'Error al analizar el proyecto'
      };
    }
  },

  /**
   * Genera recomendaciones para mejorar un proyecto
   * @param {Object} proyecto - Proyecto para el cual generar recomendaciones
   * @returns {Promise<Object>} Recomendaciones generadas
   */
  getRecommendations: async (proyecto) => {
    try {
      // Verificar autenticación
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Debes estar autenticado para usar esta función');
      }

      await user.getIdToken(true);
      console.log('✅ Usuario autenticado para recomendaciones:', user.uid);

      const getRecommendations = httpsCallable(functions, 'getProjectRecommendations');
      
      const result = await getRecommendations({
        proyecto: {
          id: proyecto.id,
          name: proyecto.nombre || proyecto.name,
          status: proyecto.estado || proyecto.status,
          budget: proyecto.presupuesto || proyecto.budget,
          team: proyecto.equipo || proyecto.team,
          technologies: proyecto.tecnologias || proyecto.technologies
        }
      });

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('❌ Error al obtener recomendaciones:', error);
      
      if (error.code === 'unauthenticated') {
        return {
          success: false,
          error: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        };
      }

      return {
        success: false,
        error: error.message || 'Error al obtener recomendaciones'
      };
    }
  },

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean} True si hay un usuario autenticado
   */
  isAuthenticated: () => {
    return auth.currentUser !== null;
  },

  /**
   * Obtiene información del usuario actual
   * @returns {Object|null} Información del usuario o null
   */
  getCurrentUser: () => {
    const user = auth.currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    };
  }
};

export default geminiService;