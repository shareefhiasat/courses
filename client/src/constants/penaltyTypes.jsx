/**
 * @deprecated Use useLookupTypes hook instead
 * This file is deprecated. All penalty types should be fetched dynamically
 * from the backend API using the useLookupTypes hook with 'penalty-types'.
 * 
 * Migration Example:
 * OLD: import { PENALTY_TYPES } from '@constants/penaltyTypes';
 * NEW: const { data: lookupData } = useLookupTypes({ types: ['penalty-types'] });
 *       const penaltyTypes = lookupData['penalty-types'] || [];
 */

import { info, error, warn, debug } from '@services/utils/logger.js';

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

import { 
  AlertTriangle, 
  Users, 
  XCircle, 
  FileX, 
  HelpCircle 
} from 'lucide-react';

export const PENALTY_TYPES = [
  { 
    id: "cheating", 
    label_ar: "الغش", 
    label_en: "Cheating",
    points: 10,
    icon: <AlertTriangle size={16} />,
    color: "#dc2626",
    description_ar: "الغش في الاختبارات أو الواجبات باستخدام مواد غير مسموح بها",
    description_en: "Using unauthorized materials or methods during exams or assignments"
  },
  { 
    id: "impersonation", 
    label_ar: "الانتحال", 
    label_en: "Impersonation",
    points: 15,
    icon: <Users size={16} />,
    color: "#dc2626",
    description_ar: "انتحال شخصية طالب آخر أو السماح لشخص آخر بانتحال شخصيتك",
    description_en: "Pretending to be another student or allowing someone to take your place"
  },
  {
    id: "exam_disruption",
    label_ar: "تعطيل نظام الاختبار",
    label_en: "Exam System Disruption",
    points: 8,
    icon: <XCircle size={16} />,
    color: "#dc2626",
    description_ar: "إثارة الفوضى أو تعطيل سير الاختبار بشكل متعمد",
    description_en: "Causing disruption or intentionally interfering with exam proceedings"
  },
  {
    id: "forgery",
    label_ar: "التزوير في وثائق المدرسة",
    label_en: "Forgery in School Documents",
    points: 20,
    icon: <FileX size={16} />,
    color: "#dc2626",
    description_ar: "تزوير التوقيعات أو الوثائق المدرسية الرسمية",
    description_en: "Forging signatures or official school documents"
  },
  {
    id: "other",
    label_ar: "مخالفات أخرى تعطل النظام العام",
    label_en: "Other Violations Disrupting Public Order",
    points: 5,
    icon: <HelpCircle size={16} />,
    color: "#dc2626",
    description_ar: "أي مخالفات أخرى تؤثر على النظام العام للمدرسة",
    description_en: "Any other violations that disrupt the school's public order"
  },
];

// Create PENALTY_TYPE_ICONS object for easy access to icons
export const PENALTY_TYPE_ICONS = PENALTY_TYPES.reduce((acc, type) => {
  acc[type.id] = type.icon;
  return acc;
}, {});

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
  return type ? (lang === 'ar' ? type.descriptionAr : type.descriptionEn) : '';
};

export const getPenaltyIcon = (id) => {
  const type = getPenaltyTypeById(id);
  return type ? type.icon : 'AlertTriangle';
};

export const getPenaltyColor = (id) => {
  const type = getPenaltyTypeById(id);
  return type ? type.color : '#dc2626';
};
