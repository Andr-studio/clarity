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
  const [expandedMilestones, setExpandedMilestones] = useState({});

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

  const toggleMilestone = (milestoneId) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [milestoneId]: !prev[milestoneId],
    }));
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
          />

          {/* Sección de Documentación */}
          {documentacion.length > 0 && (
            <div style={{ marginTop: "2rem", background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "600" }}>
                📄 Documentación del Proyecto
              </h2>
              <div style={{ display: "grid", gap: "1rem" }}>
                {documentacion.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontWeight: "600", fontSize: "1rem" }}>{doc.titulo}</h4>
                      <p style={{ margin: "0.25rem 0 0 0", color: "#6b7280", fontSize: "0.875rem" }}>
                        {doc.descripcion}
                      </p>
                      <small style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                        📎 {doc.archivoNombre} - Subido el {formatDate(doc.fechaCreacion)}
                      </small>
                    </div>
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
                      }}
                    >
                      Descargar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Sección de Multimedia de Hitos */}
          {Object.keys(multimediaPorHito).length > 0 && (
            <div style={{ marginTop: "2rem", background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "600" }}>
                🎬 Avances Multimedia de Hitos
              </h2>
              <p style={{ marginBottom: "1.5rem", color: "#6b7280", fontSize: "0.875rem" }}>
                Imágenes y videos subidos por el equipo mostrando el progreso de cada hito
              </p>

              {currentProject.milestones.map((milestone) => {
                const multimedia = multimediaPorHito[milestone.id];
                if (!multimedia || multimedia.length === 0) return null;

                const isExpanded = expandedMilestones[milestone.id];

                return (
                  <div
                    key={milestone.id}
                    style={{
                      marginBottom: "1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      background: "#f9fafb",
                      overflow: "hidden",
                    }}
                  >
                    {/* Header del hito - Clickeable para expandir/colapsar */}
                    <div
                      onClick={() => toggleMilestone(milestone.id)}
                      style={{
                        padding: "1rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: isExpanded ? "#f3f4f6" : "white",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.background = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.background = "white";
                        }
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "600", color: "#1f2937" }}>
                          {milestone.title}
                        </h3>
                        <div style={{ marginTop: "0.25rem", display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
                          <span>👤 {milestone.assignee}</span>
                          <span>📊 {milestone.progress}% completado</span>
                          <span>📎 {multimedia.length} archivo{multimedia.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div style={{
                        padding: "0.5rem",
                        background: "#3b82f6",
                        color: "white",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        minWidth: "120px",
                        textAlign: "center",
                      }}>
                        {isExpanded ? "▼ Ocultar" : "▶ Expandir"}
                      </div>
                    </div>

                    {/* Contenido expandible - Lista de archivos */}
                    {isExpanded && (
                      <div style={{
                        padding: "1rem",
                        background: "white",
                        borderTop: "1px solid #e5e7eb",
                      }}>
                        <div style={{
                          display: "grid",
                          gap: "0.75rem",
                        }}>
                          {multimedia.map((media) => (
                            <div
                              key={media.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "1rem",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                background: "#f9fafb",
                                transition: "box-shadow 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                  <span style={{ fontSize: "1.5rem" }}>
                                    {media.archivoTipo?.startsWith('image/') ? '🖼️' : '🎥'}
                                  </span>
                                  <div>
                                    <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#1f2937" }}>
                                      {media.archivoNombre || 'Archivo multimedia'}
                                    </div>
                                    {media.descripcion && (
                                      <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
                                        {media.descripcion}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#9ca3af", display: "flex", gap: "1rem" }}>
                                  {media.usuarioNombre && <span>📤 {media.usuarioNombre}</span>}
                                  <span>📅 {formatDate(media.fechaCreacion)}</span>
                                </div>
                              </div>
                              <a
                                href={media.archivoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-block",
                                  padding: "0.75rem 1.5rem",
                                  background: media.archivoTipo?.startsWith('image/') ? "#10b981" : "#8b5cf6",
                                  color: "white",
                                  borderRadius: "6px",
                                  textDecoration: "none",
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                  transition: "transform 0.2s, box-shadow 0.2s",
                                  whiteSpace: "nowrap",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                              >
                                {media.archivoTipo?.startsWith('image/') ? '🖼️ Ver imagen' : '🎥 Ver video'}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
