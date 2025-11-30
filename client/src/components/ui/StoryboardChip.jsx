import React from 'react';
import styles from './StoryboardChip.module.css';

// Simple hash for stable color selection
const hash = (str) => {
  let h = 0; for (let i = 0; i < String(str).length; i++) { h = (h<<5)-h + String(str).charCodeAt(i); h |= 0; }
  return Math.abs(h);
};

// Palettes tuned for light/dark
const palettes = {
  type: [
    { bg: '#e3f2fd', fg: '#1976d2' }, // blue
    { bg: '#fff3e0', fg: '#f57c00' }, // orange
    { bg: '#eef2ff', fg: '#6366f1' }, // indigo
    { bg: '#f3e8ff', fg: '#7c3aed' }, // violet
  ],
  level: [
    { bg: '#e8f5e9', fg: '#2e7d32' }, // green
    { bg: '#fff7ed', fg: '#b45309' }, // amber
    { bg: '#fee2e2', fg: '#b91c1c' }, // red
  ],
  status: [
    { bg: '#fef9c3', fg: '#b45309' }, // gold
    { bg: '#ecfeff', fg: '#0891b2' }, // cyan
    { bg: '#eef2ff', fg: '#4f46e5' }, // indigo
  ]
};

export default function StoryboardChip({
  label,
  icon,
  active = false,
  onClick,
  kind = 'type', // 'type' | 'level' | 'status'
  seed = 'default',
  size = 'md',
  className = '',
  title,
}) {
  const set = palettes[kind] || palettes.type;
  const idx = hash(seed || label) % set.length;
  const { bg, fg } = set[idx];
  const style = active
    ? { background: fg, color: '#fff', borderColor: fg }
    : { background: bg, color: fg, borderColor: 'transparent' };

  return (
    <button
      type="button"
      className={`${styles.chip} ${styles[size]} ${active ? styles.active : ''} ${className}`}
      onClick={onClick}
      style={style}
      title={title || label}
      aria-pressed={active}
    >
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.label}>{label}</span>
    </button>
  );
}
