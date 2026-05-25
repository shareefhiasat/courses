import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';

export default function DriveTreeView({ folders, onFolderSelect, currentFolderId }) {
  const { t, isRTL } = useLang();
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
            padding: '0.5rem 0.75rem',
            paddingLeft: `${0.75 + level * 1.25}rem`,
            cursor: 'pointer',
            background: isSelected ? 'var(--color-primary-tint, #eff6ff)' : 'transparent',
            borderRadius: '0.375rem',
            margin: '0.125rem 0.5rem',
            transition: 'all 0.15s ease',
            borderLeft: isSelected ? '3px solid var(--color-primary, #3b82f6)' : '3px solid transparent',
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
          {/* Chevron icon */}
          <div
            style={{
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '0.5rem',
              color: 'var(--text-muted, #6b7280)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleFolder(folder.id);
              }
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )
            ) : (
              <div style={{ width: 14 }} />
            )}
          </div>

          {/* Folder icon */}
          <div style={{ marginRight: '0.5rem', color: isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--text-muted, #6b7280)' }}>
            {getThemedIcon('ui', 'folder', 16, isSelected ? 'primary' : 'muted')}
          </div>

          {/* Folder name */}
          <span
            style={{
              flex: 1,
              fontSize: '0.875rem',
              fontWeight: isSelected ? 500 : 400,
              color: 'var(--text, #111827)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={folder.name}
          >
            {folder.name}
          </span>

          {/* File count and size badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: '0.5rem' }}>
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
            {folder.totalSize > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 400,
                  color: 'var(--text-muted, #9ca3af)',
                }}
              >
                {fmt(folder.totalSize)}
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
            width: 'calc(100% - 1rem)',
            padding: '0.5rem 0.75rem',
            margin: '0.5rem 0.5rem 0',
            background: 'var(--background-secondary, #f3f4f6)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
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
          {t('drive.collapseAll') || 'Collapse All'}
        </button>
      )}
    </div>
  );
}
