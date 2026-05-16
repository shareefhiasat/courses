import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { Activity, Upload, Download, Share2, Trash2, Edit, Star, RotateCcw } from 'lucide-react';
import axios from 'axios';

/**
 * ActivityTab - FileActivity audit trail
 */
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
      case 'UPLOAD': return 'text-[#a5d6a7]';
      case 'DOWNLOAD': return 'text-[#b4c5ff]';
      case 'SHARE': return 'text-[#ffd699]';
      case 'DELETE': return 'text-[#ffb4ab]';
      case 'EDIT': return 'text-[#b4c5ff]';
      case 'STAR': return 'text-[#ffd699]';
      case 'RESTORE': return 'text-[#a5d6a7]';
      default: return 'text-[#8d90a0]';
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

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[#8d90a0]">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        {t('drive.noActivity')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">
        {t('drive.activityLog')} ({activities.length})
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute start-4 top-0 bottom-0 w-0.5 bg-[#434655]/30" />

        <div className="space-y-4">
          {activities.map((activity, idx) => {
            const ActionIcon = getActionIcon(activity.action);
            const colorClass = getActionColor(activity.action);

            return (
              <div key={activity.id} className="relative ps-12">
                {/* Timeline dot */}
                <div className={`absolute start-0 w-8 h-8 rounded-full bg-[#32343d] flex items-center justify-center border-2 border-[#191b23] ${colorClass}`}>
                  <ActionIcon className="w-4 h-4" />
                </div>

                <div className="p-3 bg-[#1d1f27] rounded-lg border border-[#434655]/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white mb-1">
                        {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-[#8d90a0]">
                        {activity.user?.displayName || activity.user?.email || 'Unknown User'}
                        {' · '}
                        {formatDate(activity.createdAt)}
                      </p>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-[#8d90a0]">
                          {activity.metadata.linkId && <span className="text-[#b4c5ff]">Link created</span>}
                          {activity.metadata.expiresAt && (
                            <span className="ms-2">
                              Expires: {new Date(activity.metadata.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                          {activity.metadata.passwordProtected && (
                            <span className="ms-2 text-[#ffd699]">🔒 Password protected</span>
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
