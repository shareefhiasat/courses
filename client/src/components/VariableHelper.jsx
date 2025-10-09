import { useState } from 'react';
import { useToast } from './ToastProvider';

const VariableHelper = ({ templateType = 'custom' }) => {
  const toast = useToast();
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
        { name: 'recipientName', example: 'Ahmed Mohammed', description: 'Recipient display name' },
        { name: 'recipientEmail', example: 'ahmed@example.com', description: 'Recipient email address' },
        { name: 'greeting', example: 'Dear Ahmed', description: 'Auto-generated greeting' },
        { name: 'siteName', example: 'CS Learning Hub', description: 'Site name' },
        { name: 'siteUrl', example: 'https://your-domain.com', description: 'Site URL' },
        { name: 'currentDate', example: '06/10/2025', description: 'Current date (DD/MM/YYYY Qatar time)' },
        { name: 'currentDateTime', example: '06/10/2025 20:15', description: 'Current date/time (Qatar time)' }
      ]
    },
    announcement: {
      title: '📢 Announcement Variables',
      description: 'For announcement emails',
      items: [
        { name: 'title', example: 'Important Update', description: 'Announcement title (English)' },
        { name: 'title_ar', example: 'تحديث مهم', description: 'Announcement title (Arabic)' },
        { name: 'content', example: 'Please read...', description: 'Announcement content (English)' },
        { name: 'content_ar', example: 'يرجى القراءة...', description: 'Announcement content (Arabic)' },
        { name: 'date', example: '06/10/2025', description: 'Announcement date' },
        { name: 'dateTime', example: '06/10/2025 14:30', description: 'Announcement date/time' },
        { name: 'link', example: 'https://...', description: 'Link to announcement' }
      ]
    },
    activity: {
      title: '📝 Activity Variables',
      description: 'For activity-related emails',
      items: [
        { name: 'activityTitle', example: 'Python Quiz 1', description: 'Activity title (English)' },
        { name: 'activityTitle_ar', example: 'اختبار بايثون 1', description: 'Activity title (Arabic)' },
        { name: 'activityType', example: 'quiz', description: 'Activity type (quiz/homework/training)' },
        { name: 'course', example: 'Programming', description: 'Course name (English)' },
        { name: 'course_ar', example: 'البرمجة', description: 'Course name (Arabic)' },
        { name: 'difficulty', example: 'intermediate', description: 'Difficulty level' },
        { name: 'dueDate', example: '15/10/2025', description: 'Due date' },
        { name: 'dueDateTime', example: '15/10/2025 23:59', description: 'Due date/time' },
        { name: 'maxScore', example: '100', description: 'Maximum score' },
        { name: 'description', example: 'Complete the quiz...', description: 'Activity description (English)' },
        { name: 'description_ar', example: 'أكمل الاختبار...', description: 'Activity description (Arabic)' },
        { name: 'link', example: 'https://...', description: 'Link to activity' }
      ]
    },
    student: {
      title: '🎓 Student Variables',
      description: 'For student-related information',
      items: [
        { name: 'studentName', example: 'Ahmed Mohammed', description: 'Student display name' },
        { name: 'studentEmail', example: 'ahmed@example.com', description: 'Student email' },
        { name: 'militaryNumber', example: '12345', description: 'Student military number' },
        { name: 'score', example: '85', description: 'Assigned score' },
        { name: 'maxScore', example: '100', description: 'Maximum score' },
        { name: 'feedback', example: 'Great work!', description: 'Instructor feedback (English)' },
        { name: 'feedback_ar', example: 'عمل رائع!', description: 'Instructor feedback (Arabic)' },
        { name: 'submissionDate', example: '06/10/2025', description: 'When submitted' }
      ]
    },
    class: {
      title: '🏫 Class Variables',
      description: 'For class/enrollment emails',
      items: [
        { name: 'className', example: 'Python I', description: 'Class name' },
        { name: 'classCode', example: 'CS101', description: 'Class code' },
        { name: 'term', example: 'Fall 2025', description: 'Academic term' },
        { name: 'instructorName', example: 'Dr. Smith', description: 'Instructor name' },
        { name: 'instructorEmail', example: 'smith@example.com', description: 'Instructor email' }
      ]
    },
    resource: {
      title: '📚 Resource Variables',
      description: 'For resource notification emails',
      items: [
        { name: 'resourceTitle', example: 'Python Basics PDF', description: 'Resource title' },
        { name: 'resourceType', example: 'document', description: 'Resource type (document/link/video)' },
        { name: 'description', example: 'Introduction to Python', description: 'Resource description' },
        { name: 'dueDate', example: '20/10/2025', description: 'Due date (if any)' },
        { name: 'link', example: 'https://...', description: 'Link to resource' }
      ]
    },
    chat: {
      title: '💬 Chat Digest Variables',
      description: 'For chat digest emails',
      items: [
        { name: 'unreadCount', example: '5', description: 'Number of unread messages' },
        { name: 'messages', example: '[Array]', description: 'Array of message objects' },
        { name: 'chatLink', example: 'https://...', description: 'Link to chat page' }
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
      maxHeight: '600px',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>📋 Available Variables</h3>
      <p style={{ margin: '0 0 1.5rem 0', color: '#666', fontSize: '0.9rem' }}>
        Click any variable to copy it to clipboard
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
              background: activeCategory === category ? '#667eea' : '#f8f9fa',
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
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#667eea', fontSize: '1rem' }}>
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
                e.currentTarget.style.borderColor = '#667eea';
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
                  color: '#667eea',
                  fontWeight: 600
                }}>
                  {`{{${variable.name}}}`}
                </code>
                <span style={{ fontSize: '0.75rem', color: '#999' }}>Click to copy</span>
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
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404', fontSize: '0.9rem' }}>💡 Quick Tips</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404', fontSize: '0.85rem' }}>
          <li>All dates use DD/MM/YYYY format (Qatar timezone UTC+3)</li>
          <li>Use <code>_ar</code> suffix for Arabic versions (e.g., <code>{`{{title_ar}}`}</code>)</li>
          <li>Variables are case-sensitive</li>
          <li>Missing variables will show as empty in emails</li>
        </ul>
      </div>
    </div>
  );
};

export default VariableHelper;
