// functions/index.js - COMPATIBLE CON FIREBASE FUNCTIONS V2
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Cargar variables de entorno desde .env
require('dotenv').config();

// Inicializar Gemini AI
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY no está configurada');
  throw new Error('GEMINI_API_KEY es requerida');
}

console.log('✅ Gemini API Key configurada');
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Función para generar un resumen ejecutivo de proyectos usando Gemini AI
 * NOTA: Usando Firebase Functions V2
 */
exports.generateProjectSummary = onCall(async (request) => {
  try {
    // En Functions v2, los datos vienen en request.data y auth en request.auth
    console.log('🔍 === DEBUGGING AUTH EN CLOUD FUNCTION V2 ===');
    console.log('1️⃣ Request.auth existe:', !!request.auth);
    console.log('2️⃣ Request.auth.uid:', request.auth?.uid);
    console.log('3️⃣ Request.data keys:', Object.keys(request.data || {}));
    console.log('4️⃣ Request.data.proyectos length:', request.data?.proyectos?.length);
    console.log('=====================');
    
    // TEMPORALMENTE: Permitir sin autenticación para diagnóstico
    if (!request.auth) {
      console.warn('⚠️ MODO DIAGNÓSTICO: Permitiendo acceso sin autenticación');
      console.warn('⚠️ ESTO ES INSEGURO - SOLO PARA TESTING');
    } else {
      console.log('✅ Usuario autenticado:', request.auth.uid);
    }

    // En Functions v2, acceder a los datos desde request.data
    const { proyectos, options = {} } = request.data;
    
    console.log('5️⃣ Proyectos extraídos:', proyectos ? proyectos.length : 'undefined');

    // Validar que hay proyectos
    if (!proyectos || !Array.isArray(proyectos) || proyectos.length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'Debe proporcionar al menos un proyecto para analizar'
      );
    }

    console.log(`📊 Procesando ${proyectos.length} proyectos...`);

    // Construir el prompt para Gemini
    const prompt = buildSummaryPrompt(proyectos, options);

    console.log('🤖 Llamando a Gemini AI...');

    // Llamar a Gemini AI con el modelo actualizado
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    console.log('✅ Respuesta de Gemini recibida');

    // Parsear y estructurar la respuesta
    const structuredSummary = parseGeminiResponse(summary);

    return {
      success: true,
      summary: structuredSummary,
      raw: summary,
      timestamp: new Date().toISOString(),
      projectCount: proyectos.length
    };

  } catch (error) {
    console.error('❌ Error en generateProjectSummary:', error);
    console.error('Error tipo:', error.constructor.name);
    console.error('Error código:', error.code);
    console.error('Error mensaje:', error.message);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      'internal',
      'Error al generar el resumen: ' + error.message
    );
  }
});

/**
 * Función para analizar un proyecto específico con resumen ejecutivo completo
 */
exports.analyzeProject = onCall(async (request) => {
  try {
    if (!request.auth) {
      console.warn('⚠️ MODO DIAGNÓSTICO: Permitiendo acceso sin autenticación');
    }

    const { proyecto, includeRecommendations = true, includeRisks = true } = request.data;

    if (!proyecto) {
      throw new HttpsError(
        'invalid-argument',
        'Debe proporcionar un proyecto para analizar'
      );
    }

    console.log(`📊 Analizando proyecto: ${proyecto.name}`);

    const prompt = buildSingleProjectAnalysisPrompt(proyecto, { includeRecommendations, includeRisks });
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    console.log('✅ Análisis de Gemini completado');

    return {
      success: true,
      summary: parseSingleProjectAnalysis(analysis),
      raw: analysis,
      timestamp: new Date().toISOString(),
      projectName: proyecto.name
    };

  } catch (error) {
    console.error('Error en analyzeProject:', error);
    throw new HttpsError(
      'internal',
      'Error al analizar el proyecto: ' + error.message
    );
  }
});

/**
 * Función para obtener recomendaciones de un proyecto
 */
