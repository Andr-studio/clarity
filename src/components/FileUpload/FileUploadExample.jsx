import React, { useState } from "react";
import PropTypes from "prop-types";
import FileUpload from "./FileUpload";
import firebaseStorageAPI from "../../services/firebaseStorage";
import "./FileUploadExample.css";

/**
 * Componente de ejemplo que muestra cómo usar FileUpload con Firebase Storage
 * Puedes usar este componente como referencia para integrar la subida de archivos
 * en tu aplicación
 */
export default function FileUploadExample({ projectId = "demo", onUploadComplete }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Función personalizada para subir archivos a Firebase Storage
  const handleUpload = async (file, onProgress) => {
    try {
      // Definir ruta en Firebase Storage
      // Puedes personalizar esto según tu estructura
      const storagePath = projectId
        ? `proyectos/${projectId}/archivos`
        : 'uploads';

      // Subir archivo usando el servicio de Firebase
      const result = await firebaseStorageAPI.uploadFile(
        file,
        storagePath,
        onProgress
      );

      console.log('Archivo subido exitosamente:', result);
      return result;
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw error;
    }
  };

  // Manejar la subida de todos los archivos
  const handleUploadAll = async (files) => {
    if (files.length === 0) return;

    setIsUploading(true);
    const results = [];

    try {
      for (const file of files) {
        const result = await handleUpload(file, (progress) => {
          console.log(`${file.name}: ${progress}%`);
        });
        results.push(result);
      }

      setUploadedFiles([...uploadedFiles, ...results]);

      if (onUploadComplete) {
        onUploadComplete(results);
      }

      alert('¡Archivos subidos exitosamente!');
    } catch (error) {
      alert('Error al subir archivos: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-upload-example">
      <div className="file-upload-example__header">
        <h2>Subir Archivos</h2>
        <p>Arrastra archivos o haz clic para seleccionar</p>
      </div>

      <FileUpload
        onUpload={handleUpload}
        maxFileSize={10 * 1024 * 1024} // 10MB
        acceptedTypes={[
          'image/*',
          'application/pdf',
          '.doc',
          '.docx',
          '.txt',
          '.xls',
          '.xlsx'
        ]}
        maxFiles={10}
        showPreview={true}
      />

      {/* Lista de archivos subidos */}
      {uploadedFiles.length > 0 && (
        <div className="file-upload-example__uploaded">
          <h3>Archivos Subidos ({uploadedFiles.length})</h3>
          <div className="file-upload-example__uploaded-list">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-upload-example__uploaded-item">
                <div className="file-upload-example__uploaded-info">
                  <p className="file-upload-example__uploaded-name">
                    {file.name}
                  </p>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-upload-example__uploaded-link"
                  >
                    Ver archivo
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

FileUploadExample.propTypes = {
  projectId: PropTypes.string,
  onUploadComplete: PropTypes.func,
};
