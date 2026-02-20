import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { getThemedIcon, deriveIconColor } from '@constants/iconTypes';
import { Tooltip } from '@ui';
import { createClassStatBadge, CLASS_STAT_CONFIGS } from '@utils/badgeUtils';

const ClassCard = ({ 
  cls, 
  classStats, 
  primaryColor, 
  theme, 
  t,
  onViewClass,
  showInstructorInfo = true 
}) => {
  const { lang } = useLang();
  const clsId = cls.docId || cls.id;
  const hasSchedule = cls.schedule && cls.schedule.days && cls.schedule.days.length > 0;
  const instructor = cls.instructorData;

// Helper function to get localized class name
  const getLocalizedClassName = (cls) => {
    if (lang === 'ar' && cls.nameAr) {
      return cls.nameAr;
    }
    return cls.name || cls.code || t('classcard_unnamed_class');
  };

  // Helper function to get localized instructor name
  const getLocalizedInstructorName = (instructor) => {
    if (!instructor) return t('classcard_instructor');
    
    // Add comprehensive debug logging
    console.log('🔍 [ClassCard] Instructor data:', {
      instructor,
      firstName: instructor?.firstName,
      lastName: instructor?.lastName,
      displayName: instructor?.displayName,
      realName: instructor?.realName,
      email: instructor?.email,
      messageColor: instructor?.messageColor
    });
    
    // Arabic support
    if (lang === 'ar' && instructor.firstNameAr && instructor.lastNameAr) {
      return `${instructor.firstNameAr} ${instructor.lastNameAr}`;
    }
    
    // Try multiple name fields in order of preference
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName} ${instructor.lastName}`;
    }
    
    if (instructor.realName) {
      return instructor.realName;
    }
    
    if (instructor.displayName && instructor.displayName.trim()) {
      return instructor.displayName;
    }
    
    // Extract name from email as last resort
    if (instructor.email) {
      const emailName = instructor.email.split('@')[0];
      // Format email name (e.g., "john.doe" -> "John Doe")
      const formattedName = emailName
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      if (formattedName && formattedName !== emailName) {
        console.log('📧 [ClassCard] Extracted name from email:', formattedName);
        return formattedName;
      }
    }
    
    return t('classcard_instructor');
  };
  
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
      style={{
        background: theme === 'dark' ? '#1f2937' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: theme === 'dark' 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme === 'dark' 
            ? '0 8px 12px -1px rgba(0, 0, 0, 0.4)' 
            : '0 8px 12px -1px rgba(0, 0, 0, 0.15)',
        }
      }}
      onClick={() => onViewClass(cls)}
    >
      {/* Class Header */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: '1rem', 
          fontWeight: 600,
          color: theme === 'dark' ? '#f9fafb' : '#111827',
          lineHeight: '1.25'
        }}>
          {getLocalizedClassName(cls)}
        </h4>
        {showInstructorInfo && instructor && (
          <div style={{ 
            marginTop: '0.25rem'
          }}>
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
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.25rem', 
          marginBottom: '0.5rem',
          fontSize: 11,
          color: 'var(--muted)'
        }}>
          {classStats[clsId].students > 0 && (
            <Tooltip content={t('classcard_students')}>
              <span 
                style={{ 
                  background: `${primaryColor}15`, 
                  color: primaryColor, 
                  padding: '1px 4px', 
                  borderRadius: 3,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {getThemedIcon('ui', 'users', 10, deriveIconColor(primaryColor))}
                {classStats[clsId].students}
              </span>
            </Tooltip>
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
      
      {/* Schedule Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>
          {hasSchedule ? `${cls.schedule.frequency} • ${cls.schedule.days.join(', ')}` : t('classcard_no_schedule')}
        </div>
        {hasSchedule && (
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: primaryColor 
          }} />
        )}
      </div>
    </div>
  );
};

export default ClassCard;
