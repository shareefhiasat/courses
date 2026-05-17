import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { MessageSquare, Send, Trash2, User, Search, ArrowUpDown } from 'lucide-react';
import axios from 'axios';

export default function CommentsTab({ fileId }) {
  const { t } = useLang();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
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
    if (!date) return '\u2014';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
    return d.toLocaleString();
  };

  const filteredAndSortedComments = useMemo(() => {
    let filtered = comments;
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(comment =>
        comment.content?.toLowerCase().includes(searchLower) ||
        comment.user?.displayName?.toLowerCase().includes(searchLower) ||
        comment.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [comments, filterText, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-500 dark:text-gray-400" role="status">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('drive.comments')} ({filteredAndSortedComments.length})
        </h3>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            aria-label={t('drive.sortComments')}
          >
            <option value="newest">{t('drive.sort.newest')}</option>
            <option value="oldest">{t('drive.sort.oldest')}</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder={t('drive.filterComments')}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          aria-label={t('drive.filterComments')}
        />
        {filterText && (
          <button
            onClick={() => setFilterText('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={t('common.clear')}
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleAddComment}>
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('drive.addComment')}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            aria-label={t('drive.addComment')}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium min-h-[44px]"
            aria-label={submitting ? t('common.sending') : t('drive.send')}
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>{submitting ? t('common.sending') : t('drive.send')}</span>
          </button>
        </div>
      </form>

      {filteredAndSortedComments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-sm text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-10 h-10 mb-3 opacity-50" aria-hidden="true" />
          {filterText ? t('drive.noMatchingComments') : t('drive.noComments')}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedComments.map((comment) => (
            <article
              key={comment.id}
              className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" aria-hidden="true" />
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
                  className="flex-shrink-0 p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title={t('drive.deleteComment')}
                  aria-label={t('drive.deleteComment')}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
