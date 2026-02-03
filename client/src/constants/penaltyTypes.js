/**
 * Penalty Types Constants
 * 
 * Centralized constants for penalty types used throughout the application.
 * Based on Arabic academic regulations:
 * 1. Cheating in exams or assignments
 * 2. Attempted cheating or assisting in cheating
 * 3. Impersonation (pretending to be another student)
 * 4. Exam system disruption
 * 5. Forgery in school documents
 * 6. Other violations disrupting public order
 */

export const PENALTY_TYPES = [
  { 
    id: "cheating", 
    label_ar: "الغش", 
    label_en: "Cheating",
    points: 10,
    icon: "AlertTriangle",
    color: "#dc2626",
    description_ar: "الغش في الاختبارات أو الواجبات باستخدام مواد غير مسموح بها",
    description_en: "Using unauthorized materials or methods during exams or assignments"
  },
  {
    id: "attempted_cheating",
    label_ar: "غش",
    label_en: "Cheat",
    points: 5,
    icon: "AlertTriangle",
    color: "#dc2626",
    description_ar: "محاولة الغش أو مساعدة الآخرين على الغش في الاختبارات",
    description_en: "Attempting to cheat or assisting others in cheating during exams"
  },
  { 
    id: "impersonation", 
    label_ar: "الانتحال", 
    label_en: "Impersonation",
    points: 15,
    icon: "Users",
    color: "#991b1b",
    description_ar: "انتحال شخصية طالب آخر أو السماح لشخص آخر بانتحال شخصيتك",
    description_en: "Pretending to be another student or allowing someone to take your place"
  },
  {
    id: "exam_disruption",
    label_ar: "تعطيل نظام الاختبار",
    label_en: "Exam System Disruption",
    points: 8,
    icon: "XCircle",
    color: "#dc2626",
    description_ar: "إثارة الفوضى أو تعطيل سير الاختبار بشكل متعمد",
    description_en: "Causing disruption or intentionally interfering with exam proceedings"
  },
  {
    id: "forgery",
    label_ar: "التزوير في وثائق المدرسة",
    label_en: "Forgery in School Documents",
    points: 20,
    icon: "FileX",
    color: "#7f1d1d",
    description_ar: "تزوير التوقيعات أو الوثائق المدرسية الرسمية",
    description_en: "Forging signatures or official school documents"
  },
  {
    id: "other",
    label_ar: "مخالفات أخرى تعطل النظام العام",
    label_en: "Other Violations Disrupting Public Order",
    points: 5,
    icon: "HelpCircle",
    color: "#dc2626",
    description_ar: "أي مخالفات أخرى تؤثر على النظام العام للمدرسة",
    description_en: "Any other violations that disrupt the school's public order"
  },
];

// Helper functions
export const getPenaltyTypeById = (id) => {
  return PENALTY_TYPES.find(type => type.id === id);
};

export const getPenaltyLabel = (id, lang = 'en') => {
  const type = getPenaltyTypeById(id);
  return type ? (lang === 'ar' ? type.label_ar : type.label_en) : id;
};

export const getPenaltyDescription = (id, lang = 'en') => {
  const type = getPenaltyTypeById(id);
  return type ? (lang === 'ar' ? type.description_ar : type.description_en) : '';
};

export const getPenaltyIcon = (id) => {
  const type = getPenaltyTypeById(id);
  return type ? type.icon : 'AlertTriangle';
};

export const getPenaltyColor = (id) => {
  const type = getPenaltyTypeById(id);
  return type ? type.color : '#dc2626';
};
