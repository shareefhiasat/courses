import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { DEFAULT_ACCENT, normalizeHexColor } from '@utils/color';
import DashboardEngine from '@components/analytics/DashboardEngine';
import EffortReportExport from '@components/scheduling/summary/EffortReportExport';
import {
  SCHEDULING_SUMMARY_DEFAULT_WIDGETS,
  SCHEDULING_SUMMARY_STORAGE_KEY,
  buildSchedulingRawData,
} from '@constants/schedulingSummaryWidgets';

export default function SchedulingSummaryAnalytics({
  effortReport,
  dashboardData,
  isRTL,
  canExport,
  onReload,
  lastUpdatedAt,
}) {
  const { t } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const engineRef = useRef(null);
  const [editLayout, setEditLayout] = useState(false);
  const accentColor = DEFAULT_ACCENT;

  const storageKey = useMemo(() => {
    if (!user?.uid) return SCHEDULING_SUMMARY_STORAGE_KEY;
    return `${SCHEDULING_SUMMARY_STORAGE_KEY}_${user.uid}`;
  }, [user?.uid]);

  const rawData = useMemo(
    () => buildSchedulingRawData(effortReport, dashboardData, isRTL),
    [effortReport, dashboardData, isRTL],
  );

  const handleAddWidget = useCallback(() => {
    engineRef.current?.openBuilder?.();
  }, []);

  const btnStyle = (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.65rem',
    fontSize: '0.8125rem',
    borderRadius: '6px',
    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
    background: theme === 'dark' ? '#374151' : '#fff',
    color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
    cursor: 'pointer',
  });

  return (
    <div data-testid="scheduling-summary-analytics">
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        {canExport && <EffortReportExport report={effortReport} canExport={canExport} />}
        <button type="button" onClick={onReload} style={btnStyle('#6b7280')} title={t('refresh')}>
          {getThemedIcon('ui', 'rotate_cw', 14, theme)}
          <span>{t('refresh')}</span>
        </button>
        <button
          type="button"
          onClick={() => setEditLayout((v) => !v)}
          style={btnStyle(accentColor)}
          title={t('edit_layout') || 'Edit layout'}
        >
          {getThemedIcon('ui', 'layout_dashboard', 14, theme)}
          <span>{editLayout ? (t('done') || 'Done') : (t('edit_layout') || 'Edit Layout')}</span>
        </button>
        <button type="button" onClick={handleAddWidget} style={btnStyle(accentColor)} title={t('add_widget') || 'Add widget'}>
          {getThemedIcon('ui', 'plus', 14, theme)}
          <span>{t('add_widget') || 'Add Widget'}</span>
        </button>
        <button
          type="button"
          onClick={() => engineRef.current?.resetToDefaults?.()}
          style={btnStyle('#ef4444')}
          title={t('reset_to_system_default') || 'Reset to system default'}
        >
          {getThemedIcon('ui', 'rotate_ccw', 14, theme)}
          <span>{t('reset_to_system_default') || 'Reset to Default'}</span>
        </button>
      </div>

      <DashboardEngine
        ref={engineRef}
        rawData={rawData}
        globalFilters={{}}
        accentColor={normalizeHexColor(accentColor)}
        editLayout={editLayout}
        defaultWidgets={SCHEDULING_SUMMARY_DEFAULT_WIDGETS}
        storageKey={storageKey}
        isLoading={false}
        lastUpdatedAt={lastUpdatedAt}
        onSmartReload={onReload}
      />
    </div>
  );
}
