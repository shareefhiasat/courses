import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { getIcon } from '@constants/iconTypes';
import { Button } from '@ui';
import Modal from '@ui/Modal/Modal';
import workflowService from '@services/business/workflowService';

export default function WorkflowCommentsTab({ workflowId }) {
  const { t } = useLang();
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
        comment: newComment.trim(),
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
    setDeleteConfirm(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!deleteConfirm) return;
    try {
      const result = await workflowService.deleteWorkflowComment(workflowId, deleteConfirm);
      if (result.success) {
        setComments(prev => prev.filter(c => c.id !== deleteConfirm));
      }
    } catch (err) {
      console.error('[WorkflowCommentsTab] delete comment failed:', err);
    } finally {
      setDeleteConfirm(null);
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

  const filteredAndSortedComments = useMemo(() => {
    let filtered = selectedDate ? groupedComments[selectedDate] || [] : comments;
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(comment =>
        comment.comment?.toLowerCase().includes(searchLower) ||
        comment.author?.displayName?.toLowerCase().includes(searchLower) ||
        comment.author?.email?.toLowerCase().includes(searchLower)
      );
    }
    // Always sort by newest first
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    return sorted;
  }, [comments, filterText, selectedDate, groupedComments]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }} role="status">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* Add comment form */}
      <form onSubmit={handleAddComment}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('workflow.addCommentPlaceholder', 'Add a comment...')}
            style={{
              flex: 1,
              padding: '0.625rem 1rem',
              border: '1px solid var(--border, #d1d5db)',
              borderRadius: '0.5rem',
              background: 'var(--panel, white)',
              color: 'var(--text, #111827)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
            aria-label={t('workflow.addCommentPlaceholder', 'Add a comment...')}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'var(--color-primary, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting || !newComment.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              minHeight: '2.75rem',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!submitting && newComment.trim())
                e.currentTarget.style.background = 'var(--color-primary-dark, #1d4ed8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-primary, #2563eb)';
            }}
            aria-label={submitting ? t('common.sending', 'Sending...') : t('workflow.sendComment', 'Send Comment')}
          >
            <span style={{ color: '#ffffff' }}>{getIcon('ui', 'send', 16)}</span>
            <span>{submitting ? t('common.sending', 'Sending...') : t('workflow.sendComment', 'Send Comment')}</span>
          </button>
        </div>
      </form>

      {/* Timeline and comments */}
      {filteredAndSortedComments.length === 0 && !filterText ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
          {getIcon('ui', 'message', 40)}
          {t('drive.noComments', 'No comments yet')}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
          {/* Left sidebar - Date timeline */}
          <div style={{ 
            width: '200px', 
            flexShrink: 0, 
            borderRight: '1px solid var(--border, #e5e7eb)', 
            paddingInlineEnd: '1rem',
            overflowY: 'auto',
            maxHeight: '500px'
          }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted, #6b7280)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getIcon('ui', 'clock', 16)}
              {t('drive.timeline', 'Timeline')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  padding: '0.5rem',
                  textAlign: 'start',
                  background: !selectedDate ? 'var(--bg-primary, #f3f4f6)' : 'transparent',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: !selectedDate ? 'var(--text, #111827)' : 'var(--text-muted, #6b7280)',
                  cursor: 'pointer',
                  fontWeight: !selectedDate ? 600 : 400,
                }}
              >
                {t('drive.allComments', 'All Comments')} ({comments.length})
              </button>
              {sortedDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    padding: '0.5rem',
                    textAlign: 'start',
                    background: selectedDate === date ? 'var(--bg-primary, #f3f4f6)' : 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: selectedDate === date ? 'var(--text, #111827)' : 'var(--text-muted, #6b7280)',
                    cursor: 'pointer',
                    fontWeight: selectedDate === date ? 600 : 400,
                  }}
                >
                  {formatDateHeader(date)} ({groupedComments[date].length})
                </button>
              ))}
            </div>
          </div>

          {/* Right content - Comments */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
            {/* Search filter */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={t('drive.filterComments', 'Filter comments...')}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  border: '1px solid var(--border, #d1d5db)',
                  borderRadius: '0.5rem',
                  background: 'var(--panel, white)',
                  color: 'var(--text, #111827)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
                aria-label={t('drive.filterComments', 'Filter comments...')}
              />
              {filterText && (
                <button
                  onClick={() => setFilterText('')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #6b7280)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.25rem',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text, #111827)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted, #6b7280)'}
                  aria-label={t('common.clear', 'Clear')}
                >
                  ✕
                </button>
              )}
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text, #111827)', marginBottom: '1rem' }}>
              {selectedDate ? formatDateHeader(selectedDate) : t('workflow.document.comments', 'Comments')} ({filteredAndSortedComments.length})
            </h3>

            {filteredAndSortedComments.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
                {getIcon('ui', 'message', 40)}
                {t('drive.noMatchingComments', 'No matching comments')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredAndSortedComments.map((comment) => (
                  <article
                    key={comment.id}
                    style={{
                      padding: '1rem',
                      background: 'var(--panel, white)',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border, #e5e7eb)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                        <div style={{
                          flexShrink: 0,
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '9999px',
                          background: 'var(--color-primary-alpha, rgba(37, 99, 235, 0.1))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-primary, #3b82f6)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}>
                          {comment.author?.displayName?.[0] || comment.author?.email?.[0] || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)' }}>
                              {comment.author?.displayName || comment.author?.email || t('drive.unknownUser', 'Unknown')}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text, #374151)', margin: 0, wordBreak: 'break-word' }}>
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {formatDateTime(comment.createdAt)}
                        </span>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          style={{
                            padding: '0.375rem',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted, #6b7280)',
                            cursor: 'pointer',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '2.25rem',
                            minHeight: '2.25rem',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#dc2626';
                            e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {getIcon('ui', 'trash', 16, '#dc2626')}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('common.delete', 'Delete')}
      >
        <p style={{ marginBottom: '1rem' }}>
          {t('workflow.deleteCommentConfirm', 'Are you sure you want to delete this comment?')}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button
            variant="outline"
            onClick={() => setDeleteConfirm(null)}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDeleteComment}
          >
            {t('common.delete', 'Delete')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
