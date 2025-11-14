import React from 'react';
import PropTypes from 'prop-types';
import CommentButton from '../CommentButton';
import './ProgressBarView.css';
  

const ProgressBarView = ({ milestones, onOpenComments, getCommentCount }) => {
   
  return (
    <div className="progress-bar-view">
      {milestones.map((milestone) => (
        <div key={milestone.id} className="progress-bar-milestone">
          <div className="progress-bar-milestone__info">
            <span className="progress-bar-milestone__title">{milestone.title}</span>
            <div className="progress-bar-milestone__meta">
              <span className="progress-bar-milestone__percentage">{milestone.progress}%</span>
              <CommentButton 
                  milestoneId={milestone.id}
                  commentCount={getCommentCount(milestone.id)}
                  onClick={onOpenComments}
                  variant="full"
                />
            </div>
          </div>
          <div className="progress-bar-milestone__bar">
            <div
              className={`milestone__progress-fill milestone__progress-fill--${milestone.status}`}
              style={{ width: `${milestone.progress}%` }}
            ></div>
          </div>
          <div className="progress-bar-milestone__date">{milestone.dueDate}</div>
        </div>
      ))}
    </div>
  );
};

ProgressBarView.propTypes = {
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

export default ProgressBarView;
