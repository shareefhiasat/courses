import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';

export default function CollapsibleSection({
  title,
  summary,
  icon: HeaderIcon,
  defaultOpen = false,
  actions,
  children,
  testId,
  storageKey,
  noHover = false,
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`collapsible-section-${storageKey}`);
        if (saved !== null) return saved === 'true';
      } catch {}
    }
    return defaultOpen;
  });

  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(`collapsible-section-${storageKey}`, String(open));
      } catch {}
    }
  }, [open, storageKey]);
  const [hovered, setHovered] = useState(false);
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const hoverBg = theme === 'dark' ? 'rgba(129, 12, 41, 0.16)' : 'rgba(129, 12, 41, 0.06)';
  const showHover = hovered && !noHover;

  const toggle = () => setOpen((v) => !v);

  return (
    <div
      data-testid={testId}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        flexShrink: 0,
        backgroundColor: showHover ? hoverBg : (theme === 'dark' ? '#1f2937' : '#f9fafb'),
        borderRadius: '0.5rem',
        padding: open ? '0.625rem 0.75rem' : '0.375rem 0.75rem',
        border: `1px solid ${showHover ? '#810C29' : border}`,
        marginBottom: '0.75rem',
        transition: 'background-color 0.18s ease, border-color 0.18s ease',
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
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
            flexShrink: 0,
          }}>
            {title}
          </span>
          {!open && summary && (
            <span style={{
              fontSize: 'var(--font-size-xs)',
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
          <span style={{ display: 'inline-flex', padding: '0.125rem', transition: 'transform 0.18s ease', transform: open ? 'rotate(0deg)' : 'rotate(0deg)' }} aria-hidden>
            <ChevronDown size={16} color={muted} style={{ transition: 'transform 0.18s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </span>
        </div>
      </div>
      {open && children}
    </div>
  );
}
