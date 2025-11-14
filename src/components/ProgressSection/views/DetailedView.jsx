import React, { useState } from 'react';
import { ChevronDown, Check, Zap, Clock } from 'lucide-react';
import PropTypes from 'prop-types';
import CommentButton from '../CommentButton';

const DetailedView = ({ milestones, onOpenComments, getCommentCount }) => {
  const [expandedMilestone, setExpandedMilestone] = useState(null);



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
                 <CommentButton 
                  milestoneId={milestone.id}
                  commentCount={getCommentCount(milestone.id)}
                  onClick={onOpenComments}
                  variant="full"
/>
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
};

export default DetailedView;