import React, { useEffect, useMemo, useState, useCallback } from 'react';
import logger from '@utils/logger';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getAllClasses, updateClassSchedule } from '@services/business/classService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getUserByEmail } from '@services/business/userService';
import { getDayNames, getCurrentLanguage } from '@utils/date';
import { FilterSelect, useToast, Loading } from '@ui';
import ProgramsSelect from '@ui/Select/ProgramsSelect';
import { getThemedIcon } from '@constants/iconTypes';

const ClassSchedulePage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState({}); // Map email -> user data
  const [selectedClass, setSelectedClass] = useState(null);
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
  }, [classes, yearFilter, termFilter, instructors]);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin && !isInstructor) return;
    loadClasses();
  }, [user, isAdmin, isInstructor]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const [classesRes, programsRes, subjectsRes] = await Promise.all([
        getAllClasses(),
        getPrograms(),
        getSubjects()
      ]);
      
      if (classesRes.success) {
        setClasses(classesRes.data);
        
        // Fetch instructor data for all classes
        const instructorEmails = [...new Set(classesRes.data.map(cls => cls.ownerEmail).filter(Boolean))];
        const instructorPromises = instructorEmails.map(async (email) => {
          try {
            const userRes = await getUserByEmail(email);
            return { email, data: userRes.success ? userRes.data : null };
          } catch (error) {
            console.warn(`Failed to fetch instructor for email: ${email}`, error);
            return { email, data: null };
          }
        });
        
        const instructorResults = await Promise.all(instructorPromises);
        const instructorMap = {};
        instructorResults.forEach(({ email, data }) => {
          if (data) {
            instructorMap[email] = data;
          }
        });
        setInstructors(instructorMap);
      } else {
        throw new Error(classesRes.error);
      }
      
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);

      const previouslySelectedId = selectedClass?.docId || selectedClass?.id;
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
      setLoading(false);
    }
  };

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
      <Loading 
        variant="overlay" 
        fullscreen 
        message={t('loading_class_schedules') || 'Loading class schedules...'} 
        fancyVariant="dots" 
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
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 12, 
          alignItems: 'center' 
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
            style={{ minWidth: '300px', flex: 1 }}
          />
          <FilterSelect
            filterKey="years"
            value={yearFilter}
            onChange={setYearFilter}
            data={availableYears}
            additionalPlaceholderText={t('all_years') || 'All years'}
          />
          <FilterSelect
            filterKey="terms"
            value={termFilter}
            onChange={setTermFilter}
            data={availableTerms}
            additionalPlaceholderText={t('all_terms') || 'All terms'}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Class List */}
        <div style={{ padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>{t('classes') || 'Classes'} ({filteredClasses.length})</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {filteredClasses.map((cls, index) => {
              const currentId = selectedClass?.docId || selectedClass?.id;
              const clsId = cls.docId || cls.id;
              const isSelected = currentId === clsId;
              const hasSchedule = cls.schedule && cls.schedule.days && cls.schedule.days.length > 0;
              return (
                <div
                  key={clsId || `class-${index}`}
                  onClick={() => loadSchedule(cls)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: isSelected ? 'rgba(102,126,234,0.12)' : (theme === 'dark' ? '#1f2937' : '#fff'),
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cls.name || cls.code}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {cls.term && <span>{cls.term}</span>}
                    {cls.year && !cls.term && <span>Year {cls.year}</span>}
                  </div>
                  {cls.ownerEmail && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {instructors[cls.ownerEmail] 
                        ? (instructors[cls.ownerEmail].realName || instructors[cls.ownerEmail].displayName || instructors[cls.ownerEmail].email)
                        : `Loading... (${cls.ownerEmail})`
                      }
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {hasSchedule ? `${cls.schedule.frequency} • ${cls.schedule.days.map(day => {
                    const dayOption = dayOptions.find(d => d.value === day);
                    return dayOption ? dayOption.label : day;
                  }).join(', ')}` : (t('no_schedule') || 'No schedule')}
                  </div>
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
              <div>{t('select_class') || 'Select a class to configure schedule'}</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{selectedClass.name || selectedClass.code}</h2>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {selectedClass.term && `Term: ${selectedClass.term}`}
                  {selectedClass.year && ` • Year: ${selectedClass.year}`}
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
                        background: schedule.frequency === opt.value ? '#800020' : (theme === 'dark' ? '#1f2937' : '#fff'),
                        color: schedule.frequency === opt.value ? 'white' : (theme === 'dark' ? '#f9fafb' : 'inherit'),
                        fontWeight: 600,
                        cursor: 'pointer'
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
                      <button
                        key={dayOption.value}
                        onClick={() => canSelect && toggleDay(dayOption.value)}
                        disabled={!canSelect}
                        style={{
                          padding: '0.75rem 0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: isSelected ? '#10b981' : (theme === 'dark' ? '#1f2937' : '#fff'),
                          color: isSelected ? 'white' : (theme === 'dark' ? '#f9fafb' : 'inherit'),
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: canSelect ? 'pointer' : 'not-allowed',
                          opacity: canSelect ? 1 : 0.5
                        }}
                      >
                        {dayOption.label}
                      </button>
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
                  <FilterSelect
                    filterKey="duration"
                    value={schedule.duration}
                    onChange={(value) => setSchedule({ ...schedule, duration: parseInt(value) })}
                    data={durationOptions}
                    additionalPlaceholderText={t('select_duration') || 'Select Duration'}
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
                    {getThemedIcon('ui', 'add', 16, theme)} Add
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
                  {schedule.holidays.length === 0 && <div style={{ fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>No holidays marked</div>}
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
                    {getThemedIcon('ui', 'add', 16, theme)} Add
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
                  {schedule.instructorAbsent.length === 0 && <div style={{ fontSize: 12, color: '#991b1b', fontStyle: 'italic' }}>No absent days marked</div>}
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
                  background: schedule.days.length === 0 ? '#9ca3af' : '#16a34a',
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
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassSchedulePage;

