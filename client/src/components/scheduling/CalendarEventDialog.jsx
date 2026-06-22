import React, { useState, useEffect, useMemo } from 'react';
import { X, Coffee, Umbrella, Trash2, AlertCircle } from 'lucide-react';
import { Select, Input } from '@ui';
import SchedulingRecurrencePanel from '../SchedulingRecurrencePanel.jsx';
import { getLocalizedName } from '../../utils/languageHelpers.js';

const BREAK_TYPES = [
  { value: 'TeaBreak', labelEn: 'Tea Break', labelAr: 'استراحة شاي' },
  { value: 'PrayerBreak', labelEn: 'Prayer Break', labelAr: 'استراحة صلاة' },
  { value: 'LunchBreak', labelEn: 'Lunch Break', labelAr: 'استراحة غداء' },
  { value: 'Other', labelEn: 'Other', labelAr: 'أخرى' },
];

const HOLIDAY_TYPES = [
  { value: 'Public', labelEn: 'Public Holiday', labelAr: 'عطلة عامة' },
  { value: 'National', labelEn: 'National Day', labelAr: 'يوم وطني' },
  { value: 'SemesterBreak', labelEn: 'Semester Break', labelAr: 'عطلة فصلية' },
  { value: 'Summer', labelEn: 'Summer Break', labelAr: 'عطلة صيفية' },
  { value: 'Winter', labelEn: 'Winter Break', labelAr: 'عطلة شتوية' },
  { value: 'Other', labelEn: 'Other', labelAr: 'أخرى' },
];

const localDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function CalendarEventDialog({
  open,
  mode = 'create',
  eventType = 'break',
  event = null,
  initialStart,
  initialEnd,
  programs = [],
  instructors = [],
  classrooms = [],
  timeSlots = [],
  user = null,
  theme,
  t,
  lang,
  onClose,
  onSave,
  onDelete,
  existingSessions = [],
}) {
  const isEdit = mode === 'edit';
  const isBreak = eventType === 'break';
  const isHoliday = eventType === 'holiday';

  const [selectedEventType, setSelectedEventType] = useState(eventType);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(null);
  const [recurrenceCount, setRecurrenceCount] = useState(null);
  const [recurrenceEndMode, setRecurrenceEndMode] = useState('date');
  const [scope, setScope] = useState('single');

  // Break fields
  const [breakProgramId, setBreakProgramId] = useState('');
  const [breakInstructorId, setBreakInstructorId] = useState('');
  const [breakClassroomId, setBreakClassroomId] = useState('');
  const [breakTimeSlotId, setBreakTimeSlotId] = useState('');
  const [breakDate, setBreakDate] = useState('');
  const [breakStartTime, setBreakStartTime] = useState('');
  const [breakEndTime, setBreakEndTime] = useState('');
  const [breakType, setBreakType] = useState('TeaBreak');
  const [breakDescriptionEn, setBreakDescriptionEn] = useState('');
  const [breakDescriptionAr, setBreakDescriptionAr] = useState('');
  const [breakNotes, setBreakNotes] = useState('');

  // Holiday fields
  const [holidayProgramId, setHolidayProgramId] = useState('');
  const [holidayDescriptionEn, setHolidayDescriptionEn] = useState('');
  const [holidayDescriptionAr, setHolidayDescriptionAr] = useState('');
  const [holidayType, setHolidayType] = useState('Public');
  const [holidayStartDate, setHolidayStartDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');

  useEffect(() => {
    setSelectedEventType(eventType);
  }, [eventType]);

  useEffect(() => {
    if (isBreak) {
      const start = initialStart ? new Date(initialStart) : new Date();
      setBreakDate(localDate(start));
      if (isEdit && event) {
        setBreakProgramId(event.programId ? String(event.programId) : '');
        setBreakInstructorId(event.instructorUserId ? String(event.instructorUserId) : '');
        setBreakClassroomId(event.classroomId ? String(event.classroomId) : '');
        setBreakTimeSlotId(event.timeSlotId ? String(event.timeSlotId) : '');
        setBreakType(event.breakType || 'TeaBreak');
        setBreakDescriptionEn(event.descriptionEn || '');
        setBreakDescriptionAr(event.descriptionAr || '');
        setBreakNotes(event.notes || '');
        setIsRecurring(event.isRecurring || false);
        // Set time fields from the time slot or initialStart/initialEnd
        if (event.timeSlot) {
          setBreakStartTime(event.timeSlot.startTime || '');
          setBreakEndTime(event.timeSlot.endTime || '');
        } else if (initialStart && initialEnd) {
          const s = new Date(initialStart);
          const e = new Date(initialEnd);
          setBreakStartTime(`${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`);
          setBreakEndTime(`${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`);
        }
      } else if (!isEdit && timeSlots.length > 0) {
        const slot = timeSlots.find((s) => {
          const [sh, sm] = s.startTime.split(':').map(Number);
          const startH = start.getHours();
          const startM = start.getMinutes();
          return sh === startH && sm === startM;
        }) || timeSlots[0];
        setBreakTimeSlotId(String(slot.id));
        setBreakStartTime(slot.startTime || '');
        setBreakEndTime(slot.endTime || '');
      }
    }
  }, [isBreak, isEdit, event, initialStart, timeSlots]);

  useEffect(() => {
    if (isHoliday) {
      const start = initialStart ? new Date(initialStart) : new Date();
      const end = initialEnd ? new Date(initialEnd) : new Date(start);
      setHolidayStartDate(localDate(start));
      setHolidayEndDate(localDate(end));
      if (isEdit && event) {
        setHolidayProgramId(event.programId ? String(event.programId) : '');
        setHolidayDescriptionEn(event.descriptionEn || '');
        setHolidayDescriptionAr(event.descriptionAr || '');
        setHolidayType(event.type || 'Public');
        setHolidayStartDate(localDate(event.startDate));
        setHolidayEndDate(localDate(event.endDate));
        setIsRecurring(event.isRecurring || false);
      }
    }
  }, [isHoliday, isEdit, event, initialStart, initialEnd]);

  useEffect(() => {
    if (isRecurring && !isEdit && !recurrenceEndDate && !recurrenceCount) {
      const end = new Date(breakDate || holidayStartDate || new Date());
      end.setMonth(end.getMonth() + 1);
      setRecurrenceEndDate(end);
    }
  }, [isRecurring, isEdit, recurrenceEndDate, recurrenceCount, breakDate, holidayStartDate]);

  const validationErrors = useMemo(() => {
    const errors = {};
    if (selectedEventType === 'break') {
      if (!breakProgramId) errors.breakProgramId = true;
      if (!breakTimeSlotId) errors.breakTimeSlotId = true;
      if (!breakDate) errors.breakDate = true;
    }
    if (selectedEventType === 'holiday') {
      if (!holidayDescriptionEn) errors.holidayDescriptionEn = true;
      if (!holidayStartDate) errors.holidayStartDate = true;
      if (!holidayEndDate) errors.holidayEndDate = true;
    }
    return errors;
  }, [selectedEventType, breakProgramId, breakTimeSlotId, breakDate, holidayDescriptionEn, holidayStartDate, holidayEndDate]);

  const isValid = useMemo(() => {
    return Object.keys(validationErrors).length === 0;
  }, [validationErrors]);

  const breakConflicts = useMemo(() => {
    if (selectedEventType !== 'break' || !breakDate || !breakTimeSlotId || !breakProgramId) return [];
    const slot = timeSlots.find((s) => String(s.id) === String(breakTimeSlotId));
    if (!slot) return [];
    
    const breakStart = new Date(breakDate);
    const breakEnd = new Date(breakDate);
    const [sh, sm] = (breakStartTime || slot.startTime).split(':').map(Number);
    const [eh, em] = (breakEndTime || slot.endTime).split(':').map(Number);
    breakStart.setHours(sh, sm, 0, 0);
    breakEnd.setHours(eh, em, 0, 0);
    
    const selectedProgramId = parseInt(breakProgramId, 10);
    
    return existingSessions.filter((session) => {
      // Only check conflicts for the same program
      if (session.class?.programId !== selectedProgramId) return false;
      
      const sessionStart = new Date(session.startDateTime);
      const sessionEnd = new Date(session.endDateTime);
      return sessionStart < breakEnd && sessionEnd > breakStart;
    });
  }, [selectedEventType, breakDate, breakTimeSlotId, breakProgramId, breakStartTime, breakEndTime, timeSlots, existingSessions]);

  const holidayConflicts = useMemo(() => {
    if (selectedEventType !== 'holiday' || !holidayStartDate || !holidayEndDate) return [];
    const start = new Date(holidayStartDate);
    const end = new Date(holidayEndDate);
    end.setHours(23, 59, 59, 999);

    return existingSessions.filter((session) => {
      const sessionStart = new Date(session.startDateTime);
      const sessionEnd = new Date(session.endDateTime);
      return sessionStart <= end && sessionEnd >= start;
    });
  }, [selectedEventType, holidayStartDate, holidayEndDate, existingSessions]);

  if (!open) return null;

  const handleSave = () => {
    console.log('[CalendarEventDialog] handleSave called', { selectedEventType, mode, isEdit });
    if (selectedEventType === 'break') {
      const start = new Date(breakDate);
      const slot = timeSlots.find((s) => String(s.id) === String(breakTimeSlotId));
      // Use custom time fields if set, otherwise fall back to slot times
      const timeToUse = breakStartTime || (slot ? slot.startTime : '09:00');
      const [sh, sm] = timeToUse.split(':').map(Number);
      start.setUTCHours(sh, sm, 0, 0);
      // Check if custom times differ from the selected slot's times
      const customTimesChanged = slot && (breakStartTime !== slot.startTime || breakEndTime !== slot.endTime);
      const payload = {
        programId: breakProgramId ? parseInt(breakProgramId, 10) : undefined,
        instructorUserId: breakInstructorId ? parseInt(breakInstructorId, 10) : null,
        classroomId: breakClassroomId ? parseInt(breakClassroomId, 10) : null,
        timeSlotId: breakTimeSlotId ? parseInt(breakTimeSlotId, 10) : undefined,
        date: start.toISOString(),
        breakType: breakType,
        descriptionEn: breakDescriptionEn || null,
        descriptionAr: breakDescriptionAr || null,
        notes: breakNotes,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        recurrenceDays: isRecurring ? recurrenceDays : null,
        recurrenceEndDate: isRecurring ? recurrenceEndDate : null,
        recurrenceCount: isRecurring ? recurrenceCount : null,
        updateScope: scope,
        updatedBy: user?.dbId,
        ...(customTimesChanged && {
          customStartTime: breakStartTime,
          customEndTime: breakEndTime,
        }),
      };
      console.log('[CalendarEventDialog] Sending break payload:', payload);
      onSave({ eventType: 'break', mode, payload, event });
    } else if (selectedEventType === 'holiday') {
      const start = new Date(holidayStartDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(holidayEndDate);
      end.setUTCHours(23, 59, 59, 999);
      const payload = {
        programId: holidayProgramId ? parseInt(holidayProgramId, 10) : null,
        descriptionEn: holidayDescriptionEn,
        descriptionAr: holidayDescriptionAr || null,
        type: holidayType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        recurrenceDays: isRecurring ? recurrenceDays : null,
        recurrenceEndDate: isRecurring ? recurrenceEndDate : null,
        recurrenceCount: isRecurring ? recurrenceCount : null,
        updateScope: scope,
        updatedBy: user?.dbId,
      };
      console.log('[CalendarEventDialog] Sending holiday payload:', payload);
      console.log('[CalendarEventDialog] Holiday date range:', { start: start.toISOString(), end: end.toISOString() });
      onSave({ eventType: 'holiday', mode, payload, event });
    }
  };

  const handleDelete = (deleteScope = 'single') => {
    onDelete({ eventType: selectedEventType, event, deleteScope });
  };

  const bg = theme === 'dark' ? '#1f2937' : '#ffffff';
  const border = theme === 'dark' ? '#4b5563' : '#e5e7eb';
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const text = theme === 'dark' ? '#f3f4f6' : '#1f2937';
  const inputBg = theme === 'dark' ? '#374151' : '#ffffff';

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '0.75rem',
  };

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: text,
  };

  const errorStyle = {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const inputStyle = {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: `1px solid ${border}`,
    backgroundColor: inputBg,
    color: text,
    fontSize: '0.875rem',
  };

  const buttonStyle = (variant = 'primary') => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    backgroundColor: variant === 'primary' ? '#3b82f6' : variant === 'danger' ? '#ef4444' : theme === 'dark' ? '#374151' : '#f3f4f6',
    color: ['primary', 'danger'].includes(variant) ? '#ffffff' : text,
  });

  return (
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
      padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: bg,
        borderRadius: '0.5rem',
        padding: '1.5rem',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: text }}>
            {isEdit ? t('edit_event') : t('create_event')}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color={muted} />
          </button>
        </div>

        {/* Event type selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {[['break', Coffee, 'break'], ['holiday', Umbrella, 'holiday']].map(([type, Icon, label]) => {
            const selected = selectedEventType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  if (!isEdit) setSelectedEventType(type);
                }}
                disabled={isEdit}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${border}`,
                  backgroundColor: selected ? (type === 'break' ? '#f59e0b' : '#ef4444') : inputBg,
                  color: selected ? '#ffffff' : text,
                  cursor: isEdit ? 'not-allowed' : 'pointer',
                  opacity: isEdit ? 0.7 : 1,
                }}
              >
                <Icon size={16} />
                <span>{t(label)}</span>
              </button>
            );
          })}
        </div>

        {selectedEventType === 'break' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('program')} <span style={{ color: '#ef4444' }}>*</span></label>
                <Select
                  value={breakProgramId}
                  onChange={(e) => setBreakProgramId(e.target.value)}
                  theme={theme}
                  options={[
                    { value: '', label: t('select_program') },
                    ...programs.map((p) => ({ value: String(p.id), label: getLocalizedName(p, lang) || p.code }))
                  ]}
                />
                {validationErrors.breakProgramId && (
                  <div style={errorStyle}>
                    <AlertCircle size={12} />
                    {t('required')}
                  </div>
                )}
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('break_type')}</label>
                <Select
                  value={breakType}
                  onChange={(e) => setBreakType(e.target.value)}
                  theme={theme}
                  options={BREAK_TYPES.map((bt) => ({
                    value: bt.value,
                    label: lang === 'ar' ? bt.labelAr : bt.labelEn
                  }))}
                />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('description_en')}</label>
              <Input
                type="text"
                value={breakDescriptionEn}
                onChange={(e) => setBreakDescriptionEn(e.target.value)}
                placeholder={t('description_en')}
                theme={theme}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('description_ar')}</label>
              <Input
                type="text"
                value={breakDescriptionAr}
                onChange={(e) => setBreakDescriptionAr(e.target.value)}
                placeholder={t('description_ar')}
                theme={theme}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('time_slot')} <span style={{ color: '#ef4444' }}>*</span></label>
              <Select
                value={breakTimeSlotId}
                onChange={(e) => {
                  setBreakTimeSlotId(e.target.value);
                  const slot = timeSlots.find((ts) => String(ts.id) === e.target.value);
                  if (slot) {
                    setBreakStartTime(slot.startTime);
                    setBreakEndTime(slot.endTime);
                  }
                }}
                theme={theme}
                options={[
                  { value: '', label: t('select_time_slot') },
                  ...timeSlots.map((ts) => ({
                    value: String(ts.id),
                    label: ts.labelEn || ts.labelAr || `${ts.startTime} - ${ts.endTime}`
                  }))
                ]}
              />
              {validationErrors.breakTimeSlotId && (
                <div style={errorStyle}>
                  <AlertCircle size={12} />
                  {t('required')}
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('start_time')}</label>
                <Input
                  type="time"
                  value={breakStartTime}
                  onChange={(e) => setBreakStartTime(e.target.value)}
                  theme={theme}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('end_time')}</label>
                <Input
                  type="time"
                  value={breakEndTime}
                  onChange={(e) => setBreakEndTime(e.target.value)}
                  theme={theme}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('date')} <span style={{ color: '#ef4444' }}>*</span></label>
                <Input
                  type="date"
                  value={breakDate}
                  onChange={(e) => setBreakDate(e.target.value)}
                  theme={theme}
                />
                {validationErrors.breakDate && (
                  <div style={errorStyle}>
                    <AlertCircle size={12} />
                    {t('required')}
                  </div>
                )}
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('classroom')}</label>
                <Select
                  value={breakClassroomId}
                  onChange={(e) => setBreakClassroomId(e.target.value)}
                  theme={theme}
                  options={[
                    { value: '', label: t('optional') },
                    ...classrooms.map((c) => ({ value: String(c.id), label: c.nameEn || c.code }))
                  ]}
                />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('instructor')}</label>
              <Select
                value={breakInstructorId}
                onChange={(e) => setBreakInstructorId(e.target.value)}
                theme={theme}
                options={[
                  { value: '', label: t('optional') },
                  ...instructors.map((i) => ({ value: String(i.id), label: i.displayName || i.email || i.id }))
                ]}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('notes')}</label>
              <Input
                type="text"
                value={breakNotes}
                onChange={(e) => setBreakNotes(e.target.value)}
                placeholder={t('notes')}
                theme={theme}
              />
            </div>

            {breakConflicts.length > 0 && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
                borderRadius: '0.375rem',
                border: `1px solid ${theme === 'dark' ? '#991b1b' : '#fecaca'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <AlertCircle size={16} color={theme === 'dark' ? '#fca5a5' : '#991b1b'} />
                  <span style={{ fontWeight: '600', color: theme === 'dark' ? '#fca5a5' : '#991b1b' }}>
                    {t('scheduling_conflicts_title')}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: theme === 'dark' ? '#fca5a5' : '#991b1b' }}>
                  {breakConflicts.length} {t('session')}{breakConflicts.length === 1 ? '' : 's'} {t('for_same_program')} {t('on_selected_date_time')}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: theme === 'dark' ? '#fca5a5' : '#991b1b' }}>
                  {t('break_conflict_warning')}
                </div>
              </div>
            )}
          </>
        )}

        {selectedEventType === 'holiday' && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('description_en')} <span style={{ color: '#ef4444' }}>*</span></label>
              <Input
                type="text"
                value={holidayDescriptionEn}
                onChange={(e) => setHolidayDescriptionEn(e.target.value)}
                placeholder={t('description_en')}
                theme={theme}
              />
              {validationErrors.holidayDescriptionEn && (
                <div style={errorStyle}>
                  <AlertCircle size={12} />
                  {t('required')}
                </div>
              )}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('description_ar')}</label>
              <Input
                type="text"
                value={holidayDescriptionAr}
                onChange={(e) => setHolidayDescriptionAr(e.target.value)}
                placeholder={t('description_ar')}
                theme={theme}
                dir="rtl"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('holiday_type')}</label>
                <Select
                  value={holidayType}
                  onChange={(e) => setHolidayType(e.target.value)}
                  theme={theme}
                  options={HOLIDAY_TYPES.map((ht) => ({
                    value: ht.value,
                    label: lang === 'ar' ? ht.labelAr : ht.labelEn
                  }))}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('program')}</label>
                <Select
                  value={holidayProgramId}
                  onChange={(e) => setHolidayProgramId(e.target.value)}
                  theme={theme}
                  options={[
                    { value: '', label: t('global') },
                    ...programs.map((p) => ({ value: String(p.id), label: getLocalizedName(p, lang) || p.code }))
                  ]}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('start_date')} <span style={{ color: '#ef4444' }}>*</span></label>
                <Input
                  type="date"
                  value={holidayStartDate}
                  onChange={(e) => setHolidayStartDate(e.target.value)}
                  theme={theme}
                />
                {validationErrors.holidayStartDate && (
                  <div style={errorStyle}>
                    <AlertCircle size={12} />
                    {t('required')}
                  </div>
                )}
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('end_date')} <span style={{ color: '#ef4444' }}>*</span></label>
                <Input
                  type="date"
                  value={holidayEndDate}
                  onChange={(e) => setHolidayEndDate(e.target.value)}
                  theme={theme}
                />
                {validationErrors.holidayEndDate && (
                  <div style={errorStyle}>
                    <AlertCircle size={12} />
                    {t('required')}
                  </div>
                )}
              </div>
            </div>

            {holidayConflicts.length > 0 && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
                border: `1px solid ${theme === 'dark' ? '#dc2626' : '#fecaca'}`,
                borderRadius: '0.375rem',
                marginTop: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <AlertCircle size={16} color={theme === 'dark' ? '#fca5a5' : '#dc2626'} />
                  <span style={{ fontWeight: 600, color: theme === 'dark' ? '#fca5a5' : '#dc2626', fontSize: '0.875rem' }}>
                    {t('holiday_conflict_warning')}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: theme === 'dark' ? '#fca5a5' : '#991b1b' }}>
                  {holidayConflicts.length} {t('session')} {holidayConflicts.length === 1 ? t('exists') : t('exist')} {t('on_selected_dates')}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: theme === 'dark' ? '#fca5a5' : '#991b1b' }}>
                  {t('holiday_conflict_proceed_warning')}
                </div>
              </div>
            )}
          </>
        )}

        <SchedulingRecurrencePanel
          isRecurring={isRecurring}
          onRecurringChange={setIsRecurring}
          recurrenceType={recurrenceType}
          onRecurrenceTypeChange={setRecurrenceType}
          recurrenceDays={recurrenceDays}
          onRecurrenceDaysChange={setRecurrenceDays}
          recurrenceEndMode={recurrenceEndMode}
          onRecurrenceEndModeChange={setRecurrenceEndMode}
          recurrenceEndDate={recurrenceEndDate}
          onRecurrenceEndDateChange={setRecurrenceEndDate}
          recurrenceCount={recurrenceCount}
          onRecurrenceCountChange={setRecurrenceCount}
          timesPerDay={[]}
          onTimesPerDayChange={() => {}}
          modalStartDateTime={isBreak ? new Date(breakDate) : new Date(holidayStartDate)}
          modalEndDateTime={isBreak ? new Date(breakDate) : new Date(holidayEndDate)}
          theme={theme}
          t={t}
        />

        {isEdit && event && (
          <div style={fieldStyle}>
            <label style={labelStyle}>{t('update_scope')}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['single', 'series'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${border}`,
                    backgroundColor: scope === s ? '#3b82f6' : inputBg,
                    color: scope === s ? '#ffffff' : text,
                    cursor: 'pointer',
                  }}
                >
                  {t(s)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
          {isEdit && (
            <button
              type="button"
              style={buttonStyle('danger')}
              onClick={() => handleDelete(scope)}
            >
              <Trash2 size={16} style={{ marginInlineEnd: '0.35rem' }} />
              {t('delete')}
            </button>
          )}
          <button type="button" style={buttonStyle('secondary')} onClick={onClose}>{t('cancel')}</button>
          <button type="button" style={buttonStyle('primary')} disabled={!isValid} onClick={handleSave}>
            {isEdit ? t('save') : t('create')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalendarEventDialog;
