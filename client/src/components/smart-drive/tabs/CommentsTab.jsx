import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { Button } from '@ui';
import Modal from '@ui/Modal/Modal';
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
import { formatQatarDate, formatQatarDateOnly } from '@utils/timezone';
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
    setSubmitting(true);
    try {
      const response = await axios.post(`/api/v1/drive/files/${fileId}/comments`, {
        content: newComment.trim(),
      });
      if (response.data.success) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      console.error('[CommentsTab] add comment failed:', err);
    } finally {
      setSubmitting(false);
    }
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

  const formatDateTime = (date) => {
    if (!date) return '\u2014';
    return formatQatarDate(date, 'dd/MM/yyyy h:mm a');
  };

  const formatDateHeader = (dateStr) => formatQatarDateOnly(dateStr);

  const groupedComments = comments.reduce((acc, comment) => {
    const date = new Date(comment.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
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
    return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [comments, filterText, selectedDate, groupedComments]);

  const canDelete = (comment) => {
    const isAuthor = comment.userId === user?.dbId;
    const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
    return isAuthor || isSuperAdmin;
  };

  if (loading) return <DriveTimelineLoadingState />;
  if (error) return <DriveTimelineErrorState message={error} />;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        <DriveCommentForm
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleAddComment}
          submitting={submitting}
          placeholder={t('drive.addComment')}
          submitLabel={t('drive.send')}
        />

        {filteredAndSortedComments.length === 0 && !filterText ? (
          <DriveTimelineEmptyState icon="message" message={t('drive.noComments')} />
        ) : (
          <TimelinePanelLayout
            panelLayoutKey="drive-comments-panels"
            allItemsLabel={t('drive.allComments') || 'All Comments'}
            allItemsCount={comments.length}
            dates={sortedDates}
            getDateCount={(date) => groupedComments[date]?.length || 0}
            formatDateHeader={formatDateHeader}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            filterText={filterText}
            onFilterChange={setFilterText}
            filterPlaceholder={t('drive.filterComments')}
            sectionTitle={`${selectedDate ? formatDateHeader(selectedDate) : t('drive.comments')} (${filteredAndSortedComments.length})`}
            emptyState={
              filteredAndSortedComments.length === 0 ? (
                <DriveTimelineEmptyState icon="message" message={t('drive.noMatchingComments')} />
              ) : null
            }
          >
            {filteredAndSortedComments.length > 0 && (
              <DriveTimelineList>
                {filteredAndSortedComments.map((comment) => (
                  <DriveListCard
                    key={comment.id}
                    avatar={<DriveUserAvatar user={comment.user} />}
                    title={getLocalizedUserName(comment.user, lang, t('drive.unknownUser'))}
                    subtitle={comment.content}
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
          {t('drive.deleteCommentConfirm', 'Are you sure you want to delete this comment?')}
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
