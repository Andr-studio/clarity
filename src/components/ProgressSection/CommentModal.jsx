import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import CommentSystem from './CommentSystem';

const CommentModal = ({ 
  isOpen, 
  onClose, 
  milestoneId,
  projectId,
  milestoneTitle, 
  userId,
  onCommentAdded 
}) => {
 
  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="comment-modal" onClick={handleBackdropClick}>
      <div className="comment-modal__content">
        <CommentSystem 
          milestoneId={milestoneId}
          projectId={projectId}
          milestoneTitle={milestoneTitle}
          onClose={onClose}
          userId={userId}
          onCommentAdded={onCommentAdded}
        />
      </div>
    </div>
  );
};

CommentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  milestoneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  milestoneTitle: PropTypes.string,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCommentAdded: PropTypes.func,
};

CommentModal.defaultProps = {
  milestoneId: null,
  projectId: null,
  milestoneTitle: '',
  userId: null,
  onCommentAdded: () => {},
};

export default CommentModal;