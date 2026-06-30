import React, { memo } from 'react';
import { Button } from '@ui';
import { formatDateTime, formatDate } from '@utils/date';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon, getWhiteIcon, getIconWithColor, getColoredIcon } from '@constants/iconTypes';
import { DIFFICULTY_TYPES } from '@constants/difficultyTypes';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
// OLD: import { ACTIVITY_TYPES } from '@constants/activityTypes';
// NOW: Using useLookupTypes hook for all lookup data
import { getResourceTypeConfig } from '@constants/resourceTypes';
import { ACTIVITY_DISPLAY_NAMES } from '@constants/activityTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { info, error, warn, debug } from '@services/utils/logger.js';
import PortalTooltip from '@ui/PortalTooltip';

// Hardcoded Arabic fallback display names (used when LangContext translations are not loaded)
const ARABIC_ACTIVITY_DISPLAY_NAMES = {
  exam: 'امتحان',
  mid_exam: 'امتحان منتصف الفصل',
  final_exam: 'امتحان نهائي',
  quiz: 'اختبار',
  homework: 'واجب منزلي',
  assignment: 'مهمة',
  lab: 'معمل',
  lab_work: 'عمل معملي',
  lab_project: 'معمل ومشروع',
  workshop: 'ورشة عمل',
  training: 'تدريب',
  project: 'مشروع',
  presentation: 'عرض تقديمي',
  participation: 'مشاركة',
  field_trip: 'رحلة ميدانية',
  case_study: 'دراسة حالة',
  research: 'بحث',
  debate: 'مناظرة',
  seminar: 'ندوة',
  video: 'فيديو',
  reading: 'قراءة',
  activity: 'نشاط',
  link: 'رابط',
  announcement: 'إعلان',
  resource: 'مورد',
  unknown: 'غير معروف'
};

/**
 * Unified card component for activities, quizzes, resources, and home page items
 * @param {Object} props
 * @param {string} props.flavor - 'activity' | 'quiz' | 'resource' | 'home'
 * @param {Object} props.item - The item data (activity, quiz, resource, etc.)
 * @param {Function} props.onStart - Callback when start button is clicked
 * @param {Function} props.onDetails - Callback when details button is clicked
 * @param {Function} props.onComplete - Callback when complete button is clicked (for resources)
 * @param {Function} props.onBookmark - Callback when bookmark button is clicked
 * @param {boolean} props.isCompleted - Whether the item is completed
 * @param {Date|Object} props.completedAt - Completion timestamp
 * @param {boolean} props.isBookmarked - Whether the item is bookmarked
 * @param {Date|Object} props.dueDate - Due date for the item
 * @param {string} props.lang - Language ('en' | 'ar')
 * @param {Object} props.t - Translation function
 * @param {boolean} props.showStartButton - Whether to show the start button
 * @param {boolean} props.isReviewMode - Whether the card is in review mode
 * @param {number} props.scorePercent - Score percentage
 * @param {string} props.scoreColor - Score color
 * @param {string} props.scoreBg - Score background color
 * @param {string} props.submissionStatus - Submission status
 * @param {string} props.studentName - Student name
 * @param {Function} props.onReview - Callback when review button is clicked
 */
