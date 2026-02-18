import React, { useEffect, useMemo, useState, useCallback, useLayoutEffect, useRef } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { getAllClasses, updateClassSchedule } from '@services/business/classService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getUserByEmail } from '@services/business/userService';
import { getDayNames, getCurrentLanguage } from '@utils/date';
import { getEnrollments } from '@services/business/enrollmentService';
import { getPenalties } from '@services/business/penaltyService';
import { getBehaviors } from '@services/business/behaviorService';
import { getAllQuizzes } from '@services/business/quizService';
import { getActivities } from '@services/business/activityService';
import { getAnnouncements } from '@services/business/announcementService';
import { getResources } from '@services/business/resourceService';
import { FilterSelect, useToast, SimpleLoading, Button, Select } from '@ui';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { ProgramsSelect } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { Tooltip } from '@ui';
import { ClassCard } from '@ui';

const ClassSchedulePage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { primaryColor } = useColorTheme(); // Simple! Gets color from localStorage
  const toast = useToast();

  // Helper function to get localized class name
  const getLocalizedClassName = (cls) => {
    if (lang === 'ar' && cls.nameAr) {
      return cls.nameAr;
    }
    return cls.name || cls.code || t('unnamed_class') || 'Unnamed Class';
  };
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState({}); // Map email -> user data
  const [selectedClass, setSelectedClass] = useState(null);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' | 'semester'
  const [quickSearch, setQuickSearch] = useState(''); // Quick filter for class name or instructor
  const [classStats, setClassStats] = useState({}); // Statistics for each class

  // Debug log to show current primaryColor
  console.log('[ClassSchedule] Primary color from ColorTheme:', primaryColor);
  const [programFilter, setProgramFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [schedule, setSchedule] = useState({
    frequency: 'once', // once, twice, thrice
    days: [], // ['SUN', 'TUE', 'THU']
    startTime: '09:00',
    duration: 60, // minutes
    holidays: [], // ['2024-12-25', '2024-12-26']
    instructorAbsent: [] // ['2024-11-15']
  });
  const [newHoliday, setNewHoliday] = useState('');
  const [newAbsent, setNewAbsent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const { startLoading } = useGlobalLoading();
  const selectedClassRef = useRef(selectedClass);
  
  // Update ref when selectedClass changes
  useEffect(() => {
    selectedClassRef.current = selectedClass;
  }, [selectedClass]);

  // Get localized day names using date utility
  const dayNames = getDayNames(t, getCurrentLanguage(t));
  const dayOptions = dayNames.map((dayName, index) => {
    const dayValues = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return {
      value: dayValues[index],
      label: dayName
    };
  });
  const frequencyOptions = [
    { value: 'once', label: t('once_a_week') || 'Once a week', days: 1 },
    { value: 'twice', label: t('twice_a_week') || 'Twice a week', days: 2 },
    { value: 'thrice', label: t('three_times_a_week') || 'Three times a week', days: 3 }
  ];
  const durationOptions = [60, 75, 90, 105, 120, 135, 150, 180];

  const availableYears = useMemo(() => {
    const years = new Set();
    classes.forEach(cls => {
      // Try to get year from separate field first, then from term string
      if (cls.year) {
        years.add(String(cls.year));
      } else if (cls.term) {
        const parts = cls.term.split(' ');
        if (parts.length > 1) {
          const yearPart = parts[parts.length - 1];
          if (yearPart && !isNaN(yearPart)) {
            years.add(yearPart);
          }
        }
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [classes]);

  const availableTerms = useMemo(() => {
    const terms = new Set();
    classes.forEach(cls => {
      if (cls.term) {
        // Extract just the term part (e.g., "Fall" from "Fall 2025")
        const termPart = cls.term.split(' ')[0];
        if (termPart) terms.add(termPart);
      }
    });
    return Array.from(terms).sort();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    let result = [...classes];

    // Quick search filter for class name or instructor
    if (quickSearch.trim()) {
      const searchLower = quickSearch.toLowerCase();
      result = result.filter(cls => {
        const className = (cls.name || cls.code || '').toLowerCase();
        const instructorName = instructors[cls.ownerEmail] 
          ? (instructors[cls.ownerEmail].realName || instructors[cls.ownerEmail].displayName || instructors[cls.ownerEmail].email || '').toLowerCase()
          : '';
        return className.includes(searchLower) || instructorName.includes(searchLower);
      });
    }

    // Note: Program, subject, and class filtering is now handled by ProgramsSelect
    // We only need to filter by year and term here

    // Filter by year
    if (yearFilter !== 'all') {
      result = result.filter(cls => {
        if (cls.year && String(cls.year) === yearFilter) return true;
        if (cls.term) {
          const parts = cls.term.split(' ');
          if (parts.length > 1) {
            const yearPart = parts[parts.length - 1];
            return yearPart === yearFilter;
          }
        }
        return false;
      });
    }

    // Filter by term
    if (termFilter !== 'all') {
      result = result.filter(cls => {
        if (!cls.term) return false;
        const termPart = cls.term.split(' ')[0];
        return termPart === termFilter;
      });
    }

    // Sort by term/year first (most recent first), then by name, then by instructor
    result.sort((a, b) => {
      // Extract year for comparison
      const getYear = (cls) => {
        if (cls.year) return Number(cls.year);
        if (cls.term) {
          const parts = cls.term.split(' ');
          const yearPart = parts[parts.length - 1];
          return !isNaN(yearPart) ? Number(yearPart) : 0;
        }
        return 0;
      };
      
      // Extract term for comparison (Fall > Spring > Summer > Winter)
      const getTermOrder = (cls) => {
        if (!cls.term) return 0;
        const term = cls.term.toLowerCase();
        if (term.includes('fall')) return 4;
        if (term.includes('spring')) return 3;
        if (term.includes('summer')) return 2;
        if (term.includes('winter')) return 1;
        return 0;
      };
      
      // Get instructor name for sorting
      const getInstructorName = (cls) => {
        if (!cls.ownerEmail || !instructors[cls.ownerEmail]) return '';
        const instructor = instructors[cls.ownerEmail];
        return (instructor.realName || instructor.displayName || instructor.email || '').toLowerCase();
      };
      
      const aYear = getYear(a);
      const bYear = getYear(b);
      const aTermOrder = getTermOrder(a);
      const bTermOrder = getTermOrder(b);
      
      // Sort by year first (descending), then by term order (descending), then by name, then by instructor
      if (aYear !== bYear) return bYear - aYear;
      if (aTermOrder !== bTermOrder) return bTermOrder - aTermOrder;
      
      const aName = (a.name || a.code || '').toLowerCase();
      const bName = (b.name || b.code || '').toLowerCase();
      if (aName !== bName) return aName.localeCompare(bName);
      
      const aInstructor = getInstructorName(a);
      const bInstructor = getInstructorName(b);
      return aInstructor.localeCompare(bInstructor);
    });
    
    return result;
  }, [classes, yearFilter, termFilter, instructors, quickSearch]);

  // Group classes by semester for semester view
  const classesBySemester = useMemo(() => {
    const grouped = {};
    filteredClasses.forEach(cls => {
      const semester = cls.term || 'Unknown Semester';
      if (!grouped[semester]) {
        grouped[semester] = [];
      }
      grouped[semester].push(cls);
    });
    return grouped;
  }, [filteredClasses]);

  // Fetch class statistics for semester view (OPTIMIZED but functional)
  const fetchClassStats = useCallback(async (classList) => {
    const stats = {};
    
    // Only fetch stats if we're in semester view and have classes
    if (viewMode !== 'semester' || !classList || classList.length === 0) {
      return;
    }
    
    console.log('📊 [ClassSchedule] Fetching stats for', classList.length, 'classes');
    
    // Get all class IDs
    const classIds = classList.map(cls => cls.docId || cls.id).filter(Boolean);
    
    if (classIds.length === 0) {
      console.warn('📊 [ClassSchedule] No valid class IDs found');
      return;
    }
    
    try {
      // Fetch data for statistics (needed for ClassCard display)
      const [
        enrollmentsRes,
        penaltiesRes,
        behaviorsRes,
        quizzesRes,
        activitiesRes,
        announcementsRes,
        resourcesRes
      ] = await Promise.all([
        getEnrollments().catch(() => ({ success: false, data: [] })),
        getPenalties().catch(() => ({ success: false, data: [] })),
        getBehaviors().catch(() => ({ success: false, data: [] })),
        getAllQuizzes().catch(() => ({ success: false, data: [] })),
        getActivities().catch(() => ({ success: false, data: [] })),
        getAnnouncements().catch(() => ({ success: false, data: [] })),
        getResources().catch(() => ({ success: false, data: [] }))
      ]);

      // Filter data for each class
      for (const classId of classIds) {
        const classEnrollments = enrollmentsRes.success ? enrollmentsRes.data.filter(e => e.classId === classId) : [];
        const classPenalties = penaltiesRes.success ? penaltiesRes.data.filter(p => p.classId === classId) : [];
        const classBehaviors = behaviorsRes.success ? behaviorsRes.data.filter(b => b.classId === classId) : [];
        const classQuizzes = quizzesRes.success ? quizzesRes.data.filter(q => q.classId === classId) : [];
        const classActivities = activitiesRes.success ? activitiesRes.data.filter(a => a.classId === classId) : [];
        const classAnnouncements = announcementsRes.success ? announcementsRes.data.filter(a => a.classId === classId) : [];
        const classResources = resourcesRes.success ? resourcesRes.data.filter(r => r.classId === classId) : [];

        stats[classId] = {
          students: classEnrollments.length,
          penalties: classPenalties.length,
          behaviors: classBehaviors.length,
          quizzes: classQuizzes.length,
          activities: classActivities.length,
          announcements: classAnnouncements.length,
          resources: classResources.length
        };
      }
      
      console.log('✅ [ClassSchedule] Stats fetched successfully');
      setClassStats(stats);
    } catch (error) {
      console.error('❌ [ClassSchedule] Failed to fetch stats:', error);
      // Set empty stats on error
      const emptyStats = {};
      classIds.forEach(classId => {
        emptyStats[classId] = {
          students: 0,
          penalties: 0,
          behaviors: 0,
          quizzes: 0,
          activities: 0,
          announcements: 0,
          resources: 0
        };
      });
      setClassStats(emptyStats);
    }
  }, [viewMode]); // Keep viewMode dependency

  // Refetch stats when classes change for semester view (BALANCED)
  useEffect(() => {
    // Fetch stats when in semester view and classes are available
    if (viewMode === 'semester' && classes.length > 0) {
      console.log('🔄 [ClassSchedule] Triggering stats fetch for semester view');
      fetchClassStats(classes);
    }
  }, [viewMode, classes, fetchClassStats]);

  const loadClasses = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const [classesRes, programsRes, subjectsRes] = await Promise.all([
        getAllClasses(),
        getPrograms(),
        getSubjects()
      ]);
      
      if (classesRes.success) {
        setClasses(classesRes.data);
        
        // Fetch class statistics for semester view
        fetchClassStats(classesRes.data);
        
        // Fetch instructor data for all classes
        const instructorEmails = [...new Set(classesRes.data.map(cls => cls.ownerEmail).filter(Boolean))];
        console.log('👨‍🏫 [ClassSchedule] Found instructor emails:', instructorEmails);
        
        const instructorPromises = instructorEmails.map(async (email) => {
          try {
            console.log(`🔍 [ClassSchedule] Fetching instructor data for: ${email}`);
            const userRes = await getUserByEmail(email);
            const instructorData = userRes.success ? userRes.data : null;
            console.log(`📋 [ClassSchedule] Instructor data for ${email}:`, instructorData);
            return { email, data: instructorData };
          } catch (error) {
            console.warn(`Failed to fetch instructor for email: ${email}`, error);
            return { email, data: null };
          }
        });
        
        const instructorResults = await Promise.all(instructorPromises);
        const instructorMap = {};
        instructorResults.forEach(({ email, data }) => {
          if (data) {
            // Ensure we have the full user object with all fields
            instructorMap[email] = {
              ...data,
              email: email // Ensure email is included
            };
            console.log(`✅ [ClassSchedule] Mapped instructor: ${email} ->`, data.displayName || data.realName || 'No name');
          } else {
            console.warn(`❌ [ClassSchedule] No data found for instructor: ${email}`);
          }
        });
        
        console.log('🎯 [ClassSchedule] Final instructor map:', instructorMap);
        setInstructors(instructorMap);
      } else {
        throw new Error(classesRes.error);
      }
      
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);

      const previouslySelectedId = selectedClassRef.current?.docId || selectedClassRef.current?.id;
      if (previouslySelectedId && classesRes.success) {
        const matching = classesRes.data.find(cls => (cls.docId || cls.id) === previouslySelectedId);
        if (matching) {
          loadSchedule(matching, { skipScroll: true });
        }
      }
    } catch (e) {
      // permission-denied should not spam console
      if (e?.code === 'permission-denied') return;
      logger.error('[Schedule] Error loading classes:', e);
    } finally {
      if (!isInitial) setLoading(false);
    }
  }, [fetchClassStats]);

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (!user) return;
    if (!isAdmin && !isInstructor) return;

    let stopLoading = null;

    const initialLoad = async () => {
      stopLoading = startLoading({ message: t('loading_schedule') || 'Loading schedule...' });
      await loadClasses(true);
      if (stopLoading) stopLoading();
      setLoading(false);
    };

    initialLoad();

    return () => {
      if (stopLoading) stopLoading();
    };
  }, [user, isAdmin, isInstructor, startLoading, t, loadClasses]);

  const loadSchedule = (classData, options = {}) => {
    const safeClass = classData ? { ...classData, docId: classData.docId || classData.id, id: classData.id || classData.docId } : null;
    setSelectedClass(safeClass);
    if (classData.schedule) {
      setSchedule({
        frequency: classData.schedule.frequency || 'once',
        days: classData.schedule.days || [],
        startTime: classData.schedule.startTime || '09:00',
        duration: classData.schedule.duration || 60,
        holidays: classData.schedule.holidays || [],
        instructorAbsent: classData.schedule.instructorAbsent || []
      });
    } else {
      setSchedule({
        frequency: 'once',
        days: [],
        startTime: '09:00',
        duration: 60,
        holidays: [],
        instructorAbsent: []
      });
    }
  };

  const toggleDay = (dayValue) => {
    const maxDays = frequencyOptions.find(f => f.value === schedule.frequency)?.days || 1;
    if (schedule.days.includes(dayValue)) {
      setSchedule({ ...schedule, days: schedule.days.filter(d => d !== dayValue) });
    } else {
      if (schedule.days.length < maxDays) {
        setSchedule({ ...schedule, days: [...schedule.days, dayValue] });
      }
    }
  };

  const addHoliday = () => {
    if (newHoliday && !schedule.holidays.includes(newHoliday)) {
      setSchedule({ ...schedule, holidays: [...schedule.holidays, newHoliday] });
      setNewHoliday('');
    }
  };

  const removeHoliday = (date) => {
    setSchedule({ ...schedule, holidays: schedule.holidays.filter(d => d !== date) });
  };

  const addAbsent = () => {
    if (newAbsent && !schedule.instructorAbsent.includes(newAbsent)) {
      setSchedule({ ...schedule, instructorAbsent: [...schedule.instructorAbsent, newAbsent] });
      setNewAbsent('');
    }
  };

  const removeAbsent = (date) => {
    setSchedule({ ...schedule, instructorAbsent: schedule.instructorAbsent.filter(d => d !== date) });
  };

  const saveSchedule = async () => {
    // Use docId or id, whichever is available
    const cid = selectedClass?.docId || selectedClass?.id;
    if (!selectedClass || !cid) {
      toast?.error?.(t('select_class_first') || 'Please select a class first');
      return;
    }
    setSaving(true);
    try {
      const result = await updateClassSchedule(cid, schedule);
      if (result.success) {
        toast?.success?.(t('schedule_saved') || 'Schedule saved successfully!');
        await loadClasses();
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      logger.error('[Schedule] Error saving:', e);
      toast?.error?.((t('schedule_save_failed') || 'Failed to save schedule: ') + (e?.message || 'unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin && !isInstructor) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <h2>{t('access_denied') || 'Access Denied'}</h2>
        <p>{t('instructor_admin_only') || 'This page is only accessible to instructors and admins.'}</p>
      </div>
    );
  }

  // Full-page loading
  if (loading) {
    return (
      <SimpleLoading 
        loading
        fullscreen
        type="brand"
        size="lg"
      />
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>
      {/* Filter Row - Above everything */}
      <div style={{ 
        marginBottom: '1rem', 
        padding: '0.75rem', 
        background: 'var(--panel)', 
        border: '1px solid var(--border)', 
        borderRadius: 12 
      }}>
        <div style={{ 
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16
        }}>
          {/* Left side - View Toggle and Search */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            alignItems: 'center',
            flex: 1
          }}>
            {/* View Toggle */}
            <div style={{ display: 'flex', gap: 4, background: theme === 'dark' ? '#1f2937' : '#f3f4f6', padding: 4, borderRadius: 8 }}>
              <button
                onClick={() => setViewMode('detailed')}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: 6,
                  background: viewMode === 'detailed' ? primaryColor : 'transparent',
                  color: viewMode === 'detailed' ? 'white' : (theme === 'dark' ? '#f9fafb' : '#111827'),
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {getThemedIcon('ui', 'list', 16, viewMode === 'detailed' ? 'white' : theme)}
              </button>
              <button
                onClick={() => setViewMode('semester')}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: 6,
                  background: viewMode === 'semester' ? primaryColor : 'transparent',
                  color: viewMode === 'semester' ? 'white' : (theme === 'dark' ? '#f9fafb' : '#111827'),
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {getThemedIcon('ui', 'calendar', 16, viewMode === 'semester' ? 'white' : theme)}
              </button>
            </div>

            {/* Quick Search */}
            <input
              type="text"
              placeholder={t('quick_search_class_instructor') || 'Quick search class or instructor...'}
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 200,
                maxWidth: 300,
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: '0.875rem',
                background: theme === 'dark' ? '#1f2937' : '#fff',
                color: theme === 'dark' ? '#f9fafb' : '#111827'
              }}
            />
          </div>
        </div>

        {/* Filter Row - ProgramsSelect spans full row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr', 
          gap: 8,
          marginBottom: '0.5rem'
        }}>
          <ProgramsSelect
            programs={programs}
            subjects={subjects}
            classes={classes}
            selectedProgram={programFilter}
            selectedSubject={subjectFilter}
            selectedClass={classFilter}
            onProgramChange={(programId) => {
              setProgramFilter(programId);
              setSubjectFilter('');
              setClassFilter('');
            }}
            onSubjectChange={(subjectId) => {
              setSubjectFilter(subjectId);
              setClassFilter('');
            }}
            onClassChange={setClassFilter}
            showLabels={false}
            fullWidth
          />
        </div>

        {/* Second Filter Row - Year and Term */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: 8 
        }}>
          <Select
            searchable
            placeholder={t('all_years') || 'All years'}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            options={[
              { value: 'all', label: t('all_years') || 'All years' },
              ...availableYears.map(year => ({ value: year, label: year }))
            ]}
            fullWidth
          />
          <Select
            searchable
            placeholder={t('all_terms') || 'All terms'}
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            options={[
              { value: 'all', label: t('all_terms') || 'All terms' },
              ...availableTerms.map(term => ({ value: term, label: term }))
            ]}
            fullWidth
          />
        </div>
      </div>

      {/* Conditional Rendering Based on View Mode */}
      {viewMode === 'detailed' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
          {/* Class List - Detailed View */}
          <div style={{ padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, maxHeight: 600, overflowY: 'auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>{t('classes') || 'Classes'} ({filteredClasses.length})</div>
            <div style={{ display: 'grid', gap: 8 }}>
            {filteredClasses.map((cls, index) => {
              const currentId = selectedClass?.docId || selectedClass?.id;
              const clsId = cls.docId || cls.id;
              const isSelected = currentId === clsId;
              const hasSchedule = cls.schedule && cls.schedule.days && cls.schedule.days.length > 0;
              
              // Add instructor data to the class object for the ClassCard
              const clsWithInstructor = {
                ...cls,
                instructorData: instructors[cls.ownerEmail] ? {
                  firstName: instructors[cls.ownerEmail].firstName,
                  lastName: instructors[cls.ownerEmail].lastName,
                  displayName: instructors[cls.ownerEmail].displayName,
                  realName: instructors[cls.ownerEmail].realName,
                  email: instructors[cls.ownerEmail].email,
                  messageColor: instructors[cls.ownerEmail].messageColor
                } : null
              };
              
              return (
                <div
                  key={clsId || `class-${index}`}
                  onClick={() => loadSchedule(cls)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: isSelected ? `${primaryColor}20` : (theme === 'dark' ? '#1f2937' : '#fff'),
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: isSelected ? `${primaryColor}30` : (theme === 'dark' ? '#374151' : '#f9fafb')
                    }
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {getLocalizedClassName(cls)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {cls.term && <span>{cls.term}</span>}
                    {cls.year && !cls.term && <span>{t('year') || 'Year'} {cls.year}</span>}
                  </div>
                  {cls.ownerEmail && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {instructors[cls.ownerEmail] 
                        ? (instructors[cls.ownerEmail].realName || instructors[cls.ownerEmail].displayName || instructors[cls.ownerEmail].email)
                        : `${t('loading') || 'Loading'}... (${cls.ownerEmail})`
                      }
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {hasSchedule ? `${cls.schedule.frequency} • ${cls.schedule.days.map(day => {
                    const dayOption = dayOptions.find(d => d.value === day);
                    return dayOption ? dayOption.label : day;
                  }).join(', ')}` : (t('no_schedule') || 'No schedule')}
                  </div>
                  
                  {/* Compact Statistics for detailed view */}
                  {classStats[clsId] && (
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '0.25rem', 
                      marginTop: '0.5rem',
                      fontSize: 9,
                      color: 'var(--muted)'
                    }}>
                      {classStats[clsId].students > 0 && (
                        <Tooltip content={t('students') || 'Students'}>
                          <span 
                            style={{ 
                              background: `${primaryColor}15`, 
                              color: primaryColor, 
                              padding: '1px 4px', 
                              borderRadius: 3,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            {getThemedIcon('ui', 'users', 8, theme === 'light' ? 'white' : primaryColor)}
                            {classStats[clsId].students}
                          </span>
                        </Tooltip>
                      )}
                      {classStats[clsId].penalties > 0 && (
                        <Tooltip content={t('penalties') || 'Penalties'}>
                          <span 
                            style={{ 
                              background: '#ef444415', 
                              color: '#ef4444', 
                              padding: '1px 4px', 
                              borderRadius: 3,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            {getThemedIcon('penalty_type', 'cheating', 8, theme === 'light' ? 'white' : '#ef4444')}
                            {classStats[clsId].penalties}
                          </span>
                        </Tooltip>
                      )}
                      {classStats[clsId].behaviors > 0 && (
                        <Tooltip content={t('behaviors') || 'Behaviors'}>
                          <span 
                            style={{ 
                              background: '#f59e0b15', 
                              color: '#f59e0b', 
                              padding: '1px 4px', 
                              borderRadius: 3,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            {getThemedIcon('behavior_type', 'disruptive', 8, theme === 'light' ? 'white' : '#f59e0b')}
                            {classStats[clsId].behaviors}
                          </span>
                        </Tooltip>
                      )}
                      {classStats[clsId].quizzes > 0 && (
                        <Tooltip content={t('quizzes') || 'Quizzes'}>
                          <span 
                            style={{ 
                              background: '#8b5cf615', 
                              color: '#8b5cf6', 
                              padding: '1px 4px', 
                              borderRadius: 3,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            {getThemedIcon('ui', 'file_text', 8, theme === 'light' ? 'white' : '#8b5cf6')}
                            {classStats[clsId].quizzes}
                          </span>
                        </Tooltip>
                      )}
                      {classStats[clsId].activities > 0 && (
                        <Tooltip content={t('activities') || 'Activities'}>
                          <span 
                            style={{ 
                              background: '#10b98115', 
                              color: '#10b981', 
                              padding: '1px 4px', 
                              borderRadius: 3,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            {getThemedIcon('participation_type', 'excellent', 8, theme === 'light' ? 'white' : '#10b981')}
                            {classStats[clsId].activities}
                          </span>
                        </Tooltip>
                      )}
                      {classStats[clsId].announcements > 0 && (
                        <Tooltip content={t('announcements') || 'Announcements'}>
                          <span 
                            style={{ 
                              background: '#3b82f615', 
                              color: '#3b82f6', 
                              padding: '1px 4px', 
                              borderRadius: 3,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            {getThemedIcon('ui', 'megaphone', 8, theme === 'light' ? 'white' : '#3b82f6')}
                            {classStats[clsId].announcements}
                          </span>
                        </Tooltip>
                      )}
                      {classStats[clsId].resources > 0 && (
                        <Tooltip content={t('resources') || 'Resources'}>
                          <span 
                            style={{ 
                              background: '#06b6d415', 
                              color: '#06b6d4', 
                              padding: '1px 4px', 
                              borderRadius: 3,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            {getThemedIcon('ui', 'folder', 8, theme === 'light' ? 'white' : '#06b6d4')}
                            {classStats[clsId].resources}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule Editor */}
        <div style={{ padding: '1.5rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
          {!selectedClass ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              {getThemedIcon('ui', 'calendar', 48, theme)}
              <div>{t('select_class_to_configure_schedule') || 'Select a class to configure schedule'}</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{getLocalizedClassName(selectedClass)}</h2>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {selectedClass.term && `${t('term') || 'Term'}: ${selectedClass.term}`}
                  {selectedClass.year && ` • ${t('year') || 'Year'}: ${selectedClass.year}`}
                </div>
              </div>

              {/* Frequency (buttons only, no top label) */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {frequencyOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSchedule({ ...schedule, frequency: opt.value, days: schedule.days.slice(0, opt.days) });
                      }}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        background: schedule.frequency === opt.value ? primaryColor : (theme === 'dark' ? '#1f2937' : '#fff'),
                        color: schedule.frequency === opt.value ? 'white' : (theme === 'dark' ? '#f9fafb' : '#111827'),
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': {
                          background: schedule.frequency === opt.value ? primaryColor : (theme === 'dark' ? '#374151' : '#f9fafb')
                        }
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Days (keep counter but hide label text) */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'none' }}>
                  {t('select_days') || 'Select Days'} ({schedule.days.length}/{frequencyOptions.find(f => f.value === schedule.frequency)?.days})
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {dayOptions.map(dayOption => {
                    const isSelected = schedule.days.includes(dayOption.value);
                    const maxDays = frequencyOptions.find(f => f.value === schedule.frequency)?.days || 1;
                    const canSelect = isSelected || schedule.days.length < maxDays;
                    return (
                      <Tooltip content={t(`day_${dayOption.value.toLowerCase()}`) || dayOption.label}>
                      <button
                        key={dayOption.value}
                        onClick={() => canSelect && toggleDay(dayOption.value)}
                        disabled={!canSelect}
                        style={{
                          padding: '0.75rem 0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: isSelected ? primaryColor : (theme === 'dark' ? '#1f2937' : '#fff'),
                          color: isSelected ? 'white' : (theme === 'dark' ? '#f9fafb' : '#111827'),
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: canSelect ? 'pointer' : 'not-allowed',
                          opacity: canSelect ? 1 : 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          '&:hover': {
                            background: isSelected ? primaryColor : (theme === 'dark' ? '#374151' : '#f9fafb')
                          }
                        }}
                      >
                        {isSelected && getThemedIcon('ui', 'check', 12, 'white')}
                        {dayOption.label}
                      </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              {/* Time & Duration (labels visually hidden to avoid repetition) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'none' }}>
                    {getThemedIcon('ui', 'clock', 16, theme)}
                    {t('start_time') || 'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#f9fafb' : 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'none' }}>{t('duration') || 'Duration (minutes)'}</label>
                  <Select
                    searchable
                    placeholder={t('select_duration') || 'Select Duration'}
                    value={schedule.duration}
                    onChange={(e) => setSchedule({ ...schedule, duration: parseInt(e.target.value) })}
                    options={durationOptions.map(duration => ({ 
                      value: duration, 
                      label: `${duration} minutes` 
                    }))}
                    fullWidth
                  />
                </div>
              </div>

              {/* Holidays */}
              <div style={{ marginBottom: 20, padding: '1rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#92400e' }}>{t('holidays') || 'Holidays'}</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="date"
                    value={newHoliday}
                    onChange={(e) => setNewHoliday(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #f59e0b', borderRadius: 6, fontSize: 13, background: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#f9fafb' : 'inherit' }}
                  />
                  <button onClick={addHoliday} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 6, background: '#f59e0b', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getThemedIcon('ui', 'add', 16, theme)} {t('add') || 'Add'}
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {schedule.holidays.map(date => (
                    <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'white', border: '1px solid #f59e0b', borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>{new Date(date).toLocaleDateString('en-GB')}</span>
                      <button onClick={() => removeHoliday(date)} style={{ padding: '0.25rem', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        {getThemedIcon('ui', 'trash2', 14, theme)}
                      </button>
                    </div>
                  ))}
                  {schedule.holidays.length === 0 && <div style={{ fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>{t('no_holidays_marked') || 'No holidays marked'}</div>}
                </div>
              </div>

              {/* Instructor Absent */}
              <div style={{ marginBottom: 20, padding: '1rem', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 8 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#991b1b' }}>{t('instructor_absent') || 'Instructor Absent Days'}</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="date"
                    value={newAbsent}
                    onChange={(e) => setNewAbsent(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #ef4444', borderRadius: 6, fontSize: 13, background: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#f9fafb' : 'inherit' }}
                  />
                  <button onClick={addAbsent} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 6, background: '#ef4444', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getThemedIcon('ui', 'add', 16, theme)} {t('add') || 'Add'}
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {schedule.instructorAbsent.map(date => (
                    <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'white', border: '1px solid #ef4444', borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>{new Date(date).toLocaleDateString('en-GB')}</span>
                      <button onClick={() => removeAbsent(date)} style={{ padding: '0.25rem', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        {getThemedIcon('ui', 'trash2', 14, theme)}
                      </button>
                    </div>
                  ))}
                  {schedule.instructorAbsent.length === 0 && <div style={{ fontSize: 12, color: '#991b1b', fontStyle: 'italic' }}>{t('no_absent_days_marked') || 'No absent days marked'}</div>}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={saveSchedule}
                disabled={saving || schedule.days.length === 0}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: 'none',
                  borderRadius: 8,
                  background: schedule.days.length === 0 ? '#9ca3af' : primaryColor,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: schedule.days.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {getThemedIcon('ui', 'save', 20, theme)}
                {saving ? (t('saving') || 'Saving...') : (t('save_schedule') || 'Save Schedule')}
              </button>
            </>
          )}
        </div>
      </div>
      ) : (
        /* Semester View - Bird's Eye Overview */
        <div style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: 20, color: theme === 'dark' ? '#f9fafb' : '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getThemedIcon('ui', 'calendar', 24, theme)}
              {t('semester_overview') || 'Semester Overview'}
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: 14, color: 'var(--muted)' }}>
              {t('bird_eye_view_classes') || 'Bird\'s eye view of all classes by semester'} ({filteredClasses.length} {t('total_classes') || 'total classes'})
            </p>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {Object.entries(classesBySemester).map(([semester, semesterClasses]) => (
              <div key={semester} style={{ 
                background: theme === 'dark' ? '#1f2937' : '#fff', 
                border: '1px solid var(--border)', 
                borderRadius: 12, 
                padding: '1rem',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: primaryColor,
                  boxShadow: `0 4px 12px ${primaryColor}20`
                }
              }}>
                {/* Semester Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: primaryColor }}>
                      {semester}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: 12, color: 'var(--muted)' }}>
                      {semesterClasses.length} {t('classes') || 'classes'}
                    </p>
                  </div>
                  <div style={{ 
                    padding: '0.25rem 0.75rem', 
                    background: `${primaryColor}20`, 
                    color: primaryColor, 
                    borderRadius: 20, 
                    fontSize: 12, 
                    fontWeight: 500 
                  }}>
                    {semesterClasses.filter(cls => cls.schedule && cls.schedule.days && cls.schedule.days.length > 0).length} {t('scheduled') || 'scheduled'}
                  </div>
                </div>

                {/* Classes Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: '0.75rem' 
                }}>
                  {semesterClasses.map((cls, index) => {
                    const clsId = cls.docId || cls.id;
                    
                    // Add instructor data to the class object for the ClassCard
                    const clsWithInstructor = {
                      ...cls,
                      instructorData: instructors[cls.ownerEmail] ? {
                        firstName: instructors[cls.ownerEmail].firstName,
                        lastName: instructors[cls.ownerEmail].lastName,
                        displayName: instructors[cls.ownerEmail].displayName,
                        realName: instructors[cls.ownerEmail].realName,
                        email: instructors[cls.ownerEmail].email,
                        messageColor: instructors[cls.ownerEmail].messageColor
                      } : null
                    };
                    
                    return (
                      <ClassCard
                        key={clsId || `semester-${index}`}
                        cls={clsWithInstructor}
                        classStats={classStats}
                        primaryColor={primaryColor}
                        theme={theme}
                        t={t}
                        onViewClass={(classData) => {
                          setSelectedClass(classData);
                          setViewMode('detailed'); // Switch to detailed view when clicking
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(classesBySemester).length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: 'var(--muted)',
              fontSize: 14 
            }}>
              {getThemedIcon('ui', 'calendar', 48, theme)}
              <div style={{ marginTop: '1rem' }}>
                {quickSearch ? (t('no_classes_found_search') || 'No classes found matching your search') : (t('no_classes_found_filters') || 'No classes found for the selected filters')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassSchedulePage;

