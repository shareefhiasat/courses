/**
 * @deprecated Use useLookupTypes hook instead
 * This file is deprecated. All participation types should be fetched dynamically
 * from the backend API using the useLookupTypes hook with 'participation-types'.
 * 
 * Migration Example:
 * OLD: import { PARTICIPATION_TYPES } from '@constants/participationTypes';
 * NEW: const { data: lookupData } = useLookupTypes({ types: ['participation-types'] });
 *       const participationTypes = lookupData['participation-types'] || [];
 */

import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Participation Types Constants
 * 
 * Centralized constants for participation options used throughout the application.
 */

import { 
  MessageSquare, 
  Award, 
  FileText, 
  HelpCircle, 
  Users, 
  Star, 
  ThumbsUp, 
  Minus, 
  CheckCircle, 
  MoreHorizontal 
} from 'lucide-react';

// Participation Types
export const PARTICIPATION_TYPES = [
  { 
    id: 'explain_lesson', 
    label_ar: 'شرح الدرس', 
    label_en: 'Explained Lesson', 
    icon: <MessageSquare size={16} />,
    color: '#bfdbfe',
    points: 5
  },
  { 
    id: 'gave_project', 
    label_ar: 'قدم مشروع', 
    label_en: 'Gave Project', 
    icon: <Award size={16} />,
    color: '#bfdbfe',
    points: 10
  },
  { 
    id: 'gave_paper', 
    label_ar: 'قدم ورقة', 
    label_en: 'Gave Paper', 
    icon: <FileText size={16} />,
    color: '#bfdbfe',
    points: 8
  },
  { 
    id: 'gave_research', 
    label_ar: 'قدم بحث', 
    label_en: 'Gave Research', 
    icon: <FileText size={16} />,
    color: '#bfdbfe',
    points: 12
  },
  { 
    id: 'active_discussion', 
    label_ar: 'نقاش نشط', 
    label_en: 'Active Discussion', 
    icon: <MessageSquare size={16} />,
    color: '#bfdbfe',
    points: 3
  },
  { 
    id: 'answered_question', 
    label_ar: 'أجاب على سؤال', 
    label_en: 'Answered Question', 
    icon: <HelpCircle size={16} />,
    color: '#bfdbfe',
    points: 2
  },
  { 
    id: 'helped_classmate', 
    label_ar: 'ساعد زميل', 
    label_en: 'Helped Classmate', 
    icon: <Users size={16} />,
    color: '#bfdbfe',
    points: 4
  },
  { 
    id: 'excellent', 
    label_ar: 'مشاركة ممتازة', 
    label_en: 'Excellent Participation', 
    icon: <Star size={16} />,
    color: '#bfdbfe',
    points: 10
  },
  { 
    id: 'good', 
    label_ar: 'مشاركة جيدة', 
    label_en: 'Good Participation', 
    icon: <ThumbsUp size={16} />,
    color: '#bfdbfe',
    points: 5
  },
  { 
    id: 'average', 
    label_ar: 'مشاركة متوسطة', 
    label_en: 'Average Participation', 
    icon: <Minus size={16} />,
    color: '#bfdbfe',
    points: 2
  },
  // Positive behaviors moved from behaviorTypes.js
  { 
    id: 'positive', 
    label_ar: 'سلوك إيجابي', 
    label_en: 'Positive Behavior', 
    icon: <CheckCircle size={16} />,
    color: '#bfdbfe',
    points: 3
  },
  { 
    id: 'helpful', 
    label_ar: 'مفيد للآخرين', 
    label_en: 'Helpful to Others', 
    icon: <Users size={16} />,
    color: '#bfdbfe',
    points: 2
  },
  { 
    id: 'participation', 
    label_ar: 'مشاركة جيدة', 
    label_en: 'Good Participation', 
    icon: <CheckCircle size={16} />,
    color: '#bfdbfe',
    points: 1
  },
  { 
    id: 'other', 
    label_ar: 'أخرى', 
    label_en: 'Other', 
    icon: <MoreHorizontal size={16} />,
    color: '#bfdbfe',
    points: 0
  }
];

// Create PARTICIPATION_TYPE_ICONS object for easy access to icons
export const PARTICIPATION_TYPE_ICONS = PARTICIPATION_TYPES.reduce((acc, type) => {
  acc[type.id] = type.icon;
  return acc;
}, {});

// Helper functions
export const getParticipationTypeById = (id) => {
  return PARTICIPATION_TYPES.find(type => type.id === id);
};

export const getParticipationLabel = (id, lang = 'en') => {
  const type = getParticipationTypeById(id);
  return type ? (lang === 'ar' ? type.label_ar : type.label_en) : id;
};

export const getParticipationIcon = (id) => {
  const type = getParticipationTypeById(id);
  return type ? type.icon : 'Star';
};

export const getParticipationColor = (id) => {
  const type = getParticipationTypeById(id);
  return type ? type.color : '#3b82f6';
};
