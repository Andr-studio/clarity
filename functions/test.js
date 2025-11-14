// functions/test.js
// Script para probar las funciones localmente

const admin = require('firebase-admin');
const functions = require('firebase-functions-test')();

// Inicializar con credenciales de prueba
const serviceAccount = require('./serviceAccountKey.json'); // Debes descargar esto de Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const myFunctions = require('./index');

// Datos de prueba
const testProjects = [
  {
    name: 'Proyecto Alpha',
    status: 'En Progreso',
    budget: '$50,000',
    team: ['Juan Pérez', 'María García', 'Carlos López'],
    technologies: ['React', 'Node.js', 'Firebase'],
    description: 'Plataforma web de gestión empresarial'
  },
  {
    name: 'Proyecto Beta',
    status: 'Completado',
    budget: '$30,000',
    team: ['Ana Martínez', 'Luis Rodríguez'],
    technologies: ['Vue.js', 'Python', 'PostgreSQL'],
    description: 'Sistema de inventario automatizado'
  },
  {
    name: 'Proyecto Gamma',
    status: 'Planificación',
    budget: '$75,000',
    team: ['Pedro Sánchez', 'Laura Fernández', 'Diego Torres', 'Carmen Ruiz'],
    technologies: ['Angular', 'Java', 'MongoDB'],
    description: 'Aplicación móvil para seguimiento de salud'
  }
];

// Test de generateProjectSummary
async function testGenerateSummary() {
  console.log('\n🧪 Probando generateProjectSummary...\n');
  
  try {
    const result = await myFunctions.generateProjectSummary({
      proyectos: testProjects,
      options: {
        includeRecommendations: true,
        includeRisks: true,
        language: 'es'
      }
    }, {
      auth: { uid: 'test-user-123' }
    });

    console.log('✅ Resultado:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test de analyzeProject
async function testAnalyzeProject() {
  console.log('\n🧪 Probando analyzeProject...\n');
  
  try {
    const result = await myFunctions.analyzeProject({
      proyecto: testProjects[0]
    }, {
      auth: { uid: 'test-user-123' }
    });

    console.log('✅ Resultado:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test de getProjectRecommendations
async function testGetRecommendations() {
  console.log('\n🧪 Probando getProjectRecommendations...\n');
  
  try {
    const result = await myFunctions.getProjectRecommendations({
      proyecto: testProjects[2]
    }, {
      auth: { uid: 'test-user-123' }
    });

    console.log('✅ Resultado:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('🚀 Iniciando pruebas de Firebase Functions + Gemini AI\n');
  console.log('=' .repeat(60));
  
  await testGenerateSummary();
  console.log('\n' + '='.repeat(60));
  
  await testAnalyzeProject();
  console.log('\n' + '='.repeat(60));
  
  await testGetRecommendations();
  console.log('\n' + '='.repeat(60));
  
  console.log('\n✅ Todas las pruebas completadas\n');
  process.exit(0);
}

// Ejecutar
runAllTests().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
