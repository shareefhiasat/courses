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
    id: 'inappropriate_language', 
    label_ar: 'لغة غير لائقة', 
    label_en: 'Inappropriate Language', 
    icon: 'XCircle',
    color: '#ef4444',
    points: -4
  },
  { 
    id: 'cheating', 
    label_ar: 'غش', 
    label_en: 'Cheating', 
    icon: 'AlertTriangle',
    color: '#dc2626',
    points: -5
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
    icon: 'CheckCircle',
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
    color: '#3b82f6',
    points: 5
  },
  { 
    id: 'gave_project', 
    label_ar: 'قدم مشروع', 
    label_en: 'Gave Project', 
    icon: 'Award',
    color: '#8b5cf6',
    points: 10
  },
  { 
    id: 'gave_paper', 
    label_ar: 'قدم ورقة', 
    label_en: 'Gave Paper', 
    icon: 'FileText',
    color: '#06b6d4',
    points: 8
  },
  { 
    id: 'gave_research', 
    label_ar: 'قدم بحث', 
    label_en: 'Gave Research', 
    icon: 'FileText',
    color: '#10b981',
    points: 12
  },
  { 
    id: 'active_discussion', 
    label_ar: 'نقاش نشط', 
    label_en: 'Active Discussion', 
    icon: 'MessageSquare',
    color: '#f59e0b',
    points: 3
  },
  { 
    id: 'answered_question', 
    label_ar: 'أجاب على سؤال', 
    label_en: 'Answered Question', 
    icon: 'HelpCircle',
    color: '#ec4899',
    points: 2
  },
  { 
    id: 'helped_classmate', 
    label_ar: 'ساعد زميل', 
    label_en: 'Helped Classmate', 
    icon: 'Users',
    color: '#14b8a6',
    points: 4
  },
  { 
    id: 'excellent', 
    label_ar: 'مشاركة ممتازة', 
    label_en: 'Excellent Participation', 
    icon: 'Star',
    color: '#fbbf24',
    points: 10
  },
  { 
    id: 'good', 
    label_ar: 'مشاركة جيدة', 
    label_en: 'Good Participation', 
    icon: 'ThumbsUp',
    color: '#22c55e',
    points: 5
  },
  { 
    id: 'average', 
    label_ar: 'مشاركة متوسطة', 
    label_en: 'Average Participation', 
    icon: 'Minus',
    color: '#6b7280',
    points: 2
  },
  { 
    id: 'poor', 
    label_ar: 'مشارجة ضعيفة', 
    label_en: 'Poor Participation', 
    icon: 'X',
    color: '#ef4444',
    points: 0
  },
  { 
    id: 'other', 
    label_ar: 'أخرى', 
    label_en: 'Other', 
    icon: 'MoreHorizontal',
    color: '#9333ea',
    points: 0
  }
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
