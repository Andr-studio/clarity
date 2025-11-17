import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import ProjectHeader from "../ProjectHeader/ProjectHeader";
import ProgressSection from "../ProgressSection/ProgressSection";
import RecentActivity from "../RecentActivity/RecentActivity";
import NotificationsPreferences from "../NotificationsPreferences/NotificationsPreferences";
import QuickStats from "../QuickStats/QuickStats";
import MeetingNotifications from "../MeetingNotifications/MeetingNotifications";
import "./Dashboard.css";
import API from "../../services/api";

export default function Dashboard({ user, onLogout }) {
  // Estados
  const [proyectos, setProyectos] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentacion, setDocumentacion] = useState([]);
  const [multimediaPorHito, setMultimediaPorHito] = useState({});

  // Estados para aprobación/rechazo de documentos
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [processingDoc, setProcessingDoc] = useState(null);

  // Cargar proyectos al montar el componente
  useEffect(() => {
    if (user?.id && user?.rol) {
      loadProyectos();
    }
  }, [user]);

  const loadProyectos = async () => {
    try {
      setLoading(true);
      // Usar API unificada (que usa Firebase internamente)
      const data = await API.proyectos.getAll(user?.id, user?.rol);
      setProyectos(data);

      if (data.length > 0) {
        loadProyectoDetalle(data[0].id);
      }
    } catch (err) {
      setError("Error al cargar proyectos: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProyectoDetalle = async (proyectoId) => {
    try {
      setLoading(true);

      // Cargar proyecto usando API unificada
      const proyecto = await API.proyectos.getById(proyectoId);

      // Cargar hitos del proyecto
      const hitos = await API.hitos.getAll(proyectoId);

      // Cargar contador de comentarios para cada hito
      const hitosConComentarios = await Promise.all(
        hitos.map(async (hito) => {
          try {
            const comentarios = await API.comentarios.getByHito(
              proyectoId,
              hito.id
            );
            return {
              ...hito,
              comentarios_count: comentarios.length,
            };
          } catch (error) {
            console.error(
              "Error cargando comentarios para hito:",
              hito.id,
              error
            );
            return {
              ...hito,
              comentarios_count: 0,
            };
          }
        })
      );

      // Cargar actividades recientes
      const actividades = await API.actividades.getAll({
        proyecto_id: proyectoId,
        limit: 5,
      });

      // Cargar documentación del proyecto
      const docs = await API.documentacion.getAll(proyectoId);
      setDocumentacion(docs);

      // Cargar multimedia para cada hito
      const multimediaMap = {};
      for (const hito of hitos) {
        try {
          const multimedia = await API.hitos.getMultimedia(proyectoId, hito.id);
          if (multimedia && multimedia.length > 0) {
            multimediaMap[hito.id] = multimedia;
          }
        } catch (error) {
          console.error(`Error cargando multimedia para hito ${hito.id}:`, error);
        }
      }
      setMultimediaPorHito(multimediaMap);

      // Transformar datos al formato esperado por el componente
      const proyectoFormateado = {
        id: proyecto.id,
        name: proyecto.nombre,
        description: proyecto.descripcion,
        status: proyecto.estado,
        budget: `$${(proyecto.presupuesto || 0).toLocaleString()}`,
        team:
          proyecto.equipo
            ?.filter((m) => m.rol === "team")
            .map((m) => `${m.nombre} ${m.apellido}`) || [],
        teamCount: proyecto.teamCount || 0,
        // Verificar si tecnologias es string o array
        technologies: Array.isArray(proyecto.tecnologias)
          ? proyecto.tecnologias
          : (proyecto.tecnologias || "")
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t),
        progress: proyecto.progreso || 0,

        // Formatear hitos
        milestones: hitosConComentarios.map((h) => ({
          id: h.id,
          title: h.nombre,
          progress: h.progreso || 0,
          status: h.estado || "pendiente",
          dueDate: h.fechaLimite || h.fecha_limite || "Sin fecha",
          assignee:
            h.responsableNombre || h.responsable_nombre || "Sin asignar",
          commentCount: h.comentarios_count || 0,
        })),

        // Formatear actividades recientes
        recentActivity: actividades.map((a) => ({
          user: a.usuarioNombre || "Usuario",
          action: a.descripcion,
          detail: a.tareaModificada || "",
          time: a.fecha, // Mantener el timestamp original, RecentActivity lo formateará
          avatar: a.avatar || a.usuarioNombre?.charAt(0) || "U",
          proyecto: a.proyectoNombre || proyecto.nombre,
        })),

        quickStats: calcularQuickStats(hitosConComentarios, proyecto),
      };

      setCurrentProject(proyectoFormateado);
    } catch (err) {
      setError("Error al cargar proyecto: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calcularQuickStats = (hitos, proyecto) => {
    const totalHitos = hitos.length;
    const hitosCompletados = hitos.filter(
      (h) => h.estado === "completado"
    ).length;
    const equipoTeam =
      proyecto.equipo?.filter((m) => m.rol === "team").length || 0;
    

    // Calcular días restantes (basado en el hito más lejano)
    let diasRestantes = 0;
    if (hitos.length > 0) {
      const fechasLimite = hitos
        .map((h) => h.fechaLimite || h.fecha_limite)
        .filter((f) => f)
        .map((f) => {
          // Manejar timestamps de Firebase
          if (f && typeof f === "object" && f.seconds) {
            return new Date(f.seconds * 1000);
          }
          return new Date(f);
        })
        .filter((d) => !isNaN(d.getTime()));

      if (fechasLimite.length > 0) {
        const fechaMasLejana = new Date(Math.max(...fechasLimite));
        const hoy = new Date();
        diasRestantes = Math.max(
          0,
          Math.ceil((fechaMasLejana - hoy) / (1000 * 60 * 60 * 24))
        );
      }
    }

    return {
      tasksCompleted: `${hitosCompletados}/${totalHitos}`,
      daysRemaining: diasRestantes.toString(),
      weeklyProgress: `+${proyecto.progreso || 0}%`,
      activeMembers: `${equipoTeam}/${equipoTeam}`
    };
  };

  const handleLogout = () => {
    onLogout?.();
  };

  const handleProjectSelect = (proyectoNombre) => {
    const proyecto = proyectos.find((p) => p.nombre === proyectoNombre);
    if (proyecto) {
      loadProyectoDetalle(proyecto.id);
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Funciones de aprobación/rechazo de documentos
  const handleApproveDoc = async (doc) => {
    if (!currentProject?.id) return;

    try {
      setProcessingDoc(doc.id);
      await API.documentacion.approve(currentProject.id, doc.id);

      // Recargar documentación
      const docs = await API.documentacion.getAll(currentProject.id);
      setDocumentacion(docs);

      alert("✅ Documento aprobado exitosamente");
    } catch (err) {
      console.error("Error al aprobar documento:", err);
      alert("❌ Error al aprobar el documento: " + err.message);
    } finally {
      setProcessingDoc(null);
    }
  };

  const handleRejectDocClick = (doc) => {
    setSelectedDoc(doc);
    setMotivoRechazo("");
    setShowRejectModal(true);
  };

  const handleRejectDocConfirm = async () => {
    if (!selectedDoc || !currentProject?.id) return;

    if (!motivoRechazo.trim()) {
      alert("⚠️ Por favor, indica el motivo del rechazo");
      return;
    }

    try {
      setProcessingDoc(selectedDoc.id);
      await API.documentacion.reject(currentProject.id, selectedDoc.id, motivoRechazo);

      // Recargar documentación
      const docs = await API.documentacion.getAll(currentProject.id);
      setDocumentacion(docs);

      setShowRejectModal(false);
      setSelectedDoc(null);
      setMotivoRechazo("");

      alert("✅ Documento rechazado exitosamente");
    } catch (err) {
      console.error("Error al rechazar documento:", err);
      alert("❌ Error al rechazar el documento: " + err.message);
    } finally {
      setProcessingDoc(null);
    }
  };

  const handleRejectModalClose = () => {
    setShowRejectModal(false);
    setSelectedDoc(null);
    setMotivoRechazo("");
  };

  // Mostrar loading
  if (loading && !currentProject) {
    return (
      <div className="dashboard">
        <div className="dashboard__header">
          <div className="dashboard__header-content">
            <div className="dashboard__user">
              <div className="dashboard__avatar">
                <span className="dashboard__avatar-text">
                  {user?.avatar || "UC"}
                </span>
              </div>
              <div className="dashboard__user-info">
                <h1 className="dashboard__user-name">
                  {user?.nombre || "Usuario"}
                </h1>
                <p className="dashboard__user-role">{user?.rol || "Cliente"}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="dashboard__content">
          <div className="dashboard__loading">
            <div className="spinner"></div>
            <p>Cargando proyectos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error && !currentProject) {
    return (
      <div className="dashboard">
        <div className="dashboard__error">
          <p>❌ {error}</p>
          <button onClick={loadProyectos}>Reintentar</button>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay proyectos
  if (!loading && (!proyectos || proyectos.length === 0)) {
    return (
      <div className="dashboard">
        <div className="dashboard__header">
          <div className="dashboard__header-content">
            <div className="dashboard__user">
              <div className="dashboard__avatar">
                <span className="dashboard__avatar-text">
                  {user?.avatar || "UC"}
                </span>
              </div>
              <div className="dashboard__user-info">
                <h1 className="dashboard__user-name">
                  {user?.nombre || "Usuario"}
                </h1>
                <p className="dashboard__user-role">{user?.rol || "Cliente"}</p>
              </div>
            </div>
            <div className="dashboard__actions">
              <button
                className="dashboard__action-btn dashboard__logout-btn"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
        <div className="dashboard__content">
          <div className="dashboard__empty">
            <h2>📂 No hay proyectos disponibles</h2>
            <p>
              No tienes proyectos asignados. Contacta con tu administrador para
              que te asigne proyectos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Validar que currentProject exista antes de renderizar
  if (!currentProject) {
    return (
      <div className="dashboard">
        <div className="dashboard__header">
          <div className="dashboard__header-content">
            <div className="dashboard__user">
              <div className="dashboard__avatar">
                <span className="dashboard__avatar-text">
                  {user?.avatar || "UC"}
                </span>
              </div>
              <div className="dashboard__user-info">
                <h1 className="dashboard__user-name">
                  {user?.nombre || "Usuario"}
                </h1>
                <p className="dashboard__user-role">{user?.rol || "Cliente"}</p>
              </div>
            </div>
            <div className="dashboard__actions">
              <button
                className="dashboard__action-btn dashboard__logout-btn"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
        <div className="dashboard__content">
          <div className="dashboard__loading">
            <div className="spinner"></div>
            <p>Cargando proyecto...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard__header">
        <div className="dashboard__header-content">
          <div className="dashboard__user">
            <div className="dashboard__avatar">
              <span className="dashboard__avatar-text">
                {user?.avatar || "UC"}
              </span>
            </div>
            <div className="dashboard__user-info">
              <h1 className="dashboard__user-name">
                {user?.nombre || "Usuario"}
              </h1>
              <p className="dashboard__user-role">{user?.rol || "Cliente"}</p>
            </div>
          </div>

          <div className="dashboard__actions">
            {user?.rol === 'admin' && (
              <button
                className="dashboard__action-btn dashboard__admin-btn"
                onClick={() => window.location.hash = '/admin'}
                aria-label="Panel de Administración"
                title="Panel de Administración"
              >
                Panel Admin
              </button>
            )}
            <button
              className="dashboard__action-btn dashboard__logout-btn"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="dashboard__content">
        <div className="dashboard__main">
          <ProjectHeader
            projectNames={proyectos.map((p) => p.nombre)}
            currentProject={currentProject}
            onProjectSelect={handleProjectSelect}
            userId={user?.id}
            user={user}
          />

          {/* Panel de Notificaciones de Reuniones - Entre ProjectHeader y ProgressSection en móvil */}
          <MeetingNotifications userId={user?.id} />

          <ProgressSection
            progress={currentProject.progress}
            milestones={currentProject.milestones}
            projectName={currentProject.name}
            projectId={currentProject.id}
            userId={user?.id}
            multimediaPorHito={multimediaPorHito}
          />

          {/* Sección de Documentación */}
          {documentacion.length > 0 && (
            <div style={{ marginTop: "2rem", background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "600" }}>
                📄 Documentación del Proyecto
              </h2>
              <div style={{ display: "grid", gap: "1rem" }}>
                {documentacion.map((doc) => {
                  const isProcessing = processingDoc === doc.id;
                  // Si el documento no tiene estado o es pendiente, se considera pendiente
                  const estado = doc.estado || 'pendiente';
                  const isPendiente = estado === 'pendiente';
                  const isAprobado = estado === 'aprobado';
                  const isRechazado = estado === 'rechazado';

                  return (
                    <div
                      key={doc.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "1rem",
                        border: `2px solid ${isAprobado ? '#10b981' : isRechazado ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: "8px",
                        background: isAprobado ? '#f0fdf4' : isRechazado ? '#fef2f2' : 'white',
                        transition: "all 0.2s",
                        opacity: isProcessing ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                            <h4 style={{ margin: 0, fontWeight: "600", fontSize: "1rem" }}>{doc.titulo}</h4>
                            {isAprobado && (
                              <span style={{ padding: "0.25rem 0.5rem", background: "#10b981", color: "white", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "500" }}>
                                ✓ Aprobado
                              </span>
                            )}
                            {isRechazado && (
                              <span style={{ padding: "0.25rem 0.5rem", background: "#ef4444", color: "white", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "500" }}>
                                ✗ Rechazado
                              </span>
                            )}
                            {isPendiente && (
                              <span style={{ padding: "0.25rem 0.5rem", background: "#f59e0b", color: "white", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "500" }}>
                                ⏳ Pendiente
                              </span>
                            )}
                          </div>
                          <p style={{ margin: "0.25rem 0 0 0", color: "#6b7280", fontSize: "0.875rem" }}>
                            {doc.descripcion}
                          </p>
                          <small style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                            📎 {doc.archivoNombre} - Subido el {formatDate(doc.fechaCreacion)}
                          </small>
                          {isRechazado && doc.motivoRechazo && (
                            <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "#fee2e2", borderLeft: "3px solid #ef4444", borderRadius: "4px" }}>
                              <strong style={{ fontSize: "0.75rem", color: "#991b1b" }}>Motivo del rechazo:</strong>
                              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#7f1d1d" }}>
                                {doc.motivoRechazo}
                              </p>
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <a
                            href={doc.archivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "0.5rem 1rem",
                              background: "#3b82f6",
                              color: "white",
                              borderRadius: "6px",
                              textDecoration: "none",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              transition: "background 0.2s",
                              whiteSpace: "nowrap",
                            }}
                          >
                            📥 Descargar
                          </a>
                        </div>
                      </div>

                      {/* Botones de Aprobación/Rechazo (solo si está pendiente) */}
                      {isPendiente && (
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                          <button
                            onClick={() => handleApproveDoc(doc)}
                            disabled={isProcessing}
                            style={{
                              flex: 1,
                              padding: "0.625rem 1rem",
                              background: isProcessing ? "#9ca3af" : "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={(e) => !isProcessing && (e.target.style.background = "#059669")}
                            onMouseOut={(e) => !isProcessing && (e.target.style.background = "#10b981")}
                          >
                            {isProcessing ? "Procesando..." : "✓ Aprobar Documento"}
                          </button>
                          <button
                            onClick={() => handleRejectDocClick(doc)}
                            disabled={isProcessing}
                            style={{
                              flex: 1,
                              padding: "0.625rem 1rem",
                              background: isProcessing ? "#9ca3af" : "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={(e) => !isProcessing && (e.target.style.background = "#dc2626")}
                            onMouseOut={(e) => !isProcessing && (e.target.style.background = "#ef4444")}
                          >
                            {isProcessing ? "Procesando..." : "✗ Rechazar Documento"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="dashboard__sidebar">
          <RecentActivity
            activities={currentProject.recentActivity}
            projectId={currentProject.id}
          />
          <NotificationsPreferences />
          <QuickStats stats={currentProject.quickStats} />
        </div>
      </div>

      {/* Modal de Rechazo de Documento */}
      {showRejectModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={handleRejectModalClose}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>
              Rechazar Documento
            </h3>
            <p style={{ margin: "0 0 1rem 0", color: "#6b7280", fontSize: "0.875rem" }}>
              Por favor, indica el motivo por el cual rechazas este documento:
            </p>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>
                Documento: <strong>{selectedDoc?.titulo}</strong>
              </label>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Escribe aquí el motivo del rechazo..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={handleRejectModalClose}
                style={{
                  padding: "0.625rem 1rem",
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.background = "#d1d5db")}
                onMouseOut={(e) => (e.target.style.background = "#e5e7eb")}
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectDocConfirm}
                disabled={!motivoRechazo.trim()}
                style={{
                  padding: "0.625rem 1rem",
                  background: motivoRechazo.trim() ? "#ef4444" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: motivoRechazo.trim() ? "pointer" : "not-allowed",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => motivoRechazo.trim() && (e.target.style.background = "#dc2626")}
                onMouseOut={(e) => motivoRechazo.trim() && (e.target.style.background = "#ef4444")}
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Dashboard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombre: PropTypes.string,
    rol: PropTypes.string,
    avatar: PropTypes.string,
  }),
  onLogout: PropTypes.func,
};

Dashboard.defaultProps = {
  user: {
    nombre: "Usuario",
    rol: "Cliente",
    avatar: "UC",
  },
  onLogout: () => {},
};
