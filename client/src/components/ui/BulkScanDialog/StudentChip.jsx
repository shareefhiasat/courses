/**
 * StudentChip Component
 *
 * Renders a student chip with move buttons for dual-list layout
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './BulkScanDialog.module.css';

const StudentChip = ({
  student,
  direction, // 'toSelected' or 'toExcluded'
  onMove,
  disabled
}) => {
  const handleMove = () => {
    onMove(student.studentId || student.id);
  };

  const isToSelected = direction === 'toSelected';
  const buttonColor = isToSelected ? '#10b981' : '#ef4444';
  const Icon = isToSelected ? ChevronRight : ChevronLeft;

  return (
    <div
      className={styles.chip}
      style={{ marginBottom: '0.25rem', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      role="listitem"
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
        <span className={styles.chipText} style={{ fontWeight: '600' }}>
          {student.studentNumber}
        </span>
        {student.displayName && (
          <span className={styles.chipName} style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {student.displayName}
          </span>
        )}
      </div>
      <button
        onClick={handleMove}
        className={styles.chipRemove}
        disabled={disabled}
        aria-label={`Move student ${student.studentNumber} ${isToSelected ? 'to selected' : 'to excluded'}`}
        title={`Move ${student.studentNumber} ${isToSelected ? 'to selected' : 'to excluded'}`}
        style={{ backgroundColor: buttonColor, color: 'white', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
      >
        <Icon size={12} />
      </button>
    </div>
  );
};

export default StudentChip;
