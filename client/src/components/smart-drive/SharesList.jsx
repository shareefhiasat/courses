import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { X, User, Shield, Calendar, Eye, Download, MessageSquare, Edit } from 'lucide-react';
import axios from 'axios';

export default function SharesList({ fileId, onRevoke }) {
  const { t } = useLang();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchShares = useCallback(async () => {
    if (!fileId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/drive/files/${fileId}/shares`);
      if (response.data.success) {
        setShares(response.data.payload || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch shares');
      }
    } catch (err) {
      console.error('[SharesList] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleRevoke = async (shareId) => {
    try {
      const response = await axios.delete(`/api/v1/drive/shares/${shareId}`);
      if (response.data.success) {
        setShares(prev => prev.filter(s => s.id !== shareId));
        onRevoke?.(shareId);
      }
    } catch (err) {
      console.error('[SharesList] revoke failed:', err);
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'VIEW': return Eye;
      case 'DOWNLOAD': return Download;
      case 'COMMENT': return MessageSquare;
      case 'EDIT': return Edit;
      default: return Eye;
    }
  };

  const formatExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return t('drive.expired');
    if (diffDays === 0) return t('drive.expirestoday');
    if (diffDays === 1) return t('drive.expirestomorrow');
    return t('drive.expiresindays', { days: diffDays });
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('drive.noShares')}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        {t('drive.existingShares')} ({shares.length})
      </h4>

      {shares.map(share => {
        const PermIcon = getPermissionIcon(share.permission);
        const isUser = share.subjectType === 'USER';
        const displayName = isUser
          ? (share.subjectUser?.displayName || share.subjectUser?.email || t('drive.unknownUser'))
          : share.subjectRole;
        const expiryText = formatExpiry(share.expiresAt);

        return (
          <div
            key={share.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {isUser ? (
                  <User className="w-4 h-4 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                ) : (
                  <Shield className="w-4 h-4 text-amber-500 dark:text-amber-400" aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {displayName}
                  </p>
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {isUser ? t('drive.user') : t('drive.role')}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <PermIcon className="w-3 h-3" aria-hidden="true" />
                    {t(`drive.permission.${share.permission.toLowerCase()}`)}
                  </div>

                  {expiryText && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {expiryText}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleRevoke(share.id)}
              className="flex-shrink-0 p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title={t('drive.revokeShare')}
              aria-label={t('drive.revokeShare')}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
