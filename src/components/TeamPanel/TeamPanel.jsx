import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Users,
  FolderKanban,
  Target,
  Activity,
  TrendingUp,
  Plus,
  X,
  Briefcase,
  Calendar,
  CheckCircle
} from "lucide-react";
import "./TeamPanel.css";
import API from "../../services/api";

export default function TeamPanel({ user, onLogout }) {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProjects: 0,
    totalMilestones: 0,
    completedMilestones: 0,
  });
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneFormData, setMilestoneFormData] = useState({
    nombre: "",
    descripcion: "",
    fechaLimite: "",
    proyectoId: "",
  });

  useEffect(() => {
    loadTeamData();
  }, [user]);

  const loadTeamData = async () => {
    try {
      setLoading(true);

      // Cargar todos los proyectos asignados al usuario team
      const userProjects = await API.proyectos.getAll(user?.id, "team");
      setProjects(userProjects);

      // Extraer clientes únicos de los proyectos
      const uniqueClients = [];
      const clientIds = new Set();

      for (const project of userProjects) {
        const clientId = project.creadorId || project.creador_id;
        if (clientId && !clientIds.has(clientId)) {
          clientIds.add(clientId);
          // Obtener información del cliente
          try {
            const clientInfo = await API.usuarios.getById(clientId);
            uniqueClients.push(clientInfo);
          } catch (error) {
            console.error(`Error obteniendo cliente ${clientId}:`, error);
          }
        }
      }

      setClients(uniqueClients);

      // Cargar todos los hitos de los proyectos asignados
      const allMilestones = [];
      for (const project of userProjects) {
        try {
          const projectMilestones = await API.milestones.getAll(project.id);
          allMilestones.push(...projectMilestones.map(m => ({
            ...m,
            proyectoNombre: project.nombre,
            proyectoId: project.id
          })));
        } catch (error) {
          console.error(`Error cargando hitos del proyecto ${project.id}:`, error);
        }
      }

      setMilestones(allMilestones);

      // Calcular estadísticas
      const completedMilestones = allMilestones.filter(m => m.estado === "completado");

      setStats({
        totalClients: uniqueClients.length,
        totalProjects: userProjects.length,
        totalMilestones: allMilestones.length,
        completedMilestones: completedMilestones.length,
      });
    } catch (error) {
      console.error("Error cargando datos del equipo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout?.();
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      const project = projects.find(p => p.id === milestoneFormData.proyectoId);

      const newMilestone = await API.milestones.crear(milestoneFormData.proyectoId, {
        nombre: milestoneFormData.nombre,
        descripcion: milestoneFormData.descripcion,
        fechaLimite: milestoneFormData.fechaLimite,
        fecha_limite: milestoneFormData.fechaLimite,
        responsableId: user.id,
        responsable_id: user.id,
        responsableNombre: `${user.nombre} ${user.apellido}`,
        responsable_nombre: `${user.nombre} ${user.apellido}`,
        responsableAvatar: user.avatar,
        estado: "pendiente",
        progreso: 0,
      });

      setMilestones([...milestones, {
        ...newMilestone,
        proyectoNombre: project?.nombre || "Proyecto",
        proyectoId: milestoneFormData.proyectoId
      }]);

      setShowMilestoneModal(false);
      setMilestoneFormData({
        nombre: "",
        descripcion: "",
        fechaLimite: "",
        proyectoId: "",
      });

      // Actualizar estadísticas
      setStats(prev => ({ ...prev, totalMilestones: prev.totalMilestones + 1 }));

      alert("Hito creado exitosamente");
    } catch (error) {
      console.error("Error creando hito:", error);
      alert(error.message || "Error al crear hito. Por favor intente nuevamente.");
    }
  };

  const getFilteredProjects = () => {
    if (!selectedClient) return projects;

    const selectedClientStr = String(selectedClient);
    return projects.filter(p => {
      const creadorIdStr = String(p.creadorId || p.creador_id || '');
      return creadorIdStr === selectedClientStr;
    });
  };

  const getFilteredMilestones = () => {
    if (!selectedProject) return milestones;

    return milestones.filter(m => m.proyectoId === selectedProject);
  };

  const getProjectsByClient = (clientId) => {
    const clientIdStr = String(clientId);
    return projects.filter(p => {
      const creadorIdStr = String(p.creadorId || p.creador_id || '');
      return creadorIdStr === clientIdStr;
    });
  };

  const getStatusBadgeClass = (estado) => {
    switch (estado) {
      case "completado":
        return "team-panel__status-badge--completed";
      case "en_progreso":
      case "activo":
        return "team-panel__status-badge--active";
      case "pendiente":
        return "team-panel__status-badge--pending";
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
      <div className="team-panel">
        <div className="team-panel__header">
          <div className="team-panel__header-content">
            <div className="team-panel__user">
              <div className="team-panel__avatar">
                <Briefcase size={24} />
              </div>
              <div className="team-panel__user-info">
                <h1 className="team-panel__user-name">Panel de Equipo</h1>
                <p className="team-panel__user-role">Miembro del Equipo</p>
              </div>
            </div>
          </div>
        </div>
        <div className="team-panel__content">
          <div className="team-panel__loading">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-panel">
      {/* Header */}
      <div className="team-panel__header">
        <div className="team-panel__header-content">
          <div className="team-panel__user">
            <div className="team-panel__avatar">
              <Briefcase size={24} />
            </div>
            <div className="team-panel__user-info">
              <h1 className="team-panel__user-name">Panel de Equipo</h1>
              <p className="team-panel__user-role">
                {user?.nombre} {user?.apellido} - Team
              </p>
            </div>
          </div>

          <div className="team-panel__actions">
            <button
              className="team-panel__action-btn team-panel__logout-btn"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="team-panel__stats">
        <div className="team-panel__stat-card">
          <div className="team-panel__stat-icon team-panel__stat-icon--clients">
            <Users size={24} />
          </div>
          <div className="team-panel__stat-content">
            <p className="team-panel__stat-label">Total Clientes</p>
            <h3 className="team-panel__stat-value">{stats.totalClients}</h3>
          </div>
        </div>

        <div className="team-panel__stat-card">
          <div className="team-panel__stat-icon team-panel__stat-icon--projects">
            <FolderKanban size={24} />
          </div>
          <div className="team-panel__stat-content">
            <p className="team-panel__stat-label">Total Proyectos</p>
            <h3 className="team-panel__stat-value">{stats.totalProjects}</h3>
          </div>
        </div>

        <div className="team-panel__stat-card">
          <div className="team-panel__stat-icon team-panel__stat-icon--milestones">
            <Target size={24} />
          </div>
          <div className="team-panel__stat-content">
            <p className="team-panel__stat-label">Total Hitos</p>
            <h3 className="team-panel__stat-value">{stats.totalMilestones}</h3>
          </div>
        </div>

        <div className="team-panel__stat-card">
          <div className="team-panel__stat-icon team-panel__stat-icon--completed">
            <CheckCircle size={24} />
          </div>
          <div className="team-panel__stat-content">
            <p className="team-panel__stat-label">Hitos Completados</p>
            <h3 className="team-panel__stat-value">{stats.completedMilestones}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="team-panel__tabs">
        <button
          className={`team-panel__tab ${activeTab === "overview" ? "team-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Activity size={18} />
          Vista General
        </button>
        <button
          className={`team-panel__tab ${activeTab === "clients" ? "team-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("clients")}
        >
          <Users size={18} />
          Clientes
        </button>
        <button
          className={`team-panel__tab ${activeTab === "milestones" ? "team-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("milestones")}
        >
          <Target size={18} />
          Hitos
        </button>
      </div>

      {/* Content */}
      <div className="team-panel__content">
        {activeTab === "overview" && (
          <div className="team-panel__overview">
            <div className="team-panel__section">
              <h2 className="team-panel__section-title">
                <FolderKanban size={20} />
                Proyectos Asignados
              </h2>
              <div className="team-panel__table-container">
                {projects.length === 0 ? (
                  <div className="team-panel__empty-state">
                    <FolderKanban size={48} />
                    <h3>No tienes proyectos asignados</h3>
                    <p>Espera a que un administrador te asigne a un proyecto.</p>
                  </div>
                ) : (
                  <table className="team-panel__table">
                    <thead>
                      <tr>
                        <th>Proyecto</th>
                        <th>Cliente</th>
                        <th>Estado</th>
                        <th>Progreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.slice(0, 5).map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="team-panel__project-cell">
                              <strong>{p.nombre}</strong>
                              <small>{p.descripcion}</small>
                            </div>
                          </td>
                          <td>{p.creadorNombre || p.creador_nombre || "N/A"}</td>
                          <td>
                            <span className={`team-panel__status-badge ${getStatusBadgeClass(p.estado)}`}>
                              {p.estado}
                            </span>
                          </td>
                          <td>
                            <div className="team-panel__progress-bar">
                              <div
                                className="team-panel__progress-fill"
                                style={{ width: `${p.progreso || 0}%` }}
                              ></div>
                              <span className="team-panel__progress-text">{p.progreso || 0}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="team-panel__section">
              <h2 className="team-panel__section-title">
                <Target size={20} />
                Hitos Recientes
              </h2>
              <div className="team-panel__table-container">
                {milestones.length === 0 ? (
                  <div className="team-panel__empty-state">
                    <Target size={48} />
                    <h3>No hay hitos creados</h3>
                    <p>Crea un nuevo hito para comenzar a trabajar.</p>
                  </div>
                ) : (
                  <table className="team-panel__table">
                    <thead>
                      <tr>
                        <th>Hito</th>
                        <th>Proyecto</th>
                        <th>Estado</th>
                        <th>Fecha Límite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milestones.slice(0, 5).map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div className="team-panel__milestone-cell">
                              <strong>{m.nombre}</strong>
                              <small>{m.descripcion}</small>
                            </div>
                          </td>
                          <td>{m.proyectoNombre}</td>
                          <td>
                            <span className={`team-panel__status-badge ${getStatusBadgeClass(m.estado)}`}>
                              {m.estado}
                            </span>
                          </td>
                          <td>{formatDate(m.fechaLimite || m.fecha_limite)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "clients" && (
          <div className="team-panel__section">
            <div className="team-panel__section-header">
              <h2 className="team-panel__section-title">
                <Users size={20} />
                Mis Clientes ({clients.length})
              </h2>
            </div>
            <div className="team-panel__clients-grid">
              {clients.length === 0 ? (
                <div className="team-panel__empty-state">
                  <Users size={48} />
                  <h3>No tienes clientes asignados</h3>
                  <p>Espera a que te asignen a proyectos de clientes.</p>
                </div>
              ) : (
                clients.map((client) => {
                  const clientProjects = getProjectsByClient(client.id);
                  return (
                    <div key={client.id} className="team-panel__client-card">
                      <div className="team-panel__client-header">
                        <div className="team-panel__client-avatar">{client.avatar}</div>
                        <div className="team-panel__client-info">
                          <h3 className="team-panel__client-name">
                            {client.nombre} {client.apellido}
                          </h3>
                          <p className="team-panel__client-email">{client.correo}</p>
                        </div>
                      </div>
                      <div className="team-panel__client-stats">
                        <div className="team-panel__client-stat">
                          <FolderKanban size={16} />
                          <span>{clientProjects.length} proyecto(s)</span>
                        </div>
                      </div>
                      <div className="team-panel__client-projects">
                        <h4>Proyectos:</h4>
                        <ul>
                          {clientProjects.map((project) => (
                            <li key={project.id}>
                              <span>{project.nombre}</span>
                              <span className={`team-panel__status-badge ${getStatusBadgeClass(project.estado)}`}>
                                {project.estado}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="team-panel__section">
            <div className="team-panel__section-header">
              <h2 className="team-panel__section-title">
                <Target size={20} />
                Todos los Hitos ({getFilteredMilestones().length})
              </h2>
              <div className="team-panel__filters">
                <select
                  className="team-panel__filter-select"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Todos los proyectos</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.nombre}
                    </option>
                  ))}
                </select>
                <button
                  className="team-panel__create-btn"
                  onClick={() => setShowMilestoneModal(true)}
                >
                  <Plus size={18} />
                  Crear Hito
                </button>
              </div>
            </div>
            <div className="team-panel__table-container">
              {getFilteredMilestones().length === 0 ? (
                <div className="team-panel__empty-state">
                  <Target size={48} />
                  <h3>No hay hitos disponibles</h3>
                  <p>Crea un nuevo hito para comenzar.</p>
                </div>
              ) : (
                <table className="team-panel__table">
                  <thead>
                    <tr>
                      <th>Hito</th>
                      <th>Proyecto</th>
                      <th>Estado</th>
                      <th>Progreso</th>
                      <th>Responsable</th>
                      <th>Fecha Límite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredMilestones().map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="team-panel__milestone-cell">
                            <strong>{m.nombre}</strong>
                            <small>{m.descripcion}</small>
                          </div>
                        </td>
                        <td>{m.proyectoNombre}</td>
                        <td>
                          <span className={`team-panel__status-badge ${getStatusBadgeClass(m.estado)}`}>
                            {m.estado}
                          </span>
                        </td>
                        <td>
                          <div className="team-panel__progress-bar">
                            <div
                              className="team-panel__progress-fill"
                              style={{ width: `${m.progreso || 0}%` }}
                            ></div>
                            <span className="team-panel__progress-text">{m.progreso || 0}%</span>
                          </div>
                        </td>
                        <td>
                          <div className="team-panel__user-cell">
                            <div className="team-panel__user-avatar">{m.responsableAvatar}</div>
                            <span>{m.responsableNombre || m.responsable_nombre}</span>
                          </div>
                        </td>
                        <td>{formatDate(m.fechaLimite || m.fecha_limite)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Crear Hito */}
      {showMilestoneModal && (
        <div className="team-panel__modal-overlay" onClick={() => setShowMilestoneModal(false)}>
          <div className="team-panel__modal" onClick={(e) => e.stopPropagation()}>
            <div className="team-panel__modal-header">
              <h3 className="team-panel__modal-title">
                <Target size={24} />
                Crear Nuevo Hito
              </h3>
              <button
                className="team-panel__modal-close"
                onClick={() => setShowMilestoneModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form className="team-panel__form" onSubmit={handleCreateMilestone}>
              <div className="team-panel__form-group">
                <label className="team-panel__form-label">Proyecto</label>
                <select
                  className="team-panel__form-select"
                  value={milestoneFormData.proyectoId}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, proyectoId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="team-panel__form-group">
                <label className="team-panel__form-label">Nombre del Hito</label>
                <input
                  type="text"
                  className="team-panel__form-input"
                  value={milestoneFormData.nombre}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="team-panel__form-group">
                <label className="team-panel__form-label">Descripción</label>
                <textarea
                  className="team-panel__form-textarea"
                  value={milestoneFormData.descripcion}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, descripcion: e.target.value })}
                  required
                />
              </div>
              <div className="team-panel__form-group">
                <label className="team-panel__form-label">Fecha Límite</label>
                <input
                  type="date"
                  className="team-panel__form-input"
                  value={milestoneFormData.fechaLimite}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, fechaLimite: e.target.value })}
                  required
                />
              </div>
              <div className="team-panel__form-actions">
                <button
                  type="button"
                  className="team-panel__btn team-panel__btn--secondary"
                  onClick={() => setShowMilestoneModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="team-panel__btn team-panel__btn--primary">
                  Crear Hito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

TeamPanel.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombre: PropTypes.string,
    apellido: PropTypes.string,
    rol: PropTypes.string,
    avatar: PropTypes.string,
  }),
  onLogout: PropTypes.func,
};

TeamPanel.defaultProps = {
  user: {
    nombre: "Usuario",
    apellido: "Team",
    rol: "team",
    avatar: "UT",
  },
  onLogout: () => {},
};
