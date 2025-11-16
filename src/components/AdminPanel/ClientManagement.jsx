import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import firebaseAdminAPI from '../../services/firebaseAdmin';
import './ClientManagement.css';

export default function ClientManagement({ user }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    empresa: '',
    telefono: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const result = await firebaseAdminAPI.getAllClients();
    if (result.success) {
      setClients(result.clients);
    } else {
      setMessage({ text: result.message, type: 'error' });
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    // Validaciones
    if (!formData.nombre || !formData.apellido || !formData.correo || !formData.password) {
      setMessage({ text: 'Por favor completa todos los campos requeridos', type: 'error' });
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ text: 'La contraseña debe tener al menos 6 caracteres', type: 'error' });
      setSubmitting(false);
      return;
    }

    // Crear cliente
    const result = await firebaseAdminAPI.createClient({
      ...formData,
      adminId: user.id,
      adminNombre: `${user.nombre} ${user.apellido}`
    });

    if (result.success) {
      setMessage({ text: 'Cliente creado exitosamente', type: 'success' });
      setFormData({
        nombre: '',
        apellido: '',
        correo: '',
        password: '',
        empresa: '',
        telefono: ''
      });
      setShowCreateModal(false);
      loadClients();
    } else {
      setMessage({ text: result.message, type: 'error' });
    }

    setSubmitting(false);
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

  return (
    <div className="client-management">
      <div className="client-management-header">
        <div>
          <h2>Gestión de Clientes</h2>
          <p>Crea y administra clientes del sistema</p>
        </div>
        <button
          className="btn-create-client"
          onClick={() => setShowCreateModal(true)}
        >
          <span>+</span> Crear Cliente
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="loading">Cargando clientes...</div>
      ) : (
        <div className="clients-table-container">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Empresa</th>
                <th>Teléfono</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                clients.map(client => (
                  <tr key={client.id}>
                    <td>
                      <div className="client-avatar">
                        {client.avatar || `${client.nombre[0]}${client.apellido[0]}`}
                      </div>
                    </td>
                    <td className="client-name">
                      {client.nombre} {client.apellido}
                    </td>
                    <td>{client.correo}</td>
                    <td>{client.empresa || 'N/A'}</td>
                    <td>{client.telefono || 'N/A'}</td>
                    <td>{formatDate(client.fechaCreacion)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de creación de cliente */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Nuevo Cliente</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="client-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apellido">Apellido *</label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="correo">Correo Electrónico *</label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                />
                <small>Mínimo 6 caracteres</small>
              </div>

              <div className="form-group">
                <label htmlFor="empresa">Empresa</label>
                <input
                  type="text"
                  id="empresa"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Creando...' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

ClientManagement.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
    apellido: PropTypes.string.isRequired
  }).isRequired
};
