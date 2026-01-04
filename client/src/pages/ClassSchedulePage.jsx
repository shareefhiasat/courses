import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getPrograms, getSubjects } from '../firebase/programs';
import { Container, Card, CardBody, Button, Input, Select, Badge, Spinner, useToast } from '../components/ui';
import { Calendar, Clock, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import styles from './ClassSchedulePage.module.css';

const ClassSchedulePage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
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
  const [classSearchTerm, setClassSearchTerm] = useState('');

  const dayOptions = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const frequencyOptions = [
    { value: 'once', label: 'Once a week', days: 1 },
    { value: 'twice', label: 'Twice a week', days: 2 },
    { value: 'thrice', label: 'Three times a week', days: 3 }
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

    // Filter by program
    if (programFilter !== 'all') {
      result = result.filter(cls => {
        if (!cls.subjectId) return false;
        const subject = subjects.find(s => (s.docId || s.id) === cls.subjectId);
        if (!subject) return false;
        return (subject.programId || '') === programFilter;
      });
    }

    // Filter by subject
    if (subjectFilter !== 'all') {
      result = result.filter(cls => {
        return (cls.subjectId || '') === subjectFilter;
      });
    }

    // Filter by class
    if (classFilter !== 'all') {
      result = result.filter(cls => {
        const classId = cls.id || cls.docId;
        return String(classId) === String(classFilter);
      });
    }

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

    // Sort by name
    result.sort((a, b) => (a.name || a.code || '').localeCompare(b.name || b.code || ''));
    
    return result;
  }, [classes, programs, subjects, programFilter, subjectFilter, classFilter, yearFilter, termFilter]);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin && !isInstructor) return;
    loadClasses();
  }, [user, isAdmin, isInstructor]);

  const loadClasses = async () => {
    try {
      const [classesSnap, programsRes, subjectsRes] = await Promise.all([
        getDocs(collection(db, 'classes')),
        getPrograms(),
        getSubjects()
      ]);
      
      const data = classesSnap.docs.map(d => {
        const docData = d.data();
        const docId = d.id;
        return {
          ...docData,
          docId,
          id: docData?.id || docId
        };
      });
      setClasses(data);
      
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);

      const previouslySelectedId = selectedClass?.docId || selectedClass?.id;
      if (previouslySelectedId) {
        const matching = data.find(cls => (cls.docId || cls.id) === previouslySelectedId);
        if (matching) {
          loadSchedule(matching, { skipScroll: true });
        }
      }
    } catch (e) {
      // permission-denied should not spam console
      if (e?.code === 'permission-denied') return;
      console.error('[Schedule] Error loading classes:', e);
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

  const toggleDay = (day) => {
    const maxDays = frequencyOptions.find(f => f.value === schedule.frequency)?.days || 1;
    if (schedule.days.includes(day)) {
      setSchedule({ ...schedule, days: schedule.days.filter(d => d !== day) });
    } else {
      if (schedule.days.length < maxDays) {
        setSchedule({ ...schedule, days: [...schedule.days, day] });
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
      await updateDoc(doc(db, 'classes', cid), {
        schedule: schedule
      });
      toast?.success?.(t('schedule_saved') || 'Schedule saved successfully!');
      await loadClasses();
    } catch (e) {
      console.error('[Schedule] Error saving:', e);
      toast?.error?.((t('schedule_save_failed') || 'Failed to save schedule: ') + (e?.message || 'unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin && !isInstructor) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>This page is only accessible to instructors and admins.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Class List */}
        <div style={{ padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>{t('classes') || 'Classes'} ({filteredClasses.length})</div>
          <div style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
            <Select
              searchable
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Programs' },
                ...programs.map(p => ({
                  value: p.docId || p.id,
                  label: p.name_en || p.name_ar || p.code || p.docId
                }))
              ]}
              fullWidth
              placeholder="Filter by Program"
            />
            <Select
              searchable
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Subjects' },
                ...subjects
                  .filter(s => programFilter === 'all' || s.programId === programFilter)
                  .map(s => ({
                    value: s.docId || s.id,
                    label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`
                  }))
              ]}
              fullWidth
              placeholder="Filter by Subject"
            />
            <Select
              searchable
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Classes' },
                ...classes
                  .filter(c => {
                    if (subjectFilter !== 'all' && c.subjectId !== subjectFilter) return false;
                    if (programFilter !== 'all') {
                      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                      if (!subject || subject.programId !== programFilter) return false;
                    }
                    return true;
                  })
                  .map(c => ({
                    value: c.id || c.docId,
                    label: `${c.name || c.code || 'Unnamed'}${c.code ? ` (${c.code})` : ''}`
                  }))
              ]}
              fullWidth
              placeholder="Filter by Class"
            />
            <Select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              options={[
                { value: 'all', label: t('all_years') || 'All years' },
                ...availableYears.map(year => ({ value: year, label: year }))
              ]}
              fullWidth
              placeholder={t('filter_year') || 'Filter by year'}
            />
            <Select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              options={[
                { value: 'all', label: t('all_terms') || 'All terms' },
                ...availableTerms.map(term => ({ value: term, label: term }))
              ]}
              fullWidth
              placeholder={t('filter_term') || 'Filter by term'}
            />
          </div>
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
                    background: isSelected ? 'rgba(102,126,234,0.12)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cls.name || cls.code}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    {hasSchedule ? `${cls.schedule.frequency} • ${cls.schedule.days.join(', ')}` : 'No schedule'}
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
              <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
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
                        background: schedule.frequency === opt.value ? '#800020' : '#fff',
                        color: schedule.frequency === opt.value ? 'white' : 'inherit',
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
                  {dayOptions.map(day => {
                    const isSelected = schedule.days.includes(day);
                    const maxDays = frequencyOptions.find(f => f.value === schedule.frequency)?.days || 1;
                    const canSelect = isSelected || schedule.days.length < maxDays;
                    return (
                      <button
                        key={day}
                        onClick={() => canSelect && toggleDay(day)}
                        disabled={!canSelect}
                        style={{
                          padding: '0.75rem 0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: isSelected ? '#10b981' : '#fff',
                          color: isSelected ? 'white' : 'inherit',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: canSelect ? 'pointer' : 'not-allowed',
                          opacity: canSelect ? 1 : 0.5
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time & Duration (labels visually hidden to avoid repetition) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'none' }}>
                    <Clock size={16} style={{ display: 'inline', marginRight: 6 }} />
                    {t('start_time') || 'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'none' }}>{t('duration') || 'Duration (minutes)'}</label>
                  <Select
                    searchable
                    value={schedule.duration}
                    onChange={(e) => setSchedule({ ...schedule, duration: parseInt(e.target.value) })}
                    options={durationOptions.map(dur => ({
                      value: dur,
                      label: `${dur} min (${(dur / 60).toFixed(1)} hrs)`
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
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #f59e0b', borderRadius: 6, fontSize: 13 }}
                  />
                  <button onClick={addHoliday} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 6, background: '#f59e0b', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={16} /> Add
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {schedule.holidays.map(date => (
                    <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'white', border: '1px solid #f59e0b', borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>{new Date(date).toLocaleDateString('en-GB')}</span>
                      <button onClick={() => removeHoliday(date)} style={{ padding: '0.25rem', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} />
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
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #ef4444', borderRadius: 6, fontSize: 13 }}
                  />
                  <button onClick={addAbsent} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 6, background: '#ef4444', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={16} /> Add
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {schedule.instructorAbsent.map(date => (
                    <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'white', border: '1px solid #ef4444', borderRadius: 6 }}>
                      <span style={{ fontSize: 13 }}>{new Date(date).toLocaleDateString('en-GB')}</span>
                      <button onClick={() => removeAbsent(date)} style={{ padding: '0.25rem', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} />
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
                <Save size={20} />
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
