# Instrucciones de Despliegue

## 📤 Subir a GitHub

El proyecto está listo para ser subido a GitHub. Sigue estos pasos:

### Opción 1: Desde tu máquina local

1. **Descarga el proyecto** del servidor actual a tu máquina local

2. **Navega al directorio** del proyecto:
   ```bash
   cd clarity_android
   ```

3. **Configura git** (si aún no lo has hecho):
   ```bash
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu@email.com"
   ```

4. **Agrega el repositorio remoto** (si no está configurado):
   ```bash
   git remote add origin https://github.com/Andr-studio/clarityAndroid.git
   ```

5. **Verifica el estado**:
   ```bash
   git status
   ```

6. **Sube los cambios**:
   ```bash
   git push -u origin main
   ```

### Opción 2: Crear repositorio nuevo

Si prefieres crear el repositorio desde cero:

1. Ve a GitHub y crea un nuevo repositorio llamado `clarityAndroid`

2. NO inicialices con README, .gitignore o licencia

3. Copia el proyecto a tu máquina local

4. Ejecuta:
   ```bash
   cd clarity_android
   git remote set-url origin https://github.com/Andr-studio/clarityAndroid.git
   git push -u origin main
   ```

## 🔧 Configuración Post-Despliegue

### 1. Descarga el archivo google-services.json

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Project Settings > Your apps > Android app
4. Descarga `google-services.json`
5. Colócalo en: `android/app/google-services.json`

**IMPORTANTE**: Este archivo NO debe estar en el repositorio (ya está en .gitignore)

### 2. Configura Firebase

Sigue las instrucciones del `README.md` para:
- Configurar Authentication (Email/Password)
- Configurar Firestore Database
- Configurar Firebase Storage
- Configurar Security Rules

### 3. Ejecuta el proyecto

```bash
# Instalar dependencias
flutter pub get

# Verificar configuración
flutter doctor

# Ejecutar en dispositivo/emulador
flutter run
```

## 📱 Testing

### Login de prueba

Una vez configurado Firebase, crea un usuario de prueba:

1. Ve a Firebase Console > Authentication
2. Agrega un usuario manualmente:
   - Email: `admin@clarity.com`
   - Password: `123456`
3. Agrega el usuario en Firestore:
   - Colección: `usuarios`
   - ID: (UID del usuario de Auth)
   - Campos:
     ```json
     {
       "nombre": "Admin",
       "apellido": "Test",
       "correo": "admin@clarity.com",
       "rol": "admin",
       "avatar": "AT",
       "fechaCreacion": (timestamp actual),
       "fecha_creacion": (timestamp actual)
     }
     ```

4. Ahora puedes hacer login con `admin@clarity.com` / `123456`

## 🐛 Troubleshooting

### Error: "Gradle build failed"

- Asegúrate de tener Android SDK instalado
- Ejecuta `flutter doctor` y soluciona los warnings

### Error: "Firebase not configured"

- Verifica que `google-services.json` esté en la ubicación correcta
- Limpia el proyecto: `flutter clean && flutter pub get`

### Error: "Permission denied"

- Revisa las Security Rules de Firestore
- Asegúrate de que el usuario esté autenticado

## 📊 Próximos Pasos

1. **Implementar funcionalidades pendientes**:
   - Vistas de hitos (Kanban, Calendar, etc.)
   - Sistema de comentarios completo
   - Panel de administración completo
   - Panel de equipo completo

2. **Optimizaciones**:
   - Caché de imágenes
   - Modo offline
   - Paginación de listas grandes

3. **Testing**:
   - Tests unitarios
   - Tests de integración
   - Tests E2E

4. **Producción**:
   - Configurar signing key para release
   - Generar App Bundle para Google Play
   - Configurar Firebase App Check
   - Implementar Analytics

---

**¿Necesitas ayuda?** Revisa el README.md o crea un issue en GitHub.
