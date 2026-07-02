import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { getIcon } from '@constants/iconTypes';
import { getLocalizedUserName } from '@utils/localizedUserName';
import {
  TimelinePanelLayout,
  DriveTimelineEmptyState,
  DriveTimelineList,
  DriveTimelineLoadingState,
  DriveTimelineErrorState,
  DriveListCard,
  DriveUserAvatar,
} from '@ui/DriveTimeline';
import { formatQatarDate, formatQatarDateOnly } from '@utils/timezone';
import axios from 'axios';

const ACTION_COLORS = {
  UPLOAD: '#16a34a',
  DOWNLOAD: '#2563eb',
  SHARE: '#d97706',
  DELETE: '#dc2626',
  EDIT: '#2563eb',
  STAR: '#d97706',
  UNSTARRED: '#6b7280',
  RESTORE: '#16a34a',
  PREVIEW: '#8b5cf6',
  OPEN_IN_NEW_TAB: '#8b5cf6',
  PUBLIC_LINK_CREATED: '#0891b2',
  PUBLIC_LINK_REVOKED: '#dc2626',
  SOFT_DELETE: '#dc2626',
  ROLLBACK_VERSION: '#8b5cf6',
  RENAME: '#2563eb',
  OPEN: '#8b5cf6',
};

function getActionColor(action) {
  return ACTION_COLORS[action?.toUpperCase()] || '#6b7280';
}

function getActionIcon(action) {
  switch (action?.toUpperCase()) {
    case 'UPLOAD': return 'upload';
    case 'DOWNLOAD': return 'download';
    case 'SHARE': return 'share';
    case 'DELETE': return 'trash';
    case 'SOFT_DELETE': return 'trash';
    case 'RENAME': return 'edit';
    case 'EDIT': return 'edit';
    case 'STAR': return 'star';
    case 'UNSTARRED': return 'star_off';
    case 'RESTORE': return 'rotate_ccw';
    case 'ROLLBACK_VERSION': return 'git_branch';
    case 'PREVIEW': return 'eye';
    case 'OPEN': return 'external_link';
    case 'OPEN_IN_NEW_TAB': return 'external_link';
    case 'PUBLIC_LINK_CREATED': return 'link';
    case 'PUBLIC_LINK_REVOKED': return 'link';
    default: return 'activity';
  }
}

export default function ActivityTab({ fileId }) {
  const { t, lang } = useLang();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterText, setFilterText] = useState('');

  const getActivityLabel = (action) => {
    if (!action) return '';
    const exactKey = `drive.activity.${action}`;
    const exactVal = t(exactKey);
    if (exactVal !== exactKey) return exactVal;
    const lowerKey = `drive.activity.${action.toLowerCase()}`;
    const lowerVal = t(lowerKey);
    if (lowerVal !== lowerKey) return lowerVal;
    return action;
  };

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

  const groupedActivities = activities.reduce((acc, activity) => {
    const date = new Date(activity.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => new Date(b) - new Date(a));

  const filteredActivities = useMemo(() => {
    let filtered = selectedDate ? groupedActivities[selectedDate] || [] : activities;
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.action?.toLowerCase().includes(searchLower) ||
        activity.user?.displayName?.toLowerCase().includes(searchLower) ||
        activity.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, [activities, filterText, selectedDate, groupedActivities]);

  const formatDateTime = (date) => {
    if (!date) return '\u2014';
    return formatQatarDate(date, 'dd/MM/yyyy h:mm a');
  };

  const formatDateHeader = (dateStr) => formatQatarDateOnly(dateStr);

  if (loading) return <DriveTimelineLoadingState />;
  if (error) return <DriveTimelineErrorState message={error} />;
  if (activities.length === 0) {
    return <DriveTimelineEmptyState icon="activity" message={t('drive.noActivity')} />;
  }

  return (
    <TimelinePanelLayout
      panelLayoutKey="drive-activity-panels"
      allItemsLabel={t('drive.allActivities')}
      allItemsCount={activities.length}
      dates={sortedDates}
      getDateCount={(date) => groupedActivities[date]?.length || 0}
      formatDateHeader={formatDateHeader}
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
      filterText={filterText}
      onFilterChange={setFilterText}
      filterPlaceholder={t('drive.filterActivities')}
      sectionTitle={`${selectedDate ? formatDateHeader(selectedDate) : t('drive.activityLog')} (${filteredActivities.length})`}
      emptyState={
        filteredActivities.length === 0 ? (
          <DriveTimelineEmptyState
            icon="activity"
            message={filterText ? t('drive.noMatchingActivities') : t('drive.noActivity')}
          />
        ) : null
      }
    >
      {filteredActivities.length > 0 && (
        <DriveTimelineList>
          {filteredActivities.map((activity) => {
            const actionIcon = getActionIcon(activity.action);
            const actionColor = getActionColor(activity.action);

            return (
              <DriveListCard
                key={activity.id}
                avatar={<DriveUserAvatar user={activity.user} />}
                title={(
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text, #111827)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', color: actionColor }}>
                      {getIcon('ui', actionIcon, 14)}
                    </span>
                    {getActivityLabel(activity.action)}
                    <span style={{ color: 'var(--text-muted, #6b7280)', fontWeight: 400 }}>
                      · {getLocalizedUserName(activity.user, lang, t('drive.unknownUser'))}
                    </span>
                  </span>
                )}
                meta={activity.metadata && Object.keys(activity.metadata).length > 0 ? (
                  <>
                    {activity.metadata.linkId && (
                      <span style={{ color: 'var(--color-primary, #2563eb)' }}>{t('drive.linkCreated')}</span>
                    )}
                    {activity.metadata.expiresAt && (
                      <span>{t('drive.expires')}: {formatQatarDateOnly(activity.metadata.expiresAt)}</span>
                    )}
                    {activity.metadata.passwordProtected && (
                      <span style={{ color: '#d97706' }}>{t('drive.passwordProtected')}</span>
                    )}
                  </>
                ) : null}
                timestamp={formatDateTime(activity.createdAt)}
              />
            );
          })}
        </DriveTimelineList>
      )}
    </TimelinePanelLayout>
  );
}
