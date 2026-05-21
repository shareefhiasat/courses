import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Select } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { ATTENDANCE_STATUS, getLocalizedAttendanceLabel } from '@constants/attendanceTypes';


import { info, error, warn, debug } from '@services/utils/logger.js';const AttendanceTypeSelect = ({ 
  value, 
  onChange, 
  fullWidth = false,
  placeholder = null,
  disabled = false 
}) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();

  const options = [
    { 
      value: 'all', 
      label: placeholder || t('all_attendance_types') || 'All Attendance Types'
    },
    { 
      value: ATTENDANCE_STATUS.PRESENT, 
      label: getLocalizedAttendanceLabel(ATTENDANCE_STATUS.PRESENT, lang),
      icon: getThemedIcon('ui', 'check', 16, '#10b981')
    },
    { 
      value: ATTENDANCE_STATUS.LATE, 
      label: getLocalizedAttendanceLabel(ATTENDANCE_STATUS.LATE, lang),
      icon: getThemedIcon('ui', 'clock', 16, '#f59e0b')
    },
    { 
      value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, 
      label: getLocalizedAttendanceLabel(ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, lang),
      icon: getThemedIcon('ui', 'x_circle', 16, '#ef4444')
    },
    { 
      value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, 
      label: getLocalizedAttendanceLabel(ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, lang),
      icon: getThemedIcon('ui', 'x_circle', 16, '#ef4444')
    },
    { 
      value: ATTENDANCE_STATUS.EXCUSED_LEAVE, 
      label: getLocalizedAttendanceLabel(ATTENDANCE_STATUS.EXCUSED_LEAVE, lang),
      icon: getThemedIcon('ui', 'x_circle', 16, '#ef4444')
    },
    { 
      value: ATTENDANCE_STATUS.HUMAN_CASE, 
      label: getLocalizedAttendanceLabel(ATTENDANCE_STATUS.HUMAN_CASE, lang),
      icon: getThemedIcon('ui', 'heart', 16, '#8b5cf6')
    }
  ];

  return (
    <Select
      searchable
      value={value}
      onChange={onChange}
      options={options}
      fullWidth={fullWidth}
      placeholder={placeholder || getLocalizedLabel(
        t('all_attendance_types'),
        t('all_attendance_types_ar')
      )}
      disabled={disabled}
    />
  );
};

export default AttendanceTypeSelect;
