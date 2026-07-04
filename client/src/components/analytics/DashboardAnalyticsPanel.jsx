import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { DEFAULT_ACCENT, normalizeHexColor } from '@utils/color';
import DashboardEngine from '@components/analytics/DashboardEngine';
import useEditLayoutGuard from '@hooks/useEditLayoutGuard';
import { Modal, Button } from '@ui';
import {
  LayoutDashboard, BarChart3, LineChart, PieChart,
  HardDrive, GitBranch, Activity, History, Save, Trash2,
} from 'lucide-react';
import {
  DASHBOARD_ANALYTICS_DEFAULT_WIDGETS,
  DASHBOARD_ANALYTICS_STORAGE_KEY,
  DASHBOARD_ANALYTICS_MAX_WIDGETS,
  ANALYTICS_WIDGET_CATEGORIES,
  buildAnalyticsRawData,
} from '@constants/dashboardAnalyticsWidgets';

const CATEGORY_ICONS = {
  all: LayoutDashboard,
  drive: HardDrive,
  workflow: GitBranch,
  activity: Activity,
};

export default function DashboardAnalyticsPanel({
  analyticsData,
  loading,
  onReload,
  lastUpdatedAt,
  lockedCategory = null,
  storageKeySuffix = '',
  defaultWidgets: customDefaultWidgets = null,
  maxWidgets: customMaxWidgets = null,
}) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const engineRef = useRef(null);
  const guard = useEditLayoutGuard(engineRef, { t });
  const { autoSave, editLayout, showExitDialog } = guard;
  const [widgetSearch, setWidgetSearch] = useState('');
  const [widgetCategory, setWidgetCategory] = useState(lockedCategory || 'all');
  const accentColor = DEFAULT_ACCENT;

  const storageKey = DASHBOARD_ANALYTICS_STORAGE_KEY + storageKeySuffix;
  const defaultWidgets = customDefaultWidgets || DASHBOARD_ANALYTICS_DEFAULT_WIDGETS;
  const maxWidgets = customMaxWidgets || DASHBOARD_ANALYTICS_MAX_WIDGETS;

  const rawData = useMemo(
    () => {
      const built = buildAnalyticsRawData(analyticsData);
      console.log('[ANALYTICS PANEL DEBUG] analyticsData from API:', {
        hasData: !!analyticsData,
        drive: analyticsData?.drive ? {
          overview: analyticsData.drive.overview,
          fileActivitiesLength: analyticsData.drive.fileActivities?.length,
          fileActivitiesSample: analyticsData.drive.fileActivities?.slice(0, 3),
          filesByMimeTypeLength: analyticsData.drive.filesByMimeType?.length,
          filesByBucketLength: analyticsData.drive.filesByBucket?.length,
        } : 'missing',
        workflow: analyticsData?.workflow ? {
          overview: analyticsData.workflow.overview,
          byStatusLength: analyticsData.workflow.workflowByStatus?.length,
          byStatusSample: analyticsData.workflow.workflowByStatus?.slice(0, 3),
        } : 'missing',
        activity: analyticsData?.activity ? {
          overview: analyticsData.activity.overview,
          byTypeLength: analyticsData.activity.activitiesByType?.length,
        } : 'missing',
      });
      console.log('[ANALYTICS PANEL DEBUG] built rawData keys:', Object.keys(built));
      console.log('[ANALYTICS PANEL DEBUG] built rawData driveFileActivities:', built.driveFileActivities);
      console.log('[ANALYTICS PANEL DEBUG] built rawData workflowByStatus:', built.workflowByStatus);
      return built;
    },
    [analyticsData],
  );

  const handleAddWidget = useCallback(() => {
    engineRef.current?.openBuilder?.();
  }, []);

  const iconBtnStyle = (color, active = false) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.35rem',
    width: 33,
    height: 33,
    fontSize: 'var(--font-size-sm)',
    borderRadius: '6px',
    border: `1px solid ${active ? color : (theme === 'dark' ? '#4b5563' : '#d1d5db')}`,
    background: active ? `${color}18` : (theme === 'dark' ? '#374151' : '#fff'),
    color: active ? color : (theme === 'dark' ? '#f3f4f6' : '#1f2937'),
    cursor: 'pointer',
  });

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div data-testid="dashboard-analytics-panel">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem',
          alignItems: 'center',
        }}>
          <input
            type="search"
            value={widgetSearch}
            onChange={(e) => setWidgetSearch(e.target.value)}
            placeholder={t('search_widgets')}
            aria-label={t('search_widgets')}
            data-testid="widget-search-input"
            style={{
              minWidth: 160,
              flex: '1 1 160px',
              maxWidth: 320,
              padding: '0.35rem 0.65rem',
              fontSize: 'var(--font-size-sm)',
              borderRadius: 6,
              border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
              background: theme === 'dark' ? '#374151' : '#fff',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onReload} style={iconBtnStyle('#6b7280')} title={t('refresh')} aria-label={t('refresh')}>
              {getThemedIcon('ui', 'rotate_cw', 16, theme)}
            </button>
            <button
              type="button"
              onClick={guard.handleToggleEditLayout}
              style={iconBtnStyle(accentColor, editLayout)}
              title={editLayout ? t('exit_edit_layout') : t('edit_layout')}
              aria-label={editLayout ? t('exit_edit_layout') : t('edit_layout')}
            >
              {getThemedIcon('ui', 'layout_dashboard', 16, theme)}
            </button>
            {!autoSave && editLayout && (
              <button
                type="button"
                onClick={guard.handleSaveChanges}
                style={iconBtnStyle('#10b981')}
                title={t('save_layout')}
                aria-label={t('save_layout')}
              >
                <Save size={16} strokeWidth={2} />
              </button>
            )}
            {!autoSave && editLayout && (
              <button
                type="button"
                onClick={guard.handleDiscardChanges}
                style={iconBtnStyle('#ef4444')}
                title={t('discard_changes')}
                aria-label={t('discard_changes')}
              >
                <Trash2 size={16} strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              onClick={guard.toggleAutoSave}
              style={iconBtnStyle(autoSave ? '#10b981' : '#6b7280', !autoSave)}
              title={autoSave ? t('auto_save_on') : t('auto_save_off')}
              aria-label={t('auto_save')}
            >
              <Save size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={handleAddWidget}
              style={iconBtnStyle(accentColor)}
              title={t('add_widget')}
              aria-label={t('add_widget')}
            >
              {getThemedIcon('ui', 'plus', 16, theme)}
            </button>
            <button
              type="button"
              onClick={() => engineRef.current?.resetToDefaults?.()}
              style={iconBtnStyle('#ef4444')}
              title={t('reset_to_system_default')}
              aria-label={t('reset_to_system_default')}
            >
              <History size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
        {!lockedCategory && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
          {ANALYTICS_WIDGET_CATEGORIES.map((cat) => {
            const active = widgetCategory === cat.id;
            const Icon = CATEGORY_ICONS[cat.id] || BarChart3;
            const label = (lang === 'ar' ? cat.labelAr : cat.label) || cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setWidgetCategory(cat.id)}
                data-testid={`widget-cat-${cat.id}`}
                title={label}
                aria-label={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: 'var(--font-size-xs)',
                  borderRadius: 999,
                  border: `1px solid ${active ? accentColor : (theme === 'dark' ? '#4b5563' : '#d1d5db')}`,
                  background: active ? `${accentColor}18` : (theme === 'dark' ? '#374151' : '#fff'),
                  color: active ? accentColor : (theme === 'dark' ? '#e5e7eb' : '#374151'),
                  cursor: 'pointer',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={13} strokeWidth={2} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        )}
      </div>

      <DashboardEngine
        ref={engineRef}
        rawData={rawData}
        globalFilters={{}}
        accentColor={normalizeHexColor(accentColor)}
        editLayout={editLayout}
        autoSave={autoSave}
        defaultWidgets={defaultWidgets}
        storageKey={storageKey}
        isLoading={loading}
        lastUpdatedAt={lastUpdatedAt}
        onSmartReload={onReload}
        widgetSearch={widgetSearch}
        widgetCategory={widgetCategory}
        widgetCategoryResolver="analytics"
        builderCategoryScope="analytics"
        maxWidgets={maxWidgets}
      />

      <Modal
        isOpen={showExitDialog}
        onClose={guard.handleCancelExit}
        title={t('unsaved_changes_title')}
        size="small"
        footer={
          <>
            <Button variant="outline" onClick={guard.handleCancelExit}>{t('cancel')}</Button>
            <Button variant="danger" onClick={guard.handleDiscardChanges}>{t('discard_changes')}</Button>
            <Button variant="primary" onClick={guard.handleSaveChanges}>{t('save_layout')}</Button>
          </>
        }
      >
        <p>{t('unsaved_changes_message')}</p>
      </Modal>
    </div>
  );
}
