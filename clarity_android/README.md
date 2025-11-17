# Clarity Android - Aplicación de Gestión de Proyectos

Aplicación móvil Android desarrollada en Flutter para la gestión de proyectos y hitos. Esta aplicación es la versión móvil del sistema web Clarity y comparte la misma base de datos Firebase.

## 🚀 Características

- **Autenticación**: Login, registro y recuperación de contraseña
- **Roles de usuario**: Administrador, Cliente y Equipo (Team)
- **Gestión de proyectos**: Crear, editar y visualizar proyectos
- **Hitos y tareas**: Seguimiento de progreso con múltiples vistas
- **Comentarios**: Sistema de comentarios anidados
- **Multimedia**: Subida de imágenes y videos en hitos
- **Reuniones**: Agendar y gestionar reuniones con clientes
- **Documentación**: Subir y descargar documentos del proyecto
- **Actividades**: Timeline de actividades del proyecto
- **Notificaciones**: Preferencias de notificaciones personalizables

## 📋 Requisitos Previos

- **Flutter SDK**: >= 3.0.0
- **Dart SDK**: >= 3.0.0
- **Android Studio** o **Visual Studio Code**
- **Cuenta de Firebase** con proyecto configurado
- **Android SDK**: minSdkVersion 21 (Android 5.0)

## 🔧 Configuración de Firebase

### 1. Crear Proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa el existente de la versión web
3. Habilita los siguientes servicios:
   - **Authentication** (Email/Password)
   - **Cloud Firestore**
   - **Firebase Storage**
   - **Cloud Functions** (opcional, para Gemini AI)

### 2. Configurar Android App en Firebase

1. En Firebase Console, ve a **Project Settings** > **Your apps**
2. Click en **Add app** > **Android**
3. Completa los datos:
   - **Package name**: `com.andrstudio.clarity`
   - **App nickname**: `Clarity Android`
   - **SHA-1**: (Opcional, para futuras features)
4. Descarga el archivo `google-services.json`
5. Coloca `google-services.json` en:
   ```
   android/app/google-services.json
   ```

### 3. Firestore Security Rules

**IMPORTANTE**: Usa las mismas reglas de seguridad que la versión web para mantener compatibilidad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Función helper para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }

    // Función para verificar si es admin
    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }

    // Usuarios
    match /usuarios/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || request.auth.uid == userId;
    }

    // Proyectos
    match /proyectos/{projectId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update, delete: if isAdmin();

      // Subcolecciones de proyectos
      match /milestones/{milestoneId} {
        allow read: if isAuthenticated();
        allow write: if isAdmin() ||
                       get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'team';

        match /comentarios/{commentId} {
          allow read: if isAuthenticated();
          allow write: if isAuthenticated();
        }

        match /multimedia/{multimediaId} {
          allow read: if isAuthenticated();
          allow write: if isAuthenticated();
        }
      }

      match /documentacion/{docId} {
        allow read: if isAuthenticated();
        allow write: if isAdmin();
      }
    }

    // Reuniones
    match /reuniones/{meetingId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() ||
                     resource.data.clienteId == request.auth.uid;
    }

    // Actividades
    match /actividades/{activityId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
  }
}
```

### 4. Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /proyectos/{projectId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Andr-studio/clarityAndroid.git
cd clarityAndroid
```

### 2. Instalar dependencias

```bash
flutter pub get
```

### 3. Verificar configuración

```bash
flutter doctor
```

Asegúrate de que todos los checks estén en verde, especialmente:
- Flutter SDK instalado
- Android toolchain
- Android Studio / VS Code

### 4. Ejecutar en dispositivo/emulador

```bash
# Listar dispositivos disponibles
flutter devices

# Ejecutar en dispositivo conectado
flutter run

# Ejecutar en modo release
flutter run --release
```

## 🏗️ Estructura del Proyecto

```
lib/
├── main.dart                      # Punto de entrada de la aplicación
├── models/                        # Modelos de datos
│   ├── user_model.dart
│   ├── project_model.dart
│   ├── milestone_model.dart
│   ├── comment_model.dart
│   ├── meeting_model.dart
│   ├── activity_model.dart
│   ├── documentation_model.dart
│   └── multimedia_model.dart
├── services/                      # Servicios de Firebase
│   ├── firebase_auth_service.dart
│   ├── firebase_projects_service.dart
│   ├── firebase_milestones_service.dart
│   ├── firebase_comments_service.dart
│   ├── firebase_users_service.dart
│   ├── firebase_meetings_service.dart
│   ├── firebase_activities_service.dart
│   ├── firebase_documentation_service.dart
│   └── firebase_storage_service.dart
├── providers/                     # Gestión de estado (Provider)
│   ├── auth_provider.dart
│   ├── projects_provider.dart
│   └── milestones_provider.dart
├── screens/                       # Pantallas de la aplicación
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── register_screen.dart
│   │   └── forgot_password_screen.dart
│   ├── dashboard/
│   │   └── dashboard_screen.dart
│   ├── admin/
│   │   └── admin_panel_screen.dart
│   └── team/
│       └── team_panel_screen.dart
├── widgets/                       # Widgets reutilizables
│   ├── common/
│   ├── dashboard/
│   ├── admin/
│   └── team/
└── utils/                         # Utilidades
    ├── constants.dart
    └── helpers.dart
```