const UnifiedCard = memo(({
  flavor = 'activity',
  item,
  onStart,
  onDetails,
  onComplete,
  onBookmark,
  onFeatured,
  isCompleted = false,
  completedAt = null,
  isBookmarked = false,
  dueDate = null,
  lang = 'en',
  t = (key) => key,
  isMinified = false,
  primaryColor = '#800020',
  showStartButton = true,
  isReviewMode = false,
  scorePercent = null,
  scoreColor = '#6b7280',
  scoreBg = '#f3f4f6',
  submissionStatus = null,
  studentName = null,
  onReview = null
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { data: lookupData } = useLookupTypes({
    types: ['activity-types']
  });

  // Create activity type constants from lookup data
  const activityTypes = (lookupData['activity-types'] || []).reduce((acc, type) => {
    acc[type.code] = type.code;
    return acc;
  }, {});
  
  // Default to TRAINING if not found
  const ACTIVITY_TYPES = {
    QUIZ: activityTypes.QUIZ || 'QUIZ',
    HOMEWORK: activityTypes.HOMEWORK || 'HOMEWORK', 
    TRAINING: activityTypes.TRAINING || 'TRAINING',
    LAB_AND_PROJECT: activityTypes.LAB_AND_PROJECT || 'LAB_AND_PROJECT'
  };
  
  // Debug logs to track props
  if (flavor === 'quiz' || flavor === RECORD_TYPES.QUIZ) {
    console.log('[UnifiedCard] Quiz card props:', {
      flavor,
      item: {
        docId: item.docId,
        title: item.titleEn || item.title,
        featured: item.featured,
        dueDate: item.dueDate,
        estimatedTime: item.estimatedTime,
        type: item.type
      },
      dueDate,
      isCompleted,
      isBookmarked
    });
  }
  const getTitle = () => {
    if (flavor === RECORD_TYPES.QUIZ) {
      return lang === 'ar'
          ? (item.titleAr || item.title || item.name || 'Untitled Quiz')
          : (item.titleEn || item.title || item.name || 'Untitled Quiz');
    }
    if (flavor === RECORD_TYPES.RESOURCE) {
      return lang === 'ar'
          ? (item.titleAr || item.title || item.id)
          : (item.titleEn || item.title || item.id);
    }
    if (flavor === RECORD_TYPES.ANNOUNCEMENT) {
      return lang === 'ar'
          ? (item.titleAr || item.title || '—')
          : (item.titleEn || item.title || '—');
    }
    return lang === 'ar'
        ? (item.titleAr || item.id)
        : (item.titleEn || item.id);
  };

  const getDescription = () => {
    if (flavor === RECORD_TYPES.QUIZ) {
      return lang === 'ar'
          ? (item.descriptionAr || item.description || '')
          : (item.descriptionEn || item.description || '');
    }
    if (flavor === RECORD_TYPES.RESOURCE) {
      return lang === 'ar'
          ? (item.descriptionAr || item.description || '—')
          : (item.descriptionEn || item.description || '—');
    }
    if (flavor === RECORD_TYPES.ANNOUNCEMENT) {
      return lang === 'ar'
          ? (item.contentAr || item.content || item.messageAr || item.message || item.description || '')
          : (item.content || item.contentAr || item.message || item.messageAr || item.description || '');
    }
    return lang === 'ar'
        ? (item.descriptionAr || '—')
        : (item.descriptionEn || '—');
  };

  const isHtmlContent = () => {
    const desc = getDescription();
    return typeof desc === 'string' && (desc.includes('<p>') || desc.includes('<b>') || desc.includes('<ul>') || desc.includes('<ol>') || desc.includes('<h') || desc.includes('<br'));
  };

  const getTypeIcon = (iconColor) => {
    if (flavor === RECORD_TYPES.QUIZ) {
      return getIconWithColor('ui', 'help', 14, iconColor || '#7c3aed');
    }
    if (flavor === RECORD_TYPES.RESOURCE) {
      const resourceConfig = getResourceTypeConfig(item.type || 'document', theme, lang);
      return resourceConfig.icon;
    }
    if (flavor === RECORD_TYPES.ANNOUNCEMENT) {
      return getIconWithColor('ui', 'megaphone', 14, iconColor || '#dc2626');
    }
    
    // For activities, use activity types constants
    const rawType = item.type;
    const type = typeof rawType === 'string' ? rawType : (rawType?.code || rawType?.name || ACTIVITY_TYPES.TRAINING);
    if (type === ACTIVITY_TYPES.QUIZ) {
      return getIconWithColor('ui', 'help', 14, iconColor || '#7c3aed');
    }
    if (type === ACTIVITY_TYPES.HOMEWORK) {
      return getIconWithColor('ui', 'clipboard_list', 14, iconColor || '#f57c00');
    }
    if (type === ACTIVITY_TYPES.TRAINING) {
      return getIconWithColor('ui', 'book_open', 14, iconColor || '#0284c7');
    }
    if (type === ACTIVITY_TYPES.LAB_AND_PROJECT) {
      return getIconWithColor('ui', 'wrench', 14, iconColor || '#7c3aed');
    }
    return getIconWithColor('ui', 'book_open', 14, iconColor || primaryColor);
  };

  const getTypeLabel = () => {
    if (flavor === RECORD_TYPES.QUIZ) {
      const label = t('activity_type_quiz') || t('quiz') || 'quiz';
      return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    }
    if (flavor === RECORD_TYPES.RESOURCE) {
      // Use title case (first letter uppercase, rest lowercase)
      const rawType = item.type;
      const type = (typeof rawType === 'string' ? rawType : (rawType?.code || rawType?.name || 'document')).toLowerCase();
      const key = `activity_type_${type}`;
      const translated = t(key);
      const fallbackText = key.replaceAll('_', ' ');
      const fallbackName = lang === 'ar'
        ? (ARABIC_ACTIVITY_DISPLAY_NAMES[type] || ARABIC_ACTIVITY_DISPLAY_NAMES[type.replace('_work', '')] || type)
        : (ACTIVITY_DISPLAY_NAMES[type] || type);
      const label = translated === fallbackText ? fallbackName : translated;
      return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    }
    if (flavor === RECORD_TYPES.ANNOUNCEMENT) {
      const label = t('activity_type_announcement') || t('announcement') || 'announcement';
      return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    }
    const rawType = item.type;
    const type = (typeof rawType === 'string' ? rawType : (rawType?.code || rawType?.name || ACTIVITY_TYPES.TRAINING)).toLowerCase();
    const key = `activity_type_${type}`;
    const translated = t(key);
    const fallbackText = key.replaceAll('_', ' ');
    const fallbackName = lang === 'ar'
      ? (ARABIC_ACTIVITY_DISPLAY_NAMES[type] || ARABIC_ACTIVITY_DISPLAY_NAMES[type.replace('_work', '')] || type)
      : (ACTIVITY_DISPLAY_NAMES[type] || type);
    const label = translated === fallbackText ? fallbackName : translated;
    return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  };

  const getTypeColors = () => {
    if (flavor === RECORD_TYPES.QUIZ) {
      return { bg: '#eef2ff', fg: '#4f46e5', border: '#e0e7ff' };
    }
    if (flavor === RECORD_TYPES.RESOURCE) {
      // Use blue colors for all resource types to match the blue icons
      return { bg: '#dbeafe', fg: '#3b82f6', border: '#93c5fd' };
    }
    if (flavor === RECORD_TYPES.ANNOUNCEMENT) {
      return { bg: '#fee2e2', fg: '#dc2626', border: '#fecaca' };
    }
    const rawType = item.type;
    const type = typeof rawType === 'string' ? rawType : (rawType?.code || rawType?.name || ACTIVITY_TYPES.TRAINING);
    if (type === ACTIVITY_TYPES.QUIZ) return { bg: '#eef2ff', fg: '#4f46e5', border: '#e0e7ff' };
    if (type === ACTIVITY_TYPES.HOMEWORK) return { bg: '#fff3e0', fg: '#b45309', border: '#ffe0b2' };
    if (type === ACTIVITY_TYPES.TRAINING) return { bg: '#e0f2fe', fg: '#0284c7', border: '#bae6fd' };
    if (type === ACTIVITY_TYPES.LAB_AND_PROJECT) return { bg: '#f3e8ff', fg: '#7c3aed', border: '#e9d5ff' };
    // For activities, use primary color for other types to unify
    return { bg: `${primaryColor}15`, fg: primaryColor, border: `${primaryColor}40` };
  };

  const getLevelColors = () => {
    const rawLevel = item.level || item.difficulty;
    const level = typeof rawLevel === 'string' ? rawLevel : (rawLevel?.code || rawLevel?.name || 'beginner');
    if (level === 'intermediate') return { bg: '#fff7ed', fg: '#b45309' };
    if (level === 'advanced') return { bg: '#fee2e2', fg: '#b91c1c' };
    return { bg: '#e8f5e9', fg: '#2e7d32' };
  };

  const getLevelLabel = () => {
    const rawLevel = item.level || item.difficulty;
    const level = typeof rawLevel === 'string' ? rawLevel : (rawLevel?.code || rawLevel?.name || 'beginner');
    return t(level) || level;
  };


  // Get primary color for border
  const cardBorderColor = primaryColor || '#800020';
  const cardBg = isDark ? '#1a1a1a' : '#fff';
  const cardText = isDark ? '#f8fafc' : '#111';
  const cardBorder = isDark ? `1px solid ${cardBorderColor}40` : `1px solid ${cardBorderColor}20`;
  const cardShadow = isDark
      ? `0 2px 8px ${cardBorderColor}25, 0 1px 3px rgba(0,0,0,0.3)`
      : `0 2px 8px ${cardBorderColor}15, 0 1px 3px rgba(0,0,0,0.06)`;
  const cardHoverShadow = isDark
      ? `0 4px 16px ${cardBorderColor}45, 0 2px 6px rgba(0,0,0,0.4)`
      : `0 4px 16px ${cardBorderColor}35, 0 2px 6px rgba(0,0,0,0.1)`;

  return (
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: cardBg,
        borderRadius: 12,
        padding: '1rem',
        border: cardBorder,
        boxShadow: cardShadow,
        minHeight: '340px', // Made taller from 200px
        transition: 'all 0.2s',
        color: cardText
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = cardHoverShadow;
        e.currentTarget.style.borderColor = `${cardBorderColor}60`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = cardShadow;
        e.currentTarget.style.border = cardBorder;
      }}
    >
        {/* Score Badge - Top Right Corner (review mode) */}
        {isReviewMode && scorePercent !== null && (
          <div
            aria-label={`Score: ${scorePercent}%`}
            style={{
              position: 'absolute',
              top: 10,
              [lang === 'ar' ? 'left' : 'right']: 10,
              background: scoreBg,
              color: scoreColor,
              border: `1px solid ${scoreColor}40`,
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              zIndex: 10,
              letterSpacing: '0.02em'
            }}
          >
            {scorePercent}%
          </div>
        )}

        {/* Bookmark Button - Top Right Corner */}
        {onBookmark && !isReviewMode && (
          <PortalTooltip content={`${isBookmarked ? t('click_to_remove_bookmark') : t('click_to_add_bookmark')} (${isBookmarked ? t('bookmarked') : t('not_bookmarked')})`} position="top">
          <button
            onClick={() => {
            onBookmark();
          }}
            aria-label={`${isBookmarked ? t('remove_bookmark') : t('add_bookmark')} - ${isBookmarked ? t('currently_bookmarked') : t('not_bookmarked')}`}
            style={{
              position: 'absolute',
              top: 10,
              [lang === 'ar' ? 'left' : 'right']: 10,
              background: isDark ? '#374151' : 'white',
              border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
              borderRadius: 20,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? '#4b5563' : '#f9fafb';
              e.currentTarget.style.borderColor = isDark ? '#6b7280' : '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? '#374151' : 'white';
              e.currentTarget.style.borderColor = isDark ? '#4b5563' : '#e5e7eb';
            }}
          >
            {isBookmarked
              ? getIconWithColor('ui', 'star', 18, '#fbbf24')
              : getThemedIcon('ui', 'star_off', 18, theme)}
          </button>
          </PortalTooltip>
        )}

        {/* Title */}
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', paddingRight: (onBookmark && !isReviewMode) || (isReviewMode && scorePercent !== null) ? '2.5rem' : 0, color: cardText, fontSize: '1.15rem', fontWeight: '600' }}>
          <span>{getTitle()}</span>
          {item.featured && (
              <PortalTooltip content={t('featured')} position="top">
              <button
                  type="button"
                  style={{
                    width: 28,
                    height: 28,
                    padding: 0,
                    borderRadius: 999,
                    border: '1px solid #c7d2fe',
                    background: '#4f46e5',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'default'
                  }}
              >
                {getWhiteIcon('ui', 'pin', 14)}
              </button>
              </PortalTooltip>
          )}
        </h3>

        {/* Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {/* Description */}
          {isHtmlContent() ? (
            <div
              style={{ color: isDark ? '#94a3b8' : '#666', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}
              dangerouslySetInnerHTML={{ __html: getDescription() }}
            />
          ) : (
            <p style={{ color: isDark ? '#94a3b8' : '#666', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
              {getDescription()}
            </p>
          )}

          {/* Student name in review mode */}
          {isReviewMode && studentName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#6b7280', marginTop: '0.25rem' }}>
              {getColoredIcon('ui', 'user', 12, '#6b7280', theme)}
              <span>{studentName}</span>
            </div>
          )}

          {/* Spacer to push content to bottom */}
          <div style={{ flex: 1 }}></div>

          {/* Metadata Chips - Anchored at bottom */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {/* Level/Difficulty - simplified like filter chips */}
            {(item.level || item.difficulty) && (() => {
              const rawLevel = item.level || item.difficulty;
              const level = (typeof rawLevel === 'string' ? rawLevel : (rawLevel?.code || rawLevel?.name || '')).toLowerCase();
              let bg, fg, border;
              if (level === DIFFICULTY_TYPES.BEGINNER) {
                bg = '#dcfce7'; fg = '#166534'; border = '#166534';
              } else if (level === DIFFICULTY_TYPES.INTERMEDIATE) {
                bg = '#fed7aa'; fg = '#c2410c'; border = '#c2410c';
              } else if (level === DIFFICULTY_TYPES.ADVANCED) {
                bg = '#fecaca'; fg = '#dc2626'; border = '#dc2626';
              } else {
                bg = '#f3f4f6'; fg = '#374151'; border = '#374151';
              }
              return (
                  <span className="filter-button" style={{
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: `1px solid ${border}`,
                    background: bg,
                    color: fg,
                    fontSize: 'var(--font-size-xs)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontWeight: 600,
                    cursor: 'default'
                  }}>
                {getColoredIcon('ui', 'award', 12, fg, theme)}
                <span>{getLevelLabel()}</span>
              </span>
              );
            })()}

            {/* Type - simplified like filter chips */}
            {(() => {
              const typeColors = getTypeColors();
              const rawType = item.type;
              const type = (typeof rawType === 'string' ? rawType : (rawType?.code || rawType?.name || '')).toLowerCase();
              let bg, fg, border;

              if (flavor === 'resource') {
                bg = typeColors.bg;
                fg = typeColors.fg;
                border = typeColors.border;
              } else {
                if (type === (ACTIVITY_TYPES.TRAINING || '').toLowerCase()) {
                  bg = '#e0f2fe'; fg = '#0284c7'; border = '#0284c7';
                } else if (type === (ACTIVITY_TYPES.LAB_AND_PROJECT || '').toLowerCase()) {
                  bg = '#f3e8ff'; fg = '#7c3aed'; border = '#7c3aed';
                } else if (type === (ACTIVITY_TYPES.HOMEWORK || '').toLowerCase()) {
                  bg = '#fff3e0'; fg = '#f57c00'; border = '#f57c00';
                } else if (type === (ACTIVITY_TYPES.QUIZ || '').toLowerCase()) {
                  bg = '#f3e8ff'; fg = '#7c3aed'; border = '#7c3aed';
                } else {
                  bg = typeColors.bg || '#f3f4f6';
                  fg = typeColors.fg || '#374151';
                  border = typeColors.border || '#374151';
                }
              }

              return (
                  <PortalTooltip content={getTypeLabel()} position="top">
                  <span
                      className="filter-button"
                      style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        border: `1px solid ${border}`,
                        background: bg,
                        color: fg,
                        fontSize: 'var(--font-size-xs)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                        cursor: 'default'
                      }}>
                {getTypeIcon(fg)}
                    <span>{getTypeLabel()}</span>
              </span>
              </PortalTooltip>
              );
            })()}

            {/* Quiz-specific: Question count */}
            {(flavor === 'quiz' && item.questions?.length) && (
                <span className="filter-button" style={{
                  background: getTypeColors().bg,
                  color: getTypeColors().fg,
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontSize: 'var(--font-size-xs)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 600,
                  cursor: 'default'
                }}>
              {getTypeIcon()} {item.questions.length} {t('questions') || 'questions'}
            </span>
            )}

            {/* Estimated time */}
            {item.estimatedTime && (
                <span className="filter-button" style={{
                  background: isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7',
                  color: '#d97706',
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid #d97706',
                  fontSize: 'var(--font-size-xs)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 600,
                  cursor: 'default'
                }}>
              {getColoredIcon('ui', 'clock', 12, '#d97706', theme)} {item.estimatedTime} {t('min') || 'min'}
            </span>
            )}

            {/* Optional badge */}
            {item.optional && (
                <span className="filter-button" style={{
                  background: isDark ? 'rgba(245, 124, 0, 0.2)' : '#fff3e0',
                  color: '#f57c00',
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid #f57c00',
                  fontSize: 'var(--font-size-xs)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 600,
                  cursor: 'default'
                }}>
              {getColoredIcon('ui', 'book_open', 10, '#f57c00', theme)}
                {!isMinified && <span>{t('optional') || 'Optional'}</span>}
            </span>
            )}

            {/* Retakable badge */}
            {(item.allowRetake || item.settings?.allowRetake) && (
                <span className="filter-button" style={{
                  background: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                  color: '#3b82f6',
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid #3b82f6',
                  fontSize: 'var(--font-size-xs)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 600,
                  cursor: 'default'
                }}>
              {getColoredIcon('ui', 'repeat', 12, '#3b82f6', theme)}
                {!isMinified && <span>{t('retakable') || 'Retakable'}</span>}
            </span>
            )}

            {/* Required badge (for resources) */}
            {flavor === 'resource' && !item.optional && (
                <span className="filter-button" style={{
                  background: isDark ? 'rgba(185, 28, 28, 0.2)' : '#fee2e2',
                  color: '#b91c1c',
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid #b91c1c',
                  fontSize: 'var(--font-size-xs)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 600,
                  cursor: 'default'
                }}>
              {getColoredIcon('ui', 'alert_circle', 14, '#b91c1c', theme)}
                {!isMinified && <span>{t('required') || 'Required'}</span>}
            </span>
            )}
          </div>

          {/* Dates - Side by side with buttons */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', fontSize: 'var(--font-size-xs)', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {/* Created Date */}
            {item.createdAt && (
                <PortalTooltip content={t('created_at')} position="top">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: isDark ? '#94a3b8' : '#16a34a'
                }}>
                  {getColoredIcon('ui', 'add', 12, '#16a34a', theme)}
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </PortalTooltip>
            )}
            {isCompleted && completedAt && (
                <PortalTooltip content={t('completed_at')} position="top">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#16a34a'
                }}>
                  {getIconWithColor('ui', 'check', 14, '#16a34a')}
                  <span>{formatDate(completedAt)}</span>
                </div>
              </PortalTooltip>
            )}
            {dueDate && !isCompleted && (
                <PortalTooltip content={t('due_date')} position="top">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#dc2626'
                }}>
                  {getColoredIcon('ui', 'calendar', 14, '#dc2626', theme)}
                  <span>{formatDate(dueDate)}</span>
                </div>
              </PortalTooltip>
            )}

            {/* Action Buttons on the right */}
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              {/* View Results button - review mode primary action */}
              {isReviewMode && onReview && (
                <PortalTooltip content={t('view_results')} position="top">
                <Button
                  variant="outline"
                  size="small"
                  style={{
                    height: 28,
                    padding: '0 10px',
                    borderRadius: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    borderColor: scoreColor,
                    color: scoreColor
                  }}
                  onClick={onReview}
                  aria-label={t('view_results')}
                >
                  {getColoredIcon('ui', 'eye', 12, scoreColor, theme)}
                  {!isMinified && <span>{t('view_results')}</span>}
                </Button>
              </PortalTooltip>
              )}
              {onStart && showStartButton && !isReviewMode && (
                  flavor === RECORD_TYPES.ANNOUNCEMENT ? (
                    <PortalTooltip content={t('view')} position="top">
                    <button
                      style={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => onStart(item)}
                      aria-label={t('view') || 'View'}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = isDark ? '#4b5563' : '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = isDark ? '#374151' : '#ffffff';
                      }}
                    >
                      {getThemedIcon('ui', 'eye', 14, theme)}
                    </button>
                    </PortalTooltip>
                  ) : (
                    <PortalTooltip content={t('start')} position="top">
                    <Button
                      variant="success"
                      size="small"
                      style={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => onStart(item)}
                      aria-label={t('start') || 'Start'}
                    >
                      {getWhiteIcon('ui', 'play', 14)}
                    </Button>
                    </PortalTooltip>
                  )
              )}

              {/* Complete button for activities, resources, homework, labels (except announcements, not in review mode) */}
              {onComplete && flavor !== RECORD_TYPES.ANNOUNCEMENT && !isReviewMode && (
                  <PortalTooltip content={(
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {getIconWithColor('ui', 'check', 14, '#fff')}
                      <span>{isCompleted ? t('completed') : t('mark_complete')}</span>
                    </span>
                  )} position="top">
                  <Button
                      variant={isCompleted ? 'success' : 'outline'}
                      size="small"
                      style={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={(e) => {
                        console.log('[UnifiedCard] Complete button clicked:', {
                          flavor,
                          item,
                          isCompleted,
                          itemId: item.docId || item.id
                        });
                        e.stopPropagation();
                        onComplete(item);
                      }}
                      aria-label={isCompleted ? t('mark_incomplete') || 'Mark incomplete' : t('mark_complete') || 'Mark complete'}
                  >
                    {isCompleted ? (
                        getWhiteIcon('ui', 'check', 14)
                    ) : (
                        getColoredIcon('ui', 'check', 14, '#16a34a', theme)
                    )}
                  </Button>
                  </PortalTooltip>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar - review mode */}
        {isReviewMode && scorePercent !== null && (
          <div
            role="progressbar"
            aria-valuenow={scorePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              borderRadius: '0 0 12px 12px',
              background: isDark ? '#374151' : '#e5e7eb',
              overflow: 'hidden'
            }}
          >
            <div style={{
              height: '100%',
              width: `${scorePercent}%`,
              background: scoreColor,
              transition: 'width 0.4s ease'
            }} />
          </div>
        )}

        </div>
  );
});

export default UnifiedCard;
