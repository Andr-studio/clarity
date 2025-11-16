import React, { useState } from 'react';
import './TableView.css';
import PropTypes from 'prop-types';
import { ChevronUp, ChevronDown } from 'lucide-react';
import CommentButton from '../CommentButton';

const TableView = ({ milestones, onOpenComments, getCommentCount, multimediaPorHito = {} }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'ascending' });
  

  const sortedMilestones = React.useMemo(() => {
    let sortableItems = [...milestones];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [milestones, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    if (sortConfig.direction === 'ascending') {
      return <ChevronUp className="sort-icon" />;
    }
    return <ChevronDown className="sort-icon" />;
  };

  // Componente para la vista de cards en móviles
  const MobileCardView = () => (
    <div className="mobile-card-view">
      {sortedMilestones.map((milestone) => (
        <div key={milestone.id} className="milestone-card">
          <div className="milestone-card__header">
            <h3 className="milestone-card__title">{milestone.title}</h3>
            <div className="milestone-card__actions">
              <CommentButton 
                milestoneId={milestone.id}
                commentCount={getCommentCount(milestone.id)}
                onClick={onOpenComments}
                variant="compact"
              />
            </div>
          </div>
          
          <div className="milestone-card__info">
            <div className="milestone-card__row">
              <span className="milestone-card__label">Responsable:</span>
              <span className="milestone-card__value">{milestone.assignee}</span>
            </div>
            
            <div className="milestone-card__row">
              <span className="milestone-card__label">Fecha Límite:</span>
              <span className="milestone-card__value">{milestone.dueDate}</span>
            </div>
            
            <div className="milestone-card__row">
              <span className="milestone-card__label">Estado:</span>
              <span className={`status-badge status-badge--${milestone.status}`}>
                {milestone.status}
              </span>
            </div>
            
            <div className="milestone-card__row">
              <span className="milestone-card__label">Progreso:</span>
              <div className="milestone-card__progress">
                <span className="milestone-card__value">{milestone.progress}%</span>
                <div className="mobile-progress-bar">
                  <div
                    className="mobile-progress-fill"
                    style={{ width: `${milestone.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="table-view">
      {/* Vista de tabla para desktop */}
      <table className="milestone-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('title')}>
              Hito {getSortIcon('title')}
            </th>
            <th onClick={() => requestSort('assignee')}>
              Responsable {getSortIcon('assignee')}
            </th>
            <th onClick={() => requestSort('dueDate')}>
              Fecha Límite {getSortIcon('dueDate')}
            </th>
            <th onClick={() => requestSort('progress')}>
              Progreso {getSortIcon('progress')}
            </th>
            <th onClick={() => requestSort('status')}>
              Estado {getSortIcon('status')}
            </th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedMilestones.map((milestone) => (
            <React.Fragment key={milestone.id}>
              <tr>
                <td>{milestone.title}</td>
                <td>{milestone.assignee}</td>
                <td>{milestone.dueDate}</td>
                <td>
                  <div className="progress-cell">
                    <span>{milestone.progress}%</span>
                    <div className="progress-cell__bar">
                      <div
                        className={`milestone__progress-fill milestone__progress-fill--${milestone.status}`}
              style={{ width: `${milestone.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge status-badge--${milestone.status}`}>
                    {milestone.status}
                  </span>
                </td>
                <td>
                  <CommentButton 
                    milestoneId={milestone.id}
                    commentCount={getCommentCount(milestone.id)}
                    onClick={onOpenComments}
                    variant="full"
                  />
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Vista de cards para móviles */}
      <MobileCardView />
    </div>
  );
};

TableView.propTypes = {
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

export default TableView;