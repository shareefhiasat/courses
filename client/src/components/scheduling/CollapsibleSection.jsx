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

  const toggle = () => setOpen((v) => !v);

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
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: open ? '0.5rem' : 0,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        aria-expanded={open}
      >
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
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {actions}
          <span style={{ display: 'inline-flex', padding: '0.125rem' }} aria-hidden>
            {open
              ? <ChevronUp size={16} color={muted} />
              : <ChevronDown size={16} color={muted} />}
          </span>
        </div>
      </div>
      {open && children}
    </div>
  );
}
