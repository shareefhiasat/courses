/**
 * @deprecated Use useLookupTypes hook instead
 * This file is deprecated. All behavior types should be fetched dynamically
 * from the backend API using the useLookupTypes hook with 'behavior-types'.
 * 
 * Migration Example:
 * OLD: import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
 * NEW: const { data: lookupData } = useLookupTypes({ types: ['behavior-types'] });
 *       const behaviorTypes = lookupData['behavior-types'] || [];
 */

import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Behavior Types Constants
 * 
 * Centralized constants for behavior types used throughout the application.
 * @deprecated - Use useLookupTypes hook instead
 */

import { 
  MessageSquare, 
  Bed, 
  Users, 
  Smartphone, 
  AlertTriangle, 
  XCircle, 
  HelpCircle 
} from 'lucide-react';

// Behavior Types - using numeric IDs to match backend database
export const BEHAVIOR_TYPES = [
  { 
    id: 1, // POSITIVE
    code: 'POSITIVE',
    label_ar: 'سلوك إيجابي', 
    label_en: 'Positive Behavior', 
    icon: <MessageSquare size={16} />,
    color: '#22c55e',
    points: 2
  },
  { 
    id: 4, // EXCELLENT
    code: 'EXCELLENT',
    label_ar: 'سلوك ممتاز', 
    label_en: 'Excellent Behavior', 
    icon: <Users size={16} />,
    color: '#2196f3',
    points: 5
  },
  { 
    id: 5, // CONCERNING
    code: 'CONCERNING',
    label_ar: 'سلوك مقلق', 
    label_en: 'Concerning Behavior', 
    icon: <AlertTriangle size={16} />,
    color: '#f97316',
    points: -3
  },
  { 
    id: 2, // TALK_IN_CLASS (mapped from sleep)
    code: 'TALK_IN_CLASS',
    label_ar: 'التحدث في الصف', 
    label_en: 'Talk in Class', 
    icon: <MessageSquare size={16} />,
    color: '#f97316',
    points: -2
  },
  { 
    id: 3, // SLEEP (mapped from sleep)
    code: 'SLEEP',
    label_ar: 'النوم', 
    label_en: 'Sleep', 
    icon: <Bed size={16} />,
    color: '#f97316',
    points: -3
  },
  { 
    id: 6, // BATHROOM_REQUESTS
    code: 'BATHROOM_REQUESTS',
    label_ar: 'طلبات الحمام المتكررة', 
    label_en: 'Frequent Bathroom Requests', 
    icon: <Users size={16} />,
    color: '#f97316',
    points: -1
  },
  { 
    id: 7, // MOBILE_IN_CLASS
    code: 'MOBILE_IN_CLASS',
    label_ar: 'استخدام الهاتف', 
    label_en: 'Mobile Phone in Class', 
    icon: <Smartphone size={16} />,
    color: '#f97316',
    points: -2
  },
  { 
    id: 8, // DISRUPTIVE
    code: 'DISRUPTIVE',
    label_ar: 'سلوك مشتت', 
    label_en: 'Disruptive Behavior', 
    icon: <AlertTriangle size={16} />,
    color: '#f97316',
    points: -3
  },
  { 
    id: 9, // INAPPROPRIATE_LANGUAGE
    code: 'INAPPROPRIATE_LANGUAGE',
    label_ar: 'لغة غير لائقة', 
    label_en: 'Inappropriate Language', 
    icon: <XCircle size={16} />,
    color: '#ef4444',
    points: -4
  },
  { 
    id: 10, // OTHER
    code: 'OTHER',
    label_ar: 'أخرى', 
    label_en: 'Other', 
    icon: <HelpCircle size={16} />,
    color: '#6b7280',
    points: 0
  }
];

// Helper functions
export const getBehaviorTypeById = (id) => {
  // Convert to number if it's a string to ensure proper matching
  const numericId = typeof id === 'string' ? parseInt(id) : id;
  return BEHAVIOR_TYPES.find(type => type.id === numericId);
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