exports.getProjectRecommendations = onCall(async (request) => {
  try {
    if (!request.auth) {
      console.warn('⚠️ MODO DIAGNÓSTICO: Permitiendo acceso sin autenticación');
    }

    const { proyecto } = request.data;

    if (!proyecto) {
      throw new HttpsError(
        'invalid-argument',
        'Debe proporcionar un proyecto'
      );
    }

    const prompt = buildRecommendationsPrompt(proyecto);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recommendations = response.text();

    return {
      success: true,
      recommendations: parseRecommendations(recommendations),
      raw: recommendations,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error en getProjectRecommendations:', error);
    throw new HttpsError(
      'internal',
      'Error al obtener recomendaciones: ' + error.message
    );
  }
});

// ============================================
// HELPER FUNCTIONS - Construcción de Prompts
// ============================================

function buildSummaryPrompt(proyectos, options) {
  const { includeRecommendations, includeRisks } = options;

  let prompt = `Eres un analista de proyectos experto. Analiza los siguientes ${proyectos.length} proyectos y proporciona un resumen ejecutivo conciso en español, enfocándote en lo más relevante:\n\n`;

  proyectos.forEach((proyecto, index) => {
    prompt += `PROYECTO ${index + 1}: ${proyecto.name}\n`;
    prompt += `- Estado: ${proyecto.status}\n`;
    prompt += `- Presupuesto: ${proyecto.budget}\n`;
    prompt += `- Equipo: ${Array.isArray(proyecto.team) ? proyecto.team.length : 0} miembros\n`;
    prompt += `- Tecnologías: ${Array.isArray(proyecto.technologies) ? proyecto.technologies.join(', ') : 'N/A'}\n`;
    prompt += `- Descripción: ${proyecto.description || 'Sin descripción'}\n\n`;
  });

  prompt += `\nPor favor proporciona:\n`;
  prompt += `1. RESUMEN GENERAL: Un overview del estado general de los proyectos\n`;
  prompt += `2. ESTADÍSTICAS CLAVE: Número de proyectos activos, completados, en riesgo, etc.\n`;
  prompt += `3. ANÁLISIS DE RECURSOS: Estado de asignación de presupuesto y equipo\n`;
  prompt += `4. PROGRESO: Tendencias de avance y predicciones\n`;
  
  if (includeRecommendations) {
    prompt += `5. RECOMENDACIONES: 1-3 acciones prioritarias para mejorar\n`;
  }
  
  if (includeRisks) {
    prompt += `6. RIESGOS IDENTIFICADOS: Principales riesgos y cómo mitigarlos\n`;
  }

  prompt += `\nFormato la respuesta con secciones claras y datos concretos.`;
  
  return prompt;
}

function buildProjectAnalysisPrompt(proyecto) {
  return `Analiza en profundidad el siguiente proyecto y proporciona insights detallados:

PROYECTO: ${proyecto.name}
Estado: ${proyecto.status}
Presupuesto: ${proyecto.budget}
Equipo: ${Array.isArray(proyecto.team) ? proyecto.team.length : 0} miembros
Tecnologías: ${Array.isArray(proyecto.technologies) ? proyecto.technologies.join(', ') : 'N/A'}
Descripción: ${proyecto.description || 'Sin descripción'}

Proporciona un análisis completo que incluya:
1. Viabilidad del proyecto
2. Predicción de éxito
3. Cuellos de botella potenciales
4. Oportunidades de mejora
5. Siguientes pasos recomendados

Sé específico y basa tus conclusiones en los datos proporcionados.`;
}

function buildSingleProjectAnalysisPrompt(proyecto, { includeRecommendations, includeRisks }) {
  let prompt = `Eres un asesor de negocios experto. Tu cliente es un empresario que NO es técnico y necesita entender claramente su proyecto de desarrollo de software.

Analiza este proyecto y explícale TODO en términos simples de negocios:

DATOS DEL PROYECTO:
- Nombre: ${proyecto.name}
- Descripción: ${proyecto.description || 'Sin descripción'}
- Estado actual: ${proyecto.status}
- Presupuesto: ${proyecto.budget}
- Tamaño del equipo: ${Array.isArray(proyecto.team) ? proyecto.team.length : 0} personas
- Tecnologías usadas: ${Array.isArray(proyecto.technologies) ? proyecto.technologies.join(', ') : 'N/A'}

IMPORTANTE: Responde en formato JSON ESTRICTO. Tu respuesta DEBE ser un objeto JSON válido con esta estructura exacta:

{
  "resumen": "texto del resumen ejecutivo aquí",
  "estadisticas": "texto de las estadísticas aquí",
  "recursos": "texto del análisis de recursos aquí",
  "progreso": "texto del progreso y tendencias aquí",
  "recomendaciones": [
    {
      "titulo": "¿Qué debe hacer?",
      "impacto": "¿Cómo le beneficia?",
      "accion": "Pasos específicos"
    }
  ],
  "riesgos": [
    {
      "pregunta": "¿Qué podría salir mal?",
      "gravedad": "Alto/Medio/Bajo",
      "prevencion": "¿Cómo evitarlo?"
    }
  ]
}

INSTRUCCIONES ESPECÍFICAS:

1. RESUMEN EJECUTIVO:
Explica al cliente en 3-4 oraciones simples:
- Qué busca lograr su proyecto "${proyecto.name}"
- En qué etapa está ahora (${proyecto.status})
- Cuánto está invirtiendo (${proyecto.budget})
- Con cuántas personas trabaja (${Array.isArray(proyecto.team) ? proyecto.team.length : 0} miembros del equipo)
Escribe como si le explicaras a un amigo empresario que no sabe de tecnología.

2. ESTADÍSTICAS CLAVE:
Dale al cliente 4 datos claros separados por saltos de línea:
- En qué fase está: ${proyecto.status}
- Qué tan arriesgado es: (Bajo/Medio/Alto riesgo)
- Qué % está completo: (ej: 75% avanzado)
- Un dato importante que deba saber ahora
Evita jerga técnica.

3. ANÁLISIS DE RECURSOS:
Explica en 2-3 oraciones:
- Su presupuesto de ${proyecto.budget} - ¿es suficiente?
- Su equipo de ${Array.isArray(proyecto.team) ? proyecto.team.length : 0} personas - ¿es el tamaño adecuado?
- Las herramientas (${Array.isArray(proyecto.technologies) ? proyecto.technologies.join(', ') : 'N/A'}) - ¿son las correctas?

4. PROGRESO Y TENDENCIAS:
Explica en 2-3 oraciones:
- ¿Va a tiempo?
- ¿Qué debería ver en las próximas semanas?
- ¿Qué tan probable es que termine exitosamente?
`;

  if (includeRecommendations) {
    prompt += `
5. RECOMENDACIONES (Array de 3 objetos):
Dame EXACTAMENTE 3 recomendaciones. Cada objeto debe tener:
- "titulo": ¿Qué debe hacer? (pregunta simple)
- "impacto": ¿Cómo le beneficia a su negocio?
- "accion": Pasos específicos que puede dar esta semana

La TERCERA recomendación DEBE ser sobre marketing/promoción de la app.
`;
  }

  if (includeRisks) {
    prompt += `
6. RIESGOS (Array de 3-5 objetos):
Dame entre 3 y 5 riesgos. Cada objeto debe tener:
- "pregunta": ¿Qué podría salir mal? (pregunta clara)
- "gravedad": "Alto", "Medio" o "Bajo"
- "prevencion": ¿Cómo evitarlo? (pasos concretos)

Habla de impacto en el NEGOCIO (dinero, tiempo, clientes) no de código.
`;
  }

  prompt += `

RECORDATORIO FINAL:
- Responde SOLO con JSON válido, sin texto adicional antes o después
- NO uses términos técnicos como "API", "backend", "framework"
- Enfócate en: ¿Va bien? ¿Qué hago? ¿Cuánto cuesta? ¿Cuándo termina?
- Sé directo y honesto
- ASEGÚRATE de que el JSON sea válido y pueda ser parseado`;

  return prompt;
}

function buildRecommendationsPrompt(proyecto) {
  return `Genera recomendaciones específicas y accionables para mejorar el siguiente proyecto:

PROYECTO: ${proyecto.name}
Estado: ${proyecto.status}
Presupuesto: ${proyecto.budget}
Equipo: ${Array.isArray(proyecto.team) ? proyecto.team.length : 0} miembros
Tecnologías: ${Array.isArray(proyecto.technologies) ? proyecto.technologies.join(', ') : 'N/A'}

Proporciona 1-3 recomendaciones priorizadas que incluyan:
- Acción específica
- Impacto esperado (Alto/Medio/Bajo)
- Complejidad de implementación (Alta/Media/Baja)
- Tiempo estimado de implementación

Las recomendaciones deben ser prácticas y realizables.`;
}

// ============================================
// HELPER FUNCTIONS - Parseo de Respuestas
// ============================================

function parseGeminiResponse(text) {
  const sections = {
    resumen: extractSection(text, ['RESUMEN GENERAL', 'RESUMEN', 'OVERVIEW']),
    estadisticas: extractSection(text, ['ESTADÍSTICAS CLAVE', 'ESTADÍSTICAS', 'MÉTRICAS']),
    recursos: extractSection(text, ['ANÁLISIS DE RECURSOS', 'RECURSOS']),
    progreso: extractSection(text, ['PROGRESO', 'AVANCE']),
    recomendaciones: extractSection(text, ['RECOMENDACIONES', 'ACCIONES']),
    riesgos: extractSection(text, ['RIESGOS', 'RIESGOS IDENTIFICADOS'])
  };

  return {
    ...sections,
    fullText: text
  };
}

function parseProjectAnalysis(text) {
  return {
    viabilidad: extractSection(text, ['VIABILIDAD', 'ANÁLISIS DE VIABILIDAD']),
    prediccion: extractSection(text, ['PREDICCIÓN', 'ÉXITO']),
    cuellosBotella: extractSection(text, ['CUELLOS DE BOTELLA', 'PROBLEMAS']),
    oportunidades: extractSection(text, ['OPORTUNIDADES']),
    siguientesPasos: extractSection(text, ['SIGUIENTE PASOS', 'PRÓXIMOS PASOS', 'ACCIONES']),
    fullText: text
  };
}

function parseSingleProjectAnalysis(text) {
  try {
    // Intentar parsear como JSON primero
    // Limpiar posibles bloques de código markdown
    let cleanedText = text.trim();
    
    // Remover bloques de código si existen
    cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // Intentar parsear el JSON
    const jsonData = JSON.parse(cleanedText);
    
    // Si el parseo fue exitoso, formatear las recomendaciones y riesgos
    return {
      resumen: jsonData.resumen || null,
      estadisticas: jsonData.estadisticas || null,
      recursos: jsonData.recursos || null,
      progreso: jsonData.progreso || null,
      recomendaciones: formatRecommendations(jsonData.recomendaciones),
      riesgos: formatRisks(jsonData.riesgos),
      fullText: text,
      structured: true
    };
  } catch (error) {
    console.warn('⚠️ No se pudo parsear JSON, usando método de extracción por secciones:', error.message);
    
    // Fallback al método anterior si el JSON falla
    const extractSpecificSection = (text, sectionNumber, nextSectionNumber) => {
      const pattern = new RegExp(
        `${sectionNumber}\\.\\s*[^:]+:([\\s\\S]*?)(?=${nextSectionNumber}\\.|$)`,
        'i'
      );
      const match = text.match(pattern);
      return match ? match[1].trim() : null;
    };

    const sections = {
      resumen: extractSpecificSection(text, '1', '2'),
      estadisticas: extractSpecificSection(text, '2', '3'),
      recursos: extractSpecificSection(text, '3', '4'),
      progreso: extractSpecificSection(text, '4', '5'),
      recomendaciones: extractSpecificSection(text, '5', '6'),
      riesgos: extractSpecificSection(text, '6', '7')
    };

    return {
      ...sections,
      fullText: text,
      structured: false
    };
  }
}

function formatRecommendations(recsArray) {
  if (!recsArray || !Array.isArray(recsArray)) return null;
  
  return recsArray.map((rec, index) => {
    return `Recomendación ${index + 1}:\n${rec.titulo}\n\nImpacto: ${rec.impacto}\n\nAcción: ${rec.accion}`;
  }).join('\n\n---\n\n');
}

function formatRisks(risksArray) {
  if (!risksArray || !Array.isArray(risksArray)) return null;
  
  return risksArray.map(risk => {
    return `${risk.pregunta}\n\n**Gravedad:** ${risk.gravedad}\n\n**Prevención:** ${risk.prevencion}`;
  }).join('\n\n---\n\n');
}

function parseRecommendations(text) {
  const recommendations = [];
  const lines = text.split('\n');
  
  let currentRec = null;
  
  for (const line of lines) {
    if (/^[\d\*\-\•]/.test(line.trim())) {
      if (currentRec) {
        recommendations.push(currentRec);
      }
      currentRec = {
        text: line.replace(/^[\d\*\-\•\)\.]+ */, '').trim(),
        impact: extractImpact(line),
        complexity: extractComplexity(line)
      };
    } else if (currentRec && line.trim()) {
      currentRec.text += ' ' + line.trim();
    }
  }
  
  if (currentRec) {
    recommendations.push(currentRec);
  }

  return {
    items: recommendations,
    fullText: text
  };
}

