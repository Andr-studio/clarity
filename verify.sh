#!/bin/bash

# Script de verificación de instalación
# Verifica que todos los componentes estén correctamente configurados

echo "🔍 VERIFICACIÓN DE INSTALACIÓN - Gemini AI Integration"
echo "========================================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
CHECKS_PASSED=0
CHECKS_FAILED=0

# Función para verificar
check() {
    local name=$1
    local command=$2
    
    echo -n "Verificando $name... "
    
    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Verificaciones

echo "1. HERRAMIENTAS INSTALADAS"
echo "──────────────────────────"

check "Node.js" "node --version"
check "npm" "npm --version"
check "Firebase CLI" "firebase --version"

echo ""
echo "2. ESTRUCTURA DE ARCHIVOS"
echo "─────────────────────────"

check "functions/index.js" "test -f functions/index.js"
check "functions/package.json" "test -f functions/package.json"
check "firebase.json" "test -f firebase.json"
check ".firebaserc" "test -f .firebaserc"

echo ""
echo "3. CONFIGURACIÓN DE FIREBASE"
echo "────────────────────────────"

# Verificar que está autenticado
if firebase projects:list &> /dev/null; then
    echo -e "Autenticación Firebase... ${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
    
    # Mostrar proyecto actual
    CURRENT_PROJECT=$(firebase use 2>/dev/null | grep -o 'using .*' | sed 's/using //' || echo "No configurado")
    echo "   Proyecto actual: $CURRENT_PROJECT"
else
    echo -e "Autenticación Firebase... ${RED}✗${NC}"
    echo "   ${YELLOW}Ejecuta: firebase login${NC}"
    ((CHECKS_FAILED++))
fi

# Verificar API Key de Gemini
API_KEY=$(firebase functions:config:get gemini.apikey 2>/dev/null || echo "")

if [ -z "$API_KEY" ] || [ "$API_KEY" == "undefined" ] || [ "$API_KEY" == "{}" ]; then
    echo -e "API Key de Gemini... ${RED}✗${NC}"
    echo "   ${YELLOW}Configura con: firebase functions:config:set gemini.apikey=\"TU_KEY\"${NC}"
    ((CHECKS_FAILED++))
else
    echo -e "API Key de Gemini... ${GREEN}✓${NC}"
    # Mostrar solo los primeros y últimos caracteres
    KEY_LENGTH=${#API_KEY}
    if [ $KEY_LENGTH -gt 10 ]; then
        MASKED_KEY="${API_KEY:0:6}...${API_KEY: -4}"
    else
        MASKED_KEY="***"
    fi
    echo "   Key: $MASKED_KEY"
    ((CHECKS_PASSED++))
fi

echo ""
echo "4. DEPENDENCIAS DE NODE"
echo "───────────────────────"

if [ -d "functions/node_modules" ]; then
    echo -e "node_modules instalados... ${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
    
    # Verificar dependencias críticas
    check "   @google/generative-ai" "test -d functions/node_modules/@google/generative-ai"
    check "   firebase-admin" "test -d functions/node_modules/firebase-admin"
    check "   firebase-functions" "test -d functions/node_modules/firebase-functions"
else
    echo -e "node_modules instalados... ${RED}✗${NC}"
    echo "   ${YELLOW}Ejecuta: cd functions && npm install${NC}"
    ((CHECKS_FAILED++))
fi

echo ""
echo "5. FUNCIONES DESPLEGADAS"
echo "────────────────────────"

# Intentar listar funciones
FUNCTIONS_LIST=$(firebase functions:list 2>/dev/null || echo "")

if echo "$FUNCTIONS_LIST" | grep -q "generateProjectSummary"; then
    echo -e "generateProjectSummary... ${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "generateProjectSummary... ${RED}✗${NC}"
    echo "   ${YELLOW}Despliega con: firebase deploy --only functions${NC}"
    ((CHECKS_FAILED++))
fi

if echo "$FUNCTIONS_LIST" | grep -q "analyzeProject"; then
    echo -e "analyzeProject... ${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "analyzeProject... ${RED}✗${NC}"
    ((CHECKS_FAILED++))
fi

if echo "$FUNCTIONS_LIST" | grep -q "getProjectRecommendations"; then
    echo -e "getProjectRecommendations... ${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "getProjectRecommendations... ${RED}✗${NC}"
    ((CHECKS_FAILED++))
fi

echo ""
echo "6. ARCHIVOS FRONTEND"
echo "────────────────────"

check "geminiService.js" "test -f ../src/services/geminiService.js || test -f src/services/geminiService.js"

# Buscar ProjectHeader.jsx
if [ -f "../src/components/ProjectHeader/ProjectHeader.jsx" ] || [ -f "src/components/ProjectHeader/ProjectHeader.jsx" ]; then
    echo -e "ProjectHeader.jsx... ${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "ProjectHeader.jsx... ${YELLOW}⚠${NC}"
    echo "   ${YELLOW}Actualiza este archivo con la nueva versión${NC}"
fi

echo ""
echo "════════════════════════════════════════"
echo "RESUMEN"
echo "════════════════════════════════════════"
echo ""
echo -e "Verificaciones exitosas: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Verificaciones fallidas: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✨ ¡Todo está configurado correctamente!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Abre tu aplicación React"
    echo "2. Navega a la vista de proyectos"
    echo "3. Haz clic en 'Generar Resumen con IA'"
    echo "4. ¡Disfruta del análisis con IA!"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Algunas verificaciones fallaron${NC}"
    echo ""
    echo "Acciones recomendadas:"
    
    if ! firebase projects:list &> /dev/null; then
        echo "• Autenticar Firebase: ${YELLOW}firebase login${NC}"
    fi
    
    if [ -z "$API_KEY" ] || [ "$API_KEY" == "undefined" ]; then
        echo "• Configurar API Key: ${YELLOW}firebase functions:config:set gemini.apikey=\"TU_KEY\"${NC}"
    fi
    
    if [ ! -d "functions/node_modules" ]; then
        echo "• Instalar dependencias: ${YELLOW}cd functions && npm install${NC}"
    fi
    
    if ! echo "$FUNCTIONS_LIST" | grep -q "generateProjectSummary"; then
        echo "• Desplegar functions: ${YELLOW}firebase deploy --only functions${NC}"
    fi
    
    echo ""
    echo "Revisa la documentación en INSTALACION.md para más detalles"
    echo ""
    exit 1
fi
