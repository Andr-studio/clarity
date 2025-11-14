import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import ProjectHeader from "../ProjectHeader/ProjectHeader";
import ProgressSection from "../ProgressSection/ProgressSection";
import RecentActivity from "../RecentActivity/RecentActivity";
import NotificationsPreferences from "../NotificationsPreferences/NotificationsPreferences";
import QuickStats from "../QuickStats/QuickStats";
import "./Dashboard.css";
import API from "../../services/api";

export default function Dashboard({ user, onLogout }) {
  // Estados
  const [proyectos, setProyectos] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  const handleProjectSelect = (proyectoNombre) => {
    const proyecto = proyectos.find((p) => p.nombre === proyectoNombre);
    if (proyecto) {
      loadProyectoDetalle(proyecto.id);
    }
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
              {user?.rol === 'admin' && (
                <button
                  className="dashboard__action-btn dashboard__admin-btn"
                  onClick={handleAdminPanel}
                >
                  Panel Admin
                </button>
              )}
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
              {user?.rol === 'admin' && (
                <button
                  className="dashboard__action-btn dashboard__admin-btn"
                  onClick={handleAdminPanel}
                >
                  Panel Admin
                </button>
              )}
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
                onClick={handleAdminPanel}
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
          <ProgressSection
            progress={currentProject.progress}
            milestones={currentProject.milestones}
            projectName={currentProject.name}
            projectId={currentProject.id}
            userId={user?.id}
          />
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
