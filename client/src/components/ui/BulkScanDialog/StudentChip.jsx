/**
 * StudentChip Component
 *
 * Renders a student chip with move buttons for dual-list layout
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { useLang } from '@contexts/LangContext';
import styles from './BulkScanDialog.module.css';

const StudentChip = ({
  student,
  direction, // 'toSelected' or 'toExcluded'
  onMove,
  disabled,
  hasEditPermission = true,
  lang = 'en'
}) => {
  const isRTL = lang === 'ar';
  const { t } = useLang();
  const handleMove = () => {
    onMove(student.studentId || student.id);
  };

  const isToSelected = direction === 'toSelected';
  const buttonColor = isToSelected ? '#10b981' : '#ef4444';
  // In RTL, swap the chevron directions to match the mirrored layout
  const Icon = isToSelected
    ? (isRTL ? ChevronLeft : ChevronRight)
    : (isRTL ? ChevronRight : ChevronLeft);

  const studentNumber = student.studentNumber || student.id;
  const displayName = getLocalizedUserName(student, lang, '');

  // Apply special color styling when user lacks edit permission
  const chipStyle = {
    marginBottom: '0.25rem',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: hasEditPermission
      ? (isToSelected ? 'rgba(255, 251, 235, 0.7)' : 'rgba(240, 253, 244, 0.7)')
      : '#fef3c7',
    border: hasEditPermission
      ? (isToSelected ? '1px solid #fde68a' : '1px solid #bbf7d0')
      : '1px solid #f59e0b',
    padding: '0.4rem 0.5rem',
    borderRadius: '0.375rem'
  };

  return (
    <div
      className={styles.chip}
      style={chipStyle}
      role="listitem"
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
        <span className={styles.chipText} style={{ fontWeight: '700', fontSize: '0.9rem', color: hasEditPermission ? 'inherit' : '#b45309', flexShrink: 0 }}>
          {studentNumber}
        </span>
        {displayName && (
          <span className={styles.chipName} style={{ fontSize: '0.9rem', color: hasEditPermission ? '#475569' : '#b45309', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
        )}
      </div>
      <button
        onClick={handleMove}
        className={styles.chipRemove}
        disabled={disabled}
        aria-label={`${t('move_to_selected') || 'Move to selected'}: ${studentNumber}`}
        title={`${isToSelected ? (t('move_to_selected') || 'Move to selected') : (t('move_to_excluded') || 'Move to excluded')}: ${studentNumber}`}
        style={{
          backgroundColor: buttonColor,
          color: 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          flexShrink: 0,
          borderRadius: '0.375rem',
          padding: '0.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          transition: 'all 0.2s'
        }}
      >
        <Icon size={14} />
      </button>
    </div>
  );
};

export default StudentChip;
