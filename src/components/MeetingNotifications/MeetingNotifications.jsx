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
    } catch (error) {
      console.error("Error cargando reuniones:", error);
    } finally {
      setLoading(false);
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
    </>
  );
}

MeetingNotifications.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
