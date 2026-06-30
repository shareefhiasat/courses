import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Calendar from '@toast-ui/react-calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Select, Input } from '@ui';
import { 
  BookOpen, Users, DoorOpen, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Save, Trash2, Clock, MapPin, User, X
} from 'lucide-react';
import { getAllClasses } from '@services/business/classService.js';
import { getAllPrograms } from '@services/business/programService.js';
import { getAllSubjects } from '@services/business/subjectService.js';
import { getAllClassrooms } from '@services/business/classroomService.js';
import { getAllUsers } from '@services/business/userService.js';
import * as scheduledSessionService from '@services/business/scheduledSessionService.js';

const SchedulingCalendarPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const calendarRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  
  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarProgramFilter, setSidebarProgramFilter] = useState('');
  const [sidebarSubjectFilter, setSidebarSubjectFilter] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  
  // View state
  const [currentView, setCurrentView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [narrowWeekend, setNarrowWeekend] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);

  const hasPermission = isAdmin || isHR || isSuperAdmin;

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        classesResult,
        programsResult,
        subjectsResult,
        classroomsResult,
        instructorsResult,
        sessionsResult
      ] = await Promise.all([
        getAllClasses(),
        getAllPrograms(),
        getAllSubjects(),
        getAllClassrooms(),
        getAllUsers({ limit: 1000 }),
        scheduledSessionService.getAllScheduledSessions({ limit: 1000 })
      ]);

      if (classesResult.success) setClasses(classesResult.data || []);
      if (programsResult.success) setPrograms(programsResult.data || []);
      if (subjectsResult.success) setSubjects(subjectsResult.data || []);
      if (classroomsResult.success) setClassrooms(classroomsResult.data || []);
      if (instructorsResult.success) {
        const instructorUsers = (instructorsResult.data || []).filter(u => 
          u.roles?.some(r => r.name === 'instructor')
        );
        setInstructors(instructorUsers);
      }
      if (sessionsResult.success) setScheduledSessions(sessionsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter classes for sidebar
  const filteredClasses = useMemo(() => {
    let filtered = classes;

    if (sidebarProgramFilter) {
      filtered = filtered.filter(c => c.programId === parseInt(sidebarProgramFilter));
    }

    if (sidebarSubjectFilter) {
      filtered = filtered.filter(c => c.subjectId === parseInt(sidebarSubjectFilter));
    }

    if (sidebarSearch) {
      const search = sidebarSearch.toLowerCase();
      filtered = filtered.filter(c => 
        c.nameEn?.toLowerCase().includes(search) ||
        c.nameAr?.toLowerCase().includes(search) ||
        c.code?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [classes, sidebarProgramFilter, sidebarSubjectFilter, sidebarSearch]);

  // Convert scheduled sessions to react-big-calendar events
  const calendarEvents = useMemo(() => {
    return scheduledSessions.map(session => ({
      id: session.id,
      title: `${session.class?.code || 'Class'} - ${session.classroom?.code || 'Room'}`,
      start: new Date(session.startDateTime),
      end: new Date(session.endDateTime),
      backgroundColor: session.status === 'cancelled' ? '#ef4444' : 
                       session.status === 'completed' ? '#10b981' : '#3b82f6',
      borderColor: session.status === 'cancelled' ? '#dc2626' : 
                   session.status === 'completed' ? '#059669' : '#2563eb',
      resource: {
        session,
        classInfo: session.class,
        instructor: session.instructor,
        classroom: session.classroom
      }
    }));
  }, [scheduledSessions]);

  // Handle event click
  const handleEventClick = useCallback((event) => {
    const session = event.resource.session;
    
    const confirmDelete = window.confirm(
      `Session Details:\n\n` +
      `Class: ${session.class?.nameEn}\n` +
      `Instructor: ${session.instructor?.displayName}\n` +
      `Classroom: ${session.classroom?.nameEn}\n` +
      `Time: ${new Date(session.startDateTime).toLocaleString()} - ${new Date(session.endDateTime).toLocaleString()}\n\n` +
      `Click OK to DELETE this session`
    );

    if (confirmDelete) {
      handleDeleteSession(session.id);
    }
  }, []);

  // Handle event update (drag/resize)
  const handleEventUpdate = useCallback(async ({ event, start, end }) => {
    const session = event.resource.session;
    
    const updatePayload = {
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      updatedBy: user?.dbId
    };

    const result = await scheduledSessionService.updateScheduledSession(session.id, updatePayload);
    
    if (result.success) {
      toast.success('Session updated');
      loadData();
    } else {
      toast.error(result.error || 'Failed to update session');
    }
  }, [user, toast, loadData]);

  // Delete session
  const handleDeleteSession = useCallback(async (sessionId) => {
    const result = await scheduledSessionService.deleteScheduledSession(sessionId);
    
    if (result.success) {
      toast.success('Session deleted');
      loadData();
    } else {
      toast.error(result.error || 'Failed to delete session');
    }
  }, [toast, loadData]);

  // Handle drag from sidebar
  const handleClassDragStart = useCallback((e, classItem) => {
    e.dataTransfer.setData('classItem', JSON.stringify(classItem));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Handle drop on calendar
  const handleCalendarDrop = useCallback(async (e) => {
    e.preventDefault();
    const classItemData = e.dataTransfer.getData('classItem');
    if (!classItemData) return;

    const classItem = JSON.parse(classItemData);
    
    // Create session at current view date/time
    const startDateTime = new Date(currentDate);
    startDateTime.setHours(9, 0, 0, 0); // 9 AM
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour

    const instructorId = classItem.instructorId || instructors[0]?.id;
    const classroomId = classItem.classroomId || classrooms[0]?.id;

    if (!instructorId || !classroomId) {
      toast.error('Please assign an instructor and classroom to this class first');
      return;
    }

    const sessionData = {
      classId: classItem.id,
      instructorId,
      classroomId,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      status: 'scheduled',
      notes: `Scheduled via calendar`,
      createdBy: user?.dbId
    };

    const result = await scheduledSessionService.createScheduledSession(sessionData);
    
    if (result.success) {
      toast.success(`📅 ${classItem.nameEn} scheduled successfully!`);
      loadData();
    } else {
      toast.error(result.error || 'Failed to create session');
    }
  }, [currentDate, instructors, classrooms, user, toast, loadData]);

  const handleCalendarDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Custom event component
  const EventComponent = useCallback(({ event }) => {
    const { classInfo, classroom, instructor } = event.resource;
    return (
      <div style={{ padding: '2px 4px', fontSize: 'var(--font-size-xs)', height: '100%', overflow: 'hidden' }}>
        <div style={{ fontWeight: '600' }}>{classInfo?.code || 'Class'}</div>
        <div style={{ fontSize: '0.7rem' }}>{classroom?.code || ''}</div>
        <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>{instructor?.displayName?.split(' ')[0] || ''}</div>
      </div>
    );
  }, []);

  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          Access Denied
        </div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          You need admin or HR privileges to access scheduling.
        </div>
      </div>
    );
  }

  if (loading) {
    return <SimpleLoading message="Loading scheduling data..." />;
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem', height: 'calc(100vh - 100px)' }}>
      {/* Classes Sidebar */}
      {showSidebar && (
        <div style={{
          width: '280px',
          flexShrink: 0,
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
          borderRadius: '0.5rem',
          padding: '1rem',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: '600' }}>📚 Classes</h3>
            <button
              onClick={() => setShowSidebar(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}
            >
              ×
            </button>
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '1rem' }}>
            Drag classes to the calendar to schedule
          </p>

          {/* Filters */}
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Input
              type="text"
              placeholder="🔍 Search classes..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
            />
            <Select
              value={sidebarProgramFilter}
              onChange={e => {
                setSidebarProgramFilter(e.target.value);
                setSidebarSubjectFilter('');
              }}
              options={[{ value: '', label: 'All Programs' }, ...programs.map(p => ({ value: String(p.id), label: p.nameEn || p.code }))]}
            />
            <Select
              value={sidebarSubjectFilter}
              onChange={e => setSidebarSubjectFilter(e.target.value)}
              options={[{ value: '', label: 'All Subjects' }, ...subjects.filter(s => !sidebarProgramFilter || s.programId === parseInt(sidebarProgramFilter)).map(s => ({ value: String(s.id), label: s.nameEn || s.code }))]}
              disabled={!sidebarProgramFilter}
            />
          </div>

          {/* Classes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredClasses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af', fontSize: 'var(--font-size-sm)' }}>
                No classes found
              </div>
            ) : (
              filteredClasses.map(classItem => {
                const subject = subjects.find(s => s.id === classItem.subjectId);
                const program = programs.find(p => p.id === classItem.programId);
                const instructor = instructors.find(i => i.id === classItem.instructorId);
                const classroom = classrooms.find(c => c.id === classItem.classroomId);
                
                return (
                  <div
                    key={classItem.id}
                    draggable
                    onDragStart={(e) => handleClassDragStart(e, classItem)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                      borderRadius: '0.375rem',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      cursor: 'grab',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)', marginBottom: '0.25rem' }}>
                      📚 {classItem.nameEn || classItem.code}
                    </div>
                    {subject && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        📖 {subject.nameEn}
                      </div>
                    )}
                    {instructor && (
                      <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>
                        👤 {instructor.displayName || instructor.firstName}
                      </div>
                    )}
                    {classroom && (
                      <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>
                        🏫 {classroom.code}
                      </div>
                    )}
                    {(!instructor || !classroom) && (
                      <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.25rem' }}>
                        ⚠️ Missing {!instructor ? 'instructor' : 'classroom'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Main Calendar */}
      <div 
        style={{ 
          flex: 1, 
          minWidth: 0, 
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', 
          borderRadius: '0.5rem', 
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column'
        }}
        onDrop={handleCalendarDrop}
        onDragOver={handleCalendarDragOver}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                  border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500'
                }}
              >
                📚 Show Classes
              </button>
            )}
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              Class Scheduling Calendar
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentView(Views.DAY)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentView === Views.DAY ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb',
                color: currentView === Views.DAY ? '#ffffff' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              Day
            </button>
            <button
              onClick={() => setCurrentView(Views.WEEK)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentView === Views.WEEK ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb',
                color: currentView === Views.WEEK ? '#ffffff' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              Week
            </button>
            <button
              onClick={() => setCurrentView(Views.MONTH)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentView === Views.MONTH ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb',
                color: currentView === Views.MONTH ? '#ffffff' : 'inherit',
                border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              Month
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            view={currentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            onView={setCurrentView}
            onSelectEvent={handleEventClick}
            onEventDrop={handleEventUpdate}
            onEventResize={handleEventUpdate}
            resizable
            selectable
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            components={{
              event: EventComponent
            }}
            formats={{
              timeGutterFormat: 'HH:mm',
              dayHeaderFormat: (date, culture, localizer) => localizer.format(date, 'ddd DD', culture),
              eventTimeRangeFormat: ({ start, end }, culture, localizer) => 
                `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`
            }}
            step={60}
            timeslots={1}
            min={new Date(0, 0, 0, 7, 0, 0)}
            max={new Date(0, 0, 0, 23, 0, 0)}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.backgroundColor,
                borderColor: event.borderColor,
                color: '#ffffff'
              }
            })}
          />
        </div>
      </div>
    </div>
  );
};

export default SchedulingCalendarPage;
