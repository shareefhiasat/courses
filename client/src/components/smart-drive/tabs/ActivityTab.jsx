import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { getIcon } from '@constants/iconTypes';
import { formatQatarDate, formatQatarDateOnly } from '@utils/timezone';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { usePanelLayout } from '@hooks/usePanelLayout';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import axios from 'axios';

const ACTION_COLORS = {
  UPLOAD: { light: '#16a34a', dark: '#4ade80' },
  DOWNLOAD: { light: '#2563eb', dark: '#60a5fa' },
  SHARE: { light: '#d97706', dark: '#fbbf24' },
  DELETE: { light: '#dc2626', dark: '#f87171' },
  EDIT: { light: '#2563eb', dark: '#60a5fa' },
  STAR: { light: '#d97706', dark: '#fbbf24' },
  RESTORE: { light: '#16a34a', dark: '#4ade80' },
  PREVIEW: { light: '#8b5cf6', dark: '#a78bfa' },
  OPEN_IN_NEW_TAB: { light: '#8b5cf6', dark: '#a78bfa' },
};

function getActionStyle(action) {
  const colors = ACTION_COLORS[action?.toUpperCase()] || { light: '#6b7280', dark: '#9ca3af' };
  return {
    color: `var(--action-color, ${colors.light})`,
  };
}

function getActionBg(action) {
  const colors = ACTION_COLORS[action?.toUpperCase()] || { light: '#6b7280', dark: '#9ca3af' };
  return `var(--action-bg, ${colors.light}1A)`;
}

