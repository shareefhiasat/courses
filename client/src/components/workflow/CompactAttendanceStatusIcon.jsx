import React from 'react';
import {
  ATTENDANCE_STATUS,
  DB_CODE_TO_FRONTEND_STATUS,
  getAttendanceColor,
  getLocalizedAttendanceLabel,
} from '@constants/attendanceTypes';
import { Check, Clock, X, Heart, Circle } from '@utils/icons.jsx';

function normalizeStatus(status) {
  if (!status) return null;
  const upper = String(status).toUpperCase();
  return DB_CODE_TO_FRONTEND_STATUS[upper] || upper;
}

/**
 * Small attendance status icon matching QR scanner / roster styling.
 */
export default function CompactAttendanceStatusIcon({
  status,
  size = 14,
  lang = 'en',
  title,
}) {
  const normalized = normalizeStatus(status);
  const tooltip = title || (normalized ? getLocalizedAttendanceLabel(normalized, lang) : '');

  if (!normalized) {
    return (
      <Circle
        size={size}
        color="#9ca3af"
        style={{ flexShrink: 0 }}
      />
    );
  }

  const color = getAttendanceColor(normalized);

  let IconComponent = Circle;
  let strokeWidth = 2;
  switch (normalized) {
    case ATTENDANCE_STATUS.PRESENT:
    case ATTENDANCE_STATUS.STANDUP_PRESENT:
      IconComponent = Check;
      strokeWidth = 3;
      break;
    case ATTENDANCE_STATUS.LATE:
    case ATTENDANCE_STATUS.STANDUP_LATE:
      IconComponent = Clock;
      break;
    case ATTENDANCE_STATUS.ABSENT_NO_EXCUSE:
    case ATTENDANCE_STATUS.STANDUP_ABSENT:
      IconComponent = X;
      break;
    case ATTENDANCE_STATUS.EXCUSED_LEAVE:
    case ATTENDANCE_STATUS.HUMAN_CASE:
    case ATTENDANCE_STATUS.STANDUP_CLINIC:
      IconComponent = Heart;
      strokeWidth = 2.5;
      break;
    default:
      IconComponent = Circle;
      break;
  }

  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} style={{ flexShrink: 0 }} title={tooltip} />;
}
