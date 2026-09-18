import React from 'react';
import { useLang } from '@contexts/LangContext';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { DRIVE_TIMELINE } from './constants';

/**
 * Unified search/filter bar with optional timeline collapse toggle.
 */
export default function DriveFilterBar({
  value,
  onChange,
  onClear,
  placeholder,
  showCollapseToggle = true,
  timelineCollapsed = false,
  onToggleTimeline,
  ariaLabel,
}) {
  const { t } = useLang();

  return (
    <div style={{ position: 'relative', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        data-testid="drive-timeline-filter"
        style={{
          flex: 1,
          height: DRIVE_TIMELINE.INPUT_HEIGHT,
          padding: '0 0.75rem',
          border: '1px solid var(--border, #d1d5db)',
          borderRadius: '0.5rem',
          background: 'var(--panel, white)',
          color: 'var(--text, #111827)',
          fontSize: 'var(--font-size-sm)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {showCollapseToggle && onToggleTimeline && (
        <button
          type="button"
          onClick={onToggleTimeline}
          style={{
            width: DRIVE_TIMELINE.INPUT_HEIGHT,
            height: DRIVE_TIMELINE.INPUT_HEIGHT,
            padding: 0,
            background: 'var(--panel, white)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            color: 'var(--text-muted, #6b7280)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
          aria-label={timelineCollapsed ? t('workflow.expand', 'Expand') : t('workflow.collapse', 'Collapse')}
        >
          {timelineCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      )}
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          style={{
            position: 'absolute',
            insetInlineEnd: showCollapseToggle ? '3rem' : '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted, #6b7280)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '0.25rem',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text, #111827)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #6b7280)'; }}
          aria-label={t('common.clear')}
        >
          ✕
        </button>
      )}
    </div>
  );
}
