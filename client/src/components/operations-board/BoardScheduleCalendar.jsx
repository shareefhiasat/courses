import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, parseISO, getISOWeek, startOfWeek, getDay, startOfMonth, endOfMonth, startOfWeek as dfStartOfWeek, endOfWeek } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import arSA from 'date-fns/locale/ar-SA';
import { Box, CircularProgress, Stack, IconButton, Slider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { getScheduleStatus } from '@services/business/attendanceWorkspaceService.js';
import { exportClassSummaryReport, exportClassDeductionReport } from '@services/business/studentSummaryReportService.js';
import { apiService } from '@services/api/apiService.js';
import { toast } from 'sonner';
import chatSocket from '@services/realtime/chatSocket.js';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService.js';
import { prepareWeeklyScheduleData } from '@services/export/official-reports/engine/prepareWeeklyScheduleData.js';
import { buildSlotWindowsFromTimeSlots } from '@services/export/official-reports/engine/buildWeeklyScheduleFromSessions.js';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import AttendanceStatusDots from './AttendanceStatusDots.jsx';
import ClassSessionMetaBadges from '@components/workspace/ClassSessionMetaBadges.jsx';
import { formatDate } from '@utils/date-formatter.js';
import { openDriveFileInCollabora } from '@utils/collaboraUtils.js';
import {
  buildClassCalendarEvents,
  collectDatesWithSessions,
  extractWeeklyClassSessions,
  getWorkflowEventColor,
  getAttendanceCountsFromStatus,
  getWorkflowStatusLabel,
  resolveAttendanceEventColor,
  resolveWeeklyWorkflowKey,
  ATTENDANCE_COUNT_ITEMS,
  toApiDate,
  toIsoDate,
} from './boardClassCalendarUtils.js';
import { SCHEDULE_WORKFLOW_STATUS } from '@constants/workspaceStatusColors.js';
import {
  Eye,
  EyeOff,
  FileBarChart,
  FilePenLine,
  FileText,
  FileSpreadsheet,
  FileSignature,
  ShieldCheck,
  GitBranch,
  User,
  GraduationCap,
  DoorOpen,
  Maximize2,
  Minimize2,
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  List,
  CalendarCheck,
  Layers,
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@components/ui/Calendar/Calendar.css';

const NEUTRAL_TOOLTIP = '#64748b';

/** Visible hours in week/day time views: 05:00 – 23:45 */
const CALENDAR_MIN_TIME = new Date(1970, 0, 1, 5, 0, 0);
const CALENDAR_MAX_TIME = new Date(1970, 0, 1, 23, 45, 0);

function isExcelFile(name, mime) {
  if (mime && /spreadsheet|excel/i.test(mime)) return true;
  if (name && /\.xlsx?$/i.test(name)) return true;
  return false;
}

async function directOpenFile(fileId, filename, format = 'pdf', t = (k) => k) {
  try {
    const response = await apiService.get(`/drive/files/${fileId}/download`, { responseType: 'blob' });
    const blob = response.data || response;
    const blobUrl = URL.createObjectURL(blob);
    const isExcel = format === 'xlsx' || (filename && /\.xlsx?$/i.test(filename));
    if (isExcel) {
      // Prefer the Collabora viewer; fall back to download when unavailable.
      const opened = await openDriveFileInCollabora(fileId);
      if (opened) { URL.revokeObjectURL(blobUrl); return; }
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || `download.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } else {
      // For PDFs, don't auto-open — show a toast with an "Open file" action.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
      toast.success((t('file_ready_click_to_open', { label: filename }) || '').replace('{label}', filename || 'PDF') || 'File ready', {
        description: filename,
        duration: 10000,
        action: {
          label: t('open_in_new_tab') || 'Open in new tab',
          onClick: () => window.open(blobUrl, '_blank'),
        },
      });
    }
  } catch (err) {
    console.error('Failed to load file:', err);
    toast.error(t('open_file_failed') || 'Failed to open file');
  }
}


const CalendarToolbarContext = React.createContext({ t: () => {}, lang: 'en', isDark: false, date: null, hideWeekend: false, onToggleWeekend: null, zoom: 100, onZoomChange: null, onZoomCommit: null, embedded: false, expanded: false, onToggleExpand: null });

const VIEW_ICONS = {
  month: CalendarRange,
  week: CalendarDays,
  day: CalendarIcon,
  agenda: List,
};

const VIEW_OPTIONS = ['month', 'week', 'day', 'agenda'];

function CalendarToolbar({ label, view, views, onNavigate, onView }) {
  const { t, lang, isDark, date, hideWeekend, onToggleWeekend, zoom, onZoomChange, onZoomCommit, embedded, expanded, onToggleExpand } = React.useContext(CalendarToolbarContext);
  const navBtnSx = {
    p: '4px',
    borderRadius: '6px',
    color: isDark ? '#94a3b8' : '#64748b',
    '&:hover': { bgcolor: isDark ? 'rgba(51,65,85,0.6)' : 'rgba(241,245,249,1)' },
  };
  const viewBtnSx = (isActive) => ({
    p: '4px',
    borderRadius: '6px',
    color: isActive ? '#3b82f6' : (isDark ? '#94a3b8' : '#64748b'),
    bgcolor: isActive ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)') : 'transparent',
    '&:hover': { bgcolor: isActive ? (isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)') : (isDark ? 'rgba(51,65,85,0.6)' : 'rgba(241,245,249,1)') },
  });

  const weekLabel = useMemo(() => {
    if (view !== 'week' || !date) return label;
    const anchor = date instanceof Date ? date : new Date(date);
    const weekStart = dfStartOfWeek(anchor, { weekStartsOn: 0 });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    const startStr = lang === 'ar'
      ? `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}/${weekStart.getFullYear()}`
      : `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
    const endStr = lang === 'ar'
      ? `${String(weekEnd.getDate()).padStart(2, '0')}/${String(weekEnd.getMonth() + 1).padStart(2, '0')}/${weekEnd.getFullYear()}`
      : `${String(weekEnd.getDate()).padStart(2, '0')}/${String(weekEnd.getMonth() + 1).padStart(2, '0')}`;
    const jan1 = new Date(weekStart.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((weekStart - jan1) / 86400000) + 1;
    const weekNum = Math.ceil(dayOfYear / 7);
    if (lang === 'ar') {
      return `${startStr} - ${endStr} أسبوع ${weekNum}`;
    }
    return `W${weekNum} ${startStr} - ${endStr}`;
  }, [view, date, label, lang]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ColoredTooltip title={t('calendar_today') || 'Today'} color={NEUTRAL_TOOLTIP}>
          <IconButton size="small" onClick={() => onNavigate('TODAY')} sx={navBtnSx}>
            <CalendarCheck size={16} />
          </IconButton>
        </ColoredTooltip>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {weekLabel}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
        {views.map((v) => {
          const Icon = VIEW_ICONS[v];
          if (!Icon) return null;
          const isActive = view === v;
          const labelMap = { month: t('calendar_month') || 'Month', week: t('calendar_week') || 'Week', day: t('calendar_day') || 'Day', agenda: t('operations_board_calendar_agenda') || 'Agenda' };
          return (
            <ColoredTooltip key={v} title={labelMap[v]} color={NEUTRAL_TOOLTIP}>
              <IconButton size="small" onClick={() => onView(v)} sx={viewBtnSx(isActive)}>
                <Icon size={16} />
              </IconButton>
            </ColoredTooltip>
          );
        })}
        {onToggleWeekend && (view === 'week' || view === 'month') && (
          <ColoredTooltip title={hideWeekend ? (t('calendar_show_weekend') || 'Show weekend') : (t('calendar_hide_weekend') || 'Hide weekend')} color={NEUTRAL_TOOLTIP}>
            <IconButton size="small" onClick={onToggleWeekend} sx={viewBtnSx(!hideWeekend)}>
              {hideWeekend ? <EyeOff size={16} /> : <Eye size={16} />}
            </IconButton>
          </ColoredTooltip>
        )}
        {embedded && onToggleExpand && (
          <ColoredTooltip
            title={expanded ? (t('operations_board_collapse') || 'Collapse') : (t('operations_board_expand') || 'Expand')}
            color="#8b5cf6"
            placement="top"
          >
            <IconButton
              size="small"
              onClick={onToggleExpand}
              data-testid="operations-board-expand"
              aria-label={expanded ? (t('operations_board_collapse') || 'Collapse') : (t('operations_board_expand') || 'Expand')}
              sx={viewBtnSx(false)}
            >
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </IconButton>
          </ColoredTooltip>
        )}
        {onZoomChange && (
          <Box
            data-testid="calendar-zoom-slider-wrap"
            onPointerDown={(e) => e.stopPropagation()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 0.75,
              py: 0.25,
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.15)'}`,
              fontSize: '12px',
              lineHeight: 1,
              ml: '6px',
            }}
          >
            <Slider
              size="small"
              value={zoom || 100}
              onChange={(_, value) => onZoomChange(value)}
              onChangeCommitted={(_, value) => onZoomCommit?.(value)}
              min={60}
              max={160}
              step={2}
              aria-label={t('calendar_zoom') || 'Calendar zoom'}
              data-testid="calendar-zoom-slider"
              sx={{
                width: 80,
                color: '#3b82f6',
                '& .MuiSlider-thumb': { width: 12, height: 12 },
                '& .MuiSlider-rail': { opacity: 0.35 },
              }}
            />
            <span
              data-testid="calendar-zoom-label"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#3b82f6',
                minWidth: 32,
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {zoom || 100}%
            </span>
          </Box>
        )}
      </div>
    </div>
  );
}

