import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import Calendar from '@toast-ui/react-calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import { escapeHtml, createToastCalendarTemplates, getCalendarDayNames, formatSchedulingTimeOnly } from '../utils/schedulingDisplayUtils.js';

const WEEK_HEIGHT = 680;
const MONTH_HEIGHT = 720;

function formatEventTime(date, lang) {
  return formatSchedulingTimeOnly(date, lang, { hour12: false });
}

export default function SchedulingAvailabilityTimeline({
  events,
  currentDate,
  currentView,
  theme,
  lang,
  t,
  isActive = true,
  hideWeekends = false,
  layoutRevision = 0
}) {
  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const [calendarHeight, setCalendarHeight] = useState(
    currentView === 'month' ? MONTH_HEIGHT : WEEK_HEIGHT
  );
  const [mountKey, setMountKey] = useState(0);

  const targetHeight = currentView === 'month' ? MONTH_HEIGHT : WEEK_HEIGHT;

  const refreshCalendar = useCallback(() => {
    const cal = calendarRef.current?.getInstance();
    if (!cal) return;
    cal.clear();
    if (events.length) cal.createEvents(events);
    if (typeof cal.render === 'function') cal.render();
  }, [events]);

  const forceRender = useCallback(() => {
    const el = containerRef.current;
    const measured = el?.offsetHeight;
    const h = Math.max(measured || 0, targetHeight);
    setCalendarHeight((prev) => (prev === h ? prev : h));
    requestAnimationFrame(() => {
      const cal = calendarRef.current?.getInstance();
      if (!cal) return;
      cal.setDate(currentDate);
      if (typeof cal.render === 'function') cal.render();
      if (typeof cal.updateSize === 'function') cal.updateSize();
    });
  }, [currentDate, targetHeight]);

  useLayoutEffect(() => {
    if (!isActive) return undefined;
    setCalendarHeight(targetHeight);
    const timers = [0, 50, 150, 400].map((ms) => setTimeout(forceRender, ms));
    return () => timers.forEach(clearTimeout);
  }, [isActive, currentView, mountKey, layoutRevision, forceRender, targetHeight]);

  useEffect(() => {
    refreshCalendar();
    forceRender();
  }, [refreshCalendar, forceRender]);

  useEffect(() => {
    const cal = calendarRef.current?.getInstance();
    if (cal) {
      cal.changeView(currentView);
      cal.setDate(currentDate);
      forceRender();
    }
  }, [currentView, currentDate, forceRender]);

  useEffect(() => {
    if (!isActive) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(() => forceRender());
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    if (el.parentElement?.parentElement) ro.observe(el.parentElement.parentElement);
    window.addEventListener('resize', forceRender);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', forceRender);
    };
  }, [isActive, forceRender]);

  useEffect(() => {
    if (isActive) setMountKey((k) => k + 1);
  }, [isActive]);

  const timeTemplate = useMemo(() => ({
    time: (event) => {
      const title = event.title || '';
      const timeStr = formatEventTime(event.start, lang);
      const bookedLabel = event.raw?.type === 'booked' ? (t('booked_session') || 'Booked') : '';

      return `
        <div style="display:flex;flex-direction:column;line-height:1.25;padding:2px 3px;height:100%;overflow:hidden;">
          <span style="font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(title)}</span>
          <span style="font-size:10px;opacity:0.92;margin-top:2px;">${escapeHtml(timeStr)}</span>
          ${bookedLabel ? `<span style="font-size:9px;opacity:0.85;margin-top:1px;">${escapeHtml(bookedLabel)}</span>` : ''}
        </div>
      `;
    }
  }), [lang, t]);

  const weekDayNames = useMemo(
    () => getCalendarDayNames(t, hideWeekends),
    [t, hideWeekends, lang]
  );

  const calendarTemplates = useMemo(
    () => ({
      ...createToastCalendarTemplates(lang, t),
      ...timeTemplate
    }),
    [lang, t, timeTemplate]
  );

  return (
    <div
      className="scheduling-availability-timeline"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: '0 0 auto',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        minHeight: targetHeight,
        height: targetHeight,
        overflow: 'hidden'
      }}
    >
      <div
        ref={containerRef}
        key={`avail-cal-${mountKey}-${currentView}-${layoutRevision}-${lang}`}
        style={{
          flex: '0 0 auto',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          minHeight: targetHeight,
          height: targetHeight,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Calendar
          ref={calendarRef}
          height={`${calendarHeight}px`}
          view={currentView}
          isReadOnly
          useDetailPopup={false}
          useCreationPopup={false}
          template={calendarTemplates}
          week={{
            startDayOfWeek: 0,
            hourStart: 6,
            hourEnd: 24,
            eventView: ['time'],
            taskView: false,
            showNowIndicator: true,
            dayNames: weekDayNames,
            workweek: hideWeekends
          }}
          month={{
            startDayOfWeek: 0,
            isReadOnly: true,
            visibleEventCount: 3,
            workweek: hideWeekends,
            dayNames: weekDayNames
          }}
          theme={{
            common: {
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              dayName: { color: theme === 'dark' ? '#f3f4f6' : '#1f2937' },
              today: { color: '#10b981' }
            },
            week: {
              dayName: { color: theme === 'dark' ? '#f3f4f6' : '#1f2937' },
              today: { color: '#10b981' },
              timegrid: {
                horizontalLine: { border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` },
                verticalLine: { border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }
              }
            },
            month: {
              dayName: { color: theme === 'dark' ? '#f3f4f6' : '#1f2937' },
              holidayExceptThisMonth: { color: theme === 'dark' ? '#9ca3af' : '#6b7280' },
              dayExceptThisMonth: { color: theme === 'dark' ? '#6b7280' : '#9ca3af' }
            }
          }}
          css={`
            .scheduling-availability-timeline > div > .container {
              width: 100% !important;
              height: 100% !important;
              max-width: none !important;
            }
            .scheduling-availability-timeline .toastui-calendar-layout {
              width: 100% !important;
              height: 100% !important;
              min-width: 0 !important;
            }
            .scheduling-availability-timeline .toastui-calendar-layout,
            .scheduling-availability-timeline .toastui-calendar-layout * {
              max-width: 100%;
            }
            .scheduling-availability-timeline .toastui-calendar-time,
            .scheduling-availability-timeline .toastui-calendar-timegrid,
            .scheduling-availability-timeline .toastui-calendar-timegrid-scroll-area {
              min-height: 0 !important;
            }
            .scheduling-availability-timeline .toastui-calendar-column .toastui-calendar-events {
              margin-right: 0 !important;
            }
            .scheduling-availability-timeline .toastui-calendar-event-time {
              border-radius: 0 !important;
              margin-left: 0 !important;
              width: 100% !important;
              padding-bottom: 2px !important;
              box-sizing: content-box !important;
            }
            .scheduling-availability-timeline .toastui-calendar-event-time-content,
            .scheduling-availability-timeline .toastui-calendar-template-time {
              width: 100% !important;
              height: 100% !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }
          `}
        />
      </div>
      {events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          {t('no_availability_in_range')}
        </div>
      )}
    </div>
  );
}
