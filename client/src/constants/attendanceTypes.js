/**
 * Attendance Types Constants
 * 
 * Centralized constants for attendance statuses used throughout the application.
 */

// Attendance Types
export const ATTENDANCE_TYPES = [
  { 
    id: 'present', 
    label_ar: 'حاضر', 
    label_en: 'Present', 
    icon: 'CheckCircle',
    color: '#22c55e'
  },
  { 
    id: 'absent_no_excuse', 
    label_ar: 'غياب بدون عذر', 
    label_en: 'Absent (No Excuse)', 
    icon: 'XCircle',
    color: '#ef4444'
  },
  { 
    id: 'absent_with_excuse', 
    label_ar: 'غياب بعذر', 
    label_en: 'Absent (Excused)', 
    icon: 'XCircle',
    color: '#ef4444'
  },
  { 
    id: 'late', 
    label_ar: 'متأخر', 
    label_en: 'Late', 
    icon: 'Clock',
    color: '#eab308'
  },
  { 
    id: 'excused_leave', 
    label_ar: 'استئذان', 
    label_en: 'Excused Leave', 
    icon: 'XCircle',
    color: '#ef4444'
  },
  { 
    id: 'human_case', 
    label_ar: 'حالة إنسانية', 
    label_en: 'Human Case', 
    icon: 'Heart',
    color: '#8b5cf6'
  }
];

// Backward compatibility - keep the old constants
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT_NO_EXCUSE: 'absent_no_excuse',
  ABSENT_WITH_EXCUSE: 'absent_with_excuse',
  LATE: 'late',
  EXCUSED_LEAVE: 'excused_leave',
  HUMAN_CASE: 'human_case'
};

// Helper functions
export const getAttendanceTypeById = (id) => {
  return ATTENDANCE_TYPES.find(type => type.id === id);
};

export const getAttendanceLabel = (id, lang = 'en') => {
  const type = getAttendanceTypeById(id);
  return type ? (lang === 'ar' ? type.label_ar : type.label_en) : id;
};

export const getAttendanceIcon = (id) => {
  const type = getAttendanceTypeById(id);
  return type ? type.icon : 'HelpCircle';
};

export const getAttendanceColor = (id) => {
  const type = getAttendanceTypeById(id);
  return type ? type.color : '#6b7280';
};

// Backward compatibility - keep the old object structure
export const ATTENDANCE_STATUS_LABELS = ATTENDANCE_TYPES.reduce((acc, type) => {
  acc[type.id] = {
    en: type.label_en,
    ar: type.label_ar,
    color: type.color,
    icon: type.icon
  };
  return acc;
}, {});
