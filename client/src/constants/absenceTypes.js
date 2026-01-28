/**
 * Absence Types Constants
 * 
 * Centralized constants for absence types based on Arabic regulations:
 * - With excuse (official document): -0.25 points per session
 * - Without excuse: -0.50 points per session
 * - Bereavement (death of close relative): No deduction, 3 days leave
 * - Exceeding 20%: Automatic failure (FB grade)
 */

export const ABSENCE_TYPES = [
  {
    id: "with_excuse",
    label_ar: "بعذر رسمي",
    label_en: "With Official Excuse",
    deduction: 0.25,
    icon: "FileSignature",
    color: "#3b82f6",
  },
  {
    id: "without_excuse",
    label_ar: "بدون عذر",
    label_en: "Without Excuse",
    deduction: 0.5,
    icon: "XCircle",
    color: "#ef4444",
  },
  {
    id: "bereavement",
    label_ar: "وفاة قريب",
    label_en: "Bereavement",
    deduction: 0,
    icon: "Users",
    color: "#6b7280",
  },
  {
    id: "beyond_control",
    label_ar: "أسباب خارجة عن السيطرة",
    label_en: "Beyond Control (accident, weather, hospitalization)",
    deduction: 0.25,
    icon: "AlertTriangle",
    color: "#f59e0b",
  },
];

// Helper functions
export const getAbsenceTypeById = (id) => {
  return ABSENCE_TYPES.find(type => type.id === id);
};

export const getAbsenceLabel = (id, lang = 'en') => {
  const type = getAbsenceTypeById(id);
  return type ? (lang === 'ar' ? type.label_ar : type.label_en) : id;
};

export const getAbsenceIcon = (id) => {
  const type = getAbsenceTypeById(id);
  return type ? type.icon : 'Clock';
};

export const getAbsenceColor = (id) => {
  const type = getAbsenceTypeById(id);
  return type ? type.color : '#6b7280';
};

/**
 * Calculate absence percentage and penalties
 */
export const calculateAbsenceStats = (absences, totalSessions) => {
  if (!totalSessions || totalSessions === 0) {
    return {
      totalAbsences: 0,
      withExcuse: 0,
      withoutExcuse: 0,
      percentage: 0,
      attendanceDeduction: 0,
      exceedsLimit: false,
      willFail: false,
    };
  }

  const withExcuse = absences.filter(
    (a) => a.type === "with_excuse" || a.type === "beyond_control"
  ).length;
  const withoutExcuse = absences.filter(
    (a) => a.type === "without_excuse"
  ).length;
  const totalAbsences = absences.length;
  const percentage = (totalAbsences / totalSessions) * 100;

  // Calculate attendance deduction
  const attendanceDeduction = withExcuse * 0.25 + withoutExcuse * 0.5;

  const exceedsLimit = percentage > 20;
  const willFail = exceedsLimit;

  return {
    totalAbsences,
    withExcuse,
    withoutExcuse,
    percentage: Math.round(percentage * 100) / 100,
    attendanceDeduction: Math.round(attendanceDeduction * 100) / 100,
    exceedsLimit,
    willFail,
  };
};
