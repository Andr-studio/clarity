import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Users,
  FolderKanban,
  Shield,
  Activity,
  TrendingUp,
  Settings,
  Database,
  UserCog
} from "lucide-react";
import "./AdminPanel.css";
import API from "../../services/api";

export default function AdminPanel({ user, onLogout }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      // Cargar todos los usuarios
      const allUsers = await API.usuarios.getAll();
      setUsers(allUsers);

      // Cargar todos los proyectos (admin ve todos)
      const allProjects = await API.proyectos.getAll(user?.id, "admin");
      setProjects(allProjects);

      // Calcular estadísticas
      const activeProjects = allProjects.filter(p => p.estado === "en_progreso" || p.estado === "activo");
      const completedProjects = allProjects.filter(p => p.estado === "completado");

      setStats({
        totalUsers: allUsers.length,
        totalProjects: allProjects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
      });
    } catch (error) {
      console.error("Error cargando datos de administrador:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout?.();
  };

  const getRoleBadgeClass = (rol) => {
    switch (rol) {
      case "admin":
        return "admin-panel__role-badge--admin";
      case "cliente":
        return "admin-panel__role-badge--cliente";
      case "team":
        return "admin-panel__role-badge--team";
      default:
        return "";
    }
  };

  const getStatusBadgeClass = (estado) => {
    switch (estado) {
      case "completado":
        return "admin-panel__status-badge--completed";
      case "en_progreso":
      case "activo":
        return "admin-panel__status-badge--active";
      case "pendiente":
        return "admin-panel__status-badge--pending";
      default:
        return "";
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
    });
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-panel__header">
          <div className="admin-panel__header-content">
            <div className="admin-panel__user">
              <div className="admin-panel__avatar">
                <Shield size={24} />
              </div>
              <div className="admin-panel__user-info">
                <h1 className="admin-panel__user-name">Panel de Administración</h1>
                <p className="admin-panel__user-role">Administrador</p>
              </div>
            </div>
          </div>
        </div>
        <div className="admin-panel__content">
          <div className="admin-panel__loading">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-panel__header">
        <div className="admin-panel__header-content">
          <div className="admin-panel__user">
            <div className="admin-panel__avatar">
              <Shield size={24} />
            </div>
            <div className="admin-panel__user-info">
              <h1 className="admin-panel__user-name">Panel de Administración</h1>
              <p className="admin-panel__user-role">
                {user?.nombre} {user?.apellido} - Administrador
              </p>
            </div>
          </div>

          <div className="admin-panel__actions">
            <button
              className="admin-panel__action-btn admin-panel__dashboard-btn"
              onClick={() => window.location.hash = "/dashboard"}
            >
              Ver Dashboard
            </button>
            <button
              className="admin-panel__action-btn admin-panel__logout-btn"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-panel__stats">
        <div className="admin-panel__stat-card">
          <div className="admin-panel__stat-icon admin-panel__stat-icon--users">
            <Users size={24} />
          </div>
          <div className="admin-panel__stat-content">
            <p className="admin-panel__stat-label">Total Usuarios</p>
            <h3 className="admin-panel__stat-value">{stats.totalUsers}</h3>
          </div>
        </div>

        <div className="admin-panel__stat-card">
          <div className="admin-panel__stat-icon admin-panel__stat-icon--projects">
            <FolderKanban size={24} />
          </div>
          <div className="admin-panel__stat-content">
            <p className="admin-panel__stat-label">Total Proyectos</p>
            <h3 className="admin-panel__stat-value">{stats.totalProjects}</h3>
          </div>
        </div>

        <div className="admin-panel__stat-card">
          <div className="admin-panel__stat-icon admin-panel__stat-icon--active">
            <Activity size={24} />
          </div>
          <div className="admin-panel__stat-content">
            <p className="admin-panel__stat-label">Proyectos Activos</p>
            <h3 className="admin-panel__stat-value">{stats.activeProjects}</h3>
          </div>
        </div>

        <div className="admin-panel__stat-card">
          <div className="admin-panel__stat-icon admin-panel__stat-icon--completed">
            <TrendingUp size={24} />
          </div>
          <div className="admin-panel__stat-content">
            <p className="admin-panel__stat-label">Proyectos Completados</p>
            <h3 className="admin-panel__stat-value">{stats.completedProjects}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-panel__tabs">
        <button
          className={`admin-panel__tab ${activeTab === "overview" ? "admin-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Database size={18} />
          Vista General
        </button>
        <button
          className={`admin-panel__tab ${activeTab === "users" ? "admin-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <UserCog size={18} />
          Usuarios
        </button>
        <button
          className={`admin-panel__tab ${activeTab === "projects" ? "admin-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          <FolderKanban size={18} />
          Proyectos
        </button>
      </div>

      {/* Content */}
      <div className="admin-panel__content">
        {activeTab === "overview" && (
          <div className="admin-panel__overview">
            <div className="admin-panel__section">
              <h2 className="admin-panel__section-title">
                <Users size={20} />
                Usuarios Recientes
              </h2>
              <div className="admin-panel__table-container">
                <table className="admin-panel__table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="admin-panel__user-cell">
                            <div className="admin-panel__user-avatar">{u.avatar}</div>
                            <span>{u.nombre} {u.apellido}</span>
                          </div>
                        </td>
                        <td>{u.correo}</td>
                        <td>
                          <span className={`admin-panel__role-badge ${getRoleBadgeClass(u.rol)}`}>
                            {u.rol}
                          </span>
                        </td>
                        <td>{formatDate(u.fechaCreacion || u.fecha_creacion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-panel__section">
              <h2 className="admin-panel__section-title">
                <FolderKanban size={20} />
                Proyectos Activos
              </h2>
              <div className="admin-panel__table-container">
                <table className="admin-panel__table">
                  <thead>
                    <tr>
                      <th>Proyecto</th>
                      <th>Estado</th>
                      <th>Progreso</th>
                      <th>Presupuesto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.filter(p => p.estado === "en_progreso" || p.estado === "activo").slice(0, 5).map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="admin-panel__project-cell">
                            <strong>{p.nombre}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-panel__status-badge ${getStatusBadgeClass(p.estado)}`}>
                            {p.estado}
                          </span>
                        </td>
                        <td>
                          <div className="admin-panel__progress-bar">
                            <div
                              className="admin-panel__progress-fill"
                              style={{ width: `${p.progreso || 0}%` }}
                            ></div>
                            <span className="admin-panel__progress-text">{p.progreso || 0}%</span>
                          </div>
                        </td>
                        <td>${(p.presupuesto || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="admin-panel__section">
            <h2 className="admin-panel__section-title">
              <Users size={20} />
              Todos los Usuarios ({users.length})
            </h2>
            <div className="admin-panel__table-container">
              <table className="admin-panel__table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Fecha Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="admin-panel__user-cell">
                          <div className="admin-panel__user-avatar">{u.avatar}</div>
                          <span>{u.nombre} {u.apellido}</span>
                        </div>
                      </td>
                      <td>{u.correo}</td>
                      <td>
                        <span className={`admin-panel__role-badge ${getRoleBadgeClass(u.rol)}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td>{formatDate(u.fechaCreacion || u.fecha_creacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="admin-panel__section">
            <h2 className="admin-panel__section-title">
              <FolderKanban size={20} />
              Todos los Proyectos ({projects.length})
            </h2>
            <div className="admin-panel__table-container">
              <table className="admin-panel__table">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Progreso</th>
                    <th>Presupuesto</th>
                    <th>Fecha Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-panel__project-cell">
                          <strong>{p.nombre}</strong>
                          <small>{p.descripcion}</small>
                        </div>
                      </td>
                      <td>{p.creadorNombre || p.creador_nombre || "N/A"}</td>
                      <td>
                        <span className={`admin-panel__status-badge ${getStatusBadgeClass(p.estado)}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td>
                        <div className="admin-panel__progress-bar">
                          <div
                            className="admin-panel__progress-fill"
                            style={{ width: `${p.progreso || 0}%` }}
                          ></div>
                          <span className="admin-panel__progress-text">{p.progreso || 0}%</span>
                        </div>
                      </td>
                      <td>${(p.presupuesto || 0).toLocaleString()}</td>
                      <td>{formatDate(p.fechaInicio || p.fecha_inicio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

AdminPanel.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombre: PropTypes.string,
    apellido: PropTypes.string,
    rol: PropTypes.string,
    avatar: PropTypes.string,
  }),
  onLogout: PropTypes.func,
};

AdminPanel.defaultProps = {
  user: {
    nombre: "Administrador",
    apellido: "",
    rol: "admin",
    avatar: "AD",
  },
  onLogout: () => {},
};
