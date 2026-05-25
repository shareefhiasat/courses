import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { getIcon } from '@constants/iconTypes';
import { apiService } from '@services/api/apiService';

const formatDateHeader = (dateStr, t) => {
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

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '\u2014';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
};

const STATUS_STYLES = {
  SUBMITTED: {
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)',
    borderColor: '#93c5fd',
  },
  IN_PROGRESS: {
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.1)',
    borderColor: '#fcd34d',
  },
  APPROVED: {
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.1)',
    borderColor: '#86efac',
  },
  COMPLETED: {
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.1)',
    borderColor: '#86efac',
  },
  REJECTED: {
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.1)',
    borderColor: '#fca5a5',
  },
  WITHDRAWN: {
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.1)',
    borderColor: '#d1d5db',
  },
};

const WORKFLOW_TYPE_STYLES = {
  ATTENDANCE_DAILY: {
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)',
  },
  ATTENDANCE_WEEKLY: {
    color: '#db2777',
    bg: 'rgba(219, 39, 119, 0.1)',
  },
  GENERAL: {
    color: '#0891b2',
    bg: 'rgba(8, 145, 178, 0.1)',
  },
};

const DEFAULT_STATUS = {
  color: 'var(--text-muted, #6b7280)',
  bg: 'var(--background-secondary, #f3f4f6)',
  borderColor: 'var(--border, #e5e7eb)',
};

function getStatusStyle(status) {
  return STATUS_STYLES[status?.toUpperCase()] || {
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.1)',
    borderColor: '#d1d5db',
  };
}

function getWorkflowTypeStyle(type) {
  return WORKFLOW_TYPE_STYLES[type] || WORKFLOW_TYPE_STYLES.GENERAL;
}

