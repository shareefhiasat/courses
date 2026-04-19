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
  disabled,
  hasEditPermission = true
}) => {
  const handleMove = () => {
    onMove(student.studentId || student.id);
  };

  const isToSelected = direction === 'toSelected';
  const buttonColor = isToSelected ? '#10b981' : '#ef4444';
  const Icon = isToSelected ? ChevronRight : ChevronLeft;

  // Apply special color styling when user lacks edit permission
  const chipStyle = {
    marginBottom: '0.25rem',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: hasEditPermission ? 'transparent' : '#fef3c7', // Light yellow for read-only
    border: hasEditPermission ? '1px solid #e2e8f0' : '1px solid #f59e0b', // Orange border for read-only
    padding: '0.5rem',
    borderRadius: '0.375rem'
  };

  return (
    <div
      className={styles.chip}
      style={chipStyle}
      role="listitem"
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
        <span className={styles.chipText} style={{ fontWeight: '600', color: hasEditPermission ? 'inherit' : '#b45309' }}>
          {student.studentNumber}
        </span>
        {student.displayName && (
          <span className={styles.chipName} style={{ fontSize: '0.875rem', color: hasEditPermission ? '#64748b' : '#b45309' }}>
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
