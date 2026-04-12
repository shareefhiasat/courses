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
          fontSize: '0.875rem',
          padding: '2px 6px',
          cursor: 'pointer'
        }
      };
    };
  }, [theme]);

  const messages = useMemo(() => {
    if (lang === 'ar') {
      return {
        date: 'التاريخ',
        time: 'الوقت',
        event: 'الحدث',
        allDay: 'طوال اليوم',
        week: 'أسبوع',
        work_week: 'أسبوع العمل',
        day: 'يوم',
        month: 'شهر',
        previous: 'السابق',
        next: 'التالي',
        yesterday: 'أمس',
        tomorrow: 'غداً',
        today: 'اليوم',
        agenda: 'جدول الأعمال',
        noEventsInRange: 'لا توجد أحداث في هذا النطاق',
        showMore: (total) => `+${total} المزيد`
      };
    }
    return {
      date: 'Date',
      time: 'Time',
      event: 'Event',
      allDay: 'All Day',
      week: 'Week',
      work_week: 'Work Week',
      day: 'Day',
      month: 'Month',
      previous: 'Previous',
      next: 'Next',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
      today: 'Today',
      agenda: 'Agenda',
      noEventsInRange: 'No events in this range',
      showMore: (total) => `+${total} more`
    };
  }, [lang]);

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