function AgendaEvent({ event, t, lang = 'en', zoomFactor = 1, isDark = false, hideNotesParticipation = false, hideParticipation = false, onClassSessionClick = null }) {
  const r = event.resource || {};
  const color = resolveAttendanceEventColor(r.status);
  const iconSize = Math.round(12 * zoomFactor);
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const tooltipColor = isDark ? '#94a3b8' : '#64748b';
  return (
    <ColoredTooltip
      title={<AttendanceSummaryTooltip event={event} t={t} lang={lang} hideNotesParticipation={hideNotesParticipation} hideParticipation={hideParticipation} onClassSessionClick={onClassSessionClick} />}
      color={tooltipColor}
      borderColor={color}
      placement="top"
      arrow
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        borderLeft: `4px solid ${isDark ? '#475569' : '#cbd5e1'}`,
        paddingLeft: '8px',
        color: textColor,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 600, color: textColor, flex: 1 }}>{event.title}</span>
          <EventStatusIndicators
            status={r.status}
            workflowKey={r.workflowKey}
            weeklyWorkflowKey={r.weeklyWorkflowKey}
            date={r.date}
            lang={lang}
            iconSize={iconSize}
            t={t}
            zoomFactor={zoomFactor}
            hideNotesParticipation={hideNotesParticipation}
            hideParticipation={hideParticipation}
          />
        </div>
        {r.instructor && (
          <span style={{ fontSize: '0.7rem', opacity: 0.85, color: textColor }}>
            {t('class_instructor') || 'Instructor'}: {r.instructor}
          </span>
        )}
        {r.room && (
          <span style={{ fontSize: '0.7rem', opacity: 0.85, color: textColor }}>
            {t('room') || 'Room'}: {r.room}
          </span>
        )}
        <AttendanceCountBar status={r.status} t={t} height={3} />
      </div>
    </ColoredTooltip>
  );
}

function AttendanceCountsBreakdown({ counts, t, fontSize = '0.7rem' }) {
  if (!counts) return null;
  const items = ATTENDANCE_COUNT_ITEMS
    .map((item) => ({ ...item, count: counts[item.key] || 0 }))
    .filter((item) => item.count > 0 || item.key === 'notTaken');
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item) => (
        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 3, color: item.color }}>
          <AttendanceStatusDots items={[item]} dotSize={10} className="shrink-0" />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: `${item.color}20`,
              color: item.color,
              fontSize,
              fontWeight: 600,
              padding: '0 4px',
            }}
          >
            {item.count}
          </span>
          <span style={{ fontSize, color: item.color, fontWeight: 600 }}>{t(item.labelKey) || item.fallback}</span>
        </div>
      ))}
    </div>
  );
}

export function AttendanceCountBar({ status, t, height = 3, style = {} }) {
  const counts = getAttendanceCountsFromStatus(status);
  const items = ATTENDANCE_COUNT_ITEMS
    .map((item) => ({ ...item, count: counts?.[item.key] || 0 }))
    .filter((item) => item.count > 0);
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (!total) {
    return <div style={{ height, width: '100%', backgroundColor: '#9ca3af', borderRadius: '2px', ...style }} />;
  }
  return (
    <div style={{ display: 'flex', width: '100%', height, borderRadius: '2px', overflow: 'hidden', marginTop: 2, ...style }}>
      {items.map((item) => (
        <ColoredTooltip
          key={item.key}
          title={`${item.count} ${t(item.labelKey) || item.fallback}`}
          color={item.color}
          borderColor={item.color}
          placement="top"
          arrow
        >
          <div
            style={{
              flex: `${item.count} 0 0`,
              minWidth: 2,
              backgroundColor: item.color,
              height: '100%',
              cursor: 'pointer',
            }}
          />
        </ColoredTooltip>
      ))}
    </div>
  );
}

function EventStatusIndicators({ status, workflowKey, weeklyWorkflowKey, date, lang = 'en', iconSize, t, zoomFactor = 1, hideNotesParticipation = false, hideParticipation = false, style = {} }) {
  const counts = getAttendanceCountsFromStatus(status);
  const items = ATTENDANCE_COUNT_ITEMS
    .map((item) => ({ ...item, count: counts?.[item.key] || 0 }))
    .filter((item) => item.count > 0);
  const hasDailyWorkflow = workflowKey
    && workflowKey !== SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN
    && workflowKey !== SCHEDULE_WORKFLOW_STATUS.TAKEN;
  const hasDaily = Boolean(hasDailyWorkflow);
  const dailyWorkflowColor = getWorkflowEventColor(workflowKey);
  const dailyWorkflowLabel = getWorkflowStatusLabel(workflowKey, t);
  const hasWeeklyWorkflow = weeklyWorkflowKey
    && weeklyWorkflowKey !== SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN;
  const weeklyWorkflowColor = getWorkflowEventColor(weeklyWorkflowKey);
  const weeklyWorkflowLabel = getWorkflowStatusLabel(weeklyWorkflowKey, t);

  const dailyColor = hasDailyWorkflow ? dailyWorkflowColor : '#3b82f6';
  const dailyTitle = hasDailyWorkflow
    ? dailyWorkflowLabel
    : (t('operations_board_daily_attendance') || 'Daily Attendance');
  const dateLabel = date ? formatDate(date, lang) : null;
  const weeklyWorkflowUpdatedAt = status?.weeklyWorkflowUpdatedAt ? formatDate(status.weeklyWorkflowUpdatedAt, lang) : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, ...style }}>
      {hasDaily && (
        <ColoredTooltip title={dateLabel ? `${dailyTitle} — ${dateLabel}` : dailyTitle} color={dailyColor} borderColor={dailyColor} placement="top" arrow>
          <FilePenLine size={iconSize} style={{ color: dailyColor, flexShrink: 0 }} />
        </ColoredTooltip>
      )}
      {hasWeeklyWorkflow && (
        <ColoredTooltip title={weeklyWorkflowUpdatedAt ? `${weeklyWorkflowLabel} — ${weeklyWorkflowUpdatedAt}` : weeklyWorkflowLabel} color={weeklyWorkflowColor} borderColor={weeklyWorkflowColor} placement="top" arrow>
          <GitBranch size={iconSize} style={{ color: weeklyWorkflowColor, flexShrink: 0 }} />
        </ColoredTooltip>
      )}
      {(status?.workflowSignedFile?.id || status?.weeklyWorkflowSignedFile?.id) && (
        <ColoredTooltip title={t('view_signed_copy') || 'Signed copy available'} color="#8b5cf6" borderColor="#8b5cf6" placement="top" arrow>
          <FileSignature size={iconSize} style={{ color: '#8b5cf6', flexShrink: 0 }} />
        </ColoredTooltip>
      )}
      {items.length > 0 && (
        <AttendanceStatusDots
          items={items}
          dotSize={iconSize}
          className="shrink-0"
          ariaLabel={t('attendance_summary') || 'Attendance summary'}
        />
      )}
      <ClassSessionMetaBadges status={status} t={t} zoomFactor={zoomFactor} compact hideNotesParticipation={hideNotesParticipation} hideParticipation={hideParticipation} />
    </div>
  );
}

