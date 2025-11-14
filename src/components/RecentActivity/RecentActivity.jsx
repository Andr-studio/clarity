import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import './RecentActivity.css';
import API from '../../services/api';

const RecentActivity = ({ activities, projectId }) => {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);

  const getAvatarGradient = (avatar) => {
    const gradients = {
      'FC': 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      'AR': 'linear-gradient(135deg, #10b981, #059669)',
      'S': 'linear-gradient(135deg, #f59e0b, #d97706)',
      'FG': 'linear-gradient(135deg, #ef4444, #dc2626)',
      'DC': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'MV': 'linear-gradient(135deg, #ec4899, #f43f5e)',
    };
    return gradients[avatar] || 'linear-gradient(135deg, #6b7280, #4b5563)';
  };

  const getActivityIcon = (action) => {
    if (action.includes('Actualizó') || action.includes('actualizó')) return '📝';
    if (action.includes('comentario')) return '💬';
    if (action.includes('completado')) return '✅';
    if (action.includes('creó') || action.includes('Creó')) return '✨';
    if (action.includes('asignó') || action.includes('Asignó')) return '👥';
    if (action.includes('Respondió')) return '↩️';
    if (action.includes('Agregó')) return '💬';
    return '📋';
  };

  const formatTime = (timeStr) => {
    try {
      const now = new Date();
      let activityDate;
      
      // Manejar diferentes formatos de fecha
      if (timeStr && typeof timeStr === 'object' && timeStr.seconds) {
        // Timestamp de Firebase
        activityDate = new Date(timeStr.seconds * 1000);
      } else {
        activityDate = new Date(timeStr);
      }
      
      if (isNaN(activityDate.getTime())) {
        return timeStr;
      }
      
      const diffMs = now - activityDate;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffSecs < 60) {
        return 'Justo ahora';
      } else if (diffMins < 60) {
        return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
      } else if (diffHours < 24) {
        return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      } else if (diffDays < 7) {
        return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
      } else {
        return activityDate.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: activityDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return timeStr;
    }
  };

  const loadAllActivities = async () => {
    if (activitiesLoaded) return;
    
    setLoading(true);
    try {
      const data = await API.actividades.getAll({ 
        proyecto_id: projectId,
        limit: 100 
      });
      
      // Formatear datos desde Firebase
      const formatted = data.map(a => ({
        user: a.usuarioNombre || 'Usuario desconocido',
        action: a.descripcion,
        detail: a.tareaModificada || '',
        time: a.fecha,
        avatar: a.avatar || a.usuarioNombre?.charAt(0) || 'U',
        proyecto: a.proyectoNombre || ''
      }));
      
      setAllActivities(formatted);
      setActivitiesLoaded(true);
    } catch (error) {
      console.error('Error cargando actividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivities = async () => {
    if (!showAllActivities && !activitiesLoaded) {
      await loadAllActivities();
    }
    setShowAllActivities(!showAllActivities);
  };

  // Determinar qué actividades mostrar
  const activitiesToShow = showAllActivities && activitiesLoaded 
    ? allActivities 
    : (activities?.slice(0, 1) || []);

  return (
    <div className="recent-activity">
      <h3 className="recent-activity__title">Actividad Reciente</h3>
      
      <div className="recent-activity__list">
        {loading ? (
          <div className="recent-activity__loading">
            <div className="spinner"></div>
            <p>Cargando actividades...</p>
          </div>
        ) : activitiesToShow.length > 0 ? (
          <>
            {activitiesToShow.map((activity, index) => (
              <div 
                key={index} 
                className={`activity-item ${showAllActivities ? 'activity-item--expanded' : ''}`}
              >
                <div 
                  className="activity-item__avatar"
                  style={{ background: getAvatarGradient(activity.avatar) }}
                >
                  <span className="activity-item__avatar-text">{activity.avatar}</span>
                </div>
                <div className="activity-item__content">
                  <div className="activity-item__main">
                    <span className="activity-item__icon">{getActivityIcon(activity.action)}</span>
                    <div className="activity-item__text-wrapper">
                      <p className="activity-item__text">
                        <span className="activity-item__user">{activity.user}</span>{' '}
                        {activity.action}{' '}
                        {activity.detail && (
                          <span className="activity-item__detail">{activity.detail}</span>
                        )}
                      </p>
                      {showAllActivities && activity.proyecto && (
                        <p className="activity-item__project">
                          <FileText size={14} />
                          <span>{activity.proyecto}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="activity-item__time">{formatTime(activity.time)}</p>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="recent-activity__empty">
            <p>No hay actividades recientes</p>
          </div>
        )}
      </div>

      {activities && activities.length > 0 && (
        <button 
          className="recent-activity__toggle"
          onClick={handleToggleActivities}
          disabled={loading}
        >
          <span>{showAllActivities ? 'Ocultar actividades' : 'Ver toda la actividad'}</span>
        </button>
      )}
    </div>
  );
};

RecentActivity.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.shape({
    avatar: PropTypes.string,
    action: PropTypes.string,
    detail: PropTypes.string,
    time: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object // Para timestamps de Firebase
    ]),
    proyecto: PropTypes.string,
    user: PropTypes.string,
  })),
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

RecentActivity.defaultProps = {
  activities: [],
  projectId: null,
};

export default RecentActivity;