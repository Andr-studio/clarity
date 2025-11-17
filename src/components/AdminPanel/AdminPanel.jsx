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
  X,
  Pencil,
  Trash2,
  FileText,
  Calendar,
  Upload,
  Eye,
  Download,
  Target,
  MessageCircle
} from "lucide-react";
import "./AdminPanel.css";
import API from "../../services/api";
import CommentModal from "../ProgressSection/CommentModal";

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
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    rol: "cliente",
  });
  const [editUserFormData, setEditUserFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
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
  const [editProjectFormData, setEditProjectFormData] = useState({
    nombre: "",
    descripcion: "",
    presupuesto: "",
    fechaInicio: "",
    clienteId: "",
    equipoIds: [],
    estado: "",
  });
  // Estados para Documentación
  const [documentacion, setDocumentacion] = useState([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedProjectForDoc, setSelectedProjectForDoc] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFormData, setDocFormData] = useState({
    titulo: "",
    descripcion: "",
    proyectoId: "",
  });
  // Estados para Reuniones
  const [reuniones, setReuniones] = useState([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingFormData, setMeetingFormData] = useState({
    clienteId: "",
    titulo: "",
    descripcion: "",
    fechaSolicitada: "",
    proyectoId: "",
  });
  // Estados para Hitos y Comentarios
  const [milestones, setMilestones] = useState([]);
  const [selectedProjectForMilestones, setSelectedProjectForMilestones] = useState("");
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    milestoneId: null,
    milestoneTitle: '',
    projectId: null
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

      // Cargar reuniones del admin
      if (user?.id) {
        const allMeetings = await API.reuniones.getByAdmin(user.id);
        setReuniones(allMeetings);
      }

      // Cargar todos los hitos de todos los proyectos
      const allMilestones = [];
      for (const project of allProjects) {
        try {
          const projectMilestones = await API.milestones.getAll(project.id);

          // Cargar contador de comentarios para cada hito
          const milestonesWithComments = await Promise.all(
            projectMilestones.map(async (hito) => {
              try {
                const comentarios = await API.comentarios.getByHito(project.id, hito.id);
                return {
                  ...hito,
                  proyectoNombre: project.nombre,
                  proyectoId: project.id,
                  comentarios_count: comentarios.length,
                };
              } catch (error) {
                console.error(`Error cargando comentarios para hito ${hito.id}:`, error);
                return {
                  ...hito,
                  proyectoNombre: project.nombre,
                  proyectoId: project.id,
                  comentarios_count: 0,
                };
              }
            })
          );

          allMilestones.push(...milestonesWithComments);
        } catch (error) {
          console.error(`Error cargando hitos del proyecto ${project.id}:`, error);
        }
      }

      setMilestones(allMilestones);

      // Cargar todos los documentos de todos los proyectos
      const allDocumentation = [];
      for (const project of allProjects) {
        try {
          const projectDocs = await API.documentacion.getAll(project.id);
          const docsWithProject = projectDocs.map(doc => ({
            ...doc,
            proyectoNombre: project.nombre,
            proyectoId: project.id
          }));
          allDocumentation.push(...docsWithProject);
        } catch (error) {
          console.error(`Error cargando documentos del proyecto ${project.id}:`, error);
        }
      }

      setDocumentacion(allDocumentation);

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

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setEditUserFormData({
      nombre: userToEdit.nombre,
      apellido: userToEdit.apellido,
      correo: userToEdit.correo,
      rol: userToEdit.rol,
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const updates = {
        nombre: editUserFormData.nombre,
        apellido: editUserFormData.apellido,
        correo: editUserFormData.correo,
        rol: editUserFormData.rol,
        avatar: `${editUserFormData.nombre.charAt(0)}${editUserFormData.apellido.charAt(0)}`.toUpperCase(),
      };

      const result = await API.usuarios.update(editingUser.id, updates);

      if (result.success) {
        // Actualizar el usuario en la lista local
        setUsers(users.map(u =>
          u.id === editingUser.id
            ? { ...u, ...updates }
            : u
        ));

        setShowEditUserModal(false);
        setEditingUser(null);
        alert("Usuario actualizado exitosamente");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      alert(error.message || "Error al actualizar usuario. Por favor intente nuevamente.");
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar al usuario "${userToDelete.nombre} ${userToDelete.apellido}"? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      const result = await API.usuarios.delete(userToDelete.id);

      if (result.success) {
        // Eliminar el usuario de la lista local
        setUsers(users.filter(u => u.id !== userToDelete.id));

        // Actualizar estadísticas
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));

        alert("Usuario eliminado exitosamente");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      alert(error.message || "Error al eliminar usuario. Por favor intente nuevamente.");
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
        console.log('📝 Agregando al equipo:', {
          userId: userId,
          userIdType: typeof userId,
          teamUser: teamUser ? `${teamUser.nombre} ${teamUser.apellido}` : 'NO ENCONTRADO'
        });
        return {
          userId: userId,
          nombre: teamUser ? `${teamUser.nombre} ${teamUser.apellido}` : "",
          avatar: teamUser ? teamUser.avatar : "",
          rol: "team"
        };
      });

      console.log('✅ Equipo final:', equipo);

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

  const handleEditProject = (project) => {
    setEditingProject(project);
    // Extraer los IDs del equipo actual
    const equipoIds = (project.equipo || []).map(member => member.userId);

    setEditProjectFormData({
      nombre: project.nombre,
      descripcion: project.descripcion,
      presupuesto: project.presupuesto,
      fechaInicio: project.fechaInicio || project.fecha_inicio || "",
      clienteId: project.creadorId || project.creador_id,
      equipoIds: equipoIds,
      estado: project.estado,
    });
    setShowEditProjectModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      // Buscar el cliente seleccionado para obtener su nombre
      const cliente = users.find(u => u.id === editProjectFormData.clienteId);
      const creadorNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : "";

      // Construir el array de equipo con los usuarios seleccionados
      const equipo = editProjectFormData.equipoIds.map(userId => {
        const teamUser = users.find(u => u.id === userId);
        console.log('📝 Editando equipo - Agregando:', {
          userId: userId,
          userIdType: typeof userId,
          teamUser: teamUser ? `${teamUser.nombre} ${teamUser.apellido}` : 'NO ENCONTRADO'
        });
        return {
          userId: userId,
          nombre: teamUser ? `${teamUser.nombre} ${teamUser.apellido}` : "",
          avatar: teamUser ? teamUser.avatar : "",
          rol: "team"
        };
      });

      console.log('✅ Equipo final al editar:', equipo);

      const result = await API.proyectos.update(editingProject.id, {
        nombre: editProjectFormData.nombre,
        descripcion: editProjectFormData.descripcion,
        presupuesto: Number(editProjectFormData.presupuesto),
        estado: editProjectFormData.estado,
        fechaInicio: editProjectFormData.fechaInicio,
        fecha_inicio: editProjectFormData.fechaInicio,
        creadorId: editProjectFormData.clienteId,
        creador_id: editProjectFormData.clienteId,
        creadorNombre: creadorNombre,
        creador_nombre: creadorNombre,
        equipo: equipo,
      });

      if (result.success) {
        // Actualizar el proyecto en la lista local
        setProjects(projects.map(p =>
          p.id === editingProject.id
            ? {
                ...p,
                nombre: editProjectFormData.nombre,
                descripcion: editProjectFormData.descripcion,
                presupuesto: Number(editProjectFormData.presupuesto),
                estado: editProjectFormData.estado,
                fechaInicio: editProjectFormData.fechaInicio,
                fecha_inicio: editProjectFormData.fechaInicio,
                creadorId: editProjectFormData.clienteId,
                creador_id: editProjectFormData.clienteId,
                creadorNombre: creadorNombre,
                creador_nombre: creadorNombre,
                equipo: equipo,
              }
            : p
        ));

        setShowEditProjectModal(false);
        setEditingProject(null);
        alert("Proyecto actualizado exitosamente");
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error("Error actualizando proyecto:", error);
      alert(error.message || "Error al actualizar proyecto. Por favor intente nuevamente.");
    }
  };

  const handleDeleteProject = async (project) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el proyecto "${project.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      const result = await API.proyectos.delete(project.id);

      if (result.success) {
        // Eliminar el proyecto de la lista local
        setProjects(projects.filter(p => p.id !== project.id));

        // Actualizar estadísticas
        setStats(prev => ({
          ...prev,
          totalProjects: prev.totalProjects - 1,
          activeProjects: project.estado === "activo" || project.estado === "en_progreso"
            ? prev.activeProjects - 1
            : prev.activeProjects,
          completedProjects: project.estado === "completado"
            ? prev.completedProjects - 1
            : prev.completedProjects,
        }));

        alert("Proyecto eliminado exitosamente");
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error("Error eliminando proyecto:", error);
      alert(error.message || "Error al eliminar proyecto. Por favor intente nuevamente.");
    }
  };

  // ==================== FUNCIONES DE DOCUMENTACIÓN ====================

  const loadDocumentation = async (proyectoId) => {
    try {
      const docs = await API.documentacion.getAll(proyectoId);
      setDocumentacion(docs);
    } catch (error) {
      console.error("Error cargando documentación:", error);
      setDocumentacion([]);
    }
  };

  const handleOpenDocModal = (proyectoId) => {
    setSelectedProjectForDoc(proyectoId);
    setDocFormData({ ...docFormData, proyectoId });
    setShowDocModal(true);
    loadDocumentation(proyectoId);
  };

  const handleUploadDocumentation = async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("doc-file-input");
    const file = fileInput?.files[0];

    if (!file) {
      alert("Por favor selecciona un archivo");
      return;
    }

    setUploadingDoc(true);

    try {
      const proyecto = projects.find(p => p.id === docFormData.proyectoId);

      await API.documentacion.create(
        docFormData.proyectoId,
        {
          titulo: docFormData.titulo,
          descripcion: docFormData.descripcion,
          usuarioId: user.id,
          usuarioNombre: `${user.nombre} ${user.apellido}`,
          proyectoNombre: proyecto?.nombre || "",
        },
        file
      );

      // Recargar documentación
      await loadDocumentation(docFormData.proyectoId);

      // Limpiar formulario
      setDocFormData({
        titulo: "",
        descripcion: "",
        proyectoId: selectedProjectForDoc,
      });
      fileInput.value = null;

      alert("Documentación subida exitosamente");
    } catch (error) {
      console.error("Error subiendo documentación:", error);
      alert(error.message || "Error al subir documentación. Por favor intente nuevamente.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocumentation = async (docId, proyectoId = null) => {
    if (!window.confirm("¿Estás seguro de eliminar este documento?")) {
      return;
    }

    try {
      // Usar el proyectoId proporcionado o el seleccionado del modal
      const projectId = proyectoId || selectedProjectForDoc;

      await API.documentacion.delete(projectId, docId);

      // Si estamos en el modal, recargar solo esos documentos
      if (selectedProjectForDoc && !proyectoId) {
        await loadDocumentation(selectedProjectForDoc);
      } else {
        // Si estamos en la vista general, recargar todos los documentos
        const allDocumentation = [];
        for (const project of projects) {
          try {
            const projectDocs = await API.documentacion.getAll(project.id);
            const docsWithProject = projectDocs.map(doc => ({
              ...doc,
              proyectoNombre: project.nombre,
              proyectoId: project.id
            }));
            allDocumentation.push(...docsWithProject);
          } catch (error) {
            console.error(`Error cargando documentos del proyecto ${project.id}:`, error);
          }
        }
        setDocumentacion(allDocumentation);
      }

      alert("Documento eliminado exitosamente");
    } catch (error) {
      console.error("Error eliminando documento:", error);
      alert(error.message || "Error al eliminar documento. Por favor intente nuevamente.");
    }
  };

  // ==================== FUNCIONES DE REUNIONES ====================

  const handleCreateMeeting = async (e) => {
    e.preventDefault();

    try {
      const cliente = users.find(u => u.id === meetingFormData.clienteId);
      const proyecto = projects.find(p => p.id === meetingFormData.proyectoId);

      if (!cliente) {
        alert("Cliente no encontrado");
        return;
      }

      const newMeeting = await API.reuniones.create({
        adminId: user.id,
        adminNombre: `${user.nombre} ${user.apellido}`,
        adminCorreo: user.correo || "",
        clienteId: meetingFormData.clienteId,
        clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
        clienteCorreo: cliente.correo,
        proyectoId: meetingFormData.proyectoId || null,
        proyectoNombre: proyecto?.nombre || null,
        titulo: meetingFormData.titulo,
        descripcion: meetingFormData.descripcion,
        fechaSolicitada: new Date(meetingFormData.fechaSolicitada),
      });

      setReuniones([newMeeting, ...reuniones]);
      setShowMeetingModal(false);
      setMeetingFormData({
        clienteId: "",
        titulo: "",
        descripcion: "",
        fechaSolicitada: "",
        proyectoId: "",
      });

      alert("Reunión solicitada exitosamente. El cliente recibirá una notificación.");
    } catch (error) {
      console.error("Error creando reunión:", error);
      alert(error.message || "Error al crear reunión. Por favor intente nuevamente.");
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta reunión?")) {
      return;
    }

    try {
      await API.reuniones.delete(meetingId);
      setReuniones(reuniones.filter(m => m.id !== meetingId));
      alert("Reunión eliminada exitosamente");
    } catch (error) {
      console.error("Error eliminando reunión:", error);
      alert(error.message || "Error al eliminar reunión. Por favor intente nuevamente.");
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

  const handleOpenComments = (milestone) => {
    setCommentModal({
      isOpen: true,
      milestoneId: milestone.id,
      milestoneTitle: milestone.nombre,
      projectId: milestone.proyectoId
    });
  };

  const handleCloseComments = () => {
    setCommentModal({
      isOpen: false,
      milestoneId: null,
      milestoneTitle: '',
      projectId: null
    });
  };

  const handleCommentAdded = async () => {
    // Recargar el contador de comentarios del milestone específico
    if (commentModal.milestoneId && commentModal.projectId) {
      try {
        const comments = await API.comentarios.getByHito(commentModal.projectId, commentModal.milestoneId);

        // Actualizar el milestone con el nuevo contador
        setMilestones(prevMilestones =>
          prevMilestones.map(m =>
            m.id === commentModal.milestoneId
              ? { ...m, comentarios_count: comments.length }
              : m
          )
        );
      } catch (error) {
        console.error('Error actualizando contador de comentarios:', error);
      }
    }
  };

  const getFilteredMilestones = () => {
    if (!selectedProjectForMilestones) return milestones;
    return milestones.filter(m => m.proyectoId === selectedProjectForMilestones);
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
        <button
          className={`admin-panel__tab ${activeTab === "documentacion" ? "admin-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("documentacion")}
        >
          <FileText size={18} />
          Documentación
        </button>
        <button
          className={`admin-panel__tab ${activeTab === "reuniones" ? "admin-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("reuniones")}
        >
          <Calendar size={18} />
          Reuniones
        </button>
        <button
          className={`admin-panel__tab ${activeTab === "hitos" ? "admin-panel__tab--active" : ""}`}
          onClick={() => setActiveTab("hitos")}
        >
          <Target size={18} />
          Hitos
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
                    <th>Acciones</th>
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
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="admin-panel__btn admin-panel__btn--icon"
                            onClick={() => handleEditUser(u)}
                            title="Editar usuario"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="admin-panel__btn admin-panel__btn--icon admin-panel__btn--danger"
                            onClick={() => handleDeleteUser(u)}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
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
                      <th>Acciones</th>
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
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="admin-panel__btn admin-panel__btn--icon"
                              onClick={() => handleEditProject(p)}
                              title="Editar proyecto"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="admin-panel__btn admin-panel__btn--icon"
                              onClick={() => handleOpenDocModal(p.id)}
                              title="Gestionar documentación"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              className="admin-panel__btn admin-panel__btn--icon admin-panel__btn--danger"
                              onClick={() => handleDeleteProject(p)}
                              title="Eliminar proyecto"
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

        {activeTab === "documentacion" && (
          <div className="admin-panel__section">
            <div className="admin-panel__section-header">
              <h2 className="admin-panel__section-title">
                <FileText size={20} />
                Todos los Documentos ({documentacion.length})
              </h2>
            </div>
            {documentacion.length === 0 ? (
              <div className="admin-panel__empty-state">
                <FileText size={48} />
                <h3>No hay documentos disponibles</h3>
                <p>Ve a la pestaña de Proyectos y haz clic en el icono de documentación para subir archivos</p>
              </div>
            ) : (
              <div className="admin-panel__documents-list">
                {documentacion.map((doc) => {
                  const isPendiente = !doc.estado || doc.estado === 'pendiente';
                  const isAprobado = doc.estado === 'aprobado';
                  const isRechazado = doc.estado === 'rechazado';

                  return (
                    <div
                      key={doc.id}
                      className="admin-panel__document-item"
                      style={{
                        border: `2px solid ${isAprobado ? '#10b981' : isRechazado ? '#ef4444' : '#e5e7eb'}`,
                        background: isAprobado ? '#f0fdf4' : isRechazado ? '#fef2f2' : 'white'
                      }}
                    >
                      <div className="admin-panel__document-icon">
                        <FileText size={24} />
                      </div>
                      <div className="admin-panel__document-info" style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <h4 style={{ margin: 0 }}>{doc.titulo}</h4>
                          {isAprobado && (
                            <span style={{ padding: "0.25rem 0.5rem", background: "#10b981", color: "white", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "500" }}>
                              ✓ Aprobado por Cliente
                            </span>
                          )}
                          {isRechazado && (
                            <span style={{ padding: "0.25rem 0.5rem", background: "#ef4444", color: "white", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "500" }}>
                              ✗ Rechazado por Cliente
                            </span>
                          )}
                          {isPendiente && (
                            <span style={{ padding: "0.25rem 0.5rem", background: "#f59e0b", color: "white", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "500" }}>
                              ⏳ Pendiente de Revisión
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "0.25rem 0" }}>{doc.descripcion}</p>
                        <small>
                          Proyecto: {doc.proyectoNombre} • Subido el {formatDate(doc.fechaCreacion)} • {doc.archivoNombre}
                        </small>
                        {isRechazado && doc.motivoRechazo && (
                          <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#fee2e2", borderLeft: "3px solid #ef4444", borderRadius: "4px" }}>
                            <strong style={{ fontSize: "0.875rem", color: "#991b1b", display: "block", marginBottom: "0.25rem" }}>
                              Motivo del rechazo:
                            </strong>
                            <p style={{ margin: 0, fontSize: "0.875rem", color: "#7f1d1d" }}>
                              {doc.motivoRechazo}
                            </p>
                            {doc.fechaRechazo && (
                              <small style={{ fontSize: "0.75rem", color: "#991b1b", marginTop: "0.25rem", display: "block" }}>
                                Rechazado el {formatDate(doc.fechaRechazo)}
                              </small>
                            )}
                          </div>
                        )}
                        {isAprobado && doc.fechaAprobacion && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <small style={{ fontSize: "0.75rem", color: "#059669" }}>
                              Aprobado el {formatDate(doc.fechaAprobacion)}
                            </small>
                          </div>
                        )}
                      </div>
                      <div className="admin-panel__document-actions">
                        <a
                          href={doc.archivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-panel__btn admin-panel__btn--icon"
                          title="Descargar documento"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          className="admin-panel__btn admin-panel__btn--icon admin-panel__btn--danger"
                          onClick={() => handleDeleteDocumentation(doc.id, doc.proyectoId)}
                          title="Eliminar documento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "reuniones" && (
          <div className="admin-panel__section">
            <div className="admin-panel__section-header">
              <h2 className="admin-panel__section-title">
                <Calendar size={20} />
                Calendario de Reuniones ({reuniones.length})
              </h2>
              <button
                className="admin-panel__create-btn"
                onClick={() => setShowMeetingModal(true)}
              >
                <Plus size={18} />
                Agendar Reunión
              </button>
            </div>
            <div className="admin-panel__table-container">
              {reuniones.length === 0 ? (
                <div className="admin-panel__empty-state">
                  <Calendar size={48} />
                  <h3>No hay reuniones agendadas</h3>
                  <p>Crea una nueva reunión para comenzar.</p>
                </div>
              ) : (
                <table className="admin-panel__table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Cliente</th>
                      <th>Proyecto</th>
                      <th>Fecha Solicitada</th>
                      <th>Estado</th>
                      <th>Observación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reuniones.map((reunion) => (
                      <tr key={reunion.id}>
                        <td>
                          <div className="admin-panel__meeting-cell">
                            <strong>{reunion.titulo}</strong>
                            <small>{reunion.descripcion}</small>
                          </div>
                        </td>
                        <td>{reunion.clienteNombre}</td>
                        <td>{reunion.proyectoNombre || "N/A"}</td>
                        <td>{formatDate(reunion.fechaSolicitada)}</td>
                        <td>
                          <span
                            className={`admin-panel__status-badge ${
                              reunion.estado === "aceptada"
                                ? "admin-panel__status-badge--completed"
                                : reunion.estado === "rechazada"
                                ? "admin-panel__status-badge--pending"
                                : "admin-panel__status-badge--active"
                            }`}
                          >
                            {reunion.estado}
                          </span>
                        </td>
                        <td>
                          {reunion.estado === "rechazada" && (
                            <div>
                              <p style={{ margin: 0 }}>{reunion.observacion}</p>
                              {reunion.fechaAlternativa && (
                                <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                                  Fecha alternativa: {formatDate(reunion.fechaAlternativa)}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <button
                            className="admin-panel__btn admin-panel__btn--icon admin-panel__btn--danger"
                            onClick={() => handleDeleteMeeting(reunion.id)}
                            title="Eliminar reunión"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "hitos" && (
          <div className="admin-panel__section">
            <div className="admin-panel__section-header">
              <h2 className="admin-panel__section-title">
                <Target size={20} />
                Todos los Hitos ({getFilteredMilestones().length})
              </h2>
              <div className="admin-panel__filters">
                <select
                  className="admin-panel__filter-select"
                  value={selectedProjectForMilestones}
                  onChange={(e) => setSelectedProjectForMilestones(e.target.value)}
                >
                  <option value="">Todos los proyectos</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-panel__table-container">
              {getFilteredMilestones().length === 0 ? (
                <div className="admin-panel__empty-state">
                  <Target size={48} />
                  <h3>No hay hitos disponibles</h3>
                  <p>Los hitos se crean desde los proyectos asignados al equipo.</p>
                </div>
              ) : (
                <table className="admin-panel__table">
                  <thead>
                    <tr>
                      <th>Hito</th>
                      <th>Proyecto</th>
                      <th>Estado</th>
                      <th>Progreso</th>
                      <th>Responsable</th>
                      <th>Fecha Límite</th>
                      <th>Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredMilestones().map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="admin-panel__milestone-cell">
                            <strong>{m.nombre}</strong>
                            <small>{m.descripcion}</small>
                          </div>
                        </td>
                        <td>{m.proyectoNombre}</td>
                        <td>
                          <span className={`admin-panel__status-badge ${getStatusBadgeClass(m.estado)}`}>
                            {m.estado}
                          </span>
                        </td>
                        <td>
                          <div className="admin-panel__progress-bar">
                            <div
                              className="admin-panel__progress-fill"
                              style={{ width: `${m.progreso || 0}%` }}
                            ></div>
                            <span className="admin-panel__progress-text">{m.progreso || 0}%</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#3b82f6",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.875rem",
                              fontWeight: "600"
                            }}>
                              {m.responsableAvatar || "U"}
                            </div>
                            <span>{m.responsableNombre || m.responsable_nombre || "N/A"}</span>
                          </div>
                        </td>
                        <td>{formatDate(m.fechaLimite || m.fecha_limite)}</td>
                        <td>
                          <button
                            className="admin-panel__btn admin-panel__btn--icon"
                            onClick={() => handleOpenComments(m)}
                            title="Ver comentarios"
                            style={{ position: 'relative' }}
                          >
                            <MessageCircle size={16} />
                            {m.comentarios_count > 0 && (
                              <span style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                background: '#ef4444',
                                color: 'white',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '600'
                              }}>
                                {m.comentarios_count}
                              </span>
                            )}
                          </button>
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

      {/* Modal de Editar Usuario */}
      {showEditUserModal && (
        <div className="admin-panel__modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="admin-panel__modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel__modal-header">
              <h3 className="admin-panel__modal-title">
                <Pencil size={24} />
                Editar Usuario
              </h3>
              <button
                className="admin-panel__modal-close"
                onClick={() => setShowEditUserModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form className="admin-panel__form" onSubmit={handleUpdateUser}>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Nombre</label>
                <input
                  type="text"
                  className="admin-panel__form-input"
                  value={editUserFormData.nombre}
                  onChange={(e) => setEditUserFormData({ ...editUserFormData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Apellido</label>
                <input
                  type="text"
                  className="admin-panel__form-input"
                  value={editUserFormData.apellido}
                  onChange={(e) => setEditUserFormData({ ...editUserFormData, apellido: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="admin-panel__form-input"
                  value={editUserFormData.correo}
                  onChange={(e) => setEditUserFormData({ ...editUserFormData, correo: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Rol</label>
                <select
                  className="admin-panel__form-select"
                  value={editUserFormData.rol}
                  onChange={(e) => setEditUserFormData({ ...editUserFormData, rol: e.target.value })}
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
                  onClick={() => setShowEditUserModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="admin-panel__btn admin-panel__btn--primary">
                  Actualizar Usuario
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

      {/* Modal de Editar Proyecto */}
      {showEditProjectModal && (
        <div className="admin-panel__modal-overlay" onClick={() => setShowEditProjectModal(false)}>
          <div className="admin-panel__modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel__modal-header">
              <h3 className="admin-panel__modal-title">
                <Pencil size={24} />
                Editar Proyecto
              </h3>
              <button
                className="admin-panel__modal-close"
                onClick={() => setShowEditProjectModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form className="admin-panel__form" onSubmit={handleUpdateProject}>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Cliente</label>
                <select
                  className="admin-panel__form-select"
                  value={editProjectFormData.clienteId}
                  onChange={(e) => setEditProjectFormData({ ...editProjectFormData, clienteId: e.target.value })}
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
                  value={editProjectFormData.nombre}
                  onChange={(e) => setEditProjectFormData({ ...editProjectFormData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Descripción</label>
                <textarea
                  className="admin-panel__form-textarea"
                  value={editProjectFormData.descripcion}
                  onChange={(e) => setEditProjectFormData({ ...editProjectFormData, descripcion: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Estado</label>
                <select
                  className="admin-panel__form-select"
                  value={editProjectFormData.estado}
                  onChange={(e) => setEditProjectFormData({ ...editProjectFormData, estado: e.target.value })}
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="activo">Activo</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Presupuesto</label>
                <input
                  type="number"
                  className="admin-panel__form-input"
                  value={editProjectFormData.presupuesto}
                  onChange={(e) => setEditProjectFormData({ ...editProjectFormData, presupuesto: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Fecha de Inicio</label>
                <input
                  type="date"
                  className="admin-panel__form-input"
                  value={editProjectFormData.fechaInicio}
                  onChange={(e) => setEditProjectFormData({ ...editProjectFormData, fechaInicio: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Equipo a Cargo (Team)</label>
                <select
                  multiple
                  className="admin-panel__form-select"
                  value={editProjectFormData.equipoIds}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setEditProjectFormData({ ...editProjectFormData, equipoIds: selectedOptions });
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
                  onClick={() => setShowEditProjectModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="admin-panel__btn admin-panel__btn--primary">
                  Actualizar Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Documentación */}
      {showDocModal && (
        <div className="admin-panel__modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="admin-panel__modal admin-panel__modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel__modal-header">
              <h3 className="admin-panel__modal-title">
                <FileText size={24} />
                Gestión de Documentación - {projects.find(p => p.id === selectedProjectForDoc)?.nombre}
              </h3>
              <button
                className="admin-panel__modal-close"
                onClick={() => setShowDocModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="admin-panel__modal-body">
              <form onSubmit={handleUploadDocumentation} style={{ marginBottom: "1.5rem" }}>
                <div className="admin-panel__form-group">
                  <label className="admin-panel__form-label">Título del Documento</label>
                  <input
                    type="text"
                    className="admin-panel__form-input"
                    value={docFormData.titulo}
                    onChange={(e) => setDocFormData({ ...docFormData, titulo: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-panel__form-group">
                  <label className="admin-panel__form-label">Descripción</label>
                  <textarea
                    className="admin-panel__form-textarea"
                    value={docFormData.descripcion}
                    onChange={(e) => setDocFormData({ ...docFormData, descripcion: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-panel__form-group">
                  <label className="admin-panel__form-label">Archivo</label>
                  <input
                    id="doc-file-input"
                    type="file"
                    className="admin-panel__form-input"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    required
                  />
                  <small style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    Formatos soportados: PDF, Word, Excel, PowerPoint, TXT
                  </small>
                </div>
                <button
                  type="submit"
                  className="admin-panel__btn admin-panel__btn--primary"
                  disabled={uploadingDoc}
                >
                  <Upload size={18} />
                  {uploadingDoc ? "Subiendo..." : "Subir Documento"}
                </button>
              </form>

              <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid #e5e7eb" }} />

              <h4 style={{ marginBottom: "1rem" }}>Documentos Existentes</h4>
              {documentacion.length === 0 ? (
                <div className="admin-panel__empty-state">
                  <FileText size={48} />
                  <h3>No hay documentación</h3>
                  <p>Sube el primer documento para este proyecto</p>
                </div>
              ) : (
                <div className="admin-panel__documents-list">
                  {documentacion.map((doc) => (
                    <div key={doc.id} className="admin-panel__document-item">
                      <div className="admin-panel__document-icon">
                        <FileText size={24} />
                      </div>
                      <div className="admin-panel__document-info">
                        <h4>{doc.titulo}</h4>
                        <p>{doc.descripcion}</p>
                        <small>
                          Subido el {formatDate(doc.fechaCreacion)} - {doc.archivoNombre}
                        </small>
                      </div>
                      <div className="admin-panel__document-actions">
                        <a
                          href={doc.archivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-panel__btn admin-panel__btn--icon"
                          title="Descargar documento"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          className="admin-panel__btn admin-panel__btn--icon admin-panel__btn--danger"
                          onClick={() => handleDeleteDocumentation(doc.id)}
                          title="Eliminar documento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agendar Reunión */}
      {showMeetingModal && (
        <div className="admin-panel__modal-overlay" onClick={() => setShowMeetingModal(false)}>
          <div className="admin-panel__modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel__modal-header">
              <h3 className="admin-panel__modal-title">
                <Calendar size={24} />
                Agendar Nueva Reunión
              </h3>
              <button
                className="admin-panel__modal-close"
                onClick={() => setShowMeetingModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form className="admin-panel__form" onSubmit={handleCreateMeeting}>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Cliente *</label>
                <select
                  className="admin-panel__form-select"
                  value={meetingFormData.clienteId}
                  onChange={(e) => setMeetingFormData({ ...meetingFormData, clienteId: e.target.value })}
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
                <label className="admin-panel__form-label">Proyecto (Opcional)</label>
                <select
                  className="admin-panel__form-select"
                  value={meetingFormData.proyectoId}
                  onChange={(e) => setMeetingFormData({ ...meetingFormData, proyectoId: e.target.value })}
                >
                  <option value="">Sin proyecto específico</option>
                  {projects
                    .filter(p => p.creadorId === meetingFormData.clienteId || p.creador_id === meetingFormData.clienteId)
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.nombre}
                      </option>
                    ))}
                </select>
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Título *</label>
                <input
                  type="text"
                  className="admin-panel__form-input"
                  value={meetingFormData.titulo}
                  onChange={(e) => setMeetingFormData({ ...meetingFormData, titulo: e.target.value })}
                  placeholder="Ej: Revisión de Avances del Proyecto"
                  required
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Descripción</label>
                <textarea
                  className="admin-panel__form-textarea"
                  value={meetingFormData.descripcion}
                  onChange={(e) => setMeetingFormData({ ...meetingFormData, descripcion: e.target.value })}
                  placeholder="Describe el propósito de la reunión..."
                />
              </div>
              <div className="admin-panel__form-group">
                <label className="admin-panel__form-label">Fecha y Hora *</label>
                <input
                  type="datetime-local"
                  className="admin-panel__form-input"
                  value={meetingFormData.fechaSolicitada}
                  onChange={(e) => setMeetingFormData({ ...meetingFormData, fechaSolicitada: e.target.value })}
                  required
                />
              </div>
              <div className="admin-panel__form-actions">
                <button
                  type="button"
                  className="admin-panel__btn admin-panel__btn--secondary"
                  onClick={() => setShowMeetingModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="admin-panel__btn admin-panel__btn--primary">
                  Agendar Reunión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Comentarios */}
      <CommentModal
        isOpen={commentModal.isOpen}
        onClose={handleCloseComments}
        milestoneId={commentModal.milestoneId}
        projectId={commentModal.projectId}
        milestoneTitle={commentModal.milestoneTitle}
        userId={user?.id}
        onCommentAdded={handleCommentAdded}
      />
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