export function AttendanceSummaryTooltip({ event, t, lang = 'en', hideNotesParticipation = false, hideParticipation = false, onClassSessionClick = null }) {
  const { user } = useAuth();
  const r = event.resource || {};
  const status = r.status || {};
  const workflowKey = r.workflowKey;
  const weeklyWorkflowKey = r.weeklyWorkflowKey;
  const counts = getAttendanceCountsFromStatus(status);
  const eventDate = r.date || (event.start ? toIsoDate(event.start) : null);
  const weekNum = eventDate ? getISOWeek(parseISO(eventDate)) : null;

  const hasWeeklyWorkflow = weeklyWorkflowKey
    && weeklyWorkflowKey !== SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN;
  const hasAttendance = Boolean(counts && (Object.values(counts).some((c) => c > 0) || status.hasAttendance));
  const dailyWorkflowColor = getWorkflowEventColor(workflowKey);
  const dailyWorkflowLabel = getWorkflowStatusLabel(workflowKey, t) || (t('workspace_status_not_taken') || 'Not yet');
  const weeklyWorkflowColor = getWorkflowEventColor(weeklyWorkflowKey);
  const weeklyWorkflowLabel = getWorkflowStatusLabel(weeklyWorkflowKey, t) || (t('workspace_status_not_taken') || 'Not yet');
  const dailyApprovedByName = lang === 'ar'
    ? (status.workflowApprovedByNameAr || status.workflowApprovedByName)
    : (status.workflowApprovedByName || status.workflowApprovedByNameAr);
  const weeklyApprovedByName = lang === 'ar'
    ? (status.weeklyWorkflowApprovedByNameAr || status.weeklyWorkflowApprovedByName)
    : (status.weeklyWorkflowApprovedByName || status.weeklyWorkflowApprovedByNameAr);
  const dailyApprovedDate = status.workflowApprovedAt ? formatDate(status.workflowApprovedAt, lang) : null;
  const weeklyApprovedDate = status.weeklyWorkflowApprovedAt ? formatDate(status.weeklyWorkflowApprovedAt, lang) : null;

  const labelColor = '#111827';
  const sectionStyle = { paddingTop: 4, marginTop: 4, borderTop: '1px solid rgba(148,163,184,0.35)', color: labelColor };

  return (
    <div style={{ maxWidth: 260, fontSize: '0.75rem', lineHeight: 1.45, color: labelColor }}>
      <div style={{ fontWeight: 700, color: labelColor }}>{event.title}</div>
      {eventDate && (
        <div style={{ color: labelColor }}>{formatDate(eventDate, lang)}{weekNum ? ` — W${weekNum}` : ''}</div>
      )}
      {(
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, color: dailyWorkflowColor }}>
            <span
              style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flex: 1 }}
              onClick={(e) => { e.stopPropagation(); onClassSessionClick?.({ classId: r.classId, date: eventDate, mode: 'day', targetLane: 'status' }); }}
            >
              <FilePenLine size={12} style={{ color: dailyWorkflowColor }} />
              <span style={{ fontWeight: 600, color: dailyWorkflowColor }}>{dailyWorkflowLabel}</span>
            </span>
            {status.workflowSnapshotFile?.id && status.workflowDocumentId && (
              <IconButton
                size="small"
                style={{ padding: 2, color: '#16a34a' }}
                onClick={() => window.open(`/workflow-documents/${status.workflowDocumentId}`, '_blank')}
              >
                <ShieldCheck size={12} />
              </IconButton>
            )}
            {(status.workflowSnapshotFile?.id || status.workflowFile?.id) && (
              <IconButton
                size="small"
                style={{ padding: 2, color: isExcelFile((status.workflowSnapshotFile || status.workflowFile).name, (status.workflowSnapshotFile || status.workflowFile).mimeType) ? '#43a047' : '#e53935' }}
                onClick={() => directOpenFile((status.workflowSnapshotFile || status.workflowFile).id, (status.workflowSnapshotFile || status.workflowFile).name, isExcelFile((status.workflowSnapshotFile || status.workflowFile).name, (status.workflowSnapshotFile || status.workflowFile).mimeType) ? 'xlsx' : 'pdf', t)}
              >
                {isExcelFile((status.workflowSnapshotFile || status.workflowFile).name, (status.workflowSnapshotFile || status.workflowFile).mimeType) ? (
                  <FileSpreadsheet size={12} />
                ) : (
                  <FileText size={12} />
                )}
              </IconButton>
            )}
            {status.workflowSignedFile?.id && (
              <IconButton
                size="small"
                title={t('view_signed_copy') || 'View signed copy'}
                style={{ padding: 2, color: '#8b5cf6' }}
                onClick={() => directOpenFile(status.workflowSignedFile.id, status.workflowSignedFile.name, isExcelFile(status.workflowSignedFile.name, status.workflowSignedFile.mimeType) ? 'xlsx' : 'pdf', t)}
              >
                <FileSignature size={12} />
              </IconButton>
            )}
          </div>
          {dailyApprovedByName && dailyApprovedDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: dailyWorkflowColor, fontSize: '0.7rem', marginTop: 2 }}>
              <User size={10} style={{ color: dailyWorkflowColor }} />
              <span>{t('workflow_approved_by_name_date', 'By {name} on {date}').replace('{name}', dailyApprovedByName).replace('{date}', dailyApprovedDate)}</span>
            </div>
          )}
        </div>
      )}
      {hasWeeklyWorkflow && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <span
              style={{ display: 'flex', alignItems: 'center', gap: 5, color: weeklyWorkflowColor, cursor: 'pointer', flex: 1 }}
              onClick={(e) => { e.stopPropagation(); onClassSessionClick?.({ classId: r.classId, date: eventDate, mode: 'week', targetLane: 'status' }); }}
            >
              <GitBranch size={14} style={{ color: weeklyWorkflowColor, flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: weeklyWorkflowColor }}>
                {weeklyWorkflowLabel}
              </span>
            </span>
            {status.weeklyWorkflowSnapshotFile?.id && status.weeklyWorkflowDocumentId && (
              <IconButton
                size="small"
                style={{ padding: 2, color: '#16a34a' }}
                onClick={() => window.open(`/workflow-documents/${status.weeklyWorkflowDocumentId}`, '_blank')}
              >
                <ShieldCheck size={12} />
              </IconButton>
            )}
            {(status.weeklyWorkflowSnapshotFile?.id || status.weeklyWorkflowFile?.id) && (
              <IconButton
                size="small"
                style={{ padding: 2, color: isExcelFile((status.weeklyWorkflowSnapshotFile || status.weeklyWorkflowFile).name, (status.weeklyWorkflowSnapshotFile || status.weeklyWorkflowFile).mimeType) ? '#43a047' : '#e53935' }}
                onClick={() => directOpenFile((status.weeklyWorkflowSnapshotFile || status.weeklyWorkflowFile).id, (status.weeklyWorkflowSnapshotFile || status.weeklyWorkflowFile).name, isExcelFile((status.weeklyWorkflowSnapshotFile || status.weeklyWorkflowFile).name, (status.weeklyWorkflowSnapshotFile || status.weeklyWorkflowFile).mimeType) ? 'xlsx' : 'pdf', t)}
              >
                {isExcelFile((status.weeklyWorkflowSnapshotFile || status.weeklyWorkflowFile).name, (status.weeklyWorkflowSnapshotFile || status.weeklyWorkflowFile).mimeType) ? (
                  <FileSpreadsheet size={12} />
                ) : (
                  <FileText size={12} />
                )}
              </IconButton>
            )}
            {status.weeklyWorkflowSignedFile?.id && (
              <IconButton
                size="small"
                title={t('view_signed_copy') || 'View signed copy'}
                style={{ padding: 2, color: '#8b5cf6' }}
                onClick={() => directOpenFile(status.weeklyWorkflowSignedFile.id, status.weeklyWorkflowSignedFile.name, isExcelFile(status.weeklyWorkflowSignedFile.name, status.weeklyWorkflowSignedFile.mimeType) ? 'xlsx' : 'pdf', t)}
              >
                <FileSignature size={12} />
              </IconButton>
            )}
          </div>
          {weeklyApprovedByName && weeklyApprovedDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: weeklyWorkflowColor, fontSize: '0.7rem', marginTop: 2 }}>
              <User size={10} style={{ color: weeklyWorkflowColor }} />
              <span>{t('workflow_approved_by_name_date', 'By {name} on {date}').replace('{name}', weeklyApprovedByName).replace('{date}', weeklyApprovedDate)}</span>
            </div>
          )}
        </div>
      )}
      {r.instructor && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: labelColor }}>
            <GraduationCap size={12} style={{ color: '#0ea5e9' }} />
            <span>{r.instructor}</span>
          </div>
        </div>
      )}
      {hasAttendance && (
        <div style={sectionStyle}>
          <AttendanceCountsBreakdown counts={counts} t={t} />
        </div>
      )}
      {!workflowKey && !hasWeeklyWorkflow && !hasAttendance && (
        <div style={sectionStyle}>
          <div style={{ color: labelColor }}>
            {t('workspace_status_not_taken') || 'Not yet'}
          </div>
        </div>
      )}
      <div style={sectionStyle}>
        <ClassSessionMetaBadges status={status} t={t} zoomFactor={1} hideNotesParticipation={hideNotesParticipation} hideParticipation={hideParticipation} />
      </div>
      {r.room && (
        <div style={sectionStyle}>
          <div style={{ color: labelColor }}>{r.room}</div>
        </div>
      )}
      {r.classId && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: labelColor, fontSize: '0.7rem', lineHeight: 1.25 }}>
            <FileBarChart size={12} color="#0ea5e9" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600, flex: 1 }}>{t('report_class_summary') || 'Class Summary'}</span>
            <ColoredTooltip title={`${t('report_class_summary') || 'Class Summary'} — ${t('export_excel') || 'Excel'}`} color="#43a047" placement="top">
            <IconButton
              size="small"
              style={{ padding: 1, color: '#43a047' }}
              onClick={(e) => {
                e.stopPropagation();
                exportClassSummaryReport({
                  classId: r.classId,
                  classInfo: {
                    className: r.classData?.nameEn || r.classData?.name || '',
                    classNameAr: r.classData?.nameAr || '',
                    subjectName: r.subjectName,
                    programName: r.classData?.program?.nameEn || '',
                    programNameAr: r.classData?.program?.nameAr || '',
                    term: welcomeContext?.academicTerm || '',
                  },
                  format: 'excel',
                  lang,
                  user,
                  reportDate: eventDate,
                }).catch((err) => console.error('[Calendar] class summary export failed:', err));
              }}
            >
              <FileSpreadsheet size={13} />
            </IconButton>
            </ColoredTooltip>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: labelColor, fontSize: '0.7rem', lineHeight: 1.25 }}>
            <FileBarChart size={12} color="#e53935" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600, flex: 1 }}>{t('report_class_deduction') || 'Deduction Report'}</span>
            <ColoredTooltip title={`${t('report_class_deduction') || 'Deduction Report'} — ${t('export_pdf') || 'PDF'}`} color="#e53935" placement="top">
            <IconButton
              size="small"
              style={{ padding: 1, color: '#e53935' }}
              onClick={(e) => {
                e.stopPropagation();
                exportClassDeductionReport({
                  classId: r.classId,
                  classInfo: {
                    className: r.classData?.nameEn || r.classData?.name || '',
                    classNameAr: r.classData?.nameAr || '',
                    subjectName: r.subjectName,
                    programName: r.classData?.program?.nameEn || '',
                    programNameAr: r.classData?.program?.nameAr || '',
                    term: welcomeContext?.academicTerm || '',
                  },
                  format: 'pdf',
                  lang,
                  user,
                  reportDate: eventDate,
                }).catch((err) => console.error('[Calendar] deduction report export failed:', err));
              }}
            >
              <FileText size={13} />
            </IconButton>
            </ColoredTooltip>
            <ColoredTooltip title={`${t('report_class_deduction') || 'Deduction Report'} — ${t('export_excel') || 'Excel'}`} color="#f59e0b" placement="top">
            <IconButton
              size="small"
              style={{ padding: 1, color: '#f59e0b' }}
              onClick={(e) => {
                e.stopPropagation();
                exportClassDeductionReport({
                  classId: r.classId,
                  classInfo: {
                    className: r.classData?.nameEn || r.classData?.name || '',
                    classNameAr: r.classData?.nameAr || '',
                    subjectName: r.subjectName,
                    programName: r.classData?.program?.nameEn || '',
                    programNameAr: r.classData?.program?.nameAr || '',
                    term: welcomeContext?.academicTerm || '',
                  },
                  format: 'excel',
                  lang,
                  user,
                  reportDate: eventDate,
                }).catch((err) => console.error('[Calendar] deduction report export failed:', err));
              }}
            >
              <FileSpreadsheet size={13} />
            </IconButton>
            </ColoredTooltip>
          </div>
        </div>
      )}
    </div>
  );
}

