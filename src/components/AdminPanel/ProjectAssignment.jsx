import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import firebaseAdminAPI from '../../services/firebaseAdmin';
import './ProjectAssignment.css';

export default function ProjectAssignment({ user }) {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filter, setFilter] = useState('all'); // all, assigned, unassigned

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Cargar proyectos y clientes en paralelo
    const [projectsResult, clientsResult] = await Promise.all([
      firebaseAdminAPI.getAllProjects(),
      firebaseAdminAPI.getAllClients()
    ]);

    if (projectsResult.success) {
      setProjects(projectsResult.projects);
    } else {
      setMessage({ text: projectsResult.message, type: 'error' });
    }

    if (clientsResult.success) {
      setClients(clientsResult.clients);
    } else {
      setMessage({ text: clientsResult.message, type: 'error' });
    }

    setLoading(false);
  };

  const handleAssignClick = (project) => {
    setSelectedProject(project);
    setSelectedClient(project.clienteId || '');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    if (!selectedClient) {
      setMessage({ text: 'Por favor selecciona un cliente', type: 'error' });
      setSubmitting(false);
      return;
    }

    const result = await firebaseAdminAPI.assignProjectToClient(
      selectedProject.id,
      selectedClient,
      user
    );

    if (result.success) {
      setMessage({ text: result.message, type: 'success' });
      setShowAssignModal(false);
      loadData();
    } else {
      setMessage({ text: result.message, type: 'error' });
    }

    setSubmitting(false);
  };

  const handleUnassign = async (project) => {
    if (!confirm(`¿Estás seguro de remover la asignación del cliente "${project.clienteNombre}" del proyecto "${project.nombre}"?`)) {
      return;
    }

    setSubmitting(true);
    const result = await firebaseAdminAPI.unassignClientFromProject(project.id, user);

    if (result.success) {
      setMessage({ text: result.message, type: 'success' });
      loadData();
    } else {
      setMessage({ text: result.message, type: 'error' });
    }

    setSubmitting(false);
  };

  const getFilteredProjects = () => {
    switch (filter) {
      case 'assigned':
        return projects.filter(p => p.clienteId);
      case 'unassigned':
        return projects.filter(p => !p.clienteId);
      default:
        return projects;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (estado) => {
    const colors = {
      'en-progreso': '#3182ce',
      'completado': '#38a169',
      'pendiente': '#d69e2e',
      'cancelado': '#e53e3e'
    };
    return colors[estado] || '#718096';
  };

  const filteredProjects = getFilteredProjects();

  return (
    <div className="project-assignment">
      <div className="project-assignment-header">
        <div>
          <h2>Asignación de Proyectos</h2>
          <p>Asigna proyectos a los clientes registrados</p>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({projects.length})
        </button>
        <button
          className={`filter-btn ${filter === 'assigned' ? 'active' : ''}`}
          onClick={() => setFilter('assigned')}
        >
          Asignados ({projects.filter(p => p.clienteId).length})
        </button>
        <button
          className={`filter-btn ${filter === 'unassigned' ? 'active' : ''}`}
          onClick={() => setFilter('unassigned')}
        >
          Sin asignar ({projects.filter(p => !p.clienteId).length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando proyectos...</div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.length === 0 ? (
            <div className="no-data">
              No hay proyectos en esta categoría
            </div>
          ) : (
            filteredProjects.map(project => (
              <div key={project.id} className="project-card">
                <div className="project-card-header">
                  <h3>{project.nombre}</h3>
                  <span
                    className="project-status"
                    style={{ background: getStatusColor(project.estado) }}
                  >
                    {project.estado}
                  </span>
                </div>

                <p className="project-description">
                  {project.descripcion || 'Sin descripción'}
                </p>

                <div className="project-info">
                  <div className="info-item">
                    <span className="info-label">Progreso:</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${project.progreso || 0}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{project.progreso || 0}%</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Hitos:</span>
                    <span className="info-value">
                      {project.hitos_completados || 0} / {project.total_hitos || 0}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Fecha creación:</span>
                    <span className="info-value">
                      {formatDate(project.fechaCreacion)}
                    </span>
                  </div>
                </div>

                {project.clienteId ? (
                  <div className="client-assigned">
                    <div className="client-info">
                      <span className="client-label">Asignado a:</span>
                      <div className="client-details">
                        <strong>{project.clienteNombre}</strong>
                        {project.clienteEmpresa && (
                          <span className="client-company">
                            {project.clienteEmpresa}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="project-actions">
                      <button
                        className="btn-reassign"
                        onClick={() => handleAssignClick(project)}
                        disabled={submitting}
                      >
                        Reasignar
                      </button>
                      <button
                        className="btn-unassign"
                        onClick={() => handleUnassign(project)}
                        disabled={submitting}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-client-assigned">
                    <span>Sin cliente asignado</span>
                    <button
                      className="btn-assign"
                      onClick={() => handleAssignClick(project)}
                      disabled={submitting}
                    >
                      Asignar Cliente
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de asignación */}
      {showAssignModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asignar Proyecto</h3>
              <button
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="project-summary">
                <h4>{selectedProject.nombre}</h4>
                <p>{selectedProject.descripcion}</p>
              </div>

              <form onSubmit={handleAssignSubmit} className="assign-form">
                <div className="form-group">
                  <label htmlFor="client">Seleccionar Cliente *</label>
                  <select
                    id="client"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    required
                  >
                    <option value="">-- Selecciona un cliente --</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.nombre} {client.apellido}
                        {client.empresa && ` - ${client.empresa}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowAssignModal(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Asignando...' : 'Asignar Proyecto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ProjectAssignment.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
    apellido: PropTypes.string.isRequired
  }).isRequired
};
