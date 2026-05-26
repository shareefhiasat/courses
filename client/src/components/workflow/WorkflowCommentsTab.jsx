import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { getIcon } from '@constants/iconTypes';
import workflowService from '@services/business/workflowService';

export default function WorkflowCommentsTab({ workflowId }) {
  const { t } = useLang();
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    if (!workflowId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await workflowService.getWorkflowComments(workflowId);
      if (result.success) {
        setComments(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch comments');
      }
    } catch (err) {
      console.error('[WorkflowCommentsTab] fetch failed:', err);
      setError(err.message || 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const triggerNotification = useCallback((comment, type = 'comment') => {
    // Trigger web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Workflow ${type}`, {
        body: comment.content?.substring(0, 100) || 'New activity',
        icon: '/favicon.ico',
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const result = await workflowService.addWorkflowComment(workflowId, {
        content: newComment.trim(),
      });
      if (result.success) {
        setNewComment('');
        fetchComments();
        // Trigger notification for other users (in real app, this would be via socket)
        triggerNotification({ content: newComment.trim() }, 'comment');
      }
    } catch (err) {
      console.error('[WorkflowCommentsTab] add comment failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const result = await workflowService.deleteWorkflowComment(workflowId, commentId);
      if (result.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error('[WorkflowCommentsTab] delete comment failed:', err);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '\u2014';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('drive.today') || 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('drive.yesterday') || 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  // Group comments by date
  const groupedComments = comments.reduce((acc, comment) => {
    const date = new Date(comment.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(comment);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedComments).sort((a, b) => new Date(b) - new Date(a));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }} role="status">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Add comment form */}
      <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t('drive.addCommentPlaceholder', 'Add a comment...')}
          disabled={submitting}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border, #e5e7eb)',
            fontSize: '0.875rem',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: !newComment.trim() || submitting ? 'var(--text-muted, #6b7280)' : 'var(--color-primary, #3b82f6)',
              color: 'white',
              cursor: !newComment.trim() || submitting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {submitting ? (
              <>
                {getIcon('ui', 'loader', 16)}
                {t('common.sending', 'Sending...')}
              </>
            ) : (
              <>
                {getIcon('ui', 'send', 16)}
                {t('drive.sendComment', 'Send Comment')}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {error && (
        <div style={{ padding: '0.75rem', background: 'var(--error-bg, #fef2f2)', border: '1px solid var(--error-border, #fecaca)', borderRadius: '0.5rem', color: 'var(--error-text, #dc2626)', fontSize: '0.875rem' }} role="alert">
          {error}
        </div>
      )}

      {sortedDates.length === 0 && !loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted, #6b7280)', fontSize: '0.875rem' }}>
          {getIcon('ui', 'comment', 48)}
          <p style={{ marginTop: '1rem', margin: 0 }}>{t('drive.noComments', 'No comments yet')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sortedDates.map((date) => (
            <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {formatDateHeader(date)}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {groupedComments[date].map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border, #e5e7eb)',
                      background: 'var(--panel, white)',
                      display: 'flex',
                      gap: '0.75rem',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      flexShrink: 0,
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '9999px',
                      background: 'var(--color-primary-alpha, rgba(37,99,235,0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary, #3b82f6)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}>
                      {comment.author?.displayName?.[0] || comment.author?.email?.[0] || '?'}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text, #111827)' }}>
                          {comment.author?.displayName || comment.author?.email || 'Unknown'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                          {formatDateTime(comment.createdAt)}
                        </span>
                        {comment.isEdited && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', fontStyle: 'italic' }}>
                            ({t('common.edited', 'edited')})
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text, #374151)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                        {comment.content}
                      </p>
                    </div>

                    {/* Actions */}
                    {(comment.authorId === user?.id || user?.roles?.includes('super_admin')) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          flexShrink: 0,
                          padding: '0.375rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-muted, #6b7280)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--error-bg, #fef2f2)';
                          e.currentTarget.style.color = 'var(--error-text, #dc2626)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
                        }}
                        title={t('common.delete', 'Delete')}
                      >
                        {getIcon('ui', 'trash', 16)}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
