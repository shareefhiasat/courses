import { useState, useEffect } from 'react';
import { useToast } from './ToastProvider';
import VariableHelper from './VariableHelper';
import Modal from './Modal';
import { Eye, Info } from 'lucide-react';
import { formatDateTime } from '../utils/date';

const EmailTemplateEditor = ({ template, onSave, onCancel }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom',
    subject: '',
    html: '',
    variables: [],
    ...template
  });

  const templateTypes = [
    { value: 'announcement', label: 'Announcement' },
    { value: 'activity', label: 'New Activity' },
    { value: 'activity_complete', label: 'Activity Complete' },
    { value: 'activity_graded', label: 'Activity Graded' },
    { value: 'enrollment', label: 'Enrollment Welcome' },
    { value: 'resource', label: 'New Resource' },
    { value: 'chat_digest', label: 'Chat Digest' },
    { value: 'custom', label: 'Custom' }
  ];

  const helpByType = {
    announcement: {
      purpose: 'Inform users about class or site-wide announcements.',
      trigger: 'Manual send by admin/teacher.',
      actor: 'Admin/Teacher',
      audience: 'Selected users, classes, or all students.',
      variables: ['title', 'title_ar', 'content', 'content_ar', 'dateTime', 'link']
    },
    activity: {
      purpose: 'Notify students about a newly posted activity.',
      trigger: 'Manual send when creating an activity.',
      actor: 'Admin/Teacher',
      audience: 'Students in the target class/course.',
      variables: ['activityTitle', 'activityTitle_ar', 'activityType', 'course', 'course_ar', 'difficulty', 'dueDateTime', 'maxScore', 'description', 'description_ar', 'link']
    },
    activity_complete: {
      purpose: 'Confirm that the student completed an activity.',
      trigger: 'Automatic on student completion.',
      actor: 'System',
      audience: 'The submitting student.',
      variables: ['studentName', 'studentEmail', 'activityTitle', 'activityTitle_ar', 'submissionDate', 'link']
    },
    activity_graded: {
      purpose: 'Inform the student that their submission was graded.',
      trigger: 'Automatic when a teacher saves a grade.',
      actor: 'System',
      audience: 'The graded student.',
      variables: ['studentName', 'studentEmail', 'activityTitle', 'activityTitle_ar', 'score', 'maxScore', 'feedback', 'feedback_ar', 'submissionDate', 'link']
    },
    enrollment: {
      purpose: 'Welcome a user after enrolling them into a class.',
      trigger: 'Manual or automatic on enrollment.',
      actor: 'Admin/Teacher/System',
      audience: 'Newly enrolled student.',
      variables: ['studentName', 'className', 'classCode', 'term', 'instructorName', 'instructorEmail', 'link']
    },
    resource: {
      purpose: 'Notify users about a new learning resource.',
      trigger: 'Manual send by admin/teacher.',
      actor: 'Admin/Teacher',
      audience: 'Target students/classes.',
      variables: ['resourceTitle', 'resourceType', 'description', 'dueDate', 'link']
    },
    chat_digest: {
      purpose: 'Summarize unread chat activity.',
      trigger: 'Scheduled or manual digest.',
      actor: 'System/Admin',
      audience: 'Students or staff with unread messages.',
      variables: ['unreadCount', 'messages', 'chatLink']
    },
    custom: {
      purpose: 'Free-form custom email for any purpose.',
      trigger: 'Manual send.',
      actor: 'Admin/Teacher',
      audience: 'Any recipients you choose.',
      variables: ['Any variables you define']
    }
  };

  const extractVariables = (html) => {
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const matches = html.match(regex);
    if (!matches) return [];
    
    const variables = matches.map(match => match.replace(/\{\{|\}\}/g, ''));
    return [...new Set(variables)]; // Remove duplicates
  };

  const handleHtmlChange = (value) => {
    setFormData(prev => ({
      ...prev,
      html: value,
      variables: extractVariables(value)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast?.showError('Template name is required');
      return;
    }
    if (!formData.subject.trim()) {
      toast?.showError('Subject line is required');
      return;
    }
    if (!formData.html.trim()) {
      toast?.showError('HTML content is required');
      return;
    }

    setLoading(true);
    try {
      const { collection, doc, addDoc, updateDoc, Timestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');

      const templateData = {
        ...formData,
        variables: extractVariables(formData.html),
        updatedAt: Timestamp.now()
      };

      if (template?.id) {
        // Update existing
        await updateDoc(doc(db, 'emailTemplates', template.id), templateData);
        toast?.showSuccess('Template updated successfully!');
      } else {
        // Create new
        templateData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'emailTemplates'), templateData);
        toast?.showSuccess('Template created successfully!');
      }

      onSave?.();
    } catch (error) {
      console.error('Error saving template:', error);
      toast?.showError('Failed to save template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSampleData = () => {
    const now = new Date();
    const prettyDateTime = formatDateTime(now);
    const prettyDate = prettyDateTime ? prettyDateTime.split(' ')[0] : '';
    return {
      // Common variables
      recipientName: 'Ahmed Mohammed',
      recipientEmail: 'ahmed@example.com',
      greeting: 'Dear Ahmed Mohammed',
      siteName: 'CS Learning Hub',
      siteUrl: 'https://your-domain.com',
      currentDate: prettyDate,
      currentDateTime: prettyDateTime,
      
      // Announcement variables
      title: 'Important Update',
      title_ar: 'تحديث مهم',
      content: 'This is a sample announcement content.',
      content_ar: 'هذا محتوى إعلان نموذجي.',
      dateTime: prettyDateTime,
      
      // Activity variables
      activityTitle: 'Python Quiz 1',
      activityTitle_ar: 'اختبار بايثون 1',
      activityType: 'quiz',
      course: 'Programming',
      course_ar: 'البرمجة',
      description: 'Complete the Python quiz to test your knowledge.',
      description_ar: 'أكمل اختبار بايثون لاختبار معرفتك.',
      dueDateTime: prettyDateTime,
      maxScore: '100',
      difficulty: 'intermediate',
      
      // Student variables
      studentName: 'Ahmed Mohammed',
      studentEmail: 'ahmed@example.com',
      militaryNumber: '12345',
      score: '85',
      feedback: 'Great work! Keep it up.',
      feedback_ar: 'عمل رائع! استمر.',
      submissionDate: prettyDate,
      
      // Class variables
      className: 'Python I',
      classCode: 'CS101',
      term: 'Fall 2025',
      instructorName: 'Dr. Smith',
      instructorEmail: 'smith@example.com',
      
      // Resource variables
      resourceTitle: 'Python Basics PDF',
      resourceType: 'document',
      
      // Chat variables
      unreadCount: '5',
      chatLink: 'https://your-domain.com/chat',
      
      // Links
      link: 'https://your-domain.com'
    };
  };

  const renderPreview = () => {
    let html = formData.html;
    const sampleData = getSampleData();
    
    // Replace all variables with sample data
    Object.keys(sampleData).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      html = html.replace(regex, sampleData[key]);
    });

    return html;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', height: 'calc(100vh - 200px)' }}>
      {/* Editor Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>
            {template?.id ? 'Edit Template' : 'Create New Template'}
          </h3>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Announcement Email - Bilingual"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                Template Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: '0.95rem'
                }}
              >
                {templateTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                Subject Line *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., New Announcement | إعلان جديد: {{title}}"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: '0.95rem'
                }}
              />
              <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.8rem' }}>
                You can use variables in the subject line too!
              </p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                HTML Content *
              </label>
              <textarea
                value={formData.html}
                onChange={(e) => handleHtmlChange(e.target.value)}
                placeholder="Paste your HTML here from Unlayer, Stripo, or write your own..."
                style={{
                  width: '100%',
                  minHeight: '400px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
              <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.8rem' }}>
                Use <code>{`{{variableName}}`}</code> for dynamic content. Check the Variable Helper →
              </p>
            </div>

            {formData.variables.length > 0 && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  Detected Variables ({formData.variables.length})
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {formData.variables.map(variable => (
                    <span
                      key={variable}
                      style={{
                        padding: '4px 8px',
                        background: '#e7f3ff',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        color: '#667eea',
                        fontFamily: 'monospace'
                      }}
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Saving...' : (template?.id ? 'Update Template' : 'Create Template')}
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('🔍 Preview button clicked!');
                console.log('Current showPreview state:', showPreview);
                console.log('Form data:', formData);
                setShowPreview(true);
                console.log('Set showPreview to true');
              }}
              style={{
                padding: '12px 24px',
                background: '#f8f9fa',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}><Eye size={16} /> Preview</span>
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                background: '#f8f9fa',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Template Help + Variable Helper */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 12, padding: '1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.5rem', color:'#333' }}>
            <Info size={18} /> <strong>About this template</strong>
          </div>
          {(() => {
            const info = helpByType[formData.type] || helpByType.custom;
            return (
              <div style={{ fontSize:'0.9rem', color:'#555', display:'grid', gap:'0.4rem' }}>
                <div><strong>Purpose:</strong> {info.purpose}</div>
                <div><strong>Trigger:</strong> {info.trigger}</div>
                <div><strong>Actor:</strong> {info.actor}</div>
                <div><strong>Audience:</strong> {info.audience}</div>
                <div>
                  <strong>Key Variables:</strong>
                  <div style={{ marginTop: 6, display:'flex', flexWrap:'wrap', gap:6 }}>
                    {(info.variables || []).map(v => (
                      <code key={v} style={{ background:'#f8f9fa', border:'1px solid #eee', borderRadius:6, padding:'2px 6px' }}>{`{{${v}}}`}</code>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        <VariableHelper templateType={formData.type} />
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '2rem'
          }}
          onClick={() => {
            console.log('❌ Closing preview modal');
            setShowPreview(false);
          }}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: 12,
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>📧 Email Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Subject */}
            <div style={{ 
              padding: '1rem 1.5rem', 
              background: '#f8f9fa', 
              borderBottom: '1px solid #e0e0e0'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                <strong>Subject:</strong> {formData.subject}
              </p>
            </div>

            {/* Preview Content */}
            <div 
              style={{ 
                flex: 1,
                padding: '1.5rem',
                overflowY: 'auto',
                background: '#f5f5f5'
              }}
            >
              <div 
                style={{ 
                  background: 'white',
                  border: '1px solid #ddd', 
                  borderRadius: 8, 
                  padding: '2rem',
                  minHeight: '400px'
                }}
                dangerouslySetInnerHTML={{ __html: renderPreview() }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateEditor;
