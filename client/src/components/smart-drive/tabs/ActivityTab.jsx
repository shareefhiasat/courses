import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { Activity, Upload, Download, Share2, Trash2, Edit, Star, RotateCcw } from 'lucide-react';
import axios from 'axios';

export default function ActivityTab({ fileId }) {
  const { t } = useLang();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchActivities = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/drive/files/${fileId}/activities`);
      if (response.data.success) {
        setActivities(response.data.payload || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch activities');
      }
    } catch (err) {
      console.error('[ActivityTab] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getActionIcon = (action) => {
    switch (action?.toUpperCase()) {
      case 'UPLOAD': return Upload;
      case 'DOWNLOAD': return Download;
      case 'SHARE': return Share2;
      case 'DELETE': return Trash2;
      case 'EDIT': return Edit;
      case 'STAR': return Star;
      case 'RESTORE': return RotateCcw;
      default: return Activity;
    }
  };

  const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
      case 'UPLOAD': return 'text-green-600 dark:text-green-400';
      case 'DOWNLOAD': return 'text-blue-600 dark:text-blue-400';
      case 'SHARE': return 'text-amber-600 dark:text-amber-400';
      case 'DELETE': return 'text-red-600 dark:text-red-400';
      case 'EDIT': return 'text-blue-600 dark:text-blue-400';
      case 'STAR': return 'text-amber-600 dark:text-amber-400';
      case 'RESTORE': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const formatDate = (date) => {
    if (!date) return '\u2014';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
    return d.toLocaleString();
  };

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

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-sm text-gray-500 dark:text-gray-400">
        <Activity className="w-10 h-10 mb-3 opacity-50" aria-hidden="true" />
        {t('drive.noActivity')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('drive.activityLog')} ({activities.length})
      </h3>

      <div className="relative">
        <div className="absolute start-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-4">
          {activities.map((activity) => {
            const ActionIcon = getActionIcon(activity.action);
            const colorClass = getActionColor(activity.action);

            return (
              <div key={activity.id} className="relative ps-12">
                <div className={`absolute start-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border-2 border-white ${colorClass}`}>
                  <ActionIcon className="w-4 h-4" aria-hidden="true" />
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.user?.displayName || activity.user?.email || 'Unknown User'}
                        {' \u00B7 '}
                        {formatDate(activity.createdAt)}
                      </p>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-x-2">
                          {activity.metadata.linkId && <span className="text-blue-600 dark:text-blue-400">Link created</span>}
                          {activity.metadata.expiresAt && (
                            <span>Expires: {new Date(activity.metadata.expiresAt).toLocaleDateString()}</span>
                          )}
                          {activity.metadata.passwordProtected && (
                            <span className="text-amber-600 dark:text-amber-400">Password protected</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
