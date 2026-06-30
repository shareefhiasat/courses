import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { getIcon } from '@constants/iconTypes';
import { Button } from '@ui';
import Modal from '@ui/Modal/Modal';
import workflowService from '@services/business/workflowService';
import { formatQatarDate } from '@utils/timezone';
import { Star, Shield, ShieldCheck, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { usePanelLayout } from '@hooks/usePanelLayout';

export default function WorkflowCommentsTab({ workflowId, selectedStage, onStageFilterChange }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const timelinePanelRef = useRef(null);
  const [savedLayout, onLayoutChange] = usePanelLayout('wf-comments-panels', { timeline: 35, content: 65 });

  // Helper to get stage icon based on action field
  const getStageIcon = (action) => {
    const statusMap = {
      'DRAFT': { icon: 'file_text', color: '#6b7280' },
      'SUBMITTED': { icon: 'send', color: '#3b82f6' },
      'UNDER_HR_REVIEW': { icon: 'alert_triangle', color: '#8b5cf6' },
      'UNDER_ADMIN_REVIEW': { icon: 'alert_triangle', color: '#8b5cf6' },
      'APPROVED': { icon: 'check_circle', color: '#10b981' },
      'REJECTED': { icon: 'x_circle', color: '#ef4444' }
    };
    return statusMap[action] || { icon: 'file_text', color: '#6b7280' };
  };

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
    console.log('[WorkflowCommentsTab] Sending comment:', newComment.trim(), 'for workflow:', workflowId);
    setSubmitting(true);
    try {
      const result = await workflowService.addWorkflowComment(workflowId, {
        comment: newComment.trim(),
      });
      console.log('[WorkflowCommentsTab] Comment result:', result);
      if (result.success) {
        console.log('[WorkflowCommentsTab] Comment added successfully');
        // Optimistically add the new comment to the list immediately
        if (result.data) {
          setComments(prev => [result.data, ...prev]);
        } else {
          // Fallback: refetch if API didn't return the new comment
          fetchComments();
        }
        setNewComment('');
        // Trigger notification for other users (in real app, this would be via socket)
        triggerNotification({ content: newComment.trim() }, 'comment');
      } else {
        console.error('[WorkflowCommentsTab] Comment add failed:', result.error);
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
    return formatQatarDate(date, 'dd/MM/yyyy HH:mm');
  };

  const formatDateHeader = (dateStr) => {
    return formatQatarDate(dateStr, 'dd/MM/yyyy');
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
    console.log('[WorkflowCommentsTab] Filtering comments:', { commentsCount: comments.length, selectedDate, filterText, selectedStage });
    let filtered = selectedDate ? groupedComments[selectedDate] || [] : comments;
    console.log('[WorkflowCommentsTab] After date filter:', { filteredCount: filtered.length });
    
    // Filter by stage/action if selected
    if (selectedStage) {
      filtered = filtered.filter(comment => comment.action === selectedStage);
      console.log('[WorkflowCommentsTab] After stage filter:', { filteredCount: filtered.length, selectedStage });
    }
    
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(comment =>
        comment.comment?.toLowerCase().includes(searchLower) ||
        comment.author?.displayName?.toLowerCase().includes(searchLower) ||
        comment.author?.email?.toLowerCase().includes(searchLower)
      );
      console.log('[WorkflowCommentsTab] After text filter:', { filteredCount: filtered.length });
    }
    // Always sort by newest first
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    console.log('[WorkflowCommentsTab] Final filtered comments:', sorted.length);
    return sorted;
  }, [comments, filterText, selectedDate, groupedComments, selectedStage]);

  const filteredCount = useMemo(() => {
    let count = comments.length;
    if (selectedStage) {
      count = comments.filter(c => c.action === selectedStage).length;
    }
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      count = comments.filter(c =>
        c.comment?.toLowerCase().includes(searchLower) ||
        c.author?.displayName?.toLowerCase().includes(searchLower) ||
        c.author?.email?.toLowerCase().includes(searchLower)
      ).length;
    }
    return count;
  }, [comments, selectedStage, filterText]);

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
      {/* Stage filter indicator */}
      {selectedStage && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0.5rem 0.75rem',
          background: '#e0f2fe',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#0369a1',
          border: '1px solid #bae6fd'
        }}>
          <span>{t('workflow.filteringByStage', 'Filtering by stage')}: <strong>{(() => {
            const statusKeyMap = {
              'DRAFT': 'workflow.status.draft',
              'SUBMITTED': 'workflow.status.submitted',
              'UNDER_HR_REVIEW': 'workflow.status.underReview',
              'UNDER_ADMIN_REVIEW': 'workflow.status.underAdminReview',
              'APPROVED': 'workflow.status.approved',
              'REJECTED': 'workflow.status.rejected',
            };
            const key = statusKeyMap[selectedStage];
            return key ? t(key, selectedStage) : selectedStage;
          })()}</strong></span>
          <button
            onClick={() => onStageFilterChange?.(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0369a1',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textDecoration: 'underline',
              fontWeight: 500
            }}
          >
            {t('workflow.clearFilter', 'Clear filter')}
          </button>
        </div>
      )}
      
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
              padding: '0.625rem',
              background: 'var(--color-primary, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting || !newComment.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 500,
              minHeight: '2.75rem',
              minWidth: '2.75rem',
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <PanelGroup orientation="horizontal" id="workflow-comments-panels" style={{ flex: 1 }} defaultLayout={savedLayout} onLayoutChange={onLayoutChange}>
          {/* Left sidebar - Date timeline */}
          <Panel id="timeline" panelRef={timelinePanelRef} defaultSize={35} minSize={15} collapsible collapsedSize={0}>
          <div style={{ 
            borderRight: '1px solid var(--border, #e5e7eb)', 
            paddingInlineEnd: '1rem',
            overflowY: 'auto',
            height: '100%',
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
                {t('drive.allComments', 'All Comments')} ({filteredCount})
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
          </Panel>
          <PanelResizeHandle style={{ width: '4px', background: 'var(--border, #e5e7eb)', margin: '0 2px', borderRadius: '2px', cursor: 'col-resize' }} />

          {/* Right content - Comments */}
          <Panel id="content" minSize={30}>
          <div style={{ flex: 1, overflowY: 'auto', height: '100%', paddingInlineStart: '0.5rem' }}>
            {/* Search filter */}
            <div style={{ position: 'relative', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={t('drive.filterComments', 'Filter comments...')}
                style={{
                  flex: 1,
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
              <button
                onClick={() => {
                  if (timelineCollapsed) {
                    timelinePanelRef.current?.expand();
                    setTimelineCollapsed(false);
                  } else {
                    timelinePanelRef.current?.collapse();
                    setTimelineCollapsed(true);
                  }
                }}
                style={{
                  padding: '0.5rem',
                  background: 'var(--panel, white)',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #6b7280)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
                title={timelineCollapsed ? t('workflow.expand', 'Expand') : t('workflow.collapse', 'Collapse')}
              >
                {timelineCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
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
              {selectedDate ? formatDateHeader(selectedDate) : t('workflow.document.comments', 'Comments')} ({filteredCount})
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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {comment.action ? (
                            // Show stage icon if comment has an action (stage)
                            <div style={{ color: getStageIcon(comment.action).color }}>
                              {getIcon('ui', getStageIcon(comment.action).icon, 20)}
                            </div>
                          ) : comment.author?.profileImageUrl ? (
                            <img
                              src={comment.author.profileImageUrl}
                              alt={comment.author.displayName || comment.author.email || ''}
                              style={{ width: '100%', height: '100%', borderRadius: '9999px', objectFit: 'cover' }}
                            />
                          ) : (
                            // Show author initials otherwise
                            <div style={{
                              color: 'var(--color-primary, #3b82f6)',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                            }}>
                              {(() => {
                                const a = comment.author;
                                if (!a) return '?';
                                if (lang === 'ar') {
                                  if (a.firstNameAr && a.lastNameAr) return (a.firstNameAr[0] + a.lastNameAr[0]).toUpperCase();
                                  if (a.displayNameAr && a.displayNameAr !== '-') return a.displayNameAr[0].toUpperCase();
                                }
                                const firstName = a.firstName || '';
                                const lastName = a.lastName || '';
                                const displayName = a.displayName || '';
                                const email = a.email || '';
                                if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
                                if (displayName && displayName !== '-') return displayName[0].toUpperCase();
                                if (email) return email[0].toUpperCase();
                                return '?';
                              })()}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            {/* Role icon */}
                            {(() => {
                              const roles = comment.author?.roleAssignments || [];
                              const roleCodes = roles.map(r => r.role?.code).filter(Boolean);
                              
                              if (roleCodes.includes('SUPER_ADMIN') || roleCodes.includes('super_admin')) {
                                return <Star size={14} color="#f59e0b" />;
                              }
                              if (roleCodes.includes('HR') || roleCodes.includes('hr')) {
                                return <Shield size={14} color="#8b5cf6" />;
                              }
                              if (roleCodes.includes('ADMIN') || roleCodes.includes('admin')) {
                                return <ShieldCheck size={14} color="#3b82f6" />;
                              }
                              return null;
                            })()}
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)' }}>
                              {(() => {
                                const a = comment.author;
                                if (!a) return t('drive.unknownUser', 'Unknown');
                                const email = a.email || '';
                                if (lang === 'ar') {
                                  if (a.displayNameAr && a.displayNameAr !== '-') return a.displayNameAr;
                                  if (a.firstNameAr || a.lastNameAr) return `${a.firstNameAr || ''} ${a.lastNameAr || ''}`.trim();
                                }
                                const firstName = a.firstName || '';
                                const lastName = a.lastName || '';
                                const displayName = a.displayName || '';
                                if (firstName && lastName) return `${firstName} ${lastName}`;
                                if (displayName && displayName !== '-') return displayName;
                                if (email) return email;
                                return t('drive.unknownUser', 'Unknown');
                              })()}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text, #374151)', margin: 0, wordBreak: 'break-word' }}>
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', whiteSpace: 'nowrap' }}>
                          {formatDateTime(comment.createdAt)}
                        </span>
                        {/* Only show delete button for comment author or Super Admin */}
                        {(() => {
                          const isAuthor = comment.authorId === user?.dbId;
                          const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
                          console.log('[WorkflowCommentsTab Delete Check]', {
                            commentAuthorId: comment.authorId,
                            userDbId: user?.dbId,
                            isAuthor,
                            userRoles: user?.roles,
                            isSuperAdmin,
                            canDelete: isAuthor || isSuperAdmin
                          });
                          return isAuthor || isSuperAdmin;
                        })() && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{
                              color: '#dc2626',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              background: 'none',
                              border: '1px solid var(--border, #e5e7eb)',
                              cursor: 'pointer',
                              padding: '0.375rem',
                              borderRadius: '0.375rem',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#dc2626';
                              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            {getIcon('ui', 'trash', 16, '#dc2626')}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
          </Panel>
          </PanelGroup>
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
