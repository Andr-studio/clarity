# FileUpload Component

Componente de React para subir archivos con soporte para drag & drop, validación de archivos y integración con Firebase Storage.

## Características

- Drag & Drop de archivos
- Selección de archivos mediante click
- Preview de imágenes
- Validación de tipos de archivo
- Validación de tamaño de archivo
- Límite de cantidad de archivos
- Barra de progreso de subida
- Integración con Firebase Storage
- Diseño responsive y moderno

## Instalación

El componente ya está incluido en el proyecto. Las dependencias necesarias son:

- `react`
- `lucide-react` (para iconos)
- `firebase` (para Firebase Storage)

## Uso Básico

```jsx
import FileUpload from './components/FileUpload/FileUpload';

function MiComponente() {
  const handleFilesChange = (files) => {
    console.log('Archivos seleccionados:', files);
  };

  return (
    <FileUpload
      onFilesChange={handleFilesChange}
      maxFileSize={10 * 1024 * 1024} // 10MB
      acceptedTypes={['image/*', 'application/pdf']}
      maxFiles={5}
      showPreview={true}
    />
  );
}
```

## Uso con Firebase Storage

```jsx
import FileUpload from './components/FileUpload/FileUpload';
import firebaseStorageAPI from './services/firebaseStorage';

function MiComponente() {
  const handleUpload = async (file, onProgress) => {
    try {
      const result = await firebaseStorageAPI.uploadFile(
        file,
        'proyectos/mi-proyecto/archivos',
        onProgress
      );
      console.log('Archivo subido:', result);
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  return (
    <FileUpload
      onUpload={handleUpload}
      maxFileSize={10 * 1024 * 1024}
      acceptedTypes={['image/*', 'application/pdf']}
      maxFiles={10}
      showPreview={true}
    />
  );
}
```

## Uso del Componente de Ejemplo

Incluimos un componente de ejemplo completo que muestra cómo integrar FileUpload con Firebase Storage:

```jsx
import FileUploadExample from './components/FileUpload/FileUploadExample';

function App() {
  const handleUploadComplete = (files) => {
    console.log('Archivos subidos exitosamente:', files);
  };

  return (
    <FileUploadExample
      projectId="mi-proyecto-123"
      onUploadComplete={handleUploadComplete}
    />
  );
}
```

## Props del Componente FileUpload

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onFilesChange` | `function` | - | Callback que se ejecuta cuando cambia la selección de archivos |
| `maxFileSize` | `number` | `10485760` (10MB) | Tamaño máximo por archivo en bytes |
| `acceptedTypes` | `array` | `['image/*', 'application/pdf', '.doc', '.docx', '.txt']` | Tipos de archivo aceptados |
| `maxFiles` | `number` | `10` | Número máximo de archivos |
| `showPreview` | `boolean` | `true` | Mostrar preview de imágenes |
| `onUpload` | `function` | - | Función personalizada para subir archivos |

## Props del Componente FileUploadExample

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `projectId` | `string` | `'demo'` | ID del proyecto para organizar archivos en Storage |
| `onUploadComplete` | `function` | - | Callback que se ejecuta cuando se completan las subidas |

## API de Firebase Storage

El servicio `firebaseStorageAPI` incluye los siguientes métodos:

### `uploadFile(file, path, onProgress)`

Sube un archivo a Firebase Storage.

**Parámetros:**
- `file` (File): Archivo a subir
- `path` (string): Ruta en Storage (ej: 'proyectos/proyecto-id/archivos')
- `onProgress` (function): Callback para reportar progreso (0-100)

**Retorna:** Promise con `{url, path, name, size, type}`

### `uploadMultipleFiles(files, path, onProgress)`

Sube múltiples archivos.

**Parámetros:**
- `files` (File[]): Array de archivos
- `path` (string): Ruta base en Storage
- `onProgress` (function): Callback para progreso individual

**Retorna:** Promise con array de resultados

### `deleteFile(filePath)`

Elimina un archivo de Storage.

**Parámetros:**
- `filePath` (string): Ruta completa del archivo

### `listFiles(path)`

Lista todos los archivos en una ruta.

**Parámetros:**
- `path` (string): Ruta en Storage

**Retorna:** Promise con array de archivos con sus URLs

### `getDownloadURL(filePath)`

Obtiene la URL de descarga de un archivo.

**Parámetros:**
- `filePath` (string): Ruta del archivo

**Retorna:** Promise con URL de descarga

## Tipos de Archivo Aceptados

Los tipos de archivo se especifican usando MIME types o extensiones:

```javascript
// MIME types
'image/*'           // Todas las imágenes
'application/pdf'   // PDFs
'text/*'           // Archivos de texto

// Extensiones
'.doc'
'.docx'
'.xls'
'.xlsx'
'.txt'
```

## Validación de Archivos

El componente valida automáticamente:

1. **Tamaño:** No exceder `maxFileSize`
2. **Tipo:** Debe estar en `acceptedTypes`
3. **Cantidad:** No exceder `maxFiles`

Si un archivo no pasa la validación, se muestra un mensaje de error.

## Estilos

Los estilos están en `FileUpload.css` y pueden personalizarse modificando las clases CSS:

- `.file-upload__dropzone` - Zona de drop
- `.file-upload__files` - Contenedor de archivos
- `.file-upload__file` - Archivo individual
- `.file-upload__progress` - Barra de progreso

## Integración en el Dashboard

Para integrar el componente en tu Dashboard:

```jsx
import FileUploadExample from './components/FileUpload/FileUploadExample';

// Dentro de tu componente Dashboard
<FileUploadExample
  projectId={currentProject.id}
  onUploadComplete={(files) => {
    console.log('Archivos subidos:', files);
    // Actualizar estado, mostrar notificación, etc.
  }}
/>
```

## Permisos de Firebase Storage

Asegúrate de configurar las reglas de seguridad en Firebase Storage:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /proyectos/{projectId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    match /uploads/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Notas

- Los archivos se suben a Firebase Storage en la ruta especificada
- Se agrega un timestamp a cada archivo para evitar colisiones de nombres
- Los archivos de imagen muestran un preview automáticamente
- El componente maneja la liberación de URLs de preview para evitar memory leaks

## Soporte

Para reportar problemas o solicitar funcionalidades, contacta al equipo de desarrollo.
