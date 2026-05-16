import React, { useState, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Input, Button } from '@ui';
import WorkflowBadge from './WorkflowBadge';

/**
 * FileRoster - Files grid with search, filters, multi-select & row actions.
 * Mirrors the StudentRoster pattern from the QR scanner page for visual consistency.
 */
export default function FileRoster({
  files = [],
  folders = [],
  selectedIds = new Set(),
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onFileOpen,
  onFolderOpen,
  onFileAction,
  onFolderAction,
  onStarFile,
  searchQuery = '',
  onSearchChange,
  viewMode = 'list',
  onViewModeChange,
  isTrashView = false,
  currentUserEmail = null,
}) {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const [hoveredId, setHoveredId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState(null);

  // Helper to format owner name
  const formatOwnerName = (owner) => {
    console.log('[FileRoster] formatOwnerName called with:', {
      owner,
      currentUserEmail,
      hasOwner: !!owner,
      ownerEmail: owner?.email,
      ownerDisplayName: owner?.displayName
    });
    
    if (!owner) {
      console.log('[FileRoster] No owner data, returning "me"');
      return t('me') || 'me';
    }
    
    // Always show displayName if available
    if (owner.displayName) {
      console.log('[FileRoster] Using displayName:', owner.displayName);
      return owner.displayName;
    }
    
    // Fallback to firstName + lastName if displayName not available
    if (owner.firstName || owner.lastName) {
      const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
      console.log('[FileRoster] Using firstName + lastName:', name);
      return name;
    }
    
    // Fallback to email if displayName and name not available
    if (owner.email) {
      const isPlaceholder = owner.email.includes('pending') || owner.email.includes('example.com');
      console.log('[FileRoster] Email check:', { email: owner.email, isPlaceholder });
      if (!isPlaceholder) {
        return owner.email;
      }
    }
    
    console.log('[FileRoster] Returning "Unknown" for owner');
    return t('drive.unknown') || 'Unknown';
  };

  const allSelected = files.length > 0 && selectedIds.size === files.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < files.length;

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => (f.name || '').toLowerCase().includes(q));
  }, [files, searchQuery]);

  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folders;
    const q = searchQuery.toLowerCase();
    return folders.filter((f) => (f.name || '').toLowerCase().includes(q));
  }, [folders, searchQuery]);

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '—';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  };

  const formatDateTime = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  const getFileIconName = (file) => {
    const mt = file.mimeType || '';
    if (mt.startsWith('image/')) return 'image';
    if (mt.startsWith('video/')) return 'video';
    if (mt.startsWith('audio/')) return 'music';
    if (mt.includes('pdf')) return 'file_text';
    if (mt.includes('zip') || mt.includes('rar')) return 'archive';
    if (mt.includes('sheet') || mt.includes('excel')) return 'table';
    if (mt.includes('presentation') || mt.includes('powerpoint')) return 'presentation';
    return 'file';
  };

  const rowBase = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border, #e5e7eb)',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  };

  return (
    <div
      style={{
        background: 'var(--panel, white)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          borderBottom: '1px solid var(--border, #e5e7eb)',
          background: 'var(--panel, white)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '200px' }}>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={t('drive.searchFiles') || 'Search files'}
            prefix={getThemedIcon('ui', 'search', 16, theme)}
          />
        </div>

        {selectedIds.size > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text, #111827)', fontWeight: 600 }}>
              {t('selected_count', { count: selectedIds.size }) || `${selectedIds.size} selected`}
            </span>
            <Button
              variant="outline"
              size="small"
              onClick={() => onFileAction?.('share', Array.from(selectedIds))}
              leftIcon={getThemedIcon('ui', 'send', 14, theme)}
            >
              {t('share') || 'Share'}
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => onFileAction?.('download', Array.from(selectedIds))}
              leftIcon={getThemedIcon('ui', 'download', 14, theme)}
            >
              {t('download') || 'Download'}
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => onFileAction?.('delete', Array.from(selectedIds))}
              leftIcon={getThemedIcon('ui', 'trash', 14, theme)}
              style={{ color: '#dc2626', borderColor: '#fecaca' }}
            >
              {t('delete') || 'Delete'}
            </Button>
            <Button variant="ghost" size="small" onClick={onClearSelection}>
              {t('clear') || 'Clear'}
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              background: 'var(--background-secondary, #f3f4f6)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              padding: '0.25rem',
            }}
          >
            <button
              onClick={() => onViewModeChange?.('list')}
              style={{
                padding: '0.4rem 0.6rem',
                background: viewMode === 'list' ? 'var(--color-primary, #3b82f6)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--text-muted, #6b7280)',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title={t('list_view') || 'List view'}
            >
              {getThemedIcon('ui', 'list', 16, viewMode === 'list' ? 'white' : theme)}
            </button>
            <button
              onClick={() => onViewModeChange?.('grid')}
              style={{
                padding: '0.4rem 0.6rem',
                background: viewMode === 'grid' ? 'var(--color-primary, #3b82f6)' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'var(--text-muted, #6b7280)',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title={t('grid_view') || 'Grid view'}
            >
              {getThemedIcon('ui', 'grid', 16, viewMode === 'grid' ? 'white' : theme)}
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {filteredFolders.length === 0 && filteredFiles.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #6b7280)' }}>
          {searchQuery
            ? t('drive.noMatches') || 'No files match your search.'
            : t('drive.noFiles') || 'No files yet. Upload to get started.'}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (filteredFolders.length > 0 || filteredFiles.length > 0) && (
        <div>
          {/* Header row */}
          <div
            style={{
              ...rowBase,
              background: 'var(--background-secondary, #f9fafb)',
              cursor: 'default',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted, #6b7280)',
            }}
          >
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={(e) => onSelectAll?.(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
              {getThemedIcon('ui', 'star', 14, 'muted')}
            </div>
            <div style={{ flex: 2 }}>{t('drive.name') || 'Name'}</div>
            <div style={{ flex: 1 }}>{t('drive.owner') || 'Owner'}</div>
            <div style={{ flex: 1 }}>{t('drive.location') || 'Location'}</div>
            <div style={{ width: 140, textAlign: 'center' }}>
              {t('drive.status') || 'Status'}
            </div>
            <div style={{ width: 140, textAlign: isRTL ? 'left' : 'right' }}>
              {t('drive.created') || 'Created'}
            </div>
            <div style={{ width: 100, textAlign: isRTL ? 'left' : 'right' }}>
              {t('drive.size') || 'Size'}
            </div>
          </div>

          {filteredFolders.map((folder) => (
            <React.Fragment key={`folder-${folder.id}`}>
              <div
                onMouseEnter={() => setHoveredId(folder.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onFolderOpen?.(folder)}
                style={{
                  ...rowBase,
                  background:
                    hoveredId === folder.id
                      ? 'var(--background-secondary, #f9fafb)'
                      : 'transparent',
                  transition: 'all 0.15s ease',
                  borderLeft: hoveredId === folder.id ? '3px solid var(--color-primary, #3b82f6)' : '3px solid transparent',
                  position: 'relative',
                }}
              >
              <div style={{ width: 16, height: 16 }} />
              <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStarFile?.(folder.id, 'folder');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 6,
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={folder.starred ? t('drive.unstar') || 'Unstar' : t('drive.star') || 'Star'}
                >
                  {folder.starred 
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    : getThemedIcon('ui', 'star', 16, 'muted')
                  }
                </button>
              </div>
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '0.5rem',
                    background: 'var(--color-primary-tint, #eff6ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {getThemedIcon('ui', 'folder', 20, theme)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--text, #111827)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {folder.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                    {t('drive.folder') || 'Folder'}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary, #374151)' }}>
                {formatOwnerName(folder.owner)}
              </div>
              <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary, #374151)' }}>
                {folder.path || '—'}
              </div>
              <div
                style={{
                  width: 120,
                  textAlign: isRTL ? 'left' : 'right',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted, #6b7280)',
                }}
              >
                —
              </div>
              <div
                style={{
                  width: 140,
                  textAlign: isRTL ? 'left' : 'right',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted, #6b7280)',
                }}
              >
                {formatDateTime(folder.createdAt)}
              </div>
              <div
                style={{
                  width: 100,
                  textAlign: isRTL ? 'left' : 'right',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted, #6b7280)',
                }}
              >
                —
              </div>
              <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenFolderMenuId(openFolderMenuId === folder.id ? null : folder.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 8,
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('drive.more') || 'More'}
                >
                  {getThemedIcon('ui', 'more-vertical', 16, 'muted')}
                </button>
              </div>
            </div>
            {openFolderMenuId === folder.id && (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setOpenFolderMenuId(null)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.1)',
                    zIndex: 9,
                  }}
                />
                {/* Modal */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    [isRTL ? 'left' : 'right']: 0,
                    marginTop: 4,
                    background: 'var(--panel, white)',
                    border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
                    minWidth: 200,
                    zIndex: 10,
                    padding: '0.5rem',
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderBottom: '1px solid var(--border, #e5e7eb)',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text, #111827)',
                      }}
                    >
                      {t('drive.actions') || 'Actions'}
                    </div>
                    <button
                      onClick={() => setOpenFolderMenuId(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted, #6b7280)',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {getThemedIcon('ui', 'x', 16, theme)}
                    </button>
                  </div>
                  {/* Actions */}
                  {[
                    ...(isTrashView
                      ? [
                          { key: 'restore', label: t('drive.restore') || 'Restore', icon: 'refresh_ccw', color: '#059669' },
                          { key: 'permanent-delete', label: t('drive.permanentDelete') || 'Delete permanently', icon: 'trash', danger: true },
                        ]
                      : [
                          { key: 'open', label: t('open') || 'Open', icon: 'external_link' },
                          { key: 'download', label: t('download') || 'Download', icon: 'download' },
                          { key: 'share', label: t('share') || 'Share', icon: 'send' },
                          { key: 'rename', label: t('rename') || 'Rename', icon: 'edit' },
                          { key: 'delete', label: t('delete') || 'Delete', icon: 'trash', danger: true },
                        ]),
                  ].map((action) => (
                    <button
                      key={action.key}
                      onClick={() => {
                        setOpenFolderMenuId(null);
                        if (action.key === 'open') {
                          onFolderOpen?.(folder);
                        } else {
                          onFolderAction?.(folder, action.key);
                        }
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: action.danger ? '#dc2626' : action.color || 'var(--text, #111827)',
                        textAlign: isRTL ? 'right' : 'left',
                        transition: 'all 0.15s ease',
                        minHeight: '44px',
                      }}
                      className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = action.danger 
                          ? 'rgba(220, 38, 38, 0.05)' 
                          : 'var(--background-secondary, #f3f4f6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {getThemedIcon('ui', action.icon, 16, action.danger ? 'error' : theme)}
                      {action.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            </React.Fragment>
          ))}

          {filteredFiles.map((file) => {
            const selected = selectedIds.has(file.id);
            const hovered = hoveredId === file.id;
            return (
              <div
                key={file.id}
                onMouseEnter={() => setHoveredId(file.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onFileOpen?.(file)}
                style={{
                  ...rowBase,
                  background: selected
                    ? 'var(--color-primary-tint, #eff6ff)'
                    : hovered
                    ? 'var(--background-secondary, #f9fafb)'
                    : 'transparent',
                  transition: 'all 0.15s ease',
                  borderLeft: hovered ? '3px solid var(--color-primary, #3b82f6)' : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => onToggleSelect?.(file.id)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStarFile?.(file.id, 'file');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 6,
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={file.starred ? t('drive.unstar') || 'Unstar' : t('drive.star') || 'Star'}
                  >
                    {file.starred 
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      : getThemedIcon('ui', 'star', 16, 'muted')
                    }
                  </button>
                </div>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '0.5rem',
                      background: 'var(--color-primary-tint, #eff6ff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getThemedIcon('ui', getFileIconName(file), 18, theme)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--text, #111827)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.name}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary, #374151)' }}>
                  {formatOwnerName(file.owner)}
                </div>
                <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary, #374151)' }}>
                  {file.location || '—'}
                </div>
                <div
                  style={{
                    width: 140, // Increased width for better badge display
                    textAlign: 'center', // Center align for better visual balance
                    fontSize: '0.875rem',
                    color: 'var(--text-muted, #6b7280)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center', // Center the badge
                  }}
                >
                  {file.workflowStatus && file.workflowStatus !== 'none' ? (
                    <WorkflowBadge
                      status={file.workflowStatus}
                      currentStage={file.workflowStageName}
                      compact
                    />
                  ) : (
                    <span style={{ 
                      color: 'var(--text-muted, #6b7280)',
                      fontSize: '0.8125rem',
                      fontWeight: 500
                    }}>
                      {t('drive.ready') || 'Ready'}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    width: 140,
                    textAlign: isRTL ? 'left' : 'right',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted, #6b7280)',
                  }}
                >
                  {formatDateTime(file.createdAt)}
                </div>
                <div
                  style={{
                    width: 100,
                    textAlign: isRTL ? 'left' : 'right',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted, #6b7280)',
                  }}
                >
                  {formatSize(file.size)}
                </div>
                <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === file.id ? null : file.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 8,
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      color: 'var(--text-secondary, #374151)',
                    }}
                    className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    title={t('more_actions') || 'More actions'}
                    aria-label={t('more_actions') || 'More actions'}
                  >
                    {getThemedIcon('ui', 'more_vertical', 16, theme)}
                  </button>
                  {openMenuId === file.id && (
                    <>
                      {/* Backdrop */}
                      <div
                        onClick={() => setOpenMenuId(null)}
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0, 0, 0, 0.1)',
                          zIndex: 9,
                        }}
                      />
                      {/* Modal */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          [isRTL ? 'left' : 'right']: 0,
                          marginTop: 4,
                          background: 'var(--panel, white)',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: '0.75rem',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
                          minWidth: 200,
                          zIndex: 10,
                          padding: '0.5rem',
                          animation: 'fadeIn 0.15s ease-out',
                        }}
                      >
                        {/* Header */}
                        <div
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderBottom: '1px solid var(--border, #e5e7eb)',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: 'var(--text, #111827)',
                            }}
                          >
                            {t('drive.actions') || 'Actions'}
                          </div>
                          <button
                            onClick={() => setOpenMenuId(null)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: '0.25rem',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted, #6b7280)',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)')
                            }
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            {getThemedIcon('ui', 'x', 16, theme)}
                          </button>
                        </div>
                        {/* Actions */}
                        {[
                          ...(isTrashView
                            ? [
                                { key: 'restore', label: t('drive.restore') || 'Restore', icon: 'refresh_ccw', color: '#059669' },
                                { key: 'permanent-delete', label: t('drive.permanentDelete') || 'Delete permanently', icon: 'trash', danger: true },
                              ]
                            : [
                                { key: 'open', label: t('open') || 'Open', icon: 'external_link' },
                                { key: 'download', label: t('download') || 'Download', icon: 'download' },
                                { key: 'share', label: t('share') || 'Share', icon: 'send' },
                                { key: 'rename', label: t('rename') || 'Rename', icon: 'edit' },
                                { key: 'delete', label: t('delete') || 'Delete', icon: 'trash', danger: true },
                              ]),
                        ].map((action) => (
                          <button
                            key={action.key}
                            onClick={() => {
                              setOpenMenuId(null);
                              onFileAction?.(action.key, [file.id]);
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: action.danger ? '#dc2626' : action.color || 'var(--text, #111827)',
                              textAlign: isRTL ? 'right' : 'left',
                              transition: 'all 0.15s ease',
                              minHeight: '44px',
                            }}
                            className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = action.danger 
                                ? 'rgba(220, 38, 38, 0.05)' 
                                : 'var(--background-secondary, #f3f4f6)';
                              e.currentTarget.style.transform = 'translateX(2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <div style={{ fontSize: '16px' }}>
                              {getThemedIcon('ui', action.icon, 16, theme)}
                            </div>
                            <span>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && (filteredFolders.length > 0 || filteredFiles.length > 0) && (
        <div
          style={{
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredFolders.map((folder) => (
            <div
              key={`folder-${folder.id}`}
              onClick={() => onFolderOpen?.(folder)}
              style={{
                position: 'relative',
                background: 'var(--panel, white)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '0.75rem',
                padding: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: '0.5rem',
                  background: 'var(--color-primary-tint, #eff6ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                {getThemedIcon('ui', 'folder', 36, theme)}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text, #111827)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={folder.name}
              >
                {folder.name}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #6b7280)',
                  marginTop: 2,
                }}
              >
                {t('drive.folder') || 'Folder'}
              </div>
            </div>
          ))}

          {filteredFiles.map((file) => {
            const selected = selectedIds.has(file.id);
            return (
              <div
                key={file.id}
                onClick={() => onFileOpen?.(file)}
                style={{
                  position: 'relative',
                  background: 'var(--panel, white)',
                  border: `1px solid ${selected ? 'var(--color-primary, #3b82f6)' : 'var(--border, #e5e7eb)'}`,
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: selected ? '0 0 0 2px var(--color-primary, #3b82f6)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!selected) e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                }}
                onMouseLeave={(e) => {
                  if (!selected) e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
                }}
              >
                <div
                  style={{ position: 'absolute', top: 8, [isRTL ? 'right' : 'left']: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect?.(file.id)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                </div>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: '0.5rem',
                    background: 'var(--background-secondary, #f3f4f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  {getThemedIcon('ui', getFileIconName(file), 36, theme)}
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text, #111827)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={file.name}
                >
                  {file.name}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted, #6b7280)',
                    marginTop: 2,
                  }}
                >
                  <span>{formatSize(file.size)}</span>
                  <span>{formatDate(file.createdAt || file.modifiedAt)}</span>
                </div>
                {file.workflowStatus && file.workflowStatus !== 'none' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <WorkflowBadge
                      status={file.workflowStatus}
                      currentStage={file.workflowStageName}
                      compact
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
