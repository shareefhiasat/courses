import React from 'react';
import { Button } from './ui';
import { Play, Info, BookOpen, ClipboardList, HelpCircle, Award, Clock, Repeat, CheckCircle, Star, StarOff, Check, AlertCircle, Link2, Video, FileText, Plus, Pin, Calendar } from 'lucide-react';
import { formatDateTime } from '../utils/date';
import { useTheme } from '../contexts/ThemeContext';

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
 */
export default function UnifiedCard({ 
  flavor = 'activity', 
  item, 
  onStart, 
  onDetails,
  onComplete,
  onBookmark,
  isCompleted = false,
  completedAt = null,
  isBookmarked = false,
  dueDate = null,
  lang = 'en',
  t = (key) => key,
  isMinified = false,
  primaryColor = '#800020'
}) {
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
    return lang === 'ar' 
      ? (item.title_ar || item.title_en || item.id) 
      : (item.title_en || item.title_ar || item.id);
  };

  const getDescription = () => {
    if (flavor === 'quiz') {
      return lang === 'ar'
        ? (item.description_ar || item.description_en || item.description || '')
        : (item.description_en || item.description_ar || item.description || '');
    }
    if (flavor === 'resource') {
      return lang === 'ar' 
        ? (item.description_ar || item.description_en || item.description || '—') 
        : (item.description_en || item.description_ar || item.description || '—');
    }
    return lang === 'ar' 
      ? (item.description_ar || item.description_en || '—') 
      : (item.description_en || item.description_ar || '—');
  };

  const getTypeIcon = () => {
    if (flavor === 'quiz') {
      return <HelpCircle size={14} />;
    }
    if (flavor === 'resource') {
      if (item.type === 'video') return <Video size={14} />;
      if (item.type === 'link') return <Link2 size={14} />;
      return <FileText size={14} />;
    }
    const type = item.type || 'training';
    if (type === 'quiz') return <HelpCircle size={14} />;
    if (type === 'homework') return <ClipboardList size={14} />;
    return <BookOpen size={14} />;
  };

  const getTypeLabel = () => {
    if (flavor === 'quiz') {
      return t('quiz') || 'Quiz';
    }
    if (flavor === 'resource') {
      // Use title case instead of uppercase
      const type = item.type || 'document';
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }
    const type = item.type || 'training';
    return t(type) || type;
  };

  const getTypeColors = () => {
    if (flavor === 'quiz') {
      return { bg: '#eef2ff', fg: '#4f46e5', border: '#e0e7ff' };
    }
    if (flavor === 'resource') {
      // Use primary color for all resource types to unify look
      return { bg: `${primaryColor}15`, fg: primaryColor, border: `${primaryColor}40` };
    }
    const type = item.type || 'training';
    if (type === 'quiz') return { bg: '#eef2ff', fg: '#4f46e5', border: '#e0e7ff' };
    if (type === 'homework') return { bg: '#fff3e0', fg: '#b45309', border: '#ffe0b2' };
    // For activities, use primary color for training type to unify
    if (type === 'training') return { bg: `${primaryColor}15`, fg: primaryColor, border: `${primaryColor}40` };
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
      padding: '0.75rem', 
      border: cardBorder,
      boxShadow: cardShadow,
      minHeight: '200px',
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
            background: 'white',
            border: '1px solid #e5e7eb',
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
            e.currentTarget.style.background = '#f9fafb';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          {isBookmarked ? (
            <Star size={18} fill="#fbbf24" color="#f59e0b" />
          ) : (
            <StarOff size={18} color="#6b7280" />
          )}
        </button>
      )}

      {/* Title */}
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', paddingRight: onBookmark ? '2.5rem' : 0, color: cardText }}>
        <span>{getTitle()}</span>
        {item.featured && (
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
            <Pin size={14} />
          </button>
        )}
        {(item.allowRetake || item.retakeAllowed) && (
          <button
            type="button"
            title={t('retake_allowed') || 'Retake Allowed'} 
            style={{ 
              width: 28,
              height: 28,
              padding: 0,
              borderRadius: 999,
              border: '1px solid #bae6fd',
              background: '#ecfeff',
              color: '#0ea5e9',
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'default'
            }}
          >
            <Repeat size={14} />
          </button>
        )}
      </h3>

      {/* Description */}
      <p style={{ color: isDark ? '#94a3b8' : '#666', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
        {getDescription()}
      </p>

      {/* Metadata Chips */}
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        {/* Level/Difficulty - styled like filter chips */}
        {(item.level || item.difficulty) && (() => {
          const levelColors = getLevelColors();
          const level = (item.level || item.difficulty || '').toLowerCase();
          let bg, fg, border;
          if (level === 'beginner') {
            bg = '#e8f5e9'; fg = '#2e7d32'; border = '#2e7d32';
          } else if (level === 'intermediate') {
            bg = '#fff7ed'; fg = '#b45309'; border = '#b45309';
          } else if (level === 'advanced') {
            bg = '#fee2e2'; fg = '#b91c1c'; border = '#b91c1c';
          } else {
            bg = levelColors.background || '#f3f4f6';
            fg = levelColors.color || '#374151';
            border = levelColors.color || '#374151';
          }
          return (
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: 999, 
              border: `1px solid ${border}`, 
              background: bg, 
              color: fg, 
              fontSize: '0.75rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 4,
              fontWeight: 600
            }}>
              <Award size={12} />
              <span>{getLevelLabel()}</span>
            </span>
          );
        })()}

        {/* Type - styled like filter chips - use theme color for resources and training */}
        {(() => {
          const typeColors = getTypeColors();
          const type = (item.type || '').toLowerCase();
          let bg, fg, border;
          
          if (flavor === 'resource') {
            // Use theme color for all resource types
            bg = typeColors.bg;
            fg = typeColors.fg;
            border = typeColors.border;
          } else {
            // Activities - use theme color for training, keep others distinct
            if (type === 'training') {
              bg = typeColors.bg;
              fg = typeColors.fg;
              border = typeColors.border;
            } else if (type === 'homework') {
              bg = '#fff3e0'; fg = '#f57c00'; border = '#f57c00';
            } else if (type === 'quiz') {
              bg = '#f3e8ff'; fg = '#7c3aed'; border = '#7c3aed';
            } else {
              bg = typeColors.bg || '#f3f4f6';
              fg = typeColors.fg || '#374151';
              border = typeColors.border || '#374151';
            }
          }
          
          return (
            <span 
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
                fontWeight: 600
              }}>
              {getTypeIcon()}
              <span>{getTypeLabel()}</span>
            </span>
          );
        })()}

        {/* Quiz-specific: Question count */}
        {(flavor === 'quiz' && item.questions?.length) && (
          <span style={{ 
            background: '#f3e8ff', 
            color: '#7c3aed', 
            padding: '0.25rem 0.75rem', 
            borderRadius: 12, 
            fontSize: '0.85rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6 
          }}>
            <HelpCircle size={14} /> {item.questions.length} {t('questions') || 'questions'}
          </span>
        )}

        {/* Estimated time */}
        {item.estimatedTime && (
          <span style={{ 
            background: '#fef3c7', 
            color: '#d97706', 
            padding: '4px 8px', 
            borderRadius: 999, 
            border: '1px solid #d97706',
            fontSize: '0.75rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 4,
            fontWeight: 600
          }}>
            <Clock size={12} /> {item.estimatedTime} {t('min') || 'min'}
          </span>
        )}

        {/* Optional badge */}
        {item.optional && (
          <span style={{ 
            background: '#fff3e0', 
            color: '#f57c00', 
            padding: isMinified ? '4px 8px' : '6px 12px', 
            borderRadius: 999, 
            border: '1px solid #f57c00',
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: isMinified ? 0 : 6,
            fontWeight: 600
          }}>
            <BookOpen size={14} />
            {!isMinified && <span>{t('optional') || 'Optional'}</span>}
          </span>
        )}

        {/* Required badge (for resources) */}
        {flavor === 'resource' && !item.optional && (
          <span style={{ 
            background: '#fee2e2', 
            color: '#b91c1c', 
            padding: isMinified ? '4px 8px' : '6px 12px', 
            borderRadius: 999,
            border: '1px solid #b91c1c',
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: isMinified ? 0 : 6,
            fontWeight: 600
          }}>
            <AlertCircle size={14} />
            {!isMinified && <span>{t('required') || 'Required'}</span>}
          </span>
        )}
      </div>

      {/* Created Date & Completed Status & Due Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.75rem' }}>
        {/* Created Date */}
        {item.createdAt && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            color: isDark ? '#94a3b8' : '#6b7280'
          }} title={t('created_at') || 'Created at'}>
            <Plus size={12} />
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
            <CheckCircle size={14} />
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
            <Calendar size={14} />
            <span><strong>{t('due') || 'Due'}:</strong> {formatDate(dueDate)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons - Icon only */}
      <div style={{ display: 'flex', gap: '0.375rem', marginTop: 'auto', alignItems: 'center' }}>
        {onStart && (
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
            <Play size={14} />
          </Button>
        )}

        {onComplete && flavor === 'resource' && (
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
              <CheckCircle size={14} />
            ) : (
              <Check size={14} />
            )}
          </Button>
        )}

        {/* Details button removed - not needed in main screens */}
      </div>
    </div>
  );
}
