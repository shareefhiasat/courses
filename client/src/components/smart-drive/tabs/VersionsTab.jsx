import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { getIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { formatQatarDate, formatQatarDateOnly } from '@utils/timezone';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { getUserRoleFromObject } from '@utils/userUtils';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { usePanelLayout } from '@hooks/usePanelLayout';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
      // Use workflow endpoint for workflow documents (no permission restrictions)
      // Use drive endpoint for regular files (has permission checks)
      const endpoint = useWorkflowEndpoint 
        ? `/api/v1/workflow-documents/${fileId}/versions`
        : `/api/v1/drive/files/${fileId}/versions`;
      
      const response = await axios.get(endpoint);
      if (response.data.success) {
        // Workflow endpoint returns { data: { file, versions, minioVersions } }
        // Drive endpoint returns { payload: [...versions] }
        const data = response.data.data;
        if (useWorkflowEndpoint && data && data.versions) {
          setVersions(data.versions);
          setFileInfo(data.file);
        } else {
          setVersions(response.data.payload || data || []);
          // Only fetch file info from drive endpoint for non-workflow files
          if (!useWorkflowEndpoint) {
            try {
              const fileResponse = await axios.get(`/api/v1/drive/files/${fileId}`);
              if (fileResponse.data.success) {
                setFileInfo(fileResponse.data.payload);
              }
            } catch {
              // ignore file info fetch failure
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

  const handleRestore = async (versionId) => {
    try {
      const response = await axios.post(`/api/v1/drive/versions/${versionId}/restore`);
      if (response.data.success) {
        fetchVersions();
      } else if (response.data.error?.code === 'NAME_CONFLICT') {
        alert(t('drive.versions.restoreNameConflict') || 'Cannot restore: A file with this name already exists in this folder.');
      }
    } catch (err) {
      console.error('[VersionsTab] restore failed:', err);
      if (err.response?.data?.error?.code === 'NAME_CONFLICT') {
        alert(t('drive.versions.restoreNameConflict') || 'Cannot restore: A file with this name already exists in this folder.');
      } else {
        alert(t('drive.versions.restoreError') || 'Failed to restore version');
      }
    }
  };

  const handleViewVersion = async (versionId) => {
    // Check if this is a Collabora file (document, presentation, spreadsheet)
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
      // For Collabora files, fetch WOPI token and open in Collabora
      try {
        const response = await fetch(`/api/v1/drive/files/${fileId}/preview?versionId=${versionId}`);
        const data = await response.json();
        
        if (data.success && data.payload.wopiToken) {
          const collaboraUrl = `https://localhost:9980/browser/4610258811/cool.html?WOPISrc=${encodeURIComponent('http://host.docker.internal:8001/api/v1/wopi/files/' + fileId)}&access_token=${data.payload.wopiToken}`;
          window.open(collaboraUrl, '_blank', 'noopener,noreferrer');
        } else {
          // Fallback to download if preview fails
          window.open(`/api/v1/drive/files/${fileId}/download?versionId=${versionId}`, '_blank');
        }
      } catch (error) {
        console.error('[VersionsTab] Failed to get preview URL:', error);
        window.open(`/api/v1/drive/files/${fileId}/download?versionId=${versionId}`, '_blank');
      }
    } else {
      // For non-Collabora files, just download
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
    return formatQatarDate(date, 'dd/MM/yyyy HH:mm');
  };

  const formatDateHeader = (dateStr) => {
    return formatQatarDateOnly(dateStr);
  };

  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const timelinePanelRef = useRef(null);
  const [savedLayout, onLayoutChange] = usePanelLayout('wf-versions-panels', { timeline: 35, content: 65 });

  // Group versions by date
  const groupedVersions = versions.reduce((acc, version) => {
    const date = new Date(version.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(version);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedVersions).sort((a, b) => new Date(b) - new Date(a));

  // Filter versions by search query
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

  // Group filtered versions by date
  const filteredGroupedVersions = filteredVersions.reduce((acc, version) => {
    const date = new Date(version.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(version);
    return acc;
  }, {});

  const filteredSortedDates = Object.keys(filteredGroupedVersions).sort((a, b) => new Date(b) - new Date(a));
  const selectedVersions = selectedDate ? filteredGroupedVersions[selectedDate] : filteredVersions;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted, #6b7280)' }} role="status">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: 'var(--font-size-sm)', color: '#dc2626' }} role="alert">
        {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted, #6b7280)' }}>
        {getIcon('ui', 'clock', 40)}
        {t('drive.noVersions')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelGroup orientation="horizontal" id="workflow-versions-panels" style={{ flex: 1 }} defaultLayout={savedLayout} onLayoutChange={onLayoutChange}>
      {/* Left sidebar - Date timeline */}
      <Panel id="timeline" panelRef={timelinePanelRef} defaultSize={35} minSize={15} collapsible collapsedSize={0}>
      <div style={{
        borderRight: '1px solid var(--border, #e5e7eb)',
        paddingInlineEnd: '1rem',
        overflowY: 'auto',
        height: '100%',
      }}>
        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-muted, #6b7280)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getIcon('ui', 'clock', 16)}
          {t('drive.timeline') || 'Timeline'}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <button
            onClick={() => setSelectedDate(null)}
            style={{
              padding: '0.5rem',
              textAlign: 'start',
              background: !selectedDate ? 'var(--bg-primary, #f3f4f6)' : 'transparent',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: 'var(--font-size-sm)',
              color: !selectedDate ? 'var(--text, #111827)' : 'var(--text-muted, #6b7280)',
              cursor: 'pointer',
              fontWeight: !selectedDate ? 600 : 400,
            }}
          >
            {t('drive.allVersions') || 'All Versions'} ({filteredVersions.length})
          </button>
          {filteredSortedDates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                padding: '0.5rem',
                textAlign: 'start',
                background: selectedDate === date ? 'var(--bg-primary, #f3f4f6)' : 'transparent',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: 'var(--font-size-sm)',
                color: selectedDate === date ? 'var(--text, #111827)' : 'var(--text-muted, #6b7280)',
                cursor: 'pointer',
                fontWeight: selectedDate === date ? 600 : 400,
              }}
            >
              {formatDateHeader(date)} ({filteredGroupedVersions[date].length})
            </button>
          ))}
        </div>
      </div>
      </Panel>
      <PanelResizeHandle style={{ width: '4px', background: 'var(--border, #e5e7eb)', margin: '0 2px', borderRadius: '2px', cursor: 'col-resize' }} />

      {/* Right content - Versions */}
      <Panel id="content" minSize={30}>
      <div style={{ flex: 1, overflowY: 'auto', height: '100%', paddingInlineStart: '0.5rem' }}>
        {/* Search filter */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('drive.searchVersions') || 'Search versions...'}
            style={{
              flex: 1,
              padding: '0.625rem 0.75rem',
              fontSize: 'var(--font-size-sm)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              background: 'var(--panel, white)',
              color: 'var(--text, #111827)',
              outline: 'none',
            }}
          />
          <button
            onClick={() => {
              if (timelineCollapsed) {
                timelinePanelRef.current?.expand();
                setTimelineCollapsed(false);
              } else {
                timelinePanelRef.current?.collapse();
                setTimelineCollapsed(true);
              }
            }}
            style={{
              padding: '0.5rem',
              background: 'var(--panel, white)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: 'var(--text-muted, #6b7280)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            title={timelineCollapsed ? t('workflow.expand', 'Expand') : t('workflow.collapse', 'Collapse')}
          >
            {timelineCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text, #111827)', marginBottom: '1rem' }}>
          {selectedDate ? formatDateHeader(selectedDate) : t('drive.versionHistory')} ({selectedVersions.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {selectedVersions.map((version) => (
            <div
              key={version.id}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.75rem',
                border: '2px solid',
                borderColor: version.isCurrent ? '#10b981' : 'var(--border, #e5e7eb)',
                background: 'var(--panel, white)',
                boxShadow: version.isCurrent ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {getIcon('ui', 'clock', 16)}
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text, #111827)' }}>
                      {t('drive.version')} {version.versionNumber}
                    </span>
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
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted, #6b7280)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getIcon('ui', 'user', 14)}
                      {getUserName(version.uploadedBy)}
                      {(() => { const role = getUserRoleFromObject(version.uploadedBy); if (!role) return null; const icon = getUserRoleIcon(role); const color = getUserRoleColor(role); return icon ? (
                        <span title={t(`roles.${role}`, role)} style={{ display: 'flex', alignItems: 'center' }}>
                          {React.cloneElement(icon, { color, size: 12 })}
                        </span>
                      ) : null; })()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getIcon('ui', 'download', 14)}
                      {formatSize(version.size)}
                    </div>
                  </div>
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
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted, #6b7280)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {formatDateTime(version.createdAt)}
                  </span>
                  <button
                    onClick={() => handleViewVersion(version.id)}
                    style={{
                      padding: '0.375rem',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-muted, #6b7280)',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary, #2563eb)';
                      e.currentTarget.style.background = 'var(--bg-secondary, #f3f4f6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {getIcon('ui', 'eye', 16)}
                  </button>
                  {!version.isCurrent && (
                    /* Restore button hidden per user request */
                    null
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </Panel>
      </PanelGroup>
    </div>
  );
}