function extractSection(text, keywords) {
  for (const keyword of keywords) {
    // Intentar con diferentes patrones de regex
    const patterns = [
      // Patrón con número y punto (ej: "1. RESUMEN GENERAL:")
      new RegExp(`\\d+\\.\\s*${keyword}[:\\s]([\\s\\S]*?)(?=\\n\\d+\\.\\s*[A-ZÁÉÍÓÚÑ]|$)`, 'i'),
      // Patrón con dos asteriscos (ej: "**RESUMEN GENERAL:**")
      new RegExp(`\\*\\*${keyword}[:\\*\\s]+([\\s\\S]*?)(?=\\n\\*\\*[A-ZÁÉÍÓÚÑ]|$)`, 'i'),
      // Patrón simple con dos puntos (ej: "RESUMEN GENERAL:")
      new RegExp(`${keyword}[:\\s]([\\s\\S]*?)(?=\\n[\\d\\.]+\\s+[A-ZÁÉÍÓÚÑ]|\\n\\*\\*[A-ZÁÉÍÓÚÑ]|$)`, 'i'),
      // Patrón con hashtags (ej: "## RESUMEN GENERAL")
      new RegExp(`##?\\s*${keyword}[:\\s]*([\\s\\S]*?)(?=\\n##?\\s*[A-ZÁÉÍÓÚÑ]|$)`, 'i')
    ];
    
    for (const regex of patterns) {
      const match = text.match(regex);
      if (match && match[1]) {
        let content = match[1].trim();
        // Limpiar asteriscos al inicio si existen
        content = content.replace(/^\*\*\s*/, '');
        if (content.length > 0) {
          return content;
        }
      }
    }
  }
  return null;
}

function extractImpact(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('alto') || lowerText.includes('high')) return 'Alto';
  if (lowerText.includes('medio') || lowerText.includes('medium')) return 'Medio';
  if (lowerText.includes('bajo') || lowerText.includes('low')) return 'Bajo';
  return 'Medio';
}

function extractComplexity(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('compleja') || lowerText.includes('alta') || lowerText.includes('difícil')) return 'Alta';
  if (lowerText.includes('media') || lowerText.includes('moderada')) return 'Media';
  if (lowerText.includes('baja') || lowerText.includes('simple') || lowerText.includes('fácil')) return 'Baja';
  return 'Media';
}