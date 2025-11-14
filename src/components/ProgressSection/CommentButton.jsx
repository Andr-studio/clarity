import React from 'react';
import { MessageCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const CommentButton = ({ milestoneId, commentCount = 0, onClick, variant = 'default' }) => {
  const handleClick = (e) => {
    e.stopPropagation(); // Evita que se active el click del milestone
    onClick(milestoneId);
  };

  if (variant === 'floating') {
    return (
      <button 
        className="comment-btn comment-btn--floating"
        onClick={handleClick}
        title="Comentarios"
      >
        <MessageCircle className="comment-btn__icon" />
        {commentCount > 0 && (
          <span className="comment-btn__badge">{commentCount}</span>
        )}
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button 
        className="comment-btn comment-btn--minimal"
        onClick={handleClick}
        title="Ver comentarios"
      >
        <MessageCircle className="comment-btn__icon" />
        {commentCount > 0 && <span className="comment-btn__count">{commentCount}</span>}
      </button>
    );
  }

  return (
    <button 
      className="comment-btn comment-btn--default"
      onClick={handleClick}
    >
      <MessageCircle className="comment-btn__icon" />
      <span className="comment-btn__text">
        {commentCount > 0 ? `${commentCount} comentario${commentCount !== 1 ? 's' : ''}` : 'Comentar'}
      </span>
    </button>
  );
};

CommentButton.propTypes = {
  milestoneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  commentCount: PropTypes.number,
  onClick: PropTypes.func.isRequired,
  // Aunque el componente solo renderiza 'floating' y 'minimal' de forma distinta, documentamos todas las variantes usadas en la app.
  variant: PropTypes.oneOf(['default', 'floating', 'minimal', 'compact', 'full']),
};

export default CommentButton;