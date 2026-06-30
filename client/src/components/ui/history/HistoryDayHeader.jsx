import React from 'react';
import { useIsMobile } from '@hooks/useIsMobile';

const getPalette = (theme) => {
  if (theme === 'dark') {
    return {
      surface: 'linear-gradient(135deg, rgba(15,23,42,0.94), rgba(15,23,42,0.8))',
      border: 'rgba(148,163,184,0.25)',
      textPrimary: '#f8fafc',
      textMuted: '#94a3b8',
      divider: 'rgba(100,116,139,0.35)',
      hover: 'rgba(59,130,246,0.12)'
    };
  }
  return {
    surface: '#f9fafb',
    border: 'var(--border, #e5e7eb)',
    textPrimary: '#0f172a',
    textMuted: 'var(--text-muted, #64748b)',
    divider: 'var(--border, #e2e8f0)',
    hover: 'rgba(59,130,246,0.08)'
  };
};

const badgeTokens = {
  attendance: {
    light: {
      bg: 'var(--color-success-light, #f0fdf4)',
      border: '1px solid var(--color-success-border, #bbf7d0)',
      text: 'var(--color-success-dark, #166534)'
    },
    dark: {
      bg: 'rgba(16,185,129,0.12)',
      border: '1px solid rgba(16,185,129,0.45)',
      text: '#6ee7b7'
    }
  },
  participation: {
    light: {
      bg: 'var(--color-info-light, #eff6ff)',
      border: '1px solid var(--color-info-border, #bfdbfe)',
      text: 'var(--color-info-dark, #1e40af)'
    },
    dark: {
      bg: 'rgba(59,130,246,0.12)',
      border: '1px solid rgba(59,130,246,0.45)',
      text: '#93c5fd'
    }
  },
  behavior: {
    light: {
      bg: 'var(--color-warning-light, #fff7ed)',
      border: '1px solid var(--color-warning-border, #fed7aa)',
      text: 'var(--color-warning-dark, #c2410c)'
    },
    dark: {
      bg: 'rgba(251,146,60,0.12)',
      border: '1px solid rgba(249,115,22,0.45)',
      text: '#fb923c'
    }
  },
  penalties: {
    light: {
      bg: 'var(--color-danger-light, #fef2f2)',
      border: '1px solid var(--color-danger-border, #fecaca)',
      text: 'var(--color-danger-dark, #b91c1c)'
    },
    dark: {
      bg: 'rgba(248,113,113,0.12)',
      border: '1px solid rgba(248,113,113,0.45)',
      text: '#fca5a5'
    }
  }
};

const renderBadge = (type, value, isMobile, theme) => {
  if (!value) return null;
  const palette = badgeTokens[type][theme === 'dark' ? 'dark' : 'light'];

  return (
    <div
      key={type}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: isMobile ? 'auto' : '2rem',
        padding: isMobile ? '0.1rem 0.35rem' : '0.25rem 0.6rem',
        borderRadius: '999px',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 600,
        color: palette.text,
        background: palette.bg,
        border: palette.border,
        flexShrink: 0,
        boxShadow: theme === 'dark'
          ? '0 0 8px rgba(15,23,42,0.45) inset'
          : '0 1px 2px rgba(15,23,42,0.08)'
      }}
    >
      {value}
    </div>
  );
};

export const HistoryDayHeader = ({
  dateStr,
  filteredCounts,
  isDayExpanded,
  onToggle,
  t,
  isRTL,
  theme = 'light'
}) => {
  const isMobile = useIsMobile();
  const palette = getPalette(theme);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isDayExpanded}
      onClick={onToggle}
      onKeyPress={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0.5rem 0.65rem' : '0.75rem 1rem',
        background: palette.surface,
        border: `1px solid ${palette.border}`,
        borderBottom: isDayExpanded ? `1px solid ${palette.divider}` : `1px solid ${palette.border}`,
        borderRadius: '0.75rem',
        cursor: 'pointer',
        transition: 'background 0.2s ease, border 0.2s ease',
        boxShadow: theme === 'dark'
          ? '0 10px 30px rgba(2,6,23,0.45)'
          : '0 8px 20px rgba(15,23,42,0.1)',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.35rem' : '0.75rem' }}>
        <div style={{
          color: palette.textPrimary,
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: 600,
          letterSpacing: '0.01em'
        }}>
          {dateStr}
        </div>

        <div
          style={{
            display: 'flex',
            gap: isMobile ? '0.2rem' : '0.4rem',
            alignItems: 'center',
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            overflowX: isMobile ? 'auto' : 'visible',
            padding: isMobile ? '0.1rem 0.2rem' : 0,
            scrollbarWidth: 'none'
          }}
        >
          {renderBadge('attendance', filteredCounts.attendance, isMobile, theme)}
          {renderBadge('participation', filteredCounts.participation, isMobile, theme)}
          {renderBadge('behavior', filteredCounts.behavior, isMobile, theme)}
          {renderBadge('penalties', filteredCounts.penalties, isMobile, theme)}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: palette.textMuted
      }}>
        <svg
          style={{
            width: '20px',
            height: '20px',
            transform: isDayExpanded
              ? (isRTL ? 'rotate(180deg)' : 'rotate(0deg)')
              : (isRTL ? 'rotate(90deg)' : 'rotate(-90deg)'),
            transition: 'transform 0.2s ease',
            color: palette.textMuted
          }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
  );
};

export default HistoryDayHeader;
