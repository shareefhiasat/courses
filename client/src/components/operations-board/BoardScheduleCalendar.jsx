import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfWeek as dfStartOfWeek, endOfWeek } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import arSA from 'date-fns/locale/ar-SA';
import { Box, CircularProgress, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLang } from '@contexts/LangContext';
import { getScheduleStatus } from '@services/business/attendanceWorkspaceService.js';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService.js';
import { prepareWeeklyScheduleData } from '@services/export/official-reports/engine/prepareWeeklyScheduleData.js';
import { buildSlotWindowsFromTimeSlots } from '@services/export/official-reports/engine/buildWeeklyScheduleFromSessions.js';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
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
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: '#fff',
        borderRadius: '6px',
        border: 'none',
        fontSize: '0.75rem',
        padding: '2px 6px',
        cursor: actionable ? 'pointer' : 'default',
        opacity: actionable ? 1 : 0.92,
      },
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

  return (
    <Stack spacing={1.5} data-testid="operations-board-schedule-calendar">
      {missingContext && (
        <Box sx={{ fontSize: '0.8125rem', color: 'text.secondary', px: 0.5 }}>
          {t('operations_board_calendar_need_context')}
        </Box>
      )}
      {!missingContext && (
        <Box sx={{ fontSize: '0.8125rem', color: 'text.secondary', px: 0.5 }}>
          {t('operations_board_calendar_pick_hint')}
        </Box>
      )}

      <Box
        sx={{
          position: 'relative',
          height: { xs: 420, md: 520 },
          borderRadius: 2,
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          '& .rbc-calendar': {
            fontFamily: 'inherit',
            bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff',
            color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#1e293b',
          },
          '& .rbc-toolbar button': {
            color: 'inherit',
            borderColor: theme.palette.divider,
          },
          '& .rbc-toolbar button.rbc-active': {
            bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#1e293b',
            color: '#f8fafc',
          },
          '& .rbc-header, & .rbc-time-header-content, & .rbc-time-content, & .rbc-month-row': {
            borderColor: theme.palette.divider,
          },
          '& .rbc-off-range-bg': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.5)' : '#f8fafc',
          },
          '& .rbc-today': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
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
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.55)',
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
          popup
          step={15}
          timeslots={4}
          defaultView="week"
        />
      </Box>

      <div
        className={`${gridStyles.statusLegend} ${gridStyles.statusLegendBottom}`}
        style={{ justifyContent: 'flex-start' }}
        data-testid="operations-board-calendar-legend"
      >
        {SCHEDULE_CALENDAR_LEGEND.map((item) => (
          <div key={item.key} className={gridStyles.legendItem}>
            <span
              className={gridStyles.legendDot}
              style={{ background: getWorkflowEventColor(item.key) }}
            />
            <span>{t(item.i18nKey)}</span>
          </div>
        ))}
      </div>
    </Stack>
  );
}