function DayWeekEvent({ event, t, lang = 'en', zoomFactor = 1, isDark = false, hideNotesParticipation = false, hideParticipation = false, onClassSessionClick = null }) {
  const r = event.resource || {};
  const iconSize = Math.round(12 * zoomFactor);
  const color = resolveAttendanceEventColor(r.status);
  const tooltipColor = isDark ? '#94a3b8' : '#64748b';
  const isRTL = lang === 'ar';
  return (
    <ColoredTooltip
      title={<AttendanceSummaryTooltip event={event} t={t} lang={lang} hideNotesParticipation={hideNotesParticipation} hideParticipation={hideParticipation} onClassSessionClick={onClassSessionClick} />}
      color={tooltipColor}
      borderColor={color}
      placement="top"
      arrow
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', direction: isRTL ? 'rtl' : 'ltr' }}>
        <div style={{ fontWeight: 600, fontSize: `${0.85 * zoomFactor}rem`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {event.title}
        </div>
        <EventStatusIndicators
          status={r.status}
          workflowKey={r.workflowKey}
          weeklyWorkflowKey={r.weeklyWorkflowKey}
          date={r.date}
          lang={lang}
          iconSize={iconSize}
          t={t}
          zoomFactor={zoomFactor}
          hideNotesParticipation={hideNotesParticipation}
          hideParticipation={hideParticipation}
          style={{ flexWrap: 'wrap' }}
        />
        {(r.instructor || r.room) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {r.instructor && (
              <ColoredTooltip title={`${t('class_instructor') || 'Instructor'}: ${r.instructor}`} color={isDark ? '#94a3b8' : '#64748b'} borderColor={isDark ? '#475569' : '#cbd5e1'} placement="top" arrow>
                <User size={iconSize} style={{ color: isDark ? '#94a3b8' : '#64748b', flexShrink: 0 }} />
              </ColoredTooltip>
            )}
            {r.room && (
              <ColoredTooltip title={`${t('room') || 'Room'}: ${r.room}`} color={isDark ? '#94a3b8' : '#64748b'} borderColor={isDark ? '#475569' : '#cbd5e1'} placement="top" arrow>
                <DoorOpen size={iconSize} style={{ color: isDark ? '#94a3b8' : '#64748b', flexShrink: 0 }} />
              </ColoredTooltip>
            )}
          </div>
        )}
        <AttendanceCountBar status={r.status} t={t} height={4} />
      </div>
    </ColoredTooltip>
  );
}

function MonthEvent({ event, t, lang = 'en', zoomFactor = 1, isDark = false, hideNotesParticipation = false, hideParticipation = false, onClassSessionClick = null }) {
  const r = event.resource || {};
  const color = resolveAttendanceEventColor(r.status);
  const iconSize = Math.round(10 * zoomFactor);
  const tooltipColor = isDark ? '#94a3b8' : '#64748b';
  const isRTL = lang === 'ar';
  return (
    <ColoredTooltip
      title={<AttendanceSummaryTooltip event={event} t={t} lang={lang} hideNotesParticipation={hideNotesParticipation} hideParticipation={hideParticipation} onClassSessionClick={onClassSessionClick} />}
      color={tooltipColor}
      borderColor={color}
      placement="top"
      arrow
    >
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1px 4px', borderLeft: `3px solid ${isDark ? '#475569' : '#cbd5e1'}` }}>
        <div style={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          fontSize: '0.7rem',
          fontWeight: 600,
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
          {event.title}
        </div>
        <EventStatusIndicators
          status={r.status}
          workflowKey={r.workflowKey}
          weeklyWorkflowKey={r.weeklyWorkflowKey}
          date={r.date}
          lang={lang}
          iconSize={iconSize}
          t={t}
          zoomFactor={zoomFactor}
          hideNotesParticipation={hideNotesParticipation}
          hideParticipation={hideParticipation}
          style={{ flexWrap: 'wrap' }}
        />
        <AttendanceCountBar status={r.status} t={t} height={2} />
      </div>
    </ColoredTooltip>
  );
}

function MonthDateHeader({ date, label, drilldownView, onDrillDown, dayEvents = [], t, lang = 'en', isDark = false, zoomFactor = 1 }) {
  const isRTL = lang === 'ar';
  const count = dayEvents.length;
  const subjects = [...new Set(dayEvents.map((e) => e.title).filter(Boolean))];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', direction: isRTL ? 'rtl' : 'ltr' }}>
      {drilldownView && onDrillDown ? (
        <button type="button" className="rbc-button-link" onClick={onDrillDown} style={{ color: 'inherit' }}>
          {label}
        </button>
      ) : (
        <span>{label}</span>
      )}
      {count > 0 && (
        <ColoredTooltip
          title={(
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontWeight: 700 }}>
                {count} {t('operations_board_calendar_subjects') || (count === 1 ? 'subject' : 'subjects')}
              </div>
              {subjects.map((s, i) => (
                <div key={i} style={{ fontSize: '0.75rem' }}>• {s}</div>
              ))}
            </div>
          )}
          color={isDark ? '#94a3b8' : '#64748b'}
          borderColor={isDark ? '#475569' : '#cbd5e1'}
          placement="top"
          arrow
        >
          <span
            className="rbc-day-subject-peek"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: `${0.65 * zoomFactor}rem`,
              fontWeight: 700,
              lineHeight: 1,
              color: count > 1 ? '#3b82f6' : (isDark ? '#94a3b8' : '#64748b'),
              backgroundColor: count > 1 ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)') : 'transparent',
              borderRadius: '8px',
              padding: '2px 5px',
              cursor: 'default',
            }}
          >
            <Layers size={Math.round(10 * zoomFactor)} />
            {count}
          </span>
        </ColoredTooltip>
      )}
    </div>
  );
}

