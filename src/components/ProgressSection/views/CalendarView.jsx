import React from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import PropTypes from 'prop-types';
import CommentButton from '../CommentButton';

const CalendarView = ({ milestones, onOpenComments, getCommentCount, multimediaPorHito = {} }) => {
  // Agrupar hitos por mes
  const groupByMonth = (milestones) => {
    const grouped = {};
    milestones.forEach(milestone => {
      const date = new Date(milestone.dueDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(milestone);
    });
    return grouped;
  };

  const getMonthName = (monthYear) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completado':
        return 'calendar-item--completado';
      case 'en-progreso':
        return 'calendar-item--en-progreso';
      default:
        return 'calendar-item--pendiente';
    }
  };

  const groupedMilestones = groupByMonth(milestones);

  return (
    <div className="calendar-view">
      {Object.entries(groupedMilestones).map(([monthYear, monthMilestones]) => (
        <div key={monthYear} className="calendar-month">
          <h5 className="calendar-month__title">
            <Calendar className="calendar-month__icon" />
            {getMonthName(monthYear)}
          </h5>
          <div className="calendar-month__items">
            {monthMilestones.map(milestone => (
              <div 
                key={milestone.id} 
                className={`calendar-item ${getStatusColor(milestone.status)}`}
              >
                <div className="calendar-item__header">
                  <h6 className="calendar-item__title">{milestone.title}</h6>
                  <div className="calendar-item__header-right">
                    <div className="calendar-item__date">
                      <Clock className="calendar-item__date-icon" />
                      <span>{milestone.dueDate}</span>
                    </div>
                   <CommentButton 
                  milestoneId={milestone.id}
                  commentCount={getCommentCount(milestone.id)}
                  onClick={onOpenComments}
                  variant="full"
                    />
                  </div>
                </div>
                <div className="calendar-item__details">
                  <div className="calendar-item__assignee">
                    <User className="calendar-item__assignee-icon" />
                    <span>{milestone.assignee}</span>
                  </div>
                  <div className="calendar-item__progress">
                    <span className="calendar-item__progress-text">{milestone.progress}%</span>
                    <div className="calendar-item__progress-bar">
                      <div
                        className={`milestone__progress-fill milestone__progress-fill--${milestone.status}`}
              style={{ width: `${milestone.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

CalendarView.propTypes = {
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

export default CalendarView;