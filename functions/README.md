# Firebase Cloud Functions - Gemini AI Integration

Este directorio contiene las Cloud Functions de Firebase que integran Gemini AI para generar resúmenes y análisis de proyectos.

## 📁 Estructura

```
functions/
├── index.js           # Funciones principales
├── package.json       # Dependencias
├── test.js           # Script de pruebas
└── .gitignore        # Archivos a ignorar
```

## 🔧 Funciones Disponibles

### 1. `generateProjectSummary`
Genera un resumen ejecutivo completo de múltiples proyectos.

**Parámetros:**
```javascript
{
  proyectos: [
    {
      name: string,
      status: string,
      budget: string,
      team: string[],
      technologies: string[],
      description: string
    }
  ],
  options: {
    includeRecommendations: boolean,
    includeRisks: boolean,
    language: string  // 'es' o 'en'
  }
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  summary: {
    resumen: string,
    estadisticas: string,
    recursos: string,
    progreso: string,
    recomendaciones: string,
    riesgos: string,
    fullText: string
  },
  projectCount: number,
  timestamp: string
}
```

### 2. `analyzeProject`
Analiza un proyecto específico en profundidad.

**Parámetros:**
```javascript
{
  proyecto: {
    name: string,
    status: string,
    budget: string,
    team: string[],
    technologies: string[],
    description: string
  }
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  analysis: {
    viabilidad: string,
    prediccion: string,
    cuellosBotella: string,
    oportunidades: string,
    siguientesPasos: string,
    fullText: string
  },
  timestamp: string
}
```

### 3. `getProjectRecommendations`
Obtiene recomendaciones específicas para un proyecto.

**Parámetros:**
```javascript
{
  proyecto: {
    name: string,
    status: string,
    budget: string,
    team: string[],
    technologies: string[]
  }
}
```

**Respuesta:**
```javascript
{
  success: boolean,
  recommendations: {
    items: [
      {
        text: string,
        impact: 'Alto' | 'Medio' | 'Bajo',
        complexity: 'Alta' | 'Media' | 'Baja'
      }
    ],
    fullText: string
  },
  timestamp: string
}
```

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar API Key de Gemini
firebase functions:config:set gemini.apikey="TU_API_KEY"

# Desplegar
firebase deploy --only functions
```

## 🧪 Pruebas

Para probar localmente con el emulador:

```bash
# Iniciar emuladores
firebase emulators:start

# En otra terminal, ejecutar pruebas
node test.js
```

## 📊 Monitoreo

Ver logs en tiempo real:
```bash
firebase functions:log
```

Ver logs de una función específica:
```bash
firebase functions:log --only generateProjectSummary
```

## 🔐 Seguridad

- ✅ Requiere autenticación para todas las funciones
- ✅ API Key de Gemini protegida en el servidor
- ✅ Validación de datos de entrada
- ✅ Manejo de errores robusto

## 💰 Estimación de Costos

Para 1000 usuarios activos por mes:
- ~3,000 invocaciones/mes
- ~0.5 segundos por invocación
- **Costo estimado**: $0 (dentro del plan gratuito)

Para empresas más grandes, considera el plan Blaze de Firebase.

## 🐛 Debugging

Si una función falla:

1. Revisa los logs:
```bash
firebase functions:log --only NOMBRE_FUNCION
```

2. Verifica la configuración:
```bash
firebase functions:config:get
```

3. Prueba localmente con emuladores

## 📝 Variables de Configuración

```bash
# Ver todas las configuraciones
firebase functions:config:get

# Configurar Gemini API Key
firebase functions:config:set gemini.apikey="YOUR_KEY"

# Eliminar una configuración
firebase functions:config:unset gemini.apikey
```

## 🔄 Actualización

Para actualizar las funciones:

```bash
# Modificar index.js según necesites
# Luego desplegar
firebase deploy --only functions
```

Para actualizar solo una función:
```bash
firebase deploy --only functions:generateProjectSummary
```

## 📚 Recursos

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Gemini AI Docs](https://ai.google.dev/docs)
- [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai)

## ⚠️ Notas Importantes

1. **API Key**: Nunca expongas tu API Key de Gemini en el código del cliente
2. **Rate Limits**: Gemini tiene límites de requests por minuto (60 en plan gratuito)
3. **Timeout**: Las Cloud Functions tienen un timeout de 60 segundos por defecto
4. **Cold Start**: La primera invocación puede ser más lenta (~2-3 segundos)

## 🎯 Mejoras Futuras

- [ ] Agregar caché para respuestas similares
- [ ] Implementar retry logic para errores temporales
- [ ] Añadir métricas personalizadas
- [ ] Soporte para múltiples idiomas
- [ ] Análisis de hitos y actividades
- [ ] Generación de reportes PDF con los análisis

## 📞 Soporte

Si encuentras algún problema, revisa:
1. Los logs de Firebase Functions
2. La configuración de la API Key
3. El estado de los servicios de Google AI
4. Los límites de tu plan de Firebase

---

**Última actualización**: Octubre 2024
