import React, { useState, useEffect, useCallback, useMemo } from 'react'; // React needed for cloneElement in role avatar
import { useLang } from '@contexts/LangContext';
import { getThemedIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { getUserRoleFromObject } from '@utils/userUtils';
import { getLocalizedUserName } from '@utils/localizedUserName';
import {
  TimelinePanelLayout,
  DriveTimelineEmptyState,
  DriveTimelineList,
  DriveTimelineLoadingState,
  DriveTimelineErrorState,
  DriveListCard,
  DriveUserAvatar,
  DriveActionButton,
  DriveIconBadge,
} from '@ui/DriveTimeline';
import { formatQatarDate, formatQatarDateOnly } from '@utils/timezone';
import axios from 'axios';

export default function SharesList({ fileId, onRevoke, refreshKey, readOnly = false, subjectTypeFilter = null }) {
  const { t, lang } = useLang();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterText, setFilterText] = useState('');

  const fetchShares = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      let url = `/api/v1/drive/files/${fileId}/shares`;
      if (subjectTypeFilter) {
        url += `?subjectType=${subjectTypeFilter}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        setShares(response.data.data || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch shares');
      }
    } catch (err) {
      console.error('[SharesList] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fileId, subjectTypeFilter]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares, refreshKey]);

  const groupedShares = shares.reduce((acc, share) => {
    const date = new Date(share.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(share);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedShares).sort((a, b) => new Date(b) - new Date(a));

  const filteredShares = useMemo(() => {
    let filtered = selectedDate ? groupedShares[selectedDate] || [] : shares;
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(share => {
        const displayName = share.subjectType === 'USER'
          ? (share.subjectUser?.displayName || share.subjectUser?.email || '')
          : share.subjectRole || '';
        return displayName.toLowerCase().includes(searchLower) ||
               share.permission?.toLowerCase().includes(searchLower);
      });
    }
    return filtered;
  }, [shares, filterText, selectedDate, groupedShares]);

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
      case 'VIEW': return 'eye';
      case 'DOWNLOAD': return 'download';
      case 'COMMENT': return 'message';
      case 'EDIT': return 'edit';
      default: return 'eye';
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '\u2014';
    return formatQatarDate(date, 'dd/MM/yyyy h:mm a');
  };

  const formatDateHeader = (dateStr) => formatQatarDateOnly(dateStr);

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

  const renderShareAvatar = (share) => {
    const isUser = share.subjectType === 'USER';
    const displayName = isUser
      ? (share.subjectUser?.displayName || share.subjectUser?.email || t('drive.unknownUser'))
      : share.subjectRole;

    if (isUser) {
      return <DriveUserAvatar user={share.subjectUser} size="sm" />;
    }

    return (
      <div style={{
        width: '1.75rem',
        height: '1.75rem',
        borderRadius: '9999px',
        background: `${getUserRoleColor(displayName)}1A`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {(() => {
          const roleIcon = getUserRoleIcon(displayName);
          const roleColor = getUserRoleColor(displayName);
          return roleIcon
            ? React.cloneElement(roleIcon, { color: roleColor, size: 14 })
            : getThemedIcon('ui', 'shield', 14, 'primary');
        })()}
      </div>
    );
  };

  if (loading) return <DriveTimelineLoadingState />;
  if (error) return <DriveTimelineErrorState message={error} />;
  if (shares.length === 0) {
    return <DriveTimelineEmptyState icon="share" message={t('drive.noShares')} />;
  }

  return (
    <TimelinePanelLayout
      panelLayoutKey={`drive-shares-panels-${subjectTypeFilter || 'all'}`}
      compact
      allItemsLabel={t('drive.allShares')}
      allItemsCount={shares.length}
      dates={sortedDates}
      getDateCount={(date) => groupedShares[date]?.length || 0}
      formatDateHeader={formatDateHeader}
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
      filterText={filterText}
      onFilterChange={setFilterText}
      filterPlaceholder={t('drive.filterShares')}
      sectionTitle={`${selectedDate ? formatDateHeader(selectedDate) : t('drive.existingShares')} (${filteredShares.length})`}
      emptyState={
        filteredShares.length === 0 ? (
          <DriveTimelineEmptyState
            icon="share"
            message={filterText ? t('drive.noMatchingShares') : t('drive.noShares')}
          />
        ) : null
      }
    >
      {filteredShares.length > 0 && (
        <DriveTimelineList>
          {filteredShares.map(share => {
            const permIcon = getPermissionIcon(share.permission);
            const isUser = share.subjectType === 'USER';
            const displayName = isUser
              ? (share.subjectUser?.displayName || share.subjectUser?.email || t('drive.unknownUser'))
              : share.subjectRole;
            const expiryText = formatExpiry(share.expiresAt);

            return (
              <DriveListCard
                key={share.id}
                avatar={renderShareAvatar(share)}
                title={isUser ? getLocalizedUserName(share.subjectUser, lang, displayName) : t(`roles.${displayName}`, displayName)}
                meta={expiryText ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {getThemedIcon('ui', 'calendar', 14, 'currentColor')}
                    {expiryText}
                  </span>
                ) : null}
                timestamp={formatDateTime(share.createdAt)}
                actions={(
                  <>
                    <DriveIconBadge
                      icon={permIcon}
                      title={t(`drive.permission.${share.permission.toLowerCase()}`)}
                    />
                    {!readOnly && (
                      <DriveActionButton
                        icon="trash"
                        onClick={() => handleRevoke(share.id)}
                        ariaLabel={t('drive.revokeShare')}
                        variant="danger"
                      />
                    )}
                  </>
                )}
              />
            );
          })}
        </DriveTimelineList>
      )}
    </TimelinePanelLayout>
  );
}
