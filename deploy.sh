#!/bin/bash

# Script de despliegue para Firebase Functions + Gemini AI
# Uso: ./deploy.sh

set -e  # Salir si hay algún error

echo "🚀 Iniciando despliegue de Firebase Functions con Gemini AI"
echo "============================================================"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde el directorio functions/"
    exit 1
fi

# Verificar que Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI no está instalado"
    echo "📦 Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar que el usuario está autenticado
echo "🔐 Verificando autenticación de Firebase..."
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  No estás autenticado. Iniciando login..."
    firebase login
fi

# Verificar que la API Key de Gemini está configurada
echo "🔑 Verificando API Key de Gemini..."
API_KEY=$(firebase functions:config:get gemini.apikey 2>/dev/null || echo "")

if [ -z "$API_KEY" ] || [ "$API_KEY" == "undefined" ]; then
    echo "⚠️  La API Key de Gemini no está configurada"
    read -p "¿Deseas configurarla ahora? (s/n): " respuesta
    
    if [ "$respuesta" = "s" ]; then
        read -p "Ingresa tu API Key de Gemini: " nueva_api_key
        firebase functions:config:set gemini.apikey="$nueva_api_key"
        echo "✅ API Key configurada exitosamente"
    else
        echo "❌ No se puede continuar sin la API Key"
        exit 1
    fi
else
    echo "✅ API Key de Gemini configurada"
fi

# Instalar/actualizar dependencias
echo "📦 Instalando dependencias..."
npm install

# Ejecutar linting (si existe)
if grep -q "lint" package.json; then
    echo "🔍 Ejecutando linting..."
    npm run lint || echo "⚠️  Advertencias de linting encontradas, continuando..."
fi

# Confirmar despliegue
echo ""
echo "📋 Resumen del despliegue:"
echo "   - Proyecto: $(firebase use)"
echo "   - Funciones: generateProjectSummary, analyzeProject, getProjectRecommendations"
echo ""
read -p "¿Deseas continuar con el despliegue? (s/n): " confirmar

if [ "$confirmar" != "s" ]; then
    echo "❌ Despliegue cancelado"
    exit 0
fi

# Desplegar funciones
echo "🚀 Desplegando funciones a Firebase..."
firebase deploy --only functions

# Verificar despliegue
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Despliegue completado exitosamente!"
    echo ""
    echo "📊 Próximos pasos:"
    echo "   1. Verifica las funciones en: https://console.firebase.google.com"
    echo "   2. Prueba la funcionalidad en tu aplicación"
    echo "   3. Monitorea los logs con: firebase functions:log"
    echo ""
else
    echo ""
    echo "❌ Error durante el despliegue"
    echo "📝 Revisa los logs con: firebase functions:log"
    exit 1
fi
