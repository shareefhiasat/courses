import React from 'react';
import { getColoredIcon } from '@constants/iconTypes';

/**
 * Reusable performance filter chips component
 * Used in ReviewResultsPage and similar pages for filtering by performance metrics
 */
const PerformanceFilterChips = ({
  passedFilter,
  setPassedFilter,
  failedFilter,
  setFailedFilter,
  excellentFilter,
  setExcellentFilter,
  isMinified = false,
  theme = 'light',
  t = (key) => key
}) => {
  const performanceChips = [
    {
      id: 'passed',
      active: passedFilter,
      toggle: () => setPassedFilter(v => !v),
      icon: 'check_circle',
      label: t('passed') || 'Passed',
      colors: {
        border: '#bbf7d0',
        bg: '#ecfdf5',
        activeBg: '#16a34a',
        text: '#16a34a',
        activeText: '#fff'
      }
    },
    {
      id: 'failed',
      active: failedFilter,
      toggle: () => setFailedFilter(v => !v),
      icon: 'x_circle',
      label: t('failed') || 'Failed',
      colors: {
        border: '#fecaca',
        bg: '#fee2e2',
        activeBg: '#dc2626',
        text: '#dc2626',
        activeText: '#fff'
      }
    },
    {
      id: 'excellent',
      active: excellentFilter,
      toggle: () => setExcellentFilter(v => !v),
      icon: 'award',
      label: t('excellent') || 'Excellent (90%+)',
      colors: {
        border: '#d1fae5',
        bg: '#ecfdf5',
        activeBg: '#10b981',
        text: '#10b981',
        activeText: '#fff'
      }
    }
  ];

  return (
    <div className="filter-container filter-row" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
      {performanceChips.map(chip => (
        <button
          key={chip.id}
          className="filter-button"
          onClick={chip.toggle}
          title={chip.label}
          style={isMinified ? {
            width: 32,
            height: 32,
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
          } : {
            padding: '4px 8px',
            borderRadius: 999,
            border: `1px solid ${chip.colors.border}`,
            background: chip.active ? chip.colors.activeBg : chip.colors.bg,
            color: chip.active ? chip.colors.activeText : chip.colors.text,
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {getColoredIcon('ui', chip.icon, isMinified ? 14 : 12, chip.active ? chip.colors.activeText : chip.colors.text, theme)}
          {!isMinified && <span>{chip.label}</span>}
        </button>
      ))}
    </div>
  );
};

export default PerformanceFilterChips;
