import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Upload, X, File, Image, FileText, Check, AlertCircle } from "lucide-react";
import "./FileUpload.css";

export default function FileUpload({
  onFilesChange,
  maxFileSize = 10 * 1024 * 1024, // 10MB por defecto
  acceptedTypes = ["image/*", "application/pdf", ".doc", ".docx", ".txt"],
  maxFiles = 10,
  showPreview = true,
  onUpload
}) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({}); // { fileId: { status: 'uploading' | 'success' | 'error', progress: 0-100 } }
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Validar archivo
  const validateFile = (file) => {
    // Validar tamaño
    if (file.size > maxFileSize) {
      return `El archivo ${file.name} excede el tamaño máximo de ${formatFileSize(maxFileSize)}`;
    }

    // Validar tipo
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return fileType.startsWith(category);
      }
      return fileType === type;
    });

    if (!isAccepted) {
      return `El tipo de archivo ${file.name} no está permitido`;
    }

    return null;
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Obtener icono según tipo de archivo
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image className="file-upload__file-icon" />;
    }
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return <FileText className="file-upload__file-icon" />;
    }
    return <File className="file-upload__file-icon" />;
  };

  // Agregar archivos
  const addFiles = (newFiles) => {
    setError(null);
    const fileArray = Array.from(newFiles);

    // Validar cantidad máxima de archivos
    if (files.length + fileArray.length > maxFiles) {
      setError(`Solo puedes subir hasta ${maxFiles} archivos`);
      return;
    }

    // Validar cada archivo
    const validFiles = [];
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Agregar ID único a cada archivo
      const fileWithId = Object.assign(file, {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      });
      validFiles.push(fileWithId);
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);

    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  };

  // Eliminar archivo
  const removeFile = (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.preview) {
      URL.revokeObjectURL(file.preview);
    }

    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);

    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }

    // Limpiar estado de subida
    const newUploadStatus = { ...uploadStatus };
    delete newUploadStatus[fileId];
    setUploadStatus(newUploadStatus);
  };

  // Manejar drag & drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  // Manejar selección de archivos
  const handleFileSelect = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // Resetear input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = '';
  };

  // Abrir selector de archivos
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Simular subida de archivo (esto se puede reemplazar con integración real a Firebase)
  const simulateUpload = (file) => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadStatus(prev => ({
          ...prev,
          [file.id]: { status: 'uploading', progress }
        }));

        if (progress >= 100) {
          clearInterval(interval);
          setUploadStatus(prev => ({
            ...prev,
            [file.id]: { status: 'success', progress: 100 }
          }));
          resolve({ success: true, fileId: file.id });
        }
      }, 200);
    });
  };

  // Manejar subida de archivos
  const handleUpload = async () => {
    if (files.length === 0) {
      setError("No hay archivos para subir");
      return;
    }

    setError(null);

    try {
      for (const file of files) {
        if (onUpload) {
          // Si se proporciona una función personalizada de subida
          await onUpload(file, (progress) => {
            setUploadStatus(prev => ({
              ...prev,
              [file.id]: { status: 'uploading', progress }
            }));
          });
          setUploadStatus(prev => ({
            ...prev,
            [file.id]: { status: 'success', progress: 100 }
          }));
        } else {
          // Simulación de subida
          await simulateUpload(file);
        }
      }
    } catch (err) {
      setError("Error al subir archivos: " + err.message);
      console.error(err);
    }
  };

  // Limpiar recursos cuando se desmonte el componente
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className="file-upload">
      <div className="file-upload__container">
        {/* Zona de drop */}
        <div
          className={`file-upload__dropzone ${isDragging ? 'file-upload__dropzone--dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileSelector}
        >
          <Upload className="file-upload__icon" />
          <h3 className="file-upload__title">
            Arrastra archivos aquí o haz clic para seleccionar
          </h3>
          <p className="file-upload__subtitle">
            Tamaño máximo: {formatFileSize(maxFileSize)} | Máximo {maxFiles} archivos
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="file-upload__input"
          />
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="file-upload__error">
            <AlertCircle className="file-upload__error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Lista de archivos */}
        {files.length > 0 && (
          <div className="file-upload__files">
            <div className="file-upload__files-header">
              <h4>Archivos seleccionados ({files.length}/{maxFiles})</h4>
              {files.length > 0 && !Object.values(uploadStatus).some(s => s.status === 'uploading') && (
                <button
                  className="file-upload__upload-btn"
                  onClick={handleUpload}
                >
                  Subir archivos
                </button>
              )}
            </div>
            <div className="file-upload__files-list">
              {files.map((file) => {
                const status = uploadStatus[file.id];
                return (
                  <div key={file.id} className="file-upload__file">
                    {/* Preview o icono */}
                    <div className="file-upload__file-preview">
                      {showPreview && file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="file-upload__file-image"
                        />
                      ) : (
                        getFileIcon(file)
                      )}
                    </div>

                    {/* Info del archivo */}
                    <div className="file-upload__file-info">
                      <p className="file-upload__file-name">{file.name}</p>
                      <p className="file-upload__file-size">{formatFileSize(file.size)}</p>

                      {/* Barra de progreso */}
                      {status?.status === 'uploading' && (
                        <div className="file-upload__progress">
                          <div
                            className="file-upload__progress-bar"
                            style={{ width: `${status.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Estado y acciones */}
                    <div className="file-upload__file-actions">
                      {status?.status === 'success' && (
                        <Check className="file-upload__status-icon file-upload__status-icon--success" />
                      )}
                      {(!status || status.status === 'error') && (
                        <button
                          className="file-upload__remove-btn"
                          onClick={() => removeFile(file.id)}
                          aria-label="Eliminar archivo"
                        >
                          <X className="file-upload__remove-icon" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

FileUpload.propTypes = {
  onFilesChange: PropTypes.func,
  maxFileSize: PropTypes.number,
  acceptedTypes: PropTypes.arrayOf(PropTypes.string),
  maxFiles: PropTypes.number,
  showPreview: PropTypes.bool,
  onUpload: PropTypes.func,
};
