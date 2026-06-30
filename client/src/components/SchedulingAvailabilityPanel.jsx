import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react';
import {
  checkDefinedAvailability,
  formatDayList,
  formatSlotList,
  formatAvailabilityDateRange,
  getActiveRecordsForEntity,
  suggestNearestValidSlot
} from '../utils/schedulingAvailabilityUtils.js';
import { formatValidationConflict, getLocalizedClassroomStatus } from '../utils/schedulingDisplayUtils.js';

const panelStyle = (theme, tone) => {
  const tones = {
    ok: {
      bg: theme === 'dark' ? '#064e3b' : '#ecfdf5',
      border: theme === 'dark' ? '#065f46' : '#a7f3d0',
      text: theme === 'dark' ? '#a7f3d0' : '#065f46'
    },
    warn: {
      bg: theme === 'dark' ? '#451a03' : '#fffbeb',
      border: theme === 'dark' ? '#92400e' : '#fde68a',
      text: theme === 'dark' ? '#fde68a' : '#92400e'
    },
    error: {
      bg: theme === 'dark' ? '#450a0a' : '#fef2f2',
      border: theme === 'dark' ? '#991b1b' : '#fecaca',
      text: theme === 'dark' ? '#fecaca' : '#991b1b'
    },
    info: {
      bg: theme === 'dark' ? '#1e3a5f' : '#eff6ff',
      border: theme === 'dark' ? '#1d4ed8' : '#bfdbfe',
      text: theme === 'dark' ? '#bfdbfe' : '#1e40af'
    }
  };
  return tones[tone] || tones.info;
};

function DefinedSlotsBlock({ title, records, startDateTime, endDateTime, theme, t, lang }) {
  const check = checkDefinedAvailability(startDateTime, endDateTime, records);
  const tone = !check.configured ? 'info' : check.fits ? 'ok' : 'warn';
  const colors = panelStyle(theme, tone);

  return (
    <div style={{
      padding: '0.625rem 0.75rem',
      borderRadius: '0.375rem',
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
      fontSize: 'var(--font-size-sm)',
      color: colors.text
    }}>
      <div style={{ fontWeight: 600, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        {check.configured && check.fits ? <CheckCircle2 size={14} /> : <Clock size={14} />}
        {title}
      </div>
      {!check.configured ? (
        <div>{t('availability_not_configured')}</div>
      ) : (
        <>
          {records.map((record) => (
            <div key={record.id} style={{ marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 500 }}>{formatDayList(record.dayOfWeek, t)}</span>
              {' · '}
              {formatSlotList(record.slots)}
              {record.startDate && (
                <span style={{ opacity: 0.85 }}> ({formatAvailabilityDateRange(record.startDate, record.endDate, lang)})</span>
              )}
            </div>
          ))}
          {startDateTime && endDateTime && (
            <div style={{ marginTop: '0.375rem', fontWeight: 500 }}>
              {check.fits
                ? t('selected_time_fits_availability')
                : t('selected_time_outside_availability', { day: t((check.day || '').toLowerCase()) || check.day })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SchedulingAvailabilityPanel({
  instructorId,
  classroomId,
  classroom,
  startDateTime,
  endDateTime,
  instructorAvailabilities,
  classroomAvailabilities,
  validationResult,
  isRecurring,
  theme,
  t,
  lang,
  onApplySuggestedSlot
}) {
  const navigate = useNavigate();
  const instructorRecords = useMemo(
    () => getActiveRecordsForEntity(instructorAvailabilities, instructorId, 'instructorUserId'),
    [instructorAvailabilities, instructorId]
  );
  const classroomRecords = useMemo(
    () => getActiveRecordsForEntity(classroomAvailabilities, classroomId, 'classroomId'),
    [classroomAvailabilities, classroomId]
  );

  const suggestion = useMemo(() => {
    if (!startDateTime || !endDateTime || !classroomId) return null;
    return suggestNearestValidSlot(startDateTime, endDateTime, instructorRecords, classroomRecords);
  }, [startDateTime, endDateTime, instructorRecords, classroomRecords, classroomId]);

  const liveInvalid = validationResult && validationResult.valid === false;
  const conflictColors = panelStyle(theme, liveInvalid ? 'error' : 'info');

  if (!classroomId && !instructorId) return null;

  return (
    <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.375rem', color: theme === 'dark' ? '#e5e7eb' : '#374151' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <CalendarDays size={16} />
          {t('defined_availability')}
        </span>
        <button
          type="button"
          onClick={() => navigate(instructorId ? `/summary-dashboard?instructorId=${instructorId}` : '/summary-dashboard')}
          style={{ fontSize: 'var(--font-size-xs)', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {t('view_summary') || 'View Summary'}
        </button>
      </div>

      {instructorId && (
        <DefinedSlotsBlock
          title={t('instructor_defined_hours')}
          records={instructorRecords}
          startDateTime={startDateTime}
          endDateTime={endDateTime}
          theme={theme}
          t={t}
          lang={lang}
        />
      )}

      {classroomId && (
        <>
          {classroom?.status && classroom.status !== 'Available' && (
            <div style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              backgroundColor: classroom.status === 'Closed'
                ? (theme === 'dark' ? '#450a0a' : '#fef2f2')
                : (theme === 'dark' ? '#451a03' : '#fffbeb'),
              border: `1px solid ${classroom.status === 'Closed'
                ? (theme === 'dark' ? '#991b1b' : '#fecaca')
                : (theme === 'dark' ? '#92400e' : '#fde68a')}`,
              fontSize: 'var(--font-size-sm)',
              color: classroom.status === 'Closed'
                ? (theme === 'dark' ? '#fecaca' : '#991b1b')
                : (theme === 'dark' ? '#fde68a' : '#92400e'),
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}>
              <AlertCircle size={14} />
              <span>
                {t('room_status')}: <strong>{getLocalizedClassroomStatus(classroom, t)}</strong>
              </span>
            </div>
          )}
          <DefinedSlotsBlock
            title={t('room_defined_hours')}
            records={classroomRecords}
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            theme={theme}
            t={t}
            lang={lang}
          />
        </>
      )}

      {liveInvalid && validationResult.conflicts?.length > 0 && (
        <div style={{
          padding: '0.625rem 0.75rem',
          borderRadius: '0.375rem',
          backgroundColor: conflictColors.bg,
          border: `1px solid ${conflictColors.border}`,
          fontSize: 'var(--font-size-sm)',
          color: conflictColors.text
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <AlertCircle size={14} />
            {t('scheduling_conflicts_title')}
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {validationResult.conflicts.map((c, i) => (
              <li key={`${c.type}-${i}`}>{formatValidationConflict(c, t)}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestion && onApplySuggestedSlot && liveInvalid && (
        <button
          type="button"
          onClick={() => onApplySuggestedSlot(suggestion.start, suggestion.end)}
          style={{
            alignSelf: 'flex-start',
            padding: '0.375rem 0.75rem',
            fontSize: 'var(--font-size-sm)',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#3b82f6',
            color: '#fff',
            fontWeight: 600
          }}
        >
          {t('use_suggested_slot', {
            day: t((suggestion.day || '').toLowerCase()) || suggestion.day,
            time: `${suggestion.start.getHours().toString().padStart(2, '0')}:${suggestion.start.getMinutes().toString().padStart(2, '0')}`
          })}
        </button>
      )}

      {isRecurring && (
        <div style={{ fontSize: 'var(--font-size-xs)', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          {t('recurring_availability_note')}
        </div>
      )}
    </div>
  );
}
