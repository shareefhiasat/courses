import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';

export default function CollapsibleSection({
  title,
  summary,
  icon: HeaderIcon,
  defaultOpen = false,
  actions,
  children,
  testId,
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';

  return (
    <div
      data-testid={testId}
      style={{
        width: '100%',
        flexShrink: 0,
        backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
        borderRadius: '0.5rem',
        padding: open ? '0.625rem 0.75rem' : '0.375rem 0.75rem',
        border: `1px solid ${border}`,
        marginBottom: '0.75rem',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: open ? '0.5rem' : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
          {HeaderIcon && <HeaderIcon size={16} color={muted} />}
          <span style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
            flexShrink: 0,
          }}>
            {title}
          </span>
          {!open && summary && (
            <span style={{
              fontSize: '0.75rem',
              color: muted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {summary}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {actions}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.125rem',
              flexShrink: 0,
            }}
            aria-expanded={open}
          >
            {open
              ? <ChevronUp size={16} color={muted} />
              : <ChevronDown size={16} color={muted} />}
          </button>
        </div>
      </div>
      {open && children}
    </div>
  );
}
