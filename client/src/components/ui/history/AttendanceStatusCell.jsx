import React from 'react';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS, ATTENDANCE_TYPE_CATEGORY, getAttendanceColor, getLocalizedAttendanceLabel } from '@constants/attendanceTypes.js';
import { Check, Clock, X, Heart, Circle } from '@utils/icons.jsx';
import { getThemedIcon } from '@constants/iconTypes';
import { WORKFLOW_STATUS, IN_PROGRESS_STATUSES } from '@constants/workflowStatusTypes.jsx';

/**
 * Renders a small alibi/excuse workflow indicator icon next to the attendance status.
 * The icon links to the workflow document detail page in a new tab.
 */
const AlibiWorkflowIndicator = ({ workflow, t, lang }) => {
  if (!workflow) return null;

  const isInProgress = IN_PROGRESS_STATUSES.includes(workflow.status);
  const isApproved = workflow.status === WORKFLOW_STATUS.APPROVED;
  const isRejected = workflow.status === WORKFLOW_STATUS.REJECTED;

  let iconColor, tooltipText, IconComponent;

  if (isApproved) {
    iconColor = '#10b981';
    tooltipText = (t('alibi_approved')) + ` — #${workflow.id}`;
    IconComponent = Check;
  } else if (isRejected) {
    iconColor = '#ef4444';
    tooltipText = (t('alibi_rejected')) + ` — #${workflow.id}`;
    IconComponent = X;
  } else {
    iconColor = '#f59e0b';
    tooltipText = (t('alibi_in_progress')) + ` — #${workflow.id}`;
    IconComponent = Clock;
  }

  return (
    <a
      href={`/workflow-documents/${workflow.id}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '0.25rem',
        textDecoration: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <IconComponent size={14} color={iconColor} />
    </a>
  );
};

/**
 * AttendanceStatusCell - Displays attendance status with proper icon and color
 * Logic-free component following workspace constitution
 */
const AttendanceStatusCell = ({ status, type = ATTENDANCE_TYPE_CATEGORY.REGULAR, t, lang, linkedWorkflow }) => {
  const getAttendanceDisplay = (status) => {
    // Convert to uppercase for label lookup
    const statusUpper = status?.toUpperCase();
    if (!ATTENDANCE_STATUS_LABELS[statusUpper]) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Circle size={type === ATTENDANCE_TYPE_CATEGORY.REGULAR ? 12 : 16} color="#9ca3af" />
          <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>{t('none')}</span>
          {linkedWorkflow && <AlibiWorkflowIndicator workflow={linkedWorkflow} t={t} lang={lang} />}
        </div>
      );
    }

    const color = getAttendanceColor(statusUpper);
    const label = getLocalizedAttendanceLabel(statusUpper, lang);

    const getIcon = (s) => {
      switch(statusUpper) {
        case ATTENDANCE_STATUS.PRESENT:
        case ATTENDANCE_STATUS.STANDUP_PRESENT:
          return <Check size={16} strokeWidth={3} color={color} />;
        case ATTENDANCE_STATUS.LATE:
        case ATTENDANCE_STATUS.STANDUP_LATE:
          return <Clock size={16} color={color} />;
        case ATTENDANCE_STATUS.ABSENT_NO_EXCUSE:
        case ATTENDANCE_STATUS.STANDUP_ABSENT:
          return <X size={16} color={color} />;
        case ATTENDANCE_STATUS.EXCUSED_LEAVE:
          return <Heart size={16} strokeWidth={2.5} color={color} />;
        case ATTENDANCE_STATUS.STANDUP_CLINIC:
          return <Heart size={16} strokeWidth={2.5} color={color} />;
        case ATTENDANCE_STATUS.HUMAN_CASE:
          return <Heart size={16} strokeWidth={2.5} color={color} />;
        default:
          return <Circle size={16} color={color} />;
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {getIcon(status)}
        <span style={{ fontSize: 'var(--font-size-xs)', color: color, fontWeight: 500 }}>
          {label}
        </span>
        {linkedWorkflow && <AlibiWorkflowIndicator workflow={linkedWorkflow} t={t} lang={lang} />}
      </div>
    );
  };

  const iconSize = type === ATTENDANCE_TYPE_CATEGORY.REGULAR ? 12 : 16;
  const fontSize = type === ATTENDANCE_TYPE_CATEGORY.REGULAR ? '0.7rem' : '0.75rem';

  return status ? getAttendanceDisplay(status) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      <Circle size={iconSize} color="#9ca3af" />
      <span style={{ fontSize: fontSize, color: '#9ca3af', fontWeight: 500 }}>{t('none')}</span>
      {linkedWorkflow && <AlibiWorkflowIndicator workflow={linkedWorkflow} t={t} lang={lang} />}
    </div>
  );
};

export default AttendanceStatusCell;
