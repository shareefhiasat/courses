import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfWeek as dfStartOfWeek, endOfWeek } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import arSA from 'date-fns/locale/ar-SA';
import { Box, CircularProgress, Stack, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLang } from '@contexts/LangContext';
import { getScheduleStatus } from '@services/business/attendanceWorkspaceService.js';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService.js';
import { prepareWeeklyScheduleData } from '@services/export/official-reports/engine/prepareWeeklyScheduleData.js';
import { buildSlotWindowsFromTimeSlots } from '@services/export/official-reports/engine/buildWeeklyScheduleFromSessions.js';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import {
  SCHEDULE_CALENDAR_LEGEND,
  buildClassCalendarEvents,
  collectDatesWithSessions,
  extractWeeklyClassSessions,
  getWorkflowEventColor,
  isActionableClassSession,
  toApiDate,
  toIsoDate,
} from './boardClassCalendarUtils.js';
import {
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@components/ui/Calendar/Calendar.css';

const PURPLE_TOOLTIP = '#8b5cf6';

/** Visible hours in week/day time views: 05:00 – 23:45 */
const CALENDAR_MIN_TIME = new Date(1970, 0, 1, 5, 0, 0);
const CALENDAR_MAX_TIME = new Date(1970, 0, 1, 23, 45, 0);

const VIEW_ICONS = {
  month: CalendarRange,
  week: CalendarDays,
  day: CalendarIcon,
  agenda: List,
};

function CalendarToolbar({ label, view, views, onNavigate, onView, t, isDark }) {
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ColoredTooltip title={t('calendar_today') || 'Today'} color={PURPLE_TOOLTIP}>
          <IconButton size="small" onClick={() => onNavigate('TODAY')} sx={navBtnSx}>
            <CalendarCheck size={16} />
          </IconButton>
        </ColoredTooltip>
        <ColoredTooltip title={t('calendar_previous') || 'Previous'} color={PURPLE_TOOLTIP}>
          <IconButton size="small" onClick={() => onNavigate('PREV')} sx={navBtnSx}>
            <ChevronLeft size={16} />
          </IconButton>
        </ColoredTooltip>
        <ColoredTooltip title={t('calendar_next') || 'Next'} color={PURPLE_TOOLTIP}>
          <IconButton size="small" onClick={() => onNavigate('NEXT')} sx={navBtnSx}>
            <ChevronRight size={16} />
          </IconButton>
        </ColoredTooltip>
      </div>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {views.map((v) => {
          const Icon = VIEW_ICONS[v];
          if (!Icon) return null;
          const isActive = view === v;
          const labelMap = { month: t('calendar_month') || 'Month', week: t('calendar_week') || 'Week', day: t('calendar_day') || 'Day', agenda: t('operations_board_calendar_agenda') || 'Agenda' };
          return (
            <ColoredTooltip key={v} title={labelMap[v]} color={PURPLE_TOOLTIP}>
              <IconButton size="small" onClick={() => onView(v)} sx={viewBtnSx(isActive)}>
                <Icon size={16} />
              </IconButton>
            </ColoredTooltip>
          );
        })}
      </div>
    </div>
  );
}

function AgendaEvent({ event, t }) {
  const r = event.resource || {};
  const color = getWorkflowEventColor(r.workflowKey);
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      borderLeft: `4px solid ${color}`,
      paddingLeft: '8px',
    }}>
      <span style={{ fontWeight: 600 }}>{event.title}</span>
      {r.instructor && (
        <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>
          {t('class_instructor') || 'Instructor'}: {r.instructor}
        </span>
      )}
      {r.room && (
        <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>
          {t('room') || 'Room'}: {r.room}
        </span>
      )}
    </div>
  );
}

