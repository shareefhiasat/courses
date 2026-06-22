import React from 'react';
import { Select, Input, UserSelect } from '@ui';
import { X } from 'lucide-react';
import SchedulingAvailabilityPanel from '../SchedulingAvailabilityPanel.jsx';
import SchedulingRecurrencePanel from '../SchedulingRecurrencePanel.jsx';
import {
  getLocalizedClassName,
  getLocalizedSubjectName,
  getLocalizedInstructorName,
  getClassroomById,
  formatClassroomOptionLabel,
  formatClassroomDetails,
  getLocalizedClassroomStatus,
  toDatetimeLocalValue,
} from '../../utils/schedulingDisplayUtils.js';
import { getLocalizedName } from '../../utils/languageHelpers.js';

function SessionEventDialog({
  open,
  mode,
  classItem,
  startDateTime,
  endDateTime,
  instructorEmail,
  instructorId,
  classroomId,
  isRecurring,
  recurrenceType,
  recurrenceDays,
  recurrenceEndDate,
  recurrenceCount,
  recurrenceEndMode,
  timesPerDay,
  validationResult,
  subjects,
  programs,
  instructors,
  filteredInstructorUsers,
  classes,
  classrooms,
  enrollments,
  instructorAvailabilities,
  classroomAvailabilities,
  theme,
  t,
  lang,
  onClose,
  onStartChange,
  onEndChange,
  onInstructorChange,
  onClassroomChange,
  onRecurringChange,
  onRecurrenceTypeChange,
  onRecurrenceDaysChange,
  onRecurrenceEndModeChange,
  onRecurrenceEndDateChange,
  onRecurrenceCountChange,
  onTimesPerDayChange,
  onApplySuggestedSlot,
  onChangeStatus,
  onSave,
  isSaveDisabled,
  saveLabel,
}) {
  if (!open || !classItem) return null;

  const isEdit = mode === 'edit';
  const bg = theme === 'dark' ? '#1f2937' : '#ffffff';
  const border = theme === 'dark' ? '#4b5563' : '#e5e7eb';
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const text = theme === 'dark' ? '#f3f4f6' : '#1f2937';
  const inputBg = theme === 'dark' ? '#374151' : '#ffffff';

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
    color: text,
  };

  const inputStyle = {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: `1px solid ${border}`,
    backgroundColor: inputBg,
    color: text,
    fontSize: '0.875rem',
    width: '100%',
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
    transition: 'all 0.2s ease',
  });

  return (
    <div
      style={{
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: bg,
          borderRadius: '0.5rem',
          padding: '1.5rem',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: text }}>
            {isEdit ? t('update_session') : t('schedule_session')}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color={muted} />
          </button>
        </div>

        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: text }}>
            {getLocalizedClassName(classItem, lang, classItem.code)}
          </div>
          <div style={{ fontSize: '0.875rem', color: muted }}>
            {getLocalizedSubjectName(subjects.find((s) => s.id === classItem.subjectId), lang)
              || getLocalizedName(programs.find((p) => p.id === classItem.programId), lang)
              || classItem.code}
          </div>
        </div>

        <div style={{ marginBottom: isRecurring ? '0.35rem' : '1rem' }}>
          {isRecurring && (
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: muted }}>
              {t('first_occurrence_datetime_hint')}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{isRecurring ? t('first_occurrence_start') : t('start_time')}</label>
              <input
                type="datetime-local"
                style={inputStyle}
                value={toDatetimeLocalValue(startDateTime)}
                onChange={(e) => {
                  onStartChange(new Date(e.target.value));
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>{isRecurring ? t('first_occurrence_end') : t('end_time')}</label>
              <input
                type="datetime-local"
                style={inputStyle}
                value={toDatetimeLocalValue(endDateTime)}
                onChange={(e) => {
                  onEndChange(new Date(e.target.value));
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={labelStyle}>
              {t('instructor')} {!isEdit && <span style={{ color: '#9ca3af' }}>{t('optional_label')}</span>}
            </label>
            {isEdit ? (
              <div
                style={{
                  padding: '0.5rem',
                  backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                  borderRadius: '0.375rem',
                  color: text,
                }}
              >
                {getLocalizedInstructorName(instructors.find((i) => i.id === instructorId), lang, t('not_assigned'))}
              </div>
            ) : (
              <UserSelect
                users={filteredInstructorUsers}
                enrollments={enrollments}
                classes={classes}
                value={instructorEmail}
                onChange={(selectedEmail) => {
                  const selectedInstructor = filteredInstructorUsers.find((u) => u.email === selectedEmail);
                  onInstructorChange(selectedInstructor || null);
                }}
                placeholder={t('select_instructor_optional')}
                roleFilter={[]}
                showLabels={false}
                useEmailAsValue
              />
            )}
            {!isEdit && !classItem.instructorId && instructorId && (
              <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                💡 {t('will_update_class_instructor')}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>
              {t('room')} {!isEdit && <span style={{ color: '#9ca3af' }}>*</span>}
            </label>
            <Select
              value={classroomId != null ? String(classroomId) : ''}
              onChange={(e) => {
                onClassroomChange(e.target.value ? parseInt(e.target.value, 10) : null);
              }}
              theme={theme}
              options={[
                { value: '', label: t('select_classroom') },
                ...classrooms.map((c) => ({
                  value: String(c.id),
                  label: formatClassroomOptionLabel(c, lang, t),
                  subtext: formatClassroomDetails(c, lang, t),
                })),
              ]}
            />
            {classroomId && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 0.625rem',
                  backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  color: muted,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.125rem', color: text }}>
                  {t('classroom_details')}
                </div>
                {formatClassroomDetails(getClassroomById(classrooms, classroomId), lang, t) || t('not_assigned')}
                {(() => {
                  const room = getClassroomById(classrooms, classroomId);
                  const statusLabel = room ? getLocalizedClassroomStatus(room, t) : null;
                  return statusLabel ? (
                    <div style={{ marginTop: '0.25rem' }}>
                      <strong>{t('room_status')}:</strong> {statusLabel}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            {!isEdit && !classItem.classroomId && classroomId && (
              <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                💡 {t('will_update_class_classroom')}
              </div>
            )}
          </div>
        </div>

        {!isEdit && (
          <SchedulingAvailabilityPanel
            instructorId={instructorId}
            classroomId={classroomId}
            classroom={getClassroomById(classrooms, classroomId)}
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            instructorAvailabilities={instructorAvailabilities}
            classroomAvailabilities={classroomAvailabilities}
            validationResult={validationResult}
            isRecurring={isRecurring}
            theme={theme}
            t={t}
            lang={lang}
            onApplySuggestedSlot={onApplySuggestedSlot}
          />
        )}

        <SchedulingRecurrencePanel
          isRecurring={isRecurring}
          onRecurringChange={onRecurringChange}
          recurrenceType={recurrenceType}
          onRecurrenceTypeChange={onRecurrenceTypeChange}
          recurrenceDays={recurrenceDays}
          onRecurrenceDaysChange={onRecurrenceDaysChange}
          recurrenceEndMode={recurrenceEndMode}
          onRecurrenceEndModeChange={onRecurrenceEndModeChange}
          recurrenceEndDate={recurrenceEndDate}
          onRecurrenceEndDateChange={onRecurrenceEndDateChange}
          recurrenceCount={recurrenceCount}
          onRecurrenceCountChange={onRecurrenceCountChange}
          timesPerDay={timesPerDay}
          onTimesPerDayChange={onTimesPerDayChange}
          modalStartDateTime={startDateTime}
          modalEndDateTime={endDateTime}
          theme={theme}
          t={t}
        />

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'space-between' }}>
          <div>
            {isEdit && (
              <button
                type="button"
                style={{ ...buttonStyle('danger'), backgroundColor: '#f59e0b' }}
                onClick={onChangeStatus}
              >
                {t('change_status')}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" style={buttonStyle('secondary')} onClick={onClose}>
              {t('cancel')}
            </button>
            <button
              type="button"
              style={{ ...buttonStyle('primary'), opacity: isSaveDisabled ? 0.55 : 1, cursor: isSaveDisabled ? 'not-allowed' : 'pointer' }}
              disabled={isSaveDisabled}
              onClick={onSave}
            >
              {saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionEventDialog;
