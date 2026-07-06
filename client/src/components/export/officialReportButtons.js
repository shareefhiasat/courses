/** Shared official report export button definitions (marks + scheduling). */
export const OFFICIAL_REPORT_BUTTONS = [
  {
    mode: 'semester',
    color: '#8b5cf6',
    icon: 'clock',
    labelKey: 'semester_certificate',
    labelAr: 'شهادة الفصل',
    labelEn: 'Semester Certificate',
    group: 'marks',
  },
  {
    mode: 'qualitative',
    color: '#d97706',
    icon: 'shield',
    labelKey: 'qualitative_card',
    labelAr: 'البطاقة النوعية',
    labelEn: 'Qualitative Card',
    group: 'marks',
  },
  {
    mode: 'class',
    color: '#14b8a6',
    icon: 'file_text',
    labelKey: 'class_subject_report',
    labelAr: 'كشف درجات المادة',
    labelEn: 'Class Subject Report',
    group: 'marks',
  },
  {
    mode: 'warning-first',
    color: '#dc2626',
    icon: 'alert_triangle',
    labelKey: 'first_warning',
    labelAr: 'إنذار أول',
    labelEn: 'First Warning',
    group: 'marks',
  },
  {
    mode: 'warning-final',
    color: '#991b1b',
    icon: 'alert_circle',
    labelKey: 'final_warning',
    labelAr: 'إنذار نهائي',
    labelEn: 'Final Warning',
    group: 'marks',
  },
  {
    mode: 'weekly-schedule',
    color: '#2563eb',
    icon: 'calendar',
    labelKey: 'weekly_schedule',
    labelAr: 'الجدول الأسبوعي',
    labelEn: 'Weekly Schedule',
    group: 'scheduling',
  },
];

export const MARKS_EXPORT_MODES = OFFICIAL_REPORT_BUTTONS.filter((b) => b.group === 'marks').map((b) => b.mode);
export const SCHEDULING_EXPORT_MODES = OFFICIAL_REPORT_BUTTONS.filter((b) => b.group === 'scheduling').map((b) => b.mode);
export const ALL_EXPORT_MODES = OFFICIAL_REPORT_BUTTONS.map((b) => b.mode);
