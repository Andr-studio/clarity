import React from 'react';
import PropTypes from 'prop-types';
import CommentButton from '../CommentButton';


const KanbanView = ({ milestones, onOpenComments, getCommentCount }) => {
  const statusConfig = {
    pendiente: 'Pendiente',
    'en-progreso': 'En Progreso',
    completado: 'Completado'
  };
  

  return (
    <div className="kanban-view">
      {Object.entries(statusConfig).map(([status, title]) => (
        <div key={status} className="kanban-column">
          <h5 className="kanban-column__title">{title}</h5>
          <div className="kanban-column__cards">
            {milestones
              .filter(m => m.status === status)
              .map(milestone => (
                <div key={milestone.id} className="kanban-card">
                  <h6 className="kanban-card__title">{milestone.title}</h6>
                  <p className="kanban-card__assignee">{milestone.assignee}</p>
                  <div className="kanban-card__progress-bar">
                    <div
                      className="kanban-card__progress-fill"
                      style={{ width: `${milestone.progress}%` }}
                    ></div>
                  </div>
                  <p className="kanban-card__due-date">{milestone.dueDate}</p>
                   <CommentButton 
                  milestoneId={milestone.id}
                  commentCount={getCommentCount(milestone.id)}
                  onClick={onOpenComments}
                  variant="full"
/>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

KanbanView.propTypes = {
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

export default KanbanView;