## 🔑 Estructura de Datos Firebase

### Colección: `usuarios`

```javascript
{
  id: "uid",
  nombre: "Juan",
  apellido: "Pérez",
  correo: "juan@example.com",
  rol: "cliente", // 'admin', 'cliente', 'team'
  avatar: "JP",
  fechaCreacion: timestamp,
  fecha_creacion: timestamp  // Doble nomenclatura para compatibilidad
}
```

### Colección: `proyectos`

```javascript
{
  id: "projectId",
  nombre: "Proyecto Alpha",
  descripcion: "Descripción del proyecto",
  estado: "activo", // 'pendiente', 'activo', 'en_progreso', 'completado'
  presupuesto: 50000,
  tecnologias: ["Flutter", "Firebase"],
  creadorId: "uid",
  creador_id: "uid",
  creadorNombre: "Juan Pérez",
  creador_nombre: "Juan Pérez",
  equipo: [
    {
      userId: "teamMemberId",
      nombre: "Ana",
      apellido: "García",
      avatar: "AG",
      rol: "team"
    }
  ],
  progreso: 65.5,
  fechaCreacion: timestamp,
  fecha_creacion: timestamp,
  fechaInicio: timestamp,
  fecha_inicio: timestamp
}
```

### Subcolección: `proyectos/{id}/milestones`

```javascript
{
  id: "milestoneId",
  nombre: "Diseño UI",
  descripcion: "Diseño de interfaces",
  progreso: 75,
  estado: "en_progreso",
  responsableId: "uid",
  responsable_id: "uid",
  responsableNombre: "Ana García",
  responsable_nombre: "Ana García",
  responsableAvatar: "AG",
  fechaLimite: timestamp,
  fecha_limite: timestamp,
  fechaCreacion: timestamp,
  fecha_creacion: timestamp
}
```

## 🎨 Personalización

### Colores

Edita `lib/utils/constants.dart` para cambiar los colores de la app:

```dart
class AppColors {
  static const Color primary = Color(0xFF6366F1);
  static const Color secondary = Color(0xFF8B5CF6);
  static const Color accent = Color(0xFF10B981);
  // ...
}
```

### Textos

Modifica `lib/utils/constants.dart` para cambiar textos:

```dart
class AppTexts {
  static const String appName = 'Clarity';
  static const String appDescription = 'Gestión de proyectos';
  // ...
}
```

## 🔨 Build para Producción

### Android APK

```bash
flutter build apk --release
```

El APK se generará en: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (Para Google Play)

```bash
flutter build appbundle --release
```

El AAB se generará en: `build/app/outputs/bundle/release/app-release.aab`

## 🧪 Testing

```bash
# Ejecutar tests
flutter test

# Ejecutar tests con coverage
flutter test --coverage
```

## 📱 Compatibilidad

- **Android**: 5.0 (API 21) en adelante
- **iOS**: Por implementar (requiere configuración adicional)

## 🔐 Seguridad

- Nunca subas el archivo `google-services.json` a repositorios públicos
- Usa Firebase App Check para protección adicional
- Implementa rate limiting en Cloud Functions
- Valida datos tanto en cliente como en servidor

## 🐛 Solución de Problemas

### Error: "google-services.json not found"

**Solución**: Asegúrate de que el archivo esté en `android/app/google-services.json`

### Error: "Firebase not configured"

**Solución**: Verifica que hayas ejecutado `Firebase.initializeApp()` en `main.dart`

### Error de autenticación

**Solución**: Verifica que Email/Password esté habilitado en Firebase Authentication

### Errores de permisos Firestore

**Solución**: Revisa las Security Rules en Firebase Console

## 📝 Notas Importantes

### Compatibilidad con versión Web

Esta aplicación **comparte la misma base de datos Firebase** con la versión web de Clarity. Por lo tanto:

- **NO modifiques** la estructura de las colecciones sin actualizar ambas versiones
- **Mantén** la doble nomenclatura (`camelCase` y `snake_case`) en los campos
- **Usa** los mismos estados y valores que la versión web
- **Sincroniza** las Firestore Security Rules entre proyectos

### Desarrollo Futuro

Funcionalidades pendientes de implementar completamente:

- [ ] 6 vistas de hitos (tabla, kanban, calendario, etc.)
- [ ] Sistema completo de comentarios anidados con UI
- [ ] Gestión completa de reuniones
- [ ] Panel de administración completo
- [ ] Panel de equipo completo
- [ ] Estadísticas y gráficos
- [ ] Notificaciones push
- [ ] Modo offline con sincronización
- [ ] Soporte para iOS

## 👥 Contribuir

Este es un proyecto privado. Para contribuir, contacta al propietario del repositorio.

## 📄 Licencia

Propiedad de Andr-studio. Todos los derechos reservados.

## 📞 Soporte

Para soporte técnico o preguntas, contacta a través de GitHub Issues.

---

**Desarrollado con ❤️ usando Flutter y Firebase**
