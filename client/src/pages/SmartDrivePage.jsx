import React, { useState, useMemo, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Input, Button } from '@ui';
import DriveSpacesSidebar from '@components/smart-drive/DriveSpacesSidebar';
import FileRoster from '@components/smart-drive/FileRoster';

export default function SmartDrivePage() {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();

  const [activeSpace, setActiveSpace] = useState('my-drive');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

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

  // Mock data – replace with hook-backed data later
  const allFiles = useMemo(
    () => [
      { id: 1, name: 'Q1 Financial Report.pdf', owner: 'John Doe', location: 'Work Projects', mimeType: 'application/pdf', size: 2_400_000, createdAt: '2026-04-17', space: 'my-drive' },
      { id: 2, name: 'Project Timeline.xlsx', owner: 'Jane Smith', location: 'Work Projects', mimeType: 'application/vnd.ms-excel', size: 156_000, createdAt: '2026-04-12', space: 'my-drive' },
      { id: 3, name: 'Team Photo.jpg', owner: 'Mike Johnson', location: 'Photos 2024', mimeType: 'image/jpeg', size: 4_200_000, createdAt: '2026-04-18', space: 'shared' },
      { id: 4, name: 'Meeting Notes.docx', owner: 'Sarah Wilson', location: 'Personal', mimeType: 'application/msword', size: 45_000, createdAt: '2026-04-16', space: 'my-drive' },
      { id: 5, name: 'Presentation.pptx', owner: 'John Doe', location: 'Work Projects', mimeType: 'application/vnd.ms-powerpoint', size: 8_100_000, createdAt: '2026-04-14', space: 'shared' },
      { id: 6, name: 'Budget 2024.xlsx', owner: 'Jane Smith', location: 'Work Projects', mimeType: 'application/vnd.ms-excel', size: 1_200_000, createdAt: '2026-04-18', space: 'starred' },
      { id: 7, name: 'Intro Video.mp4', owner: 'me', location: 'Personal', mimeType: 'video/mp4', size: 32_000_000, createdAt: '2026-04-15', space: 'my-drive' },
    ],
    []
  );

  const folders = useMemo(
    () => [
      { id: 'f1', name: 'Work Projects', path: '/work' },
      { id: 'f2', name: 'Personal', path: '/personal' },
      { id: 'f3', name: 'Photos 2024', path: '/photos' },
    ],
    []
  );

  const visibleFiles = useMemo(() => {
    if (activeSpace === 'my-drive' || activeSpace === 'recent') return allFiles;
    return allFiles.filter((f) => f.space === activeSpace);
  }, [allFiles, activeSpace]);

  const storageUsage = useMemo(
    () => allFiles.reduce((sum, f) => sum + (f.size || 0), 0),
    [allFiles]
  );
  const storageLimit = 10 * 1024 * 1024 * 1024; // 10 GB mock

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

  const handleFileAction = (action, ids) => {
    // Wire up to real services later
    // eslint-disable-next-line no-console
    console.log('[SmartDrive] action', action, ids);
    if (action === 'delete') handleClearSelection();
  };

  const handleFileOpen = (file) => {
    // eslint-disable-next-line no-console
    console.log('[SmartDrive] open', file);
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
    </div>
  );
}