export default function ActivityTab({ fileId }) {
  const { t } = useLang();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterText, setFilterText] = useState('');

  const fetchActivities = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/drive/files/${fileId}/activities`);
      if (response.data.success) {
        setActivities(response.data.payload || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch activities');
      }
    } catch (err) {
      console.error('[ActivityTab] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Group activities by date
  const groupedActivities = activities.reduce((acc, activity) => {
    const date = new Date(activity.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => new Date(b) - new Date(a));
  
  // Filter activities based on search text
  const filteredActivities = useMemo(() => {
    let filtered = selectedDate ? groupedActivities[selectedDate] || [] : activities;
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.action?.toLowerCase().includes(searchLower) ||
        activity.user?.displayName?.toLowerCase().includes(searchLower) ||
        activity.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, [activities, filterText, selectedDate, groupedActivities]);

  const getActionIcon = (action) => {
    switch (action?.toUpperCase()) {
      case 'UPLOAD': return 'upload';
      case 'DOWNLOAD': return 'download';
      case 'SHARE': return 'share';
      case 'DELETE': return 'trash';
      case 'RENAME': return 'edit';
      case 'EDIT': return 'edit';
      case 'STAR': return 'star';
      case 'RESTORE': return 'rotate_ccw';
      case 'PREVIEW': return 'activity';
      case 'OPEN_IN_NEW_TAB': return 'activity';
      default: return 'activity';
    }
  };

  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const timelinePanelRef = useRef(null);
  const [savedLayout, onLayoutChange] = usePanelLayout('wf-activity-panels', { timeline: 35, content: 65 });

  const formatDateTime = (date) => {
    if (!date) return '\u2014';
    return formatQatarDate(date, 'dd/MM/yyyy HH:mm');
  };

  const formatDateHeader = (dateStr) => {
    return formatQatarDateOnly(dateStr);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }} role="status">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: '#dc2626' }} role="alert">
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
        {getIcon('ui', 'activity', 40)}
        {t('drive.noActivity')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Collapse/expand toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <button
          onClick={() => {
            if (timelineCollapsed) {
              timelinePanelRef.current?.expand();
              setTimelineCollapsed(false);
            } else {
              timelinePanelRef.current?.collapse();
              setTimelineCollapsed(true);
            }
          }}
          style={{
            padding: '0.25rem 0.5rem',
            background: 'var(--panel, white)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            color: 'var(--text-muted, #6b7280)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
          }}
          title={timelineCollapsed ? t('workflow.expand', 'Expand') : t('workflow.collapse', 'Collapse')}
        >
          {timelineCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>
      <PanelGroup orientation="horizontal" id="workflow-activity-panels" style={{ flex: 1 }} defaultLayout={savedLayout} onLayoutChange={onLayoutChange}>
      {/* Left sidebar - Date timeline */}
      <Panel id="timeline" panelRef={timelinePanelRef} defaultSize={35} minSize={15} collapsible collapsedSize={0}>
      <div style={{ 
        borderRight: '1px solid var(--border, #e5e7eb)', 
        paddingInlineEnd: '1rem',
        overflowY: 'auto',
        height: '100%',
      }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted, #6b7280)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getIcon('ui', 'clock', 16)}
          {t('drive.timeline') || 'Timeline'}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <button
            onClick={() => setSelectedDate(null)}
            style={{
              padding: '0.5rem',
              textAlign: 'start',
              background: !selectedDate ? 'var(--bg-primary, #f3f4f6)' : 'transparent',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: !selectedDate ? 'var(--text, #111827)' : 'var(--text-muted, #6b7280)',
              cursor: 'pointer',
              fontWeight: !selectedDate ? 600 : 400,
            }}
          >
            {t('drive.allActivities') || 'All Activities'} ({activities.length})
          </button>
          {sortedDates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                padding: '0.5rem',
                textAlign: 'start',
                background: selectedDate === date ? 'var(--bg-primary, #f3f4f6)' : 'transparent',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: selectedDate === date ? 'var(--text, #111827)' : 'var(--text-muted, #6b7280)',
                cursor: 'pointer',
                fontWeight: selectedDate === date ? 600 : 400,
              }}
            >
              {formatDateHeader(date)} ({groupedActivities[date].length})
            </button>
          ))}
        </div>
      </div>
      </Panel>
      <PanelResizeHandle style={{ width: '4px', background: 'var(--border, #e5e7eb)', margin: '0 2px', borderRadius: '2px', cursor: 'col-resize' }} />

      {/* Right content - Activities */}
      <Panel id="content" minSize={30}>
      <div style={{ flex: 1, overflowY: 'auto', height: '100%', paddingInlineStart: '0.5rem' }}>
        {/* Search filter */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={t('drive.filterActivities') || 'Filter activities...'}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              border: '1px solid var(--border, #d1d5db)',
              borderRadius: '0.5rem',
              background: 'var(--panel, white)',
              color: 'var(--text, #111827)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
            aria-label={t('drive.filterActivities') || 'Filter activities'}
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #6b7280)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text, #111827)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted, #6b7280)'}
              aria-label={t('common.clear')}
            >
              ✕
            </button>
          )}
        </div>

        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text, #111827)', marginBottom: '1rem' }}>
          {selectedDate ? formatDateHeader(selectedDate) : t('drive.activityLog')} ({filteredActivities.length})
        </h3>

        {filteredActivities.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
            {getIcon('ui', 'activity', 40)}
            {filterText ? t('drive.noMatchingActivities') || 'No matching activities' : t('drive.noActivity')}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', insetInlineStart: '1rem', top: 0, bottom: 0, width: '0.125rem', background: 'var(--border, #e5e7eb)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredActivities.map((activity) => {
                const actionIcon = getActionIcon(activity.action);

                return (
                  <div key={activity.id} style={{ position: 'relative', paddingInlineStart: '3rem' }}>
                    <div
                      style={{
                        position: 'absolute',
                        insetInlineStart: 0,
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '9999px',
                        background: getActionBg(activity.action),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--panel, white)',
                      }}
                    >
                      {getIcon('ui', actionIcon, 16)}
                    </div>

                    <div style={{
                      padding: '1rem',
                      background: 'var(--panel, white)',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border, #e5e7eb)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)', margin: 0, marginBottom: '0.25rem' }}>
                            {t('drive.activity.' + activity.action?.toLowerCase()) || activity.action}
                            {' \u00B7 '}
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)', fontWeight: 400 }}>
                              {activity.user?.displayName || activity.user?.email || t('drive.unknownUser')}
                            </span>
                          </p>
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {activity.metadata.linkId && <span style={{ color: 'var(--color-primary, #2563eb)' }}>{t('drive.linkCreated')}</span>}
                              {activity.metadata.expiresAt && (
                                <span>{t('drive.expires')}: {formatQatarDateOnly(activity.metadata.expiresAt)}</span>
                              )}
                              {activity.metadata.passwordProtected && (
                                <span style={{ color: '#d97706' }}>{t('drive.passwordProtected')}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {formatDateTime(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </Panel>
      </PanelGroup>
    </div>
  );
}
