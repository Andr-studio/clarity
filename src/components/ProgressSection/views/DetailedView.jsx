import React, { useState } from 'react';
import { ChevronDown, Check, Zap, Clock } from 'lucide-react';
import PropTypes from 'prop-types';
import CommentButton from '../CommentButton';

const DetailedView = ({ milestones, onOpenComments, getCommentCount, multimediaPorHito = {} }) => {
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [hoveredMedia, setHoveredMedia] = useState(null);



  const getStatusIcon = (status) => {
    switch (status) {
      case 'completado':
        return (
          <div className="milestone-status milestone-status--completado">
            <Check className="milestone-status__icon" />
          </div>
        );
      case 'en-progreso':
        return (
          <div className="milestone-status milestone-status--en-progreso">
            <Zap className="milestone-status__icon" />
          </div>
        );
      default:
        return (
          <div className="milestone-status milestone-status--pendiente">
            <Clock className="milestone-status__icon" />
          </div>
        );
    }
  };

  const toggleMilestone = (id) => {
    setExpandedMilestone(expandedMilestone === id ? null : id);
  };

  return (
    <div className="milestones__list">
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className={`milestone ${expandedMilestone === milestone.id ? 'milestone--expanded' : ''}`}
        >
          <div
            className="milestone__header"
            onClick={() => toggleMilestone(milestone.id)}
          >
            <div className="milestone__main">
              <div className="milestone__status-container">
                {getStatusIcon(milestone.status)}
              </div>
              <div className="milestone__info">
                <h5 className="milestone__title">{milestone.title}</h5>
                <p className="milestone__progress">Progreso: {milestone.progress}%</p>
              </div>
            </div>
            <div className="milestone__meta">
              <div className="milestone__assignee">
                <p className="milestone__assignee-name">{milestone.assignee}</p>
                <p className="milestone__due-date">{milestone.dueDate}</p>
              </div>
              <ChevronDown
                className={`milestone__chevron ${
                  expandedMilestone === milestone.id ? 'milestone__chevron--rotated' : ''
                }`}
              />
            </div>
          </div>

          <div className="milestone__progress-bar">
            <div
              className={`milestone__progress-fill milestone__progress-fill--${milestone.status}`}
              style={{ width: `${milestone.progress}%` }}
            ></div>
          </div>

          {expandedMilestone === milestone.id && (
            <div className="milestone__details">
              <div className="milestone__detail-content">
                <p className="milestone__detail-item">
                  <strong>Estado:</strong> {
                    milestone.status === 'completado' ? 'Completado' :
                    milestone.status === 'en-progreso' ? 'En Progreso' :
                    'Pendiente'
                  }
                </p>
                <p className="milestone__detail-item">
                  <strong>Fecha límite:</strong> {milestone.dueDate}
                </p>
                <p className="milestone__detail-item">
                  <strong>Responsable:</strong> {milestone.assignee}
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <CommentButton
                    milestoneId={milestone.id}
                    commentCount={getCommentCount(milestone.id)}
                    onClick={onOpenComments}
                    variant="full"
                  />

                  {/* Botones de archivos multimedia */}
                  {multimediaPorHito[milestone.id]?.map((media, index) => (
                    <div
                      key={media.id}
                      style={{ position: 'relative', display: 'inline-block' }}
                      onMouseEnter={() => setHoveredMedia(`${milestone.id}-${index}`)}
                      onMouseLeave={() => setHoveredMedia(null)}
                    >
                      <a
                        href={media.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: media.archivoTipo?.startsWith('image/') ? '#10b981' : '#8b5cf6',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span>{media.archivoTipo?.startsWith('image/') ? '🖼️' : '🎥'}</span>
                        <span>{media.archivoTipo?.startsWith('image/') ? 'Ver imagen' : 'Ver video'}</span>
                      </a>

                      {/* Preview al hacer hover */}
                      {hoveredMedia === `${milestone.id}-${index}` && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '0.5rem',
                            padding: '0.5rem',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            zIndex: 1000,
                            minWidth: '250px',
                            maxWidth: '350px',
                          }}
                        >
                          {media.archivoTipo?.startsWith('image/') ? (
                            <img
                              src={media.archivoUrl}
                              alt={media.descripcion || 'Preview'}
                              style={{
                                width: '100%',
                                maxHeight: '200px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                display: 'block',
                              }}
                            />
                          ) : (
                            <video
                              src={media.archivoUrl}
                              style={{
                                width: '100%',
                                maxHeight: '200px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                display: 'block',
                                background: '#000',
                              }}
                              muted
                              playsInline
                            />
                          )}
                          {media.descripcion && (
                            <p style={{
                              margin: '0.5rem 0 0 0',
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              textAlign: 'center',
                            }}>
                              {media.descripcion}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

DetailedView.propTypes = {
  milestones: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    progress: PropTypes.number,
    status: PropTypes.string,
    dueDate: PropTypes.string,
    assignee: PropTypes.string,
    commentCount: PropTypes.number,
  })).isRequired,
  onOpenComments: PropTypes.func.isRequired,
  getCommentCount: PropTypes.func.isRequired,
  multimediaPorHito: PropTypes.object,
};

export default DetailedView;