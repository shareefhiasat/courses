import React from 'react';
import {
  ATTENDANCE_STATUS,
  DB_CODE_TO_FRONTEND_STATUS,
  getAttendanceColor,
  getLocalizedAttendanceLabel,
} from '@constants/attendanceTypes';
import { CheckSmallIcon, ClockSmallIcon, XSmallIcon, HeartIcon, CircleIcon } from '@utils/icons.jsx';

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
      <CircleIcon
        style={{ width: size, height: size, stroke: '#9ca3af', flexShrink: 0 }}
        title={tooltip}
      />
    );
  }

  const color = getAttendanceColor(normalized);
  const style = { width: size, height: size, stroke: color, flexShrink: 0 };

  let IconComponent = CircleIcon;
  switch (normalized) {
    case ATTENDANCE_STATUS.PRESENT:
    case ATTENDANCE_STATUS.STANDUP_PRESENT:
      IconComponent = CheckSmallIcon;
      break;
    case ATTENDANCE_STATUS.LATE:
    case ATTENDANCE_STATUS.STANDUP_LATE:
      IconComponent = ClockSmallIcon;
      break;
    case ATTENDANCE_STATUS.ABSENT_NO_EXCUSE:
    case ATTENDANCE_STATUS.STANDUP_ABSENT:
      IconComponent = XSmallIcon;
      break;
    case ATTENDANCE_STATUS.EXCUSED_LEAVE:
    case ATTENDANCE_STATUS.HUMAN_CASE:
    case ATTENDANCE_STATUS.STANDUP_CLINIC:
      IconComponent = HeartIcon;
      break;
    default:
      IconComponent = CircleIcon;
      break;
  }

  return <IconComponent style={style} title={tooltip} />;
}
