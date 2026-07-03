import React, { useRef, useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { getIcon } from '@constants/iconTypes';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { usePanelLayout } from '@hooks/usePanelLayout';
import DriveFilterBar from './DriveFilterBar';
import { DRIVE_TIMELINE } from './constants';

const timelineButtonStyle = (selected) => ({
  padding: '0.5rem',
  textAlign: 'start',
  background: selected ? 'var(--bg-primary, #f3f4f6)' : 'transparent',
  border: 'none',
  borderRadius: '0.375rem',
  fontSize: 'var(--font-size-sm)',
  color: selected ? 'var(--text, #111827)' : 'var(--text-muted, #6b7280)',
  cursor: 'pointer',
  fontWeight: selected ? 600 : 400,
});

/**
 * Shared timeline sidebar + content panel layout used across drive tabs.
 */
export default function TimelinePanelLayout({
  panelLayoutKey,
  allItemsLabel,
  allItemsCount,
  dates = [],
  getDateCount,
  formatDateHeader,
  selectedDate,
  onDateSelect,
  filterText,
  onFilterChange,
  filterPlaceholder,
  sectionTitle,
  children,
  emptyState,
  showFilter = true,
  headerContent,
  compact = false,
}) {
  const { t } = useLang();
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const timelinePanelRef = useRef(null);
  const [savedLayout, onLayoutChange] = usePanelLayout(panelLayoutKey, { timeline: 35, content: 65 });

  const handleToggleTimeline = () => {
    if (timelineCollapsed) {
      timelinePanelRef.current?.expand();
      setTimelineCollapsed(false);
    } else {
      timelinePanelRef.current?.collapse();
      setTimelineCollapsed(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', ...(compact ? {} : { minHeight: DRIVE_TIMELINE.PANEL_MIN_HEIGHT }) }}>
      {headerContent}
      <PanelGroup
        orientation="horizontal"
        id={panelLayoutKey}
        style={{ flex: 1 }}
        defaultLayout={savedLayout}
        onLayoutChange={onLayoutChange}
      >
        <Panel id="timeline" panelRef={timelinePanelRef} defaultSize={35} minSize={15} collapsible collapsedSize={0}>
          <div style={{
            borderRight: '1px solid var(--border, #e5e7eb)',
            paddingInlineEnd: '1rem',
            overflowY: 'auto',
            height: '100%',
          }}>
            <h4 style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--text-muted, #6b7280)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              {getIcon('ui', 'clock', 16)}
              {t('drive.timeline')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button
                type="button"
                onClick={() => onDateSelect(null)}
                style={timelineButtonStyle(!selectedDate)}
              >
                {allItemsLabel} ({allItemsCount})
              </button>
              {dates.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => onDateSelect(date)}
                  style={timelineButtonStyle(selectedDate === date)}
                >
                  {formatDateHeader(date)} ({getDateCount(date)})
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle style={{ width: '4px', background: 'var(--border, #e5e7eb)', margin: '0 2px', borderRadius: '2px', cursor: 'col-resize' }} />

        <Panel id="content" minSize={30}>
          <div style={{ flex: 1, overflowY: 'auto', height: '100%', paddingInlineStart: '0.5rem' }}>
            {showFilter && (
              <DriveFilterBar
                value={filterText}
                onChange={onFilterChange}
                onClear={filterText ? () => onFilterChange('') : undefined}
                placeholder={filterPlaceholder}
                timelineCollapsed={timelineCollapsed}
                onToggleTimeline={handleToggleTimeline}
              />
            )}

            {sectionTitle && (
              <h3 style={{
                fontSize: DRIVE_TIMELINE.SECTION_TITLE_SIZE,
                fontWeight: 600,
                color: 'var(--text, #111827)',
                marginBottom: '1rem',
                marginTop: 0,
              }}>
                {sectionTitle}
              </h3>
            )}

            {emptyState || children}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

export function DriveTimelineEmptyState({ icon = 'message', message }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: DRIVE_TIMELINE.EMPTY_HEIGHT,
      fontSize: 'var(--font-size-sm)',
      color: 'var(--text-muted, #6b7280)',
      gap: '0.5rem',
    }}>
      {getIcon('ui', icon, 40)}
      {message}
    </div>
  );
}

export function DriveTimelineList({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: DRIVE_TIMELINE.CARD_GAP }}>
      {children}
    </div>
  );
}

export function DriveTimelineLoadingState({ message }) {
  const { t } = useLang();
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: DRIVE_TIMELINE.EMPTY_HEIGHT,
      fontSize: 'var(--font-size-sm)',
      color: 'var(--text-muted, #6b7280)',
    }} role="status">
      {message || `${t('common.loading')}…`}
    </div>
  );
}

export function DriveTimelineErrorState({ message }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: DRIVE_TIMELINE.EMPTY_HEIGHT,
      fontSize: 'var(--font-size-sm)',
      color: '#dc2626',
    }} role="alert">
      {message}
    </div>
  );
}

export function DriveCommentForm({ value, onChange, onSubmit, submitting, placeholder, submitLabel, showTextLabel = true }) {
  const { t } = useLang();

  return (
    <form onSubmit={onSubmit}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          style={{
            flex: 1,
            height: DRIVE_TIMELINE.INPUT_HEIGHT,
            padding: '0 0.75rem',
            border: '1px solid var(--border, #d1d5db)',
            borderRadius: '0.5rem',
            background: 'var(--panel, white)',
            color: 'var(--text, #111827)',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={!value.trim() || submitting}
          style={{
            height: DRIVE_TIMELINE.INPUT_HEIGHT,
            padding: showTextLabel ? '0 1rem' : '0',
            minWidth: showTextLabel ? undefined : DRIVE_TIMELINE.INPUT_HEIGHT,
            background: 'var(--color-primary, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: submitting || !value.trim() ? 'not-allowed' : 'pointer',
            opacity: submitting || !value.trim() ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            transition: 'background 0.15s',
            boxSizing: 'border-box',
          }}
          aria-label={submitting ? t('common.sending') : submitLabel}
        >
          <span style={{ color: '#ffffff', display: 'flex' }}>{getIcon('ui', 'send', 16)}</span>
          {showTextLabel && <span>{submitting ? t('common.sending') : submitLabel}</span>}
        </button>
      </div>
    </form>
  );
}
