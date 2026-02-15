import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import Tooltip from '@ui/Tooltip/Tooltip';

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

  // Helper function to get icon color based on theme
const getIconColor = (defaultColor, theme) => {
  return theme === 'light' ? 'white' : defaultColor;
};

// Helper function to get localized class name
  const getLocalizedClassName = (cls) => {
    if (lang === 'ar' && cls.nameAr) {
      return cls.nameAr;
    }
    return cls.name || cls.code || t('unnamed_class') || 'Unnamed Class';
  };

  // Helper function to get localized instructor name
  const getLocalizedInstructorName = (instructor) => {
    if (!instructor) return t('instructor') || 'Instructor';
    
    if (lang === 'ar' && instructor.firstNameAr && instructor.lastNameAr) {
      return `${instructor.firstNameAr} ${instructor.lastNameAr}`;
    }
    
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName} ${instructor.lastName}`;
    }
    
    return instructor.displayName || t('instructor') || 'Instructor';
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
          fontSize: '0.875rem', 
          fontWeight: 600,
          color: theme === 'dark' ? '#f9fafb' : '#111827',
          lineHeight: '1.25'
        }}>
          {getLocalizedClassName(cls)}
        </h4>
        {showInstructorInfo && instructor && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginTop: '0.25rem'
          }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: instructor.messageColor || primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '8px',
                fontWeight: 'bold'
              }}
            >
              {(instructor?.firstName || instructor?.displayName)?.charAt(0)?.toUpperCase() || 'I'}
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
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
          fontSize: 9,
          color: 'var(--muted)'
        }}>
          {classStats[clsId].students > 0 && (
            <Tooltip content={t('students') || 'Students'}>
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
                {getThemedIcon('ui', 'users', 10, getIconColor(primaryColor, theme))}
                {classStats[clsId].students}
              </span>
            </Tooltip>
          )}
          {classStats[clsId].penalties > 0 && (
            <Tooltip content={t('penalties') || 'Penalties'}>
              <span 
                style={{ 
                  background: '#ef444415', 
                  color: '#ef4444', 
                  padding: '1px 4px', 
                  borderRadius: 3,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {getThemedIcon('penalty_type', 'cheating', 10, getIconColor('#ef4444', theme))}
                {classStats[clsId].penalties}
              </span>
            </Tooltip>
          )}
          {classStats[clsId].behaviors > 0 && (
            <Tooltip content={t('behaviors') || 'Behaviors'}>
              <span 
                style={{ 
                  background: '#f59e0b15', 
                  color: '#f59e0b', 
                  padding: '1px 4px', 
                  borderRadius: 3,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {getThemedIcon('behavior_type', 'disruptive', 10, getIconColor('#f59e0b', theme))}
                {classStats[clsId].behaviors}
              </span>
            </Tooltip>
          )}
          {classStats[clsId].quizzes > 0 && (
            <Tooltip content={t('quizzes') || 'Quizzes'}>
              <span 
                style={{ 
                  background: '#8b5cf615', 
                  color: '#8b5cf6', 
                  padding: '1px 4px', 
                  borderRadius: 3,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {getThemedIcon('ui', 'file_text', 10, getIconColor('#8b5cf6', theme))}
                {classStats[clsId].quizzes}
              </span>
            </Tooltip>
          )}
          {classStats[clsId].activities > 0 && (
            <Tooltip content={t('activities') || 'Activities'}>
              <span 
                style={{ 
                  background: '#10b98115', 
                  color: '#10b981', 
                  padding: '1px 4px', 
                  borderRadius: 3,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {getThemedIcon('participation_type', 'excellent', 10, getIconColor('#10b981', theme))}
                {classStats[clsId].activities}
              </span>
            </Tooltip>
          )}
          {classStats[clsId].announcements > 0 && (
            <Tooltip content={t('announcements') || 'Announcements'}>
              <span 
                style={{ 
                  background: '#3b82f615', 
                  color: '#3b82f6', 
                  padding: '1px 4px', 
                  borderRadius: 3,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {getThemedIcon('ui', 'megaphone', 10, getIconColor('#3b82f6', theme))}
                {classStats[clsId].announcements}
              </span>
            </Tooltip>
          )}
          {classStats[clsId].resources > 0 && (
            <Tooltip content={t('resources') || 'Resources'}>
              <span 
                style={{ 
                  background: '#06b6d415', 
                  color: '#06b6d4', 
                  padding: '1px 4px', 
                  borderRadius: 3,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {getThemedIcon('ui', 'folder', 10, getIconColor('#06b6d4', theme))}
                {classStats[clsId].resources}
              </span>
            </Tooltip>
          )}
        </div>
      )}
      
      {/* Schedule Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>
          {hasSchedule ? `${cls.schedule.frequency} • ${cls.schedule.days.join(', ')}` : (t('no_schedule') || 'No schedule')}
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
