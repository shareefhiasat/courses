import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { MessageSquare, Send, Trash2, User } from 'lucide-react';
import axios from 'axios';

/**
 * CommentsTab - FileComment thread with add/delete
 */
export default function CommentsTab({ fileId }) {
  const { t } = useLang();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-[#8d90a0]">
        {t('common.loading')}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-[#ffb4ab]">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        {t('drive.comments')} ({comments.length})
      </h3>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('drive.addComment')}
            className="flex-1 px-4 py-2 border border-[#434655]/30 rounded-lg bg-[#1d1f27] text-white placeholder-[#8d90a0] focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? t('common.sending') : t('drive.send')}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#8d90a0]">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          {t('drive.noComments')}
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 bg-[#1d1f27] rounded-lg border border-[#434655]/30 hover:border-[#434655]/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#32343d] flex items-center justify-center">
                    <User className="w-4 h-4 text-[#b4c5ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {comment.user?.displayName || comment.user?.email || t('drive.unknownUser')}
                      </span>
                      <span className="text-xs text-[#8d90a0]">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-[#e1e2ed] break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="flex-shrink-0 p-1.5 text-[#8d90a0] hover:text-[#ffb4ab] hover:bg-[#32343d] rounded transition-colors"
                  title={t('drive.deleteComment')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
