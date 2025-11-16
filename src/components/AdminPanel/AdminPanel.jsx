import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ClientManagement from './ClientManagement';
import ProjectAssignment from './ProjectAssignment';
import './AdminPanel.css';

export default function AdminPanel({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('clients');

  // Verificar que el usuario es admin
  if (user?.rol !== 'admin') {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder al panel de administración.</p>
          <button onClick={onLogout} className="btn-primary">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>Panel de Administración</h1>
            <p>Gestión de clientes y proyectos</p>
          </div>
          <div className="admin-user-info">
            <div className="user-avatar">{user.avatar || user.nombre[0]}</div>
            <div className="user-details">
              <span className="user-name">{user.nombre} {user.apellido}</span>
              <span className="user-role">Administrador</span>
            </div>
            <button onClick={onLogout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <span className="tab-icon">👥</span>
          Gestión de Clientes
        </button>
        <button
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <span className="tab-icon">📋</span>
          Asignación de Proyectos
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'clients' && <ClientManagement user={user} />}
        {activeTab === 'projects' && <ProjectAssignment user={user} />}
      </div>
    </div>
  );
}

AdminPanel.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
    apellido: PropTypes.string.isRequired,
    correo: PropTypes.string.isRequired,
    rol: PropTypes.string.isRequired,
    avatar: PropTypes.string
  }).isRequired,
  onLogout: PropTypes.func.isRequired
};
