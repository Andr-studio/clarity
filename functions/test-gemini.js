// test-gemini.js
// Script para verificar la conexión con Gemini y los modelos disponibles

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY no está configurada en el archivo .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log('🔍 Probando conexión con Google Gemini...\n');

// Lista de modelos para probar
const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-pro', 
  'gemini-pro',
  'gemini-1.0-pro',
  'gemini-1.5-flash-latest', // Este debería fallar según tu error
  'gemini-1.5-pro-latest'
];

async function testModel(modelName) {
  try {
    console.log(`📝 Probando modelo: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Intenta generar contenido simple
    const result = await model.generateContent('Di "Hola, funciono correctamente" en una sola línea.');
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ ${modelName} - FUNCIONA`);
    console.log(`   Respuesta: ${text.substring(0, 50)}...\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName} - NO DISPONIBLE`);
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('PRUEBA DE MODELOS GEMINI');
  console.log('='.repeat(60) + '\n');
  
  const results = [];
  
  for (const modelName of modelsToTest) {
    const success = await testModel(modelName);
    results.push({ model: modelName, success });
  }
  
  console.log('='.repeat(60));
  console.log('RESUMEN DE RESULTADOS');
  console.log('='.repeat(60));
  
  const workingModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);
  
  console.log(`\n✅ Modelos funcionando: ${workingModels.length}`);
  workingModels.forEach(m => console.log(`   - ${m.model}`));
  
  console.log(`\n❌ Modelos no disponibles: ${failedModels.length}`);
  failedModels.forEach(m => console.log(`   - ${m.model}`));
  
  if (workingModels.length > 0) {
    console.log(`\n💡 Recomendación: Usa "${workingModels[0].model}" en tu server.js`);
  }
}

// Ejecutar las pruebas
runTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});