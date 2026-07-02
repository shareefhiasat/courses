import React, { useState, useEffect, useCallback } from 'react';
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
  DriveActionButton,
} from '@ui/DriveTimeline';
import { formatQatarDate, formatQatarDateOnly } from '@utils/timezone';
import axios from 'axios';

export default function VersionsTab({ fileId, useWorkflowEndpoint = false }) {
  const { t, lang } = useLang();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileInfo, setFileInfo] = useState(null);

  const fetchVersions = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = useWorkflowEndpoint
        ? `/api/v1/workflow-documents/${fileId}/versions`
        : `/api/v1/drive/files/${fileId}/versions`;

      const response = await axios.get(endpoint);
      if (response.data.success) {
        const data = response.data.data;
        if (useWorkflowEndpoint && data && data.versions) {
          setVersions(data.versions);
          setFileInfo(data.file);
        } else {
          setVersions(response.data.payload || data || []);
          if (!useWorkflowEndpoint) {
            try {
              const fileResponse = await axios.get(`/api/v1/drive/files/${fileId}`);
              if (fileResponse.data.success) {
                setFileInfo(fileResponse.data.payload);
              }
            } catch {
              // ignore
            }
          }
        }
      } else {
        setError(response.data.error?.message || 'Failed to fetch versions');
      }
    } catch (err) {
      console.error('[VersionsTab] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fileId, useWorkflowEndpoint]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleViewVersion = async (versionId) => {
    const getFileType = (mimeType, fileName) => {
      if (!mimeType && !fileName) return 'unknown';
      const mt = (mimeType || '').toLowerCase();
      const name = (fileName || '').toLowerCase();
      if (mt.includes('word') || mt.includes('document') || name.endsWith('.doc') || name.endsWith('.docx')) return 'document';
      if (mt.includes('presentation') || mt.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) return 'presentation';
      if (mt.includes('sheet') || mt.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'spreadsheet';
      return 'unknown';
    };

    const fileType = getFileType(fileInfo?.mimeType, fileInfo?.name);
    const isCollaboraFile = ['document', 'presentation', 'spreadsheet'].includes(fileType);

    if (isCollaboraFile) {
      try {
        const response = await fetch(`/api/v1/drive/files/${fileId}/preview?versionId=${versionId}`);
        const data = await response.json();
        if (data.success && data.payload.wopiToken) {
          const collaboraUrl = `${import.meta.env.COLLABORA_URL || 'https://localhost:9980'}/browser/4610258811/cool.html?WOPISrc=${encodeURIComponent('http://host.docker.internal:8001/api/v1/wopi/files/' + fileId)}&access_token=${data.payload.wopiToken}`;
          window.open(collaboraUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.open(`/api/v1/drive/files/${fileId}/download?versionId=${versionId}`, '_blank');
        }
      } catch {
        window.open(`/api/v1/drive/files/${fileId}/download?versionId=${versionId}`, '_blank');
      }
    } else {
      window.open(`/api/v1/drive/files/${fileId}/download?versionId=${versionId}`, '_blank');
    }
  };

  const getUserName = (user) => getLocalizedUserName(user, lang, '\u2014');

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '\u2014';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatDateTime = (date) => {
    if (!date) return '\u2014';
    return formatQatarDate(date, 'dd/MM/yyyy h:mm a');
  };

  const formatDateHeader = (dateStr) => formatQatarDateOnly(dateStr);

  const groupedVersions = versions.reduce((acc, version) => {
    const date = new Date(version.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(version);
    return acc;
  }, {});

  const filteredVersions = versions.filter(version => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      version.uploadedBy?.displayName?.toLowerCase().includes(query) ||
      version.uploadedBy?.email?.toLowerCase().includes(query) ||
      version.changeNote?.toLowerCase().includes(query) ||
      version.versionNumber?.toString().includes(query)
    );
  });

  const filteredGroupedVersions = filteredVersions.reduce((acc, version) => {
    const date = new Date(version.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(version);
    return acc;
  }, {});

  const filteredSortedDates = Object.keys(filteredGroupedVersions).sort((a, b) => new Date(b) - new Date(a));
  const selectedVersions = selectedDate ? filteredGroupedVersions[selectedDate] : filteredVersions;

  if (loading) return <DriveTimelineLoadingState />;
  if (error) return <DriveTimelineErrorState message={error} />;
  if (versions.length === 0) {
    return <DriveTimelineEmptyState icon="clock" message={t('drive.noVersions')} />;
  }

  return (
    <TimelinePanelLayout
      panelLayoutKey="drive-versions-panels"
      allItemsLabel={t('drive.allVersions') || 'All Versions'}
      allItemsCount={filteredVersions.length}
      dates={filteredSortedDates}
      getDateCount={(date) => filteredGroupedVersions[date]?.length || 0}
      formatDateHeader={formatDateHeader}
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
      filterText={searchQuery}
      onFilterChange={setSearchQuery}
      filterPlaceholder={t('drive.searchVersions') || 'Search versions...'}
      sectionTitle={`${selectedDate ? formatDateHeader(selectedDate) : t('drive.versionHistory')} (${selectedVersions.length})`}
    >
      <DriveTimelineList>
        {selectedVersions.map((version) => (
          <DriveListCard
            key={version.id}
            highlight={version.isCurrent}
            borderColor={version.isCurrent ? '#10b981' : undefined}
            avatar={<DriveUserAvatar user={version.uploadedBy} size="sm" />}
            title={(
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getIcon('ui', 'clock', 14)}
                <span>{t('drive.version')} {version.versionNumber}</span>
                {version.isCurrent && (
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    fontSize: 'var(--font-size-xs)',
                    borderRadius: '9999px',
                    background: '#10b981',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    {getIcon('ui', 'tag', 12)}
                    {t('drive.current')}
                  </span>
                )}
              </span>
            )}
            meta={(
              <>
                <span>{getUserName(version.uploadedBy)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {getIcon('ui', 'download', 14)}
                  {formatSize(version.size)}
                </span>
              </>
            )}
            timestamp={formatDateTime(version.createdAt)}
            actions={(
              <DriveActionButton
                icon="eye"
                onClick={() => handleViewVersion(version.id)}
                ariaLabel={t('drive.preview', 'Preview')}
                variant="default"
              />
            )}
          >
            {version.changeNote && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: 'var(--background-secondary, #f3f4f6)',
                borderRadius: '0.25rem',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text, #374151)',
              }}>
                {version.changeNote}
              </div>
            )}
          </DriveListCard>
        ))}
      </DriveTimelineList>
    </TimelinePanelLayout>
  );
}
