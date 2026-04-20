import React, { useState, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Input, Button } from '@ui';

/**
 * FileRoster - Files grid with search, filters, multi-select & row actions.
 * Mirrors the StudentRoster pattern from the QR scanner page for visual consistency.
 */
export default function FileRoster({
  files = [],
  selectedIds = new Set(),
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onFileOpen,
  onFileAction,
  searchQuery = '',
  onSearchChange,
  viewMode = 'list',
  onViewModeChange,
}) {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const [hoveredId, setHoveredId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const allSelected = files.length > 0 && selectedIds.size === files.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < files.length;

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => (f.name || '').toLowerCase().includes(q));
  }, [files, searchQuery]);

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
      {filteredFiles.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #6b7280)' }}>
          {searchQuery
            ? t('drive.noMatches') || 'No files match your search.'
            : t('drive.noFiles') || 'No files yet. Upload to get started.'}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && filteredFiles.length > 0 && (
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
            <div style={{ flex: 2 }}>{t('drive.name') || 'Name'}</div>
            <div style={{ flex: 1 }}>{t('drive.owner') || 'Owner'}</div>
            <div style={{ flex: 1 }}>{t('drive.location') || 'Location'}</div>
            <div style={{ width: 100, textAlign: isRTL ? 'left' : 'right' }}>
              {t('drive.size') || 'Size'}
            </div>
            <div style={{ width: 40 }} />
          </div>

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
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => onToggleSelect?.(file.id)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                      {formatDate(file.createdAt || file.modifiedAt)}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary, #374151)' }}>
                  {file.owner || t('me') || 'me'}
                </div>
                <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary, #374151)' }}>
                  {file.location || '—'}
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
                <div style={{ width: 40, position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === file.id ? null : file.id);
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
                    title={t('more_actions') || 'More actions'}
                  >
                    {getThemedIcon('ui', 'more_vertical', 16, theme)}
                  </button>
                  {openMenuId === file.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        [isRTL ? 'left' : 'right']: 0,
                        marginTop: 4,
                        background: 'var(--panel, white)',
                        border: '1px solid var(--border, #e5e7eb)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        minWidth: 180,
                        zIndex: 10,
                        padding: '0.25rem',
                      }}
                    >
                      {[
                        { key: 'open', label: t('open') || 'Open', icon: 'external_link' },
                        { key: 'download', label: t('download') || 'Download', icon: 'download' },
                        { key: 'share', label: t('share') || 'Share', icon: 'send' },
                        { key: 'rename', label: t('rename') || 'Rename', icon: 'edit' },
                        { key: 'delete', label: t('delete') || 'Delete', icon: 'trash', danger: true },
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
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            color: action.danger ? '#dc2626' : 'var(--text, #111827)',
                            textAlign: isRTL ? 'right' : 'left',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {getThemedIcon('ui', action.icon, 14, theme)}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && filteredFiles.length > 0 && (
        <div
          style={{
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
