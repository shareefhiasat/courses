import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfWeek as dfStartOfWeek, endOfWeek } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import arSA from 'date-fns/locale/ar-SA';
import { Box, CircularProgress, Stack, IconButton, Slider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLang } from '@contexts/LangContext';
import { getScheduleStatus } from '@services/business/attendanceWorkspaceService.js';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService.js';
import { prepareWeeklyScheduleData } from '@services/export/official-reports/engine/prepareWeeklyScheduleData.js';
import { buildSlotWindowsFromTimeSlots } from '@services/export/official-reports/engine/buildWeeklyScheduleFromSessions.js';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import ClassSessionMetaBadges from '@components/workspace/ClassSessionMetaBadges.jsx';
import { formatDate } from '@utils/date-formatter.js';
import {
  buildClassCalendarEvents,
  collectDatesWithSessions,
  extractWeeklyClassSessions,
  getWorkflowEventColor,
  getAttendanceCountsFromStatus,
  getWorkflowStatusLabel,
  resolveAttendanceEventColor,
  ATTENDANCE_COUNT_ITEMS,
  toApiDate,
  toIsoDate,
} from './boardClassCalendarUtils.js';
import { SCHEDULE_WORKFLOW_STATUS } from '@constants/workspaceStatusColors.js';
import {
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Eye,
  EyeOff,
  Workflow as WorkflowIcon,
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@components/ui/Calendar/Calendar.css';

const NEUTRAL_TOOLTIP = '#64748b';

/** Visible hours in week/day time views: 05:00 – 23:45 */
const CALENDAR_MIN_TIME = new Date(1970, 0, 1, 5, 0, 0);
const CALENDAR_MAX_TIME = new Date(1970, 0, 1, 23, 45, 0);

const VIEW_ICONS = {
  month: CalendarRange,
  week: CalendarDays,
  day: CalendarIcon,
  agenda: List,
};

const CalendarToolbarContext = React.createContext({ t: () => {}, isDark: false, date: null, hideWeekend: false, onToggleWeekend: null, zoom: 100, onZoomChange: null, onZoomCommit: null });

function CalendarToolbar({ label, view, views, onNavigate, onView }) {
  const { t, isDark, date, hideWeekend, onToggleWeekend, zoom, onZoomChange, onZoomCommit } = React.useContext(CalendarToolbarContext);
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
    const startStr = `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
    const endStr = `${String(weekEnd.getDate()).padStart(2, '0')}/${String(weekEnd.getMonth() + 1).padStart(2, '0')}`;
    const jan1 = new Date(weekStart.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((weekStart - jan1) / 86400000) + 1;
    const weekNum = Math.ceil(dayOfYear / 7);
    return `W${weekNum} ${startStr} - ${endStr}`;
  }, [view, date, label, t]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ColoredTooltip title={t('calendar_today') || 'Today'} color={NEUTRAL_TOOLTIP}>
          <IconButton size="small" onClick={() => onNavigate('TODAY')} sx={navBtnSx}>
            <CalendarCheck size={16} />
          </IconButton>
        </ColoredTooltip>
        <ColoredTooltip title={t('calendar_previous') || 'Previous'} color={NEUTRAL_TOOLTIP}>
          <IconButton size="small" onClick={() => onNavigate('PREV')} sx={navBtnSx}>
            <ChevronLeft size={16} />
          </IconButton>
        </ColoredTooltip>
        <ColoredTooltip title={t('calendar_next') || 'Next'} color={NEUTRAL_TOOLTIP}>
          <IconButton size="small" onClick={() => onNavigate('NEXT')} sx={navBtnSx}>
            <ChevronRight size={16} />
          </IconButton>
        </ColoredTooltip>
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6' }}>
        {weekLabel}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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

function AgendaEvent({ event, t, lang = 'en', zoomFactor = 1, isDark = false, lane = 'status', hideNotesParticipation = false }) {
  const r = event.resource || {};
  const color = lane === 'attendance'
    ? resolveAttendanceEventColor(r.status)
    : getWorkflowEventColor(r.workflowKey);
  const iconSize = Math.round(12 * zoomFactor);
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const tooltipColor = isDark ? '#94a3b8' : '#64748b';
  return (
    <ColoredTooltip
      title={<AttendanceSummaryTooltip event={event} t={t} lang={lang} lane={lane} hideNotesParticipation={hideNotesParticipation} />}
      color={tooltipColor}
      borderColor={color}
      placement="top"
      arrow
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        borderLeft: `4px solid ${color}`,
        paddingLeft: '8px',
        color: textColor,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 600, color: textColor, flex: 1 }}>{event.title}</span>
          <EventStatusIndicators
            status={r.status}
            workflowKey={r.workflowKey}
            iconSize={iconSize}
            t={t}
            zoomFactor={zoomFactor}
            hideNotesParticipation={hideNotesParticipation}
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
      </div>
    </ColoredTooltip>
  );
}

function AttendanceCountsBreakdown({ counts, t, fontSize = '0.7rem' }) {
  if (!counts) return null;
  const items = ATTENDANCE_COUNT_ITEMS
    .map((item) => ({ ...item, count: counts[item.key] || 0 }))
    .filter((item) => item.count > 0);
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item) => (
        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.color }} />
          <span style={{ fontSize, color: item.color, fontWeight: 600 }}>{item.count} {t(item.labelKey) || item.fallback}</span>
        </div>
      ))}
    </div>
  );
}

function EventStatusIndicators({ status, workflowKey, iconSize, t, zoomFactor = 1, hideNotesParticipation = false }) {
  const counts = getAttendanceCountsFromStatus(status);
  const items = ATTENDANCE_COUNT_ITEMS
    .map((item) => ({ ...item, count: counts?.[item.key] || 0 }))
    .filter((item) => item.count > 0);
  const hasWorkflow = workflowKey && workflowKey !== SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN;
  const workflowColor = getWorkflowEventColor(workflowKey);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
      {hasWorkflow && (
        <WorkflowIcon size={iconSize} style={{ color: workflowColor, flexShrink: 0 }} />
      )}
      {items.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', height: iconSize }}>
          {items.map((item, idx) => (
            <span
              key={item.key}
              style={{
                width: Math.max(6, iconSize - 2),
                height: Math.max(6, iconSize - 2),
                borderRadius: '50%',
                backgroundColor: item.color,
                marginLeft: idx > 0 ? -Math.max(2, iconSize / 4) : 0,
                border: '1px solid #fff',
                zIndex: items.length - idx,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
      <ClassSessionMetaBadges status={status} t={t} zoomFactor={zoomFactor} compact hideNotesParticipation={hideNotesParticipation} />
    </div>
  );
}

function AttendanceSummaryTooltip({ event, t, lang = 'en', lane = 'status', hideNotesParticipation = false }) {
  const r = event.resource || {};
  const status = r.status || {};
  const workflowKey = r.workflowKey;
  const counts = getAttendanceCountsFromStatus(status);
  const takenBy = status.takenBy || status.attendanceTakenBy || null;
  const takenAt = status.takenAt || status.attendanceTakenAt || null;
  const creatorName = status.createdBy || status.submittedBy || status.takenBy || status.attendanceTakenBy || null;
  const eventDate = r.date || (event.start ? toIsoDate(event.start) : null);

  const hasWorkflow = workflowKey && workflowKey !== SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN;
  const hasAttendance = Boolean(counts && (Object.values(counts).some((c) => c > 0) || status.hasAttendance));
  const workflowColor = getWorkflowEventColor(workflowKey);
  const workflowLabel = getWorkflowStatusLabel(workflowKey, t) || (t('workspace_status_not_taken') || 'Not yet');

  return (
    <div style={{ maxWidth: 260 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{event.title}</div>
      {hasWorkflow && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <WorkflowIcon size={14} style={{ color: workflowColor, flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: workflowColor }}>{workflowLabel}</span>
        </div>
      )}
      {hasAttendance && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: 3 }}>
            {t('attendance_summary') || 'Attendance Summary'}
          </div>
          <AttendanceCountsBreakdown counts={counts} t={t} />
        </div>
      )}
      {!hasWorkflow && !hasAttendance && (
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6 }}>
          {t('workspace_status_not_taken') || 'Not yet'}
        </div>
      )}
      <div style={{ marginBottom: 6 }}>
        <ClassSessionMetaBadges status={status} t={t} zoomFactor={1} hideNotesParticipation={hideNotesParticipation} />
      </div>
      {r.instructor && (
        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 2 }}>
          {t('class_instructor') || 'Instructor'}: {r.instructor}
        </div>
      )}
      {r.room && (
        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 2 }}>
          {t('room') || 'Room'}: {r.room}
        </div>
      )}
      {eventDate && (
        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 2 }}>
          {t('date') || 'Date'}: {formatDate(eventDate, lang)}
        </div>
      )}
      {creatorName && (
        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 2 }}>
          {t('creator') || 'Creator'}: {creatorName}
        </div>
      )}
      {takenBy && (
        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: 2 }}>
          {t('taken_by') || 'Taken by'}: {takenBy}
        </div>
      )}
      {takenAt && (
        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
          {t('taken_at') || 'Taken at'}: {new Date(takenAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function DayWeekEvent({ event, t, lang = 'en', zoomFactor = 1, isDark = false, lane = 'status', hideNotesParticipation = false }) {
  const r = event.resource || {};
  const iconSize = Math.round(12 * zoomFactor);
  const color = lane === 'attendance'
    ? resolveAttendanceEventColor(r.status)
    : getWorkflowEventColor(r.workflowKey);
  const tooltipColor = isDark ? '#94a3b8' : '#64748b';
  return (
    <ColoredTooltip
      title={<AttendanceSummaryTooltip event={event} t={t} lang={lang} lane={lane} hideNotesParticipation={hideNotesParticipation} />}
      color={tooltipColor}
      borderColor={color}
      placement="top"
      arrow
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontWeight: 600, fontSize: `${0.85 * zoomFactor}rem`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
            {event.title}
          </span>
          <EventStatusIndicators
            status={r.status}
            workflowKey={r.workflowKey}
            iconSize={iconSize}
            t={t}
            zoomFactor={zoomFactor}
            hideNotesParticipation={hideNotesParticipation}
          />
        </div>
        {r.instructor && (
          <span style={{ fontSize: `${0.75 * zoomFactor}rem`, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.instructor}
          </span>
        )}
        {r.room && (
          <span style={{ fontSize: `${0.75 * zoomFactor}rem`, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.room}
          </span>
        )}
      </div>
    </ColoredTooltip>
  );
}

function MonthEvent({ event, t, lang = 'en', zoomFactor = 1, isDark = false, lane = 'status', hideNotesParticipation = false }) {
  const r = event.resource || {};
  const color = lane === 'attendance'
    ? resolveAttendanceEventColor(r.status)
    : getWorkflowEventColor(r.workflowKey);
  const iconSize = Math.round(10 * zoomFactor);
  const tooltipColor = isDark ? '#94a3b8' : '#64748b';
  return (
    <ColoredTooltip
      title={<AttendanceSummaryTooltip event={event} t={t} lang={lang} lane={lane} hideNotesParticipation={hideNotesParticipation} />}
      color={tooltipColor}
      borderColor={color}
      placement="top"
      arrow
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        fontSize: '0.7rem',
        fontWeight: 600,
        padding: '1px 4px',
        borderLeft: `3px solid ${color}`,
      }}>
        <EventStatusIndicators
          status={r.status}
          workflowKey={r.workflowKey}
          iconSize={iconSize}
          t={t}
          zoomFactor={zoomFactor}
          hideNotesParticipation={hideNotesParticipation}
        />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{event.title}</span>
      </div>
    </ColoredTooltip>
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

const VIEW_OPTIONS = ['month', 'week', 'day', 'agenda'];

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
  lane = 'status',
  hideNotesParticipation = false,
}) {
  const { t, lang } = useLang();
  const theme = useTheme();
  const calendarBoxRef = useRef(null);
  const [view, setView] = useState('week');
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
  const [statusByDate, setStatusByDate] = useState({});
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
    if (!classIds.length || !weeklySessions.length) {
      setStatusByDate({});
      return undefined;
    }

    let cancelled = false;
    const loadStatuses = async () => {
      try {
        const range = millisToRange(rangeStartMs, rangeEndMs);
        const dates = collectDatesWithSessions(
          weeklySessions,
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
              const result = await getScheduleStatus(classIds, toApiDate(iso));
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
  }, [classIds, weeklySessions, rangeStartMs, rangeEndMs]);

  const events = useMemo(
    () => buildClassCalendarEvents({
      weeklySessions,
      slotWindows,
      rangeStart: visibleRange.start,
      rangeEnd: visibleRange.end,
      statusByDate,
    }),
    [weeklySessions, slotWindows, rangeStartMs, rangeEndMs, statusByDate]
  );
  // DEBUG: dump built events
  console.log('DEBUG BoardScheduleCalendar events =', events);

  const isDark = theme.palette.mode === 'dark';

  const eventStyleGetter = useMemo(() => (event) => {
    const workflowKey = event.resource?.workflowKey;
    const color = lane === 'attendance'
      ? resolveAttendanceEventColor(event.resource?.status)
      : getWorkflowEventColor(workflowKey);
    const now = Date.now();
    const isCurrent = event.start && event.end && now >= event.start.getTime() && now <= event.end.getTime();

    if (view === 'agenda') {
      return {
        style: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#e2e8f0' : '#1e293b',
          borderRadius: '6px',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderLeft: `4px solid ${color}`,
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
        backgroundColor: isDark ? `${color}1F` : `${color}14`,
        color: isDark ? '#e2e8f0' : '#1e293b',
        borderRadius: '6px',
        border: isCurrent ? '2px solid rgb(14, 165, 233)' : `1px solid ${color}4D`,
        boxShadow: isCurrent ? '0 0 12px rgba(14, 165, 233, 0.65), inset 0 0 0 1px rgba(14,165,233,0.2)' : 'none',
        fontSize: `${0.8 * zoomFactor}rem`,
        padding: `${2 * zoomFactor}px ${6 * zoomFactor}px`,
        cursor: 'pointer',
        opacity: 1,
        animation: isCurrent ? 'inProgressPulse 2s ease-in-out infinite' : 'none',
      },
      className: isCurrent ? 'rbc-event-current' : undefined,
    };
  }, [zoomFactor, view, isDark, lane]);

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
  }), [t]);

  const handleSelectEvent = useCallback((event) => {
    const { classId, date, workflowKey } = event.resource || {};
    if (!classId || !date) return;
    onClassSessionClick?.({ classId, date, workflowKey });
  }, [onClassSessionClick]);

  const showInitialLoader = scheduleLoading && !weeklySessions.length;
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
      event: (props) => <AgendaEvent {...props} t={t} lang={lang} zoomFactor={zoomFactor} isDark={isDark} lane={lane} hideNotesParticipation={hideNotesParticipation} />,
    },
    month: {
      event: (props) => <MonthEvent {...props} t={t} lang={lang} zoomFactor={zoomFactor} isDark={isDark} lane={lane} hideNotesParticipation={hideNotesParticipation} />,
    },
    day: {
      event: (props) => <DayWeekEvent {...props} t={t} lang={lang} zoomFactor={zoomFactor} isDark={isDark} lane={lane} hideNotesParticipation={hideNotesParticipation} />,
      header: (props) => <WeekDayHeader {...props} t={t} zoomFactor={zoomFactor} date={currentDate} hideWeekend={hideWeekend} />,
    },
    week: {
      event: (props) => <DayWeekEvent {...props} t={t} lang={lang} zoomFactor={zoomFactor} isDark={isDark} lane={lane} hideNotesParticipation={hideNotesParticipation} />,
      header: (props) => <WeekDayHeader {...props} t={t} zoomFactor={zoomFactor} date={currentDate} hideWeekend={hideWeekend} />,
    },
  }), [t, lang, zoomFactor, currentDate, isDark, hideWeekend, lane, hideNotesParticipation]);

  const toolbarContextValue = useMemo(() => ({
    t, isDark, date: currentDate, hideWeekend, onToggleWeekend: toggleWeekend, zoom: calendarZoom, onZoomChange: handleZoomChange, onZoomCommit: handleZoomCommit,
  }), [t, isDark, currentDate, hideWeekend, toggleWeekend, calendarZoom, handleZoomChange, handleZoomCommit]);

  return (
    <Stack spacing={1} data-testid="operations-board-schedule-calendar">
      {missingContext && (
        <Box sx={{ fontSize: '0.8125rem', color: 'text.secondary', px: 0.5 }}>
          {t('operations_board_calendar_need_context')}
        </Box>
      )}

      <Box
        ref={calendarBoxRef}
        sx={{
          position: 'relative',
          height: { xs: 560, md: 680 },
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
          '& .rbc-header': {
            fontSize: `${0.75 * zoomFactor}rem`,
            padding: '2px 4px',
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
            events={events}
            view={view}
            onView={setView}
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
              dayFormat: (date, culture, localizer) => localizer.format(date, 'EEE dd', culture),
              weekdayFormat: (date, culture, localizer) => localizer.format(date, 'EEE', culture),
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
