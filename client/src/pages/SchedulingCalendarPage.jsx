import React, { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Calendar from '@toast-ui/react-calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Select, Input, UserSelect } from '@ui';
import { SESSION_STATUS_OPTIONS, STATUS_COLORS } from '../constants/schedulingConstants.js';
import { getLocalizedName } from '../utils/languageHelpers.js';
import {
  buildSessionEventVenueLine,
  buildSessionEventInstructorLine,
  escapeHtml,
  formatSessionDuration,
  formatClassroomOptionLabel,
  formatClassroomDetails,
  getClassroomDetailRows,
  getAvailableStatusTransitions,
  getClassroomById,
  toDatetimeLocalValue,
  formatValidationConflict,
  formatWorkloadSessionTime,
  formatSchedulingDateTime,
  formatSchedulingDateOnly,
  formatSchedulingTimeOnly,
  resolveSessionDropDateTime,
  getCalendarDayNames,
  createToastCalendarTemplates,
  getLocalizedClassName,
  getLocalizedSubjectName,
  getLocalizedInstructorName,
  getLocalizedClassroomName,
  getLocalizedClassroomStatus
} from '../utils/schedulingDisplayUtils.js';
import SchedulingCalendarPopup from '../components/SchedulingCalendarPopup.jsx';
import SchedulingDefinedAvailabilityCards from '../components/SchedulingDefinedAvailabilityCards.jsx';
import SchedulingAvailabilityTimeline from '../components/SchedulingAvailabilityTimeline.jsx';
import SchedulingClassesView from '../components/SchedulingClassesView.jsx';
import CalendarEventDialog from '../components/scheduling/CalendarEventDialog.jsx';
import SessionEventDialog from '../components/scheduling/SessionEventDialog.jsx';
import { 
  BookOpen, Users, DoorOpen, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Save, Trash2, Clock, MapPin, User, X, Edit, BarChart3,
  ChevronUp, ChevronDown, List, Grid, Filter, ArrowUp, ArrowDown,
  CheckCircle2, XCircle, PanelLeftClose, PanelLeft, CalendarOff,
  CalendarDays, LayoutList, LayoutGrid, GraduationCap, LayoutDashboard,
  Coffee, Umbrella
} from 'lucide-react';
import { getAllClasses } from '@services/business/classService.js';
import { getAllPrograms } from '@services/business/programService.js';
import { getAllSubjects } from '@services/business/subjectService.js';
import { getAllClassrooms } from '@services/business/classroomService.js';
import { getAllUsers } from '@services/business/userService.js';
import { getEnrollments } from '@services/business/enrollmentService.js';
import * as scheduledSessionService from '@services/business/scheduledSessionService.js';
import * as schedulingService from '@services/business/schedulingService.js';
import schedulingSummaryService from '@services/business/schedulingSummaryService.js';
import * as holidayService from '@services/business/holidayService.js';
import { getAllTimeSlots, createTimeSlot, updateTimeSlot } from '@services/business/timeSlotService.js';
import { getAllInstructorAvailabilities } from '@services/business/instructorAvailabilityService.js';
import { getAllClassroomAvailabilities } from '@services/business/classroomAvailabilityService.js';
import {
  groupInstructorAvailability,
  groupClassroomAvailability,
  filterAvailabilityRecordsByDateRange,
  expandAvailabilityToCalendarEvents,
  markAvailabilitySessionConflicts,
  expandSessionsToTimelineEvents
} from '../utils/schedulingAvailabilityUtils.js';
import { ROLE_STRINGS } from '@utils/userUtils.js';

const SESSION_CALENDAR_HEIGHT = 680;

/** Resolve or create a time slot when a break is moved to custom start/end times. */
async function resolveBreakTimeSlotForCustomTime({
  breakSession,
  startStr,
  endStr,
  timeSlots,
  breakSessions,
  user,
}) {
  const matchingSlot = timeSlots.find((ts) => ts.startTime === startStr && ts.endTime === endStr);
  if (matchingSlot) {
    console.log('[resolveBreakTimeSlot] Using existing matching slot', {
      breakSessionId: breakSession.id,
      slotId: matchingSlot.id,
      startStr,
      endStr,
    });
    return { success: true, timeSlotId: matchingSlot.id, timeSlots };
  }

  const [startHour, startMinute] = startStr.split(':').map(Number);
  const [endHour, endMinute] = endStr.split(':').map(Number);
  const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

  const otherBreaksUsingSlot = breakSessions.filter(
    (bs) => bs.timeSlotId === breakSession.timeSlotId && bs.id !== breakSession.id
  );

  if (otherBreaksUsingSlot.length > 0) {
    console.log('[resolveBreakTimeSlot] Slot shared by other breaks, creating new slot', {
      breakSessionId: breakSession.id,
      timeSlotId: breakSession.timeSlotId,
      otherBreakCount: otherBreaksUsingSlot.length,
      startStr,
      endStr,
    });
    const sortOrder = 9000 + Math.floor(Date.now() / 1000) % 1000;
    const slotResult = await createTimeSlot({
      programId: breakSession.programId,
      labelEn: `Custom Break ${startStr}-${endStr}`,
      labelAr: `استراحة مخصصة ${startStr}-${endStr}`,
      startTime: startStr,
      endTime: endStr,
      durationMinutes,
      sortOrder,
      isBreak: true,
      breakType: breakSession.breakType || null,
      isActive: true,
    }, user);
    if (!slotResult.success) {
      return { success: false, error: slotResult.error };
    }
    const slotsResult = await getAllTimeSlots({ limit: 500 });
    const updatedSlots = slotsResult.success ? slotsResult.data || [] : timeSlots;
    return { success: true, timeSlotId: slotResult.data.id, timeSlots: updatedSlots };
  }

  console.log('[resolveBreakTimeSlot] Updating unshared slot', {
    breakSessionId: breakSession.id,
    timeSlotId: breakSession.timeSlotId,
    startStr,
    endStr,
  });
  const slotResult = await updateTimeSlot(breakSession.timeSlotId, {
    startTime: startStr,
    endTime: endStr,
    durationMinutes,
  }, user);
  if (!slotResult.success) {
    return { success: false, error: slotResult.error };
  }
  const slotsResult = await getAllTimeSlots({ limit: 500 });
  const updatedSlots = slotsResult.success ? slotsResult.data || [] : timeSlots;
  return { success: true, timeSlotId: breakSession.timeSlotId, timeSlots: updatedSlots };
}

function ColorDot({ color, size = 8, border }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        border: border || 'none',
        flexShrink: 0,
        display: 'inline-block',
        boxShadow: color ? `0 0 0 1px ${color}33` : undefined
      }}
    />
  );
}

function SchedulingLegendItem({ color, label, border }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      <ColorDot color={color} border={border} />
      <span>{label}</span>
    </span>
  );
}

