import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { Button } from '@ui';
import Modal from '@ui/Modal/Modal';
import workflowService from '@services/business/workflowService';
import {
  TimelinePanelLayout,
  DriveTimelineEmptyState,
  DriveTimelineList,
  DriveTimelineLoadingState,
  DriveTimelineErrorState,
  DriveCommentForm,
  DriveListCard,
  DriveUserAvatar,
  DriveActionButton,
} from '@ui/DriveTimeline';
import { formatQatarDate } from '@utils/timezone';

function getAuthorDisplayName(author, lang, t) {
  if (!author) return t('drive.unknownUser', 'Unknown');
  if (lang === 'ar') {
    if (author.displayNameAr && author.displayNameAr !== '-') return author.displayNameAr;
    if (author.firstNameAr || author.lastNameAr) return `${author.firstNameAr || ''} ${author.lastNameAr || ''}`.trim();
  }
  const firstName = author.firstName || '';
  const lastName = author.lastName || '';
  const displayName = author.displayName || '';
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (displayName && displayName !== '-') return displayName;
  if (author.email) return author.email;
  return t('drive.unknownUser', 'Unknown');
}

export default function WorkflowCommentsTab({ workflowId, selectedStage, onStageFilterChange, refreshKey }) {
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
  }, [fetchComments, refreshKey]);

  const triggerNotification = useCallback((comment, type = 'comment') => {
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
        if (result.data) {
          setComments(prev => [result.data, ...prev]);
        } else {
          fetchComments();
        }
        setNewComment('');
        triggerNotification({ content: newComment.trim() }, 'comment');
      }
    } catch (err) {
      console.error('[WorkflowCommentsTab] add comment failed:', err);
    } finally {
      setSubmitting(false);
    }
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
    return formatQatarDate(date, 'dd/MM/yyyy h:mm a');
  };

  const formatDateHeader = (dateStr) => formatQatarDate(dateStr, 'dd/MM/yyyy');

  const groupedComments = comments.reduce((acc, comment) => {
    const date = new Date(comment.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(comment);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedComments).sort((a, b) => new Date(b) - new Date(a));

  const filteredAndSortedComments = useMemo(() => {
    let filtered = selectedDate ? groupedComments[selectedDate] || [] : comments;
    if (selectedStage) {
      filtered = filtered.filter(comment => comment.action === selectedStage);
    }
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(comment =>
        comment.comment?.toLowerCase().includes(searchLower) ||
        comment.author?.displayName?.toLowerCase().includes(searchLower) ||
        comment.author?.email?.toLowerCase().includes(searchLower)
      );
    }
    return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

  const canDelete = (comment) => {
    const isAuthor = comment.authorId === user?.dbId;
    const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
    return isAuthor || isSuperAdmin;
  };

  const stageFilterBanner = selectedStage ? (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 0.75rem',
      background: '#e0f2fe',
      borderRadius: '0.5rem',
      fontSize: 'var(--font-size-sm)',
      color: '#0369a1',
      border: '1px solid #bae6fd',
      marginBottom: '1rem',
    }}>
      <span>
        {t('workflow.filteringByStage', 'Filtering by stage')}: <strong>{(() => {
          const statusKeyMap = {
            DRAFT: 'workflow.status.draft',
            SUBMITTED: 'workflow.status.submitted',
            UNDER_HR_REVIEW: 'workflow.status.underReview',
            UNDER_ADMIN_REVIEW: 'workflow.status.underAdminReview',
            APPROVED: 'workflow.status.approved',
            REJECTED: 'workflow.status.rejected',
          };
          const key = statusKeyMap[selectedStage];
          return key ? t(key, selectedStage) : selectedStage;
        })()}</strong>
      </span>
      <button
        type="button"
        onClick={() => onStageFilterChange?.(null)}
        style={{
          background: 'none',
          border: 'none',
          color: '#0369a1',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
          textDecoration: 'underline',
          fontWeight: 500,
        }}
      >
        {t('workflow.clearFilter', 'Clear filter')}
      </button>
    </div>
  ) : null;

  if (loading) return <DriveTimelineLoadingState />;
  if (error) return <DriveTimelineErrorState message={error} />;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        {stageFilterBanner}

        <DriveCommentForm
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleAddComment}
          submitting={submitting}
          placeholder={t('workflow.addCommentPlaceholder', 'Add a comment...')}
          submitLabel={t('workflow.sendComment', 'Send')}
          showTextLabel={false}
        />

        {filteredAndSortedComments.length === 0 && !filterText ? (
          <DriveTimelineEmptyState icon="message" message={t('drive.noComments', 'No comments yet')} />
        ) : (
          <TimelinePanelLayout
            panelLayoutKey="wf-comments-panels"
            allItemsLabel={t('drive.allComments', 'All Comments')}
            allItemsCount={filteredCount}
            dates={sortedDates}
            getDateCount={(date) => groupedComments[date]?.length || 0}
            formatDateHeader={formatDateHeader}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            filterText={filterText}
            onFilterChange={setFilterText}
            filterPlaceholder={t('drive.filterComments', 'Filter comments...')}
            sectionTitle={`${selectedDate ? formatDateHeader(selectedDate) : t('workflow.document.comments', 'Comments')} (${filteredCount})`}
            emptyState={
              filteredAndSortedComments.length === 0 ? (
                <DriveTimelineEmptyState icon="message" message={t('drive.noMatchingComments', 'No matching comments')} />
              ) : null
            }
          >
            {filteredAndSortedComments.length > 0 && (
              <DriveTimelineList>
                {filteredAndSortedComments.map((comment) => (
                  <DriveListCard
                    key={comment.id}
                    avatar={<DriveUserAvatar user={comment.author} />}
                    title={getAuthorDisplayName(comment.author, lang, t)}
                    subtitle={comment.comment}
                    timestamp={formatDateTime(comment.createdAt)}
                    actions={canDelete(comment) ? (
                      <DriveActionButton
                        icon="trash"
                        onClick={() => setDeleteConfirm(comment.id)}
                        ariaLabel={t('common.delete')}
                        variant="danger"
                      />
                    ) : null}
                  />
                ))}
              </DriveTimelineList>
            )}
          </TimelinePanelLayout>
        )}
      </div>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('common.delete', 'Delete')}
      >
        <p style={{ marginBottom: '1rem' }}>
          {t('workflow.deleteCommentConfirm', 'Are you sure you want to delete this comment?')}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="destructive" onClick={confirmDeleteComment}>
            {t('common.delete', 'Delete')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