function DayWeekEvent({ event, t }) {
  const r = event.resource || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>
      <span style={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {event.title}
      </span>
      {r.instructor && (
        <span style={{ fontSize: '0.65rem', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {r.instructor}
        </span>
      )}
      {r.room && (
        <span style={{ fontSize: '0.65rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {r.room}
        </span>
      )}
    </div>
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
}) {
  const { t, lang } = useLang();
  const theme = useTheme();
  const [view, setView] = useState('week');
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

  const eventStyleGetter = useMemo(() => (event) => {
    const workflowKey = event.resource?.workflowKey;
    const color = getWorkflowEventColor(workflowKey);
    const actionable = isActionableClassSession(workflowKey);
    const now = Date.now();
    const isCurrent = event.start && event.end && now >= event.start.getTime() && now <= event.end.getTime();
    return {
      style: {
        backgroundColor: color,
        color: '#fff',
        borderRadius: '6px',
        border: isCurrent ? '2px solid rgb(14, 165, 233)' : `1px solid ${color}`,
        boxShadow: isCurrent ? '0 0 12px rgba(14, 165, 233, 0.65), inset 0 0 0 1px rgba(255,255,255,0.3)' : 'none',
        fontSize: '0.75rem',
        padding: '2px 6px',
        cursor: actionable ? 'pointer' : 'default',
        opacity: actionable ? 1 : 0.92,
        animation: isCurrent ? 'inProgressPulse 2s ease-in-out infinite' : 'none',
      },
      className: isCurrent ? 'rbc-event-current' : undefined,
    };
  }, []);

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
    if (!isActionableClassSession(workflowKey)) return;
    onClassSessionClick?.({ classId, date, workflowKey });
  }, [onClassSessionClick]);

  const showInitialLoader = scheduleLoading && !weeklySessions.length;
  const missingContext = !welcomeContext?.programId || !welcomeContext?.termId;

  const isDark = theme.palette.mode === 'dark';

  const calendarComponents = useMemo(() => ({
    toolbar: (props) => (
      <CalendarToolbar {...props} t={t} isDark={isDark} />
    ),
    agenda: {
      event: (props) => <AgendaEvent {...props} t={t} />,
    },
    day: {
      event: (props) => <DayWeekEvent {...props} t={t} />,
    },
    week: {
      event: (props) => <DayWeekEvent {...props} t={t} />,
    },
  }), [t, isDark]);

  return (
    <Stack spacing={1} data-testid="operations-board-schedule-calendar">
      {missingContext && (
        <Box sx={{ fontSize: '0.8125rem', color: 'text.secondary', px: 0.5 }}>
          {t('operations_board_calendar_need_context')}
        </Box>
      )}

      <Box
        sx={{
          position: 'relative',
          height: { xs: 560, md: 680 },
          borderRadius: 2,
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          '& .rbc-calendar': {
            fontFamily: 'inherit',
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
          '& .rbc-today': {
            bgcolor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
          },
          '& .rbc-time-column, & .rbc-label': {
            fontSize: '0.7rem !important',
          },
          '& .rbc-time-view .rbc-row, & .rbc-month-row': {
            minHeight: '64px',
          },
          '& .rbc-timeslot-group': {
            minHeight: '96px',
          },
          '& .rbc-month-view .rbc-month-row': {
            minHeight: '120px',
          },
          '& .rbc-day-slot .rbc-event': {
            border: 'none',
          },
          '& .rbc-allday-cell, & .rbc-time-header-content > .rbc-row:first-of-type': {
            display: 'none !important',
          },
          '& .rbc-time-header-content': {
            borderBottom: 'none',
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
        <BigCalendar
          localizer={localizer}
          culture={lang === 'ar' ? 'ar' : 'en'}
          events={events}
          view={view}
          onView={setView}
          views={VIEW_OPTIONS}
          date={currentDate}
          onNavigate={(date) => onDateSelect?.(date)}
          onRangeChange={handleRangeChange}
          selectable
          onSelectSlot={({ start }) => onDateSelect?.(start)}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          components={calendarComponents}
          popup
          step={30}
          timeslots={2}
          min={CALENDAR_MIN_TIME}
          max={CALENDAR_MAX_TIME}
          scrollToTime={CALENDAR_MIN_TIME}
          defaultView="week"
        />
      </Box>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '6px 12px',
          borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
        }}
        data-testid="operations-board-calendar-legend"
      >
        {SCHEDULE_CALENDAR_LEGEND.map((item) => {
          const color = getWorkflowEventColor(item.key);
          return (
            <span
              key={item.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: `${color}18`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
              {t(item.i18nKey)}
            </span>
          );
        })}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 500,
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            color: 'rgb(14, 165, 233)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgb(14, 165, 233)', boxShadow: '0 0 6px rgba(14, 165, 233, 0.55)' }} />
          {t('workspace_lecture_in_progress') || 'Current class'}
        </span>
      </div>
    </Stack>
  );
}
