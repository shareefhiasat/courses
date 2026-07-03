/**
 * Calendar Component
 * 
 * Reusable calendar component wrapper around react-big-calendar
 * with custom styling and theming support.
 */

import React, { useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';

import { info, error, warn, debug } from '@services/utils/logger.js';import './Calendar.css';

const localizer = momentLocalizer(moment);

const Calendar = ({
  events = [],
  onSelectEvent,
  onSelectSlot,
  defaultView = 'week',
  views = ['month', 'week', 'day', 'agenda'],
  defaultDate = new Date(),
  style = {},
  className = '',
  eventStyleGetter,
  ...props
}) => {
  const { theme } = useTheme();
  const { lang } = useLang();

  const defaultEventStyleGetter = useMemo(() => {
    return (event) => {
      const backgroundColor = theme === 'dark' ? '#667eea' : '#800020';
      const borderColor = theme === 'dark' ? '#5a67d8' : '#600018';
      
      return {
        style: {
          backgroundColor,
          borderColor,
          borderRadius: '6px',
          border: `1px solid ${borderColor}`,
          color: 'white',
          fontSize: 'var(--font-size-sm)',
          padding: '2px 6px',
          cursor: 'pointer'
        }
      };
    };
  }, [theme]);

  const messages = useMemo(() => {
    return {
      date: t('calendar_date'),
      time: t('calendar_time'),
      event: t('calendar_event'),
      allDay: t('calendar_all_day'),
      week: t('calendar_week'),
      work_week: t('calendar_work_week'),
      day: t('calendar_day'),
      month: t('calendar_month'),
      previous: t('calendar_previous'),
      next: t('calendar_next'),
      yesterday: t('calendar_yesterday'),
      tomorrow: t('calendar_tomorrow'),
      today: t('calendar_today'),
      agenda: t('calendar_agenda'),
      noEventsInRange: t('calendar_no_events'),
      showMore: (total) => `+${total} ${t('calendar_more')}`
    };
  }, [lang, t]);

  return (
    <div 
      className={`calendar-wrapper ${theme === 'dark' ? 'calendar-dark' : 'calendar-light'} ${className}`}
      style={style}
    >
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={defaultView}
        views={views}
        defaultDate={defaultDate}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        eventPropGetter={eventStyleGetter || defaultEventStyleGetter}
        messages={messages}
        rtl={lang === 'ar'}
        style={{ height: '100%', minHeight: '600px' }}
        {...props}
      />
    </div>
  );
};

export default Calendar;
