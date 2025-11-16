import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Reply, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import API from '../../services/api';

// Componente de un comentario individual
const CommentItem = ({
  comment,
  isReply = false,
  currentUser,
  formatTimestamp,
  onReply,
  expandedComments,
  toggleReplies,
  onDelete,
  isAdmin
}) => (
  <div className={`comment-item ${isReply ? 'comment-item--reply' : ''}`}>
    <div className="comment-item__avatar">
      <div className="avatar">
        {comment.avatar || 'U'}
      </div>
    </div>
    
    <div className="comment-item__content">
      <div className="comment-item__header">
        <span className="comment-item__author">{comment.author || comment.usuarioNombre}</span>
        <span className="comment-item__timestamp">
          {formatTimestamp(comment.fecha)}
        </span>
      </div>
      
      <p className="comment-item__text">{comment.comentario}</p>
      
      <div className="comment-item__actions">
        <button
          className="comment-action"
          onClick={() => onReply(comment.id)}
        >
          <Reply className="comment-action__icon" />
          Responder
        </button>

        {comment.replies && comment.replies.length > 0 && (
          <button
            className="comment-action"
            onClick={() => toggleReplies(comment.id)}
          >
            {expandedComments.has(comment.id) ? 'Ocultar' : 'Ver'} respuestas ({comment.replies.length})
          </button>
        )}

        {isAdmin && (
          <button
            className="comment-action comment-action--delete"
            onClick={() => onDelete(comment.id)}
            style={{ color: '#ef4444' }}
          >
            <Trash2 className="comment-action__icon" />
            Eliminar
          </button>
        )}
      </div>
      
      {comment.replies && comment.replies.length > 0 && expandedComments.has(comment.id) && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply={true}
              currentUser={currentUser}
              formatTimestamp={formatTimestamp}
              onReply={onReply}
              expandedComments={expandedComments}
              toggleReplies={toggleReplies}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  </div>
);

const commentShape = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  avatar: PropTypes.string,
  author: PropTypes.string,
  usuarioNombre: PropTypes.string,
  fecha: PropTypes.string,
  comentario: PropTypes.string,
};
commentShape.replies = PropTypes.arrayOf(PropTypes.shape(commentShape));

CommentItem.propTypes = {
  comment: PropTypes.shape(commentShape).isRequired,
  isReply: PropTypes.bool,
  currentUser: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombre: PropTypes.string,
    avatar: PropTypes.string,
  }).isRequired,
  formatTimestamp: PropTypes.func.isRequired,
  onReply: PropTypes.func.isRequired,
  expandedComments: PropTypes.instanceOf(Set).isRequired,
  toggleReplies: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
};

CommentItem.defaultProps = { isReply: false };

const CommentSystem = ({ 
  milestoneId, 
  projectId,
  milestoneTitle, 
  onClose, 
  userId,
  onCommentAdded 
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener datos del usuario actual
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser = {
    id: userId || storedUser.id,
    nombre: `${storedUser.nombre || 'Usuario'} ${storedUser.apellido || ''}`.trim(),
    avatar: storedUser.avatar || 'U',
    rol: storedUser.rol || 'cliente'
  };

  const isAdmin = currentUser.rol === 'admin';

  // Cargar comentarios al abrir el modal
  useEffect(() => {
    if (milestoneId && projectId) {
      loadComments();
    }
  }, [milestoneId, projectId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await API.comentarios.getByHito(projectId, milestoneId);
      setComments(data);
    } catch (err) {
      setError('Error al cargar comentarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'Justo ahora';
      } else if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} min`;
      } else if (diffInMinutes < 1440) {
        return `Hace ${Math.floor(diffInMinutes / 60)} h`;
      } else {
        return date.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short',
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch {
      return 'Fecha inválida';
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setLoading(true);
      await API.comentarios.create({
        projectId: projectId,
        milestoneId: milestoneId,
        usuario_id: currentUser.id,
        usuarioNombre: currentUser.nombre,
        usuarioAvatar: currentUser.avatar,
        comentario: newComment.trim(),
        parent_id: null
      });
      
      setNewComment('');
      await loadComments();
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      setError('Error al agregar comentario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (parentId) => {
    if (!replyContent.trim()) return;

    try {
      setLoading(true);
      await API.comentarios.create({
        projectId: projectId,
        milestoneId: milestoneId,
        usuario_id: currentUser.id,
        usuarioNombre: currentUser.nombre,
        usuarioAvatar: currentUser.avatar,
        comentario: replyContent.trim(),
        parent_id: parentId
      });
      
      setReplyContent('');
      setReplyingTo(null);
      await loadComments();
      
      // Expandir automáticamente el comentario padre
      setExpandedComments(prev => new Set(prev).add(parentId));
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      setError('Error al agregar respuesta');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleReply = (commentId) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyContent('');
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      await API.comentarios.delete(projectId, milestoneId, commentId);

      // Recargar comentarios
      await loadComments();

      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      setError('Error al eliminar comentario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-system">
      <div className="comment-system__header">
        <div className="comment-system__title">
          <MessageCircle className="comment-system__title-icon" />
          <div>
            <h3>Comentarios</h3>
            <p className="comment-system__subtitle">{milestoneTitle}</p>
          </div>
        </div>
        <button className="comment-system__close" onClick={onClose}>×</button>
      </div>
      
      {error && (
        <div className="comment-system__error">
          {error}
        </div>
      )}
      
      <div className="comments-list">
        {loading && comments.length === 0 ? (
          <div className="comments-loading">
            <div className="spinner"></div>
            <p>Cargando comentarios...</p>
          </div>
        ) : (!comments || comments.length === 0) ? (
          <div className="comments-empty">
            <MessageCircle className="comments-empty__icon" />
            <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                currentUser={currentUser}
                formatTimestamp={formatTimestamp}
                onReply={handleReply}
                expandedComments={expandedComments}
                toggleReplies={toggleReplies}
                onDelete={handleDelete}
                isAdmin={isAdmin}
              />
              
              {replyingTo === comment.id && (
                <div className="comment-reply">
                  <div className="comment-reply__avatar">
                    <div className="avatar avatar--sm">
                      {currentUser.avatar}
                    </div>
                  </div>
                  <div className="comment-reply__input">
                    <textarea
                      className="comment-reply__textarea"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Escribir una respuesta..."
                      rows="2"
                      autoFocus
                    />
                    <div className="comment-reply__actions">
                      <button 
                        className="btn btn--secondary btn--sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                      >
                        Cancelar
                      </button>
                      <button 
                        className="btn btn--primary btn--sm"
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyContent.trim() || loading}
                      >
                        <Send className="btn__icon" />
                        {loading ? 'Enviando...' : 'Responder'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="comment-input">
        <div className="comment-input__avatar">
          <div className="avatar">{currentUser.avatar}</div>
        </div>
        <div className="comment-input__field">
          <textarea
            className="comment-input__textarea"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Agregar un comentario..."
            rows="3"
            disabled={loading}
          />
          <button 
            className="comment-input__submit"
            onClick={handleAddComment}
            disabled={!newComment.trim() || loading}
          >
            <Send className="comment-input__submit-icon" />
            {loading ? 'Enviando...' : 'Comentar'}
          </button>
        </div>
      </div>
    </div>
  );
};

CommentSystem.propTypes = {
  milestoneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  milestoneTitle: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCommentAdded: PropTypes.func,
};

CommentSystem.defaultProps = {
  milestoneTitle: 'Comentarios',
  userId: null,
  onCommentAdded: () => {},
};

export default CommentSystem;