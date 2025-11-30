import React from 'react';
import styles from './StoryboardTabs.module.css';

// A colorful, theme-aware tab bar with stable palette assignment
// tabs: Array<{ key: string, label: string, icon?: ReactNode, count?: number }>
export default function StoryboardTabs({ tabs = [], activeKey, onChange, className = '' }) {
  // Pleasant palettes (work in light and dark)
  const palette = [
    { bg: 'rgba(99,102,241,0.10)', fg: '#6366f1' }, // indigo
    { bg: 'rgba(16,185,129,0.12)', fg: '#10b981' }, // emerald
    { bg: 'rgba(59,130,246,0.12)', fg: '#3b82f6' }, // blue
    { bg: 'rgba(234,179,8,0.12)', fg: '#eab308' }, // amber
    { bg: 'rgba(236,72,153,0.12)', fg: '#ec4899' }, // pink
    { bg: 'rgba(168,85,247,0.12)', fg: '#a855f7' }, // purple
    { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e' }, // green
  ];

  const getStyleForIndex = (i, active) => {
    const { bg, fg } = palette[i % palette.length];
    return active
      ? { background: fg, color: '#fff', borderColor: fg }
      : { background: bg, color: fg, borderColor: 'transparent' };
  };

  return (
    <div className={`${styles.tabsContainer} ${className}`}>
      {tabs.map((t, i) => {
        const active = t.key === activeKey;
        return (
          <button
            key={t.key}
            className={`${styles.tab} ${active ? styles.active : ''}`}
            onClick={() => onChange && onChange(t.key)}
            style={getStyleForIndex(i, active)}
            aria-selected={active}
            role="tab"
          >
            {t.icon ? <span className={styles.icon}>{t.icon}</span> : null}
            <span className={styles.label}>{t.label}{typeof t.count==='number' ? ` (${t.count})` : ''}</span>
          </button>
        );
      })}
    </div>
  );
}
