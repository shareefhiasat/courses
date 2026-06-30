import React from 'react';
import { getColoredIcon } from '@constants/iconTypes';
import PortalTooltip from '@ui/PortalTooltip';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Reusable difficulty filter chips component
 * Used in HomePage, StudentDashboard, and ReviewResultsPage
 */
const DifficultyFilterChips = ({
  difficultyFilter,
  setDifficultyFilter,
  isMinified = false,
  theme = 'light',
  primaryColor = '#800020',
  t = (key) => key,
  lang = 'en',
  beginnerCount = 0,
  intermediateCount = 0,
  advancedCount = 0
}) => {
  const difficulties = [
    {
      value: 'all',
      label: t('all_levels') || 'All Levels',
      icon: 'filter',
      colors: {
        border: `${primaryColor}40`,
        bg: `${primaryColor}15`,
        activeBg: primaryColor,
        text: primaryColor,
        activeText: '#fff'
      }
    },
    {
      value: 'beginner',
      label: t('beginner') || 'Beginner',
      icon: 'help_circle',
      count: beginnerCount,
      colors: {
        border: '#bbf7d0',
        bg: '#ecfdf5',
        activeBg: '#16a34a',
        text: '#16a34a',
        activeText: '#fff'
      }
    },
    {
      value: 'intermediate',
      label: t('intermediate') || 'Intermediate',
      icon: 'help_circle',
      count: intermediateCount,
      colors: {
        border: '#fde68a',
        bg: '#fffbeb',
        activeBg: '#f59e0b',
        text: '#f59e0b',
        activeText: '#fff'
      }
    },
    {
      value: 'advanced',
      label: t('advanced') || 'Advanced',
      icon: 'help_circle',
      count: advancedCount,
      colors: {
        border: '#fecaca',
        bg: '#fee2e2',
        activeBg: '#dc2626',
        text: '#dc2626',
        activeText: '#fff'
      }
    }
  ];

  return (
    <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      {difficulties.map(diff => {
        const isActive = difficultyFilter === diff.value;
        return (
          <PortalTooltip key={diff.value} content={diff.label} position="top">
          <button
            className="filter-button"
            onClick={() => setDifficultyFilter(diff.value)}
            style={{
              padding: isMinified ? '4px 8px' : '4px 10px',
              borderRadius: 999,
              border: `1px solid ${diff.colors.border}`,
              background: isActive ? diff.colors.activeBg : diff.colors.bg,
              color: isActive ? diff.colors.activeText : diff.colors.text,
              fontSize: 'var(--font-size-xs)',
              fontWeight: diff.value === 'all' ? 700 : 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMinified ? 0 : 4,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isMinified && getColoredIcon('ui', diff.icon, 12, isActive ? diff.colors.activeText : diff.colors.text, theme)}
            {!isMinified && (
              <>
                {diff.value !== 'all' && getColoredIcon('ui', diff.icon, 12, isActive ? diff.colors.activeText : diff.colors.text, theme)}
                <span>{diff.label}</span>
                {diff.count !== undefined && (
                  <span style={{
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    padding: '0.125rem 0.375rem',
                    borderRadius: 999,
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    minWidth: '1.25rem',
                    textAlign: 'center'
                  }}>
                    {diff.count}
                  </span>
                )}
              </>
            )}
          </button>
          </PortalTooltip>
        );
      })}
    </div>
  );
};

export default DifficultyFilterChips;