const WORKING_DAY_CODES = new Set(['Sun', 'Mon', 'Tue', 'Wed', 'Thu']);

function isSameCalendarWeek(a, b) {
  const startA = new Date(a);
  startA.setDate(startA.getDate() - startA.getDay());
  startA.setHours(0, 0, 0, 0);
  const startB = new Date(b);
  startB.setDate(startB.getDate() - startB.getDay());
  startB.setHours(0, 0, 0, 0);
  return startA.getTime() === startB.getTime();
}

function WeekDayHeader({ label, t, zoomFactor = 1, date, hideWeekend = false }) {
  const { dayName, dateStr, isToday } = useMemo(() => {
    if (!label) return { dayName: '', dateStr: '', isToday: false };
    const match = label.match(/^(\S+)\s*(\d+)?/);
    if (!match) return { dayName: label, dateStr: '', isToday: false };
    const day = match[1] || '';
    const dayNum = match[2] || '';
    let datePart = '';
    let isToday = false;
    if (dayNum && date) {
      const anchor = date instanceof Date ? date : new Date(date);
      const weekStart = new Date(anchor);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
      if (dayIndex >= 0) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + dayIndex);
        datePart = `${String(dayDate.getDate()).padStart(2, '0')}/${String(dayDate.getMonth() + 1).padStart(2, '0')}`;
        const realToday = new Date();
        isToday = dayDate.getDate() === realToday.getDate()
          && dayDate.getMonth() === realToday.getMonth()
          && dayDate.getFullYear() === realToday.getFullYear();
        if (hideWeekend && !WORKING_DAY_CODES.has(day)) {
          isToday = false;
        }
      } else {
        datePart = String(dayNum).padStart(2, '0');
      }
    } else if (dayNum) {
      datePart = String(dayNum).padStart(2, '0');
    }
    return { dayName: day, dateStr: datePart, isToday };
  }, [label, date, hideWeekend]);
  return (
    <span style={{ fontSize: `${0.7 * zoomFactor}rem`, fontWeight: 600, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '4px', ...(isToday ? { color: '#3b82f6' } : {}) }}>
      {dayName}
      {dateStr && (
        <span style={{ fontSize: `${0.6 * zoomFactor}rem`, opacity: isToday ? 0.8 : 0.6, fontWeight: 500 }}>
          {dateStr}
        </span>
      )}
    </span>
  );
}

const locales = { en: enUS, ar: arSA };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function rangeToMillis(range) {
  if (!range?.start || !range?.end) return null;
  return { startMs: range.start.getTime(), endMs: range.end.getTime() };
}

function millisToRange(startMs, endMs) {
  return { start: new Date(startMs), end: new Date(endMs) };
}

