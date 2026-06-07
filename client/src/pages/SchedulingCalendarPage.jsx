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
  Save, Trash2, Clock, MapPin, User, X, Edit, BarChart3
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
  
  // Stats
  const [showStats, setShowStats] = useState(true);

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

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

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

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSessions = scheduledSessions.length;
    const uniqueClassrooms = new Set(scheduledSessions.map(s => s.classroomId)).size;
    const uniqueInstructors = new Set(scheduledSessions.map(s => s.instructorId)).size;
    const scheduledCount = scheduledSessions.filter(s => s.status === 'scheduled').length;
    const completedCount = scheduledSessions.filter(s => s.status === 'completed').length;
    const cancelledCount = scheduledSessions.filter(s => s.status === 'cancelled').length;

    return {
      totalSessions,
      uniqueClassrooms,
      uniqueInstructors,
      scheduledCount,
      completedCount,
      cancelledCount
    };
  }, [scheduledSessions]);

  // Convert scheduled sessions to TOAST UI Calendar events
  const calendarEvents = useMemo(() => {
    return scheduledSessions.map(session => ({
      id: String(session.id),
      calendarId: '1',
      title: `${session.class?.code || 'Class'}`,
      body: `${session.classroom?.code || 'Room'} - ${session.instructor?.displayName?.split(' ')[0] || 'Instructor'}`,
      category: 'time',
      start: new Date(session.startDateTime),
      end: new Date(session.endDateTime),
      backgroundColor: session.status === 'cancelled' ? '#ef4444' : 
                       session.status === 'completed' ? '#10b981' : '#3b82f6',
      borderColor: session.status === 'cancelled' ? '#dc2626' : 
                   session.status === 'completed' ? '#059669' : '#2563eb',
      color: '#ffffff',
      isReadOnly: false,
      raw: {
        session,
        classInfo: session.class,
        instructor: session.instructor,
        classroom: session.classroom
      }
    }));
  }, [scheduledSessions]);

  // Calendar calendars config
  const calendars = useMemo(() => [
    {
      id: '1',
      name: 'Classes',
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      dragBackgroundColor: '#3b82f6'
    }
  ], []);

  // Handle event click
  const onClickEvent = useCallback((eventInfo) => {
    const { event, nativeEvent } = eventInfo;
    const session = event.raw.session;
    
    // Show detail popup (TOAST UI handles this automatically with useDetailPopup)
    // But we can also show custom context menu on right-click
  }, []);

  // Handle event right-click
  const onBeforeCreateEvent = useCallback((eventData) => {
    // This is for creating new events - we'll handle via drag & drop from sidebar
    return eventData;
  }, []);

  // Handle event update (drag/resize)
  const onBeforeUpdateEvent = useCallback(async (updateData) => {
    const { event, changes } = updateData;
    const session = event.raw.session;
    
    const updatePayload = {
      updatedBy: user?.dbId
    };

    if (changes.start) {
      updatePayload.startDateTime = changes.start.toISOString();
    }
    if (changes.end) {
      updatePayload.endDateTime = changes.end.toISOString();
    }

    const result = await scheduledSessionService.updateScheduledSession(session.id, updatePayload);
    
    if (result.success) {
      toast.success('Session updated');
      loadData();
    } else {
      toast.error(result.error || 'Failed to update session');
    }
  }, [user, toast, loadData]);

  // Handle event delete
  const onBeforeDeleteEvent = useCallback(async (eventData) => {
    const { event } = eventData;
    const session = event.raw.session;
    
    const result = await scheduledSessionService.deleteScheduledSession(session.id);
    
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
      toast.success(`${classItem.nameEn} scheduled successfully!`);
      loadData();
    } else {
      toast.error(result.error || 'Failed to create session');
    }
  }, [currentDate, instructors, classrooms, user, toast, loadData]);

  const handleCalendarDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Navigation handlers
  const handleToday = useCallback(() => {
    const cal = calendarRef.current?.getInstance();
    if (cal) {
      cal.today();
      setCurrentDate(new Date());
    }
  }, []);

  const handlePrev = useCallback(() => {
    const cal = calendarRef.current?.getInstance();
    if (cal) {
      cal.prev();
      const newDate = cal.getDate();
      setCurrentDate(new Date(newDate));
    }
  }, []);

  const handleNext = useCallback(() => {
    const cal = calendarRef.current?.getInstance();
    if (cal) {
      cal.next();
      const newDate = cal.getDate();
      setCurrentDate(new Date(newDate));
    }
  }, []);

  const handleViewChange = useCallback((view) => {
    const cal = calendarRef.current?.getInstance();
    if (cal) {
      cal.changeView(view);
      setCurrentView(view);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          You need admin or HR privileges to access scheduling.
        </div>
      </div>
    );
  }

  if (loading) {
    return <SimpleLoading message="Loading scheduling data..." />;
  }

  const containerStyle = isFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem'
  } : {
    display: 'flex',
    gap: '1rem',
    padding: '1.5rem',
    height: 'calc(100vh - 100px)'
  };

  return (
    <div style={containerStyle}>
      {/* Statistics Bar */}
      {showStats && !isFullscreen && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: 1,
            minWidth: '200px',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CalendarIcon size={20} color="#3b82f6" />
              <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Total Sessions</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{stats.totalSessions}</div>
            <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af', marginTop: '0.25rem' }}>
              {stats.scheduledCount} scheduled, {stats.completedCount} completed
            </div>
          </div>

          <div style={{
            flex: 1,
            minWidth: '200px',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <DoorOpen size={20} color="#10b981" />
              <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Classrooms in Use</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{stats.uniqueClassrooms}</div>
            <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af', marginTop: '0.25rem' }}>
              out of {classrooms.length} total
            </div>
          </div>

          <div style={{
            flex: 1,
            minWidth: '200px',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Users size={20} color="#f59e0b" />
              <span style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Active Instructors</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{stats.uniqueInstructors}</div>
            <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af', marginTop: '0.25rem' }}>
              out of {instructors.length} total
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Classes Sidebar */}
        {showSidebar && !isFullscreen && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} />
                <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Classes</h3>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={18} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '1rem' }}>
              Drag classes to the calendar to schedule
            </p>

            {/* Filters */}
            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Input
                type="text"
                placeholder="Search classes..."
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
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af', fontSize: '0.875rem' }}>
                  No classes found
                </div>
              ) : (
                filteredClasses.map(classItem => {
                  const subject = subjects.find(s => s.id === classItem.subjectId);
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <BookOpen size={14} />
                        {classItem.nameEn || classItem.code}
                      </div>
                      {subject && (
                        <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginLeft: '1.25rem' }}>
                          {subject.nameEn}
                        </div>
                      )}
                      {instructor && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af', marginLeft: '1.25rem' }}>
                          <User size={12} />
                          {instructor.displayName || instructor.firstName}
                        </div>
                      )}
                      {classroom && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af', marginLeft: '1.25rem' }}>
                          <DoorOpen size={12} />
                          {classroom.code}
                        </div>
                      )}
                      {(!instructor || !classroom) && (
                        <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.25rem', marginLeft: '1.25rem' }}>
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
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {!showSidebar && !isFullscreen && (
                <button
                  onClick={() => setShowSidebar(true)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <BookOpen size={16} />
                </button>
              )}
              
              <button onClick={handlePrev} style={{ padding: '0.5rem', backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb', border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, borderRadius: '0.375rem', cursor: 'pointer' }}>
                <ChevronLeft size={16} />
              </button>
              
              <button onClick={handleToday} style={{ padding: '0.5rem 1rem', backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb', border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
                Today
              </button>
              
              <button onClick={handleNext} style={{ padding: '0.5rem', backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb', border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, borderRadius: '0.375rem', cursor: 'pointer' }}>
                <ChevronRight size={16} />
              </button>

              <h1 style={{ fontSize: '1.25rem', fontWeight: '600', marginLeft: '0.5rem' }}>
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h1>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => handleViewChange('day')} style={{ padding: '0.5rem 1rem', backgroundColor: currentView === 'day' ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb', color: currentView === 'day' ? '#ffffff' : 'inherit', border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                Day
              </button>
              <button onClick={() => handleViewChange('week')} style={{ padding: '0.5rem 1rem', backgroundColor: currentView === 'week' ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb', color: currentView === 'week' ? '#ffffff' : 'inherit', border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                Week
              </button>
              <button onClick={() => handleViewChange('month')} style={{ padding: '0.5rem 1rem', backgroundColor: currentView === 'month' ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb', color: currentView === 'month' ? '#ffffff' : 'inherit', border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                Month
              </button>
              
              <button onClick={() => setHideWeekends(!hideWeekends)} style={{ padding: '0.5rem 1rem', backgroundColor: hideWeekends ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb', color: hideWeekends ? '#ffffff' : 'inherit', border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                Hide Weekends
              </button>
              
              <button onClick={toggleFullscreen} style={{ padding: '0.5rem', backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb', border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, borderRadius: '0.375rem', cursor: 'pointer' }}>
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <Calendar
              ref={calendarRef}
              height="100%"
              view={currentView}
              week={{
                startDayOfWeek: hideWeekends ? 1 : 0,
                dayNames: hideWeekends ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                narrowWeekend: narrowWeekend,
                workweek: hideWeekends,
                hourStart: 7,
                hourEnd: 23
              }}
              month={{
                startDayOfWeek: hideWeekends ? 1 : 0,
                narrowWeekend: narrowWeekend,
                workweek: hideWeekends
              }}
              calendars={calendars}
              events={calendarEvents}
              useDetailPopup={true}
              useFormPopup={true}
              onClickEvent={onClickEvent}
              onBeforeCreateEvent={onBeforeCreateEvent}
              onBeforeUpdateEvent={onBeforeUpdateEvent}
              onBeforeDeleteEvent={onBeforeDeleteEvent}
              theme={{
                common: {
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  holiday: {
                    color: '#ef4444'
                  },
                  saturday: {
                    color: '#3b82f6'
                  },
                  dayName: {
                    color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                  },
                  today: {
                    color: '#10b981'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulingCalendarPage;
