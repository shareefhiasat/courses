import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Calendar, Clock, Plus, Trash2, Save } from 'lucide-react';

const ClassSchedulePage = () => {
  const { user, isAdmin, isInstructor } = useAuth();
  const { t } = useLang();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
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

  const dayOptions = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const frequencyOptions = [
    { value: 'once', label: 'Once a week', days: 1 },
    { value: 'twice', label: 'Twice a week', days: 2 },
    { value: 'thrice', label: 'Three times a week', days: 3 }
  ];
  const durationOptions = [60, 75, 90, 105, 120, 135, 150, 180];

  useEffect(() => {
    if (!user) return;
    if (!isAdmin && !isInstructor) return;
    loadClasses();
  }, [user, isAdmin, isInstructor]);

  const loadClasses = async () => {
    try {
      const snap = await getDocs(collection(db, 'classes'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(data);
    } catch (e) {
      // permission-denied should not spam console
      if (e?.code === 'permission-denied') return;
      console.error('[Schedule] Error loading classes:', e);
    }
  };

  const loadSchedule = (classData) => {
    setSelectedClass(classData);
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
    if (!selectedClass) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'classes', selectedClass.id), {
        schedule: schedule
      });
      alert('Schedule saved successfully!');
      await loadClasses();
    } catch (e) {
      console.error('[Schedule] Error saving:', e);
      alert('Failed to save: ' + (e?.message || 'unknown error'));
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
      <h1 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Calendar size={28} />
        {t('class_schedules') || 'Class Schedules'}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Class List */}
        <div style={{ padding: '1rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('classes') || 'Classes'} ({classes.length})</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {classes.map(cls => {
              const isSelected = selectedClass?.id === cls.id;
              const hasSchedule = cls.schedule && cls.schedule.days && cls.schedule.days.length > 0;
              return (
                <div
                  key={cls.id}
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

              {/* Frequency */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('frequency') || 'Frequency'}</label>
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

              {/* Days */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
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

              {/* Time & Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
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
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('duration') || 'Duration (minutes)'}</label>
                  <select
                    value={schedule.duration}
                    onChange={(e) => setSchedule({ ...schedule, duration: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
                  >
                    {durationOptions.map(dur => (
                      <option key={dur} value={dur}>{dur} min ({(dur / 60).toFixed(1)} hrs)</option>
                    ))}
                  </select>
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
                  background: schedule.days.length === 0 ? '#9ca3af' : '#800020',
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