function SchedulingStatCard({ value, label, Icon, iconColor, iconBg, theme }) {
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
      borderRadius: '0.375rem',
      padding: '0.75rem',
      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: 0
    }}>
      <div style={{
        backgroundColor: iconBg,
        borderRadius: '0.375rem',
        padding: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={16} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
        <div style={{
          fontSize: '0.7rem',
          color: muted,
          marginTop: '0.125rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

const findNearestSession = (sessions) => {
  if (!sessions?.length) return null;
  const now = new Date();
  const upcoming = sessions
    .filter(s => new Date(s.startDateTime) >= now)
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
  if (upcoming.length) return upcoming[0];
  const past = sessions
    .filter(s => new Date(s.startDateTime) < now)
    .sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));
  return past[0] || sessions[0];
};

function AvailabilityTimelineLegend({ t, theme }) {
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const items = [
    { color: '#10b981', label: t('legend_defined_hours') },
    { color: '#d97706', label: t('legend_defined_booked') },
    { color: '#3b82f6', label: t('legend_scheduled_session') }
  ];
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {items.map(({ color, label }) => (
        <span
          key={label}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: muted }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: color,
              flexShrink: 0,
              boxShadow: `0 0 0 2px ${color}33`
            }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}

const INSTRUCTOR_SELECT_WIDTH = { minWidth: '360px', width: '360px', flex: '0 1 360px' };
const ROOM_SELECT_WIDTH = { minWidth: '420px', width: '420px', flex: '0 0 420px', maxWidth: '100%' };

const SchedulingCalendarPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const calendarRef = useRef(null);
  const sessionCalendarContainerRef = useRef(null);
  const currentDateRef = useRef(null);
  const calendarEventsRef = useRef([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessionCalendarHeight, setSessionCalendarHeight] = useState(SESSION_CALENDAR_HEIGHT);

  const readTabFromParams = (params) => {
    const tab = params.get('tab');
    return ['sessions', 'availability', 'classes'].includes(tab) ? tab : 'sessions';
  };

  const readScopeFromParams = (params, tab) => {
    const scope = params.get('scope');
    if (tab === 'availability') {
      return scope === 'room' ? 'room' : 'instructor';
    }
    if (tab === 'sessions') {
      return scope === 'instructor' || scope === 'room' ? scope : 'all';
    }
    return 'all';
  };

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructorUsers, setFilteredInstructorUsers] = useState([]);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  
  // Classes panel (horizontal, below stats)
  const [isClassesPanelExpanded, setIsClassesPanelExpanded] = useState(false);
  const [calendarLayoutKey, setCalendarLayoutKey] = useState(0);
  const [sidebarProgramFilter, setSidebarProgramFilter] = useState('');
  const [sidebarSubjectFilter, setSidebarSubjectFilter] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  
  // View state — mainTab: sessions | availability | classes; scopeMode: all | instructor | room
  const [mainTab, setMainTabState] = useState(() => readTabFromParams(searchParams));
  const setMainTab = useCallback((tab) => {
    setMainTabState(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'sessions') {
        next.delete('tab');
        next.delete('scope');
      } else if (tab === 'classes') {
        next.set('tab', 'classes');
        next.delete('scope');
        next.delete('classId');
      } else if (tab === 'availability') {
        next.set('tab', 'availability');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const navigateAvailabilityView = useCallback((scope) => {
    setMainTabState('availability');
    setScopeMode(scope);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'availability');
      next.set('scope', scope);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSessionsScope = useCallback((scope) => {
    setScopeMode(scope);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (scope === 'all') next.delete('scope');
      else next.set('scope', scope);
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const [scopeMode, setScopeMode] = useState(() => readScopeFromParams(searchParams, readTabFromParams(searchParams)));
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availabilityDataMode, setAvailabilityDataMode] = useState('defined'); // 'defined' | 'workload' | 'timeline'
  const [classesViewMode, setClassesViewMode] = useState('semester'); // 'semester' | 'grid'
  const [definedAvailFrom, setDefinedAvailFrom] = useState('');
  const [definedAvailTo, setDefinedAvailTo] = useState('');
  const [availCalendarDate, setAvailCalendarDate] = useState(() => new Date());
  const [availCalendarView, setAvailCalendarView] = useState('week');
  const [instructorAvailabilities, setInstructorAvailabilities] = useState([]);
  const [classroomAvailabilities, setClassroomAvailabilities] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'scheduled', 'in_progress', 'completed', 'cancelled'
  const [currentView, setCurrentView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDateRange, setCalendarDateRange] = useState(() => {
    const today = new Date();
    const from = new Date(today);
    from.setFullYear(from.getFullYear() - 1);
    const to = new Date(today);
    to.setFullYear(to.getFullYear() + 1);
    return {
      from,
      to,
      fromStr: from.toISOString().split('T')[0],
      toStr: to.toISOString().split('T')[0],
      fromStrLocal: from.toLocaleDateString('en-CA'), // YYYY-MM-DD format in local time
      toStrLocal: to.toLocaleDateString('en-CA'),
    };
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [narrowWeekend, setNarrowWeekend] = useState(false);
  
  // Calendar scroll position
  const scrollPositionRef = useRef(0);
  
  // Search and drill-down state
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionClassFilter, setSessionClassFilter] = useState(() => searchParams.get('classId') || null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  
  // Workload view state
  const [workloadViewMode, setWorkloadViewMode] = useState('tree'); // 'tree' | 'table' | 'drill'
  const [workloadSortBy, setWorkloadSortBy] = useState('workload'); // 'workload' | 'name' | 'sessions'
  const [workloadFilterThreshold, setWorkloadFilterThreshold] = useState(100); // 0-100
  const [workloadSortOrder, setWorkloadSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [workloadDateFilter, setWorkloadDateFilter] = useState('all'); // 'all' | 'week' | 'month' | 'custom'
  const [workloadStartDate, setWorkloadStartDate] = useState(null);
  const [workloadEndDate, setWorkloadEndDate] = useState(null);
  
  // UI state
  // Custom popup state
  const [popupSession, setPopupSession] = useState(null);
  const [highlightedSessionId, setHighlightedSessionId] = useState(null);
  const [pendingClassHighlight, setPendingClassHighlight] = useState(null);
  
  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(null);
  const [recurrenceCount, setRecurrenceCount] = useState(null);
  const [recurrenceEndMode, setRecurrenceEndMode] = useState('date');
  const [timesPerDay, setTimesPerDay] = useState([]);
  
  // Conflict detection state
  const [validationResult, setValidationResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [modalClassItem, setModalClassItem] = useState(null);
  const [modalStartDateTime, setModalStartDateTime] = useState(null);
  const [modalEndDateTime, setModalEndDateTime] = useState(null);
  const [modalInstructorEmail, setModalInstructorEmail] = useState(null);
  const [modalInstructorId, setModalInstructorId] = useState(null);
  const [modalClassroomId, setModalClassroomId] = useState(null);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [requiresReason, setRequiresReason] = useState(false);
  
  // Status change modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [sessionToChangeStatus, setSessionToChangeStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  
  // Stats
  const [showStats, setShowStats] = useState(false);

  // Break/Holiday calendar events
  const [breakSessions, setBreakSessions] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [calendarEventDialog, setCalendarEventDialog] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    eventType: 'session', // 'session' | 'break' | 'holiday'
    event: null,
    initialStart: null,
    initialEnd: null,
  });
  const [deleteScopeDialog, setDeleteScopeDialog] = useState({
    open: false,
    eventType: null,
    event: null,
  });

  const hasPermission = isAdmin || isHR || isSuperAdmin;

  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);

  const getVisibleSessionCalendarDate = useCallback(() => {
    const cal = calendarRef.current?.getInstance();
    const calendarDate = cal?.getDate?.();
    return calendarDate ? new Date(calendarDate) : new Date(currentDateRef.current || Date.now());
  }, []);

  const restoreSessionCalendarDate = useCallback((date) => {
    if (!date) return;
    const restoredDate = new Date(date);
    setCurrentDate((prev) => (
      prev && prev.getTime() === restoredDate.getTime() ? prev : restoredDate
    ));

    [0, 100, 300].forEach((ms) => {
      setTimeout(() => {
        const cal = calendarRef.current?.getInstance();
        if (!cal) return;
        cal.setDate(restoredDate);
        // Don't call cal.render() here - it clears events. Sync useEffect handles rendering.
        if (typeof cal.updateSize === 'function') cal.updateSize();
      }, ms);
    });
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    // Save scroll position before reload
    if (calendarRef.current) {
      scrollPositionRef.current = calendarRef.current.scrollTop;
    }
    
    setLoading(true);
    try {
      const calendarFromStr = calendarDateRange.fromStrLocal;
      const calendarToStr = calendarDateRange.toStrLocal;

      const [
        classesResult,
        programsResult,
        subjectsResult,
        classroomsResult,
        instructorsResult,
        sessionsResult,
        enrollmentsResult,
        instructorAvailResult,
        classroomAvailResult,
        breakSessionsResult,
        holidaysResult,
        timeSlotsResult
      ] = await Promise.all([
        getAllClasses(),
        getAllPrograms(),
        getAllSubjects(),
        getAllClassrooms(),
        getAllUsers({ limit: 1000 }),
        scheduledSessionService.getAllScheduledSessions({ limit: 1000 }),
        getEnrollments(),
        getAllInstructorAvailabilities({ isActive: true, limit: 500 }),
        getAllClassroomAvailabilities({ isActive: true, limit: 500 }),
        schedulingSummaryService.getBreakSessions({ start: calendarFromStr, end: calendarToStr, limit: 5000 }),
        holidayService.getAllHolidays({ startDate: calendarFromStr, endDate: calendarToStr, limit: 5000 }),
        getAllTimeSlots({ limit: 500 })
      ]);

      if (classesResult.success) setClasses(classesResult.data || []);
      if (programsResult.success) setPrograms(programsResult.data || []);
      if (subjectsResult.success) setSubjects(subjectsResult.data || []);
      if (classroomsResult.success) setClassrooms(classroomsResult.data || []);
      if (enrollmentsResult.success) setEnrollments(enrollmentsResult.data || []);
      if (breakSessionsResult.success) setBreakSessions(breakSessionsResult.data || []);
      if (holidaysResult.success) setHolidays(holidaysResult.data || []);
      if (timeSlotsResult.success) setTimeSlots(timeSlotsResult.data || []);
      
      if (instructorsResult.success) {
        const usersArray = Array.isArray(instructorsResult.data) ? instructorsResult.data : [];
        
        // Filter for instructors - check roleAssignments array (role names are uppercase: INSTRUCTOR, ADMIN, SUPER_ADMIN)
        const instructorUsers = usersArray.filter(u => {
          const hasInstructorRole = u.roleAssignments?.some(ra => {
            const roleName = ra.role?.name || ra.role?.code || 'unknown';
            const roleNameUpper = roleName.toUpperCase();
            return roleNameUpper === ROLE_STRINGS.INSTRUCTOR.toUpperCase() || 
                   roleNameUpper === ROLE_STRINGS.ADMIN.toUpperCase() || 
                   roleNameUpper === ROLE_STRINGS.SUPER_ADMIN.toUpperCase();
          });
          const hasRealmInstructor = u.realm_access?.roles?.includes(ROLE_STRINGS.INSTRUCTOR) ||
                                   u.realm_access?.roles?.includes(ROLE_STRINGS.ADMIN) ||
                                   u.realm_access?.roles?.includes(ROLE_STRINGS.SUPER_ADMIN);
          return hasInstructorRole || hasRealmInstructor;
        });
        
        // Filter for only INSTRUCTOR role (not admin/super-admin) for instructor-specific dropdowns
        const pureInstructors = usersArray.filter(u => {
          const hasInstructorRole = u.roleAssignments?.some(ra => {
            const roleName = ra.role?.name || ra.role?.code || 'unknown';
            const roleNameUpper = roleName.toUpperCase();
            return roleNameUpper === ROLE_STRINGS.INSTRUCTOR.toUpperCase();
          });
          const hasRealmInstructor = u.realm_access?.roles?.includes(ROLE_STRINGS.INSTRUCTOR);
          return hasInstructorRole || hasRealmInstructor;
        });
        
        setInstructors(instructorUsers);
        setFilteredInstructorUsers(pureInstructors);
      }
      
      if (sessionsResult.success) setScheduledSessions(sessionsResult.data || []);
      if (instructorAvailResult.success) setInstructorAvailabilities(instructorAvailResult.data || []);
      if (classroomAvailResult.success) setClassroomAvailabilities(classroomAvailResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('failed_to_load_scheduling_data'));
    } finally {
      setLoading(false);
      
      // Restore scroll position after data loads
      setTimeout(() => {
        if (calendarRef.current && scrollPositionRef.current > 0) {
          calendarRef.current.scrollTop = scrollPositionRef.current;
        }
      }, 100);
    }
  }, [toast, t, calendarDateRange]);

  useEffect(() => {
    const from = new Date(currentDate);
    from.setFullYear(from.getFullYear() - 1);
    const to = new Date(currentDate);
    to.setFullYear(to.getFullYear() + 1);
    setCalendarDateRange({
      from,
      to,
      fromStr: from.toISOString().split('T')[0],
      toStr: to.toISOString().split('T')[0],
      fromStrLocal: from.toLocaleDateString('en-CA'), // YYYY-MM-DD format in local time
      toStrLocal: to.toLocaleDateString('en-CA'),
    });
  }, [currentDate]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tab = readTabFromParams(searchParams);
    setMainTabState((current) => (current === tab ? current : tab));
    const scope = readScopeFromParams(searchParams, tab);
    setScopeMode((current) => (current === scope ? current : scope));
    const classId = searchParams.get('classId');
    setSessionClassFilter((current) => {
      const next = classId || null;
      return String(current) === String(next) ? current : next;
    });
  }, [searchParams]);

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
    const usedClassroomIds = new Set(
      scheduledSessions.filter((s) => s.classroomId != null).map((s) => s.classroomId)
    );
    const usedInstructorIds = new Set(
      scheduledSessions.filter((s) => s.instructorId != null).map((s) => s.instructorId)
    );
    const uniqueClassrooms = usedClassroomIds.size;
    const uniqueInstructors = usedInstructorIds.size;
    const uniqueClasses = new Set(scheduledSessions.map(s => s.classId)).size;
    
    const scheduledCount = scheduledSessions.filter(s => s.status === 'scheduled').length;
    const completedCount = scheduledSessions.filter(s => s.status === 'completed').length;
    const cancelledCount = scheduledSessions.filter(s => s.status === 'cancelled').length;
    const inProgressCount = scheduledSessions.filter(s => s.status === 'in_progress').length;
    
    const totalClasses = classes.length;
    const classesWithSessions = new Set(
      scheduledSessions.filter((s) => s.status !== 'cancelled').map((s) => s.classId)
    ).size;
    const classesMissingSetup = classes.filter((c) => !c.instructorId || !c.classroomId).length;

    const instructorAvailRules = instructorAvailabilities.length;
    const roomAvailRules = classroomAvailabilities.length;
    const instructorsWithAvailability = new Set(
      instructorAvailabilities.map((a) => a.instructorUserId || a.instructor?.id).filter(Boolean)
    ).size;
    const roomsWithAvailability = new Set(
      classroomAvailabilities.map((a) => a.classroomId).filter(Boolean)
    ).size;

    const instructorPool = filteredInstructorUsers.length || instructors.length;
    const unusedRooms = Math.max(0, classrooms.length - uniqueClassrooms);
    const unusedInstructors = Math.max(0, instructorPool - uniqueInstructors);
    const totalPrograms = programs.length;
    const totalSubjects = subjects.length;
    
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
      cancelledCount,
      inProgressCount,
      thisWeekSessions,
      nextSession,
      avgDuration,
      totalClasses,
      classesWithSessions,
      classesMissingSetup,
      instructorAvailRules,
      roomAvailRules,
      instructorsWithAvailability,
      roomsWithAvailability,
      unusedRooms,
      unusedInstructors,
      instructorPool,
      totalPrograms,
      totalSubjects
    };
  }, [scheduledSessions, classes, programs, subjects, classrooms, instructors, filteredInstructorUsers, instructorAvailabilities, classroomAvailabilities]);

  // Filter sessions based on view mode, status, and search
  const filteredSessions = useMemo(() => {
    let filtered = scheduledSessions;

    if (mainTab === 'sessions') {
      if (scopeMode === 'instructor' && selectedInstructor) {
        filtered = filtered.filter(s => s.instructorId === selectedInstructor);
      } else if (scopeMode === 'room' && selectedRoom) {
        filtered = filtered.filter(s => s.classroomId === selectedRoom);
      }
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (sessionClassFilter != null) {
      filtered = filtered.filter(s => String(s.classId) === String(sessionClassFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(s => {
        const roomName = s.classroom?.nameEn?.toLowerCase() || '';
        const roomCode = s.classroom?.code?.toLowerCase() || '';
        const instructorName = s.instructor?.displayName?.toLowerCase() || '';
        const instructorEmail = s.instructor?.email?.toLowerCase() || '';
        const className = s.class?.nameEn?.toLowerCase() || s.class?.name?.toLowerCase() || '';
        const classCode = s.class?.code?.toLowerCase() || '';
        return roomName.includes(q) || roomCode.includes(q) ||
               instructorName.includes(q) || instructorEmail.includes(q) ||
               className.includes(q) || classCode.includes(q);
      });
    }

    return filtered;
  }, [scheduledSessions, mainTab, scopeMode, selectedInstructor, selectedRoom, statusFilter, sessionClassFilter, searchQuery]);

  // Convert scheduled sessions, break sessions, and holidays to calendar events
  const calendarEvents = useMemo(() => {
    const sessionEvents = filteredSessions.map(session => ({
      id: `session-${session.id}`,
      calendarId: 'sessions',
      title: `${session.class?.code || t('class')}`,
      body: buildSessionEventVenueLine(session, lang, t),
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
        eventType: 'session',
        session,
        classInfo: session.class,
        instructor: session.instructor,
        classroom: session.classroom
      }
    }));

    const breakEvents = breakSessions.map((bs) => {
      const timeSlot = bs.timeSlot || timeSlots.find((ts) => ts.id === bs.timeSlotId);
      const start = new Date(bs.date);
      const end = new Date(bs.date);
      if (timeSlot) {
        const [startHour, startMinute] = timeSlot.startTime.split(':').map(Number);
        const [endHour, endMinute] = timeSlot.endTime.split(':').map(Number);
        start.setHours(startHour, startMinute, 0, 0);
        end.setHours(endHour, endMinute, 0, 0);
      } else {
        start.setHours(9, 0, 0, 0);
        end.setHours(9, 45, 0, 0);
      }
      const description = lang === 'ar' && bs.descriptionAr ? bs.descriptionAr : bs.descriptionEn;
      const title = description || bs.breakType || t('break');
      return {
        id: `break-${bs.id}`,
        calendarId: 'breaks',
        title,
        body: bs.notes || '',
        category: 'time',
        start,
        end,
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        color: '#ffffff',
        isReadOnly: false,
        raw: {
          eventType: 'break',
          breakSession: bs,
        },
      };
    });

    const holidayEvents = holidays.map((h) => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      // Adjust both start and end to local time on the same day to prevent date shift
      // Start at 00:00:00 local time
      start.setHours(0, 0, 0, 0);
      // End at 23:59:59 local time on the same day as start
      end.setFullYear(start.getFullYear());
      end.setMonth(start.getMonth());
      end.setDate(start.getDate());
      end.setHours(23, 59, 59, 999);
      const event = {
        id: `holiday-${h.id}`,
        calendarId: 'holidays',
        title: h.descriptionEn || h.descriptionAr || t('holiday'),
        body: h.type || '',
        category: 'time',
        start,
        end,
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        color: '#ffffff',
        isReadOnly: false,
        raw: {
          eventType: 'holiday',
          holiday: h,
        },
      };
      console.log('[SchedulingCalendarPage] Holiday event created:', { id: event.id, title: event.title, start: event.start, end: event.end, category: event.category });
      return event;
    });
    console.log('[SchedulingCalendarPage] Total holiday events:', holidayEvents.length);

    const events = [...sessionEvents, ...breakEvents, ...holidayEvents];
    calendarEventsRef.current = events;
    return events;
  }, [filteredSessions, breakSessions, holidays, timeSlots, lang, t]);

  // Sync calendar when filtered events change (Toast UI doesn't always react to prop updates)
  useEffect(() => {
    console.log('🔄 [CALENDAR SYNC] useEffect triggered');
    console.log('🔄 [CALENDAR SYNC] mainTab:', mainTab);
    console.log('🔄 [CALENDAR SYNC] calendarEvents.length:', calendarEvents.length);
    console.log('🔄 [CALENDAR SYNC] calendarLayoutKey:', calendarLayoutKey);
    
    // Small delay to ensure calendar instance is ready after remount
    const syncCalendar = () => {
      const cal = calendarRef.current?.getInstance();
      console.log('🔄 [CALENDAR SYNC] Calendar instance:', cal ? 'FOUND' : 'NOT FOUND');
      
      if (cal && mainTab !== 'availability') {
        console.log('🔄 [CALENDAR SYNC] ✅ Clearing calendar');
        cal.clear();
        
        if (calendarEvents.length > 0) {
          console.log('🔄 [CALENDAR SYNC] ✅ Creating', calendarEvents.length, 'events');
          const breakEvents = calendarEvents.filter(e => e.raw?.eventType === 'break');
          const holidayEvents = calendarEvents.filter(e => e.raw?.eventType === 'holiday');
          console.log('🔄 [CALENDAR SYNC] Break events:', breakEvents.map(e => ({
            id: e.id,
            title: e.title,
            start: e.start?.toISOString?.() || e.start,
            end: e.end?.toISOString?.() || e.end
          })));
          console.log('🔄 [CALENDAR SYNC] Holiday events:', holidayEvents.map(e => ({
            id: e.id,
            title: e.title,
            calendarId: e.calendarId,
            start: e.start?.toISOString?.() || e.start,
            end: e.end?.toISOString?.() || e.end,
            category: e.category
          })));
          cal.createEvents(calendarEvents);
        }
        
        if (typeof cal.render === 'function') {
          console.log('🔄 [CALENDAR SYNC] ✅ Calling cal.render()');
          cal.render();
        }
        if (typeof cal.updateSize === 'function') {
          console.log('🔄 [CALENDAR SYNC] ✅ Calling cal.updateSize()');
          cal.updateSize();
        }
        console.log('🔄 [CALENDAR SYNC] ✅ Sync complete');
      } else {
        console.log('🔄 [CALENDAR SYNC] ⏭️  Skipped (no cal instance or in availability tab)');
      }
    };
    
    // Try immediately
    syncCalendar();
    
    // Also try after a small delay to handle remount timing
    const timer = setTimeout(syncCalendar, 50);
    
    return () => clearTimeout(timer);
  }, [calendarEvents, mainTab, calendarLayoutKey]);


  useEffect(() => {
    if (mainTab !== 'sessions') return;
    restoreSessionCalendarDate(currentDate);
  }, [mainTab, calendarLayoutKey, currentDate, restoreSessionCalendarDate]);

  // Force calendar to take full width - override Toast UI Calendar's inline width
  useEffect(() => {
    const forceFullWidth = () => {
      const layout = document.querySelector('.toastui-calendar-layout');
      const week = document.querySelector('.toastui-calendar-week');
      const container = document.querySelector('.scheduling-sessions-calendar');
      const innerContainer = container?.querySelector('.container');
      
      if (container && layout) {
        layout.style.width = '100%';
        layout.style.maxWidth = '100%';
        layout.style.minWidth = '100%';
        if (week) {
          week.style.width = '100%';
          week.style.maxWidth = '100%';
        }
        if (innerContainer) {
          innerContainer.style.width = '100%';
          innerContainer.style.maxWidth = '100%';
          innerContainer.style.minWidth = '100%';
        }
      }
    };
    
    forceFullWidth();
    const timeout = setTimeout(forceFullWidth, 100);
    const timeout2 = setTimeout(forceFullWidth, 500);
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [mainTab, calendarLayoutKey]);

  const highlightSessionOnCalendar = useCallback((sessionId) => {
    const attemptHighlight = (attempt = 0) => {
      const eventId = String(sessionId);
      const legacyId = `session-${sessionId}`;
      const el = document.querySelector(`[data-event-id="${legacyId}"]`)
        || document.querySelector(`[data-id="${eventId}"]`)
        || document.querySelector(`[data-id="${legacyId}"]`);
      if (!el && attempt < 15) {
        setTimeout(() => attemptHighlight(attempt + 1), 120);
        return;
      }
      if (el) {
        el.classList.add('scheduling-session-highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          el.classList.remove('scheduling-session-highlight');
          setHighlightedSessionId(null);
        }, 4500);
      } else {
        setHighlightedSessionId(null);
      }
    };
    attemptHighlight();
  }, []);

  useEffect(() => {
    if (!highlightedSessionId || mainTab === 'availability') return;
    const session = scheduledSessions.find(s => s.id === highlightedSessionId);
    if (!session) return;

    const targetDate = new Date(session.startDateTime);
    const timer = setTimeout(() => {
      const cal = calendarRef.current?.getInstance();
      if (cal) {
        cal.setDate(targetDate);
        setCurrentDate(targetDate);
        const nextView = 'week';
        if (cal.getViewName() !== nextView) {
          cal.changeView(nextView);
          setCurrentView(nextView);
        }
      }
      highlightSessionOnCalendar(highlightedSessionId);
    }, 250);

    return () => clearTimeout(timer);
  }, [highlightedSessionId, calendarEvents, mainTab, scheduledSessions, highlightSessionOnCalendar]);

  useEffect(() => {
    if (mainTab !== 'sessions' || pendingClassHighlight == null) return;
    const timer = setTimeout(() => {
      setHighlightedSessionId(pendingClassHighlight);
      setPendingClassHighlight(null);
      setCalendarLayoutKey((k) => k + 1);
    }, 450);
    return () => clearTimeout(timer);
  }, [mainTab, pendingClassHighlight]);

  // Helper to filter sessions by date range
  const getDateFilteredSessions = useCallback((sessions) => {
    if (workloadDateFilter === 'all') return sessions;
    
    const now = new Date();
    let startDate, endDate;
    
    if (workloadDateFilter === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (workloadDateFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (workloadDateFilter === 'custom' && workloadStartDate && workloadEndDate) {
      startDate = new Date(workloadStartDate);
      endDate = new Date(workloadEndDate);
    } else {
      return sessions;
    }
    
    return sessions.filter(s => {
      const sessionStart = new Date(s.startDateTime);
      return sessionStart >= startDate && sessionStart <= endDate;
    });
  }, [workloadDateFilter, workloadStartDate, workloadEndDate]);

  // Workload calculation for instructors
  const instructorWorkloads = useMemo(() => {
    const AVAILABLE_HOURS_PER_WEEK = 40; // Configurable default
    
    return filteredInstructorUsers.map(instructor => {
      let instructorSessions = scheduledSessions.filter(s => s.instructorId === instructor.id);
      
      // Apply date filter
      const filteredSessions = getDateFilteredSessions(instructorSessions);
      
      // Calculate scheduled hours
      const scheduledHours = filteredSessions.reduce((total, session) => {
        const duration = (new Date(session.endDateTime) - new Date(session.startDateTime)) / (1000 * 60 * 60);
        return total + duration;
      }, 0);
      
      // Calculate workload percentage
      const workloadPercentage = (scheduledHours / AVAILABLE_HOURS_PER_WEEK) * 100;
      
      // Get next upcoming session (for list view)
      const now = new Date();
      const upcomingSessions = filteredSessions
        .filter(s => new Date(s.startDateTime) > now)
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
      
      // Get ALL sessions for drill-down view (not just upcoming)
      const allSessions = filteredSessions
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
      
      const nextSession = upcomingSessions[0] || null;
      
      // Determine workload level
      let workloadLevel = 'low';
      if (workloadPercentage >= 90) workloadLevel = 'overloaded';
      else if (workloadPercentage >= 75) workloadLevel = 'high';
      else if (workloadPercentage >= 50) workloadLevel = 'moderate';
      
      return {
        instructor,
        sessions: filteredSessions,
        sessionCount: filteredSessions.length,
        scheduledHours: Math.round(scheduledHours * 10) / 10,
        workloadPercentage: Math.round(workloadPercentage),
        workloadLevel,
        nextSession,
        upcomingSessions,
        allSessions
      };
    });
  }, [filteredInstructorUsers, scheduledSessions, getDateFilteredSessions]);

  // Workload calculation for rooms
  const roomWorkloads = useMemo(() => {
    const AVAILABLE_HOURS_PER_WEEK = 40; // Configurable default
    
    return classrooms.map(classroom => {
      let roomSessions = scheduledSessions.filter(s => s.classroomId === classroom.id);
      
      // Apply date filter
      const filteredSessions = getDateFilteredSessions(roomSessions);
      
      // Calculate scheduled hours
      const scheduledHours = filteredSessions.reduce((total, session) => {
        const duration = (new Date(session.endDateTime) - new Date(session.startDateTime)) / (1000 * 60 * 60);
        return total + duration;
      }, 0);
      
      // Calculate workload percentage
      const workloadPercentage = (scheduledHours / AVAILABLE_HOURS_PER_WEEK) * 100;
      
      // Get next upcoming session (for list view)
      const now = new Date();
      const upcomingSessions = filteredSessions
        .filter(s => new Date(s.startDateTime) > now)
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
      
      // Get ALL sessions for drill-down view (not just upcoming)
      const allSessions = filteredSessions
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
      
      const nextSession = upcomingSessions[0] || null;
      
      // Determine workload level
      let workloadLevel = 'low';
      if (workloadPercentage >= 90) workloadLevel = 'overloaded';
      else if (workloadPercentage >= 75) workloadLevel = 'high';
      else if (workloadPercentage >= 50) workloadLevel = 'moderate';
      
      return {
        classroom,
        sessions: filteredSessions,
        sessionCount: filteredSessions.length,
        scheduledHours: Math.round(scheduledHours * 10) / 10,
        workloadPercentage: Math.round(workloadPercentage),
        workloadLevel,
        nextSession,
        upcomingSessions,
        allSessions
      };
    });
  }, [classrooms, scheduledSessions, getDateFilteredSessions]);

  // Filter and sort instructor workloads
  const filteredAndSortedWorkloads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = instructorWorkloads.filter((w) => {
      if (w.workloadPercentage > workloadFilterThreshold) return false;
      if (!q) return true;
      const name = (w.instructor.displayName || w.instructor.email || '').toLowerCase();
      return name.includes(q);
    });
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (workloadSortBy === 'workload') {
        comparison = a.workloadPercentage - b.workloadPercentage;
      } else if (workloadSortBy === 'name') {
        comparison = (a.instructor.displayName || a.instructor.email).localeCompare(
          b.instructor.displayName || b.instructor.email
        );
      } else if (workloadSortBy === 'sessions') {
        comparison = a.sessionCount - b.sessionCount;
      }
      
      return workloadSortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [instructorWorkloads, workloadFilterThreshold, workloadSortBy, workloadSortOrder, searchQuery]);

  // Filter and sort room workloads
  const filteredAndSortedRoomWorkloads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = roomWorkloads.filter((w) => {
      if (w.workloadPercentage > workloadFilterThreshold) return false;
      if (!q) return true;
      const name = (w.classroom.nameEn || w.classroom.code || '').toLowerCase();
      return name.includes(q);
    });
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (workloadSortBy === 'workload') {
        comparison = a.workloadPercentage - b.workloadPercentage;
      } else if (workloadSortBy === 'name') {
        comparison = (a.classroom.nameEn || a.classroom.code).localeCompare(
          b.classroom.nameEn || b.classroom.code
        );
      } else if (workloadSortBy === 'sessions') {
        comparison = a.sessionCount - b.sessionCount;
      }
      
      return workloadSortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [roomWorkloads, workloadFilterThreshold, workloadSortBy, workloadSortOrder, searchQuery]);

  const filteredInstructorAvail = useMemo(
    () => filterAvailabilityRecordsByDateRange(instructorAvailabilities, definedAvailFrom, definedAvailTo),
    [instructorAvailabilities, definedAvailFrom, definedAvailTo]
  );

  const filteredClassroomAvail = useMemo(
    () => filterAvailabilityRecordsByDateRange(classroomAvailabilities, definedAvailFrom, definedAvailTo),
    [classroomAvailabilities, definedAvailFrom, definedAvailTo]
  );

  const groupedInstructorDefined = useMemo(() => {
    let groups = groupInstructorAvailability(filteredInstructorAvail, filteredInstructorUsers, searchQuery, lang);
    if (mainTab === 'availability' && selectedInstructor) {
      groups = groups.filter((g) => g.id === selectedInstructor);
    }
    return groups;
  }, [filteredInstructorAvail, filteredInstructorUsers, searchQuery, mainTab, selectedInstructor, lang]);

  const groupedRoomDefined = useMemo(() => {
    let groups = groupClassroomAvailability(filteredClassroomAvail, classrooms, searchQuery, lang);
    if (mainTab === 'availability' && selectedRoom) {
      groups = groups.filter((g) => g.id === selectedRoom);
    }
    return groups;
  }, [filteredClassroomAvail, classrooms, searchQuery, mainTab, selectedRoom, lang]);

  const availabilityTimelineEvents = useMemo(() => {
    const isInstructor = scopeMode === 'instructor';
    const records = isInstructor ? filteredInstructorAvail : filteredClassroomAvail;
    const idField = isInstructor ? 'instructorUserId' : 'classroomId';
    const entityId = isInstructor ? selectedInstructor : selectedRoom;
    const availColor = isInstructor ? '#10b981' : '#3b82f6';
    const bookedColor = isInstructor ? '#3b82f6' : '#8b5cf6';

    const availabilityEvents = expandAvailabilityToCalendarEvents(records, {
      view: availCalendarView,
      anchorDate: availCalendarDate,
      filterFrom: definedAvailFrom || null,
      filterTo: definedAvailTo || null,
      entityId: entityId || null,
      idField,
      color: availColor,
      getTitle: (record) => {
        if (isInstructor) {
          const u = record.instructor || filteredInstructorUsers.find((i) => i.id === record.instructorUserId);
          return getLocalizedInstructorName(u, lang, t('instructor'));
        }
        const c = record.classroom || classrooms.find((r) => r.id === record.classroomId);
        return getLocalizedClassroomName(c, lang) || t('room');
      }
    });

    const markedAvailability = markAvailabilitySessionConflicts(availabilityEvents, scheduledSessions, {
      instructorUserId: isInstructor ? (entityId || null) : null,
      classroomId: !isInstructor ? (entityId || null) : null
    });

    const bookedSessions = expandSessionsToTimelineEvents(scheduledSessions, {
      view: availCalendarView,
      anchorDate: availCalendarDate,
      filterFrom: definedAvailFrom || null,
      filterTo: definedAvailTo || null,
      instructorUserId: isInstructor ? (entityId || null) : null,
      classroomId: !isInstructor ? (entityId || null) : null,
      color: bookedColor,
      getTitle: (session) => {
        if (isInstructor) return getLocalizedClassName(session.class, lang, t('class'));
        const inst = session.instructor || instructors.find((i) => i.id === session.instructorId);
        return getLocalizedInstructorName(inst, lang, t('instructor'));
      }
    });

    const allEvents = [...markedAvailability, ...bookedSessions];
    if (!searchQuery.trim()) return allEvents;
    const q = searchQuery.toLowerCase().trim();
    return allEvents.filter((e) => {
      const title = (e.title || '').toLowerCase();
      const body = (e.body || '').toLowerCase();
      return title.includes(q) || body.includes(q);
    });
  }, [
    scopeMode,
    filteredInstructorAvail,
    filteredClassroomAvail,
    selectedInstructor,
    selectedRoom,
    availCalendarView,
    availCalendarDate,
    definedAvailFrom,
    definedAvailTo,
    filteredInstructorUsers,
    classrooms,
    scheduledSessions,
    instructors,
    searchQuery,
    t,
    lang
  ]);

  const handleAvailCalendarNav = useCallback((dir) => {
    const cal = new Date(availCalendarDate);
    if (availCalendarView === 'month') {
      cal.setMonth(cal.getMonth() + (dir === 'next' ? 1 : -1));
    } else if (availCalendarView === 'week') {
      cal.setDate(cal.getDate() + (dir === 'next' ? 7 : -7));
    } else {
      cal.setDate(cal.getDate() + (dir === 'next' ? 1 : -1));
    }
    setAvailCalendarDate(cal);
  }, [availCalendarDate, availCalendarView]);

  // Helper function to get workload color
  const getWorkloadColor = useCallback((workloadLevel) => {
    switch (workloadLevel) {
      case 'low': return '#10b981'; // green
      case 'moderate': return '#f59e0b'; // yellow
      case 'high': return '#f97316'; // orange
      case 'overloaded': return '#ef4444'; // red
      default: return '#10b981';
    }
  }, []);

  const renderStatusIcon = useCallback((iconName, size = 14, color) => {
    const iconMap = {
      List,
      Calendar: CalendarIcon,
      Clock,
      CheckCircle2,
      XCircle
    };
    const Icon = iconMap[iconName];
    return Icon ? <Icon size={size} color={color} /> : null;
  }, []);

  // Handle show on calendar — navigate to nearest session and highlight it
  const handleShowOnCalendar = useCallback((instructorId) => {
    setMainTab('sessions');
    setScopeMode('instructor');
    setSelectedInstructor(instructorId);
    const sessions = scheduledSessions.filter(s => s.instructorId === instructorId);
    const target = findNearestSession(sessions);
    if (target) {
      setCurrentDate(new Date(target.startDateTime));
      setHighlightedSessionId(target.id);
    }
  }, [scheduledSessions, setMainTab]);

  const handleShowRoomOnCalendar = useCallback((roomId) => {
    setMainTab('sessions');
    setScopeMode('room');
    setSelectedRoom(roomId);
    const sessions = scheduledSessions.filter(s => s.classroomId === roomId);
    const target = findNearestSession(sessions);
    if (target) {
      setCurrentDate(new Date(target.startDateTime));
      setHighlightedSessionId(target.id);
    }
  }, [scheduledSessions, setMainTab]);

  const navigateToClassOnCalendar = useCallback((cls, session = null) => {
    if (!cls) return;
    const classId = cls.id || cls.docId;
    const classSessions = scheduledSessions.filter((s) => String(s.classId) === String(classId));
    const target = session
      ? (scheduledSessions.find((s) => s.id === session.id)
        || classSessions.find((s) => s.id === session.id)
        || session)
      : findNearestSession(classSessions);

    setSessionClassFilter(classId);
    setMainTab('sessions');
    setScopeMode('all');
    setSelectedInstructor(null);
    setSelectedRoom(null);
    if (cls.programId) setSidebarProgramFilter(String(cls.programId));
    if (cls.subjectId) setSidebarSubjectFilter(String(cls.subjectId));

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('tab');
      next.set('classId', String(classId));
      return next;
    }, { replace: true });

    if (target?.startDateTime) {
      setCurrentDate(new Date(target.startDateTime));
      setCurrentView('week');
      if (target.id != null) {
        setPendingClassHighlight(target.id);
      }
    }

    const label = getLocalizedClassName(cls, lang, cls.code);
    toast.info(t('viewing_class_sessions', { name: label }));
  }, [scheduledSessions, setMainTab, setSearchParams, lang, t, toast]);

  // Calendar calendars config
  const calendars = useMemo(() => [
    {
      id: 'sessions',
      name: 'Classes',
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      dragBackgroundColor: '#3b82f6'
    },
    {
      id: 'breaks',
      name: 'Breaks',
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      dragBackgroundColor: '#f59e0b'
    },
    {
      id: 'holidays',
      name: 'Holidays',
      backgroundColor: '#ef4444',
      borderColor: '#dc2626',
      dragBackgroundColor: '#ef4444'
    }
  ], []);

  // Handle event click - show custom popup or dialog based on event type
  const onClickEvent = useCallback((eventInfo) => {
    const { event } = eventInfo;
    const eventType = event.raw?.eventType;
    if (eventType === 'session') {
      const session = event.raw.session;
      if (session) setPopupSession(session);
    } else if (eventType === 'break') {
      setCalendarEventDialog({
        open: true,
        mode: 'edit',
        eventType: 'break',
        event: event.raw.breakSession,
        initialStart: event.start,
        initialEnd: event.end,
      });
    } else if (eventType === 'holiday') {
      setCalendarEventDialog({
        open: true,
        mode: 'edit',
        eventType: 'holiday',
        event: event.raw.holiday,
        initialStart: event.start,
        initialEnd: event.end,
      });
    }
  }, []);

  // Handle calendar drag-to-create (select time range) - open unified dialog
  const onBeforeCreateEvent = useCallback((eventData) => {
    const start = eventData?.start || eventData?.startDateTime;
    const end = eventData?.end || eventData?.endDateTime;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const isFullDay = (endDate - startDate) >= 24 * 60 * 60 * 1000 || (startDate.getHours() === 0 && endDate.getHours() === 0);
      setCalendarEventDialog({
        open: true,
        mode: 'create',
        eventType: isFullDay ? 'holiday' : 'break',
        event: null,
        initialStart: startDate,
        initialEnd: endDate,
      });
    }
    return false; // Prevent default creation; we'll create via dialog
  }, []);

  // Handle event update (drag/resize) with conflict preview
  const onBeforeUpdateEvent = useCallback(async (updateData) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('[DRAG/RESIZE] onBeforeUpdateEvent CALLED');
    console.log('[DRAG/RESIZE] Timestamp:', new Date().toISOString());
    console.log('[DRAG/RESIZE] updateData:', JSON.stringify({
      eventId: updateData?.event?.id,
      eventTitle: updateData?.event?.title,
      eventType: updateData?.event?.raw?.eventType,
      changes: updateData?.changes
    }, null, 2));
    
    const { event, changes } = updateData;
    const visibleDateBeforeSave = getVisibleSessionCalendarDate();
    const eventType = event?.raw?.eventType;
    const calendarFromStr = calendarDateRange.fromStrLocal;
    const calendarToStr = calendarDateRange.toStrLocal;

    if (!eventType) {
      console.error('[DRAG/RESIZE] ❌ Event data missing:', event);
      return false;
    }
    
    console.log('[DRAG/RESIZE] Event type:', eventType);

    const startDate = changes?.start || event.start;
    const endDate = changes?.end || event.end;
    if (!startDate || !endDate) {
      console.error('[SchedulingCalendarPage] Missing date data:', { startDate, endDate });
      return false;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (eventType === 'session') {
      const session = event.raw.session;
      const updatePayload = {
        classId: session.classId,
        instructorId: session.instructorId,
        classroomId: session.classroomId,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        excludeSessionId: session.id,
        updatedBy: user?.dbId
      };

      const validation = await schedulingService.validateSession(updatePayload);
      setValidationResult(validation);

      if (!validation.valid) {
        toast.error(formatValidationConflict(validation.conflicts?.[0], t) || t('validation_failed'));
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
        return false;
      }

      const result = await scheduledSessionService.updateScheduledSession(session.id, updatePayload);
      if (result.success) {
        toast.success('Session updated');
        setValidationResult(null);
        const sessionsResult = await scheduledSessionService.getAllScheduledSessions({ limit: 1000 });
        if (sessionsResult.success) setScheduledSessions(sessionsResult.data || []);
        restoreSessionCalendarDate(visibleDateBeforeSave);
        setCalendarLayoutKey((k) => k + 1);
      } else {
        toast.error(result.error || 'Failed to update session');
      }
      return result.success;
    }

    if (eventType === 'break') {
      const breakSession = event.raw.breakSession;
      const startHour = start.getHours();
      const startMinute = start.getMinutes();
      const endHour = end.getHours();
      const endMinute = end.getMinutes();

      const startStr = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
      const endStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

      const slotResolution = await resolveBreakTimeSlotForCustomTime({
        breakSession,
        startStr,
        endStr,
        timeSlots,
        breakSessions,
        user,
      });
      if (!slotResolution.success) {
        toast.error('Failed to update break time slot');
        console.error('[SchedulingCalendarPage] Break slot resolution failed:', slotResolution.error);
        return false;
      }

      const updatePayload = {
        date: start.toISOString(),
        timeSlotId: slotResolution.timeSlotId,
        updateScope: 'single',
        updatedBy: user?.dbId,
      };

      console.log('[DRAG/RESIZE] 📤 Calling backend to update break session...');
      const result = await schedulingSummaryService.updateBreakSession(breakSession.id, updatePayload);
      console.log('[DRAG/RESIZE] 📥 Backend response:', result.success ? '✅ SUCCESS' : '❌ FAILED');
      
      if (result.success) {
        toast.success('Break updated');
        console.log('[DRAG/RESIZE] 🔄 Starting state refresh sequence...');
        
        if (slotResolution.timeSlots) {
          console.log('[DRAG/RESIZE] ⏰ Updating timeSlots state');
          setTimeSlots(slotResolution.timeSlots);
        }
        
        console.log('[DRAG/RESIZE] 📋 Reloading break sessions from backend...');
        const breakResult = await schedulingSummaryService.getBreakSessions({ start: calendarFromStr, end: calendarToStr, limit: 5000 });
        console.log('[DRAG/RESIZE] 📋 Break sessions loaded:', breakResult.success ? `✅ ${breakResult.data?.length} breaks` : '❌ FAILED');
        
        if (breakResult.success) {
          console.log('[DRAG/RESIZE] 💾 Setting breakSessions state with', breakResult.data?.length, 'items');
          setBreakSessions(breakResult.data || []);
        }
        
        console.log('[DRAG/RESIZE] 📅 Restoring calendar date to:', visibleDateBeforeSave);
        restoreSessionCalendarDate(visibleDateBeforeSave);
        
        console.log('[DRAG/RESIZE] 🔑 Incrementing calendarLayoutKey to force remount');
        setCalendarLayoutKey((k) => {
          console.log('[DRAG/RESIZE] 🔑 calendarLayoutKey:', k, '→', k + 1);
          return k + 1;
        });
        
        console.log('[DRAG/RESIZE] ✅ Break update complete, returning true');
        console.log('═══════════════════════════════════════════════════════');
        return true;
      }
      console.log('[DRAG/RESIZE] ❌ Break update failed');
      console.log('═══════════════════════════════════════════════════════');
      toast.error(result.error || 'Failed to update break');
      return false;
    }

    if (eventType === 'holiday') {
      const holiday = event.raw.holiday;
      const updateData = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        updateScope: 'single',
        updatedBy: user?.dbId,
      };
      const result = await holidayService.updateHoliday(holiday.id, updateData);
      if (result.success) {
        toast.success('Holiday updated');
        const holidayResult = await holidayService.getAllHolidays({ startDate: calendarFromStr, endDate: calendarToStr, limit: 5000 });
        if (holidayResult.success) setHolidays(holidayResult.data || []);
        restoreSessionCalendarDate(visibleDateBeforeSave);
        setCalendarLayoutKey((k) => k + 1);
      } else {
        toast.error(result.error || 'Failed to update holiday');
      }
      return result.success;
    }

    return false;
  }, [user, toast, t, getVisibleSessionCalendarDate, restoreSessionCalendarDate, calendarDateRange, timeSlots, breakSessions, setCalendarLayoutKey]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setValidationResult(null);
    setEditingSessionId(null);
  }, []);

  const handleSessionChangeStatus = useCallback(() => {
    const session = scheduledSessions.find((s) => s.id === editingSessionId);
    if (session) {
      setSessionToChangeStatus(session);
      setShowStatusModal(true);
      setShowCreateModal(false);
    }
  }, [editingSessionId, scheduledSessions]);

  const closeCalendarEventDialog = useCallback(() => {
    setCalendarEventDialog((prev) => ({ ...prev, open: false, event: null }));
  }, []);

  const handleCalendarEventSave = useCallback(async ({ eventType, mode, payload, event }) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('[DIALOG SAVE] handleCalendarEventSave called');
    console.log('[DIALOG SAVE] eventType:', eventType);
    console.log('[DIALOG SAVE] mode:', mode);
    console.log('[DIALOG SAVE] event:', event);
    console.log('[DIALOG SAVE] payload BEFORE processing:', JSON.stringify(payload, null, 2));
    
    const visibleDateBeforeSave = getVisibleSessionCalendarDate();
    const { fromStrLocal: calendarFromStr, toStrLocal: calendarToStr } = calendarDateRange;
    console.log('[DIALOG SAVE] Calendar date range:', { calendarFromStr, calendarToStr });
    let result;
    if (eventType === 'break') {
      console.log('[DIALOG SAVE] Processing break save', { mode, eventId: event?.id });
      if (payload.customStartTime && payload.customEndTime && event) {
        console.log('[DIALOG SAVE] Custom time provided, resolving time slot...');
        const slotResolution = await resolveBreakTimeSlotForCustomTime({
          breakSession: event,
          startStr: payload.customStartTime,
          endStr: payload.customEndTime,
          timeSlots,
          breakSessions,
          user,
        });
        console.log('[DIALOG SAVE] Break dialog slot resolution:', slotResolution);
        if (!slotResolution.success) {
          toast.error('Failed to update break time slot');
          return;
        }
        if (slotResolution.timeSlots) {
          setTimeSlots(slotResolution.timeSlots);
        }
        payload = { ...payload, timeSlotId: slotResolution.timeSlotId };
        
        // Recalculate date based on custom start time (not time slot, to avoid race conditions)
        if (payload.customStartTime && payload.date) {
          const originalDate = new Date(payload.date);
          const [hours, minutes] = payload.customStartTime.split(':').map(Number);
          const newDate = new Date(originalDate);
          // Use UTC methods since the date is in UTC (has Z suffix)
          newDate.setUTCHours(hours, minutes, 0, 0);
          const newDateStr = newDate.toISOString();
          console.log('[DIALOG SAVE] Recalculated date based on custom start time:', {
            originalDate: originalDate.toISOString(),
            newDate: newDateStr,
            customStartTime: payload.customStartTime,
            hours,
            minutes
          });
          payload.date = newDateStr;
        }
        
        const { customStartTime, customEndTime, ...breakPayload } = payload;
        payload = breakPayload;
        console.log('[DIALOG SAVE] payload AFTER time slot resolution:', JSON.stringify(payload, null, 2));
      }
      if (mode === 'edit' && event) {
        console.log('[DIALOG SAVE] Calling updateBreakSession with id:', event.id);
        console.log('[DIALOG SAVE] Final payload:', JSON.stringify(payload, null, 2));
        result = await schedulingSummaryService.updateBreakSession(event.id, payload);
        console.log('[DIALOG SAVE] Break update result:', result);
      } else {
        result = await schedulingSummaryService.createBreakSession(payload);
        console.log('[DIALOG SAVE] Break create result:', result);
      }
      if (result.success) {
        toast.success(mode === 'edit' ? 'Break updated' : 'Break created');
        // Full page refresh to ensure calendar refresh
        console.log('[DIALOG SAVE] Triggering full page refresh');
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to save break');
      }
    } else if (eventType === 'holiday') {
      console.log('[SchedulingCalendarPage] Processing holiday save', { mode, eventId: event?.id });
      if (mode === 'edit' && event) {
        result = await holidayService.updateHoliday(event.id, payload);
        console.log('[SchedulingCalendarPage] Holiday update result:', result);
      } else {
        result = await holidayService.createHoliday(payload);
        console.log('[SchedulingCalendarPage] Holiday create result:', result);
      }
      if (result.success) {
        toast.success(mode === 'edit' ? 'Holiday updated' : 'Holiday created');
        // Full page refresh to ensure calendar refresh
        console.log('[DIALOG SAVE] Triggering full page refresh');
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to save holiday');
      }
    }
    if (result?.success) {
      setDeleteScopeDialog({ open: false, eventType: null, event: null });
      closeCalendarEventDialog();
      restoreSessionCalendarDate(visibleDateBeforeSave);
      // loadData already triggers calendar sync, no need for layout key increment
    }
  }, [toast, getVisibleSessionCalendarDate, restoreSessionCalendarDate, calendarDateRange, closeCalendarEventDialog, setCalendarLayoutKey, loadData]);

  const handleCalendarEventDelete = useCallback(async ({ eventType, event, deleteScope }) => {
    const visibleDateBeforeSave = getVisibleSessionCalendarDate();
    const { fromStrLocal: calendarFromStr, toStrLocal: calendarToStr } = calendarDateRange;
    let result;
    if (eventType === 'break') {
      result = await schedulingSummaryService.deleteBreakSession(event.id, deleteScope);
      if (result.success) {
        toast.success('Break deleted');
        // Full page refresh to ensure calendar refresh
        console.log('[DELETE] Triggering full page refresh');
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to delete break');
      }
    } else if (eventType === 'holiday') {
      console.log('[DELETE] Deleting holiday:', { id: event.id, deleteScope });
      result = await holidayService.deleteHoliday(event.id, deleteScope);
      console.log('[DELETE] Holiday delete result:', result);
      if (result.success) {
        toast.success('Holiday deleted');
        // Full page refresh to ensure calendar refresh
        console.log('[DELETE] Triggering full page refresh');
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to delete holiday');
      }
    }
    if (result?.success) {
      setDeleteScopeDialog({ open: false, eventType: null, event: null });
      closeCalendarEventDialog();
      restoreSessionCalendarDate(visibleDateBeforeSave);
      // loadData already triggers calendar sync, no need for layout key increment
    }
  }, [toast, getVisibleSessionCalendarDate, restoreSessionCalendarDate, calendarDateRange, closeCalendarEventDialog, setCalendarLayoutKey, loadData]);

  // Handle event delete - show confirmation modal
  const onBeforeDeleteEvent = useCallback(async (eventData) => {
    const { event } = eventData;
    const eventType = event?.raw?.eventType;

    if (eventType === 'session') {
      const session = event.raw.session;
      if (!session || !session.id) {
        console.error('Event data missing for delete:', event);
        toast.error('Cannot delete session: missing session data');
        return false;
      }
      setSessionToDelete(session);
      setShowDeleteModal(true);
      setDeletionReason('');
      setRequiresReason(false);
      return false;
    }

    if (eventType === 'break' || eventType === 'holiday') {
      const hasSeries = eventType === 'break'
        ? !!event.raw.breakSession?.seriesId
        : !!event.raw.holiday?.seriesId;
      if (hasSeries) {
        setDeleteScopeDialog({ open: true, eventType, event: event.raw });
      } else {
        setDeleteScopeDialog({ open: true, eventType, event: event.raw });
      }
      return false;
    }

    return false;
  }, [toast]);
  
  // Handle actual deletion from modal
  const handleConfirmDelete = useCallback(async () => {
    if (!sessionToDelete) return;
    
    const result = await scheduledSessionService.deleteScheduledSession(
      sessionToDelete.id,
      user?.dbId,
      deletionReason || null
    );
    
    if (result.success) {
      toast.success(result.message || 'Session deleted');
      setShowDeleteModal(false);
      setSessionToDelete(null);
      setDeletionReason('');
      loadData();
    } else if (result.requiresReason) {
      // Session has attendance, reason is required
      setRequiresReason(true);
      toast.warning(result.error);
    } else {
      toast.error(result.error || 'Failed to delete session');
    }
  }, [sessionToDelete, user, deletionReason, toast, loadData]);
  
  // Handle status change
  const handleStatusChange = useCallback(async () => {
    if (!sessionToChangeStatus || !newStatus) return;
    
    const visibleDateBeforeSave = getVisibleSessionCalendarDate();
    const result = await scheduledSessionService.updateSessionStatus(
      sessionToChangeStatus.id,
      newStatus,
      user?.dbId,
      statusChangeReason || null
    );
    
    if (result.success) {
      toast.success(result.message || `Session status changed to ${newStatus}`);
      setShowStatusModal(false);
      setSessionToChangeStatus(null);
      setNewStatus('');
      setStatusChangeReason('');
      const sessionsResult = await scheduledSessionService.getAllScheduledSessions({ limit: 1000 });
      if (sessionsResult.success) {
        setScheduledSessions(sessionsResult.data || []);
      }
      restoreSessionCalendarDate(visibleDateBeforeSave);
    } else {
      toast.error(result.error || 'Failed to change status');
    }
  }, [
    sessionToChangeStatus,
    newStatus,
    statusChangeReason,
    user,
    toast,
    getVisibleSessionCalendarDate,
    restoreSessionCalendarDate
  ]);

  // Handle drag from sidebar
  const handleClassDragStart = useCallback((e, classItem) => {
    e.dataTransfer.setData('classItem', JSON.stringify(classItem));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Handle drop on calendar - open modal for configuration
  const handleCalendarDrop = useCallback(async (e) => {
    console.log('[SchedulingCalendarPage] handleCalendarDrop called', { mainTab });
    e.preventDefault();
    if (mainTab !== 'sessions') {
      console.log('[SchedulingCalendarPage] Not in sessions tab, ignoring drop');
      return;
    }

    const classItemData = e.dataTransfer.getData('classItem');
    const eventType = e.dataTransfer.getData('eventType');
    console.log('[SchedulingCalendarPage] Drop data:', { classItemData, eventType });

    if (eventType === 'break' || eventType === 'holiday') {
      console.log('[SchedulingCalendarPage] Processing event type drop:', eventType);
      const cal = calendarRef.current?.getInstance();
      const rawAnchor = cal?.getDate?.();
      const anchorDate = rawAnchor
        ? (typeof rawAnchor.toDate === 'function' ? rawAnchor.toDate() : new Date(rawAnchor))
        : new Date(currentDate);

      const resolved = resolveSessionDropDateTime(
        e.clientX,
        e.clientY,
        sessionCalendarContainerRef.current,
        { currentView, anchorDate, hideWeekends }
      );

      const startDateTime = resolved?.startDateTime ?? (() => {
        const fallback = new Date(anchorDate);
        fallback.setHours(9, 0, 0, 0);
        return fallback;
      })();

      let endDateTime;
      if (eventType === 'holiday') {
        endDateTime = new Date(startDateTime);
        endDateTime.setHours(23, 59, 59, 999);
      } else {
        endDateTime = resolved?.endDateTime ?? new Date(startDateTime.getTime() + 45 * 60 * 1000);
      }

      console.log('[SchedulingCalendarPage] Opening dialog for:', { eventType, startDateTime, endDateTime });
      setCalendarEventDialog({
        open: true,
        mode: 'create',
        eventType,
        event: null,
        initialStart: startDateTime,
        initialEnd: endDateTime,
      });
      return;
    }

    if (!classItemData) {
      console.log('[SchedulingCalendarPage] No class item data, ignoring drop');
      return;
    }

    const classItem = JSON.parse(classItemData);
    setEditingSessionId(null);

    const defaultInstructor = instructors.find(i => i.id === classItem.instructorId);
    const defaultInstructorEmail = defaultInstructor?.email || null;
    const defaultInstructorId = defaultInstructor?.id || null;
    const defaultClassroomId = classItem.classroomId || null;

    const cal = calendarRef.current?.getInstance();
    const rawAnchor = cal?.getDate?.();
    const anchorDate = rawAnchor
      ? (typeof rawAnchor.toDate === 'function' ? rawAnchor.toDate() : new Date(rawAnchor))
      : new Date(currentDate);

    const resolved = resolveSessionDropDateTime(
      e.clientX,
      e.clientY,
      sessionCalendarContainerRef.current,
      { currentView, anchorDate, hideWeekends }
    );

    const startDateTime = resolved?.startDateTime ?? (() => {
      const fallback = new Date(anchorDate);
      fallback.setHours(9, 0, 0, 0);
      return fallback;
    })();
    const endDateTime = resolved?.endDateTime ?? new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

    setModalClassItem(classItem);
    setModalStartDateTime(startDateTime);
    setModalEndDateTime(endDateTime);
    setModalInstructorEmail(defaultInstructorEmail);
    setModalInstructorId(defaultInstructorId);
    setModalClassroomId(defaultClassroomId || null);
    setValidationResult(null);
    setShowCreateModal(true);
  }, [mainTab, currentDate, currentView, hideWeekends, instructors]);

  // Handle session creation from modal
  const handleCreateSession = useCallback(async () => {
    if (!modalClassItem) {
      toast.error('Class information is missing');
      return;
    }
    
    if (!modalClassroomId) {
      toast.error(t('classroom_required'));
      return;
    }

    // Validate end time is after start time
    if (modalEndDateTime <= modalStartDateTime) {
      toast.error(t('end_time_validation_error'));
      return;
    }

    const sessionData = {
      classId: modalClassItem.id,
      instructorId: modalInstructorId || null,
      classroomId: modalClassroomId || null,
      startDateTime: modalStartDateTime.toISOString(),
      endDateTime: modalEndDateTime.toISOString(),
      status: 'scheduled',
      notes: t('scheduled_via_calendar')
    };
    
    console.log('📤 [CREATE SESSION] Sending data:', sessionData);

    // Handle update of existing session
    if (editingSessionId) {
      const visibleDateBeforeSave = getVisibleSessionCalendarDate();
      const result = await scheduledSessionService.updateScheduledSession(editingSessionId, sessionData);
      
      if (result.success) {
        toast.success('Session updated successfully!');
        setShowCreateModal(false);
        setValidationResult(null);
        setEditingSessionId(null);
        const sessionsResult = await scheduledSessionService.getAllScheduledSessions({ limit: 1000 });
        if (sessionsResult.success) {
          setScheduledSessions(sessionsResult.data || []);
        }
        restoreSessionCalendarDate(visibleDateBeforeSave);
      } else {
        toast.error(result.error || 'Failed to update session');
      }
      return;
    }

    if (isRecurring) {
      const effectiveDays = recurrenceType === 'daily'
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        : recurrenceDays;

      if (recurrenceType !== 'daily' && !effectiveDays.length) {
        toast.error(t('recurrence_days_required'));
        return;
      }
      if (recurrenceEndMode === 'date' && !recurrenceEndDate) {
        toast.error(t('recurrence_end_required'));
        return;
      }
      if (recurrenceEndMode === 'count' && !recurrenceCount) {
        toast.error(t('recurrence_end_required'));
        return;
      }
      if (recurrenceEndMode === 'date' && recurrenceEndDate && modalStartDateTime
        && recurrenceEndDate < modalStartDateTime) {
        toast.error(t('series_end_before_start'));
        return;
      }

      const recurrenceConfig = {
        recurrenceType,
        recurrenceDays: effectiveDays,
        recurrenceEndDate: recurrenceEndMode === 'date' ? recurrenceEndDate?.toISOString() : null,
        recurrenceCount: recurrenceEndMode === 'count' ? recurrenceCount : null,
        timesPerDay
      };

      const result = await schedulingService.createRecurringSessions(sessionData, recurrenceConfig);
      
      if (result.success) {
        toast.success(`Recurring series created: ${result.data.totalCreated} sessions!`);
        setShowCreateModal(false);
        setValidationResult(null);
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
        const errorMsg = validation.conflicts?.length
          ? formatValidationConflict(validation.conflicts[0], t)
          : (validation.error || t('validation_failed'));
        toast.error(errorMsg);
        
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
        toast.success(`${getLocalizedClassName(modalClassItem, lang, modalClassItem.code)} scheduled successfully!`);
        setShowCreateModal(false);
        setValidationResult(null);
        loadData();
      } else {
        toast.error(result.error || 'Failed to create session');
      }
    }
  }, [modalClassItem, modalClassroomId, modalInstructorId, modalStartDateTime, modalEndDateTime, isRecurring, recurrenceType, recurrenceDays, recurrenceEndDate, recurrenceCount, recurrenceEndMode, timesPerDay, toast, loadData, editingSessionId, t, lang, getVisibleSessionCalendarDate, restoreSessionCalendarDate]);

  const applySuggestedSlot = useCallback((start, end) => {
    setModalStartDateTime(new Date(start));
    setModalEndDateTime(new Date(end));
    setValidationResult(null);
  }, []);

  // Live validation while configuring a session (debounced)
  useEffect(() => {
    if (!showCreateModal || editingSessionId || !modalClassItem || !modalClassroomId) {
      return undefined;
    }
    if (!modalStartDateTime || !modalEndDateTime || modalEndDateTime <= modalStartDateTime) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      const sessionData = {
        classId: modalClassItem.id,
        instructorId: modalInstructorId || null,
        classroomId: modalClassroomId,
        startDateTime: modalStartDateTime.toISOString(),
        endDateTime: modalEndDateTime.toISOString(),
        status: 'scheduled'
      };
      const validation = await schedulingService.validateSession(sessionData);
      setValidationResult(validation);
    }, 450);

    return () => clearTimeout(timer);
  }, [
    showCreateModal,
    editingSessionId,
    modalClassItem,
    modalClassroomId,
    modalInstructorId,
    modalStartDateTime,
    modalEndDateTime
  ]);

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

  const forceSessionCalendarLayout = useCallback(() => {
    const el = sessionCalendarContainerRef.current;
    const measuredHeight = el?.offsetHeight || SESSION_CALENDAR_HEIGHT;
    const nextHeight = Math.max(measuredHeight, SESSION_CALENDAR_HEIGHT);

    setSessionCalendarHeight((prev) => (prev === nextHeight ? prev : nextHeight));

    requestAnimationFrame(() => {
      const cal = calendarRef.current?.getInstance();
      if (!cal) return;
      if (typeof cal.render === 'function') cal.render();
      if (typeof cal.updateSize === 'function') cal.updateSize();
    });
  }, []);

  useEffect(() => {
    const timers = [0, 100, 300].map((ms) => setTimeout(() => {
      setCalendarLayoutKey((k) => k + 1);
      forceSessionCalendarLayout();
    }, ms));
    return () => timers.forEach(clearTimeout);
  }, [isClassesPanelExpanded, showStats, isFullscreen, forceSessionCalendarLayout]);

  useLayoutEffect(() => {
    if (mainTab !== 'sessions') return undefined;

    setSessionCalendarHeight(SESSION_CALENDAR_HEIGHT);
    const timers = [0, 50, 150, 400].map((ms) => setTimeout(forceSessionCalendarLayout, ms));
    return () => timers.forEach(clearTimeout);
  }, [
    mainTab,
    currentView,
    hideWeekends,
    narrowWeekend,
    calendarLayoutKey,
    lang,
    forceSessionCalendarLayout
  ]);

  useEffect(() => {
    if (mainTab !== 'sessions') return undefined;
    const el = sessionCalendarContainerRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(() => forceSessionCalendarLayout());
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener('resize', forceSessionCalendarLayout);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', forceSessionCalendarLayout);
    };
  }, [mainTab, forceSessionCalendarLayout]);

  const isClassesTab = mainTab === 'classes';
  const sessionClassFilterLabel = useMemo(() => {
    if (sessionClassFilter == null) return null;
    const match = classes.find((c) => String(c.id || c.docId) === String(sessionClassFilter));
    return getLocalizedClassName(match, lang) || null;
  }, [sessionClassFilter, classes, lang]);

  const calendarDayNames = useMemo(
    () => getCalendarDayNames(t, hideWeekends),
    [t, hideWeekends]
  );

  const sessionCalendarTemplates = useMemo(() => ({
    ...createToastCalendarTemplates(lang, t),
    time: (event) => {
      const eventType = event.raw?.eventType;
      const session = event.raw?.session;
      const breakSession = event.raw?.breakSession;
      const holiday = event.raw?.holiday;
      let title = event.title || '';
      let body = '';
      if (eventType === 'session' && session) {
        const venue = buildSessionEventVenueLine(session, lang, t);
        const instructor = buildSessionEventInstructorLine(session, lang, t);
        title = getLocalizedClassName(session.class, lang, session.class.code || t('class'));
        body = `${escapeHtml(venue)}${venue ? ' • ' : ''}${escapeHtml(instructor)}`;
      } else if (eventType === 'break' && breakSession) {
        const where = [
          breakSession.classroom?.nameEn || breakSession.classroom?.code,
          breakSession.instructor?.displayName
        ].filter(Boolean).join(' • ');
        title = `${breakSession.breakType || t('break')}`;
        body = escapeHtml(where);
      } else if (eventType === 'holiday' && holiday) {
        title = holiday.descriptionEn || holiday.descriptionAr || t('holiday');
        body = escapeHtml(holiday.type || '');
      }
      return `
        <div style="display: flex; flex-direction: column; justify-content: center; width: 100%; height: 100%; min-height: 100%; padding: 4px 6px; line-height: 1.2; overflow: hidden; box-sizing: border-box; color: #ffffff;">
          <div style="font-weight: 600; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(title)}</div>
          <div style="font-size: 10px; opacity: 0.92; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${body}</div>
        </div>
      `;
    }
  }), [lang, t]);
  const showFullCalendarNav = !isClassesTab && (mainTab !== 'availability' || availabilityDataMode === 'timeline');
  const isAvailTimeline = mainTab === 'availability' && availabilityDataMode === 'timeline';
  const isAvailabilityTab = mainTab === 'availability';
  const calendarSearchPlaceholder = useMemo(() => {
    if (mainTab === 'sessions') {
      if (scopeMode === 'instructor') return t('search_sessions_class_room');
      if (scopeMode === 'room') return t('search_sessions_class_instructor');
      return t('search_sessions_class_room_instructor');
    }
    if (mainTab === 'availability') {
      if (availabilityDataMode === 'timeline') {
        if (scopeMode === 'room') return t('search_timeline_room_events');
        return t('search_timeline_instructor_events');
      }
      if (availabilityDataMode === 'workload') {
        if (scopeMode === 'room') return t('search_workload_rooms');
        return t('search_workload_instructors');
      }
      if (scopeMode === 'room') return t('search_defined_rooms');
      return t('search_defined_instructors');
    }
    return t('search_rooms_instructors');
  }, [mainTab, scopeMode, availabilityDataMode, t]);
  const toolbarAccent = isAvailTimeline ? '#10b981' : '#3b82f6';
  const toolbarView = isAvailTimeline ? availCalendarView : currentView;
  const toolbarNavPrev = isAvailTimeline ? () => handleAvailCalendarNav('prev') : handlePrev;
  const toolbarNavNext = isAvailTimeline ? () => handleAvailCalendarNav('next') : handleNext;
  const toolbarNavToday = isAvailTimeline ? () => setAvailCalendarDate(new Date()) : handleToday;
  const toolbarViewChange = isAvailTimeline ? setAvailCalendarView : handleViewChange;

  const instructorPool = filteredInstructorUsers.length || instructors.length;

  const overviewStatCards = useMemo(() => {
    const card = (value, label, Icon, iconColor, iconBg) => ({ value, label, Icon, iconColor, iconBg });

    if (isClassesTab) {
      return [
        card(stats.totalPrograms, t('stats_total_programs'), BookOpen, '#6366f1', '#e0e7ff'),
        card(stats.totalSubjects, t('stats_total_subjects'), BookOpen, '#6366f1', '#e0e7ff'),
        card(stats.totalClasses, t('stats_total_classes'), GraduationCap, '#8b5cf6', '#ede9fe'),
        card(stats.classesWithSessions, t('stats_classes_with_sessions'), BookOpen, '#8b5cf6', '#ede9fe'),
        card(stats.classesMissingSetup, t('stats_classes_missing_setup'), XCircle, STATUS_COLORS.cancelled, '#fee2e2'),
        card(`${stats.uniqueClassrooms}/${classrooms.length}`, t('rooms_used'), DoorOpen, '#10b981', '#d1fae5'),
        card(stats.unusedRooms, t('stats_rooms_unused'), DoorOpen, '#6b7280', '#f3f4f6')
      ];
    }

    if (isAvailabilityTab) {
      return [
        card(stats.totalPrograms, t('stats_total_programs'), BookOpen, '#6366f1', '#e0e7ff'),
        card(stats.totalSubjects, t('stats_total_subjects'), BookOpen, '#6366f1', '#e0e7ff'),
        card(stats.totalClasses, t('stats_total_classes'), GraduationCap, '#8b5cf6', '#ede9fe'),
        card(stats.instructorAvailRules, t('stats_instructor_avail_rules'), Users, '#10b981', '#d1fae5'),
        card(stats.instructorsWithAvailability, t('stats_instructors_with_hours'), Users, '#10b981', '#d1fae5'),
        card(stats.roomAvailRules, t('stats_room_avail_rules'), DoorOpen, '#10b981', '#d1fae5'),
        card(stats.roomsWithAvailability, t('stats_rooms_with_hours'), DoorOpen, '#10b981', '#d1fae5'),
        card(`${stats.uniqueClassrooms}/${classrooms.length}`, t('rooms_used'), DoorOpen, '#10b981', '#d1fae5'),
        card(stats.unusedRooms, t('stats_rooms_unused'), DoorOpen, '#6b7280', '#f3f4f6'),
        card(stats.unusedInstructors, t('stats_instructors_unused'), Users, '#6b7280', '#f3f4f6')
      ];
    }

    return [
      card(stats.totalPrograms, t('stats_total_programs'), BookOpen, '#6366f1', '#e0e7ff'),
      card(stats.totalSubjects, t('stats_total_subjects'), BookOpen, '#6366f1', '#e0e7ff'),
      card(stats.totalClasses, t('stats_total_classes'), GraduationCap, '#8b5cf6', '#ede9fe'),
      card(stats.thisWeekSessions, t('this_week'), CalendarIcon, STATUS_COLORS.scheduled, '#dbeafe'),
      card(stats.totalSessions, t('total_sessions'), Clock, STATUS_COLORS.scheduled, '#dbeafe'),
      card(stats.scheduledCount, t('scheduled'), Save, STATUS_COLORS.scheduled, '#dbeafe'),
      card(stats.inProgressCount, t('in_progress'), Clock, STATUS_COLORS.in_progress, '#fef3c7'),
      card(stats.completedCount, t('completed'), CheckCircle2, STATUS_COLORS.completed, '#d1fae5'),
      card(stats.cancelledCount, t('cancelled'), XCircle, STATUS_COLORS.cancelled, '#fee2e2'),
      card(`${stats.uniqueClassrooms}/${classrooms.length}`, t('rooms_used'), DoorOpen, '#10b981', '#d1fae5'),
      card(stats.unusedRooms, t('stats_rooms_unused'), DoorOpen, '#6b7280', '#f3f4f6'),
      card(`${stats.uniqueInstructors}/${instructorPool}`, t('stats_instructors_active'), Users, '#f59e0b', '#fef3c7'),
      card(stats.unusedInstructors, t('stats_instructors_unused'), Users, '#6b7280', '#f3f4f6'),
      card(`${stats.avgDuration}h`, t('avg_duration'), BarChart3, '#ec4899', '#fce7f3')
    ];
  }, [isClassesTab, isAvailabilityTab, stats, classrooms.length, instructorPool, t]);

  const statsSummary = useMemo(() => {
    if (isClassesTab) {
      return `${stats.totalPrograms} ${t('stats_total_programs')} · ${stats.totalSubjects} ${t('stats_total_subjects')} · ${stats.totalClasses} ${t('stats_total_classes')} · ${stats.unusedRooms} ${t('stats_rooms_unused')}`;
    }
    if (isAvailabilityTab) {
      return `${stats.instructorAvailRules} ${t('stats_instructor_avail_rules')} · ${stats.unusedRooms} ${t('stats_rooms_unused')} · ${stats.unusedInstructors} ${t('stats_instructors_unused')}`;
    }
    return `${stats.totalPrograms} ${t('programs')} · ${stats.totalSubjects} ${t('subjects')} · ${stats.totalClasses} ${t('classes')} · ${stats.thisWeekSessions} ${t('this_week')} · ${stats.cancelledCount} ${t('cancelled')} · ${stats.unusedRooms} ${t('stats_rooms_unused')}`;
  }, [isClassesTab, isAvailabilityTab, stats, t]);

  const navBtnStyle = {
    padding: '0.5rem',
    backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
    borderRadius: '0.375rem',
    cursor: 'pointer',
    color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
  };

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
    return <SimpleLoading message={t('loading_scheduling_data')} />;
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
    flexDirection: 'column',
    gap: '0.375rem',
    padding: '1rem',
    height: 'calc(100vh - 100px)'
  };

  return (
    <div style={containerStyle}>
      {/* Statistics Bar - Collapsible */}
      {!isFullscreen && (
        <div style={{
          width: '100%',
          flexShrink: 0,
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
          borderRadius: '0.5rem',
          padding: showStats ? '0.625rem 0.75rem' : '0.375rem 0.75rem',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: showStats ? '0.5rem' : 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
              <BarChart3 size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: theme === 'dark' ? '#f3f4f6' : '#1f2937', flexShrink: 0 }}>
                {t('scheduling_overview')}
              </span>
              {!showStats && (
                <span style={{
                  fontSize: '0.75rem',
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {statsSummary}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/summary-dashboard')}
                data-testid="view-summary-btn"
                title={t('view_summary') || 'View Summary'}
                aria-label={t('view_summary') || 'View Summary'}
              >
                <LayoutDashboard size={16} />
              </Button>
              <button
              onClick={() => setShowStats(!showStats)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.125rem',
                flexShrink: 0
              }}
              title={showStats ? t('collapse') : t('expand')}
            >
              {showStats
                ? <ChevronUp size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                : <ChevronDown size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />}
            </button>
          </div>
          </div>
          {showStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.5rem'
        }}>
          {overviewStatCards.map(({ value, label, Icon, iconColor, iconBg }) => (
            <SchedulingStatCard
              key={label}
              value={value}
              label={label}
              Icon={Icon}
              iconColor={iconColor}
              iconBg={iconBg}
              theme={theme}
            />
          ))}
        </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Main Calendar */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* View Mode Selector and Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem', width: '100%' }}>
            {/* Tab Ribbon: Sessions | Availability → scope */}
            <div style={{ 
              display: 'flex', 
              gap: '0.25rem', 
              flexWrap: 'wrap',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
              padding: '0.25rem',
              borderRadius: '0.5rem',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
            }}>
              <button
                onClick={() => { setMainTab('sessions'); setScopeMode('all'); setSelectedInstructor(null); setSelectedRoom(null); }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: mainTab === 'sessions' ? '#3b82f6' : 'transparent',
                  color: mainTab === 'sessions' ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                  border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem',
                  fontWeight: mainTab === 'sessions' ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <CalendarIcon size={14} />
                {t('main_tab_sessions')}
              </button>
              <button
                onClick={() => {
                  setMainTab('classes');
                  setSessionClassFilter(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: mainTab === 'classes' ? '#8b5cf6' : 'transparent',
                  color: mainTab === 'classes' ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                  border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem',
                  fontWeight: mainTab === 'classes' ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <GraduationCap size={14} />
                {t('classes_availability')}
              </button>
              <button
                onClick={() => { navigateAvailabilityView('instructor'); setSelectedRoom(null); }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: mainTab === 'availability' && scopeMode === 'instructor' ? '#10b981' : 'transparent',
                  color: mainTab === 'availability' && scopeMode === 'instructor' ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                  border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem',
                  fontWeight: mainTab === 'availability' && scopeMode === 'instructor' ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <User size={14} />
                {t('instructor_availability')}
              </button>
              <button
                onClick={() => { navigateAvailabilityView('room'); setSelectedInstructor(null); }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: mainTab === 'availability' && scopeMode === 'room' ? '#10b981' : 'transparent',
                  color: mainTab === 'availability' && scopeMode === 'room' ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                  border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem',
                  fontWeight: mainTab === 'availability' && scopeMode === 'room' ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <DoorOpen size={14} />
                {t('room_availability')}
              </button>

              <div style={{ width: '1px', backgroundColor: theme === 'dark' ? '#374151' : '#d1d5db', margin: '0 0.25rem' }} />

              {mainTab === 'sessions' && (
                <>
                  <button
                    onClick={() => { setSessionsScope('all'); setSelectedInstructor(null); setSelectedRoom(null); }}
                    title={t('all_sessions')}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: scopeMode === 'all' ? '#3b82f6' : 'transparent',
                      color: scopeMode === 'all' ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                      border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem',
                      fontWeight: scopeMode === 'all' ? 600 : 400
                    }}
                  >
                    {t('all')}
                  </button>
                  <button
                    onClick={() => { setSessionsScope('instructor'); setSelectedRoom(null); }}
                    title={t('by_instructor')}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: scopeMode === 'instructor' ? '#3b82f6' : 'transparent',
                      color: scopeMode === 'instructor' ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                      border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem',
                      fontWeight: scopeMode === 'instructor' ? 600 : 400,
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    <User size={16} />
                  </button>
                  <button
                    onClick={() => { setSessionsScope('room'); setSelectedInstructor(null); }}
                    title={t('by_room')}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: scopeMode === 'room' ? '#3b82f6' : 'transparent',
                      color: scopeMode === 'room' ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                      border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem',
                      fontWeight: scopeMode === 'room' ? 600 : 400,
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    <DoorOpen size={16} />
                  </button>
                </>
              )}

              {mainTab === 'availability' && (
                <>
                  {[
                    { mode: 'defined', Icon: LayoutList, titleKey: 'defined_hours_view', activeColor: '#10b981' },
                    { mode: 'timeline', Icon: CalendarDays, titleKey: 'timeline_view', activeColor: '#10b981' },
                    { mode: 'workload', Icon: BarChart3, titleKey: 'scheduled_workload_view', activeColor: '#3b82f6' }
                  ].map(({ mode, Icon, titleKey, activeColor }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAvailabilityDataMode(mode)}
                      title={t(titleKey)}
                      aria-label={t(titleKey)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: availabilityDataMode === mode ? activeColor : 'transparent',
                        color: availabilityDataMode === mode ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon size={16} />
                    </button>
                  ))}

                  {availabilityDataMode === 'workload' && (
                    <>
                      <div style={{ width: '1px', backgroundColor: theme === 'dark' ? '#374151' : '#d1d5db', margin: '0 0.25rem' }} />
                      {[
                        { mode: 'tree', Icon: List, titleKey: 'tree_view' },
                        { mode: 'table', Icon: Grid, titleKey: 'table_view' },
                        { mode: 'drill', Icon: BarChart3, titleKey: 'drill_down_view' }
                      ].map(({ mode, Icon, titleKey }) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setWorkloadViewMode(mode)}
                          title={t(titleKey)}
                          aria-label={t(titleKey)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: workloadViewMode === mode ? '#3b82f6' : 'transparent',
                            color: workloadViewMode === mode ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Icon size={16} />
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}

              {mainTab === 'classes' && (
                <>
                  <button
                    type="button"
                    onClick={() => setClassesViewMode('semester')}
                    title={t('semester_overview')}
                    aria-label={t('semester_overview')}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: classesViewMode === 'semester' ? '#8b5cf6' : 'transparent',
                      color: classesViewMode === 'semester' ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassesViewMode('grid')}
                    title={t('grid_view')}
                    aria-label={t('grid_view')}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: classesViewMode === 'grid' ? '#8b5cf6' : 'transparent',
                      color: classesViewMode === 'grid' ? '#ffffff' : theme === 'dark' ? '#9ca3af' : '#6b7280',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <LayoutGrid size={16} />
                  </button>
                </>
              )}
            </div>
            
            {/* Quick Search */}
            {!isClassesTab && (
            <Input
              placeholder={calendarSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              theme={theme}
              style={{ 
                padding: '0.5rem',
                border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                borderRadius: '0.375rem',
                backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                fontSize: '0.875rem',
                minWidth: '200px'
              }}
            />
            )}

            {mainTab === 'sessions' && sessionClassFilterLabel && (
              <button
                type="button"
                onClick={() => {
                  setSessionClassFilter(null);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('classId');
                    return next;
                  }, { replace: true });
                }}
                title={t('clear_class_filter')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '999px',
                  border: '1px solid #8b5cf6',
                  background: '#8b5cf620',
                  color: '#8b5cf6',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <GraduationCap size={14} />
                {sessionClassFilterLabel}
                <span style={{ opacity: 0.7 }}>×</span>
              </button>
            )}

            {showFullCalendarNav && (
              <>
                <button type="button" onClick={toolbarNavPrev} style={navBtnStyle} aria-label="Previous">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={toolbarNavToday} style={navBtnStyle} title={t('today')}>
                  <CalendarIcon size={16} />
                </button>
                <button type="button" onClick={toolbarNavNext} style={navBtnStyle} aria-label="Next">
                  <ChevronRight size={16} />
                </button>
                {['day', 'week', 'month'].map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => toolbarViewChange(view)}
                    style={{
                      ...navBtnStyle,
                      padding: '0.5rem 1rem',
                      backgroundColor: toolbarView === view ? toolbarAccent : navBtnStyle.backgroundColor,
                      color: toolbarView === view ? '#ffffff' : navBtnStyle.color
                    }}
                  >
                    {t(view)}
                  </button>
                ))}
              </>
            )}

            {(mainTab === 'sessions' || isAvailTimeline) && !isClassesTab && (
              <>
                <button
                  type="button"
                  onClick={() => setHideWeekends(!hideWeekends)}
                  style={{
                    ...navBtnStyle,
                    backgroundColor: hideWeekends ? toolbarAccent : navBtnStyle.backgroundColor,
                    color: hideWeekends ? '#ffffff' : navBtnStyle.color
                  }}
                  title={t('hide_weekends')}
                >
                  <CalendarOff size={16} />
                </button>
                <button type="button" onClick={toggleFullscreen} style={navBtnStyle}>
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </>
            )}

            {mainTab === 'availability' && scopeMode === 'instructor' && (
              <UserSelect
                users={filteredInstructorUsers}
                enrollments={enrollments}
                classes={classes}
                value={selectedInstructor ? filteredInstructorUsers.find(u => u.id === selectedInstructor)?.email : null}
                onChange={(selectedEmail) => {
                  const inst = filteredInstructorUsers.find(u => u.email === selectedEmail);
                  setSelectedInstructor(inst ? inst.id : null);
                }}
                placeholder={t('select_instructor')}
                roleFilter={[]}
                showLabels={false}
                useEmailAsValue={true}
                style={INSTRUCTOR_SELECT_WIDTH}
              />
            )}

            {mainTab === 'availability' && scopeMode === 'room' && (
              <Select
                value={selectedRoom || ''}
                onChange={(e) => setSelectedRoom(e.target.value ? parseInt(e.target.value) : null)}
                theme={theme}
                options={[
                  { value: '', label: t('select_room') },
                  ...classrooms.map(c => ({ value: String(c.id), label: getLocalizedClassroomName(c, lang) }))
                ]}
                style={ROOM_SELECT_WIDTH}
              />
            )}

            {isAvailabilityTab && !isClassesTab && (availabilityDataMode === 'defined' || availabilityDataMode === 'timeline') && (
              <>
                <input
                  type="date"
                  value={definedAvailFrom}
                  onChange={(e) => setDefinedAvailFrom(e.target.value)}
                  title={t('availability_from')}
                  aria-label={t('availability_from')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                    fontSize: '0.875rem'
                  }}
                />
                <span style={{ color: theme === 'dark' ? '#6b7280' : '#9ca3af', fontSize: '0.875rem' }}>–</span>
                <input
                  type="date"
                  value={definedAvailTo}
                  onChange={(e) => setDefinedAvailTo(e.target.value)}
                  title={t('availability_to')}
                  aria-label={t('availability_to')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                    fontSize: '0.875rem'
                  }}
                />
              </>
            )}

            {/* Status Filter - Icon Buttons */}
            {mainTab !== 'availability' && !isClassesTab && (
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }} title={t('filter_by_status')}>
                {SESSION_STATUS_OPTIONS.map(opt => {
                  const IconComponent = opt.iconName === 'List' ? List : 
                                       opt.iconName === 'Calendar' ? CalendarIcon :
                                       opt.iconName === 'Clock' ? Clock :
                                       opt.iconName === 'CheckCircle2' ? CheckCircle2 :
                                       opt.iconName === 'XCircle' ? XCircle : List;
                  
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setStatusFilter(opt.value)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: statusFilter === opt.value ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb',
                        color: statusFilter === opt.value ? '#ffffff' : 'inherit',
                        border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0
                      }}
                      title={t(opt.labelKey)}
                    >
                      <IconComponent size={16} />
                    </button>
                  );
                })}
              </div>
            )}

            {mainTab === 'sessions' && (
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: '1px', backgroundColor: theme === 'dark' ? '#374151' : '#d1d5db', margin: '0 0.25rem' }} />
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('eventType', 'break');
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => {
                    const start = new Date(currentDate);
                    start.setHours(9, 0, 0, 0);
                    const end = new Date(start);
                    end.setHours(9, 45, 0, 0);
                    setCalendarEventDialog({ open: true, mode: 'create', eventType: 'break', event: null, initialStart: start, initialEnd: end });
                  }}
                  title={t('add_break')}
                  aria-label={t('add_break')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'grab',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    flexShrink: 0
                  }}
                >
                  <Coffee size={16} />
                  <span>{t('add_break')}</span>
                </button>
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('eventType', 'holiday');
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => {
                    const start = new Date(currentDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(start);
                    end.setHours(23, 59, 59, 999);
                    setCalendarEventDialog({ open: true, mode: 'create', eventType: 'holiday', event: null, initialStart: start, initialEnd: end });
                  }}
                  title={t('add_holiday')}
                  aria-label={t('add_holiday')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'grab',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    flexShrink: 0
                  }}
                >
                  <Umbrella size={16} />
                  <span>{t('add_holiday')}</span>
                </button>
              </div>
            )}

            {mainTab === 'sessions' && scopeMode === 'instructor' && (
              <UserSelect
                users={filteredInstructorUsers}
                enrollments={enrollments}
                classes={classes}
                value={selectedInstructor ? filteredInstructorUsers.find(u => u.id === selectedInstructor)?.email : null}
                onChange={(selectedEmail) => {
                  const selectedInstructor = filteredInstructorUsers.find(u => u.email === selectedEmail);
                  setSelectedInstructor(selectedInstructor ? selectedInstructor.id : null);
                }}
                placeholder={t('select_instructor')}
                roleFilter={[]}
                showLabels={false}
                useEmailAsValue={true}
                style={ROOM_SELECT_WIDTH}
              />
            )}

            {mainTab === 'sessions' && scopeMode === 'room' && (
              <Select
                value={selectedRoom || ''}
                onChange={(e) => setSelectedRoom(e.target.value ? parseInt(e.target.value) : null)}
                theme={theme}
                options={[
                  { value: '', label: t('select_room') },
                  ...classrooms.map(c => ({ value: String(c.id), label: getLocalizedClassroomName(c, lang) }))
                ]}
                style={ROOM_SELECT_WIDTH}
              />
            )}

            {isAvailTimeline && (
              <div style={{ marginInlineStart: 'auto' }}>
                <AvailabilityTimelineLegend t={t} theme={theme} />
              </div>
            )}
          </div>

          {/* Classes panel — below toolbar, above calendar (sessions tab) */}
          {!isFullscreen && !isClassesTab && mainTab === 'sessions' && (
            <div style={{
              width: '100%',
              flexShrink: 0,
              backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
              borderRadius: '0.5rem',
              padding: isClassesPanelExpanded ? '0.5rem 0.75rem' : '0.25rem 0.75rem',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
              marginBottom: '0.75rem'
            }}>
              <button
                type="button"
                onClick={() => setIsClassesPanelExpanded(!isClassesPanelExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                }}
              >
                <BookOpen size={16} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('classes_sidebar')}</span>
                <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginInlineStart: '0.25rem' }}>
                  {isClassesPanelExpanded ? t('drag_class_to_calendar') : `${filteredClasses.length} ${t('classes_count_label')}`}
                </span>
                <span style={{ marginInlineStart: 'auto', display: 'flex' }}>
                  {isClassesPanelExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {isClassesPanelExpanded && (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.5rem',
                    marginTop: '0.375rem',
                    alignItems: 'center'
                  }}>
                    <Input
                      type="text"
                      placeholder={t('search_classes')}
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      style={{ width: '100%', minWidth: 0 }}
                    />
                    <Select
                      value={sidebarProgramFilter}
                      onChange={(e) => {
                        setSidebarProgramFilter(e.target.value);
                        setSidebarSubjectFilter('');
                      }}
                      options={[{ value: '', label: t('all_programs') }, ...programs.map((p) => ({ value: String(p.id), label: getLocalizedName(p, lang) || p.code }))]}
                      style={{ width: '100%', minWidth: 0 }}
                      fullWidth
                    />
                    <Select
                      value={sidebarSubjectFilter}
                      onChange={(e) => setSidebarSubjectFilter(e.target.value)}
                      options={[{ value: '', label: t('all_subjects') }, ...subjects.filter((s) => !sidebarProgramFilter || s.programId === parseInt(sidebarProgramFilter)).map((s) => ({ value: String(s.id), label: getLocalizedName(s, lang) || s.code }))]}
                      disabled={!sidebarProgramFilter}
                      style={{ width: '100%', minWidth: 0 }}
                      fullWidth
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                    fontSize: '0.7rem',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    alignItems: 'center'
                  }}>
                    <SchedulingLegendItem
                      color={STATUS_COLORS.cancelled}
                      label={t('legend_class_missing_setup')}
                    />
                    <SchedulingLegendItem
                      color={theme === 'dark' ? '#374151' : '#e5e7eb'}
                      border={`1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`}
                      label={t('legend_class_ready')}
                    />
                    <SchedulingLegendItem
                      color="#f59e0b"
                      label={t('legend_subject_filter_locked')}
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    overflowX: 'auto',
                    paddingBottom: '0.25rem',
                    scrollbarWidth: 'thin'
                  }}>
                    {filteredClasses.length === 0 ? (
                      <div style={{ padding: '0.5rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af', fontSize: '0.8125rem' }}>
                        {t('no_classes_found')}
                      </div>
                    ) : (
                      filteredClasses.map((classItem) => {
                        const subject = subjects.find((s) => s.id === classItem.subjectId);
                        const instructor = instructors.find((i) => i.id === classItem.instructorId);
                        const classroom = classrooms.find((c) => c.id === classItem.classroomId);
                        const missing = !instructor || !classroom;
                        return (
                          <div
                            key={classItem.id}
                            draggable
                            onDragStart={(e) => handleClassDragStart(e, classItem)}
                            title={missing ? (!instructor ? t('missing_instructor') : t('missing_classroom')) : undefined}
                            style={{
                              flexShrink: 0,
                              minWidth: '130px',
                              maxWidth: '170px',
                              padding: '0.4rem 0.55rem',
                              backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                              borderRadius: '0.375rem',
                              border: `1px solid ${missing ? '#fca5a5' : theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                              cursor: 'grab',
                              fontSize: '0.8125rem'
                            }}
                          >
                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {getLocalizedClassName(classItem, lang, classItem.code)}
                            </div>
                            {subject && (
                              <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {getLocalizedSubjectName(subject, lang)}
                              </div>
                            )}
                            {instructor && (
                              <div style={{ fontSize: '0.65rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {getLocalizedInstructorName(instructor, lang)}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

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
                      toast.info(`${getLocalizedInstructorName(suggestion.instructor, lang)} — ${getLocalizedClassroomName(suggestion.classroom, lang)}`);
                    } else if (suggestion.startDateTime) {
                      toast.info(`Suggested: ${new Date(suggestion.startDateTime).toLocaleString()}`);
                    }
                    setShowSuggestions(false);
                  }}>
                    {suggestion.instructor ? (
                      <div>
                        <div style={{ fontWeight: '600', color: '#92400e' }}>
                          {getLocalizedInstructorName(suggestion.instructor, lang)} • {getLocalizedClassroomName(suggestion.classroom, lang)}
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

          <div style={{ flex: 1, minHeight: isClassesTab ? 0 : SESSION_CALENDAR_HEIGHT, display: 'flex', flexDirection: 'column' }}>
            {isClassesTab ? (
              <SchedulingClassesView
                classes={classes}
                programs={programs}
                subjects={subjects}
                instructors={instructors}
                enrollments={enrollments}
                scheduledSessions={scheduledSessions}
                theme={theme}
                t={t}
                lang={lang}
                isRTL={isRTL}
                viewMode={classesViewMode}
                onSelectClass={navigateToClassOnCalendar}
              />
            ) : mainTab === 'availability' ? (
              <div style={{ 
                height: '100%', 
                overflowY: availabilityDataMode === 'timeline' ? 'hidden' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                {/* Content area — view mode toggles live in tab ribbon */}
                <div style={{ marginBottom: '0.5rem', flexShrink: 0 }}>
                  {availabilityDataMode === 'defined' && (
                    <SchedulingDefinedAvailabilityCards
                      groups={scopeMode === 'instructor' ? groupedInstructorDefined : groupedRoomDefined}
                      type={scopeMode === 'instructor' ? 'instructor' : 'room'}
                      theme={theme}
                      t={t}
                      lang={lang}
                      emptyMessage={scopeMode === 'instructor'
                        ? t('no_instructor_availability_defined')
                        : t('no_room_availability_defined')}
                    />
                  )}

                  {availabilityDataMode === 'timeline' && (
                    <div
                      style={{
                        flex: '0 0 auto',
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        minHeight: SESSION_CALENDAR_HEIGHT,
                        height: SESSION_CALENDAR_HEIGHT,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}
                    >
                      <SchedulingAvailabilityTimeline
                        events={availabilityTimelineEvents}
                        currentDate={availCalendarDate}
                        currentView={availCalendarView}
                        theme={theme}
                        lang={lang}
                        t={t}
                        isActive={availabilityDataMode === 'timeline'}
                        hideWeekends={hideWeekends}
                        layoutRevision={calendarLayoutKey}
                      />
                    </div>
                  )}

                  {availabilityDataMode === 'workload' && (
                  <>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {/* Date filter */}
                    <Select
                      value={workloadDateFilter}
                      onChange={(e) => setWorkloadDateFilter(e.target.value)}
                      options={[
                        { value: 'all', label: t('all_time') },
                        { value: 'week', label: t('this_week') },
                        { value: 'month', label: t('this_month') },
                        { value: 'custom', label: t('custom_range') }
                      ]}
                      theme={theme}
                      style={{ minWidth: '120px' }}
                    />
                    
                    {/* Custom date range inputs */}
                    {workloadDateFilter === 'custom' && (
                      <>
                        <input
                          type="date"
                          value={workloadStartDate || ''}
                          onChange={(e) => setWorkloadStartDate(e.target.value)}
                          placeholder={t('start_date')}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                            color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                          }}
                        />
                        <input
                          type="date"
                          value={workloadEndDate || ''}
                          onChange={(e) => setWorkloadEndDate(e.target.value)}
                          placeholder={t('end_date')}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                            color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                          }}
                        />
                      </>
                    )}
                    
                    {/* Sort controls */}
                    <Select
                      value={workloadSortBy}
                      onChange={(e) => setWorkloadSortBy(e.target.value)}
                      options={[
                        { value: 'workload', label: t('sort_by_workload') },
                        { value: 'name', label: t('sort_by_name') },
                        { value: 'sessions', label: t('sort_by_sessions') }
                      ]}
                      theme={theme}
                      style={{ minWidth: '150px' }}
                    />
                    <button
                      onClick={() => setWorkloadSortOrder(workloadSortOrder === 'asc' ? 'desc' : 'asc')}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                        border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {workloadSortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    </button>
                    
                    {/* Filter slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                      <Filter size={16} />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={workloadFilterThreshold}
                        onChange={(e) => setWorkloadFilterThreshold(parseInt(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: '0.875rem', minWidth: '60px' }}>≤ {workloadFilterThreshold}%</span>
                    </div>
                  </div>
                
                {scopeMode === 'instructor' && workloadViewMode === 'tree' && (
                    /* List View */
                    filteredAndSortedWorkloads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        {t('no_instructors_match_filter')}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredAndSortedWorkloads.map(({ instructor, sessionCount, scheduledHours, workloadPercentage, workloadLevel, nextSession, upcomingSessions }) => {
                          const isExpanded = expandedItems.has(`workload-${instructor.id}`);
                          const workloadColor = getWorkloadColor(workloadLevel);
                          
                          return (
                            <div key={instructor.id} style={{
                              backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                              borderRadius: '0.5rem',
                              padding: '1rem',
                              border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`
                            }}>
                              {/* Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                  <User size={18} color="#3b82f6" />
                                  <span style={{ fontWeight: '600' }}>{getLocalizedInstructorName(instructor, lang, instructor.email)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                  <div style={{ fontSize: '0.875rem', display: 'flex', gap: '1rem' }}>
                                    <span>{sessionCount} {t('sessions')}</span>
                                    <span>{scheduledHours} {t('hours_abbr')}</span>
                                    <span style={{ color: workloadColor, fontWeight: '600' }}>{workloadPercentage}%</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/summary-dashboard?instructorId=${instructor.id}`)}
                                    style={{
                                      padding: '0.25rem 0.5rem',
                                      fontSize: '0.75rem',
                                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                      color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                                      border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                    }}
                                    data-testid={`view-workload-${instructor.id}`}
                                  >
                                    {t('view_workload') || 'View Workload'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={sessionCount === 0}
                                    title={sessionCount === 0 ? t('no_sessions_to_show') : t('show_on_calendar')}
                                    onClick={() => handleShowOnCalendar(instructor.id)}
                                    style={{
                                      padding: '0.25rem 0.5rem',
                                      fontSize: '0.75rem',
                                      backgroundColor: sessionCount > 0 ? '#3b82f6' : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                                      color: sessionCount > 0 ? '#ffffff' : (theme === 'dark' ? '#6b7280' : '#9ca3af'),
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      cursor: sessionCount > 0 ? 'pointer' : 'not-allowed',
                                      opacity: sessionCount > 0 ? 1 : 0.7
                                    }}
                                  >
                                    {t('show_on_calendar')}
                                  </button>
                                </div>
                              </div>
                              
                              {/* Next session */}
                              {nextSession && (
                                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.5rem' }}>
                                  {t('next_session')}: {getLocalizedClassName(nextSession.class, lang, t('class'))} - {formatWorkloadSessionTime(nextSession.startDateTime, lang)}
                                </div>
                              )}
                              
                              {/* Expand/Collapse button */}
                              {upcomingSessions.length > 0 && (
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedItems);
                                    if (isExpanded) {
                                      newExpanded.delete(`workload-${instructor.id}`);
                                    } else {
                                      newExpanded.add(`workload-${instructor.id}`);
                                    }
                                    setExpandedItems(newExpanded);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.875rem',
                                    color: '#3b82f6',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.25rem 0'
                                  }}
                                >
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  {t('upcoming_sessions')} ({upcomingSessions.length})
                                </button>
                              )}
                              
                              {/* Upcoming sessions list */}
                              {isExpanded && upcomingSessions.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                  {upcomingSessions.map(session => (
                                    <div key={session.id} style={{
                                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                      padding: '0.5rem',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.875rem',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: '0.75rem'
                                    }}>
                                      <div style={{ minWidth: 0 }}>
                                        <div>{getLocalizedClassName(session.class, lang, t('class'))}</div>
                                        <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.125rem' }}>
                                          {buildSessionEventVenueLine(session, lang, t)}
                                        </div>
                                      </div>
                                      <span style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', flexShrink: 0, textAlign: 'end' }}>
                                        {formatWorkloadSessionTime(session.startDateTime, lang)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                )}
                
                {scopeMode === 'instructor' && workloadViewMode === 'table' && (
                    /* Table View */
                    filteredAndSortedWorkloads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        {t('no_instructors_match_filter')}
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                          <thead>
                            <tr style={{ borderBottom: `2px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}` }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('instructor')}</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('sessions')}</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('scheduled_hours')}</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('workload_percentage')}</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('next_session')}</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAndSortedWorkloads.map(({ instructor, sessionCount, scheduledHours, workloadPercentage, workloadLevel, nextSession }) => {
                              const workloadColor = getWorkloadColor(workloadLevel);
                              
                              return (
                                <tr key={instructor.id} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }}>
                                  <td style={{ padding: '0.75rem' }}>{getLocalizedInstructorName(instructor, lang, instructor.email)}</td>
                                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{sessionCount}</td>
                                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{scheduledHours}</td>
                                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <span style={{ color: workloadColor, fontWeight: '600' }}>{workloadPercentage}%</span>
                                  </td>
                                  <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                                    {nextSession ? (
                                      <div>
                                        <div>{getLocalizedClassName(nextSession.class, lang, t('class'))}</div>
                                        <div style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                                          {formatSchedulingDateTime(nextSession.startDateTime, lang, { weekday: undefined })}
                                        </div>
                                      </div>
                                    ) : '-'}
                                  </td>
                                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      disabled={sessionCount === 0}
                                      title={sessionCount === 0 ? t('no_sessions_to_show') : t('show_on_calendar')}
                                      onClick={() => handleShowOnCalendar(instructor.id)}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: sessionCount > 0 ? '#3b82f6' : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                                        color: sessionCount > 0 ? '#ffffff' : (theme === 'dark' ? '#6b7280' : '#9ca3af'),
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: sessionCount > 0 ? 'pointer' : 'not-allowed',
                                        opacity: sessionCount > 0 ? 1 : 0.7
                                      }}
                                    >
                                      {t('show_on_calendar')}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                )}
                
                {scopeMode === 'instructor' && workloadViewMode === 'drill' && (
                    filteredAndSortedWorkloads.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                          {t('no_instructors_match_filter')}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {filteredAndSortedWorkloads.map(({ instructor, allSessions, workloadPercentage, workloadLevel, scheduledHours, sessionCount }) => {
                            const isDrillExpanded = expandedItems.has(`drill-${instructor.id}`);
                            const workloadColor = getWorkloadColor(workloadLevel);
                            const textColor = theme === 'dark' ? '#f3f4f6' : '#1f2937';
                            
                            return (
                              <div key={instructor.id} style={{
                                backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isDrillExpanded ? '0.75rem' : '0', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                    <button
                                      onClick={() => {
                                        const newExpanded = new Set(expandedItems);
                                        if (isDrillExpanded) {
                                          newExpanded.delete(`drill-${instructor.id}`);
                                        } else {
                                          newExpanded.add(`drill-${instructor.id}`);
                                        }
                                        setExpandedItems(newExpanded);
                                      }}
                                      style={{
                                        padding: '0',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: textColor
                                      }}
                                    >
                                      {isDrillExpanded
                                        ? <ChevronDown size={18} color={textColor} />
                                        : <ChevronRight size={18} color={textColor} />}
                                      <User size={18} color="#3b82f6" />
                                      <span style={{ fontWeight: '600', color: textColor }}>{getLocalizedInstructorName(instructor, lang, instructor.email)}</span>
                                    </button>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ fontSize: '0.875rem', display: 'flex', gap: '1rem', color: textColor }}>
                                      <span>{sessionCount} {t('sessions')}</span>
                                      <span>{scheduledHours} {t('hours_abbr')}</span>
                                      <span style={{ color: workloadColor, fontWeight: '600' }}>{workloadPercentage}%</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {isDrillExpanded && (
                                  <div style={{ 
                                    marginLeft: '2rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                  }}>
                                    {allSessions.length > 0 ? allSessions.map(session => (
                                      <div 
                                        key={session.id}
                                        style={{
                                          padding: '1rem',
                                          backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                                          border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                                          borderRadius: '0.5rem',
                                          fontSize: '0.875rem',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{getLocalizedClassName(session.class, lang, t('class'))}</div>
                                          <div style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                                            {getLocalizedClassroomName(session.classroom, lang) || t('no_room')}
                                          </div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                                          <div>{formatSchedulingDateOnly(session.startDateTime, lang)}</div>
                                          <div style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                                            {formatSchedulingTimeOnly(session.startDateTime, lang)}
                                          </div>
                                        </div>
                                      </div>
                                    )) : (
                                      <div style={{ padding: '1rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
                                        {t('no_sessions')}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )
                )}
                
                {scopeMode === 'room' && workloadViewMode === 'tree' && (
                  /* Room Workload View - List */
                    filteredAndSortedRoomWorkloads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        {t('no_rooms_match_filter')}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredAndSortedRoomWorkloads.map(({ classroom, sessionCount, scheduledHours, workloadPercentage, workloadLevel, nextSession, upcomingSessions }) => {
                          const isExpanded = expandedItems.has(`workload-room-${classroom.id}`);
                          const workloadColor = getWorkloadColor(workloadLevel);
                          
                          return (
                            <div key={classroom.id} style={{
                              backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                              borderRadius: '0.5rem',
                              padding: '1rem',
                              border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`
                            }}>
                              {/* Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <DoorOpen size={18} color="#3b82f6" />
                                    <span style={{ fontWeight: '600' }}>{getLocalizedClassroomName(classroom, lang)}</span>
                                    <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                                      ({classroom.capacity} {t('seats')})
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginTop: '0.25rem', marginLeft: '1.625rem', fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                                    {getClassroomDetailRows(classroom, lang, t).map((row) => (
                                      <span key={row.label}><strong>{row.label}:</strong> {row.value}</span>
                                    ))}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                  <div style={{ fontSize: '0.875rem', display: 'flex', gap: '1rem' }}>
                                    <span>{sessionCount} {t('sessions')}</span>
                                    <span>{scheduledHours} {t('hours_abbr')}</span>
                                    <span style={{ color: workloadColor, fontWeight: '600' }}>{workloadPercentage}%</span>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={sessionCount === 0}
                                    title={sessionCount === 0 ? t('no_sessions_to_show') : t('show_on_calendar')}
                                    onClick={() => handleShowRoomOnCalendar(classroom.id)}
                                    style={{
                                      padding: '0.25rem 0.5rem',
                                      fontSize: '0.75rem',
                                      backgroundColor: sessionCount > 0 ? '#3b82f6' : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                                      color: sessionCount > 0 ? '#ffffff' : (theme === 'dark' ? '#6b7280' : '#9ca3af'),
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      cursor: sessionCount > 0 ? 'pointer' : 'not-allowed',
                                      opacity: sessionCount > 0 ? 1 : 0.7
                                    }}
                                  >
                                    {t('show_on_calendar')}
                                  </button>
                                </div>
                              </div>
                              
                              {/* Next session */}
                              {nextSession && (
                                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.5rem' }}>
                                  {t('next_session')}: {getLocalizedClassName(nextSession.class, lang, t('class'))} - {formatWorkloadSessionTime(nextSession.startDateTime, lang)}
                                </div>
                              )}
                              
                              {/* Expand/Collapse button */}
                              {upcomingSessions.length > 0 && (
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedItems);
                                    if (isExpanded) {
                                      newExpanded.delete(`workload-room-${classroom.id}`);
                                    } else {
                                      newExpanded.add(`workload-room-${classroom.id}`);
                                    }
                                    setExpandedItems(newExpanded);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.875rem',
                                    color: '#3b82f6',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.25rem 0'
                                  }}
                                >
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  {t('upcoming_sessions')} ({upcomingSessions.length})
                                </button>
                              )}
                              
                              {/* Upcoming sessions list */}
                              {isExpanded && upcomingSessions.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                  {upcomingSessions.map(session => (
                                    <div key={session.id} style={{
                                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                      padding: '0.5rem',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.875rem',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: '0.75rem'
                                    }}>
                                      <div style={{ minWidth: 0 }}>
                                        <div>{getLocalizedClassName(session.class, lang, t('class'))}</div>
                                        <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.125rem' }}>
                                          {buildSessionEventVenueLine(session, lang, t)}
                                        </div>
                                      </div>
                                      <span style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', flexShrink: 0, textAlign: 'end' }}>
                                        {formatWorkloadSessionTime(session.startDateTime, lang)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                )}
                
                {scopeMode === 'room' && workloadViewMode === 'table' && (
                    /* Room Table View */
                    filteredAndSortedRoomWorkloads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        {t('no_rooms_match_filter')}
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                          <thead>
                            <tr style={{ borderBottom: `2px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}` }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('room')}</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('sessions')}</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('scheduled_hours')}</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('workload_percentage')}</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('next_session')}</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAndSortedRoomWorkloads.map(({ classroom, sessionCount, scheduledHours, workloadPercentage, workloadLevel, nextSession }) => {
                              const workloadColor = getWorkloadColor(workloadLevel);
                              
                              return (
                                <tr key={classroom.id} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }}>
                                  <td style={{ padding: '0.75rem' }}>
                                    {getLocalizedClassroomName(classroom, lang)}
                                    <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginLeft: '0.5rem' }}>
                                      ({classroom.capacity} seats)
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{sessionCount}</td>
                                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{scheduledHours}</td>
                                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <span style={{ color: workloadColor, fontWeight: '600' }}>{workloadPercentage}%</span>
                                  </td>
                                  <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                                    {nextSession ? (
                                      <div>
                                        <div>{getLocalizedClassName(nextSession.class, lang, t('class'))}</div>
                                        <div style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                                          {formatSchedulingDateTime(nextSession.startDateTime, lang, { weekday: undefined })}
                                        </div>
                                      </div>
                                    ) : '-'}
                                  </td>
                                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      disabled={sessionCount === 0}
                                      title={sessionCount === 0 ? t('no_sessions_to_show') : t('show_on_calendar')}
                                      onClick={() => handleShowRoomOnCalendar(classroom.id)}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: sessionCount > 0 ? '#3b82f6' : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                                        color: sessionCount > 0 ? '#ffffff' : (theme === 'dark' ? '#6b7280' : '#9ca3af'),
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: sessionCount > 0 ? 'pointer' : 'not-allowed',
                                        opacity: sessionCount > 0 ? 1 : 0.7
                                      }}
                                    >
                                      {t('show_on_calendar')}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                )}
                </>
                )}
                </div>
              </div>
            ) : (
              <div
                ref={sessionCalendarContainerRef}
                className="scheduling-sessions-calendar"
                onDrop={handleCalendarDrop}
                onDragOver={handleCalendarDragOver}
                style={{
                  flex: '0 0 auto',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  minHeight: '800px',
                  height: 'auto',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
              <Calendar
                key={`sessions-cal-${calendarLayoutKey}-${lang}`}
                ref={calendarRef}
                height="800px"
                view={currentView}
                timezones={[]}
                week={{
                  startDayOfWeek: 0, // Sunday start
                  dayNames: calendarDayNames,
                  narrowWeekend: narrowWeekend,
                  workweek: hideWeekends,
                  hourStart: 0,
                  hourEnd: 24,
                  eventView: ['time'], // Only show time events, hide all day
                  taskView: false, // Hide milestone and task
                  showNowIndicator: true,
                  showTimezoneCollapseButton: false,
                  disableDblClick: false,
                  disableClick: false,
                  isReadOnly: false
                }}
                month={{
                  startDayOfWeek: 0, // Sunday start
                  narrowWeekend: narrowWeekend,
                  workweek: hideWeekends,
                  isReadOnly: false,
                  dayNames: calendarDayNames
                }}
                theme={{
                  common: {
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    holiday: {
                      color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                    },
                    dayName: {
                      color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                    },
                    today: {
                      color: '#10b981'
                    }
                  },
                  month: {
                    dayName: {
                      color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                    },
                    holiday: {
                      color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                    },
                    weekend: {
                      color: '#ef4444'
                    },
                    today: {
                      color: '#10b981'
                    }
                  },
                  week: {
                    dayName: {
                      color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                    },
                    holiday: {
                      color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                    },
                    weekend: {
                      color: '#ef4444'
                    },
                    today: {
                      color: '#10b981'
                    },
                    timegrid: {
                      horizontalLine: {
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
                      },
                      verticalLine: {
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
                      },
                      today: {
                        color: '#10b981'
                      }
                    }
                  }
                }}
                css={`
                  .toastui-calendar-layout,
                  .toastui-calendar-layout * {
                    max-width: 100%;
                  }
                  /* Ensure calendar takes full width and auto height */
                  .scheduling-sessions-calendar > .container {
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                  }
                  .toastui-calendar-layout {
                    width: 100% !important;
                    height: auto !important;
                    min-width: 0 !important;
                  }
                  /* Hide scrollbar visually while allowing scroll functionality */
                  .scheduling-sessions-calendar .toastui-calendar-timegrid-scroll-area {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                  }
                  .scheduling-sessions-calendar .toastui-calendar-timegrid-scroll-area::-webkit-scrollbar {
                    display: none !important;
                  }
                  .scheduling-sessions-calendar .toastui-calendar-timegrid-scroll-area::-webkit-scrollbar-thumb {
                    display: none !important;
                  }
                  .scheduling-sessions-calendar .toastui-calendar-column .toastui-calendar-events {
                    margin-right: 0 !important;
                  }
                  .scheduling-sessions-calendar .toastui-calendar-event-time {
                    border-radius: 0 !important;
                    margin-left: 0 !important;
                    width: 100% !important;
                    padding-bottom: 2px !important;
                    box-sizing: content-box !important;
                  }
                  .scheduling-sessions-calendar .toastui-calendar-event-time-content {
                    width: 100% !important;
                    height: 100% !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    box-sizing: border-box !important;
                    color: #ffffff !important;
                  }
                  .scheduling-sessions-calendar .toastui-calendar-template-time {
                    width: 100% !important;
                    height: 100% !important;
                  }
                  /* Remove default red color from Sunday - override inline style */
                  .toastui-calendar-holiday-sun,
                  .toastui-calendar-holiday-sun * {
                    color: ${theme === 'dark' ? '#f3f4f6' : '#1f2937'} !important;
                  }
                  [data-testid="dayName-week-sun"],
                  [data-testid="dayName-week-sun"] * {
                    color: ${theme === 'dark' ? '#f3f4f6' : '#1f2937'} !important;
                  }
                  
                  /* Make Friday (5) and Saturday (6) red for Middle Eastern weekend */
                  .toastui-calendar-dayname-date[data-date-index="5"],
                  .toastui-calendar-dayname-date[data-date-index="5"] * {
                    color: #ef4444 !important;
                  }
                  .toastui-calendar-dayname-date[data-date-index="6"],
                  .toastui-calendar-dayname-date[data-date-index="6"] * {
                    color: #ef4444 !important;
                  }
                  .toastui-calendar-month-dayname[data-date-index="5"],
                  .toastui-calendar-month-dayname[data-date-index="5"] * {
                    color: #ef4444 !important;
                  }
                  .toastui-calendar-month-dayname[data-date-index="6"],
                  .toastui-calendar-month-dayname[data-date-index="6"] * {
                    color: #ef4444 !important;
                  }
                  .toastui-calendar-weekday-grid-date[data-date-index="5"],
                  .toastui-calendar-weekday-grid-date[data-date-index="5"] * {
                    color: #ef4444 !important;
                  }
                  .toastui-calendar-weekday-grid-date[data-date-index="6"],
                  .toastui-calendar-weekday-grid-date[data-date-index="6"] * {
                    color: #ef4444 !important;
                  }
                  
                  /* Show event body with room and instructor info */
                  .toastui-calendar-time-event-content {
                    display: flex !important;
                    flex-direction: column !important;
                  }
                  .toastui-calendar-time-event-title {
                    font-weight: 600 !important;
                    margin-bottom: 2px !important;
                  }
                  .toastui-calendar-time-event-body {
                    font-size: 11px !important;
                    opacity: 0.9 !important;
                    display: block !important;
                  }

                  @keyframes scheduling-session-pulse {
                    0%, 100% {
                      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.8);
                      outline: 2px solid #3b82f6;
                    }
                    50% {
                      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
                      outline: 3px solid #60a5fa;
                    }
                  }
                  .scheduling-session-highlight {
                    animation: scheduling-session-pulse 0.8s ease-in-out 5 !important;
                    z-index: 50 !important;
                    position: relative;
                  }
                `}
                template={sessionCalendarTemplates}
                calendars={calendars}
                events={calendarEvents}
                useDetailPopup={false}
                useFormPopup={false}
                onClickEvent={onClickEvent}
                onBeforeCreateEvent={onBeforeCreateEvent}
                onBeforeUpdateEvent={onBeforeUpdateEvent}
                onBeforeDeleteEvent={onBeforeDeleteEvent}
              />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Session Popup */}
      {popupSession && (
        <SchedulingCalendarPopup
          session={popupSession}
          onClose={() => setPopupSession(null)}
          onEdit={(session) => {
            setPopupSession(null);
            setEditingSessionId(session.id);
            setModalClassItem(session.class);
            setModalStartDateTime(new Date(session.startDateTime));
            setModalEndDateTime(new Date(session.endDateTime));
            const instructor = instructors.find(i => i.id === session.instructorId);
            setModalInstructorEmail(instructor?.email || null);
            setModalInstructorId(session.instructorId);
            setModalClassroomId(session.classroomId);
            setShowCreateModal(true);
          }}
          onDelete={(session) => {
            setPopupSession(null);
            setSessionToDelete(session);
            setShowDeleteModal(true);
            setDeletionReason('');
            setRequiresReason(false);
          }}
          onChangeStatus={(session) => {
            setPopupSession(null);
            setSessionToChangeStatus(session);
            setShowStatusModal(true);
            setNewStatus('');
            setStatusChangeReason('');
          }}
        />
      )}

      {/* Create/Update Session Dialog */}
      <SessionEventDialog
        open={showCreateModal && !!modalClassItem}
        mode={editingSessionId ? 'edit' : 'create'}
        classItem={modalClassItem}
        startDateTime={modalStartDateTime}
        endDateTime={modalEndDateTime}
        instructorEmail={modalInstructorEmail}
        instructorId={modalInstructorId}
        classroomId={modalClassroomId}
        isRecurring={isRecurring}
        recurrenceType={recurrenceType}
        recurrenceDays={recurrenceDays}
        recurrenceEndDate={recurrenceEndDate}
        recurrenceCount={recurrenceCount}
        recurrenceEndMode={recurrenceEndMode}
        timesPerDay={timesPerDay}
        validationResult={validationResult}
        subjects={subjects}
        programs={programs}
        instructors={instructors}
        filteredInstructorUsers={filteredInstructorUsers}
        classes={classes}
        classrooms={classrooms}
        enrollments={enrollments}
        instructorAvailabilities={instructorAvailabilities}
        classroomAvailabilities={classroomAvailabilities}
        theme={theme}
        t={t}
        lang={lang}
        onClose={closeCreateModal}
        onStartChange={(date) => { setModalStartDateTime(date); setValidationResult(null); }}
        onEndChange={(date) => { setModalEndDateTime(date); setValidationResult(null); }}
        onInstructorChange={(instructor) => {
          setModalInstructorEmail(instructor ? instructor.email : null);
          setModalInstructorId(instructor ? instructor.id : null);
          setValidationResult(null);
        }}
        onClassroomChange={(id) => { setModalClassroomId(id); setValidationResult(null); }}
        onRecurringChange={setIsRecurring}
        onRecurrenceTypeChange={setRecurrenceType}
        onRecurrenceDaysChange={setRecurrenceDays}
        onRecurrenceEndModeChange={setRecurrenceEndMode}
        onRecurrenceEndDateChange={setRecurrenceEndDate}
        onRecurrenceCountChange={setRecurrenceCount}
        onTimesPerDayChange={setTimesPerDay}
        onApplySuggestedSlot={applySuggestedSlot}
        onChangeStatus={handleSessionChangeStatus}
        onSave={handleCreateSession}
        isSaveDisabled={!editingSessionId && validationResult?.valid === false && !!modalClassroomId}
        saveLabel={editingSessionId ? t('update_session') : (isRecurring ? t('create_series') : t('create_session'))}
      />

      {/* Calendar Event Dialog (break/holiday) */}
      {calendarEventDialog.open && (calendarEventDialog.eventType === 'break' || calendarEventDialog.eventType === 'holiday') && (
        <CalendarEventDialog
          open={calendarEventDialog.open}
          mode={calendarEventDialog.mode}
          eventType={calendarEventDialog.eventType}
          event={calendarEventDialog.event}
          initialStart={calendarEventDialog.initialStart}
          initialEnd={calendarEventDialog.initialEnd}
          programs={programs}
          instructors={instructors}
          classrooms={classrooms}
          timeSlots={timeSlots}
          user={user}
          theme={theme}
          t={t}
          lang={lang}
          onClose={closeCalendarEventDialog}
          onSave={handleCalendarEventSave}
          onDelete={handleCalendarEventDelete}
          existingSessions={scheduledSessions}
        />
      )}

      {/* Delete Scope Dialog (recurring break/holiday) */}
      {deleteScopeDialog.open && (
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
          zIndex: 10001,
          padding: '1rem'
        }} onClick={() => setDeleteScopeDialog({ open: false, eventType: null, event: null })}>
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '420px',
            width: '100%'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: theme === 'dark' ? '#f3f4f6' : '#1f2937', marginBottom: '1rem' }}>
              {t('delete_event')}
            </h2>
            <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '1rem' }}>
              {t('delete_event_scope_prompt')}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                  color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                }}
                onClick={() => setDeleteScopeDialog({ open: false, eventType: null, event: null })}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: '#ef4444',
                  color: '#ffffff'
                }}
                onClick={() => handleCalendarEventDelete({
                  eventType: deleteScopeDialog.eventType,
                  event: deleteScopeDialog.eventType === 'break' ? deleteScopeDialog.event?.breakSession : deleteScopeDialog.event?.holiday,
                  deleteScope: 'single'
                })}
              >
                {t('this_instance')}
              </button>
              {(deleteScopeDialog.eventType === 'break' ? deleteScopeDialog.event?.breakSession?.seriesId : deleteScopeDialog.event?.holiday?.seriesId) && (
                <button
                  type="button"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: '#ef4444',
                    color: '#ffffff'
                  }}
                  onClick={() => handleCalendarEventDelete({
                    eventType: deleteScopeDialog.eventType,
                    event: deleteScopeDialog.eventType === 'break' ? deleteScopeDialog.event?.breakSession : deleteScopeDialog.event?.holiday,
                    deleteScope: 'series'
                  })}
                >
                  {t('whole_series')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#ef4444' }}>
              ⚠️ Delete Session
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                Are you sure you want to delete this session?
              </p>
              <div style={{ 
                backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}>
                <div><strong>{t('class')}:</strong> {getLocalizedClassName(sessionToDelete.class, lang, t('unknown'))}</div>
                <div><strong>{t('date')}:</strong> {formatWorkloadSessionTime(sessionToDelete.startDateTime, lang)}</div>
                <div><strong>{t('instructor')}:</strong> {getLocalizedInstructorName(sessionToDelete.instructor, lang, t('not_assigned'))}</div>
                <div><strong>{t('room')}:</strong> {getLocalizedClassroomName(sessionToDelete.classroom, lang) || t('not_assigned')}</div>
              </div>
            </div>

            {requiresReason && (
              <div style={{ 
                backgroundColor: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '0.375rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                color: '#92400e'
              }}>
                ⚠️ This session has attendance records. Please provide a reason for deletion.
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Reason for Deletion {requiresReason && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder={requiresReason ? "Required: Why are you deleting this session?" : "Optional: Provide a reason for audit trail"}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                  borderRadius: '0.375rem',
                  backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                  color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                  fontSize: '0.875rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                  setDeletionReason('');
                  setRequiresReason(false);
                }}
                style={{ backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={requiresReason && !deletionReason.trim()}
                style={{ 
                  backgroundColor: '#ef4444', 
                  color: '#ffffff',
                  opacity: (requiresReason && !deletionReason.trim()) ? 0.5 : 1,
                  cursor: (requiresReason && !deletionReason.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                Delete Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && sessionToChangeStatus && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderRadius: '0.5rem',
            padding: '1rem',
            maxWidth: '420px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                {t('change_status')}
              </h2>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSessionToChangeStatus(null);
                  setNewStatus('');
                  setStatusChangeReason('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              padding: '0.625rem 0.75rem',
              backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              marginBottom: '0.75rem',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
            }}>
              <BookOpen size={14} color="#3b82f6" />
              <span style={{ fontWeight: '600', flex: 1, minWidth: 0 }}>{getLocalizedClassName(sessionToChangeStatus.class, lang)}</span>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '1rem',
                backgroundColor: `${STATUS_COLORS[sessionToChangeStatus.status] || '#6b7280'}20`,
                border: `1px solid ${STATUS_COLORS[sessionToChangeStatus.status] || '#6b7280'}`,
                color: STATUS_COLORS[sessionToChangeStatus.status] || '#6b7280',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                {renderStatusIcon(
                  SESSION_STATUS_OPTIONS.find(o => o.value === sessionToChangeStatus.status)?.iconName,
                  12,
                  STATUS_COLORS[sessionToChangeStatus.status]
                )}
                <span style={{ textTransform: 'capitalize' }}>{t(sessionToChangeStatus.status)}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                <Clock size={14} />
                <span>
                  {formatWorkloadSessionTime(sessionToChangeStatus.startDateTime, lang)}
                  {' – '}
                  {formatSchedulingTimeOnly(sessionToChangeStatus.endDateTime, lang)}
                </span>
              </div>
              <div style={{ paddingLeft: '1.25rem', fontSize: '0.75rem' }}>
                {formatSessionDuration(sessionToChangeStatus.startDateTime, sessionToChangeStatus.endDateTime)}
              </div>
            </div>

            {getAvailableStatusTransitions(sessionToChangeStatus).length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '0.75rem' }}>
                {t('no_status_options')}
              </div>
            ) : (
              <>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '0.375rem', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
              {t('new_status')}
            </label>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              theme={theme}
              options={[
                { value: '', label: t('select_status') },
                ...getAvailableStatusTransitions(sessionToChangeStatus).map(opt => ({
                  value: opt.value,
                  label: t(opt.labelKey),
                  icon: renderStatusIcon(opt.iconName, 14, STATUS_COLORS[opt.value])
                }))
              ]}
            />
              </>
            )}

            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', margin: '0.75rem 0 0.375rem', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
              {t('reason_optional')}
            </label>
            <textarea
              value={statusChangeReason}
              onChange={(e) => setStatusChangeReason(e.target.value)}
              placeholder={t('reason_placeholder')}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                borderRadius: '0.375rem',
                backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                fontSize: '0.8125rem',
                minHeight: '52px',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <Button
                onClick={() => {
                  setShowStatusModal(false);
                  setSessionToChangeStatus(null);
                  setNewStatus('');
                  setStatusChangeReason('');
                }}
                style={{
                  backgroundColor: theme === 'dark' ? '#374151' : '#6b7280',
                  color: '#ffffff',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8125rem'
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={!newStatus || getAvailableStatusTransitions(sessionToChangeStatus).length === 0}
                style={{ 
                  backgroundColor: '#3b82f6', 
                  color: '#ffffff',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8125rem',
                  opacity: (!newStatus || getAvailableStatusTransitions(sessionToChangeStatus).length === 0) ? 0.5 : 1,
                  cursor: (!newStatus || getAvailableStatusTransitions(sessionToChangeStatus).length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {t('change_status')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingCalendarPage;
