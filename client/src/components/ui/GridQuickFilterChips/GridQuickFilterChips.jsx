import React from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import styles from './GridQuickFilterChips.module.css';

/** Shared palette for dashboard summary / quick-filter chips (light + dark). */
export const CHIP_VARIANTS = {
  blue: {
    light: { bg: '#f0f9ff', border: '#bae6fd', color: '#0369a1' },
    dark: { bg: '#1e3a8a', border: '#3b82f6', color: '#dbeafe' },
  },
  slate: {
    light: { bg: '#f8fafc', border: '#e2e8f0', color: '#1f2937' },
    dark: { bg: '#1f2937', border: '#374151', color: '#f3f4f6' },
  },
  amber: {
    light: { bg: '#fef3c7', border: '#fde68a', color: '#92400e' },
    dark: { bg: '#78350f', border: '#92400e', color: '#fef3c7' },
  },
  pink: {
    light: { bg: '#fce7f3', border: '#fbcfe8', color: '#831843' },
    dark: { bg: '#831843', border: '#f9a8d4', color: '#fce7f3' },
  },
  green: {
    light: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
    dark: { bg: '#14532d', border: '#16a34a', color: '#dcfce7' },
  },
  sky: {
    light: { bg: '#e0f2fe', border: '#7dd3fc', color: '#0c4a6e' },
    dark: { bg: '#0c4a6e', border: '#0ea5e9', color: '#e0f2fe' },
  },
  red: {
    light: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
    dark: { bg: '#7f1d1d', border: '#dc2626', color: '#fecaca' },
  },
  purple: {
    light: { bg: '#f3e8ff', border: '#c4b5fd', color: '#6b21a8' },
    dark: { bg: '#581c87', border: '#7c3aed', color: '#e9d5ff' },
  },
  violet: {
    light: { bg: '#f5f3ff', border: '#ddd6fe', color: '#6d28d9' },
    dark: { bg: '#4c1d95', border: '#8b5cf6', color: '#ede9fe' },
  },
  gray: {
    light: { bg: '#f3f4f6', border: '#d1d5db', color: '#374151' },
    dark: { bg: '#374151', border: '#4b5563', color: '#f3f4f6' },
  },
  indigo: {
    light: { bg: '#eef2ff', border: '#c7d2fe', color: '#4338ca' },
    dark: { bg: '#1e1b4b', border: '#4338ca', color: '#c7d2fe' },
  },
};

/**
 * Clickable summary chips that act as quick row filters above AdvancedDataGrid.
 *
 * @param {Array<{ id: string, label: React.ReactNode, count?: number, icon?: React.ReactNode, variant?: keyof CHIP_VARIANTS, filterable?: boolean }>} chips
 * @param {string} activeId - currently selected chip id ('all' clears filter)
 * @param {(id: string) => void} onChange
 */
const GridQuickFilterChips = ({
  chips = [],
  activeId = 'all',
  onChange,
  className = '',
  style,
}) => {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';

  if (!chips.length) return null;

  return (
    <div
      className={`${styles.row} ${className}`}
      style={style}
      role="toolbar"
      aria-label={t('grid_quick_filters') || 'Quick filters'}
    >
      {chips.map((chip) => {
        const isActive = activeId === chip.id;
        const isClickable = chip.filterable !== false && typeof onChange === 'function';
        const variant = CHIP_VARIANTS[chip.variant] || CHIP_VARIANTS.blue;
        const colors = isDark ? variant.dark : variant.light;

        const chipStyle = isActive && isClickable
          ? {
              background: isDark ? 'rgba(128, 0, 32, 0.35)' : '#fdf2f4',
              border: '2px solid #800020',
              color: isDark ? '#fda4af' : '#800020',
              fontWeight: 600,
              boxShadow: isDark ? '0 0 0 1px rgba(128,0,32,0.4)' : '0 1px 3px rgba(128,0,32,0.15)',
            }
          : {
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.color,
              fontWeight: 500,
            };

        const content = (
          <>
            {chip.icon ? <span className={styles.icon}>{chip.icon}</span> : null}
            <span className={styles.label}>{chip.label}</span>
            {chip.count != null ? (
              <span className={styles.count}>{chip.count}</span>
            ) : null}
          </>
        );

        if (!isClickable) {
          return (
            <span
              key={chip.id}
              className={styles.chip}
              style={chipStyle}
              aria-disabled="true"
            >
              {content}
            </span>
          );
        }

        return (
          <button
            key={chip.id}
            type="button"
            className={`${styles.chip} ${styles.chipButton} ${isActive ? styles.chipActive : ''}`}
            style={chipStyle}
            onClick={() => onChange(isActive && chip.id !== 'all' ? 'all' : chip.id)}
            aria-pressed={isActive}
            title={
              isActive
                ? (t('grid_chip_clear_filter') || 'Click to clear filter')
                : (t('grid_chip_apply_filter') || 'Click to filter')
            }
          >
            {content}
          </button>
        );
      })}
    </div>
  );
};

export default GridQuickFilterChips;