function getRelativeTime(date) {
  if (!date) return '\u2014';
  const now = new Date();
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '\u2014';
  
  const seconds = Math.floor((now - d) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function getStepBadgeStyle(status) {
  if (status === 'COMPLETED' || status === 'APPROVED') {
    return {
      color: 'var(--status-approved, #16a34a)',
      bg: 'var(--status-approved-bg, rgba(22, 163, 74, 0.1))',
    };
  }
  if (status === 'IN_PROGRESS' || status === 'PENDING') {
    return {
      color: 'var(--status-pending, #d97706)',
      bg: 'var(--status-pending-bg, rgba(217, 119, 6, 0.1))',
    };
  }
  if (status === 'REJECTED') {
    return {
      color: 'var(--status-rejected, #dc2626)',
      bg: 'var(--status-rejected-bg, rgba(220, 38, 38, 0.1))',
    };
  }
  return {
    color: 'var(--text-muted, #6b7280)',
    bg: 'var(--background-secondary, #f3f4f6)',
  };
}

export default function WorkflowTab({ fileId }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchWorkflow = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get('/workflow-documents', {
        params: { fileId: fileId }
      });
      if (response.success) {
        const workflows = response.data || response.payload || [];
        setWorkflows(workflows);
      } else {
        setError(response.error?.message || 'Failed to fetch workflow');
      }
    } catch (err) {
      console.error('[WorkflowTab] fetch failed:', err);
      setError(err.message || 'Failed to fetch workflow');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'COMPLETED':
      case 'APPROVED': return 'check_circle';
      case 'REJECTED': return 'x_circle';
      case 'PENDING':
      case 'IN_PROGRESS':
      case 'SUBMITTED': return 'clock';
      case 'WITHDRAWN': return 'alert_circle';
      default: return 'git_branch';
    }
  };

  const getStatusDescription = (status) => {
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'DRAFT': return t('workflow.status.draft.desc', 'Workflow is being prepared');
      case 'SUBMITTED': return t('workflow.status.submitted.desc', 'Submitted for review');
      case 'PENDING': return t('workflow.status.pending.desc', 'Awaiting review');
      case 'IN_PROGRESS': return t('workflow.status.inProgress.desc', 'Currently being reviewed');
      case 'COMPLETED': return t('workflow.status.completed.desc', 'Workflow completed successfully');
      case 'APPROVED': return t('workflow.status.approved.desc', 'Approved and finalized');
      case 'REJECTED': return t('workflow.status.rejected.desc', 'Rejected and requires changes');
      case 'WITHDRAWN': return t('workflow.status.withdrawn.desc', 'Withdrawn by submitter');
      case 'NEEDS_FEEDBACK': return t('workflow.status.needsFeedback.desc', 'Additional information required');
      default: return t('workflow.status.unknown.desc', 'Unknown status');
    }
  };

  const statusCounts = useMemo(() => {
    return workflows.reduce((acc, workflow) => {
      const status = workflow.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [workflows]);

  const getFileType = (file) => {
    if (!file || !file.mimeType) return 'unknown';
    const mt = file.mimeType.toLowerCase();
    const name = (file.name || '').toLowerCase();

    if (mt.startsWith('image/')) return 'image';
    if (mt.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
    if (mt.includes('word') || mt.includes('document') || name.endsWith('.doc') || name.endsWith('.docx')) return 'document';
    if (mt.includes('presentation') || mt.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) return 'presentation';
    if (mt.includes('sheet') || mt.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'spreadsheet';
    return 'unknown';
  };

  const handleViewSnapshot = async (file, fileVersionId = null) => {
    console.log('🔍 [WorkflowTab] handleViewSnapshot called', { file, fileId: file.id, fileName: file.name, mimeType: file.mimeType, fileVersionId });
    const fileType = getFileType(file);
    console.log('🔍 [WorkflowTab] Detected file type:', fileType);

    // For images, use preview endpoint to get inline URL with version support
    if (fileType === 'image') {
      try {
        console.log('🔍 [WorkflowTab] Fetching preview for image');
        const url = fileVersionId
          ? `/api/v1/drive/files/${file.id}/preview?versionId=${fileVersionId}`
          : `/api/v1/drive/files/${file.id}/preview`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('🔍 [WorkflowTab] Image preview response:', data);

        if (data.success && data.payload.url) {
          console.log('🔍 [WorkflowTab] Opening image preview URL:', data.payload.url);
          window.open(data.payload.url, '_blank');
        } else {
          // Fallback to download if preview fails
          console.log('🔍 [WorkflowTab] Image preview failed, falling back to download');
          const downloadUrl = fileVersionId
            ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
            : `/api/v1/drive/files/${file.id}/download`;
          window.open(downloadUrl, '_blank');
        }
      } catch (error) {
        console.error('❌ [WorkflowTab] Failed to get image preview URL:', error);
        const downloadUrl = fileVersionId
          ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
          : `/api/v1/drive/files/${file.id}/download`;
        window.open(downloadUrl, '_blank');
      }
      return;
    }

    // For PDFs, use the download endpoint (now supports inline for PDFs) with version support
    if (fileType === 'pdf') {
      const url = fileVersionId
        ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
        : `/api/v1/drive/files/${file.id}/download`;
      console.log('🔍 [WorkflowTab] Opening PDF in new tab:', url);
      window.open(url, '_blank');
      return;
    }

    // For Office documents, use Collabora in read-only mode with version support
    if (fileType === 'document' || fileType === 'presentation' || fileType === 'spreadsheet') {
      try {
        console.log('🔍 [WorkflowTab] Fetching preview for Office document');
        const url = fileVersionId
          ? `/api/v1/drive/files/${file.id}/preview?versionId=${fileVersionId}`
          : `/api/v1/drive/files/${file.id}/preview`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('🔍 [WorkflowTab] Preview response:', data);

        if (data.success && data.payload.wopiToken) {
          const collaboraUrl = `https://localhost:9980/browser/4610258811/cool.html?WOPISrc=${encodeURIComponent('http://host.docker.internal:8001/api/v1/wopi/files/' + file.id)}&access_token=${data.payload.wopiToken}&permission=readonly`;
          console.log('🔍 [WorkflowTab] Opening Collabora URL:', collaboraUrl);
          window.open(collaboraUrl, '_blank', 'noopener,noreferrer');
        } else {
          // Fallback to download if preview fails
          console.log('🔍 [WorkflowTab] Preview failed, falling back to download');
          const downloadUrl = fileVersionId
            ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
            : `/api/v1/drive/files/${file.id}/download`;
          window.open(downloadUrl, '_blank');
        }
      } catch (error) {
        console.error('❌ [WorkflowTab] Failed to get preview URL:', error);
        const downloadUrl = fileVersionId
          ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
          : `/api/v1/drive/files/${file.id}/download`;
        window.open(downloadUrl, '_blank');
      }
      return;
    }

    // For other file types, just download with version support
    console.log('🔍 [WorkflowTab] Unknown file type, downloading');
    const downloadUrl = fileVersionId
      ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
      : `/api/v1/drive/files/${file.id}/download`;
    window.open(downloadUrl, '_blank');
  };

  const filteredAndSortedWorkflows = useMemo(() => {
    let filtered = workflows;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.title?.toLowerCase().includes(query) ||
        w.workflowType?.toLowerCase().includes(query) ||
        w.status?.toLowerCase().includes(query) ||
        w.submitter?.displayName?.toLowerCase().includes(query) ||
        w.submitter?.email?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'type':
          return a.workflowType.localeCompare(b.workflowType);
        default:
          return 0;
      }
    });

    // Filter by selected date
    if (selectedDate) {
      return sorted.filter(w => {
        const workflowDate = new Date(w.createdAt).toDateString();
        return workflowDate === selectedDate;
      });
    }

    return sorted;
  }, [workflows, searchQuery, sortBy, selectedDate]);

  // Group workflows by date for timeline
  const groupedWorkflows = useMemo(() => {
    return workflows.reduce((acc, workflow) => {
      const date = new Date(workflow.createdAt).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(workflow);
      return acc;
    }, {});
  }, [workflows]);

  const sortedDates = Object.keys(groupedWorkflows).sort((a, b) => new Date(b) - new Date(a));

  const formatDate = (date) => {
    if (!date) return '\u2014';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
    return d.toLocaleString();
  };

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

  if (filteredAndSortedWorkflows.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
        {getIcon('ui', 'git_branch', 40)}
        {searchQuery ? t('drive.noWorkflowsFound', 'No workflows found') : t('drive.noWorkflow')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Search and sort controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder={t('drive.searchWorkflows', 'Search workflows...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
            {filteredAndSortedWorkflows.length} {filteredAndSortedWorkflows.length === 1 ? t('drive.workflow') : t('drive.workflows')}
          </span>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                background: 'white',
                fontSize: '0.875rem',
                cursor: 'pointer',
              color: '#374151',
            }}
          >
            {getIcon('ui', 'filter', 16)}
            <span>{t('drive.sort', 'Sort')}</span>
            {getIcon('ui', 'chevron_down', 16)}
          </button>
          {showSortMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.25rem',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              zIndex: 10,
              minWidth: '150px',
            }}>
              {[
                { value: 'date-desc', label: t('drive.sortNewest', 'Newest first') },
                { value: 'date-asc', label: t('drive.sortOldest', 'Oldest first') },
                { value: 'status', label: t('drive.sortStatus', 'Status') },
                { value: 'type', label: t('drive.sortType', 'Type') },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setShowSortMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    background: sortBy === option.value ? '#f3f4f6' : 'transparent',
                    border: 'none',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    color: '#374151',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              background: viewMode === 'grid' ? '#f3f4f6' : 'white',
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            {getIcon('ui', 'grid', 16)}
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              background: viewMode === 'list' ? '#f3f4f6' : 'white',
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            {getIcon('ui', 'list', 16)}
          </button>
        </div>
      </div>

      {/* Status summary */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const statusIcon = getStatusIcon(status);
          const statusStyle = getStatusStyle(status);
          return (
            <div
              key={status}
              title={getStatusDescription(status)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.625rem',
                borderRadius: '0.375rem',
                background: statusStyle.bg,
                border: `1px solid ${statusStyle.borderColor}`,
                fontSize: '0.75rem',
                color: statusStyle.color,
                cursor: 'help',
              }}
            >
              {getIcon('ui', statusIcon, 14)}
              <span style={{ fontWeight: 500 }}>{status}</span>
              <span style={{ fontWeight: 600, opacity: 0.8 }}>({count})</span>
            </div>
          );
        })}
      </div>

      {/* Workflow cards */}
      {viewMode === 'list' ? (
        <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
          {/* Left sidebar - Date timeline */}
          <div style={{
            width: '200px',
            flexShrink: 0,
            borderRight: '1px solid #e5e7eb',
            paddingInlineEnd: '1rem',
            overflowY: 'auto',
            maxHeight: '500px'
          }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getIcon('ui', 'clock', 16)}
              {t('drive.timeline') || 'Timeline'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  padding: '0.5rem',
                  textAlign: 'start',
                  background: !selectedDate ? '#f3f4f6' : 'transparent',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: !selectedDate ? '#111827' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: !selectedDate ? 600 : 400,
                }}
              >
                {t('drive.allActivities') || 'All Workflows'} ({workflows.length})
              </button>
              {sortedDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    padding: '0.5rem',
                    textAlign: 'start',
                    background: selectedDate === date ? '#f3f4f6' : 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: selectedDate === date ? '#111827' : '#6b7280',
                    cursor: 'pointer',
                    fontWeight: selectedDate === date ? 600 : 400,
                  }}
                >
                  {formatDateHeader(date, t)} ({groupedWorkflows[date].length})
                </button>
              ))}
            </div>
          </div>

          {/* Right content - Compact list */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
            {filteredAndSortedWorkflows.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: '#6b7280' }}>
                {getIcon('ui', 'git_branch', 40)}
                {t('drive.noWorkflowsFound')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredAndSortedWorkflows.map((workflow) => {
                  const statusIcon = getStatusIcon(workflow.status);
                  const statusStyle = getStatusStyle(workflow.status);
                  const typeStyle = getWorkflowTypeStyle(workflow.workflowType);

                  return (
                    <div
                      key={workflow.id}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Status icon */}
                      <div style={{
                        flexShrink: 0,
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '9999px',
                        background: statusStyle.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {getIcon('ui', statusIcon, 16)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {workflow.title || t('drive.workflow')}
                          </span>
                          <span
                            style={{
                              padding: '0.125rem 0.375rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              background: typeStyle.bg,
                              color: typeStyle.color,
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {workflow.workflowType?.replace('_', ' ') || 'GENERAL'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {getIcon('ui', 'user', 12)}
                            {workflow.submitter?.displayName || workflow.submitter?.email || '\u2014'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {getIcon('ui', 'calendar', 12)}
                            {getRelativeTime(workflow.createdAt)}
                          </span>
                          {workflow.fileVersionNumber && (
                            <span style={{
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              background: '#e5e7eb',
                              color: '#6b7280',
                            }}>
                              v{workflow.fileVersionNumber}
                            </span>
                          )}
                          {workflow.file && (
                            <button
                              onClick={() => handleViewSnapshot(workflow.file, workflow.fileVersionId)}
                              style={{
                                fontSize: '0.75rem',
                                color: '#2563eb',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              {t('drive.viewSnapshot', 'View snapshot')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1rem',
        }}>
          {filteredAndSortedWorkflows.map((workflow) => {
            const statusIcon = getStatusIcon(workflow.status);
            const StatusIcon = statusIcon;
            const statusStyle = getStatusStyle(workflow.status);
            const typeStyle = getWorkflowTypeStyle(workflow.workflowType);

            return (
              <div
                key={workflow.id}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Top row: Title + Status badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {workflow.title || t('drive.workflow')}
                    </h4>
                  </div>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.borderColor}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getIcon('ui', statusIcon, 14)}
                    {t(`workflow.status.${workflow.status.toLowerCase()}`) || workflow.status}
                  </span>
                </div>

                {/* Second row: Type pill + Reviewer role */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: typeStyle.bg,
                      color: typeStyle.color,
                      textTransform: 'uppercase',
                    }}
                  >
                    {workflow.workflowType?.replace('_', ' ') || 'GENERAL'}
                  </span>
                  {workflow.currentAssignee && (
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {getIcon('ui', 'user', 12)}
                      {t('drive.assignedTo')}: {workflow.currentAssignee.displayName || workflow.currentAssignee.email}
                    </span>
                  )}
                </div>

                {/* Third row: Initiator + Timestamp + Version */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {getIcon('ui', 'user', 14)}
                    {workflow.submitter?.displayName || workflow.submitter?.email || '\u2014'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {getIcon('ui', 'calendar', 14)}
                    {getRelativeTime(workflow.createdAt)}
                  </span>
                  {workflow.fileVersionNumber && (
                    <span style={{
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                      background: '#e5e7eb',
                      color: '#6b7280',
                    }}>
                      v{workflow.fileVersionNumber}
                    </span>
                  )}
                  {workflow.fileVersionAlias && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontStyle: 'italic' }}>
                      {getIcon('ui', 'git_branch', 14)}
                      {workflow.fileVersionAlias}
                    </span>
                  )}
                </div>

                {/* File attachment section */}
                {workflow.file && (
                  <div style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                        {getIcon('ui', 'file_text', 16)}
                        <span style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {workflow.file.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {formatSize(workflow.file.size)}
                        </span>
                        <button
                          onClick={() => handleViewSnapshot(workflow.file, workflow.fileVersionId)}
                          style={{
                            fontSize: '0.75rem',
                            color: '#2563eb',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {t('drive.viewSnapshot', 'View snapshot')}
                          {getIcon('ui', 'external_link', 12)}
                          {workflow.fileVersionNumber && (
                            <span style={{
                              marginLeft: '0.25rem',
                              fontSize: '0.7rem',
                              color: '#6b7280',
                              background: '#e5e7eb',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                            }}>
                              v{workflow.fileVersionNumber}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {workflow.description && (
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {workflow.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
