import React from 'react';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';

/**
 * StudentStatsRow - Displays participation, behavior, and penalty stats
 * Logic-free component following workspace constitution
 */
const StudentStatsRow = ({ participationValue, behaviorValue, penaltyValue, onStudentSelect, student, attendanceMode }) => {
  // Ensure values are always numeric with 0 as fallback
  const participation = participationValue ?? 0;
  const behavior = behaviorValue ?? 0;
  const penalty = penaltyValue ?? 0;

  return (
    <>
      {/* Participation Column */}
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '0.5rem',
          fontWeight: 500,
          background: participation > 0 ? '#dbeafe' : '#f3f4f6',
          color: participation > 0 ? '#1e40af' : '#374151'
        }}>
          {participation}
        </span>
      </td>

      {/* Behavior Column */}
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '0.5rem',
          fontWeight: 500,
          background: behavior >= 0 ? '#d1fae5' : '#fee2e2',
          color: behavior >= 0 ? '#065f46' : '#991b1b'
        }}>
          {behavior}
        </span>
      </td>

      {/* Penalty Column */}
      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '0.5rem',
          fontWeight: 500,
          background: penalty < 0 ? '#fee2e2' : '#f3f4f6',
          color: penalty < 0 ? '#991b1b' : '#374151'
        }}>
          {penalty}
        </span>
      </td>
    </>
  );
};

export default StudentStatsRow;
