import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Select } from '@ui';
import classroomAvailabilityService from '@services/business/classroomAvailabilityBusinessService.js';
import instructorAvailabilityService from '@services/business/instructorAvailabilityService.js';
import { getAllClassrooms } from '@services/business/classroomService.js';
import { getAllUsers } from '@services/business/userService.js';
import { getAllPrograms } from '@services/business/programService.js';
import { getAllSubjects } from '@services/business/subjectService.js';
import { getAllClasses } from '@services/business/classService.js';

const FlexibleSchedulingPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [classroomAvailabilities, setClassroomAvailabilities] = useState([]);
  const [instructorAvailabilities, setInstructorAvailabilities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [scheduledSessions, setScheduledSessions] = useState([]); // Track scheduled sessions
  
  // Filters
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('week'); // week, day
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    subject: '',
    className: '',
    notes: ''
  });
  
  // Drag & Drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Sidebar filters
  const [sidebarProgramFilter, setSidebarProgramFilter] = useState('');
  const [sidebarSubjectFilter, setSidebarSubjectFilter] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  
  // Advanced Filters state
  const [selectedClassrooms, setSelectedClassrooms] = useState([]); // Multi-select
  const [selectedInstructors, setSelectedInstructors] = useState([]); // Multi-select
  const [minSlotDuration, setMinSlotDuration] = useState(0); // Quick filter: minimum hours
  const [savedPresets, setSavedPresets] = useState([
    { id: 1, name: 'Morning (07:00-12:00)', classrooms: [], instructors: [], minDuration: 0, startTime: '07:00', endTime: '12:00' },
    { id: 2, name: 'Afternoon (12:00-19:00)', classrooms: [], instructors: [], minDuration: 0, startTime: '12:00', endTime: '19:00' },
    { id: 3, name: 'Night (19:00-00:00)', classrooms: [], instructors: [], minDuration: 0, startTime: '19:00', endTime: '23:59' }
  ]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasPermission = isAdmin || isHR || isSuperAdmin;

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        classroomAvailResult, 
        instructorAvailResult, 
        classroomsResult, 
        instructorsResult,
        programsResult,
        subjectsResult,
        classesResult
      ] = await Promise.all([
        classroomAvailabilityService.getAllClassroomAvailabilities(),
        instructorAvailabilityService.getAllInstructorAvailabilities(),
        getAllClassrooms(),
        getAllUsers({ limit: 1000 }),
        getAllPrograms(),
        getAllSubjects(),
        getAllClasses()
      ]);

      if (classroomAvailResult.success) {
        setClassroomAvailabilities(classroomAvailResult.data || []);
      }
      if (instructorAvailResult.success) {
        setInstructorAvailabilities(instructorAvailResult.data || []);
      }
      if (classroomsResult.success) {
        setClassrooms(classroomsResult.data || []);
      }
      if (instructorsResult.success) {
        setInstructors(instructorsResult.data || []);
      }
      if (programsResult.success) {
        setPrograms(programsResult.data || []);
      }
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data || []);
      }
      if (classesResult.success) {
        setClasses(classesResult.data || []);
      }
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

  // Filtered classes for sidebar based on program/subject filters
  const filteredClasses = useMemo(() => {
    let filtered = classes;

    // Filter by program
    if (sidebarProgramFilter) {
      filtered = filtered.filter(c => c.programId === parseInt(sidebarProgramFilter));
    }

    // Filter by subject
    if (sidebarSubjectFilter) {
      filtered = filtered.filter(c => c.subjectId === parseInt(sidebarSubjectFilter));
    }

    // Filter by search
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

  // Calculate week dates from selected date
  const weekDates = useMemo(() => {
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [selectedDate]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Find matching availabilities for a specific date and day
  const getAvailabilitiesForDate = useCallback((date, type) => {
    const dayName = dayNames[date.getDay()];
    const availabilities = type === 'classroom' ? classroomAvailabilities : instructorAvailabilities;
    
    return availabilities.filter(avail => {
      // Check if date is within range
      const startDate = new Date(avail.startDate);
      const endDate = new Date(avail.endDate);
      const checkDate = new Date(date);
      
      if (checkDate < startDate || checkDate > endDate) return false;
      
      // Check if day matches
      if (!avail.dayOfWeek || !avail.dayOfWeek.includes(dayName)) return false;
      
      // Apply multi-select filters
      if (type === 'classroom') {
        // If multi-select has items, filter by them; otherwise show all
        if (selectedClassrooms.length > 0 && !selectedClassrooms.includes(avail.classroomId)) {
          return false;
        }
        // Legacy single select support
        if (selectedClassroom && avail.classroomId !== parseInt(selectedClassroom)) {
          return false;
        }
      }
      if (type === 'instructor') {
        if (selectedInstructors.length > 0 && !selectedInstructors.includes(avail.instructorUserId)) {
          return false;
        }
        // Legacy single select support
        if (selectedInstructor && avail.instructorUserId !== parseInt(selectedInstructor)) {
          return false;
        }
      }
      
      return true;
    });
  }, [classroomAvailabilities, instructorAvailabilities, selectedClassroom, selectedInstructor, selectedClassrooms, selectedInstructors, dayNames]);

  // Find overlapping slots between classroom and instructor
  const findMatchingSlots = useCallback((date) => {
    const classroomAvails = getAvailabilitiesForDate(date, 'classroom');
    const instructorAvails = getAvailabilitiesForDate(date, 'instructor');
    
    const matches = [];
    
    classroomAvails.forEach(classroomAvail => {
      instructorAvails.forEach(instructorAvail => {
        // Find overlapping slots
        classroomAvail.slots?.forEach(classroomSlot => {
          instructorAvail.slots?.forEach(instructorSlot => {
            // Check if slots overlap
            if (isTimeOverlap(classroomSlot.startTime, classroomSlot.endTime, 
                              instructorSlot.startTime, instructorSlot.endTime)) {
              const overlapStart = getMaxTime(classroomSlot.startTime, instructorSlot.startTime);
              const overlapEnd = getMinTime(classroomSlot.endTime, instructorSlot.endTime);
              
              // Calculate duration in hours
              const durationMinutes = timeToMinutes(overlapEnd) - timeToMinutes(overlapStart);
              const durationHours = durationMinutes / 60;
              
              // Apply minimum duration filter
              if (minSlotDuration > 0 && durationHours < minSlotDuration) {
                return; // Skip this slot
              }
              
              matches.push({
                classroom: classroomAvail.classroom,
                instructor: instructorAvail.instructor,
                classroomSlot,
                instructorSlot,
                overlapStart,
                overlapEnd,
                durationHours
              });
            }
          });
        });
      });
    });
    
    return matches;
  }, [getAvailabilitiesForDate, minSlotDuration]);

  // Helper: Check if two time ranges overlap
  const isTimeOverlap = (start1, end1, start2, end2) => {
    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);
    
    return (start1Min < end2Min) && (end1Min > start2Min);
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getMaxTime = (time1, time2) => {
    return timeToMinutes(time1) > timeToMinutes(time2) ? time1 : time2;
  };

  const getMinTime = (time1, time2) => {
    return timeToMinutes(time1) < timeToMinutes(time2) ? time1 : time2;
  };

  // Check if a slot is scheduled
  const isSlotScheduled = useCallback((date, match) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduledSessions.some(session => 
      session.date === dateStr &&
      session.classroomId === match.classroom?.id &&
      session.instructorId === match.instructor?.id &&
      session.startTime === match.overlapStart &&
      session.endTime === match.overlapEnd
    );
  }, [scheduledSessions]);

  // Handle match card click
  const handleMatchClick = useCallback((match, date) => {
    setSelectedMatch({ ...match, date });
    setShowModal(true);
    setSessionForm({ subject: '', className: '', notes: '' });
  }, []);

  // Handle create session
  const handleCreateSession = useCallback(async () => {
    if (!sessionForm.subject || !sessionForm.className) {
      toast.error('Subject and Class Name are required');
      return;
    }

    const newSession = {
      id: Date.now(), // Temporary ID
      date: selectedMatch.date.toISOString().split('T')[0],
      classroomId: selectedMatch.classroom?.id,
      instructorId: selectedMatch.instructor?.id,
      startTime: selectedMatch.overlapStart,
      endTime: selectedMatch.overlapEnd,
      subject: sessionForm.subject,
      className: sessionForm.className,
      notes: sessionForm.notes,
      classroom: selectedMatch.classroom,
      instructor: selectedMatch.instructor
    };

    setScheduledSessions(prev => [...prev, newSession]);
    toast.success('Session created successfully!');
    setShowModal(false);
    setSelectedMatch(null);
  }, [selectedMatch, sessionForm, toast]);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedMatch(null);
    setSessionForm({ subject: '', className: '', notes: '' });
  }, []);

  // Drag & Drop handlers
  const handleDragStart = useCallback((classItem) => {
    setDraggedItem(classItem);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverSlot(null);
  }, []);

  const handleDragOver = useCallback((e, match, date) => {
    e.preventDefault();
    setDragOverSlot({ match, date });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  const handleDrop = useCallback((e, match, date) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    // Check if already scheduled
    if (isSlotScheduled(date, match)) {
      toast.error('This slot is already scheduled');
      setDraggedItem(null);
      setDragOverSlot(null);
      return;
    }

    // Get subject and program info
    const subject = subjects.find(s => s.id === draggedItem.subjectId);
    const program = programs.find(p => p.id === draggedItem.programId);

    // Create session automatically
    const newSession = {
      id: Date.now(),
      date: date.toISOString().split('T')[0],
      classroomId: match.classroom?.id,
      instructorId: match.instructor?.id,
      startTime: match.overlapStart,
      endTime: match.overlapEnd,
      classId: draggedItem.id,
      className: draggedItem.nameEn || draggedItem.code,
      subjectId: subject?.id,
      subjectName: subject?.nameEn || subject?.code,
      programId: program?.id,
      programName: program?.nameEn || program?.code,
      notes: `Assigned via drag & drop`,
      classroom: match.classroom,
      instructor: match.instructor
    };

    setScheduledSessions(prev => [...prev, newSession]);
    toast.success(`📚 ${draggedItem.nameEn || draggedItem.code} scheduled successfully!`);
    
    setDraggedItem(null);
    setDragOverSlot(null);
  }, [draggedItem, isSlotScheduled, toast, subjects, programs]);

  // Preset handlers
  const handleSavePreset = useCallback(() => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const newPreset = {
      id: Date.now(),
      name: newPresetName,
      classrooms: selectedClassrooms,
      instructors: selectedInstructors,
      minDuration: minSlotDuration
    };

    setSavedPresets(prev => [...prev, newPreset]);
    toast.success(`Preset "${newPresetName}" saved!`);
    setShowPresetModal(false);
    setNewPresetName('');
  }, [newPresetName, selectedClassrooms, selectedInstructors, minSlotDuration, toast]);

  const handleLoadPreset = useCallback((preset) => {
    setSelectedClassrooms(preset.classrooms || []);
    setSelectedInstructors(preset.instructors || []);
    setMinSlotDuration(preset.minDuration || 0);
    toast.success(`Loaded preset: ${preset.name}`);
  }, [toast]);

  const handleDeletePreset = useCallback((presetId) => {
    setSavedPresets(prev => prev.filter(p => p.id !== presetId));
    toast.success('Preset deleted');
  }, [toast]);

  const handleClearFilters = useCallback(() => {
    setSelectedClassrooms([]);
    setSelectedInstructors([]);
    setMinSlotDuration(0);
    setSelectedClassroom('');
    setSelectedInstructor('');
    toast.success('Filters cleared');
  }, [toast]);

  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          You need admin or HR privileges to access flexible scheduling.
        </div>
      </div>
    );
  }

  if (loading) {
    return <SimpleLoading message="Loading scheduling data..." />;
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem' }}>
      {/* Draggable Subjects Sidebar */}
      {showSidebar && (
        <div style={{
          width: '250px',
          flexShrink: 0,
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
          borderRadius: '0.5rem',
          padding: '1rem',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          maxHeight: 'calc(100vh - 8rem)',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>📚 Classes</h3>
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
          <p style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '1rem' }}>
            Drag classes to schedule them
          </p>

          {/* Sidebar Filters */}
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="🔍 Search classes..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                fontSize: '0.875rem'
              }}
            />

            <Select
              value={sidebarProgramFilter}
              onChange={e => {
                setSidebarProgramFilter(e.target.value);
                setSidebarSubjectFilter('');
              }}
              options={[{ value: '', label: 'All Programs' }, ...programs.map(p => ({ value: String(p.id), label: p.nameEn || p.code }))]}
              placeholder="All Programs"
            />
            <Select
              value={sidebarSubjectFilter}
              onChange={e => setSidebarSubjectFilter(e.target.value)}
              options={[{ value: '', label: 'All Subjects' }, ...subjects.filter(s => !sidebarProgramFilter || s.programId === parseInt(sidebarProgramFilter)).map(s => ({ value: String(s.id), label: s.nameEn || s.code }))]}
              placeholder="All Subjects"
              disabled={!sidebarProgramFilter}
            />
          </div>

          {/* Classes List */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            maxHeight: 'calc(100vh - 25rem)',
            overflowY: 'auto'
          }}>
            {filteredClasses.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem 1rem',
                color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                fontSize: '0.875rem'
              }}>
                No classes found
              </div>
            ) : (
              filteredClasses.map(classItem => {
                const subject = subjects.find(s => s.id === classItem.subjectId);
                const program = programs.find(p => p.id === classItem.programId);
                
                return (
                  <div
                    key={classItem.id}
                    draggable
                    onDragStart={() => handleDragStart(classItem)}
                    onDragEnd={handleDragEnd}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                      borderRadius: '0.375rem',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      cursor: 'grab',
                      transition: 'all 0.2s',
                      opacity: draggedItem?.id === classItem.id ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (draggedItem?.id !== classItem.id) {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      📚 {classItem.nameEn || classItem.code}
                    </div>
                    {subject && (
                      <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        📖 {subject.nameEn || subject.code}
                      </div>
                    )}
                    {program && (
                      <div style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>
                        🎓 {program.nameEn || program.code}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            📚 Show Classes
          </button>
        )}

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Flexible Scheduling Calendar
          </h1>
          <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
            View and manage instructor and classroom availability intersections
          </p>
        </div>
        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: theme === 'dark' ? '#111827' : '#f3f4f6', borderRadius: '0.5rem', padding: '0.25rem' }}>
          {[{ id: 'week', label: '📅 Week' }, { id: 'timeline', label: '📊 Timeline' }].map(v => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              style={{
                padding: '0.375rem 0.875rem', borderRadius: '0.375rem', border: 'none',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500',
                backgroundColor: viewMode === v.id
                  ? (theme === 'dark' ? '#374151' : '#ffffff')
                  : 'transparent',
                color: viewMode === v.id
                  ? (theme === 'dark' ? '#f3f4f6' : '#1f2937')
                  : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                boxShadow: viewMode === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: '1rem',
        backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
        borderRadius: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Filter Presets */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>Quick Presets:</span>
          {savedPresets.map(preset => (
            <div key={preset.id} style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => handleLoadPreset(preset)}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                }}
              >
                {preset.name}
              </button>
              {preset.id > 2 && ( // Don't allow deleting default presets
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  style={{
                    padding: '0.375rem',
                    backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2',
                    border: `1px solid ${theme === 'dark' ? '#991b1b' : '#fca5a5'}`,
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: theme === 'dark' ? '#fca5a5' : '#991b1b'
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setShowPresetModal(true)}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: theme === 'dark' ? '#065f46' : '#d1fae5',
              border: `1px solid ${theme === 'dark' ? '#047857' : '#10b981'}`,
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '500',
              color: theme === 'dark' ? '#d1fae5' : '#065f46'
            }}
          >
            + Save Current
          </button>
          <button
            onClick={handleClearFilters}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
            }}
          >
            Clear All
          </button>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: theme === 'dark' ? '#1e40af' : '#dbeafe',
              border: `1px solid ${theme === 'dark' ? '#3b82f6' : '#60a5fa'}`,
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '500',
              color: theme === 'dark' ? '#dbeafe' : '#1e40af'
            }}
          >
            {showAdvancedFilters ? '▼' : '▶'} Advanced
          </button>
        </div>

        {/* Basic Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
              Week Starting
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
              Min Duration (hours)
            </label>
            <input
              type="number"
              min="0"
              max="8"
              step="0.5"
              value={minSlotDuration}
              onChange={(e) => setMinSlotDuration(parseFloat(e.target.value) || 0)}
              placeholder="0 = All"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button onClick={loadData} style={{ width: '100%' }}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Classrooms (Multi-select)
                </label>
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  backgroundColor: theme === 'dark' ? '#111827' : '#ffffff'
                }}>
                  {classrooms.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedClassrooms.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClassrooms(prev => [...prev, c.id]);
                          } else {
                            setSelectedClassrooms(prev => prev.filter(id => id !== c.id));
                          }
                        }}
                      />
                      <span style={{ fontSize: '0.875rem' }}>{c.code} - {c.nameEn}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Instructors (Multi-select)
                </label>
                <div style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  backgroundColor: theme === 'dark' ? '#111827' : '#ffffff'
                }}>
                  {instructors.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedInstructors.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInstructors(prev => [...prev, u.id]);
                          } else {
                            setSelectedInstructors(prev => prev.filter(id => id !== u.id));
                          }
                        }}
                      />
                      <span style={{ fontSize: '0.875rem' }}>{u.displayName || `${u.firstName} ${u.lastName}`}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── TIMELINE VIEW ── */}
      {viewMode === 'timeline' && (() => {
        const HOUR_START = 7;  // 07:00
        const HOUR_END   = 21; // 21:00
        const TOTAL_HOURS = HOUR_END - HOUR_START;
        const LABEL_W = 160; // px
        const ROW_H = 56;    // px per day-row

        // Collect all matching slots across the visible week
        const allEntries = weekDates.flatMap(date => {
          const dayName = dayNames[date.getDay()];
          return findMatchingSlots(date).map(match => ({
            match,
            date,
            dayName,
            dateKey: date.toISOString().split('T')[0]
          }));
        });

        // Group by instructor so each instructor gets a swimlane
        const instructorMap = {};
        allEntries.forEach(e => {
          const key = e.match.instructor?.id ?? 'unknown';
          if (!instructorMap[key]) instructorMap[key] = { instructor: e.match.instructor, entries: [] };
          instructorMap[key].entries.push(e);
        });
        const lanes = Object.values(instructorMap);

        const pct = (time) => {
          const mins = timeToMinutes(time) - HOUR_START * 60;
          return Math.max(0, Math.min(100, (mins / (TOTAL_HOURS * 60)) * 100));
        };

        // Time axis tick labels
        const ticks = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

        return (
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            {/* Header: time axis */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
              <div style={{ width: LABEL_W, flexShrink: 0 }} />
              <div style={{ flex: 1, position: 'relative', minWidth: 700 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {ticks.map(h => (
                    <span key={h} style={{ fontSize: '0.7rem', color: theme === 'dark' ? '#6b7280' : '#9ca3af', width: 0, whiteSpace: 'nowrap', overflow: 'visible' }}>
                      {h}:00
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {lanes.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>
                No matching availability slots for this week. Try adjusting filters or the selected week.
              </div>
            ) : (
              lanes.map(lane => {
                const instructorName = lane.instructor?.displayName ||
                  `${lane.instructor?.firstName || ''} ${lane.instructor?.lastName || ''}`.trim() ||
                  'Unknown';
                return (
                  <div key={lane.instructor?.id ?? 'unknown'} style={{ display: 'flex', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                    {/* Lane label */}
                    <div style={{ width: LABEL_W, flexShrink: 0, paddingRight: '0.75rem', paddingTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        👤 {instructorName}
                      </div>
                    </div>

                    {/* Timeline rows – one per day that has entries */}
                    <div style={{ flex: 1, minWidth: 700, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {weekDates.map(date => {
                        const dateKey = date.toISOString().split('T')[0];
                        const dayEntries = lane.entries.filter(e => e.dateKey === dateKey);
                        if (dayEntries.length === 0) return null;
                        return (
                          <div key={dateKey} style={{ position: 'relative', height: ROW_H, backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb', borderRadius: '0.25rem', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }}>
                            {/* Day label inside row */}
                            <span style={{ position: 'absolute', left: 4, top: 2, fontSize: '0.65rem', color: theme === 'dark' ? '#4b5563' : '#d1d5db', fontWeight: '600', zIndex: 1 }}>
                              {dayNames[date.getDay()]} {date.getDate()}
                            </span>

                            {/* Vertical hour grid lines */}
                            {ticks.map(h => (
                              <div key={h} style={{ position: 'absolute', top: 0, bottom: 0, left: `${((h - HOUR_START) / TOTAL_HOURS) * 100}%`, width: 1, backgroundColor: theme === 'dark' ? '#1f2937' : '#e5e7eb', zIndex: 0 }} />
                            ))}

                            {/* Slot bars */}
                            {dayEntries.map((e, idx) => {
                              const left = pct(e.match.overlapStart);
                              const right = pct(e.match.overlapEnd);
                              const width = right - left;
                              const scheduled = isSlotScheduled(e.date, e.match);
                              const isDragOverThis = dragOverSlot?.match === e.match && dragOverSlot?.date === e.date;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => !scheduled && handleMatchClick(e.match, e.date)}
                                  onDragOver={(ev) => !scheduled && handleDragOver(ev, e.match, e.date)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(ev) => !scheduled && handleDrop(ev, e.match, e.date)}
                                  title={`${e.match.overlapStart}–${e.match.overlapEnd} | ${e.match.classroom?.code} | ${instructorName}`}
                                  style={{
                                    position: 'absolute',
                                    top: '20%', height: '60%',
                                    left: `${left}%`, width: `${Math.max(width, 1)}%`,
                                    borderRadius: '0.25rem',
                                    backgroundColor: isDragOverThis
                                      ? (theme === 'dark' ? '#fbbf24' : '#fef3c7')
                                      : scheduled
                                        ? (theme === 'dark' ? '#1e40af' : '#bfdbfe')
                                        : (theme === 'dark' ? '#065f46' : '#bbf7d0'),
                                    border: `1px solid ${isDragOverThis ? '#f59e0b' : scheduled ? '#3b82f6' : '#10b981'}`,
                                    cursor: scheduled ? 'default' : 'pointer',
                                    overflow: 'hidden',
                                    zIndex: 2,
                                    display: 'flex', alignItems: 'center',
                                    paddingLeft: '0.25rem',
                                    fontSize: '0.65rem', fontWeight: '600',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  {scheduled ? '🔵 ' : ''}{e.match.overlapStart}–{e.match.overlapEnd} {e.match.classroom?.code}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })()}

      {/* ── WEEK GRID VIEW ── */}
      {viewMode === 'week' && <div style={{
        overflowX: 'auto',
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        borderRadius: '0.5rem',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb' }}>
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                fontWeight: '600',
                borderBottom: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
              }}>
                Day
              </th>
              {weekDates.map((date, idx) => (
                <th key={idx} style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  borderBottom: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  minWidth: '150px'
                }}>
                  <div>{dayNames[date.getDay()]}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '400', marginTop: '0.25rem' }}>
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ 
                padding: '0.75rem', 
                fontWeight: '500',
                verticalAlign: 'top',
                borderRight: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
              }}>
                Available Slots
              </td>
              {weekDates.map((date, idx) => {
                const matches = findMatchingSlots(date);
                return (
                  <td key={idx} style={{ 
                    padding: '0.5rem',
                    verticalAlign: 'top',
                    borderRight: idx < 6 ? `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` : 'none'
                  }}>
                    {matches.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                        fontSize: '0.875rem',
                        padding: '1rem'
                      }}>
                        No matches
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {matches.map((match, matchIdx) => {
                          const scheduled = isSlotScheduled(date, match);
                          const isDragOver = dragOverSlot?.match === match && dragOverSlot?.date === date;
                          return (
                            <div
                              key={matchIdx}
                              onClick={() => !scheduled && handleMatchClick(match, date)}
                              onDragOver={(e) => !scheduled && handleDragOver(e, match, date)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => !scheduled && handleDrop(e, match, date)}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: isDragOver
                                  ? (theme === 'dark' ? '#fbbf24' : '#fef3c7')
                                  : scheduled 
                                    ? (theme === 'dark' ? '#1e40af' : '#bfdbfe') 
                                    : (theme === 'dark' ? '#065f46' : '#d1fae5'),
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                border: `2px ${isDragOver ? 'dashed' : 'solid'} ${
                                  isDragOver
                                    ? (theme === 'dark' ? '#f59e0b' : '#fbbf24')
                                    : scheduled 
                                      ? (theme === 'dark' ? '#3b82f6' : '#60a5fa')
                                      : (theme === 'dark' ? '#047857' : '#10b981')
                                }`,
                                cursor: scheduled ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                transform: isDragOver ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: isDragOver ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (!scheduled && !isDragOver) {
                                  e.currentTarget.style.transform = 'scale(1.02)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isDragOver) {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }
                              }}
                            >
                              {isDragOver && (
                                <div style={{ 
                                  fontSize: '0.65rem', 
                                  fontWeight: '600', 
                                  marginBottom: '0.25rem',
                                  color: theme === 'dark' ? '#fbbf24' : '#f59e0b'
                                }}>
                                  ⬇️ Drop to schedule
                                </div>
                              )}
                              <div style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {scheduled && <span>🔵</span>}
                                {match.overlapStart} - {match.overlapEnd}
                              </div>
                              <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                                🏫 {match.classroom?.code || 'Classroom'}
                              </div>
                              <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                                👤 {match.instructor?.displayName || 
                                 `${match.instructor?.firstName} ${match.instructor?.lastName}`}
                              </div>
                              {scheduled && (
                                <div style={{ fontSize: '0.65rem', marginTop: '0.25rem', fontWeight: '600', opacity: 0.8 }}>
                                  ✓ Scheduled
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>}

      {/* Summary Stats */}
      <div style={{
        marginTop: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
          borderRadius: '0.5rem',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            Classroom Availabilities
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '0.25rem' }}>
            {classroomAvailabilities.length}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
          borderRadius: '0.5rem',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            Instructor Availabilities
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '0.25rem' }}>
            {instructorAvailabilities.length}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
          borderRadius: '0.5rem',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            Total Matches This Week
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '0.25rem' }}>
            {weekDates.reduce((sum, date) => sum + findMatchingSlots(date).length, 0)}
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      {showModal && selectedMatch && (
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
        }} onClick={handleCloseModal}>
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Create Class Session</h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {/* Session Details */}
            <div style={{
              padding: '1rem',
              backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                📅 {selectedMatch.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                🕐 {selectedMatch.overlapStart} - {selectedMatch.overlapEnd}
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                🏫 {selectedMatch.classroom?.code} - {selectedMatch.classroom?.nameEn}
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                👤 {selectedMatch.instructor?.displayName || `${selectedMatch.instructor?.firstName} ${selectedMatch.instructor?.lastName}`}
              </div>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={sessionForm.subject}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Mathematics, Physics"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                    color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Class Name *
                </label>
                <input
                  type="text"
                  value={sessionForm.className}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, className: e.target.value }))}
                  placeholder="e.g., Grade 10A, CS101"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                    color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Notes (Optional)
                </label>
                <textarea
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                    color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Button onClick={handleCreateSession} style={{ flex: 1 }}>
                  Create Session
                </Button>
                <Button onClick={handleCloseModal} variant="outline" style={{ flex: 1 }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showPresetModal && (
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
        }} onClick={() => setShowPresetModal(false)}>
          <div style={{
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '90%'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Save Filter Preset
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Preset Name
              </label>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g., CS Department Morning"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                  backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                  color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: '1rem' }}>
              This will save: {selectedClassrooms.length} classrooms, {selectedInstructors.length} instructors, min duration: {minSlotDuration}h
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button onClick={handleSavePreset} style={{ flex: 1 }}>
                Save
              </Button>
              <Button onClick={() => setShowPresetModal(false)} variant="outline" style={{ flex: 1 }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FlexibleSchedulingPage;
