import { useState } from 'react';
import { useToast } from '@ui';
import { useLang } from '@contexts/LangContext';


import { info, error, warn, debug } from '@services/utils/logger.js';const VariableHelper = ({ templateType = 'custom' }) => {
  const toast = useToast();
  const { t } = useLang();
  const [activeCategory, setActiveCategory] = useState('common');

  const copyToClipboard = (variable) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast?.showSuccess(`Copied {{${variable}}} to clipboard!`);
  };

  const variables = {
    common: {
      title: '📝 Common Variables',
      description: 'Available in all email templates',
      items: [
        { name: 'recipientName', example: 'Ahmed Mohammed | أحمد محمد', description: 'Recipient display name (EN|AR)' },
        { name: 'siteName', example: 'CS Learning Hub | مركز تعلم علوم الحاسب', description: 'Site name (EN|AR)' },
        { name: 'siteUrl', example: 'https://your-domain.com', description: 'Site URL' },
        { name: 'currentDate', example: '06/10/2025', description: 'Current date (DD/MM/YYYY Qatar time)' },
        { name: 'link', example: 'https://...', description: 'Generic link' }
      ]
    },
    announcement: {
      title: '📢 Announcement Variables',
      description: 'For announcement emails',
      items: [
        { name: 'titleEn', example: 'Important Update', description: 'Announcement title (English)' },
        { name: 'titleAr', example: 'تحديث مهم', description: 'Announcement title (Arabic)' },
        { name: 'messageEn', example: 'Please read...', description: 'Announcement content (English)' },
        { name: 'messageAr', example: 'يرجى القراءة...', description: 'Announcement content (Arabic)' },
        { name: 'createdAt', example: '06/10/2025 14:30', description: 'Creation date/time (Qatar time)' },
        { name: 'updatedAt', example: '06/10/2025 15:45', description: 'Last update date/time (Qatar time)' },
        { name: 'programName', example: 'Computer Science | علوم الحاسب', description: 'Program name (EN|AR)' },
        { name: 'subjectName', example: 'Programming | البرمجة', description: 'Subject name (EN|AR)' },
        { name: 'className', example: 'Python I | بايثون الأول', description: 'Class name (EN|AR)' },
        { name: 'classDescription', example: 'Introduction to Python | مقدمة في بايثون', description: 'Class description (EN|AR)' }
      ]
    },
    activity: {
      title: '📝 Activity Variables',
      description: 'For activity-related emails',
      items: [
        { name: 'activityName', example: 'Python Quiz 1 | اختبار بايثون 1', description: 'Activity name (EN|AR)' },
        { name: 'activityType', example: 'quiz | اختبار', description: 'Activity type (EN|AR)' },
        { name: 'activityDescription', example: 'Complete the quiz | أكمل الاختبار', description: 'Activity description (EN|AR)' },
        { name: 'programName', example: 'Computer Science | علوم الحاسب', description: 'Program name (EN|AR)' },
        { name: 'subjectName', example: 'Programming | البرمجة', description: 'Subject name (EN|AR)' },
        { name: 'className', example: 'Python I | بايثون الأول', description: 'Class name (EN|AR)' },
        { name: 'classDescription', example: 'Introduction to Python | مقدمة في بايثون', description: 'Class description (EN|AR)' },
        { name: 'difficulty', example: 'intermediate | متوسط', description: 'Difficulty level (EN|AR)' },
        { name: 'dueDate', example: '15/10/2025 23:59', description: 'Due date/time (Qatar time)' },
        { name: 'maxScore', example: '100', description: 'Maximum score' },
        { name: 'estimatedTime', example: '45 minutes | 45 دقيقة', description: 'Estimated completion time (EN|AR)' },
        { name: 'createdAt', example: '06/10/2025 14:30', description: 'Creation date/time (Qatar time)' },
        { name: 'updatedAt', example: '06/10/2025 15:45', description: 'Last update date/time (Qatar time)' },
        { name: 'link', example: 'https://...', description: 'Link to activity' }
      ]
    },
    student: {
      title: '🎓 Student Variables',
      description: 'For student-related information',
      items: [
        { name: 'studentName', example: 'Ahmed Mohammed | أحمد محمد', description: 'Student display name (EN|AR)' },
        { name: 'studentDisplayName', example: 'Ahmed M. | أحمد م.', description: 'Short display name (EN|AR)' },
        { name: 'studentNumber', example: '12345', description: 'Student ID number' },
        { name: 'studentEmail', example: 'ahmed@example.com', description: 'Student email' },
        { name: 'score', example: '85', description: 'Assigned score' },
        { name: 'maxScore', example: '100', description: 'Maximum score' },
        { name: 'gradedAt', example: '06/10/2025 14:30', description: 'Grading date/time (Qatar time)' },
        { name: 'submittedAt', example: '06/10/2025 13:15', description: 'Submission date/time (Qatar time)' },
        { name: 'feedbackEn', example: 'Great work!', description: 'Instructor feedback (English)' },
        { name: 'feedbackAr', example: 'عمل رائع!', description: 'Instructor feedback (Arabic)' }
      ]
    },
    enrollment: {
      title: '🏫 Enrollment Variables',
      description: 'For enrollment/welcome emails',
      items: [
        { name: 'studentName', example: 'Ahmed Mohammed | أحمد محمد', description: 'Student display name (EN|AR)' },
        { name: 'studentDisplayName', example: 'Ahmed M. | أحمد م.', description: 'Short display name (EN|AR)' },
        { name: 'studentNumber', example: '12345', description: 'Student ID number' },
        { name: 'programName', example: 'Computer Science | علوم الحاسب', description: 'Program name (EN|AR)' },
        { name: 'subjectName', example: 'Programming | البرمجة', description: 'Subject name (EN|AR)' },
        { name: 'className', example: 'Python I | بايثون الأول', description: 'Class name (EN|AR)' },
        { name: 'classDescription', example: 'Introduction to Python | مقدمة في بايثون', description: 'Class description (EN|AR)' },
        { name: 'term', example: 'Fall 2025 | خريف 2025', description: 'Academic term (EN|AR)' },
        { name: 'instructorName', example: 'Dr. Smith | د. سميث', description: 'Instructor name (EN|AR)' },
        { name: 'enrolledAt', example: '06/10/2025 14:30', description: 'Enrollment date/time (Qatar time)' },
        { name: 'siteUrl', example: 'https://...', description: 'Link to platform' }
      ]
    },
    resource: {
      title: '📚 Resource Variables',
      description: 'For resource notification emails',
      items: [
        { name: 'resourceName', example: 'Python Basics PDF | بايثون الأساسيات PDF', description: 'Resource name (EN|AR)' },
        { name: 'resourceType', example: 'document | مستند', description: 'Resource type (EN|AR)' },
        { name: 'resourceDescription', example: 'Introduction to Python | مقدمة في بايثون', description: 'Resource description (EN|AR)' },
        { name: 'programName', example: 'Computer Science | علوم الحاسب', description: 'Program name (EN|AR)' },
        { name: 'subjectName', example: 'Programming | البرمجة', description: 'Subject name (EN|AR)' },
        { name: 'className', example: 'Python I | بايثون الأول', description: 'Class name (EN|AR)' },
        { name: 'classDescription', example: 'Introduction to Python | مقدمة في بايثون', description: 'Class description (EN|AR)' },
        { name: 'createdAt', example: '06/10/2025 14:30', description: 'Creation date/time (Qatar time)' },
        { name: 'updatedAt', example: '06/10/2025 15:45', description: 'Last update date/time (Qatar time)' },
        { name: 'link', example: 'https://...', description: 'Link to resource' }
      ]
    }
  };

  const categories = Object.keys(variables);

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: 12,
      padding: '1.5rem',
      maxHeight: '800px',
      overflowY: 'auto',
      minWidth: '350px'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>📋 {t('available_variables')}</h3>
      <p style={{ margin: '0 0 1.5rem 0', color: '#666', fontSize: '0.9rem' }}>
        {t('click_variable_to_copy')}
      </p>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '1rem'
      }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            style={{
              padding: '6px 12px',
              background: activeCategory === category ? 'var(--color-primary, #800020)' : '#f8f9fa',
              color: activeCategory === category ? 'white' : '#666',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: activeCategory === category ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            {variables[category].title.split(' ')[0]} {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Active Category Variables */}
      <div>
        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary, #800020)', fontSize: 'var(--font-size-md)' }}>
          {variables[activeCategory].title}
        </h4>
        <p style={{ margin: '0 0 1rem 0', color: '#999', fontSize: '0.85rem' }}>
          {variables[activeCategory].description}
        </p>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {variables[activeCategory].items.map(variable => (
            <div
              key={variable.name}
              onClick={() => copyToClipboard(variable.name)}
              style={{
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e7f3ff';
                e.currentTarget.style.borderColor = 'var(--color-primary, #800020)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <code style={{
                  background: 'white',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: '0.85rem',
                  color: 'var(--color-primary, #800020)',
                  fontWeight: 600
                }}>
                  {`{{${variable.name}}}`}
                </code>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#999' }}>{t('click_to_copy')}</span>
              </div>
              <p style={{ margin: '0.5rem 0', color: '#555', fontSize: '0.85rem' }}>
                {variable.description}
              </p>
              <p style={{ margin: 0, color: '#999', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Example: {variable.example}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#fff3cd',
        borderRadius: 8,
        border: '1px solid #ffc107'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404', fontSize: '0.9rem' }}>💡 {t('quick_tips')}</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404', fontSize: '0.85rem' }}>
          <li>All dates use DD/MM/YYYY format and Qatar timezone (UTC+3)</li>
          <li>Use <code>En</code>/<code>Ar</code> suffix for bilingual versions (e.g., <code>{`{{titleEn}}`}</code>, <code>{`{{titleAr}}`}</code>)</li>
          <li>Variables are case-sensitive and use camelCase</li>
          <li>Missing variables will show as empty in emails</li>
          <li>Use <code>programName</code>, <code>subjectName</code>, <code>className</code> for hierarchical structure</li>
        </ul>
      </div>
    </div>
  );
};

export default VariableHelper;
