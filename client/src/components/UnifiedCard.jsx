import React, { memo } from 'react';
import { Button } from '@ui';
import { formatDateTime } from '@utils/date';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon, getWhiteIcon, getIconWithColor, getColoredIcon } from '@constants/iconTypes';
import { DIFFICULTY_TYPES } from '@constants/difficultyTypes';
import { ACTIVITY_TYPES } from '@constants/activityTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import logger from '@utils/logger';

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
  showStartButton = true
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const getTitle = () => {
    if (flavor === 'quiz') {
      return lang === 'ar'
          ? (item.title_ar || item.title_en || item.title || item.name || 'Untitled Quiz')
          : (item.title_en || item.title_ar || item.title || item.name || 'Untitled Quiz');
    }
    if (flavor === 'resource') {
      return lang === 'ar'
          ? (item.title_ar || item.title_en || item.title || item.id)
          : (item.title_en || item.title_ar || item.title || item.id);
    }
    if (flavor === 'announcements') {
      return lang === 'ar'
          ? (item.title_ar || item.title_en || item.title || item.message || 'Untitled Announcement')
          : (item.title_en || item.title_ar || item.title || item.message || 'Untitled Announcement');
    }
    return lang === 'ar'
        ? (item.title_ar || item.title_en || item.id)
        : (item.title_en || item.title_ar || item.id);
  };

  const getDescription = () => {
    if (flavor === RECORD_TYPES.QUIZ) {
      return lang === 'ar'
          ? (item.description_ar || item.description_en || item.description || '')
          : (item.description_en || item.description_ar || item.description || '');
    }
    if (flavor === RECORD_TYPES.RESOURCE) {
      return lang === 'ar'
          ? (item.description_ar || item.description_en || item.description || '—')
          : (item.description_en || item.description_ar || item.description || '—');
    }
    if (flavor === RECORD_TYPES.ANNOUNCEMENT) {
      return lang === 'ar'
          ? (item.message_ar || item.message_en || item.message || item.description || '—')
          : (item.message_en || item.message_ar || item.message || item.description || '—');
    }
    return lang === 'ar'
        ? (item.description_ar || item.description_en || '—')
        : (item.description_en || item.description_ar || '—');
  };

  const getTypeIcon = () => {
    if (flavor === RECORD_TYPES.QUIZ) {
      return getColoredIcon('ui', 'help', 14, '#7c3aed', theme);
    }
    if (flavor === RECORD_TYPES.RESOURCE) {
      if (item.type === 'video') {
        return getColoredIcon('ui', 'video', 14, '#3b82f6', theme);
      }
      if (item.type === 'link') {
        return getColoredIcon('ui', 'link', 14, '#3b82f6', theme);
      }
      return getColoredIcon('ui', 'file', 14, primaryColor, theme);
    }
    if (flavor === RECORD_TYPES.ANNOUNCEMENT) {
      return getColoredIcon('ui', 'megaphone', 14, '#dc2626', theme);
    }
    
    // For activities, use activity types constants
    const type = item.type || ACTIVITY_TYPES.TRAINING;
    if (type === ACTIVITY_TYPES.QUIZ) {
      return getColoredIcon('ui', 'help', 14, '#7c3aed', theme);
    }
    if (type === ACTIVITY_TYPES.HOMEWORK) {
      return getColoredIcon('ui', 'clipboard_list', 14, '#f57c00', theme);
    }
    return getColoredIcon('ui', 'book_open', 14, primaryColor, theme);
  };

  const getTypeLabel = () => {
    if (flavor === RECORD_TYPES.QUIZ) {
      return t('quiz') || 'Quiz';
    }
    if (flavor === RECORD_TYPES.RESOURCE) {
      // Use title case instead of uppercase
      const type = item.type || 'document';
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }
    if (flavor === RECORD_TYPES.ANNOUNCEMENT) {
      return t('announcement') || 'Announcement';
    }
    const type = item.type || ACTIVITY_TYPES.TRAINING;
    return t(type) || type;
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
    const type = item.type || ACTIVITY_TYPES.TRAINING;
    if (type === ACTIVITY_TYPES.QUIZ) return { bg: '#eef2ff', fg: '#4f46e5', border: '#e0e7ff' };
    if (type === ACTIVITY_TYPES.HOMEWORK) return { bg: '#fff3e0', fg: '#b45309', border: '#ffe0b2' };
    // For activities, use primary color for training type to unify
    if (type === ACTIVITY_TYPES.TRAINING) return { bg: `${primaryColor}15`, fg: primaryColor, border: `${primaryColor}40` };
    return { bg: '#e3f2fd', fg: '#1976d2', border: '#bbdefb' };
  };

  const getLevelColors = () => {
    const level = item.level || item.difficulty || 'beginner';
    if (level === 'intermediate') return { bg: '#fff7ed', fg: '#b45309' };
    if (level === 'advanced') return { bg: '#fee2e2', fg: '#b91c1c' };
    return { bg: '#e8f5e9', fg: '#2e7d32' };
  };

  const getLevelLabel = () => {
    const level = item.level || item.difficulty || 'beginner';
    return t(level) || level;
  };

  const formatDate = (date) => {
    if (!date) return '';
    if (date.seconds) {
      return formatDateTime(new Date(date.seconds * 1000));
    }
    if (date instanceof Date) {
      return formatDateTime(date);
    }
    return formatDateTime(new Date(date));
  };

  // Get primary color for border
  const cardBorderColor = primaryColor || '#800020';
  const cardBg = isDark ? '#1a1a1a' : '#fff';
  const cardText = isDark ? '#f8fafc' : '#111';
  const cardBorder = isDark ? `1px solid ${cardBorderColor}40` : `1px solid ${cardBorderColor}20`;
  const cardShadow = isDark
      ? `0 2px 8px ${cardBorderColor}25, 0 1px 3px rgba(0,0,0,0.3)`
      : `0 2px 8px ${cardBorderColor}15, 0 1px 3px rgba(0,0,0,0.06)`;

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
      }}>
        {/* Bookmark Button - Top Right Corner (matching Activities style) */}
        {onBookmark && (
            <button
                onClick={onBookmark}
                aria-label={isBookmarked ? t('remove_bookmark') || 'Remove bookmark' : t('add_bookmark') || 'Add bookmark'}
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
                  color: isBookmarked ? '#f5c518' : '#bbb'
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
              {isBookmarked ? (
                  getIconWithColor('ui', 'star', 18, '#fbbf24') // Gold color for bookmarked
              ) : (
                  getThemedIcon('ui', 'star_off', 18, theme)
              )}
            </button>
        )}

        {/* Featured Toggle Button - Below Bookmark */}
        {onFeatured && flavor === RECORD_TYPES.ANNOUNCEMENT && (
            <button
                onClick={onFeatured}
                aria-label={item.featured ? t('remove_featured') || 'Remove featured' : t('add_featured') || 'Add featured'}
                style={{
                  position: 'absolute',
                  top: 48,
                  [lang === 'ar' ? 'left' : 'right']: 10,
                  background: item.featured ? '#f59e0b' : (isDark ? '#374151' : 'white'),
                  border: item.featured ? '1px solid #f59e0b' : (isDark ? '1px solid #4b5563' : '1px solid #e5e7eb'),
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
                  color: item.featured ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')
                }}
                onMouseEnter={(e) => {
                  if (item.featured) {
                    e.currentTarget.style.background = '#d97706';
                    e.currentTarget.style.borderColor = '#d97706';
                  } else {
                    e.currentTarget.style.background = isDark ? '#4b5563' : '#f9fafb';
                    e.currentTarget.style.borderColor = isDark ? '#6b7280' : '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (item.featured) {
                    e.currentTarget.style.background = '#f59e0b';
                    e.currentTarget.style.borderColor = '#f59e0b';
                  } else {
                    e.currentTarget.style.background = isDark ? '#374151' : 'white';
                    e.currentTarget.style.borderColor = isDark ? '#4b5563' : '#e5e7eb';
                  }
                }}
            >
                {getIconWithColor('ui', 'star', 16, item.featured ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280'))}
            </button>
        )}

        {/* Title */}
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', paddingRight: onBookmark ? '2.5rem' : 0, color: cardText, fontSize: '1.15rem', fontWeight: '600' }}>
          <span>{getTitle()}</span>
          {item.featured && flavor === RECORD_TYPES.ANNOUNCEMENT && (
              <button
                  type="button"
                  title={t('featured') || 'Featured'}
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
          )}
        </h3>

        {/* Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {/* Description */}
          <p style={{ color: isDark ? '#94a3b8' : '#666', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
            {getDescription()}
          </p>

          {/* Spacer to push content to bottom */}
          <div style={{ flex: 1 }}></div>

          {/* Metadata Chips - Anchored at bottom */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {/* Level/Difficulty - simplified like filter chips */}
            {(item.level || item.difficulty) && (() => {
              const level = (item.level || item.difficulty || '').toLowerCase();
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
                    fontSize: '0.75rem',
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
              const type = (item.type || '').toLowerCase();
              let bg, fg, border;

              if (flavor === 'resource') {
                bg = typeColors.bg;
                fg = typeColors.fg;
                border = typeColors.border;
              } else {
                if (type === ACTIVITY_TYPES.TRAINING) {
                  bg = typeColors.bg;
                  fg = typeColors.fg;
                  border = typeColors.border;
                } else if (type === ACTIVITY_TYPES.HOMEWORK) {
                  bg = '#fff3e0'; fg = '#f57c00'; border = '#f57c00';
                } else if (type === ACTIVITY_TYPES.QUIZ) {
                  bg = '#f3e8ff'; fg = '#7c3aed'; border = '#7c3aed';
                } else {
                  bg = typeColors.bg || '#f3f4f6';
                  fg = typeColors.fg || '#374151';
                  border = typeColors.border || '#374151';
                }
              }

              return (
                  <span
                      className="filter-button"
                      title={getTypeLabel()}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        border: `1px solid ${border}`,
                        background: bg,
                        color: fg,
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                        cursor: 'default'
                      }}>
                {getTypeIcon()}
                    <span>{getTypeLabel()}</span>
              </span>
              );
            })()}

            {/* Quiz-specific: Question count */}
            {(flavor === 'quiz' && item.questions?.length) && (
                <span className="filter-button" style={{
                  background: getTypeColors().bg,
                  color: getTypeColors().fg,
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontSize: '0.75rem',
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
                  fontSize: '0.75rem',
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
                  fontSize: '0.75rem',
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

            {/* Required badge (for resources) */}
            {flavor === 'resource' && !item.optional && (
                <span className="filter-button" style={{
                  background: isDark ? 'rgba(185, 28, 28, 0.2)' : '#fee2e2',
                  color: '#b91c1c',
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid #b91c1c',
                  fontSize: '0.75rem',
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
          <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', fontSize: '0.75rem', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {/* Created Date */}
            {item.createdAt && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: isDark ? '#94a3b8' : '#16a34a'
                }} title={t('created_at') || 'Created at'}>
                  {getColoredIcon('ui', 'add', 12, '#16a34a', theme)}
                  <span>{formatDate(item.createdAt)}</span>
                </div>
            )}
            {isCompleted && completedAt && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#16a34a'
                }} title={t('completed_at') || 'Completed at'}>
                  {getColoredIcon('ui', 'check', 14, '#16a34a', theme)}
                  <span>{formatDate(completedAt)}</span>
                </div>
            )}
            {dueDate && !isCompleted && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#dc2626'
                }} title={t('due_date') || 'Due date'}>
                  {getColoredIcon('ui', 'calendar', 14, '#dc2626', theme)}
                  <span>{formatDate(dueDate)}</span>
                </div>
            )}

            {/* Action Buttons on the right */}
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              {onStart && showStartButton && (
                  flavor === RECORD_TYPES.ANNOUNCEMENT ? (
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
                      onClick={onStart}
                      aria-label={t('view') || 'View'}
                      title={t('view') || 'View'}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = isDark ? '#4b5563' : '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = isDark ? '#374151' : '#ffffff';
                      }}
                    >
                      {getThemedIcon('ui', 'eye', 14, theme)}
                    </button>
                  ) : (
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
                      onClick={onStart}
                      aria-label={t('start') || 'Start'}
                      title={t('start') || 'Start'}
                    >
                      {getWhiteIcon('ui', 'play', 14)}
                    </Button>
                  )
              )}

              {/* Complete button for activities, resources, homework, labels (except announcements) */}
              {onComplete && flavor !== RECORD_TYPES.ANNOUNCEMENT && (
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
                      onClick={onComplete}
                      aria-label={isCompleted ? t('mark_incomplete') || 'Mark incomplete' : t('mark_complete') || 'Mark complete'}
                      title={isCompleted ? t('completed') || 'Completed' : t('mark_complete') || 'Mark complete'}
                  >
                    {isCompleted ? (
                        getColoredIcon('ui', 'check', 14, '#16a34a', theme)
                    ) : (
                        getColoredIcon('ui', 'check', 14, '#16a34a', theme)
                    )}
                  </Button>
              )}
            </div>
          </div>
        </div>

        </div>
  );
});

export default UnifiedCard;
