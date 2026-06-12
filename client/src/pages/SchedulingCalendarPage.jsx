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
import * as schedulingService from '@services/business/schedulingService.js';

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
  const [viewMode, setViewMode] = useState('all'); // 'all', 'instructor', 'room'
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentView, setCurrentView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [narrowWeekend, setNarrowWeekend] = useState(false);
  
  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(null);
  const [recurrenceCount, setRecurrenceCount] = useState(null);
  const [timesPerDay, setTimesPerDay] = useState([]);
  
  // Conflict detection state
  const [validationResult, setValidationResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalClassItem, setModalClassItem] = useState(null);
  const [modalStartDateTime, setModalStartDateTime] = useState(null);
  const [modalEndDateTime, setModalEndDateTime] = useState(null);
  const [modalInstructorId, setModalInstructorId] = useState(null);
  const [modalClassroomId, setModalClassroomId] = useState(null);
  
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
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const totalSessions = scheduledSessions.length;
    const uniqueClassrooms = new Set(scheduledSessions.map(s => s.classroomId)).size;
    const uniqueInstructors = new Set(scheduledSessions.map(s => s.instructorId)).size;
    const uniqueClasses = new Set(scheduledSessions.map(s => s.classId)).size;
    
    const scheduledCount = scheduledSessions.filter(s => s.status === 'scheduled').length;
    const completedCount = scheduledSessions.filter(s => s.status === 'completed').length;
    
    // This week's sessions
    const thisWeekSessions = scheduledSessions.filter(s => {
      const sessionDate = new Date(s.startDateTime);
      return sessionDate >= now && sessionDate <= oneWeekFromNow;
    }).length;
    
    // Next upcoming session
    const upcomingSessions = scheduledSessions
      .filter(s => s.status === 'scheduled' && new Date(s.startDateTime) > now)
      .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
    
    const nextSession = upcomingSessions[0];
    
    // Average session duration in hours
    const durations = scheduledSessions.map(s => {
      const start = new Date(s.startDateTime);
      const end = new Date(s.endDateTime);
      return (end - start) / (1000 * 60 * 60);
    });
    const avgDuration = durations.length > 0 
      ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10 
      : 0;

    return {
      totalSessions,
      uniqueClassrooms,
      uniqueInstructors,
      uniqueClasses,
      scheduledCount,
      completedCount,
      thisWeekSessions,
      nextSession,
      avgDuration
    };
  }, [scheduledSessions]);

  // Filter sessions based on view mode
  const filteredSessions = useMemo(() => {
    let filtered = scheduledSessions;

    if (viewMode === 'instructor' && selectedInstructor) {
      filtered = filtered.filter(s => s.instructorId === selectedInstructor);
    } else if (viewMode === 'room' && selectedRoom) {
      filtered = filtered.filter(s => s.classroomId === selectedRoom);
    }

    return filtered;
  }, [scheduledSessions, viewMode, selectedInstructor, selectedRoom]);

  // Convert scheduled sessions to TOAST UI Calendar events
  const calendarEvents = useMemo(() => {
    return filteredSessions.map(session => ({
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

  // Handle event update (drag/resize) with conflict preview
  const onBeforeUpdateEvent = useCallback(async (updateData) => {
    const { event, changes } = updateData;
    const session = event.raw.session;
    
    const updatePayload = {
      classId: session.classId,
      instructorId: session.instructorId,
      classroomId: session.classroomId,
      startDateTime: (changes.start || event.start).toISOString(),
      endDateTime: (changes.end || event.end).toISOString(),
      excludeSessionId: session.id,
      updatedBy: user?.dbId
    };

    // Validate before updating
    const validation = await schedulingService.validateSession(updatePayload);
    setValidationResult(validation);

    if (!validation.valid) {
      toast.error(`Conflict detected: ${validation.conflicts[0]?.message}`);
      
      // Get suggestions for alternative times
      const altTimes = await schedulingService.getAlternativeTimes(
        session.classId,
        session.instructorId,
        session.classroomId,
        updatePayload.startDateTime
      );
      
      if (altTimes.success && altTimes.suggestions.length > 0) {
        setSuggestions(altTimes.suggestions);
        setShowSuggestions(true);
      }
      
      return; // Prevent update
    }

    const result = await scheduledSessionService.updateScheduledSession(session.id, updatePayload);
    
    if (result.success) {
      toast.success('Session updated');
      setValidationResult(null);
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

  // Handle drop on calendar - open modal for configuration
  const handleCalendarDrop = useCallback(async (e) => {
    e.preventDefault();
    const classItemData = e.dataTransfer.getData('classItem');
    if (!classItemData) return;

    const classItem = JSON.parse(classItemData);
    
    // Set default instructor and classroom from class, or first available
    const defaultInstructorId = classItem.instructorId || instructors[0]?.id;
    const defaultClassroomId = classItem.classroomId || classrooms[0]?.id;

    // Set default start/end times
    const startDateTime = new Date(currentDate);
    startDateTime.setHours(9, 0, 0, 0); // 9 AM
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    // Open modal for configuration
    setModalClassItem(classItem);
    setModalStartDateTime(startDateTime);
    setModalEndDateTime(endDateTime);
    setModalInstructorId(defaultInstructorId);
    setModalClassroomId(defaultClassroomId);
    setShowCreateModal(true);
  }, [currentDate, instructors, classrooms, toast]);

  // Handle session creation from modal
  const handleCreateSession = useCallback(async () => {
    if (!modalClassItem || !modalInstructorId || !modalClassroomId) {
      toast.error('Please select an instructor and classroom');
      return;
    }

    const sessionData = {
      classId: modalClassItem.id,
      instructorId: modalInstructorId,
      classroomId: modalClassroomId,
      startDateTime: modalStartDateTime.toISOString(),
      endDateTime: modalEndDateTime.toISOString(),
      status: 'scheduled',
      notes: `Scheduled via calendar`,
      createdBy: user?.dbId
    };

    if (isRecurring) {
      // Create recurring sessions
      const recurrenceConfig = {
        recurrenceType,
        recurrenceDays,
        recurrenceEndDate: recurrenceEndDate?.toISOString(),
        recurrenceCount,
        timesPerDay
      };

      const result = await schedulingService.createRecurringSessions(sessionData, recurrenceConfig);
      
      if (result.success) {
        toast.success(`Recurring series created: ${result.data.totalCreated} sessions!`);
        setShowCreateModal(false);
        setIsRecurring(false);
        setRecurrenceDays([]);
        setTimesPerDay([]);
        loadData();
      } else {
        toast.error(result.error || 'Failed to create recurring sessions');
        if (result.conflicts) {
          setValidationResult({ valid: false, conflicts: result.conflicts });
        }
      }
    } else {
      // Validate before creating single session
      const validation = await schedulingService.validateSession(sessionData);
      setValidationResult(validation);

      if (!validation.success || !validation.valid) {
        const errorMsg = validation.conflicts?.[0]?.message || validation.error || 'Validation failed';
        toast.error(`Cannot schedule: ${errorMsg}`);
        
        // Get suggestions only if we have conflicts
        if (validation.conflicts && validation.conflicts.length > 0) {
          const suggestions = await schedulingService.getSuggestions(modalClassItem.id);
          if (suggestions.success && suggestions.suggestions.length > 0) {
            setSuggestions(suggestions.suggestions);
            setShowSuggestions(true);
          }
        }
        return;
      }

      const result = await scheduledSessionService.createScheduledSession(sessionData);
      
      if (result.success) {
        toast.success(`${modalClassItem.nameEn} scheduled successfully!`);
        setShowCreateModal(false);
        loadData();
      } else {
        toast.error(result.error || 'Failed to create session');
      }
    }
  }, [modalClassItem, modalStartDateTime, modalEndDateTime, isRecurring, recurrenceType, recurrenceDays, recurrenceEndDate, recurrenceCount, timesPerDay, user, toast, loadData]);

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
      {/* Statistics Bar - Compact */}
      {showStats && !isFullscreen && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          {/* This Week */}
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.375rem',
            padding: '0.75rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ 
              backgroundColor: '#dbeafe', 
              borderRadius: '0.375rem', 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarIcon size={16} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1 }}>{stats.thisWeekSessions}</div>
              <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.125rem' }}>This Week</div>
            </div>
          </div>

          {/* Total Sessions */}
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.375rem',
            padding: '0.75rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ 
              backgroundColor: '#dbeafe', 
              borderRadius: '0.375rem', 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={16} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1 }}>{stats.totalSessions}</div>
              <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.125rem' }}>Total Sessions</div>
            </div>
          </div>

          {/* Scheduled */}
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.375rem',
            padding: '0.75rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ 
              backgroundColor: '#dbeafe', 
              borderRadius: '0.375rem', 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Save size={16} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1 }}>{stats.scheduledCount}</div>
              <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.125rem' }}>Scheduled</div>
            </div>
          </div>

          {/* Completed */}
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.375rem',
            padding: '0.75rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ 
              backgroundColor: '#d1fae5', 
              borderRadius: '0.375rem', 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Save size={16} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1 }}>{stats.completedCount}</div>
              <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.125rem' }}>Completed</div>
            </div>
          </div>

          {/* Classrooms */}
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.375rem',
            padding: '0.75rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ 
              backgroundColor: '#d1fae5', 
              borderRadius: '0.375rem', 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DoorOpen size={16} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1 }}>{stats.uniqueClassrooms}/{classrooms.length}</div>
              <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.125rem' }}>Rooms Used</div>
            </div>
          </div>

          {/* Instructors */}
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.375rem',
            padding: '0.75rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              borderRadius: '0.375rem', 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={16} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1 }}>{stats.uniqueInstructors}/{instructors.length}</div>
              <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.125rem' }}>Instructors</div>
            </div>
          </div>

          {/* Classes */}
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.375rem',
            padding: '0.75rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ 
              backgroundColor: '#e0e7ff', 
              borderRadius: '0.375rem', 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={16} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1 }}>{stats.uniqueClasses}</div>
              <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.125rem' }}>Classes</div>
            </div>
          </div>

          {/* Avg Duration */}
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
            borderRadius: '0.375rem',
            padding: '0.75rem',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ 
              backgroundColor: '#fce7f3', 
              borderRadius: '0.375rem', 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={16} color="#ec4899" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1 }}>{stats.avgDuration}h</div>
              <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.125rem' }}>Avg Duration</div>
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

          {/* View Mode Selector and Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>View:</span>
            
            <button 
              onClick={() => { setViewMode('all'); setSelectedInstructor(null); setSelectedRoom(null); }} 
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: viewMode === 'all' ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb', 
                color: viewMode === 'all' ? '#ffffff' : 'inherit', 
                border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, 
                borderRadius: '0.375rem', 
                cursor: 'pointer', 
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <CalendarIcon size={14} />
              All Sessions
            </button>
            
            <button 
              onClick={() => setViewMode('instructor')} 
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: viewMode === 'instructor' ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb', 
                color: viewMode === 'instructor' ? '#ffffff' : 'inherit', 
                border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, 
                borderRadius: '0.375rem', 
                cursor: 'pointer', 
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <User size={14} />
              By Instructor
            </button>
            
            <button 
              onClick={() => setViewMode('room')} 
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: viewMode === 'room' ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb', 
                color: viewMode === 'room' ? '#ffffff' : 'inherit', 
                border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`, 
                borderRadius: '0.375rem', 
                cursor: 'pointer', 
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <DoorOpen size={14} />
              By Room
            </button>

            {viewMode === 'instructor' && (
              <Select
                value={selectedInstructor || ''}
                onChange={(e) => setSelectedInstructor(e.target.value ? parseInt(e.target.value) : null)}
                options={[
                  { value: '', label: 'Select Instructor' },
                  ...instructors.map(i => ({ value: String(i.id), label: i.displayName || `${i.firstName} ${i.lastName}` }))
                ]}
              />
            )}

            {viewMode === 'room' && (
              <Select
                value={selectedRoom || ''}
                onChange={(e) => setSelectedRoom(e.target.value ? parseInt(e.target.value) : null)}
                options={[
                  { value: '', label: 'Select Room' },
                  ...classrooms.map(c => ({ value: String(c.id), label: c.nameEn || c.code }))
                ]}
              />
            )}
          </div>

          {/* Conflict/Suggestions Alert */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '0.375rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#92400e' }}>
                  <BarChart3 size={16} />
                  Suggested Alternatives
                </div>
                <button onClick={() => setShowSuggestions(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={16} color="#92400e" />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {suggestions.slice(0, 3).map((suggestion, idx) => (
                  <div key={idx} style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #fbbf24',
                    borderRadius: '0.25rem',
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (suggestion.instructor && suggestion.classroom) {
                      toast.info(`Suggested: ${suggestion.instructor.displayName} in ${suggestion.classroom.nameEn}`);
                    } else if (suggestion.startDateTime) {
                      toast.info(`Suggested: ${new Date(suggestion.startDateTime).toLocaleString()}`);
                    }
                    setShowSuggestions(false);
                  }}>
                    {suggestion.instructor ? (
                      <div>
                        <div style={{ fontWeight: '600', color: '#92400e' }}>
                          {suggestion.instructor.displayName} • {suggestion.classroom.nameEn}
                        </div>
                        <div style={{ color: '#78350f', marginTop: '0.25rem' }}>
                          Score: {(suggestion.score * 100).toFixed(0)}% • Utilization: {suggestion.details?.capacityUtilization}%
                        </div>
                      </div>
                    ) : suggestion.startDateTime ? (
                      <div>
                        <div style={{ fontWeight: '600', color: '#92400e' }}>
                          {suggestion.dayOfWeek} {suggestion.timeSlot}
                        </div>
                        <div style={{ color: '#78350f', marginTop: '0.25rem' }}>
                          {suggestion.daysFromNow} days from now
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Create Session Modal */}
      {showCreateModal && modalClassItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}
        onClick={() => setShowCreateModal(false)}>
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Schedule Session</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              </button>
            </div>

            {/* Class Info */}
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{modalClassItem.nameEn}</div>
              <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                {subjects.find(s => s.id === modalClassItem.subjectId)?.nameEn || 'Subject'}
              </div>
            </div>

            {/* Date and Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Start Time</label>
                <Input
                  type="datetime-local"
                  value={modalStartDateTime ? modalStartDateTime.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setModalStartDateTime(new Date(e.target.value))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>End Time</label>
                <Input
                  type="datetime-local"
                  value={modalEndDateTime ? modalEndDateTime.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setModalEndDateTime(new Date(e.target.value))}
                />
              </div>
            </div>

            {/* Instructor and Classroom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Instructor</label>
                <Select
                  value={modalInstructorId || ''}
                  onChange={(e) => setModalInstructorId(e.target.value ? parseInt(e.target.value) : null)}
                  options={[
                    { value: '', label: 'Select Instructor' },
                    ...instructors.map(i => ({ value: String(i.id), label: i.displayName || `${i.firstName} ${i.lastName}` }))
                  ]}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Classroom</label>
                <Select
                  value={modalClassroomId || ''}
                  onChange={(e) => setModalClassroomId(e.target.value ? parseInt(e.target.value) : null)}
                  options={[
                    { value: '', label: 'Select Room' },
                    ...classrooms.map(c => ({ value: String(c.id), label: c.nameEn || c.code }))
                  ]}
                />
              </div>
            </div>

            {/* Recurrence Toggle */}
            <div style={{ marginBottom: '1rem', padding: '1rem', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="isRecurring" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>
                  Create Recurring Sessions
                </label>
              </div>

              {isRecurring && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Recurrence Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Recurrence Type</label>
                    <Select
                      value={recurrenceType}
                      onChange={(e) => setRecurrenceType(e.target.value)}
                      options={[
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'custom', label: 'Custom' }
                      ]}
                    />
                  </div>

                  {/* Day Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Select Days</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <button
                          key={day}
                          onClick={() => {
                            setRecurrenceDays(prev => 
                              prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                            );
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: recurrenceDays.includes(day) ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb',
                            color: recurrenceDays.includes(day) ? '#ffffff' : 'inherit',
                            border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* End Date or Count */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>End Date</label>
                      <Input
                        type="date"
                        value={recurrenceEndDate ? recurrenceEndDate.toISOString().slice(0, 10) : ''}
                        onChange={(e) => setRecurrenceEndDate(e.target.value ? new Date(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Or Count</label>
                      <Input
                        type="number"
                        min="1"
                        value={recurrenceCount || ''}
                        onChange={(e) => setRecurrenceCount(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Number of sessions"
                      />
                    </div>
                  </div>

                  {/* Different times per day */}
                  {recurrenceDays.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                        Custom Times per Day (Optional)
                      </label>
                      <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.5rem' }}>
                        Leave empty to use the same time for all days
                      </div>
                      {recurrenceDays.map((day) => (
                        <div key={day} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', minWidth: '50px' }}>{day}:</span>
                          <Input
                            type="time"
                            placeholder="Start"
                            value={timesPerDay.find(t => t.day === day)?.startTime || ''}
                            onChange={(e) => {
                              setTimesPerDay(prev => {
                                const filtered = prev.filter(t => t.day !== day);
                                if (e.target.value) {
                                  return [...filtered, { day, startTime: e.target.value, endTime: timesPerDay.find(t => t.day === day)?.endTime || '' }];
                                }
                                return filtered;
                              });
                            }}
                          />
                          <Input
                            type="time"
                            placeholder="End"
                            value={timesPerDay.find(t => t.day === day)?.endTime || ''}
                            onChange={(e) => {
                              setTimesPerDay(prev => {
                                const filtered = prev.filter(t => t.day !== day);
                                const startTime = timesPerDay.find(t => t.day === day)?.startTime || '';
                                if (e.target.value && startTime) {
                                  return [...filtered, { day, startTime, endTime: e.target.value }];
                                }
                                return filtered;
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => setShowCreateModal(false)}
                style={{ backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb', color: 'inherit' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
              >
                {isRecurring ? 'Create Series' : 'Create Session'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingCalendarPage;
