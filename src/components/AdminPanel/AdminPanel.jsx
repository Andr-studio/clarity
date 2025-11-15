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
  UserCog,
  Plus,
  X
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
  const [userFilter, setUserFilter] = useState("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    rol: "cliente",
  });
  const [projectFormData, setProjectFormData] = useState({
    nombre: "",
    descripcion: "",
    presupuesto: "",
    fechaInicio: "",
    clienteId: "",
    equipoIds: [],
  });

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const newUser = await API.usuarios.crear({
        ...formData,
        avatar: `${formData.nombre.charAt(0)}${formData.apellido.charAt(0)}`.toUpperCase(),
      });

      setUsers([...users, newUser]);
      setShowUserModal(false);
      setFormData({
        nombre: "",
        apellido: "",
        correo: "",
        contrasena: "",
        rol: "cliente",
      });

      // Actualizar estadísticas
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));

      alert("Usuario creado exitosamente");
    } catch (error) {
      console.error("Error creando usuario:", error);
      alert(error.message || "Error al crear usuario. Por favor intente nuevamente.");
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      // Buscar el cliente seleccionado para obtener su nombre
      const cliente = users.find(u => u.id === projectFormData.clienteId);
      const creadorNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : "";

      // Construir el array de equipo con los usuarios seleccionados
      const equipo = projectFormData.equipoIds.map(userId => {
        const teamUser = users.find(u => u.id === userId);
        return {
          userId: userId,
          nombre: teamUser ? `${teamUser.nombre} ${teamUser.apellido}` : "",
          avatar: teamUser ? teamUser.avatar : "",
          rol: "team"
        };
      });

      const newProject = await API.proyectos.crear({
        ...projectFormData,
        creadorId: projectFormData.clienteId,
        creador_id: projectFormData.clienteId,
        creadorNombre: creadorNombre,
        creador_nombre: creadorNombre,
        equipo: equipo,
        estado: "pendiente",
        progreso: 0,
        fechaInicio: projectFormData.fechaInicio,
        fecha_inicio: projectFormData.fechaInicio,
      });

      console.log('✅ Proyecto creado:', {
        id: newProject.id,
        nombre: newProject.nombre,
        creadorId: newProject.creadorId,
        creador_id: newProject.creador_id,
        clienteIdOriginal: projectFormData.clienteId
      });

      setProjects([...projects, newProject]);
      setShowProjectModal(false);
      setProjectFormData({
        nombre: "",
        descripcion: "",
        presupuesto: "",
        fechaInicio: "",
        clienteId: "",
        equipoIds: [],
      });

      // Actualizar estadísticas
      setStats(prev => ({ ...prev, totalProjects: prev.totalProjects + 1 }));

      alert("Proyecto creado exitosamente");
    } catch (error) {
      console.error("Error creando proyecto:", error);
      alert(error.message || "Error al crear proyecto. Por favor intente nuevamente.");
    }
  };

  const getFilteredUsers = () => {
    if (userFilter === "all") return users;
    return users.filter(u => u.rol === userFilter);
  };

  const getClients = () => {
    return users.filter(u => u.rol === "cliente");
  };

  const getTeamUsers = () => {
    return users.filter(u => u.rol === "team");
  };

  const getFilteredProjects = () => {
    if (!selectedClient) return projects;

    // Convertir a string para comparación consistente
    const selectedClientStr = String(selectedClient);

    return projects.filter(p => {
      const creadorIdStr = String(p.creadorId || p.creador_id || '');
      console.log('🔍 Comparando proyecto:', {
        proyectoNombre: p.nombre,
        creadorId: creadorIdStr,
        selectedClient: selectedClientStr,
        coincide: creadorIdStr === selectedClientStr
      });
      return creadorIdStr === selectedClientStr;
    });
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
            <div className="admin-panel__section-header">
              <h2 className="admin-panel__section-title">
                <Users size={20} />
                Todos los Usuarios ({getFilteredUsers().length})
              </h2>
              <div className="admin-panel__filters">
                <select
                  className="admin-panel__filter-select"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                >
                  <option value="all">Todos los roles</option>
                  <option value="admin">Administradores</option>
                  <option value="cliente">Clientes</option>
                  <option value="team">Team</option>
                </select>
                <button
                  className="admin-panel__create-btn"
                  onClick={() => setShowUserModal(true)}
                >
                  <Plus size={18} />
                  Crear Usuario
                </button>
              </div>
            </div>
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
                  {getFilteredUsers().map((u) => (
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
            <div className="admin-panel__section-header">
              <h2 className="admin-panel__section-title">
                <FolderKanban size={20} />
                Todos los Proyectos ({getFilteredProjects().length})
              </h2>
              <div className="admin-panel__filters">
                <select
                  className="admin-panel__filter-select"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="">Todos los clientes</option>
                  {getClients().map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nombre} {client.apellido}
                    </option>
                  ))}
                </select>
                <button
                  className="admin-panel__create-btn"
                  onClick={() => setShowProjectModal(true)}
                >
                  <Plus size={18} />
                  Crear Proyecto
                </button>
              </div>
            </div>
            <div className="admin-panel__table-container">
              {getFilteredProjects().length === 0 ? (
                <div className="admin-panel__empty-state">
                  <FolderKanban size={48} />
                  <h3>
                    {selectedClient
                      ? "Aún no le asignas un proyecto"
                      : "No hay proyectos disponibles"}
                  </h3>
                  <p>
                    {selectedClient
                      ? "Este cliente no tiene proyectos asignados. Crea uno para comenzar."
                      : "Crea un nuevo proyecto para comenzar."}
                  </p>
                </div>
              ) : (
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
                    {getFilteredProjects().map((p) => (
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Crear Usuario */}
      {showUserModal && (
        <div className="admin-panel__modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="admin-panel__modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel__modal-header">
              <h3 className="admin-panel__modal-title">
                <UserCog size={24} />
                Crear Nuevo Usuario
              </h3>
              <button
                className="admin-panel__modal-close"
                onClick={() => setShowUserModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form className="admin-panel__form" onSubmit={handleCreateUser}>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Nombre</label>
                <input
                  type="text"
                  className="admin-panel__form-input"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Apellido</label>
                <input
                  type="text"
                  className="admin-panel__form-input"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="admin-panel__form-input"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Contraseña</label>
                <input
                  type="password"
                  className="admin-panel__form-input"
                  value={formData.contrasena}
                  onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Rol</label>
                <select
                  className="admin-panel__form-select"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  required
                >
                  <option value="cliente">Cliente</option>
                  <option value="team">Team</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="admin-panel__form-actions">
                <button
                  type="button"
                  className="admin-panel__btn admin-panel__btn--secondary"
                  onClick={() => setShowUserModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="admin-panel__btn admin-panel__btn--primary">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Crear Proyecto */}
      {showProjectModal && (
        <div className="admin-panel__modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="admin-panel__modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel__modal-header">
              <h3 className="admin-panel__modal-title">
                <FolderKanban size={24} />
                Crear Nuevo Proyecto
              </h3>
              <button
                className="admin-panel__modal-close"
                onClick={() => setShowProjectModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form className="admin-panel__form" onSubmit={handleCreateProject}>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Cliente</label>
                <select
                  className="admin-panel__form-select"
                  value={projectFormData.clienteId}
                  onChange={(e) => setProjectFormData({ ...projectFormData, clienteId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {getClients().map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nombre} {client.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Nombre del Proyecto</label>
                <input
                  type="text"
                  className="admin-panel__form-input"
                  value={projectFormData.nombre}
                  onChange={(e) => setProjectFormData({ ...projectFormData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Descripción</label>
                <textarea
                  className="admin-panel__form-textarea"
                  value={projectFormData.descripcion}
                  onChange={(e) => setProjectFormData({ ...projectFormData, descripcion: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Presupuesto</label>
                <input
                  type="number"
                  className="admin-panel__form-input"
                  value={projectFormData.presupuesto}
                  onChange={(e) => setProjectFormData({ ...projectFormData, presupuesto: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Fecha de Inicio</label>
                <input
                  type="date"
                  className="admin-panel__form-input"
                  value={projectFormData.fechaInicio}
                  onChange={(e) => setProjectFormData({ ...projectFormData, fechaInicio: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Equipo a Cargo (Team)</label>
                <select
                  multiple
                  className="admin-panel__form-select"
                  value={projectFormData.equipoIds}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setProjectFormData({ ...projectFormData, equipoIds: selectedOptions });
                  }}
                  style={{ minHeight: "100px" }}
                >
                  {getTeamUsers().map((teamUser) => (
                    <option key={teamUser.id} value={teamUser.id}>
                      {teamUser.nombre} {teamUser.apellido}
                    </option>
                  ))}
                </select>
                <small style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem", display: "block" }}>
                  Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples usuarios
                </small>
              </div>
              <div className="admin-panel__form-actions">
                <button
                  type="button"
                  className="admin-panel__btn admin-panel__btn--secondary"
                  onClick={() => setShowProjectModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="admin-panel__btn admin-panel__btn--primary">
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