function resolveVisibleRange(date, view) {
  const anchor = date instanceof Date ? date : new Date(date);
  if (view === 'month') {
    const monthStart = startOfMonth(anchor);
    const monthEnd = endOfMonth(anchor);
    return {
      start: dfStartOfWeek(monthStart, { weekStartsOn: 0 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
    };
  }
  if (view === 'week') {
    return {
      start: dfStartOfWeek(anchor, { weekStartsOn: 0 }),
      end: endOfWeek(anchor, { weekStartsOn: 0 }),
    };
  }
  const dayStart = new Date(anchor);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(anchor);
  dayEnd.setHours(23, 59, 59, 999);
  return { start: dayStart, end: dayEnd };
}

export default function BoardScheduleCalendar({
  selectedDate,
  onDateSelect,
  welcomeContext = null,
  onClassSessionClick,
  hideNotesParticipation = false,
  hideParticipation = false,
  embedded = false,
  expanded = false,
  onToggleExpand,
  viewMode = 'week',
  calendarView,
  onCalendarViewChange,
  selectedClassId = null,
  showAllClasses = false,
}) {
  const { t, lang } = useLang();
  const theme = useTheme();
  const calendarBoxRef = useRef(null);
  const [view, setView] = useState(() => calendarView || viewMode || 'week');
  const previousViewModeRef = useRef(viewMode);

  // Sync with an explicit calendarView URL param.
  useEffect(() => {
    if (calendarView && VIEW_OPTIONS.includes(calendarView)) {
      setView((prev) => (prev === calendarView ? prev : calendarView));
    }
  }, [calendarView]);

  // Keep the calendar view in sync with the top-level day/week toggle,
  // while letting a persisted month/agenda view survive the initial render.
  useEffect(() => {
    if (previousViewModeRef.current === viewMode) return;
    previousViewModeRef.current = viewMode;
    const target = viewMode || 'week';
    setView((prev) => {
      if (prev === target) return prev;
      onCalendarViewChange?.(target);
      return target;
    });
  }, [viewMode, onCalendarViewChange]);
  const [hideWeekend, setHideWeekend] = useState(() => {
    try {
      const stored = localStorage.getItem('calendarHideWeekend');
      if (stored === null) return true;
      return stored === '1';
    } catch { return true; }
  });
  const toggleWeekend = useCallback(() => {
    setHideWeekend((prev) => {
      const next = !prev;
      try { localStorage.setItem('calendarHideWeekend', next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);
  const isWorkingToday = new Date().getDay() <= 4;
  const [calendarZoom, setCalendarZoom] = useState(() => {
    try { return parseInt(localStorage.getItem('calendarZoom') || '100', 10); }
    catch { return 100; }
  });
  const handleZoomChange = useCallback((val) => {
    setCalendarZoom(val);
  }, []);
  const handleZoomCommit = useCallback((val) => {
    try { localStorage.setItem('calendarZoom', String(val)); } catch {}
  }, []);
  const zoomFactor = calendarZoom / 100;

  const selectedDateIso = useMemo(
    () => toIsoDate(selectedDate) || toIsoDate(new Date()),
    [selectedDate]
  );
  const currentDate = useMemo(() => toApiDate(selectedDateIso), [selectedDateIso]);
  const initialRange = useMemo(
    () => rangeToMillis(resolveVisibleRange(currentDate, 'week')),
    [selectedDateIso]
  );
  const [rangeStartMs, setRangeStartMs] = useState(initialRange?.startMs ?? Date.now());
  const [rangeEndMs, setRangeEndMs] = useState(initialRange?.endMs ?? Date.now());
  const [weeklySessions, setWeeklySessions] = useState([]);
  const [slotWindows, setSlotWindows] = useState([]);
  const [classIds, setClassIds] = useState([]);
  const selectedClassIdStr = useMemo(() => (selectedClassId ? String(selectedClassId) : null), [selectedClassId]);
  const selectedClassIdNum = useMemo(() => (selectedClassId ? parseInt(selectedClassId, 10) : null), [selectedClassId]);
  const visibleClassIds = useMemo(() => {
    if (showAllClasses || !selectedClassIdNum || !classIds.length) return classIds;
    return classIds.filter((id) => id === selectedClassIdNum);
  }, [classIds, selectedClassIdNum, showAllClasses]);
  const filteredSessions = useMemo(() => {
    if (showAllClasses || !selectedClassIdStr || !weeklySessions.length) return weeklySessions;
    return weeklySessions.filter((s) => String(s.classId) === selectedClassIdStr);
  }, [weeklySessions, selectedClassIdStr, showAllClasses]);
  const [statusByDate, setStatusByDate] = useState({});
  const [statusRefreshKey, setStatusRefreshKey] = useState(0);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const classIdsKey = useMemo(
    () => (welcomeContext?.classIds || []).join(','),
    [welcomeContext?.classIds]
  );

  const applyVisibleRange = useCallback((range) => {
    const next = rangeToMillis(range);
    if (!next) return;
    setRangeStartMs((prev) => (prev === next.startMs ? prev : next.startMs));
    setRangeEndMs((prev) => (prev === next.endMs ? prev : next.endMs));
  }, []);

  useEffect(() => {
    if (!welcomeContext?.programId || !welcomeContext?.termId) {
      setWeeklySessions([]);
      setSlotWindows([]);
      setClassIds([]);
      return undefined;
    }

    let cancelled = false;
    const loadSchedule = async () => {
      setScheduleLoading(true);
      try {
        const sources = await loadWeeklyScheduleSources({
          programId: welcomeContext.programId,
          academicTermId: welcomeContext.termId,
        });
        if (cancelled) return;

        const prepared = prepareWeeklyScheduleData({
          metadata: { programId: welcomeContext.programId },
          lang,
          t,
          sessions: sources.sessions,
          breakSessions: sources.breakSessions,
          instructorAvailability: sources.instructorAvailability,
          timeSlots: sources.timeSlots,
          attachSessionMeta: true,
        });

        const { windows } = buildSlotWindowsFromTimeSlots(sources.timeSlots);
        const ids = (sources.cohortClasses || []).map((c) => c.id).filter(Boolean);
        setWeeklySessions(extractWeeklyClassSessions(prepared.days));
        setSlotWindows(windows);
        setClassIds(ids.length ? ids : (welcomeContext.classIds || []));
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    };

    loadSchedule();
    return () => { cancelled = true; };
  }, [welcomeContext?.programId, welcomeContext?.termId, classIdsKey, lang]);

  useEffect(() => {
    applyVisibleRange(resolveVisibleRange(currentDate, view));
  }, [selectedDateIso, view, applyVisibleRange, currentDate]);

  const handleRangeChange = useCallback((range) => {
    applyVisibleRange(range);
  }, [applyVisibleRange]);

  const visibleRange = useMemo(
    () => millisToRange(rangeStartMs, rangeEndMs),
    [rangeStartMs, rangeEndMs]
  );

  useEffect(() => {
    if (!visibleClassIds.length || !filteredSessions.length) {
      setStatusByDate({});
      return undefined;
    }

    let cancelled = false;
    const loadStatuses = async () => {
      try {
        const range = millisToRange(rangeStartMs, rangeEndMs);
        const dates = collectDatesWithSessions(
          filteredSessions,
          range.start,
          range.end
        );
        const uniqueDates = [...new Set(dates)];
        if (!uniqueDates.length) {
          if (!cancelled) setStatusByDate({});
          return;
        }
        const results = await Promise.all(
          uniqueDates.map(async (iso) => {
            try {
              const result = await getScheduleStatus(visibleClassIds, toApiDate(iso));
              return { iso, data: result.success ? result.data : {} };
            } catch {
              return { iso, data: {} };
            }
          })
        );
        if (cancelled) return;
        const next = {};
        for (const { iso, data } of results) {
          next[iso] = data;
          // DEBUG: dump schedule-status payload per date
          console.log(`DEBUG BoardScheduleCalendar statusByDate[${iso}] =`, data);
        }
        setStatusByDate(next);
      } catch {
        if (!cancelled) setStatusByDate({});
      }
    };

    loadStatuses();
    return () => { cancelled = true; };
  }, [visibleClassIds, filteredSessions, rangeStartMs, rangeEndMs, statusRefreshKey]);

  useEffect(() => {
    const handleBoardEvent = (payload) => {
      const dateIso = toIsoDate(payload?.date);
      const classId = payload?.classId;
      if (!classId || !dateIso || !classIds.length) return;
      if (!classIds.some((id) => String(id) === String(classId))) return;
      const range = millisToRange(rangeStartMs, rangeEndMs);
      const start = toIsoDate(range.start);
      const end = toIsoDate(range.end);
      if (dateIso >= start && dateIso <= end) {
        setStatusRefreshKey((k) => k + 1);
      }
    };
    chatSocket.on('board:workflow_updated', handleBoardEvent);
    chatSocket.on('board:attendance_updated', handleBoardEvent);
    return () => {
      chatSocket.off('board:workflow_updated', handleBoardEvent);
      chatSocket.off('board:attendance_updated', handleBoardEvent);
    };
  }, [classIds, rangeStartMs, rangeEndMs]);

  const events = useMemo(
    () => buildClassCalendarEvents({
      weeklySessions: filteredSessions,
      slotWindows,
      rangeStart: visibleRange.start,
      rangeEnd: visibleRange.end,
      statusByDate,
    }),
    [filteredSessions, slotWindows, rangeStartMs, rangeEndMs, statusByDate]
  );
  // DEBUG: dump built events
  console.log('DEBUG BoardScheduleCalendar events =', events);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const iso = toIsoDate(ev.start);
      if (!iso) continue;
      (map[iso] = map[iso] || []).push(ev);
    }
    return map;
  }, [events]);

  const isDark = theme.palette.mode === 'dark';

  const eventStyleGetter = useMemo(() => (event) => {
    const now = Date.now();
    const isCurrent = event.start && event.end && now >= event.start.getTime() && now <= event.end.getTime();

    if (view === 'agenda') {
      return {
        style: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#e2e8f0' : '#1e293b',
          borderRadius: '6px',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderLeft: `4px solid ${isDark ? '#475569' : '#cbd5e1'}`,
          boxShadow: 'none',
          fontSize: `${0.8 * zoomFactor}rem`,
          padding: `${4 * zoomFactor}px ${8 * zoomFactor}px`,
          cursor: 'pointer',
          opacity: 1,
        },
      };
    }

    return {
      style: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#e2e8f0' : '#1e293b',
        borderRadius: '6px',
        border: isCurrent ? '2px solid rgb(14, 165, 233)' : `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        boxShadow: isCurrent ? '0 0 12px rgba(14, 165, 233, 0.65), inset 0 0 0 1px rgba(14,165,233,0.2)' : 'none',
        fontSize: `${0.8 * zoomFactor}rem`,
        padding: `${2 * zoomFactor}px ${6 * zoomFactor}px`,
        cursor: 'pointer',
        opacity: 1,
        animation: isCurrent ? 'inProgressPulse 2s ease-in-out infinite' : 'none',
      },
      className: isCurrent ? 'rbc-event-current' : undefined,
    };
  }, [zoomFactor, view, isDark]);

  const messages = useMemo(() => ({
    today: t('calendar_today') || 'Today',
    previous: t('calendar_previous') || 'Back',
    next: t('calendar_next') || 'Next',
    month: t('calendar_month') || 'Month',
    week: t('calendar_week') || 'Week',
    day: t('calendar_day') || 'Day',
    agenda: t('operations_board_calendar_agenda') || 'Agenda',
    date: t('calendar_date') || 'Date',
    time: t('calendar_time') || 'Time',
    event: t('calendar_event') || 'Event',
    noEventsInRange: t('operations_board_calendar_no_classes') || 'No classes in this range',
    showMore: (count) => `+${count} ${t('calendar_more') || 'more'}`,
  }), [t]);

  const handleSelectEvent = useCallback((event) => {
    const { classId, date, workflowKey } = event.resource || {};
    if (!classId || !date) return;
    onClassSessionClick?.({ classId, date, workflowKey });
  }, [onClassSessionClick]);

  const showInitialLoader = scheduleLoading && !filteredSessions.length;
  const missingContext = !welcomeContext?.programId || !welcomeContext?.termId;

  // Resizable day columns in week view
  useEffect(() => {
    if (view !== 'week') return;
    const container = calendarBoxRef.current;
    if (!container) return;

    const setupHandles = () => {
      const headerRow = container.querySelector('.rbc-time-header-content .rbc-row.rbc-time-header-cell');
      const timeContent = container.querySelector('.rbc-time-content');
      if (!headerRow || !timeContent) return;

      const headers = headerRow.querySelectorAll('.rbc-header');
      const daySlots = timeContent.querySelectorAll('.rbc-day-slot');
      const numCols = hideWeekend ? 5 : 7;

      // Remove existing handles
      container.querySelectorAll('.col-resize-handle').forEach(h => h.remove());

      for (let i = 0; i < numCols - 1; i++) {
        if (!headers[i] || !daySlots[i]) continue;

        const handle = document.createElement('div');
        handle.className = 'col-resize-handle';
        handle.style.cssText = 'position:absolute;top:0;bottom:0;width:5px;cursor:col-resize;z-index:10;background:transparent;transition:background 0.15s';

        const positionHandle = () => {
          const rect = headers[i].getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          handle.style.left = `${rect.right - containerRect.left - 2.5}px`;
        };
        positionHandle();

        handle.addEventListener('mouseenter', () => {
          handle.style.background = isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.3)';
        });
        handle.addEventListener('mouseleave', () => {
          handle.style.background = 'transparent';
        });

        handle.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX;
          const startWidth = headers[i].offsetWidth;
          const nextStartWidth = headers[i + 1]?.offsetWidth || 0;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
          handle.style.background = isDark ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.5)';

          const onMove = (ev) => {
            const delta = ev.clientX - startX;
            const newWidth = Math.max(50, startWidth + delta);
            const newNextWidth = Math.max(50, nextStartWidth - delta);
            headers[i].style.flex = `0 0 ${newWidth}px`;
            headers[i].style.maxWidth = `${newWidth}px`;
            if (daySlots[i]) {
              daySlots[i].style.flex = `0 0 ${newWidth}px`;
              daySlots[i].style.maxWidth = `${newWidth}px`;
            }
            if (headers[i + 1]) {
              headers[i + 1].style.flex = `0 0 ${newNextWidth}px`;
              headers[i + 1].style.maxWidth = `${newNextWidth}px`;
            }
            if (daySlots[i + 1]) {
              daySlots[i + 1].style.flex = `0 0 ${newNextWidth}px`;
              daySlots[i + 1].style.maxWidth = `${newNextWidth}px`;
            }
            positionHandle();
          };

          const onUp = () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            handle.style.background = 'transparent';
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
          };

          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        });

        container.appendChild(handle);
      }
    };

    // Delay to ensure calendar has rendered
    const timer = setTimeout(setupHandles, 100);

    return () => {
      clearTimeout(timer);
      container?.querySelectorAll('.col-resize-handle').forEach(h => h.remove());
    };
  }, [view, hideWeekend, calendarZoom, isDark, currentDate]);

  const calendarComponents = useMemo(() => ({
    toolbar: CalendarToolbar,
    agenda: {
      event: (props) => <AgendaEvent {...props} t={t} lang={lang} zoomFactor={zoomFactor} isDark={isDark} hideNotesParticipation={hideNotesParticipation} hideParticipation={hideParticipation} onClassSessionClick={onClassSessionClick} />,
    },
    month: {
      event: (props) => <MonthEvent {...props} t={t} lang={lang} zoomFactor={zoomFactor} isDark={isDark} hideNotesParticipation={hideNotesParticipation} hideParticipation={hideParticipation} onClassSessionClick={onClassSessionClick} />,
      dateHeader: (props) => (
        <MonthDateHeader
          {...props}
          dayEvents={eventsByDate[toIsoDate(props.date)] || []}
          t={t}
          lang={lang}
          isDark={isDark}
          zoomFactor={zoomFactor}
        />
      ),
    },
    day: {
      event: (props) => <DayWeekEvent {...props} t={t} lang={lang} zoomFactor={zoomFactor} isDark={isDark} hideNotesParticipation={hideNotesParticipation} hideParticipation={hideParticipation} onClassSessionClick={onClassSessionClick} />,
      header: (props) => <WeekDayHeader {...props} t={t} zoomFactor={zoomFactor} date={currentDate} hideWeekend={hideWeekend} />,
    },
    week: {
      event: (props) => <DayWeekEvent {...props} t={t} lang={lang} zoomFactor={zoomFactor} isDark={isDark} hideNotesParticipation={hideNotesParticipation} hideParticipation={hideParticipation} onClassSessionClick={onClassSessionClick} />,
      header: (props) => <WeekDayHeader {...props} t={t} zoomFactor={zoomFactor} date={currentDate} hideWeekend={hideWeekend} />,
    },
  }), [t, lang, zoomFactor, currentDate, isDark, hideWeekend, hideNotesParticipation, hideParticipation, eventsByDate, onClassSessionClick]);

  const toolbarContextValue = useMemo(() => ({
    t, lang, isDark, date: currentDate, hideWeekend, onToggleWeekend: toggleWeekend, zoom: calendarZoom, onZoomChange: handleZoomChange, onZoomCommit: handleZoomCommit, embedded, expanded, onToggleExpand,
  }), [t, lang, isDark, currentDate, hideWeekend, toggleWeekend, calendarZoom, handleZoomChange, handleZoomCommit, embedded, expanded, onToggleExpand]);

  return (
    <Stack spacing={1} data-testid="operations-board-schedule-calendar" sx={{ height: '100%', flex: 1, minHeight: 0 }}>
      {missingContext && (
        <Box sx={{ fontSize: '0.8125rem', color: 'text.secondary', px: 0.5 }}>
          {t('operations_board_calendar_need_context')}
        </Box>
      )}

      <Box
        ref={calendarBoxRef}
        sx={{
          position: 'relative',
          height: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          '& .rbc-calendar': {
            fontFamily: 'inherit',
            flex: 1,
            bgcolor: isDark ? '#0f172a' : '#fff',
            color: isDark ? '#e2e8f0' : '#1e293b',
          },
          '& .rbc-toolbar': {
            padding: '4px 8px',
            margin: 0,
          },
          '& .rbc-header, & .rbc-time-header-content, & .rbc-time-content, & .rbc-month-row': {
            borderColor: theme.palette.divider,
          },
          '& .rbc-off-range-bg': {
            bgcolor: isDark ? 'rgba(15,23,42,0.5)' : '#f8fafc',
          },
          '& .rbc-today': hideWeekend ? {
            backgroundColor: 'transparent !important',
          } : {
            bgcolor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
          },
          '& .rbc-working-today': {
            bgcolor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
          },
          ...(hideWeekend && !isWorkingToday ? {
            '& .rbc-current-time-indicator': {
              display: 'none !important',
            },
          } : {}),
          '& .rbc-time-column, & .rbc-label': {
            fontSize: `${0.7 * zoomFactor}rem !important`,
          },
          '& .rbc-time-view .rbc-row, & .rbc-month-row': {
            minHeight: `${64 * zoomFactor}px`,
          },
          '& .rbc-timeslot-group': {
            minHeight: `${96 * zoomFactor}px`,
          },
          '& .rbc-month-view .rbc-month-row': {
            minHeight: `${120 * zoomFactor}px`,
          },
          '& .rbc-show-more': {
            color: '#3b82f6',
            fontWeight: 700,
            fontSize: `${0.7 * zoomFactor}rem`,
            backgroundColor: 'transparent',
            padding: '0 4px',
            zIndex: 2,
          },
          '& .rbc-header': {
            fontSize: `${0.75 * zoomFactor}rem`,
            padding: '2px 4px',
            ...(lang === 'ar' ? {
              minWidth: '100px',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
            } : {}),
          },
          '& .rbc-time-header-content > .rbc-row.rbc-time-header-cell': {
            minHeight: 'auto',
            height: `${28 * zoomFactor}px`,
          },
          '& .rbc-time-header .rbc-button-link': {
            padding: 0,
          },
          '& .rbc-agenda-view table': {
            fontSize: `${0.8 * zoomFactor}rem`,
          },
          '& .rbc-day-slot .rbc-event': {
            border: 'none',
          },
          // RTL: align event text to the right
          ...(lang === 'ar' ? {
            '& .rbc-event, & .rbc-day-slot .rbc-background-event': {
              textAlign: 'right !important',
            },
          } : {}),
          '& .rbc-allday-cell, & .rbc-allday-row': {
            display: 'none !important',
          },
          '& .rbc-time-header-content': {
            borderBottom: 'none',
          },
          // Hide Fri (6th) and Sat (7th) columns in week/month view when hideWeekend is true
          ...(hideWeekend ? {
            '& .rbc-time-view .rbc-header:nth-child(6), & .rbc-time-view .rbc-header:nth-child(7)': {
              display: 'none !important',
            },
            '& .rbc-time-view .rbc-day-slot:nth-child(6), & .rbc-time-view .rbc-day-slot:nth-child(7)': {
              display: 'none !important',
            },
            '& .rbc-time-view .rbc-day-bg:nth-child(6), & .rbc-time-view .rbc-day-bg:nth-child(7)': {
              display: 'none !important',
            },
            '& .rbc-month-view .rbc-header:nth-child(6), & .rbc-month-view .rbc-header:nth-child(7)': {
              display: 'none !important',
            },
            '& .rbc-month-view .rbc-day-bg:nth-child(6), & .rbc-month-view .rbc-day-bg:nth-child(7)': {
              display: 'none !important',
            },
            '& .rbc-month-view .rbc-row-content .rbc-row .rbc-date-cell:nth-child(6), & .rbc-month-view .rbc-row-content .rbc-row .rbc-date-cell:nth-child(7)': {
              display: 'none !important',
            },
            '& .rbc-month-view .rbc-row-content .rbc-row .rbc-event-content:nth-child(6), & .rbc-month-view .rbc-row-content .rbc-row .rbc-event-content:nth-child(7)': {
              display: 'none !important',
            },
          } : {}),
          '& .rbc-agenda-view table.rbc-agenda-table': {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
          },
          '& .rbc-agenda-view .rbc-agenda-date-cell, & .rbc-agenda-view .rbc-agenda-time-cell': {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#e2e8f0' : '#1e293b',
            borderColor: theme.palette.divider,
          },
          '& .rbc-agenda-view .rbc-agenda-event-cell': {
            backgroundColor: `${isDark ? '#1e293b' : '#ffffff'} !important`,
            color: `${isDark ? '#e2e8f0' : '#1e293b'} !important`,
            borderColor: theme.palette.divider,
          },
          // Shadow for the selected day column in week view
          '& .rbc-time-view .rbc-day-slot.rbc-selected-day, & .rbc-time-view .rbc-header.rbc-selected-day': {
            boxShadow: `inset 0 0 0 2px ${isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.3)'}`,
            bgcolor: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)',
          },
          '& .rbc-agenda-view .rbc-agenda-content': {
            minHeight: '200px',
          },
          '& .rbc-agenda-view .rbc-agenda-content table tbody:empty + .rbc-agenda-empty-row, & .rbc-agenda-view .rbc-agenda-content table tbody tr.rbc-agenda-empty-row td': {
            padding: '3rem 1rem',
            textAlign: 'center',
            color: isDark ? '#94a3b8' : '#64748b',
            fontSize: '0.875rem',
            fontWeight: 500,
          },
        }}
      >
        {showInitialLoader && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isDark ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.55)',
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}
        <CalendarToolbarContext.Provider value={toolbarContextValue}>
          <BigCalendar
            localizer={localizer}
            culture={lang === 'ar' ? 'ar' : 'en'}
            rtl={lang === 'ar'}
            events={events}
            view={view}
            onView={(newView) => {
              setView(newView);
              onCalendarViewChange?.(newView);
            }}
            views={VIEW_OPTIONS}
            date={currentDate}
            onNavigate={(date) => {
              if (view === 'week') {
                const weekStart = dfStartOfWeek(date, { weekStartsOn: 0 });
                onDateSelect?.(toIsoDate(weekStart));
              } else {
                onDateSelect?.(toIsoDate(date));
              }
            }}
            onRangeChange={handleRangeChange}
            selectable
            onSelectSlot={({ start }) => onDateSelect?.(toIsoDate(start))}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            tooltipAccessor={null}
            dayPropGetter={(d) => {
              const classes = [];
              const sel = currentDate instanceof Date ? currentDate : new Date(currentDate);
              if (d.getDate() === sel.getDate() && d.getMonth() === sel.getMonth() && d.getFullYear() === sel.getFullYear()) {
                classes.push('rbc-selected-day');
              }
              const now = new Date();
              const isRealToday = d.getDate() === now.getDate()
                && d.getMonth() === now.getMonth()
                && d.getFullYear() === now.getFullYear();
              const isWorkingDay = d.getDay() >= 0 && d.getDay() <= 4;
              if (isRealToday && isWorkingDay) {
                classes.push('rbc-working-today');
              }
              return classes.length ? { className: classes.join(' ') } : {};
            }}
            messages={messages}
            components={calendarComponents}
            formats={{
              dayFormat: (date, culture, localizer) => localizer.format(date, lang === 'ar' ? 'EEEE dd MMMM' : 'EEE dd MMM', culture),
              weekdayFormat: (date, culture, localizer) => localizer.format(date, lang === 'ar' ? 'EEEE' : 'EEE', culture),
            }}
            popup
            step={30}
            timeslots={2}
            min={CALENDAR_MIN_TIME}
            max={CALENDAR_MAX_TIME}
            scrollToTime={CALENDAR_MIN_TIME}
            defaultView="week"
          />
        </CalendarToolbarContext.Provider>
      </Box>
    </Stack>
  );
}
