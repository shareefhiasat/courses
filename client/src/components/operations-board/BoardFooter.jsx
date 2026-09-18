import React, { useState } from 'react';
import { IconButton, Tabs, Tab } from '@mui/material';
import { KanbanSquare, Table2, Maximize2, Minimize2, History, FileText, FileSpreadsheet, CalendarDays, Star } from 'lucide-react';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import BoardLegend from './BoardLegend.jsx';
import { BOARD_LANE } from './operationsBoardConstants.js';
import { canViewParticipation } from './hrAttendancePrivacy.js';
import { BOARD_PARTICIPATION_COLOR } from '@constants/workspaceStatusColors.js';

const VIEW_ICONS = {
  kanban: KanbanSquare,
  table: Table2,
};

function FooterControls({
  activeView,
  onViewChange,
  viewOptions,
  isDark,
  t,
  onOpenHistory,
  classInfo,
  date,
  embedded,
  expanded,
  onToggleExpand,
  onExportDailyTemplate,
  onExportWeeklySchedule,
  exportingKey,
  hideViewToggle = false,
  hideExpand = false,
  showNotesToggle = false,
  showParticipationToggle = false,
}) {
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeParticipation, setIncludeParticipation] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      {!hideViewToggle && (
        <Tabs
        value={activeView}
        onChange={(_, next) => next && onViewChange(next)}
        aria-label={t('operations_board_view_mode')}
        data-tour="operations-board-view-mode"
        sx={{
          minHeight: 24,
          '& .MuiTab-root': {
            minHeight: 24,
            width: 24,
            height: 24,
            textTransform: 'none',
            fontSize: '0.78rem',
            px: 0,
            py: 0,
            minWidth: 'auto',
            gap: 0,
            color: isDark ? '#94a3b8' : '#64748b',
          },
          '& .MuiTab-root.Mui-selected': {
            color: '#3b82f6',
          },
          '& .MuiTabs-indicator': {
            height: 2,
          },
        }}
      >
        {viewOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <Tab
              key={opt.key}
              value={opt.key}
              data-testid={`operations-board-view-${opt.key}`}
              icon={(
                <ColoredTooltip title={opt.label} color={isDark ? '#94a3b8' : '#64748b'} placement="top">
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                    <Icon size={14} />
                  </span>
                </ColoredTooltip>
              )}
              aria-label={opt.label}
            />
          );
        })}
      </Tabs>
      )}

      {!hideViewToggle && onOpenHistory && classInfo?.id && date && (
        <ColoredTooltip
          title={t('operations_board_class_logs') || 'Class logs'}
          color="#3b82f6"
          placement="top"
        >
          <IconButton
            size="small"
            onClick={() => onOpenHistory(classInfo, date, 'lecture')}
            data-testid="operations-board-open-logs"
            aria-label={t('operations_board_class_logs') || 'Class logs'}
            sx={{
              width: 24,
              height: 24,
              borderRadius: 0,
              bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
              color: isDark ? '#94a3b8' : '#64748b',
              '&:hover': {
                bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
              },
            }}
          >
            <History size={14} />
          </IconButton>
        </ColoredTooltip>
      )}

      {onExportDailyTemplate && showNotesToggle && (
        <ColoredTooltip
          title={includeNotes ? (t('export_exclude_notes') || 'Exclude notes column') : (t('export_include_notes') || 'Include notes column')}
          color="#ef4444"
          placement="top"
        >
          <IconButton
            size="small"
            onClick={() => setIncludeNotes((prev) => !prev)}
            data-testid="daily-template-notes-toggle"
            aria-label={includeNotes ? (t('export_exclude_notes') || 'Exclude notes column') : (t('export_include_notes') || 'Include notes column')}
            sx={{
              width: 24,
              height: 24,
              borderRadius: 0,
              bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
              color: '#ef4444',
              '&:hover': {
                bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
              },
            }}
          >
            <Star size={14} fill={includeNotes ? '#ef4444' : 'none'} />
          </IconButton>
        </ColoredTooltip>
      )}

      {onExportDailyTemplate && showParticipationToggle && (
        <ColoredTooltip
          title={includeParticipation ? (t('export_exclude_participation') || 'Exclude participation column') : (t('export_include_participation') || 'Include participation column')}
          color={BOARD_PARTICIPATION_COLOR}
          placement="top"
        >
          <IconButton
            size="small"
            onClick={() => setIncludeParticipation((prev) => !prev)}
            data-testid="daily-template-participation-toggle"
            aria-label={includeParticipation ? (t('export_exclude_participation') || 'Exclude participation column') : (t('export_include_participation') || 'Include participation column')}
            sx={{
              width: 24,
              height: 24,
              borderRadius: 0,
              bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
              color: BOARD_PARTICIPATION_COLOR,
              '&:hover': {
                bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
              },
            }}
          >
            <Star size={14} fill={includeParticipation ? BOARD_PARTICIPATION_COLOR : 'none'} />
          </IconButton>
        </ColoredTooltip>
      )}

      {onExportDailyTemplate && (
        <ColoredTooltip
          title={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, padding: '4px 0' }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{t('daily_template') || 'Daily Template'}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#e53935' }}
                  onClick={(e) => { e.stopPropagation(); onExportDailyTemplate(EXPORT_FORMAT.PDF, { includeNotes, includeParticipation }); }}
                >
                  <FileText size={14} /> PDF
                </span>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#43a047' }}
                  onClick={(e) => { e.stopPropagation(); onExportDailyTemplate(EXPORT_FORMAT.EXCEL, { includeNotes, includeParticipation }); }}
                >
                  <FileSpreadsheet size={14} /> Excel
                </span>
              </div>
            </div>
          }
          color="#64748b"
          placement="top"
        >
          <span>
            <IconButton
              size="small"
              disabled={exportingKey?.startsWith('daily-template-')}
              onClick={() => onExportDailyTemplate(EXPORT_FORMAT.PDF, { includeNotes, includeParticipation })}
              aria-label={t('daily_template') || 'Daily Template'}
              sx={{
                width: 24,
                height: 24,
                borderRadius: 0,
                bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
                color: isDark ? '#94a3b8' : '#64748b',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
                },
              }}
            >
              <FileText size={14} />
            </IconButton>
          </span>
        </ColoredTooltip>
      )}

      {onExportWeeklySchedule && (
        <ColoredTooltip
          title={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, padding: '4px 0' }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{t('weekly_schedule') || 'Weekly Schedule'}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#e53935' }}
                  onClick={(e) => { e.stopPropagation(); onExportWeeklySchedule(EXPORT_FORMAT.PDF); }}
                >
                  <FileText size={14} /> PDF
                </span>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#43a047' }}
                  onClick={(e) => { e.stopPropagation(); onExportWeeklySchedule(EXPORT_FORMAT.EXCEL); }}
                >
                  <FileSpreadsheet size={14} /> Excel
                </span>
              </div>
            </div>
          }
          color="#64748b"
          placement="top"
        >
          <span>
            <IconButton
              size="small"
              onClick={() => onExportWeeklySchedule(EXPORT_FORMAT.PDF)}
              data-testid="board-footer-weekly-schedule-btn"
              aria-label={t('weekly_schedule') || 'Weekly Schedule'}
              sx={{
                width: 24,
                height: 24,
                borderRadius: 0,
                bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
                color: isDark ? '#94a3b8' : '#64748b',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
                },
              }}
            >
              <CalendarDays size={14} />
            </IconButton>
          </span>
        </ColoredTooltip>
      )}

      {embedded && onToggleExpand && !hideExpand && (
        <ColoredTooltip
          title={expanded ? t('operations_board_collapse') : t('operations_board_expand')}
          color="#8b5cf6"
          placement="top"
        >
          <IconButton
            size="small"
            onClick={onToggleExpand}
            className={gridStyles.legendExpandBtn}
            data-testid="operations-board-expand"
            aria-label={expanded ? t('operations_board_collapse') : t('operations_board_expand')}
            sx={{
              width: 24,
              height: 24,
              borderRadius: 0,
              bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
              color: isDark ? '#94a3b8' : '#64748b',
              '&:hover': {
                bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
              },
            }}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </IconButton>
        </ColoredTooltip>
      )}
    </div>
  );
}

