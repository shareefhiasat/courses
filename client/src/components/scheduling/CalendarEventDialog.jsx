import React, { useState, useEffect, useMemo } from 'react';
import { X, Coffee, Umbrella, Trash2 } from 'lucide-react';
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
  const [breakType, setBreakType] = useState('TeaBreak');
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
        setBreakNotes(event.notes || '');
        setIsRecurring(event.isRecurring || false);
      } else if (!isEdit && timeSlots.length > 0) {
        const slot = timeSlots.find((s) => {
          const [sh, sm] = s.startTime.split(':').map(Number);
          const startH = start.getHours();
          const startM = start.getMinutes();
          return sh === startH && sm === startM;
        }) || timeSlots[0];
        setBreakTimeSlotId(String(slot.id));
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

  const isValid = useMemo(() => {
    if (selectedEventType === 'break') {
      return breakProgramId && breakTimeSlotId && breakDate;
    }
    if (selectedEventType === 'holiday') {
      return holidayDescriptionEn && holidayStartDate && holidayEndDate;
    }
    return false;
  }, [selectedEventType, breakProgramId, breakTimeSlotId, breakDate, holidayDescriptionEn, holidayStartDate, holidayEndDate]);

  if (!open) return null;

  const handleSave = () => {
    if (selectedEventType === 'break') {
      const start = new Date(breakDate);
      const slot = timeSlots.find((s) => String(s.id) === String(breakTimeSlotId));
      if (slot) {
        const [sh, sm] = slot.startTime.split(':').map(Number);
        start.setHours(sh, sm, 0, 0);
      }
      const payload = {
        programId: breakProgramId ? parseInt(breakProgramId, 10) : undefined,
        instructorUserId: breakInstructorId ? parseInt(breakInstructorId, 10) : null,
        classroomId: breakClassroomId ? parseInt(breakClassroomId, 10) : null,
        timeSlotId: breakTimeSlotId ? parseInt(breakTimeSlotId, 10) : undefined,
        date: start.toISOString(),
        breakType: breakType,
        notes: breakNotes,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        recurrenceDays: isRecurring ? recurrenceDays : null,
        recurrenceEndDate: isRecurring ? recurrenceEndDate : null,
        recurrenceCount: isRecurring ? recurrenceCount : null,
        updateScope: scope,
        updatedBy: user?.dbId,
      };
      onSave({ eventType: 'break', mode, payload, event });
    } else if (selectedEventType === 'holiday') {
      const start = new Date(holidayStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(holidayEndDate);
      end.setHours(23, 59, 59, 999);
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
                <label style={labelStyle}>{t('program')}</label>
                <select
                  style={inputStyle}
                  value={breakProgramId}
                  onChange={(e) => setBreakProgramId(e.target.value)}
                >
                  <option value="">{t('select_program')}</option>
                  {programs.map((p) => (
                    <option key={p.id} value={String(p.id)}>{getLocalizedName(p, lang) || p.code}</option>
                  ))}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('break_type')}</label>
                <select
                  style={inputStyle}
                  value={breakType}
                  onChange={(e) => setBreakType(e.target.value)}
                >
                  {BREAK_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value}>{lang === 'ar' ? bt.labelAr : bt.labelEn}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('time_slot')}</label>
              <select
                style={inputStyle}
                value={breakTimeSlotId}
                onChange={(e) => setBreakTimeSlotId(e.target.value)}
              >
                <option value="">{t('select_time_slot')}</option>
                {timeSlots.map((ts) => (
                  <option key={ts.id} value={String(ts.id)}>
                    {ts.labelEn || ts.labelAr || `${ts.startTime} - ${ts.endTime}`}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('date')}</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={breakDate}
                  onChange={(e) => setBreakDate(e.target.value)}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('classroom')}</label>
                <select
                  style={inputStyle}
                  value={breakClassroomId}
                  onChange={(e) => setBreakClassroomId(e.target.value)}
                >
                  <option value="">{t('optional')}</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.nameEn || c.code}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('instructor')}</label>
              <select
                style={inputStyle}
                value={breakInstructorId}
                onChange={(e) => setBreakInstructorId(e.target.value)}
              >
                <option value="">{t('optional')}</option>
                {instructors.map((i) => (
                  <option key={i.id} value={String(i.id)}>{i.displayName || i.email || i.id}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('notes')}</label>
              <input
                type="text"
                style={inputStyle}
                value={breakNotes}
                onChange={(e) => setBreakNotes(e.target.value)}
                placeholder={t('notes')}
              />
            </div>
          </>
        )}

        {selectedEventType === 'holiday' && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('description_en')}</label>
              <input
                type="text"
                style={inputStyle}
                value={holidayDescriptionEn}
                onChange={(e) => setHolidayDescriptionEn(e.target.value)}
                placeholder={t('description_en')}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('description_ar')}</label>
              <input
                type="text"
                style={inputStyle}
                value={holidayDescriptionAr}
                onChange={(e) => setHolidayDescriptionAr(e.target.value)}
                placeholder={t('description_ar')}
                dir="rtl"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('holiday_type')}</label>
                <select
                  style={inputStyle}
                  value={holidayType}
                  onChange={(e) => setHolidayType(e.target.value)}
                >
                  {HOLIDAY_TYPES.map((ht) => (
                    <option key={ht.value} value={ht.value}>{lang === 'ar' ? ht.labelAr : ht.labelEn}</option>
                  ))}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('program')}</label>
                <select
                  style={inputStyle}
                  value={holidayProgramId}
                  onChange={(e) => setHolidayProgramId(e.target.value)}
                >
                  <option value="">{t('global')}</option>
                  {programs.map((p) => (
                    <option key={p.id} value={String(p.id)}>{getLocalizedName(p, lang) || p.code}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('start_date')}</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={holidayStartDate}
                  onChange={(e) => setHolidayStartDate(e.target.value)}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('end_date')}</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={holidayEndDate}
                  onChange={(e) => setHolidayEndDate(e.target.value)}
                />
              </div>
            </div>
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
