import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import API from "../../services/api";
import "./MeetingNotifications.css";

export default function MeetingNotifications({ userId }) {
  const [reuniones, setReuniones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingObservation, setMeetingObservation] = useState("");
  const [meetingAlternativeDate, setMeetingAlternativeDate] = useState("");
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentRejectionReason, setDocumentRejectionReason] = useState("");

  // Detectar si es móvil
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  // Iniciar colapsado en móviles
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    if (userId) {
      loadReuniones();
    }
  }, [userId]);

  // Escuchar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // En escritorio, siempre expandido
      if (!mobile) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadReuniones = async () => {
    try {
      setLoading(true);
      const todasReuniones = await API.reuniones.getByCliente(userId);
      setReuniones(todasReuniones);

      // Cargar documentos de los proyectos asociados
      await loadDocumentos(todasReuniones);
    } catch (error) {
      console.error("Error cargando reuniones:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentos = async (reuniones) => {
    try {
      setLoadingDocumentos(true);

      // Obtener IDs únicos de proyectos
      const proyectoIds = [...new Set(
        reuniones
          .filter(r => r.proyectoId)
          .map(r => r.proyectoId)
      )];

      // Cargar documentos para cada proyecto
      const todosDocumentos = [];
      for (const proyectoId of proyectoIds) {
        try {
          const docs = await API.documentacion.getAll(proyectoId);
          // Agregar información del proyecto a cada documento
          const docsConProyecto = docs.map(doc => ({
            ...doc,
            proyectoId,
            proyectoNombre: reuniones.find(r => r.proyectoId === proyectoId)?.proyectoNombre || 'Proyecto'
          }));
          todosDocumentos.push(...docsConProyecto);
        } catch (error) {
          console.error(`Error cargando documentos del proyecto ${proyectoId}:`, error);
        }
      }

      setDocumentos(todosDocumentos);
    } catch (error) {
      console.error("Error cargando documentos:", error);
    } finally {
      setLoadingDocumentos(false);
    }
  };

  const handleOpenMeetingModal = (meeting) => {
    setSelectedMeeting(meeting);
    setMeetingObservation("");
    setMeetingAlternativeDate("");
    setShowMeetingModal(true);
  };

  const handleAcceptMeeting = async () => {
    try {
      await API.reuniones.accept(selectedMeeting.id);
      await loadReuniones();
      setShowMeetingModal(false);
    } catch (error) {
      console.error("Error aceptando reunión:", error);
      alert(error.message || "Error al aceptar la reunión");
    }
  };

  const handleRejectMeeting = async () => {
    if (!meetingObservation.trim()) {
      alert("Por favor proporciona una observación para el rechazo");
      return;
    }

    try {
      await API.reuniones.reject(
        selectedMeeting.id,
        meetingObservation,
        meetingAlternativeDate ? new Date(meetingAlternativeDate) : null
      );
      await loadReuniones();
      setShowMeetingModal(false);
      setMeetingObservation("");
      setMeetingAlternativeDate("");
    } catch (error) {
      console.error("Error rechazando reunión:", error);
      alert(error.message || "Error al rechazar la reunión");
    }
  };

  const handleOpenDocumentModal = (document, action) => {
    setSelectedDocument({ ...document, action });
    setDocumentRejectionReason("");
    setShowDocumentModal(true);
  };

  const handleApproveDocument = async () => {
    try {
      await API.documentacion.approve(selectedDocument.proyectoId, selectedDocument.id);
      await loadReuniones(); // Recargar para actualizar los documentos
      setShowDocumentModal(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error("Error aprobando documento:", error);
      alert(error.message || "Error al aprobar el documento");
    }
  };

  const handleRejectDocument = async () => {
    if (!documentRejectionReason.trim()) {
      alert("Por favor proporciona un motivo para el rechazo");
      return;
    }

    try {
      await API.documentacion.reject(
        selectedDocument.proyectoId,
        selectedDocument.id,
        documentRejectionReason
      );
      await loadReuniones(); // Recargar para actualizar los documentos
      setShowDocumentModal(false);
      setSelectedDocument(null);
      setDocumentRejectionReason("");
    } catch (error) {
      console.error("Error rechazando documento:", error);
      alert(error.message || "Error al rechazar el documento");
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return "N/A";

    let date;
    if (fecha.seconds) {
      date = new Date(fecha.seconds * 1000);
    } else {
      date = new Date(fecha);
    }

    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const reunionesPendientes = reuniones.filter((r) => r.estado === "pendiente");
  const reunionesAceptadas = reuniones.filter((r) => r.estado === "aceptada");
  const reunionesRechazadas = reuniones.filter((r) => r.estado === "rechazada");

  const getStatusIcon = (estado) => {
    switch (estado) {
      case "pendiente":
        return "⏱️";
      case "aceptada":
        return "✅";
      case "rechazada":
        return "❌";
      default:
        return "📅";
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "#fbbf24";
      case "aceptada":
        return "#10b981";
      case "rechazada":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getDocumentIcon = (tipo) => {
    if (!tipo) return "📄";

    if (tipo.startsWith("image/")) return "🖼️";
    if (tipo.startsWith("video/")) return "🎥";
    if (tipo.includes("pdf")) return "📕";
    if (tipo.includes("word") || tipo.includes("document")) return "📘";
    if (tipo.includes("excel") || tipo.includes("sheet")) return "📗";
    if (tipo.includes("powerpoint") || tipo.includes("presentation")) return "📙";

    return "📄";
  };

  if (loading) {
    return (
      <div className="meeting-notifications">
        <div className="meeting-notifications__header">
          <h3 className="meeting-notifications__title">📅 Reuniones</h3>
        </div>
        <div className="meeting-notifications__loading">
          <div className="spinner-small"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop para cerrar el panel en móviles - solo visible en móvil cuando está expandido */}
      {isMobile && (
        <div
          className={`meeting-notifications-backdrop ${isCollapsed ? "hidden" : ""}`}
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <div className={`meeting-notifications ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}>
        <div className="meeting-notifications__header">
          <div className="meeting-notifications__header-content">
            <h3 className="meeting-notifications__title">📅 Reuniones</h3>
            {reunionesPendientes.length > 0 && !isCollapsed && (
              <span className="meeting-notifications__badge">
                {reunionesPendientes.length}
              </span>
            )}
          </div>
          {/* Mostrar botón solo en móvil */}
          {isMobile && (
            <button
              className="meeting-notifications__collapse-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Mostrar reuniones" : "Ocultar reuniones"}
            >
              {isCollapsed ? "Mostrar" : "Ocultar"}
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="meeting-notifications__content">
            {reuniones.length === 0 ? (
              <div className="meeting-notifications__empty">
                <p>No hay reuniones programadas</p>
              </div>
            ) : (
              <>
                {/* Reuniones Pendientes */}
                {reunionesPendientes.length > 0 && (
                  <div className="meeting-notifications__section">
                    <h4 className="meeting-notifications__section-title">
                      Pendientes ({reunionesPendientes.length})
                    </h4>
                    {reunionesPendientes.map((reunion) => (
                      <div
                        key={reunion.id}
                        className="meeting-notification-card meeting-notification-card--pending"
                      >
                        <div className="meeting-notification-card__header">
                          <span className="meeting-notification-card__icon">
                            {getStatusIcon(reunion.estado)}
                          </span>
                          <h5 className="meeting-notification-card__title">
                            {reunion.titulo}
                          </h5>
                        </div>
                        <p className="meeting-notification-card__description">
                          {reunion.descripcion}
                        </p>
                        <div className="meeting-notification-card__meta">
                          <span className="meeting-notification-card__date">
                            📅 {formatDate(reunion.fechaSolicitada)}
                          </span>
                          {reunion.proyectoNombre && (
                            <span className="meeting-notification-card__project">
                              📁 {reunion.proyectoNombre}
                            </span>
                          )}
                        </div>
                        <div className="meeting-notification-card__actions">
                          <button
                            className="meeting-notification-card__btn meeting-notification-card__btn--accept"
                            onClick={() => handleOpenMeetingModal(reunion)}
                          >
                            ✓ Aceptar
                          </button>
                          <button
                            className="meeting-notification-card__btn meeting-notification-card__btn--reject"
                            onClick={() => handleOpenMeetingModal(reunion)}
                          >
                            ✗ Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reuniones Aceptadas */}
                {reunionesAceptadas.length > 0 && (
                  <div className="meeting-notifications__section">
                    <h4 className="meeting-notifications__section-title">
                      Aceptadas ({reunionesAceptadas.length})
                    </h4>
                    {reunionesAceptadas.map((reunion) => (
                      <div
                        key={reunion.id}
                        className="meeting-notification-card meeting-notification-card--accepted"
                      >
                        <div className="meeting-notification-card__header">
                          <span className="meeting-notification-card__icon">
                            {getStatusIcon(reunion.estado)}
                          </span>
                          <h5 className="meeting-notification-card__title">
                            {reunion.titulo}
                          </h5>
                        </div>
                        <div className="meeting-notification-card__meta">
                          <span className="meeting-notification-card__date">
                            📅 {formatDate(reunion.fechaSolicitada)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reuniones Rechazadas */}
                {reunionesRechazadas.length > 0 && (
                  <div className="meeting-notifications__section">
                    <h4 className="meeting-notifications__section-title">
                      Rechazadas ({reunionesRechazadas.length})
                    </h4>
                    {reunionesRechazadas.slice(0, 3).map((reunion) => (
                      <div
                        key={reunion.id}
                        className="meeting-notification-card meeting-notification-card--rejected"
                      >
                        <div className="meeting-notification-card__header">
                          <span className="meeting-notification-card__icon">
                            {getStatusIcon(reunion.estado)}
                          </span>
                          <h5 className="meeting-notification-card__title">
                            {reunion.titulo}
                          </h5>
                        </div>
                        <div className="meeting-notification-card__meta">
                          <span className="meeting-notification-card__date">
                            📅 {formatDate(reunion.fechaSolicitada)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sección de Documentos */}
                {documentos.length > 0 && (
                  <div className="meeting-notifications__section">
                    <div className="meeting-notifications__section-header">
                      <h4 className="meeting-notifications__section-title">
                        📚 Documentos del Proyecto ({documentos.length})
                      </h4>
                      {documentos.length > 3 && (
                        <button
                          className="meeting-notifications__toggle-btn"
                          onClick={() => setShowAllDocuments(!showAllDocuments)}
                        >
                          {showAllDocuments ? "Ocultar" : "Ver todos"}
                        </button>
                      )}
                    </div>

                    {loadingDocumentos ? (
                      <div className="meeting-notifications__loading-docs">
                        <div className="spinner-small"></div>
                        <p>Cargando documentos...</p>
                      </div>
                    ) : (
                      <>
                        {(showAllDocuments ? documentos : documentos.slice(0, 3)).map((doc) => (
                          <div
                            key={doc.id}
                            className="meeting-notification-card meeting-notification-card--document"
                          >
                            <div className="meeting-notification-card__header">
                              <span className="meeting-notification-card__icon">
                                {getDocumentIcon(doc.archivoTipo)}
                              </span>
                              <h5 className="meeting-notification-card__title">
                                {doc.titulo}
                              </h5>
                            </div>
                            {doc.descripcion && (
                              <p className="meeting-notification-card__description">
                                {doc.descripcion}
                              </p>
                            )}
                            <div className="meeting-notification-card__meta">
                              <span className="meeting-notification-card__project">
                                📁 {doc.proyectoNombre}
                              </span>
                              {doc.archivoNombre && (
                                <span className="meeting-notification-card__file">
                                  📎 {doc.archivoNombre}
                                </span>
                              )}
                            </div>
                            <div className="meeting-notification-card__actions">
                              {doc.archivoUrl && (
                                <a
                                  href={doc.archivoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="meeting-notification-card__btn meeting-notification-card__btn--view"
                                >
                                  👁️ Ver documento
                                </a>
                              )}
                              {doc.estado === 'pendiente' && (
                                <>
                                  <button
                                    className="meeting-notification-card__btn meeting-notification-card__btn--accept"
                                    onClick={() => handleOpenDocumentModal(doc, 'approve')}
                                  >
                                    ✓ Aprobar
                                  </button>
                                  <button
                                    className="meeting-notification-card__btn meeting-notification-card__btn--reject"
                                    onClick={() => handleOpenDocumentModal(doc, 'reject')}
                                  >
                                    ✗ Rechazar
                                  </button>
                                </>
                              )}
                              {doc.estado === 'aprobado' && (
                                <span className="meeting-notification-card__status meeting-notification-card__status--approved">
                                  ✅ Aprobado
                                </span>
                              )}
                              {doc.estado === 'rechazado' && (
                                <span className="meeting-notification-card__status meeting-notification-card__status--rejected">
                                  ❌ Rechazado
                                  {doc.motivoRechazo && (
                                    <span className="meeting-notification-card__rejection-reason">
                                      Motivo: {doc.motivoRechazo}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de Gestión de Reunión */}
      {showMeetingModal && selectedMeeting && (
        <div
          className="meeting-modal-overlay"
          onClick={() => setShowMeetingModal(false)}
        >
          <div
            className="meeting-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="meeting-modal__title">
              📅 {selectedMeeting.titulo}
            </h3>
            <p className="meeting-modal__description">
              {selectedMeeting.descripcion}
            </p>
            <p className="meeting-modal__date">
              📅 Fecha propuesta: {formatDate(selectedMeeting.fechaSolicitada)}
            </p>

            <div className="meeting-modal__field">
              <label className="meeting-modal__label">
                Observación (requerido para rechazar)
              </label>
              <textarea
                value={meetingObservation}
                onChange={(e) => setMeetingObservation(e.target.value)}
                placeholder="Explica el motivo del rechazo o confirmación..."
                className="meeting-modal__textarea"
              />
            </div>

            <div className="meeting-modal__field">
              <label className="meeting-modal__label">
                Fecha alternativa (opcional)
              </label>
              <input
                type="datetime-local"
                value={meetingAlternativeDate}
                onChange={(e) => setMeetingAlternativeDate(e.target.value)}
                className="meeting-modal__input"
              />
            </div>

            <div className="meeting-modal__actions">
              <button
                onClick={() => setShowMeetingModal(false)}
                className="meeting-modal__btn meeting-modal__btn--cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectMeeting}
                className="meeting-modal__btn meeting-modal__btn--reject"
              >
                Rechazar Reunión
              </button>
              <button
                onClick={handleAcceptMeeting}
                className="meeting-modal__btn meeting-modal__btn--accept"
              >
                Aceptar Reunión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Documentos */}
      {showDocumentModal && selectedDocument && (
        <div
          className="meeting-modal-overlay"
          onClick={() => setShowDocumentModal(false)}
        >
          <div
            className="meeting-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="meeting-modal__title">
              📄 {selectedDocument.titulo}
            </h3>
            {selectedDocument.descripcion && (
              <p className="meeting-modal__description">
                {selectedDocument.descripcion}
              </p>
            )}
            <p className="meeting-modal__date">
              📁 Proyecto: {selectedDocument.proyectoNombre}
            </p>

            {selectedDocument.action === 'approve' ? (
              <>
                <p className="meeting-modal__confirmation">
                  ¿Estás seguro de que deseas aprobar este documento?
                </p>
                <div className="meeting-modal__actions">
                  <button
                    onClick={() => setShowDocumentModal(false)}
                    className="meeting-modal__btn meeting-modal__btn--cancel"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApproveDocument}
                    className="meeting-modal__btn meeting-modal__btn--accept"
                  >
                    Aprobar Documento
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="meeting-modal__field">
                  <label className="meeting-modal__label">
                    Motivo del rechazo (requerido)
                  </label>
                  <textarea
                    value={documentRejectionReason}
                    onChange={(e) => setDocumentRejectionReason(e.target.value)}
                    placeholder="Explica por qué rechazas este documento..."
                    className="meeting-modal__textarea"
                  />
                </div>
                <div className="meeting-modal__actions">
                  <button
                    onClick={() => setShowDocumentModal(false)}
                    className="meeting-modal__btn meeting-modal__btn--cancel"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRejectDocument}
                    className="meeting-modal__btn meeting-modal__btn--reject"
                  >
                    Rechazar Documento
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

MeetingNotifications.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
