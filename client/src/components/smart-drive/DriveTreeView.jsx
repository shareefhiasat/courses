import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon, getColoredFolderIcon } from '@constants/iconTypes';
import { getLocalizedFolderName } from '@utils/localizedFolderName';

export default function DriveTreeView({ folders, onFolderSelect, currentFolderId }) {
  const { t, isRTL, lang } = useLang();
  const { theme } = useTheme();
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // Format bytes to human-readable size
  const fmt = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  // Load expanded state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('drive-tree-expanded');
    if (saved) {
      try {
        setExpandedFolders(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to parse expanded folders:', e);
      }
    }
  }, []);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('drive-tree-expanded', JSON.stringify([...expandedFolders]));
  }, [expandedFolders]);

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  const renderFolderNode = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = currentFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          onClick={() => {
            onFolderSelect?.(folder);
            if (hasChildren) {
              toggleFolder(folder.id);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.375rem 0.625rem',
            paddingInlineStart: `${0.625 + level * 1.25}rem`,
            cursor: 'pointer',
            background: isSelected ? 'var(--color-primary-tint, #eff6ff)' : 'transparent',
            borderRadius: '0.375rem',
            margin: '0.125rem 0',
            transition: 'all 0.15s ease',
            border: '1px solid transparent',
            borderInlineStart: isSelected ? '3px solid var(--color-primary, #3b82f6)' : '3px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {/* Chevron icon — only render if folder has children */}
          {hasChildren && (
            <div
              style={{
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginInlineEnd: '0.375rem',
                color: 'var(--text-muted, #6b7280)',
                flexShrink: 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          )}

          {/* Folder icon */}
          <div style={{ marginInlineEnd: '0.5rem', color: isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--text-muted, #6b7280)', flexShrink: 0 }}>
            {folder.color
              ? getColoredFolderIcon(16, folder.color)
              : getThemedIcon('ui', 'folder', 16, isSelected ? 'primary' : 'muted')}
          </div>

          {/* Folder name */}
          <span
            style={{
              flex: 1,
              fontSize: 'var(--font-size-sm)',
              fontWeight: isSelected ? 500 : 400,
              color: 'var(--text, #111827)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getLocalizedFolderName(folder, lang)}
          </span>

          {/* File count badge — size hidden to save space in narrow sidebar */}
          <div style={{ display: 'flex', alignItems: 'center', marginInlineStart: '0.375rem', flexShrink: 0 }}>
            {folder.fileCount > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: 'var(--text-muted, #6b7280)',
                  backgroundColor: 'var(--background-secondary, #f3f4f6)',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  minWidth: '1.25rem',
                  textAlign: 'center',
                }}
              >
                {folder.fileCount}
              </span>
            )}
          </div>
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div>
            {folder.children.map(child => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!folders || folders.length === 0) {
    return null;
  }

  console.log('[DriveTreeView] Folders data:', folders);

  return (
    <div>
      {/* Tree */}
      <div>
        {folders.map(folder => renderFolderNode(folder))}
      </div>

      {/* Collapse all button - positioned at bottom */}
      {expandedFolders.size > 0 && (
        <button
          onClick={collapseAll}
          style={{
            width: '100%',
            padding: '0.375rem 0.625rem',
            margin: '0.375rem 0 0',
            background: 'var(--background-secondary, #f3f4f6)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
            color: 'var(--text-secondary, #374151)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--background-tertiary, #e5e7eb)';
            e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)';
            e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
          }}
        >
          {getThemedIcon('ui', 'chevron_up', 14, 'muted')}
          {t('drive.collapseAll')}
        </button>
      )}
    </div>
  );
}
