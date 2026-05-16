import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { MessageSquare, Send, Trash2, User, Search, ArrowUpDown } from 'lucide-react';
import axios from 'axios';

/**
 * CommentsTab - FileComment thread with add/delete, sort, and filter
 */
export default function CommentsTab({ fileId }) {
  const { t } = useLang();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [filterText, setFilterText] = useState('');

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

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await axios.delete(`/api/v1/drive/files/${fileId}/comments/${commentId}`);
      if (response.data.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error('[CommentsTab] delete comment failed:', err);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  // Sort and filter comments
  const filteredAndSortedComments = useMemo(() => {
    let filtered = comments;

    // Apply filter
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(comment =>
        comment.content?.toLowerCase().includes(searchLower) ||
        comment.user?.displayName?.toLowerCase().includes(searchLower) ||
        comment.user?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [comments, filterText, sortBy]);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400" role="status">
        {t('common.loading')}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('drive.comments')} ({filteredAndSortedComments.length})
        </h3>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            aria-label={t('drive.sortComments')}
          >
            <option value="newest">{t('drive.sort.newest')}</option>
            <option value="oldest">{t('drive.sort.oldest')}</option>
          </select>
        </div>
      </header>

      {/* Filter Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder={t('drive.filterComments')}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          aria-label={t('drive.filterComments')}
        />
        {filterText && (
          <button
            onClick={() => setFilterText('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={t('common.clear')}
          >
            ✕
          </button>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('drive.addComment')}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            aria-label={t('drive.addComment')}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[44px]"
            aria-label={submitting ? t('common.sending') : t('drive.send')}
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>{submitting ? t('common.sending') : t('drive.send')}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      {filteredAndSortedComments.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400" role="status">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
          {filterText ? t('drive.noMatchingComments') : t('drive.noComments')}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedComments.map((comment) => (
            <article
              key={comment.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.user?.displayName || comment.user?.email || t('drive.unknownUser')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="flex-shrink-0 p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title={t('drive.deleteComment')}
                  aria-label={t('drive.deleteComment')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
