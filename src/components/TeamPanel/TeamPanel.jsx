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
  CheckCircle,
  Edit2,
  Trash2,
  Image,
  Upload,
  Video,
  Eye
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
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMultimediaModal, setShowMultimediaModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [multimediaFiles, setMultimediaFiles] = useState([]);
  const [uploadingMultimedia, setUploadingMultimedia] = useState(false);
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

      console.log('👤 Usuario team cargando datos:', {
        userId: user?.id,
        userIdType: typeof user?.id,
        nombre: user?.nombre,
        apellido: user?.apellido,
        rol: user?.rol
      });

      // Cargar todos los proyectos asignados al usuario team
      const userProjects = await API.proyectos.getAll(user?.id, "team");
      console.log('📁 Proyectos obtenidos para team:', userProjects.length);
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

      const result = await API.milestones.create({
        proyecto_id: milestoneFormData.proyectoId,
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
        usuario_id: user.id,
        usuarioNombre: `${user.nombre} ${user.apellido}`,
      });

      if (!result.success) {
        throw new Error(result.message || 'Error al crear hito');
      }

      const newMilestone = {
        id: result.hito_id,
        proyecto_id: milestoneFormData.proyectoId,
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
      };

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

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
    setMilestoneFormData({
      nombre: milestone.nombre,
      descripcion: milestone.descripcion,
      fechaLimite: milestone.fechaLimite || milestone.fecha_limite,
      proyectoId: milestone.proyectoId || milestone.proyecto_id,
      progreso: milestone.progreso || 0,
      estado: milestone.estado || "pendiente",
    });
    setShowEditModal(true);
  };

  const handleUpdateMilestone = async (e) => {
    e.preventDefault();
    try {
      const result = await API.milestones.update(editingMilestone.id, {
        proyecto_id: milestoneFormData.proyectoId,
        nombre: milestoneFormData.nombre,
        descripcion: milestoneFormData.descripcion,
        fechaLimite: milestoneFormData.fechaLimite,
        fecha_limite: milestoneFormData.fechaLimite,
        progreso: parseInt(milestoneFormData.progreso || 0),
        estado: milestoneFormData.estado,
        usuario_id: user.id,
        usuarioNombre: `${user.nombre} ${user.apellido}`,
      });

      if (!result.success) {
        throw new Error(result.message || 'Error al actualizar hito');
      }

      // Actualizar el hito en la lista local
      setMilestones(milestones.map(m =>
        m.id === editingMilestone.id
          ? { ...m, ...milestoneFormData }
          : m
      ));

      setShowEditModal(false);
      setEditingMilestone(null);
      setMilestoneFormData({
        nombre: "",
        descripcion: "",
        fechaLimite: "",
        proyectoId: "",
        progreso: 0,
        estado: "pendiente",
      });

      alert("Hito actualizado exitosamente");
    } catch (error) {
      console.error("Error actualizando hito:", error);
      alert(error.message || "Error al actualizar hito. Por favor intente nuevamente.");
    }
  };

  const handleDeleteMilestone = async (milestone) => {
    if (!window.confirm(`¿Estás seguro de eliminar el hito "${milestone.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const result = await API.milestones.delete(milestone.proyectoId, milestone.id);

      if (!result.success) {
        throw new Error(result.message || 'Error al eliminar hito');
      }

      // Eliminar el hito de la lista local
      setMilestones(milestones.filter(m => m.id !== milestone.id));

      // Actualizar estadísticas
      setStats(prev => ({
        ...prev,
        totalMilestones: prev.totalMilestones - 1,
        completedMilestones: milestone.estado === "completado"
          ? prev.completedMilestones - 1
          : prev.completedMilestones
      }));

      alert("Hito eliminado exitosamente");
    } catch (error) {
      console.error("Error eliminando hito:", error);
      alert(error.message || "Error al eliminar hito. Por favor intente nuevamente.");
    }
  };

  const handleUpdateProgress = async (milestone, newProgress) => {
    try {
      // Determinar el estado basado en el progreso
      let newEstado = milestone.estado;
      if (newProgress === 0) {
        newEstado = "pendiente";
      } else if (newProgress === 100) {
        newEstado = "completado";
      } else {
        newEstado = "en_progreso";
      }

      const result = await API.milestones.update(milestone.id, {
        proyecto_id: milestone.proyectoId,
        progreso: parseInt(newProgress),
        estado: newEstado,
        usuario_id: user.id,
        usuarioNombre: `${user.nombre} ${user.apellido}`,
      });

      if (!result.success) {
        throw new Error(result.message || 'Error al actualizar progreso');
      }

      // Actualizar el hito en la lista local
      setMilestones(milestones.map(m =>
        m.id === milestone.id
          ? { ...m, progreso: parseInt(newProgress), estado: newEstado }
          : m
      ));

      // Actualizar estadísticas si cambió el estado
      if (milestone.estado !== newEstado) {
        setStats(prev => ({
          ...prev,
          completedMilestones: newEstado === "completado"
            ? prev.completedMilestones + 1
            : milestone.estado === "completado"
              ? prev.completedMilestones - 1
              : prev.completedMilestones
        }));
      }
    } catch (error) {
      console.error("Error actualizando progreso:", error);
      alert(error.message || "Error al actualizar progreso. Por favor intente nuevamente.");
    }
  };

  const handleOpenMultimediaModal = async (milestone) => {
    setSelectedMilestone(milestone);
    setShowMultimediaModal(true);

    // Cargar archivos multimedia del hito
    try {
      const multimedia = await API.milestones.getMultimedia(milestone.proyectoId, milestone.id);
      setMultimediaFiles(multimedia);
    } catch (error) {
      console.error("Error cargando multimedia:", error);
      setMultimediaFiles([]);
    }
  };

  const handleUploadMultimedia = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    setUploadingMultimedia(true);

    try {
      for (const file of files) {
        const result = await API.milestones.addMultimedia(
          selectedMilestone.proyectoId,
          selectedMilestone.id,
          file,
          {
            descripcion: `Archivo subido por ${user.nombre} ${user.apellido}`,
            usuarioId: user.id,
            usuarioNombre: `${user.nombre} ${user.apellido}`,
          }
        );

        if (!result.success) {
          throw new Error(result.message || 'Error al subir archivo');
        }
      }

      // Recargar multimedia
      const multimedia = await API.milestones.getMultimedia(selectedMilestone.proyectoId, selectedMilestone.id);
      setMultimediaFiles(multimedia);

      alert("Archivos subidos exitosamente");
    } catch (error) {
      console.error("Error subiendo multimedia:", error);
      alert(error.message || "Error al subir archivos. Por favor intente nuevamente.");
    } finally {
      setUploadingMultimedia(false);
      e.target.value = null; // Reset file input
    }
  };

  const handleDeleteMultimedia = async (multimediaId) => {
    if (!window.confirm("¿Estás seguro de eliminar este archivo?")) {
      return;
    }

    try {
      const result = await API.milestones.deleteMultimedia(
        selectedMilestone.proyectoId,
        selectedMilestone.id,
        multimediaId
      );

      if (!result.success) {
        throw new Error(result.message || 'Error al eliminar archivo');
      }

      // Actualizar lista de multimedia
      setMultimediaFiles(multimediaFiles.filter(f => f.id !== multimediaId));

      alert("Archivo eliminado exitosamente");
    } catch (error) {
      console.error("Error eliminando multimedia:", error);
      alert(error.message || "Error al eliminar archivo. Por favor intente nuevamente.");
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
                      <th>Acciones</th>
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
                          <div className="team-panel__progress-container">
                            <div className="team-panel__progress-bar">
                              <div
                                className="team-panel__progress-fill"
                                style={{ width: `${m.progreso || 0}%` }}
                              ></div>
                              <span className="team-panel__progress-text">{m.progreso || 0}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={m.progreso || 0}
                              onChange={(e) => handleUpdateProgress(m, e.target.value)}
                              className="team-panel__progress-slider"
                              title="Actualizar progreso"
                            />
                          </div>
                        </td>
                        <td>
                          <div className="team-panel__user-cell">
                            <div className="team-panel__user-avatar">{m.responsableAvatar}</div>
                            <span>{m.responsableNombre || m.responsable_nombre}</span>
                          </div>
                        </td>
                        <td>{formatDate(m.fechaLimite || m.fecha_limite)}</td>
                        <td>
                          <div className="team-panel__actions-cell">
                            <button
                              className="team-panel__icon-btn"
                              onClick={() => handleEditMilestone(m)}
                              title="Editar hito"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="team-panel__icon-btn"
                              onClick={() => handleOpenMultimediaModal(m)}
                              title="Gestionar multimedia"
                            >
                              <Image size={16} />
                            </button>
                            <button
                              className="team-panel__icon-btn team-panel__icon-btn--danger"
                              onClick={() => handleDeleteMilestone(m)}
                              title="Eliminar hito"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
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

      {/* Modal de Editar Hito */}
      {showEditModal && editingMilestone && (
        <div className="team-panel__modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="team-panel__modal" onClick={(e) => e.stopPropagation()}>
            <div className="team-panel__modal-header">
              <h3 className="team-panel__modal-title">
                <Edit2 size={24} />
                Editar Hito
              </h3>
              <button
                className="team-panel__modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form className="team-panel__form" onSubmit={handleUpdateMilestone}>
              <div className="team-panel__form-group">
                <label className="team-panel__form-label">Proyecto</label>
                <select
                  className="team-panel__form-select"
                  value={milestoneFormData.proyectoId}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, proyectoId: e.target.value })}
                  required
                  disabled
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
                <label className="team-panel__form-label">Estado</label>
                <select
                  className="team-panel__form-select"
                  value={milestoneFormData.estado}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, estado: e.target.value })}
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
              <div className="team-panel__form-group">
                <label className="team-panel__form-label">Progreso (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="team-panel__form-input"
                  value={milestoneFormData.progreso}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, progreso: e.target.value })}
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
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="team-panel__btn team-panel__btn--primary">
                  Actualizar Hito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Multimedia */}
      {showMultimediaModal && selectedMilestone && (
        <div className="team-panel__modal-overlay" onClick={() => setShowMultimediaModal(false)}>
          <div className="team-panel__modal team-panel__modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="team-panel__modal-header">
              <h3 className="team-panel__modal-title">
                <Image size={24} />
                Multimedia - {selectedMilestone.nombre}
              </h3>
              <button
                className="team-panel__modal-close"
                onClick={() => setShowMultimediaModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="team-panel__modal-body">
              <div className="team-panel__upload-section">
                <label className="team-panel__upload-btn" htmlFor="multimedia-upload">
                  <Upload size={20} />
                  {uploadingMultimedia ? "Subiendo..." : "Subir Imágenes o Videos"}
                  <input
                    id="multimedia-upload"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleUploadMultimedia}
                    disabled={uploadingMultimedia}
                    style={{ display: "none" }}
                  />
                </label>
                <p className="team-panel__upload-hint">
                  Formatos soportados: imágenes (JPG, PNG, GIF) y videos (MP4, MOV, AVI)
                </p>
              </div>

              <div className="team-panel__multimedia-grid">
                {multimediaFiles.length === 0 ? (
                  <div className="team-panel__empty-state">
                    <Image size={48} />
                    <h3>No hay archivos multimedia</h3>
                    <p>Sube imágenes o videos para documentar el progreso de este hito.</p>
                  </div>
                ) : (
                  multimediaFiles.map((file) => (
                    <div key={file.id} className="team-panel__multimedia-item">
                      <div className="team-panel__multimedia-preview">
                        {file.archivoTipo?.startsWith("image/") ? (
                          <img
                            src={file.archivoUrl}
                            alt={file.archivoNombre}
                            className="team-panel__multimedia-image"
                          />
                        ) : file.archivoTipo?.startsWith("video/") ? (
                          <video
                            src={file.archivoUrl}
                            controls
                            className="team-panel__multimedia-video"
                          />
                        ) : null}
                      </div>
                      <div className="team-panel__multimedia-info">
                        <p className="team-panel__multimedia-name">{file.archivoNombre}</p>
                        <p className="team-panel__multimedia-date">
                          {file.fechaCreacion
                            ? new Date(file.fechaCreacion).toLocaleDateString("es-ES")
                            : "N/A"}
                        </p>
                        <p className="team-panel__multimedia-user">{file.usuarioNombre}</p>
                      </div>
                      <div className="team-panel__multimedia-actions">
                        <a
                          href={file.archivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="team-panel__icon-btn"
                          title="Ver archivo"
                        >
                          <Eye size={16} />
                        </a>
                        <button
                          className="team-panel__icon-btn team-panel__icon-btn--danger"
                          onClick={() => handleDeleteMultimedia(file.id)}
                          title="Eliminar archivo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
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
