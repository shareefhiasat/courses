import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Select } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '@constants/attendanceTypes';


import { info, error, warn, debug } from '@services/utils/logger.js';const AttendanceTypeSelect = ({ 
  value, 
  onChange, 
  fullWidth = false,
  placeholder = null,
  disabled = false 
}) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();

  const getLocalizedLabel = (labelEn, labelAr) => {
    if (lang === 'ar' && labelAr) {
      return labelAr;
    }
    return labelEn;
  };

  const options = [
    { 
      value: 'all', 
      label: placeholder || getLocalizedLabel(
        t('all_attendance_types'),
        t('all_attendance_types_ar')
      )
    },
    { 
      value: ATTENDANCE_STATUS.PRESENT, 
      label: getLocalizedLabel(
        ATTENDANCE_STATUS_LABELS.present.en,
        ATTENDANCE_STATUS_LABELS.present.ar
      ),
      icon: getThemedIcon('ui', 'check', 16, '#10b981')
    },
    { 
      value: ATTENDANCE_STATUS.LATE, 
      label: getLocalizedLabel(
        ATTENDANCE_STATUS_LABELS.late.en,
        ATTENDANCE_STATUS_LABELS.late.ar
      ),
      icon: getThemedIcon('ui', 'clock', 16, '#f59e0b')
    },
    { 
      value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, 
      label: getLocalizedLabel(
        ATTENDANCE_STATUS_LABELS.absent_no_excuse.en,
        ATTENDANCE_STATUS_LABELS.absent_no_excuse.ar
      ),
      icon: getThemedIcon('ui', 'x_circle', 16, '#ef4444')
    },
    { 
      value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, 
      label: getLocalizedLabel(
        ATTENDANCE_STATUS_LABELS.absent_with_excuse.en,
        ATTENDANCE_STATUS_LABELS.absent_with_excuse.ar
      ),
      icon: getThemedIcon('ui', 'x_circle', 16, '#ef4444')
    },
    { 
      value: ATTENDANCE_STATUS.EXCUSED_LEAVE, 
      label: getLocalizedLabel(
        ATTENDANCE_STATUS_LABELS.excused_leave.en,
        ATTENDANCE_STATUS_LABELS.excused_leave.ar
      ),
      icon: getThemedIcon('ui', 'x_circle', 16, '#ef4444')
    },
    { 
      value: ATTENDANCE_STATUS.HUMAN_CASE, 
      label: getLocalizedLabel(
        ATTENDANCE_STATUS_LABELS.human_case.en,
        ATTENDANCE_STATUS_LABELS.human_case.ar
      ),
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
