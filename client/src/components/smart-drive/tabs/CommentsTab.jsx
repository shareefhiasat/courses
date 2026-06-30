import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { getIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { Button } from '@ui';
import Modal from '@ui/Modal/Modal';
import { formatQatarDate, formatQatarDateOnly } from '@utils/timezone';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { getUserRoleFromObject } from '@utils/userUtils';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { usePanelLayout } from '@hooks/usePanelLayout';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import axios from 'axios';

export default function CommentsTab({ fileId, isOwnedByUser = true }) {
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

  const fetchComments = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/drive/files/${fileId}/comments`);
      if (response.data.success) {
        setComments(response.data.payload || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch comments');
      }
    } catch (err) {
      console.error('[CommentsTab] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    console.log('[CommentsTab] Sending comment:', newComment.trim(), 'for file:', fileId);
    setSubmitting(true);
    try {
      const response = await axios.post(`/api/v1/drive/files/${fileId}/comments`, {
        content: newComment.trim(),
      });
      console.log('[CommentsTab] Comment result:', response.data);
      if (response.data.success) {
        console.log('[CommentsTab] Comment added successfully');
        setNewComment('');
        fetchComments();
      } else {
        console.error('[CommentsTab] Comment add failed:', response.data.error);
      }
    } catch (err) {
      console.error('[CommentsTab] add comment failed:', err);
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
      const response = await axios.delete(`/api/v1/drive/files/${fileId}/comments/${deleteConfirm}`);
      if (response.data.success) {
        setComments(prev => prev.filter(c => c.id !== deleteConfirm));
      }
    } catch (err) {
      console.error('[CommentsTab] delete comment failed:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const timelinePanelRef = useRef(null);
  const [savedLayout, onLayoutChange] = usePanelLayout('drive-comments-panels', { timeline: 35, content: 65 });

  const formatDateTime = (date) => {
    if (!date) return '\u2014';
    return formatQatarDate(date, 'dd/MM/yyyy HH:mm');
  };

  const formatDateHeader = (dateStr) => {
    return formatQatarDateOnly(dateStr);
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
        comment.content?.toLowerCase().includes(searchLower) ||
        comment.user?.displayName?.toLowerCase().includes(searchLower) ||
        comment.user?.email?.toLowerCase().includes(searchLower)
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted, #6b7280)' }} role="status">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: 'var(--font-size-sm)', color: '#dc2626' }} role="alert">
        {error}
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
              placeholder={t('drive.addComment')}
              style={{
                flex: 1,
                padding: '0.625rem 1rem',
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: '0.5rem',
                background: 'var(--panel, white)',
                color: 'var(--text, #111827)',
                fontSize: 'var(--font-size-sm)',
                outline: 'none',
              }}
              aria-label={t('drive.addComment')}
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
                fontSize: 'var(--font-size-sm)',
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
              aria-label={submitting ? t('common.sending') : t('drive.send')}
            >
              <span style={{ color: '#ffffff' }}>{getIcon('ui', 'send', 16)}</span>
              <span>{submitting ? t('common.sending') : t('drive.send')}</span>
            </button>
          </div>
        </form>

        {/* Timeline and comments */}
        {filteredAndSortedComments.length === 0 && !filterText ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted, #6b7280)' }}>
            {getIcon('ui', 'message', 40)}
            {t('drive.noComments')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <PanelGroup orientation="horizontal" id="drive-comments-panels" style={{ flex: 1 }} defaultLayout={savedLayout} onLayoutChange={onLayoutChange}>
            {/* Left sidebar - Date timeline */}
            <Panel id="timeline" panelRef={timelinePanelRef} defaultSize={35} minSize={15} collapsible collapsedSize={0}>
            <div style={{ 
              borderRight: '1px solid var(--border, #e5e7eb)', 
              paddingInlineEnd: '1rem',
              overflowY: 'auto',
              height: '100%',
            }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-muted, #6b7280)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getIcon('ui', 'clock', 16)}
                {t('drive.timeline') || 'Timeline'}
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
                    fontSize: 'var(--font-size-sm)',
                    color: !selectedDate ? 'var(--text, #111827)' : 'var(--text-muted, #6b7280)',
                    cursor: 'pointer',
                    fontWeight: !selectedDate ? 600 : 400,
                  }}
                >
                  {t('drive.allComments') || 'All Comments'} ({comments.length})
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
                      fontSize: 'var(--font-size-sm)',
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
                  placeholder={t('drive.filterComments')}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.75rem',
                    border: '1px solid var(--border, #d1d5db)',
                    borderRadius: '0.5rem',
                    background: 'var(--panel, white)',
                    color: 'var(--text, #111827)',
                    fontSize: 'var(--font-size-sm)',
                    outline: 'none',
                  }}
                  aria-label={t('drive.filterComments')}
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
                    aria-label={t('common.clear')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text, #111827)', marginBottom: '1rem' }}>
                {selectedDate ? formatDateHeader(selectedDate) : t('drive.comments')} ({filteredAndSortedComments.length})
              </h3>

              {filteredAndSortedComments.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted, #6b7280)' }}>
                  {getIcon('ui', 'message', 40)}
                  {t('drive.noMatchingComments')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredAndSortedComments.map((comment) => (
                    <article
                      key={comment.id}
                      style={{
                        padding: '0.5rem 0.75rem',
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
                            {getIcon('ui', 'user', 16)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text, #111827)' }}>
                                {getLocalizedUserName(comment.user, lang, t('drive.unknownUser'))}
                              </span>
                              {(() => { const role = getUserRoleFromObject(comment.user); if (!role) return null; const icon = getUserRoleIcon(role); const color = getUserRoleColor(role); return icon ? (
                                <span title={t(`roles.${role}`, role)} style={{ display: 'flex', alignItems: 'center' }}>
                                  {React.cloneElement(icon, { color, size: 12 })}
                                </span>
                              ) : null; })()}
                            </div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text, #374151)', margin: 0, wordBreak: 'break-word' }}>
                              {comment.content}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted, #6b7280)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {formatDateTime(comment.createdAt)}
                          </span>
                          {(() => {
                            const isAuthor = comment.userId === user?.dbId;
                            const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
                            console.log('[CommentsTab Delete Check]', {
                              commentUserId: comment.userId,
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
          {t('drive.deleteCommentConfirm', 'Are you sure you want to delete this comment?')}
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
