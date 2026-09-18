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

function isLightColor(hex) {
  if (!hex) return false;
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq > 180;
}

function colorToRgba(hex, alpha) {
  if (!hex) return hex;
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveChipColors(chip, isDark) {
  if (chip.colors) {
    if (chip.colors.activeBg && chip.colors.activeText) return chip.colors;
    const base = chip.colors.color || chip.colors.bg;
    const text = base && !isLightColor(base) ? '#ffffff' : '#1f2937';
    return { activeBg: base, activeText: text, ...chip.colors };
  }
  if (chip.color) {
    const base = chip.color;
    const text = isLightColor(base) ? '#1f2937' : '#ffffff';
    return {
      bg: colorToRgba(base, 0.12),
      border: colorToRgba(base, 0.35),
      color: base,
      activeBg: base,
      activeText: text,
    };
  }
  const variant = CHIP_VARIANTS[chip.variant] || CHIP_VARIANTS.gray;
  const palette = isDark ? variant.dark : variant.light;
  const base = palette.color;
  const text = isLightColor(base) ? '#1f2937' : '#ffffff';
  return { ...palette, activeBg: base, activeText: text };
}

function isDotIcon(icon) {
  if (!React.isValidElement(icon)) return false;
  const style = icon.props?.style || {};
  return style.borderRadius === '50%' && style.width && style.height && !style.padding;
}

function renderIcon(icon, targetColor, isActive, outlineColor) {
  if (!React.isValidElement(icon)) return icon;
  const originalFill = icon.props.fill;
  const newProps = { color: targetColor };
  if (originalFill && originalFill !== 'none') {
    newProps.fill = targetColor;
  }
  if (isActive) {
    newProps.style = {
      ...(icon.props.style || {}),
      filter: `drop-shadow(0 0 1.5px ${outlineColor})`,
    };
  }
  return React.cloneElement(icon, newProps);
}

/**
 * Clickable summary chips that act as quick row filters above AdvancedDataGrid.
 *
 * Each chip can define either:
 * - `variant` (key of CHIP_VARIANTS),
 * - `color` (any hex, generates a matching light/dark palette),
 * - `colors` (full { bg, border, color, activeBg, activeText } override).
 *
 * @param {Array<{ id: string, label: React.ReactNode, count?: number, icon?: React.ReactNode, variant?: keyof CHIP_VARIANTS, color?: string, colors?: object, filterable?: boolean, title?: string | ((t) => string) }>} chips
 * @param {string} activeId - currently selected chip id ('all' clears filter); use activeIds for multi
 * @param {string[]} activeIds - currently selected chip ids for multi-select mode
 * @param {(id: string, nextActiveIds?: string[]) => void} onChange
 */
const GridQuickFilterChips = ({
  chips = [],
  activeId = 'all',
  activeIds,
  onChange,
  className = '',
  style,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';

  const isMulti = Array.isArray(activeIds);

  if (!chips.length) return null;

  return (
    <div
      className={`${styles.row} ${compact ? styles.compact : ''} ${className}`}
      style={style}
      role="toolbar"
      aria-label={t('grid_quick_filters')}
    >
      {chips.map((chip) => {
        const isActive = isMulti ? activeIds.includes(chip.id) : activeId === chip.id;
        const isClickable = chip.filterable !== false && typeof onChange === 'function';
        const colors = resolveChipColors(chip, isDark);

        const chipStyle = isActive && isClickable
          ? {
              background: colors.activeBg,
              border: `2px solid ${colors.color}`,
              borderRadius: '9999px',
              color: colors.activeText,
              fontWeight: 600,
              boxShadow: `0 0 0 1px ${colorToRgba(colors.color, 0.35)}`,
            }
          : {
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '9999px',
              color: colors.color,
              fontWeight: 500,
            };

        const iconColor = isActive ? colors.activeText : colors.color;
        const iconOutline = isActive
          ? (isLightColor(colors.activeText) ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.85)')
          : null;

        const dotIcon = chip.icon && (chip.dot || isDotIcon(chip.icon));

        const content = (
          <>
            {chip.icon ? (
              <span className={styles.icon}>
                {dotIcon && isActive ? (
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#fff',
                      border: `2px solid ${colors.color}`,
                      boxSizing: 'border-box',
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                ) : (
                  renderIcon(chip.icon, iconColor, isActive, iconOutline)
                )}
              </span>
            ) : null}
            <span className={styles.label}>{chip.label}</span>
            {chip.count !== undefined && (
              <span
                className={styles.count}
                style={{
                  backgroundColor: colorToRgba(isActive ? colors.activeText : colors.color, 0.13),
                  color: isActive ? colors.activeText : colors.color,
                  boxShadow: `0 1px 3px ${colorToRgba(isActive ? colors.activeText : colors.color, 0.25)}`,
                }}
              >
                {chip.count > 99 ? '99+' : chip.count}
              </span>
            )}
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
            onClick={() => {
              if (isMulti) {
                const next = isActive
                  ? activeIds.filter((id) => id !== chip.id)
                  : [...activeIds, chip.id];
                onChange(chip.id, next);
              } else {
                onChange(isActive && chip.id !== 'all' ? 'all' : chip.id);
              }
            }}
            aria-pressed={isActive}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
};

export default GridQuickFilterChips;
