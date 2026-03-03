/**
 * Behavior Types Constants
 * 
 * Centralized constants for behavior types used throughout the application.
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

// Behavior Types (only negative behaviors)
export const BEHAVIOR_TYPES = [
  { 
    id: 'talk_in_class', 
    label_ar: 'التحدث في الصف', 
    label_en: 'Talk in Class', 
    icon: <MessageSquare size={16} />,
    color: '#f97316',
    points: -2
  },
  { 
    id: 'sleep', 
    label_ar: 'النوم', 
    label_en: 'Sleep', 
    icon: <Bed size={16} />,
    color: '#f97316',
    points: -3
  },
  { 
    id: 'bathroom_requests', 
    label_ar: 'طلبات الحمام المتكررة', 
    label_en: 'Frequent Bathroom Requests', 
    icon: <Users size={16} />,
    color: '#f97316',
    points: -1
  },
  { 
    id: 'mobile_in_class', 
    label_ar: 'استخدام الهاتف', 
    label_en: 'Mobile Phone in Class', 
    icon: <Smartphone size={16} />,
    color: '#f97316',
    points: -2
  },
  { 
    id: 'disruptive', 
    label_ar: 'سلوك مشتت', 
    label_en: 'Disruptive Behavior', 
    icon: <AlertTriangle size={16} />,
    color: '#f97316',
    points: -3
  },
  { 
    id: 'inappropriate_language', 
    label_ar: 'لغة غير لائقة', 
    label_en: 'Inappropriate Language', 
    icon: <XCircle size={16} />,
    color: '#f97316',
    points: -4
  },
  { 
    id: 'other', 
    label_ar: 'أخرى', 
    label_en: 'Other', 
    icon: <HelpCircle size={16} />,
    color: '#f97316',
    points: 0
  }
];

// Helper functions
export const getBehaviorTypeById = (id) => {
  console.log('🔍 [getBehaviorTypeById] Looking for:', { id });
  console.log('🔍 [getBehaviorTypeById] Available types:', BEHAVIOR_TYPES.map(t => ({ id: t.id, color: t.color })));
  const found = BEHAVIOR_TYPES.find(type => type.id === id);
  console.log('🔍 [getBehaviorTypeById] Found result:', { found, foundId: found?.id, foundColor: found?.color });
  return found;
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
  console.log('🎨 [getBehaviorColor] Called with:', { id });
  const type = getBehaviorTypeById(id);
  console.log('🎨 [getBehaviorColor] Found type:', { type, typeId: type?.id, typeColor: type?.color });
  const color = type ? type.color : '#ef4444';
  console.log('🎨 [getBehaviorColor] Returning color:', { color, fallback: !type });
  return color;
};