export default function BoardFooter({
  columns = [],
  lane = BOARD_LANE.ATTENDANCE,
  view,
  onViewChange,
  embedded = false,
  expanded = false,
  onToggleExpand,
  onExportDailyTemplate,
  onExportWeeklySchedule,
  exportingKey,
  showLegend = true,
  onOpenHistory = null,
  classInfo = null,
  date = null,
  roleContext = {},
  panelTab = 'board',
}) {
  const { t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isCalendarTab = panelTab === 'calendar';
  const isInstructor = roleContext?.isInstructor && !roleContext?.isAdmin && !roleContext?.isHR && !roleContext?.isSuperAdmin;

  const viewOptions = [
    { key: 'kanban', label: t('operations_board_view_board'), icon: VIEW_ICONS.kanban },
    { key: 'table', label: t('operations_board_view_table'), icon: VIEW_ICONS.table },
  ];
  const activeView = viewOptions.some((opt) => opt.key === view) ? view : 'kanban';

  const legendRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.25rem',
    width: '100%',
    padding: '4px 2px',
    borderTop: 'none',
  };

  const controls = (
    <FooterControls
      activeView={activeView}
      onViewChange={onViewChange}
      viewOptions={viewOptions}
      isDark={isDark}
      t={t}
      onOpenHistory={onOpenHistory}
      classInfo={classInfo}
      date={date}
      embedded={embedded}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      onExportDailyTemplate={onExportDailyTemplate}
      onExportWeeklySchedule={onExportWeeklySchedule}
      exportingKey={exportingKey}
      hideViewToggle={isCalendarTab || isInstructor}
      hideExpand={isInstructor}
      showNotesToggle={Boolean(roleContext?.isAdmin || roleContext?.isSuperAdmin)}
      showParticipationToggle={canViewParticipation(roleContext)}
    />
  );

  const showWorkflowLegend = isCalendarTab || lane === BOARD_LANE.STATUS;

  return (
    <div
      className={`${gridStyles.statusLegend} ${gridStyles.statusLegendBottom} operations-board-footer-stack`}
      data-testid="operations-board-footer-stack"
      style={{ marginTop: 'auto', width: '100%' }}
    >
      {showLegend && (
        <>
          <BoardLegend
            bare
            showAttendance
            showWorkflow={showWorkflowLegend}
            includeNotTaken={isCalendarTab}
            showScheduleExtras={isInstructor}
            showYourClassOnly={isInstructor}
            roleContext={roleContext}
            style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}
            data-tour="operations-board-legend"
          />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 8px' }}>
            {controls}
          </div>
        </>
      )}
      {!showLegend && controls}
    </div>
  );
}
