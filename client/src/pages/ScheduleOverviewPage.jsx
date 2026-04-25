import React, { useState, useCallback, useMemo } from 'react';
import { info, error, warn, debug } from '@logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Card, CardBody, Select } from '@ui';
import { useScheduleCalendar } from '@hooks/useScheduleCalendar.js';
import { useConflictCheck } from '@hooks/useConflictCheck.js';
import Calendar from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

const DnDCalendar = withDragAndDrop(Calendar);

// Setup moment as the localizer
const localizer = moment.localizer(moment);

const ScheduleOverviewPage = () => {
  const { user, isAdmin, isInstructor, isSuperAdmin } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  
  const [view, setView] = useState('week');
  const [programFilter, setProgramFilter] = useState('');
  const [instructorFilter, setInstructorFilter] = useState('');
  const [classroomFilter, setClassroomFilter] = useState('');
  
  const {
    sessions,
    holidays,
    loading,
    error,
    currentDate,
    selectedDate,
    dateRange,
    sessionStats,
    goToPrevious,
    goToNext,
    goToToday,
    goToDate,
    setSelectedDate,
    loadSessions
  } = useScheduleCalendar({
    programId: programFilter ? parseInt(programFilter) : null,
    instructorUserId: instructorFilter ? parseInt(instructorFilter) : null,
    classroomId: classroomFilter ? parseInt(classroomFilter) : null,
    view,
    initialDate: new Date()
  });
  
  const { checkConflicts } = useConflictCheck();
  
  // Convert sessions to calendar events
  const calendarEvents = useMemo(() => {
    return sessions.map(session => {
      const timeSlot = session.timeSlot;
      const date = session.date;
      
      // Parse time from timeSlot (format: "HH:mm")
      const [startHours, startMinutes] = timeSlot?.startTime?.split(':') || ['09', '00'];
      const [endHours, endMinutes] = timeSlot?.endTime?.split(':') || ['10', '00'];
      
      // Create start and end dates
      const startDate = new Date(date);
      startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0);
      
      const endDate = new Date(date);
      endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0);
      
      return {
        id: session.id,
        title: isRTL 
          ? `${session.subject?.nameAr || session.subject?.nameEn} - ${session.classroom?.nameAr || session.classroom?.nameEn}`
          : `${session.subject?.nameEn} - ${session.classroom?.nameEn}`,
        start: startDate,
        end: endDate,
        resource: session,
        allDay: false,
        // Conflict indicator
        hasConflict: session.hasConflict || false
      };
    });
  }, [sessions, isRTL]);
  
  // Convert holidays to calendar events
  const holidayEvents = useMemo(() => {
    return holidays.map(holiday => {
      return {
        id: `holiday-${holiday.id}`,
        title: isRTL ? holiday.descriptionAr : holiday.descriptionEn,
        start: new Date(holiday.startDate),
        end: new Date(holiday.endDate),
        allDay: true,
        resource: holiday,
        isHoliday: true,
        backgroundColor: theme === 'dark' ? '#7c2d12' : '#fef3c7',
        borderColor: theme === 'dark' ? '#9a3412' : '#f59e0b'
      };
    });
  }, [holidays, isRTL, theme]);
  
  // Combine all events
  const allEvents = useMemo(() => {
    return [...calendarEvents, ...holidayEvents];
  }, [calendarEvents, holidayEvents]);
  
  // Event style getter for conflict highlighting
  const eventStyleGetter = useCallback((event) => {
    if (event.isHoliday) {
      const holidayBorderColor = theme === 'dark' ? '#9a3412' : '#f59e0b';
      return {
        style: {
          backgroundColor: theme === 'dark' ? '#7c2d12' : '#fef3c7',
          borderRadius: '4px',
          opacity: 0.8,
          color: theme === 'dark' ? '#fed7aa' : '#92400e',
          border: '1px solid ' + holidayBorderColor
        }
      };
    }
    
    if (event.hasConflict) {
      const conflictBorderColor = theme === 'dark' ? '#991b1b' : '#ef4444';
      return {
        style: {
          backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fecaca',
          borderRadius: '4px',
          opacity: 0.9,
          color: theme === 'dark' ? '#fca5a5' : '#dc2626',
          border: '1px solid ' + conflictBorderColor,
          borderLeft: '4px solid #dc2626'
        }
      };
    }
    
    // Default style
    const defaultBorderColor = theme === 'dark' ? '#1e3a8a' : '#2563eb';
    return {
      style: {
        backgroundColor: theme === 'dark' ? '#1e40af' : '#3b82f6',
        borderRadius: '4px',
        opacity: 0.9,
        color: '#ffffff',
        border: '1px solid ' + defaultBorderColor
      }
    };
  }, [theme]);
  
  // Handle event click
  const handleEventClick = useCallback((event) => {
    info('Event clicked:', event.resource);
    // TODO: Open event details modal
  }, []);
  
  // Handle slot click
  const handleSlotClick = useCallback((slotInfo) => {
    info('Slot clicked:', slotInfo);
    // TODO: Open create session modal
  }, []);
  
  // Handle event drop
  const handleEventDrop = useCallback(async ({ event, start, end }) => {
    info('Event dropped:', event, start, end);
    // TODO: Update session date/time
    toast.info(t('drag_to_reschedule') || 'Drag to reschedule sessions');
  }, [toast, t]);
  
  // Handle event resize
  const handleEventResize = useCallback(async ({ event, start, end }) => {
    info('Event resized:', event, start, end);
    // TODO: Update session duration
    toast.info(t('resize_to_change_duration') || 'Resize to change session duration');
  }, [toast, t]);
  
  // Custom toolbar
  const CustomToolbar = useCallback(({ label, onNavigate, onView }) => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button variant="secondary" onClick={() => onNavigate('PREV')}>
            {isRTL ? '→' : '←'}
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('TODAY')}>
            {t('today') || 'Today'}
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('NEXT')}>
            {isRTL ? '←' : '→'}
          </Button>
          <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>
            {label}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Select
            value={view}
            onChange={(e) => {
              setView(e.target.value);
              onView(e.target.value);
            }}
            options={[
              { value: 'month', label: t('month') || 'Month' },
              { value: 'week', label: t('week') || 'Week' },
              { value: 'day', label: t('day') || 'Day' },
              { value: 'agenda', label: t('agenda') || 'Agenda' }
            ]}
            style={{ minWidth: '120px' }}
          />
        </div>
      </div>
    );
  }, [view, t, isRTL]);
  
  // Check permissions
  const hasPermission = isAdmin || isInstructor || isSuperAdmin;
  
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          {t('access_denied') || 'Access Denied'}
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          {t('schedule_permission_required') || 'You need admin or instructor privileges to view the schedule.'}
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          {t('schedule_overview') || 'Schedule Overview'}
        </h1>
        <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          {t('schedule_overview_description') || 'View and manage class schedules'}
        </p>
      </div>
      
      {/* Filters */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                {t('program') || 'Program'}
              </label>
              <Select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                options={[
                  { value: '', label: t('all_programs') || 'All Programs' },
                  // TODO: Load programs from service
                  { value: '1', label: 'Program 1' },
                  { value: '2', label: 'Program 2' }
                ]}
              />
            </div>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                {t('instructor') || 'Instructor'}
              </label>
              <Select
                value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                options={[
                  { value: '', label: t('all_instructors') || 'All Instructors' },
                  // TODO: Load instructors from service
                  { value: '1', label: 'Instructor 1' },
                  { value: '2', label: 'Instructor 2' }
                ]}
              />
            </div>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                {t('classroom') || 'Classroom'}
              </label>
              <Select
                value={classroomFilter}
                onChange={(e) => setClassroomFilter(e.target.value)}
                options={[
                  { value: '', label: t('all_classrooms') || 'All Classrooms' },
                  // TODO: Load classrooms from service
                  { value: '1', label: 'Classroom 1' },
                  { value: '2', label: 'Classroom 2' }
                ]}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button onClick={() => {
                setProgramFilter('');
                setInstructorFilter('');
                setClassroomFilter('');
              }}>
                {t('clear_filters') || 'Clear Filters'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <Card>
          <CardBody>
            <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
              {t('total_sessions') || 'Total Sessions'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
              {sessionStats.total}
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
              {t('instructors') || 'Instructors'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
              {Object.keys(sessionStats.byInstructor).length}
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
              {t('classrooms') || 'Classrooms'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
              {Object.keys(sessionStats.byClassroom).length}
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.25rem' }}>
              {t('subjects') || 'Subjects'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
              {Object.keys(sessionStats.bySubject).length}
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Calendar */}
      <Card>
        <CardBody>
          {loading ? (
            <SimpleLoading />
          ) : error ? (
            <div style={{ padding: '1rem', color: 'red' }}>
              {error}
            </div>
          ) : (
            <div style={{ height: '600px', direction: isRTL ? 'rtl' : 'ltr' }}>
              <DnDCalendar
                localizer={localizer}
                events={allEvents}
                defaultView={view}
                view={view}
                date={currentDate}
                onNavigate={(date) => goToDate(date)}
                onView={(newView) => {
                  setView(newView);
                }}
                startAccessor="start"
                endAccessor="end"
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleEventClick}
                onSelectSlot={handleSlotClick}
                onDropFromOutside={handleEventDrop}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                resizable
                selectable
                components={{
                  toolbar: CustomToolbar
                }}
                messages={{
                  month: t('month') || 'Month',
                  week: t('week') || 'Week',
                  day: t('day') || 'Day',
                  agenda: t('agenda') || 'Agenda',
                  date: t('date') || 'Date',
                  time: t('time') || 'Time',
                  event: t('event') || 'Event',
                  noEventsInRange: t('no_events_in_range') || 'No events in this range',
                  showMore: (count) => t('show_more') || `+${count} more`
                }}
                style={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Legend */}
      <Card style={{ marginTop: '1.5rem' }}>
        <CardBody>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                backgroundColor: theme === 'dark' ? '#1e40af' : '#3b82f6',
                borderRadius: '4px'
              }} />
              <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                {t('normal_session') || 'Normal Session'}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fecaca',
                borderRadius: '4px',
                borderLeft: '4px solid #dc2626'
              }} />
              <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                {t('conflict_session') || 'Conflict Session'}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                backgroundColor: theme === 'dark' ? '#7c2d12' : '#fef3c7',
                borderRadius: '4px'
              }} />
              <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                {t('holiday') || 'Holiday'}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ScheduleOverviewPage;
