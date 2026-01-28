/**
 * Behavior Types Constants
 * 
 * Centralized constants for behavior types used throughout the application.
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

// Helper functions
export const getBehaviorTypeById = (id) => {
  return BEHAVIOR_TYPES.find(type => type.id === id);
};

export const getBehaviorLabel = (id, lang = 'en') => {
  const type = getBehaviorTypeById(id);
  return type ? (lang === 'ar' ? type.label_ar : type.label_en) : id;
};

export const getBehaviorIcon = (id) => {
  const type = getBehaviorTypeById(id);
  return type ? type.icon : 'AlertTriangle';
};

export const getBehaviorColor = (id) => {
  const type = getBehaviorTypeById(id);
  return type ? type.color : '#ef4444';
};
