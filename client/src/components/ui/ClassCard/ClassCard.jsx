import React from 'react';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { createClassStatBadge, CLASS_STAT_CONFIGS } from '@constants/iconTypes';
import ClassCardScheduleSection from '../../ClassCardScheduleSection.jsx';
import { getLocalizedInstructorName as resolveLocalizedInstructorName } from '@utils/schedulingDisplayUtils';

const ClassCard = ({
  cls,
  classStats,
  primaryColor,
  theme,
  t,
  onViewClass,
  onSessionSelect,
  showInstructorInfo = true
}) => {
  const { lang, isRTL } = useLang();
  const clsId = cls.docId || cls.id;
  const statsLoaded = Object.prototype.hasOwnProperty.call(classStats, clsId);
  const sessionCount = classStats[clsId]?.sessions ?? 0;
  const hasSessions = statsLoaded && sessionCount > 0;
  const isEmptySchedule = statsLoaded && !hasSessions;
  const instructor = cls.instructorData;

// Helper function to get localized class name
  const getLocalizedClassName = (cls) => {
    if (lang === 'ar' && cls.nameAr) {
      return cls.nameAr;
    }
    return cls.name || cls.code || t('classcard_unnamed_class');
  };

  // Helper function to format term with year
  const formatTermWithYear = (cls) => {
    const term = cls.term || '';
    const year = cls.year || new Date().getFullYear();
    
    if (term) {
      return `${term} ${year}`;
    }
    
    // If no term, just show year
    return year.toString();
  };

  // Helper function to get localized instructor name
  const getLocalizedInstructorName = (instructor) =>
    resolveLocalizedInstructorName(instructor, lang, t('classcard_instructor'));
  
  // Helper function to get instructor initials
  const getInstructorInitials = (instructor) => {
    if (!instructor) return 'I';
    
    // Try to get initials from multiple sources
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName.charAt(0).toUpperCase()}${instructor.lastName.charAt(0).toUpperCase()}`;
    }
    
    if (instructor.realName) {
      const names = instructor.realName.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0).toUpperCase()}${names[names.length - 1].charAt(0).toUpperCase()}`;
      }
      return instructor.realName.charAt(0).toUpperCase();
    }
    
    if (instructor.displayName && instructor.displayName.trim()) {
      const names = instructor.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0).toUpperCase()}${names[names.length - 1].charAt(0).toUpperCase()}`;
      }
      return instructor.displayName.charAt(0).toUpperCase();
    }
    
    // Extract initials from email as last resort
    if (instructor.email) {
      const emailName = instructor.email.split('@')[0];
      const names = emailName.replace(/[._-]/g, ' ').split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0).toUpperCase()}${names[1].charAt(0).toUpperCase()}`;
      }
      return emailName.charAt(0).toUpperCase();
    }
    
    return 'I';
  };

  return (
    <div
      key={clsId}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: isEmptySchedule
          ? (theme === 'dark' ? '#111827' : '#f3f4f6')
          : (theme === 'dark' ? '#1f2937' : '#ffffff'),
        border: isEmptySchedule
          ? `1px dashed ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`
          : `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '1rem',
        cursor: onViewClass ? 'pointer' : 'default',
        opacity: isEmptySchedule ? 0.88 : 1,
        transition: 'all 0.2s ease',
        boxShadow: isEmptySchedule
          ? 'none'
          : (theme === 'dark'
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'),
      }}
      onClick={() => onViewClass?.(cls)}
    >
      {/* Class Header */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: 'var(--font-size-md)', 
          fontWeight: 600,
          color: isEmptySchedule
            ? (theme === 'dark' ? '#9ca3af' : '#6b7280')
            : (theme === 'dark' ? '#f9fafb' : '#111827'),
          lineHeight: '1.25'
        }}>
          {getLocalizedClassName(cls)}
        </h4>
        
        {/* Subject Name */}
        {cls.subjectName && (
          <div style={{ 
            marginTop: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {getThemedIcon('ui', 'book', 10, theme)}
            <span style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              fontWeight: 500
            }}>
              {cls.subjectName}
            </span>
          </div>
        )}
        
        {/* Term and Year */}
        <div style={{ 
          marginTop: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {getThemedIcon('ui', 'calendar', 10, theme)}
          <span style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            fontWeight: 500
          }}>
            {formatTermWithYear(cls)}
          </span>
        </div>
        
        {showInstructorInfo && instructor && (
          <div style={{ 
            marginTop: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {getThemedIcon('ui', 'graduation_cap', 10, theme)}
            <span style={{ 
              fontSize: '0.8rem', 
              color: theme === 'dark' ? '#9ca3af' : '#6b7280' 
            }}>
              {getLocalizedInstructorName(instructor)}
            </span>
          </div>
        )}
      </div>

      {/* Compact Statistics */}
      {classStats[clsId] && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.25rem',
            marginBottom: '0.5rem',
            fontSize: 11,
            color: 'var(--muted)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {classStats[clsId].students > 0 && (
            createClassStatBadge(
              classStats[clsId].students,
              CLASS_STAT_CONFIGS.students.icon,
              primaryColor || CLASS_STAT_CONFIGS.students.color,
              t('classcard_students'),
              theme
            )
          )}
          {classStats[clsId].sessions > 0 && (
            createClassStatBadge(
              classStats[clsId].sessions,
              CLASS_STAT_CONFIGS.sessions.icon,
              CLASS_STAT_CONFIGS.sessions.color,
              t('classcard_scheduled_sessions'),
              theme
            )
          )}
          {classStats[clsId].penalties > 0 && (
            createClassStatBadge(
              classStats[clsId].penalties,
              CLASS_STAT_CONFIGS.penalties.icon,
              CLASS_STAT_CONFIGS.penalties.color,
              t('classcard_penalties'),
              theme
            )
          )}
          {classStats[clsId].behaviors > 0 && (
            createClassStatBadge(
              classStats[clsId].behaviors,
              CLASS_STAT_CONFIGS.behaviors.icon,
              CLASS_STAT_CONFIGS.behaviors.color,
              t('classcard_behaviors'),
              theme
            )
          )}
          {classStats[clsId].quizzes > 0 && (
            createClassStatBadge(
              classStats[clsId].quizzes,
              CLASS_STAT_CONFIGS.quizzes.icon,
              CLASS_STAT_CONFIGS.quizzes.color,
              t('classcard_quizzes'),
              theme
            )
          )}
          {classStats[clsId].activities > 0 && (
            createClassStatBadge(
              classStats[clsId].activities,
              CLASS_STAT_CONFIGS.activities.icon,
              CLASS_STAT_CONFIGS.activities.color,
              t('classcard_activities'),
              theme
            )
          )}
          {classStats[clsId].announcements > 0 && (
            createClassStatBadge(
              classStats[clsId].announcements,
              CLASS_STAT_CONFIGS.announcements.icon,
              CLASS_STAT_CONFIGS.announcements.color,
              t('classcard_announcements'),
              theme
            )
          )}
          {classStats[clsId].resources > 0 && (
            createClassStatBadge(
              classStats[clsId].resources,
              CLASS_STAT_CONFIGS.resources.icon,
              CLASS_STAT_CONFIGS.resources.color,
              t('classcard_resources'),
              theme
            )
          )}
        </div>
      )}
      
      {statsLoaded && (
        <ClassCardScheduleSection
          clsId={clsId}
          classStats={classStats}
          lang={lang}
          isRTL={isRTL}
          t={t}
          theme={theme}
          onSessionSelect={onSessionSelect}
        />
      )}
    </div>
  );
};

export default ClassCard;
