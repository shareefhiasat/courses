import React from 'react';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { getLocalizedClassroomName } from '@utils/schedulingDisplayUtils';

const formatDate = (dateStr, lang) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return '';
  }
};

const infoItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.25rem 0.5rem',
  borderRadius: '0.375rem',
  background: 'var(--panel, #fff)',
  border: '1px solid var(--border, #e5e7eb)',
  fontSize: 'var(--font-size-sm)',
  minHeight: '32px',
  whiteSpace: 'nowrap',
};

const labelStyle = {
  fontWeight: 600,
  color: 'var(--text-muted, #6b7280)',
};

const valueStyle = {
  fontWeight: 500,
  color: 'var(--text, #1f2937)',
};

const fallbackStyle = {
  color: 'var(--color-warning, #d97706)',
  fontWeight: 500,
};

/**
 * Reusable bar that shows class instructor, start/end dates, and room.
 * Each field shows a fallback message when the value is null/empty.
 *
 * @param {object}   classObj  - The class object (from API)
 * @param {string}   lang      - 'en' or 'ar'
 * @param {function} t         - Translation function
 * @param {object}   [instructorInfo] - Optional pre-resolved instructor info { name, instructorId, loading }
 * @param {React.ReactNode} [children] - Optional extra content (e.g. message button)
 */
const ClassInfoBar = ({ classObj, lang, t, instructorInfo, children, ...rest }) => {
  if (!classObj) return null;

  // Resolve instructor name
  let instructorName = '';
  let instructorLoading = false;

  if (instructorInfo) {
    instructorName = instructorInfo.name || '';
    instructorLoading = instructorInfo.loading || false;
  } else if (classObj.instructor) {
    instructorName = getLocalizedUserName(classObj.instructor, lang);
  }

  // Resolve room/classroom
  let roomName = '';
  if (classObj.classroom) {
    roomName = getLocalizedClassroomName(classObj.classroom, lang);
  }
  if (!roomName && lang === 'ar' && classObj.locationAr) {
    roomName = classObj.locationAr;
  } else if (!roomName && classObj.locationEn) {
    roomName = classObj.locationEn;
  }

  // Resolve dates
  const startDateStr = formatDate(classObj.startDate, lang);
  const endDateStr = formatDate(classObj.endDate, lang);

  const containerStyle = {
    flex: '1 1 100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border, #e5e7eb)',
    background: 'var(--background-secondary, #f9fafb)',
    fontSize: 'var(--font-size-sm)',
    minHeight: '40px',
    flexWrap: 'wrap',
    rowGap: '0.375rem',
  };

  return (
    <div {...rest} style={containerStyle}>
      {/* Instructor */}
      <div style={infoItemStyle}>
        <span style={labelStyle}>{t('class_instructor')}:</span>
        {instructorLoading ? (
          <span style={{ color: 'var(--text-muted, #6b7280)' }}>{t('loading')}</span>
        ) : instructorName ? (
          <span style={valueStyle}>{instructorName}</span>
        ) : (
          <span style={fallbackStyle}>{t('no_instructor_for_class')}</span>
        )}
        {children}
      </div>

      {/* Start Date */}
      <div style={infoItemStyle}>
        <span style={labelStyle}>{t('class_start_date')}:</span>
        {startDateStr ? (
          <span style={valueStyle}>{startDateStr}</span>
        ) : (
          <span style={fallbackStyle}>{t('start_date_not_defined')}</span>
        )}
      </div>

      {/* End Date */}
      <div style={infoItemStyle}>
        <span style={labelStyle}>{t('class_end_date')}:</span>
        {endDateStr ? (
          <span style={valueStyle}>{endDateStr}</span>
        ) : (
          <span style={fallbackStyle}>{t('end_date_not_defined')}</span>
        )}
      </div>

      {/* Room */}
      <div style={infoItemStyle}>
        <span style={labelStyle}>{t('class_room')}:</span>
        {roomName ? (
          <span style={valueStyle}>{roomName}</span>
        ) : (
          <span style={fallbackStyle}>{t('room_not_located')}</span>
        )}
      </div>
    </div>
  );
};

export default ClassInfoBar;
