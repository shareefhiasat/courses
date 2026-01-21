/**
 * Behavior and Participation Constants
 * 
 * Centralized constants for behavior types and participation options
 * used throughout the application.
 */

// Behavior Types
export const BEHAVIOR_TYPES = [
  { 
    id: 'talk_in_class', 
    label_ar: 'التحدث في الصف', 
    label_en: 'Talk in Class', 
    icon: 'MessageSquare',
    color: '#ef4444',
    points: -2
  },
  { 
    id: 'sleep', 
    label_ar: 'النوم', 
    label_en: 'Sleep', 
    icon: 'Bed',
    color: '#f59e0b',
    points: -3
  },
  { 
    id: 'bathroom_requests', 
    label_ar: 'طلبات الحمام المتكررة', 
    label_en: 'Frequent Bathroom Requests', 
    icon: 'Users',
    color: '#f59e0b',
    points: -1
  },
  { 
    id: 'mobile_in_class', 
    label_ar: 'استخدام الهاتف', 
    label_en: 'Mobile Phone in Class', 
    icon: 'Smartphone',
    color: '#ef4444',
    points: -2
  },
  { 
    id: 'disruptive', 
    label_ar: 'سلوك مشتت', 
    label_en: 'Disruptive Behavior', 
    icon: 'AlertTriangle',
    color: '#ef4444',
    points: -3
  },
  { 
    id: 'late_arrival', 
    label_ar: 'تأخر الوصول', 
    label_en: 'Late Arrival', 
    icon: 'Clock',
    color: '#f59e0b',
    points: -1
  },
  { 
    id: 'inappropriate_language', 
    label_ar: 'لغة غير لائقة', 
    label_en: 'Inappropriate Language', 
    icon: 'XCircle',
    color: '#ef4444',
    points: -4
  },
  { 
    id: 'positive', 
    label_ar: 'سلوك إيجابي', 
    label_en: 'Positive Behavior', 
    icon: 'CheckCircle',
    color: '#22c55e',
    points: 3
  },
  { 
    id: 'helpful', 
    label_ar: 'مفيد للآخرين', 
    label_en: 'Helpful to Others', 
    icon: 'Users',
    color: '#22c55e',
    points: 2
  },
  { 
    id: 'participation', 
    label_ar: 'مشاركة جيدة', 
    label_en: 'Good Participation', 
    icon: 'Award',
    color: '#3b82f6',
    points: 1
  },
  { 
    id: 'other', 
    label_ar: 'أخرى', 
    label_en: 'Other', 
    icon: 'HelpCircle',
    color: '#6b7280',
    points: 0
  }
];

// Participation Types
export const PARTICIPATION_TYPES = [
  { 
    id: 'explain_lesson', 
    label_ar: 'شرح الدرس', 
    label_en: 'Explained Lesson', 
    icon: 'MessageSquare',
    points: 5
  },
  { 
    id: 'gave_project', 
    label_ar: 'قدم مشروع', 
    label_en: 'Gave Project', 
    icon: 'Award',
    points: 10
  },
  { 
    id: 'gave_paper', 
    label_ar: 'قدم ورقة', 
    label_en: 'Gave Paper', 
    icon: 'FileText',
    points: 8
  },
  { 
    id: 'gave_research', 
    label_ar: 'قدم بحث', 
    label_en: 'Gave Research', 
    icon: 'FileText',
    points: 12
  },
  { 
    id: 'active_discussion', 
    label_ar: 'نقاش نشط', 
    label_en: 'Active Discussion', 
    icon: 'MessageSquare',
    points: 3
  },
  { 
    id: 'answered_question', 
    label_ar: 'أجاب على سؤال', 
    label_en: 'Answered Question', 
    icon: 'HelpCircle',
    points: 2
  },
  { 
    id: 'helped_classmate', 
    label_ar: 'ساعد زميل', 
    label_en: 'Helped Classmate', 
    icon: 'Users',
    points: 4
  },
  { 
    id: 'excellent', 
    label_ar: 'مشاركة ممتازة', 
    label_en: 'Excellent Participation', 
    icon: 'Star',
    points: 10
  },
  { 
    id: 'good', 
    label_ar: 'مشاركة جيدة', 
    label_en: 'Good Participation', 
    icon: 'ThumbsUp',
    points: 5
  },
  { 
    id: 'average', 
    label_ar: 'مشاركة متوسطة', 
    label_en: 'Average Participation', 
    icon: 'Minus',
    points: 2
  },
  { 
    id: 'poor', 
    label_ar: 'مشارجة ضعيفة', 
    label_en: 'Poor Participation', 
    icon: 'X',
    points: 0
  },
  { 
    id: 'other', 
    label_ar: 'أخرى', 
    label_en: 'Other', 
    icon: 'MoreHorizontal',
    points: 0
  }
];

// Legacy constants for backward compatibility
export const BEHAVIOR_OPTIONS = BEHAVIOR_TYPES.map(type => ({
  value: type.id,
  label: type.label_en,
  color: type.color
}));

export const PARTICIPATION_OPTIONS = [
  { value: 'excellent', label: 'Excellent Participation', points: 10 },
  { value: 'good', label: 'Good Participation', points: 5 },
  { value: 'average', label: 'Average Participation', points: 2 },
  { value: 'poor', label: 'Poor Participation', points: 0 }
];

// Helper functions
export const getBehaviorTypeById = (id) => {
  return BEHAVIOR_TYPES.find(type => type.id === id);
};

export const getParticipationTypeById = (id) => {
  return PARTICIPATION_TYPES.find(type => type.id === id);
};

export const getBehaviorLabel = (id, lang = 'en') => {
  const type = getBehaviorTypeById(id);
  return type ? (lang === 'ar' ? type.label_ar : type.label_en) : id;
};

export const getParticipationLabel = (id, lang = 'en') => {
  const type = getParticipationTypeById(id);
  return type ? (lang === 'ar' ? type.label_ar : type.label_en) : id;
};
