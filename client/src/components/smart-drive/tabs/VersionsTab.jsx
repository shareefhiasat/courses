import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { getIcon } from '@constants/iconTypes';
import axios from 'axios';

export default function VersionsTab({ fileId }) {
  const { t } = useLang();
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
      const response = await axios.get(`/api/v1/drive/files/${fileId}/versions`);
      if (response.data.success) {
        setVersions(response.data.payload || []);
        // Also fetch file info to check if it's a Collabora file
        const fileResponse = await axios.get(`/api/v1/drive/files/${fileId}`);
        if (fileResponse.data.success) {
          setFileInfo(fileResponse.data.payload);
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
  }, [fileId]);

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
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('drive.today') || 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('drive.yesterday') || 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }} role="status">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: '#dc2626' }} role="alert">
        {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
        {getIcon('ui', 'clock', 40)}
        {t('drive.noVersions')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
      {/* Left sidebar - Date timeline */}
      <div style={{
        width: '200px',
        flexShrink: 0,
        borderRight: '1px solid var(--border, #e5e7eb)',
        paddingInlineEnd: '1rem',
        overflowY: 'auto',
        maxHeight: '500px'
      }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted, #6b7280)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              fontSize: '0.875rem',
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
                fontSize: '0.875rem',
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

      {/* Right content - Versions */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
        {/* Search filter */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('drive.searchVersions') || 'Search versions...'}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              fontSize: '0.875rem',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              background: 'var(--panel, white)',
              color: 'var(--text, #111827)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary, #2563eb)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)'}
          />
        </div>

        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text, #111827)', marginBottom: '1rem' }}>
          {selectedDate ? formatDateHeader(selectedDate) : t('drive.versionHistory')} ({selectedVersions.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {selectedVersions.map((version) => (
            <div
              key={version.id}
              style={{
                padding: '1rem',
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
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)' }}>
                      {t('drive.version')} {version.versionNumber}
                    </span>
                    {version.isCurrent && (
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.75rem',
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getIcon('ui', 'user', 14)}
                      {version.uploadedBy?.displayName || version.uploadedBy?.email || '\u2014'}
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
                      fontSize: '0.75rem',
                      color: 'var(--text, #374151)',
                    }}>
                      {version.changeNote}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {formatDateTime(version.createdAt)}
                  </span>
                  <button
                    onClick={() => handleViewVersion(version.id)}
                    style={{
                      padding: '0.375rem',
                      fontSize: '0.875rem',
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
    </div>
  );
}
