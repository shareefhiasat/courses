import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { getThemedIcon } from '@constants/iconTypes';
import { DEFAULT_STORAGE_LIMIT } from '@constants/driveConstants';

/**
 * DriveSpacesSidebar - Left-rail navigation for SmartDrive.
 * Layout and styling mirror the QRScanner sidebar pattern (light panel,
 * CSS variable tokens, themed icons, RTL-aware).
 */
export default function DriveSpacesSidebar({
  activeSpace = 'my-drive',
  onSpaceChange,
  storageUsage = 0,
  storageLimit = DEFAULT_STORAGE_LIMIT,
  folders = [],
  onFolderSelect,
  onUploadClick,
  isMinimized = false,
}) {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const storagePercentage = isSuperAdmin ? 0 : Math.min((storageUsage / storageLimit) * 100, 100);
  const fmt = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const spaces = [
    { id: 'my-drive', label: t('drive.myDrive') || 'My Drive', icon: 'folder' },
    { id: 'shared', label: t('drive.sharedWithMe') || 'Shared with me', icon: 'users' },
    { id: 'shared-by-me', label: t('drive.sharedByMe') || 'Shared by me', icon: 'share' },
    { id: 'recent', label: t('drive.recent') || 'Recent', icon: 'clock' },
    { id: 'starred', label: t('drive.starred') || 'Starred', icon: 'star' },
    { id: 'trash', label: t('drive.trash') || 'Trash', icon: 'trash' },
  ];

  const cardStyle = {
    background: 'var(--panel, white)',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: '0.75rem',
    padding: isMinimized ? '0.5rem' : '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const spaceButton = (space) => {
    const active = activeSpace === space.id;
    return (
      <button
        key={space.id}
        onClick={() => onSpaceChange?.(space.id)}
        title={isMinimized ? space.label : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: isMinimized ? '0.5rem' : '0.625rem 0.75rem',
          background: active ? 'var(--color-primary-tint, #eff6ff)' : 'transparent',
          color: active ? 'var(--color-primary, #2563eb)' : 'var(--text-secondary, #374151)',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: active ? 600 : 500,
          textAlign: isRTL ? 'right' : 'left',
          justifyContent: isMinimized ? 'center' : 'flex-start',
          width: '100%',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)';
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = 'transparent';
        }}
      >
        {getThemedIcon('ui', space.icon, 18, active ? 'primary' : theme)}
        {!isMinimized && <span>{space.label}</span>}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* New / Upload Button */}
      <button
        onClick={onUploadClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: isMinimized ? '0.625rem' : '0.875rem 1rem',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '0.75rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.25)';
        }}
        title={isMinimized ? t('drive.newUpload') || 'New' : undefined}
      >
        {getThemedIcon('ui', 'plus', 16, 'white')}
        {!isMinimized && (t('drive.newUpload') || 'New')}
      </button>

      {/* Spaces */}
      <div style={cardStyle}>
        {!isMinimized && (
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted, #6b7280)',
              paddingLeft: '0.5rem',
            }}
          >
            {t('drive.spaces') || 'Spaces'}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{spaces.map(spaceButton)}</div>
      </div>

      {/* Folders */}
      {!isMinimized && (
        <div style={cardStyle}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted, #6b7280)',
              paddingLeft: '0.5rem',
            }}
          >
            {t('drive.folders') || 'Folders'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {folders.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #9ca3af)',
                  fontStyle: 'italic',
                }}
              >
                {t('drive.noFolders') || 'No folders yet'}
              </p>
            ) : (
              folders.slice(0, 8).map((folder) => (
                <button
                  key={folder.id || folder.path || folder.name}
                  onClick={() => onFolderSelect?.(folder)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary, #374151)',
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {getThemedIcon('ui', 'folder', 14, theme)}
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {folder.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Storage Indicator */}
      {!isMinimized && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text, #111827)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {getThemedIcon('ui', 'hard_drive', 14, theme)}
              {t('drive.storage') || 'Storage'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
              {isSuperAdmin ? getThemedIcon('ui', 'infinity', 14, 'muted') : `${storagePercentage.toFixed(0)}%`}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              background: 'var(--background-secondary, #e5e7eb)',
              borderRadius: 999,
              overflow: 'hidden',
              border: '1px solid var(--border, #d1d5db)',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                width: `${storagePercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                transition: 'width 0.3s ease',
                borderRadius: 999,
              }}
            />
          </div>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)' }}>
            {isSuperAdmin ? (
              `${fmt(storageUsage)} used`
            ) : (
              (t('drive.storageUsed', { used: fmt(storageUsage), limit: fmt(storageLimit) }) ||
                `${fmt(storageUsage)} of ${fmt(storageLimit)} used`)
            )}
          </p>
        </div>
      )}
    </div>
  );
}
