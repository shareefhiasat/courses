import React from 'react';
import { getColoredIcon, getThemedIcon } from '@constants/iconTypes';
import { SUBMISSION_STATUS, getStatusLabel } from '@utils/sharedTypes';
import PortalTooltip from '@ui/PortalTooltip';


import { info, error, warn, debug } from '@services/utils/logger.js';// Import deriveIconColor separately to avoid module loading issues
let deriveIconColor;
try {
  const iconTypes = require('@constants/iconTypes');
  deriveIconColor = iconTypes.deriveIconColor;
} catch (error) {
  // Fallback function if import fails
  deriveIconColor = (chipColor) => {
    if (chipColor === '#f59e0b') return '#d97706';
    if (chipColor === '#22c55e') return '#16a34a';
    if (chipColor === '#16a34a') return '#16a34a';
    if (chipColor === '#ef4444') return '#dc2626';
    if (chipColor === '#b91c1c') return '#b91c1c';
    if (chipColor === '#dc2626') return '#dc2626';
    if (chipColor === '#f57c00') return '#f57c00';
    if (chipColor === '#3b82f6') return '#2563eb';
    if (chipColor === '#8b5cf6') return '#7c3aed';
    if (chipColor === '#f97316') return '#ea580c';
    if (chipColor === '#fbbf24') return '#f59e0b';
    if (chipColor === '#f5c518') return '#f5c518';
    if (chipColor === '#0ea5e9') return '#0ea5e9';
    if (chipColor === '#166534') return '#166534';
    if (chipColor === '#c2410c') return '#c2410c';
    if (chipColor === '#4f46e5') return '#4f46e5';
    if (chipColor === '#4F46E5FF') return '#4f46e5';
    if (chipColor === '#d97706') return '#d97706';
    if (chipColor === '#b45309') return '#b45309';
    if (chipColor === '#2e7d32') return '#2e7d32';
    if (chipColor === '#1976d2') return '#1976d2';
    return '#ffffff';
  };
}

/**
 * Reusable toggle filter chips component (Bookmark, Featured, Retake, Graded)
 * Used in HomePage, StudentDashboard, and similar pages
 */
const ToggleFilterChips = ({
  bookmarkFilter,
  setBookmarkFilter,
  featuredFilter,
  setFeaturedFilter,
  retakableFilter,
  setRetakableFilter,
  gradedFilter,
  setGradedFilter,
  isMinified = false,
  theme = 'light',
  lang = 'en',
  t = (key) => key,
  showBookmark = true,
  showFeatured = true,
  showRetakable = true,
  showGraded = true,
  filterCounts = {}
}) => {
  const toggleChips = [];

  if (showBookmark) {
    toggleChips.push({
      id: 'bookmark',
      active: bookmarkFilter,
      toggle: () => setBookmarkFilter(v => !v),
      icon: bookmarkFilter ? 'star' : 'star_off',
      label: t('bookmarked') || 'Bookmarked',
      colors: {
        border: '#f5c518',
        bg: '#fff',
        activeBg: '#f5c518',
        text: '#b45309',
        activeText: '#1f2937'
      }
    });
  }

  if (showFeatured) {
    toggleChips.push({
      id: 'featured',
      active: featuredFilter,
      toggle: () => setFeaturedFilter(v => !v),
      icon: 'pin',
      label: t('featured') || 'Featured',
      colors: {
        border: '#c7d2fe',
        bg: '#eef2ff',
        activeBg: '#4f46e5',
        text: '#4f46e5',
        activeText: '#fff'
      }
    });
  }

  if (showRetakable) {
    toggleChips.push({
      id: 'retakable',
      active: retakableFilter,
      toggle: () => setRetakableFilter(v => !v),
      icon: 'repeat',
      label: t('retake_allowed') || 'Retake',
      colors: {
        border: '#bae6fd',
        bg: '#ecfeff',
        activeBg: '#0ea5e9',
        text: '#0ea5e9',
        activeText: '#fff'
      }
    });
  }

  if (showGraded) {
    toggleChips.push({
      id: 'graded',
      active: gradedFilter === 'graded',
      toggle: () => setGradedFilter(p => p === 'graded' ? 'all' : 'graded'),
      icon: 'check_circle',
      label: getStatusLabel(SUBMISSION_STATUS.GRADED, lang),
      colors: {
        border: '#bbf7d0',
        bg: '#ecfdf5',
        activeBg: '#16a34a',
        text: '#16a34a',
        activeText: '#fff'
      }
    });
  }

  return (
    <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      {isMinified ? (
        toggleChips.map(chip => (
          <PortalTooltip key={chip.id} content={chip.label} position="top">
          <button
            onClick={chip.toggle}
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: `1px solid ${chip.colors.border}`,
              background: chip.active ? chip.colors.activeBg : chip.colors.bg,
              color: chip.active ? chip.colors.activeText : chip.colors.text,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.2s ease'
            }}
          >
            {chip.id === 'bookmark' ? (
              chip.active ? getThemedIcon('ui', 'star', 14, theme) : getThemedIcon('ui', 'star_off', 14, theme)
            ) : chip.id === 'featured' ? (
              getColoredIcon('ui', chip.icon, 14, deriveIconColor('#4f46e5'), theme)
            ) : chip.id === 'graded' ? (
              getColoredIcon('ui', chip.icon, 14, deriveIconColor('#16a34a'), theme)
            ) : (
              getColoredIcon('ui', chip.icon, 14, chip.colors.text, theme)
            )}
          </button>
          </PortalTooltip>
        ))
      ) : (
        toggleChips.map(chip => (
          <button
            key={chip.id}
            onClick={chip.toggle}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              border: `1px solid ${chip.colors.border}`,
              background: chip.active ? chip.colors.activeBg : chip.colors.bg,
              color: chip.active ? chip.colors.activeText : chip.colors.text,
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {chip.id === 'bookmark' ? (
              chip.active ? getColoredIcon('ui', 'star', 12, '#fff', theme) : getColoredIcon('ui', 'star_off', 12, '#f5c518', theme)
            ) : chip.id === 'featured' ? (
              chip.active ? getColoredIcon('ui', chip.icon, 12, '#fff', theme) : getColoredIcon('ui', chip.icon, 12, '#4f46e5', theme)
            ) : chip.id === 'graded' ? (
              chip.active ? getColoredIcon('ui', chip.icon, 12, '#fff', theme) : getColoredIcon('ui', chip.icon, 12, '#16a34a', theme)
            ) : (
              chip.active ? getColoredIcon('ui', chip.icon, 12, '#fff', theme) : getColoredIcon('ui', chip.icon, 12, chip.colors.text, theme)
            )}
            <span>{chip.label}</span>
            {filterCounts[chip.id] !== undefined && (
              <span style={{
                backgroundColor: chip.active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                padding: '0.125rem 0.375rem',
                borderRadius: 999,
                fontSize: '0.7rem',
                fontWeight: '600',
                minWidth: '1.25rem',
                textAlign: 'center'
              }}>
                {filterCounts[chip.id]}
              </span>
            )}
          </button>
        ))
      )}
    </div>
  );
};

export default ToggleFilterChips;
