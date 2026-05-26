import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Input, Button, Checkbox } from '@ui';
import StatusColumn from './StatusColumn';

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
  onEmptyTrash,
  filterStarred = false,
}) {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const [hoveredId, setHoveredId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState(null);
  const [showFolders, setShowFolders] = useState(true);
  const [showVersion, setShowVersion] = useState(false);
  const [showSize, setShowSize] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [menuPositionAbove, setMenuPositionAbove] = useState(false);
  const folderMenuRef = useRef(null);
  const fileMenuRef = useRef(null);

  // Calculate menu position to prevent cut-off at bottom
  useEffect(() => {
    const activeMenuRef = openFolderMenuId ? folderMenuRef : openMenuId ? fileMenuRef : null;
    if (!activeMenuRef?.current) return;

    const menu = activeMenuRef.current;
    const rect = menu.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - rect.bottom;
    const menuHeight = rect.height;

    // Always position below to prevent clipping at top
    setMenuPositionAbove(false);
  }, [openFolderMenuId, openMenuId]);

  // Helper to format owner name
  const formatOwnerName = (owner) => {
    if (!owner) {
      return t('drive.unknown') || 'Unknown';
    }

    // Always show displayName if available
    if (owner.displayName) {
      return owner.displayName;
    }

    // Fallback to firstName + lastName if displayName not available
    if (owner.firstName || owner.lastName) {
      const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
      return name;
    }

    // Fallback to email if displayName and name not available
    if (owner.email) {
      const isPlaceholder = owner.email.includes('pending') || owner.email.includes('example.com');
      if (!isPlaceholder) {
        return owner.email;
      }
    }

    return t('drive.unknown') || 'Unknown';
  };

  // Helper to get user-friendly text for delete reason
  const getDeleteReasonText = (reason) => {
    const reasonMap = {
      'FILE_SHARED': t('drive.deleteReasonShared') || 'File is shared with others',
      'WORKFLOW_ACTIVE': t('drive.deleteReasonWorkflow') || 'File has an active workflow',
      'WORKFLOW_NOT_OWNER': t('drive.deleteReasonWorkflowOwner') || 'Only workflow owner can delete',
      'NOT_OWNER': t('drive.deleteReasonNotOwner') || 'You are not the owner',
      'FILE_NOT_FOUND': t('drive.deleteReasonNotFound') || 'File not found',
    };
    return reasonMap[reason] || t('drive.deleteReasonUnknown') || 'Cannot delete this file';
  };

  const allItems = [...folders, ...files];
  const allSelected = allItems.length > 0 && selectedIds.size === allItems.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < allItems.length;

  const filteredFiles = useMemo(() => {
    let result = files;
    if (filterStarred) {
      result = result.filter((f) => f.starred);
    }
    if (!searchQuery) return result;
    const q = searchQuery.toLowerCase();
    return result.filter((f) => (f.name || '').toLowerCase().includes(q));
  }, [files, searchQuery, filterStarred]);

  const filteredFolders = useMemo(() => {
    if (!showFolders) return [];
    let result = folders;
    if (filterStarred) {
      result = result.filter((f) => f.starred);
    }
    if (!searchQuery) return result;
    const q = searchQuery.toLowerCase();
    return result.filter((f) => (f.name || '').toLowerCase().includes(q));
  }, [folders, searchQuery, showFolders, filterStarred]);

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
    const dateStr = d.toLocaleDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}\n${timeStr}`;
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
    if (mt.includes('word') || mt.includes('document')) return 'file_text';
    return 'file';
  };

  const isPreviewable = (file) => {
    if (!file || file.path !== undefined) return false; // Not a file
    const mt = file.mimeType || '';
    const name = file.name || '';
    // Images
    if (mt.startsWith('image/')) return true;
    // Videos
    if (mt.startsWith('video/')) return true;
    // PDF
    if (mt.includes('pdf') || name.endsWith('.pdf')) return true;
    // Word documents
    if (mt.includes('word') || mt.includes('document') || name.endsWith('.doc') || name.endsWith('.docx')) return true;
    // PowerPoint
    if (mt.includes('presentation') || mt.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) return true;
    // Excel
    if (mt.includes('sheet') || mt.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return true;
    // Archives (ZIP, RAR) - NOT previewable
    if (mt.includes('zip') || mt.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar')) return false;
    return false;
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
        overflow: 'visible',
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

        {isTrashView && folders.length === 0 && files.length > 0 && (
          <button
            onClick={onEmptyTrash}
            style={{
              padding: '0.4rem 0.75rem',
              background: 'rgba(220,38,38,0.08)',
              color: '#dc2626',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            {getThemedIcon('ui', 'trash', 14, 'error')}
            {t('drive.emptyTrash') || 'Empty trash'}
          </button>
        )}

        {selectedIds.size > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text, #111827)', fontWeight: 600 }}>
              {selectedIds.size} {t('selected') || 'selected'}
            </span>
            <Button
              variant="outline"
              size="small"
              onClick={() => {
                const selectedItems = Array.from(selectedIds).map(id => {
                  const folder = folders.find(f => f.id === id);
                  const file = files.find(f => f.id === id);
                  return folder || file;
                }).filter(Boolean);
                onFileAction?.('share', selectedItems);
              }}
              leftIcon={getThemedIcon('ui', 'send', 14, theme)}
            >
              {t('share') || 'Share'}
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => {
                const selectedItems = Array.from(selectedIds).map(id => {
                  const folder = folders.find(f => f.id === id);
                  const file = files.find(f => f.id === id);
                  return folder || file;
                }).filter(Boolean);
                onFileAction?.('download', selectedItems);
              }}
              leftIcon={getThemedIcon('ui', 'download', 14, theme)}
            >
              {t('download') || 'Download'}
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => {
                const selectedItems = Array.from(selectedIds).map(id => {
                  const folder = folders.find(f => f.id === id);
                  const file = files.find(f => f.id === id);
                  return folder || file;
                }).filter(Boolean);
                onFileAction?.('delete', selectedItems);
              }}
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowFolders(!showFolders)}
              style={{
                padding: '0.4rem 0.75rem',
                background: showFolders ? 'var(--color-primary, #3b82f6)' : 'transparent',
                color: showFolders ? 'white' : 'var(--text-muted, #6b7280)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            >
              {getThemedIcon('ui', 'folder', 14, showFolders ? 'white' : 'muted')}
              {showFolders ? (t('drive.folders') || 'Folders') : (t('drive.folders') || 'Folders')}
            </button>
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
          </div>
        )}
      </div>

      {/* Empty state */}
      {filteredFolders.length === 0 && filteredFiles.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #6b7280)' }}>
          {searchQuery
            ? t('drive.noMatches') || 'No matches found.'
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
            <Checkbox
              checked={allSelected}
              onChange={(checked) => onSelectAll?.(checked)}
              style={{ width: 16, height: 16 }}
            />
            <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
              {getThemedIcon('ui', 'star', 14, 'muted')}
            </div>
            <div style={{ flex: 1.2, textAlign: isRTL ? 'right' : 'left', paddingRight: isRTL ? 0 : '0.5rem', paddingLeft: isRTL ? '0.5rem' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>{t('drive.name') || 'Name'}</span>
                <button
                  onClick={() => setShowFolders(!showFolders)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: showFolders ? 1 : 0.4,
                  }}
                >
                  {getThemedIcon('ui', showFolders ? 'folder' : 'folder_open', 14, showFolders ? 'primary' : 'muted')}
                </button>
              </div>
            </div>
            <div style={{ width: 60, textAlign: isRTL ? 'left' : 'right', paddingRight: isRTL ? 0 : '0.5rem', paddingLeft: isRTL ? '0.5rem' : 0 }}>
              {t('drive.status') || 'Status'}
            </div>
            <button
              onClick={() => setShowOwner(!showOwner)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                opacity: showOwner ? 1 : 0.4,
              }}
            >
              {getThemedIcon('ui', 'user', 14, showOwner ? 'primary' : 'muted')}
            </button>
            <div style={{ width: 80, textAlign: isRTL ? 'left' : 'right', paddingRight: isRTL ? 0 : '0.5rem', paddingLeft: isRTL ? '0.5rem' : 0 }}>
              {t('drive.created') || 'Created'}
            </div>
            <button
              onClick={() => setShowSize(!showSize)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                opacity: showSize ? 1 : 0.4,
              }}
            >
              {getThemedIcon('ui', 'hard_drive', 14, showSize ? 'primary' : 'muted')}
            </button>
            <button
              onClick={() => setShowVersion(!showVersion)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                opacity: showVersion ? 1 : 0.4,
              }}
            >
              {getThemedIcon('ui', 'tag', 14, showVersion ? 'primary' : 'muted')}
            </button>
            <div style={{ width: 40 }}></div>
          </div>

          {showFolders && filteredFolders.length > 0 && (
            <div
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted, #6b7280)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'var(--background-secondary, #f9fafb)',
                borderBottom: '1px solid var(--border, #e5e7eb)',
              }}
            >
              {filteredFolders.length} {t('drive.folders') || 'folders'}
            </div>
          )}

          {showFolders && filteredFolders.map((folder) => (
            <React.Fragment key={`folder-${folder.id}`}>
              <div
                onMouseEnter={() => setHoveredId(folder.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  if (openFolderMenuId === null && openMenuId === null) {
                    // Don't open folder if clicking on checkbox or its wrapper
                    if (!e.target.closest('input[type="checkbox"]') && 
                        !e.target.closest('.checkboxContainer') && 
                        !e.target.closest('label[class*="wrapper"]')) {
                      onFolderOpen?.(folder);
                    }
                  }
                }}
                style={{
                  ...rowBase,
                  background:
                    hoveredId === folder.id
                      ? 'var(--background-secondary, #f9fafb)'
                      : 'transparent',
                  transition: 'all 0.15s ease',
                  borderLeft: hoveredId === folder.id ? '3px solid var(--color-primary, #3b82f6)' : '3px solid transparent',
                  position: 'relative',
                  cursor: openFolderMenuId !== null || openMenuId !== null ? 'default' : 'pointer',
                }}
              >
              <Checkbox
                checked={selectedIds.has(folder.id)}
                onChange={() => onToggleSelect?.(folder.id)}
                onClick={(e) => e.stopPropagation()}
                style={{ width: 16, height: 16 }}
              />
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
              <div style={{ flex: 1.2, display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, paddingRight: isRTL ? 0 : '0.5rem', paddingLeft: isRTL ? '0.5rem' : 0 }}>
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
                    {folder.name.length > 80 ? `${folder.name.substring(0, 80)}...` : folder.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                    {t('drive.folder') || 'Folder'}
                  </div>
                </div>
              </div>
              <div style={{ width: 60, paddingRight: isRTL ? 0 : '0.5rem', paddingLeft: isRTL ? '0.5rem' : 0 }}>
                —
              </div>
              {showOwner && (
                <div style={{ width: 100, fontSize: '0.875rem', color: 'var(--text-secondary, #374151)', paddingRight: isRTL ? 0 : '0.5rem', paddingLeft: isRTL ? '0.5rem' : 0 }}>
                  {formatOwnerName(folder.owner)}
                </div>
              )}
              <div
                style={{
                  width: 80,
                  textAlign: isRTL ? 'left' : 'right',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted, #6b7280)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isRTL ? 'flex-start' : 'flex-end',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.2,
                  paddingRight: isRTL ? 0 : '0.5rem',
                  paddingLeft: isRTL ? '0.5rem' : 0,
                }}
              >
                {formatDateTime(folder.createdAt)}
              </div>
              {showSize && (
                <div
                  style={{
                    width: 70,
                    textAlign: isRTL ? 'left' : 'right',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted, #6b7280)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isRTL ? 'flex-start' : 'flex-end',
                    paddingRight: isRTL ? 0 : '0.5rem',
                    paddingLeft: isRTL ? '0.5rem' : 0,
                  }}
                >
                  —
                </div>
              )}
              {showVersion && (
                <div style={{ width: 60, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  —
                </div>
              )}
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
                  {getThemedIcon('ui', 'more_vertical', 16, 'muted')}
                </button>
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
                      zIndex: 999998,
                    }}
                  />
                  {/* Modal */}
                  <div
                    ref={folderMenuRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      ...(menuPositionAbove ? { bottom: '100%', marginBottom: 4 } : { top: '100%', marginTop: 4 }),
                      [isRTL ? 'left' : 'right']: 0,
                      background: 'var(--panel, white)',
                      border: '1px solid var(--border, #e5e7eb)',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
                      minWidth: 240,
                      zIndex: 999999,
                      padding: 0,
                      animation: 'fadeIn 0.15s ease-out',
                    }}
                  >
                  {/* Actions */}
                  <div style={{ padding: '0.5rem' }}>
                  {[
                    ...(isTrashView
                      ? [
                          { key: 'restore', label: t('drive.restore') || 'Restore', icon: 'info', color: '#059669' },
                          { key: 'permanent-delete', label: t('drive.permanentDelete') || 'Delete permanently', icon: 'trash', danger: true },
                        ]
                      : [
                          { key: 'open', label: t('drive.open') || 'Open', icon: 'external_link' },
                          { key: 'download', label: t('drive.download') || 'Download', icon: 'download' },
                          { key: 'rename', label: t('drive.rename') || 'Rename', icon: 'edit' },
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
                      {getThemedIcon('ui', action.icon, 16, action.danger ? '#dc2626' : action.color || theme)}
                      {action.label}
                    </button>
                  ))}
                  </div>
                  </div>
              </>
            )}
              </div>
            </React.Fragment>
          ))}

          {filteredFolders.length > 0 && filteredFiles.length > 0 && (
            <div
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted, #6b7280)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'var(--background-secondary, #f9fafb)',
                borderBottom: '1px solid var(--border, #e5e7eb)',
              }}
            >
              {filteredFiles.length} {t('drive.files') || 'files'}
            </div>
          )}

          {filteredFiles.map((file) => {
            const selected = selectedIds.has(file.id);
            const hovered = hoveredId === file.id;
            return (
              <div
                key={file.id}
                onMouseEnter={() => setHoveredId(file.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  if (openMenuId === null && openFolderMenuId === null) {
                    // Don't open file if clicking on checkbox or its wrapper
                    if (!e.target.closest('input[type="checkbox"]') && 
                        !e.target.closest('.checkboxContainer') && 
                        !e.target.closest('label[class*="wrapper"]')) {
                      onFileOpen?.(file);
                    }
                  }
                }}
                  style={{
                    ...rowBase,
                    background: selected
                      ? 'var(--color-primary-tint, #eff6ff)'
                      : hovered
                      ? 'var(--background-secondary, #f9fafb)'
                      : 'transparent',
                    transition: 'all 0.15s ease',
                    borderLeft: hovered ? '3px solid var(--color-primary, #3b82f6)' : '3px solid transparent',
                    cursor: openMenuId !== null || openFolderMenuId !== null ? 'default' : 'pointer',
                    position: 'relative',
                  }}
              >
                <Checkbox
                  checked={selected}
                  onChange={() => onToggleSelect?.(file.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: 16, height: 16 }}
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
                <div style={{ flex: 1.2, display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, paddingRight: isRTL ? 0 : '0.5rem', paddingLeft: isRTL ? '0.5rem' : 0 }}>
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
                      position: 'relative',
                    }}
                  >
                    {getThemedIcon('ui', getFileIconName(file), 18, theme)}
                    {file.canDelete === false && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          background: 'var(--panel, white)',
                          borderRadius: '50%',
                          padding: 2,
                          border: '1px solid var(--border, #e5e7eb)',
                        }}
                        title={getDeleteReasonText(file.deleteReason)}
                      >
                        {getThemedIcon('ui', 'lock', 10, 'muted')}
                      </div>
                    )}
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
                      {file.name.length > 80 ? `${file.name.substring(0, 80)}...` : file.name}
                    </div>
                  </div>
                </div>
                <div style={{ width: 60, paddingRight: isRTL ? 0 : '0.5rem', paddingLeft: isRTL ? '0.5rem' : 0 }}>
                  <StatusColumn file={file} onClick={() => onFileOpen?.(file)} />
                </div>
                {showOwner && (
                  <div style={{ width: 100, fontSize: '0.875rem', color: 'var(--text-secondary, #374151)', paddingRight: isRTL ? 0 : '0.5rem', paddingLeft: isRTL ? '0.5rem' : 0 }}>
                    {formatOwnerName(file.owner)}
                  </div>
                )}
                <div
                  style={{
                    width: 80,
                    textAlign: isRTL ? 'left' : 'right',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted, #6b7280)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isRTL ? 'flex-start' : 'flex-end',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.2,
                    paddingRight: isRTL ? 0 : '0.5rem',
                    paddingLeft: isRTL ? '0.5rem' : 0,
                  }}
                >
                  {formatDateTime(file.createdAt)}
                </div>
                {showSize && (
                  <div
                    style={{
                      width: 70,
                      textAlign: isRTL ? 'left' : 'right',
                      fontSize: '0.875rem',
                      color: 'var(--text-muted, #6b7280)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isRTL ? 'flex-start' : 'flex-end',
                      paddingRight: isRTL ? 0 : '0.5rem',
                      paddingLeft: isRTL ? '0.5rem' : 0,
                    }}
                  >
                    {formatSize(file.size)}
                  </div>
                )}
                {showVersion && (
                  <div style={{ width: 60, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {file.version ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.125rem 0.5rem',
                        background: 'var(--color-primary-tint, #eff6ff)',
                        color: 'var(--color-primary, #3b82f6)',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}>
                        {getThemedIcon('ui', 'tag', 12, 'primary')}
                        {file.version}
                      </div>
                    ) : '—'}
                  </div>
                )}
                <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('[FileRoster] Opening file menu for:', file.id, 'isTrashView:', isTrashView);
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
                          zIndex: 999998,
                        }}
                      />
                      {/* Modal */}
                      <div
                        ref={fileMenuRef}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          ...(menuPositionAbove ? { bottom: '100%', marginBottom: 4 } : { top: '100%', marginTop: 4 }),
                          [isRTL ? 'left' : 'right']: 0,
                          background: 'var(--panel, white)',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: '0.75rem',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
                          minWidth: 240,
                          zIndex: 999999,
                          padding: 0,
                          animation: 'fadeIn 0.15s ease-out',
                        }}
                      >
                      {/* Actions */}
                      <div style={{ padding: '0.5rem' }}>
                        {[
                          ...(isTrashView
                            ? [
                                { key: 'restore', label: t('drive.restore') || 'Restore', icon: 'info', color: '#059669' },
                                { key: 'permanent-delete', label: t('drive.permanentDelete') || 'Delete permanently', icon: 'trash', danger: true },
                              ]
                            : [
                                ...(isPreviewable(file) ? [{ key: 'open', label: t('drive.open') || 'Open', icon: 'external_link' }] : []),
                                { key: 'download', label: t('drive.download') || 'Download', icon: 'download' },
                                { key: 'share', label: t('drive.share') || 'Share', icon: 'send' },
                                { key: 'create-workflow', label: t('drive.workflow') || 'Workflow', icon: 'workflow', color: '#8b5cf6' },
                                { key: 'rename', label: t('drive.rename') || 'Rename', icon: 'edit' },
                                { key: 'delete', label: t('drive.delete') || 'Delete', icon: 'trash', danger: true },
                              ]),
                        ].map((action) => (
                          <button
                            key={action.key}
                            onClick={() => {
                              setOpenMenuId(null);
                              onFileAction?.(action.key, [file]);
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
                              {getThemedIcon('ui', action.icon, 16, action.danger ? '#dc2626' : action.color || theme)}
                            </div>
                            <span>{action.label}</span>
                          </button>
                        ))}
                        </div>
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
              onClick={() => {
                if (openFolderMenuId === null && openMenuId === null) {
                  onFolderOpen?.(folder);
                }
              }}
              style={{
                position: 'relative',
                background: 'var(--panel, white)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '0.75rem',
                padding: '0.75rem',
                cursor: openFolderMenuId !== null || openMenuId !== null ? 'default' : 'pointer',
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
                onClick={(e) => {
                  if (openMenuId === null && openFolderMenuId === null) {
                    // Don't open file if clicking on checkbox or its wrapper
                    if (!e.target.closest('input[type="checkbox"]') && 
                        !e.target.closest('.checkboxContainer') && 
                        !e.target.closest('label[class*="wrapper"]')) {
                      onFileOpen?.(file);
                    }
                  }
                }}
                style={{
                  position: 'relative',
                  background: 'var(--panel, white)',
                  border: `1px solid ${selected ? 'var(--color-primary, #3b82f6)' : 'var(--border, #e5e7eb)'}`,
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  cursor: openMenuId !== null || openFolderMenuId !== null ? 'default' : 'pointer',
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
                  <Checkbox
                    checked={selected}
                    onChange={() => onToggleSelect?.(file.id)}
                    style={{ width: 16, height: 16 }}
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
                    position: 'relative',
                  }}
                >
                  {getThemedIcon('ui', getFileIconName(file), 36, theme)}
                  {file.canDelete === false && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        background: 'var(--panel, white)',
                        borderRadius: '50%',
                        padding: 4,
                        border: '1px solid var(--border, #e5e7eb)',
                      }}
                      title={getDeleteReasonText(file.deleteReason)}
                    >
                      {getThemedIcon('ui', 'lock', 12, 'muted')}
                    </div>
                  )}
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
                  <span>{formatDate(file.modifiedAt || file.createdAt)}</span>
                  <span>{file.owner?.displayName || file.owner?.email || '—'}</span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <StatusColumn file={file} onClick={() => onFileOpen?.(file)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
