import React, { useState, useMemo, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Input, Button } from '@ui';
import DriveSpacesSidebar from '@components/smart-drive/DriveSpacesSidebar';
import FileRoster from '@components/smart-drive/FileRoster';
import InboxDrawer from '@components/smart-drive/InboxDrawer';
import useDriveFiles from '@hooks/useDriveFiles';
import useWorkflowTasks from '@hooks/useWorkflowTasks';

export default function SmartDrivePage() {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();

  const [activeSpace, setActiveSpace] = useState('my-drive');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  // Real data hooks
  const {
    files: allFiles,
    folders,
    loading: filesLoading,
    error: filesError,
    refreshFiles,
    starFile,
    trashFile,
    restoreFile,
    permanentDeleteFile,
    downloadFile,
    shareFile,
    createPublicLink,
  } = useDriveFiles(activeSpace);

  const {
    tasks: workflowTasks,
    unreadCount,
    approveTask,
    rejectTask,
  } = useWorkflowTasks();

  useEffect(() => {
    let timeoutId;
    const onResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsMobile(window.innerWidth <= 768), 120);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Compute storage usage from real files
  const storageUsage = useMemo(
    () => (allFiles || []).reduce((sum, f) => sum + (f.size || 0), 0),
    [allFiles]
  );
  const storageLimit = 10 * 1024 * 1024 * 1024; // 10 GB

  const visibleFiles = useMemo(() => {
    return allFiles || [];
  }, [allFiles]);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? new Set(visibleFiles.map((f) => f.id)) : new Set());
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const handleFileAction = async (action, ids) => {
    const idArray = Array.from(ids);
    if (action === 'star') {
      await Promise.all(idArray.map((id) => starFile(id)));
    } else if (action === 'delete' || action === 'trash') {
      await Promise.all(idArray.map((id) => trashFile(id)));
      handleClearSelection();
    } else if (action === 'restore') {
      await Promise.all(idArray.map((id) => restoreFile(id)));
      handleClearSelection();
    } else if (action === 'permanent-delete') {
      await Promise.all(idArray.map((id) => permanentDeleteFile(id)));
      handleClearSelection();
    } else if (action === 'download' && idArray.length === 1) {
      await downloadFile(idArray[0]);
    } else if (action === 'new-folder') {
      // eslint-disable-next-line no-console
      console.log('[SmartDrive] new folder - implement modal');
    }
  };

  const handleFileOpen = (file) => {
    // Open file preview or download
    downloadFile(file.id);
  };

  const handleUpload = () => {
    // eslint-disable-next-line no-console
    console.log('[SmartDrive] upload clicked');
  };

  const gradientBtn = {
    padding: '0.65rem 1rem',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <div
      className="qr-scanner-container"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        background: 'var(--background-secondary, #f9fafb)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          background: 'var(--panel, white)',
          borderBottom: '1px solid var(--border, #e5e7eb)',
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '1600px',
            margin: '0 auto',
            flexWrap: 'wrap',
          }}
        >
          {/* Title / Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '0 0 auto' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              {getThemedIcon('ui', 'hard_drive', 20, 'white')}
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: 700,
                  color: 'var(--text, #111827)',
                }}
              >
                {t('drive.title') || 'Smart Drive'}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #6b7280)',
                }}
              >
                {t('drive.subtitle') || 'Secure file storage & sharing'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: '220px', maxWidth: '560px' }}>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('drive.searchInDrive') || 'Search in Drive'}
              prefix={getThemedIcon('ui', 'search', 16, theme)}
            />
          </div>

          <div style={{ flex: '1', minWidth: '1rem' }} />

          {/* Sidebar collapse toggle */}
          {!isMobile && (
            <button
              onClick={() => setSidebarMinimized((v) => !v)}
              title={sidebarMinimized ? t('expand') || 'Expand' : t('collapse') || 'Collapse'}
              style={{
                padding: '0.5rem',
                background: 'var(--background-secondary, #f3f4f6)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getThemedIcon('ui', sidebarMinimized ? 'chevron_right' : 'chevron_left', 16, theme)}
            </button>
          )}

          {/* Inbox/Notifications */}
          <button
            onClick={() => setInboxOpen(true)}
            style={{
              position: 'relative',
              padding: '0.65rem',
              background: 'var(--background-secondary, #f3f4f6)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={t('Pending Approvals')}
          >
            {getThemedIcon('ui', 'bell', 20, theme)}
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  borderRadius: '999px',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Action buttons */}
          <button
            onClick={handleUpload}
            style={{
              ...gradientBtn,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.25)';
            }}
          >
            {getThemedIcon('ui', 'upload', 16, 'white')}
            {t('drive.upload') || 'Upload'}
          </button>

          <button
            onClick={() => handleFileAction('new-folder', [])}
            style={{
              ...gradientBtn,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              boxShadow: '0 2px 4px rgba(139, 92, 246, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.25)';
            }}
          >
            {getThemedIcon('ui', 'folder', 16, 'white')}
            {t('drive.newFolder') || 'New Folder'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div
        style={{
          padding: isMobile ? '0.75rem' : '1.5rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1.5rem',
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            width: isMobile ? '100%' : sidebarMinimized ? '72px' : '20%',
            flexShrink: 0,
            transition: 'width 0.3s ease',
          }}
        >
          <DriveSpacesSidebar
            activeSpace={activeSpace}
            onSpaceChange={setActiveSpace}
            storageUsage={storageUsage}
            storageLimit={storageLimit}
            folders={folders}
            onFolderSelect={(folder) => console.log('[SmartDrive] folder', folder)}
            onUploadClick={handleUpload}
            isMinimized={!isMobile && sidebarMinimized}
          />
        </aside>

        {/* Main */}
        <main
          style={{
            width: isMobile
              ? '100%'
              : sidebarMinimized
              ? 'calc(100% - 72px - 1.5rem)'
              : '80%',
            transition: 'width 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Filter chips bar */}
          <div
            style={{
              background: 'var(--panel, white)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted, #6b7280)',
                marginInlineEnd: '0.5rem',
              }}
            >
              {t('filters') || 'Filters'}:
            </span>
            {[
              { key: 'type', label: t('drive.type') || 'Type' },
              { key: 'people', label: t('drive.people') || 'People' },
              { key: 'modified', label: t('drive.modified') || 'Modified' },
              { key: 'location', label: t('drive.location') || 'Location' },
            ].map((chip) => (
              <button
                key={chip.key}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: 'var(--background-secondary, #f3f4f6)',
                  color: 'var(--text-secondary, #374151)',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '999px',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {chip.label}
                {getThemedIcon('ui', 'chevron_down', 12, theme)}
              </button>
            ))}
          </div>

          {/* Files Roster */}
          <FileRoster
            files={visibleFiles}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onFileOpen={handleFileOpen}
            onFileAction={handleFileAction}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </main>
      </div>

      {/* Inbox Drawer */}
      <InboxDrawer
        isOpen={inboxOpen}
        onClose={() => setInboxOpen(false)}
        tasks={workflowTasks}
        onApprove={approveTask}
        onReject={rejectTask}
      />
    </div>
  );
}
