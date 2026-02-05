import { useState, useEffect } from 'react';
import { Select } from '@ui';
import { useToast } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { VariableHelper } from '@ui';
import { Modal } from '@ui';
import { formatDateTime } from '@utils/date';
import { collection, doc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@firebaseServices/config';

const EmailTemplateEditor = ({ template, onSave, onCancel }) => {
  const toast = useToast();
  const { t } = useLang();
  const { theme } = useTheme();
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

  // Copy variable to clipboard
  const copyVariable = (variable) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast?.showSuccess(t('variable_copied', { variable: `{{${variable}}}` }) || `Variable {{${variable}}} copied to clipboard!`);
  };

  const templateTypes = [
    { value: 'announcement', label: t('announcement') || 'Announcement' },
    { value: 'activity', label: t('new_activity') || 'New Activity' },
    { value: 'activity_complete', label: t('activity_complete') || 'Activity Complete' },
    { value: 'activity_graded', label: t('activity_graded') || 'Activity Graded' },
    { value: 'enrollment', label: t('enrollment_welcome') || 'Enrollment Welcome' },
    { value: 'resource', label: t('new_resource') || 'New Resource' },
    { value: 'chat_digest', label: t('chat_digest') || 'Chat Digest' },
    { value: 'qr_code', label: t('qr_code_email') || 'QR Code Email' },
    { value: 'student_summary', label: t('student_summary_report') || 'Student Summary Report' },
    { value: 'custom', label: t('custom') || 'Custom' }
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
      variables: ['studentName', 'studentEmail', 'studentId', 'referenceId', 'studentKey', 'accessKey', 'className', 'term', 'instructorName', 'instructorEmail', 'link']
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
    qr_code: {
      purpose: 'Send student their QR code for attendance tracking.',
      trigger: 'Manual send from QR scanner or student profile.',
      actor: 'Teacher/Admin',
      audience: 'Individual student.',
      variables: ['studentName', 'studentEmail', 'studentId', 'referenceId', 'studentKey', 'accessKey', 'qrCodeDataURL', 'siteName']
    },
    student_summary: {
      purpose: 'Send comprehensive student performance report.',
      trigger: 'Manual send from QR scanner or dashboard.',
      actor: 'Teacher/Admin',
      audience: 'Individual student or parent.',
      variables: ['studentName', 'studentEmail', 'studentId', 'referenceId', 'studentKey', 'accessKey', 'className', 'attendanceStats', 'participationStats', 'behaviorStats', 'penaltyStats', 'overallGrade', 'reportPeriod', 'siteName', 'currentDate']
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
      toast?.showError(t('template_name_required') || 'Template name is required');
      return;
    }
    if (!formData.subject.trim()) {
      toast?.showError(t('subject_line_required') || 'Subject line is required');
      return;
    }
    if (!formData.html.trim()) {
      toast?.showError(t('html_content_required') || 'HTML content is required');
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        ...formData,
        variables: extractVariables(formData.html),
        updatedAt: Timestamp.now()
      };

      if (template?.id) {
        // Update existing
        await updateDoc(doc(db, 'emailTemplates', template.id), templateData);
        toast?.showSuccess(t('template_updated_successfully') || 'Template updated successfully!');
      } else {
        // Create new
        templateData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'emailTemplates'), templateData);
        toast?.showSuccess(t('template_created_successfully') || 'Template created successfully!');
      }

      onSave?.();
    } catch (error) {
      console.error('Error saving template:', error);
      toast?.showError(t('failed_to_save_template') + ': ' + error.message);
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
              {template?.id ? (t('edit_template') || 'Edit Template') : (t('create_new_template') || 'Create New Template')}
            </h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  {t('template_name') || 'Template Name'} *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('template_name_placeholder') || 'e.g., Announcement Email - Bilingual'}
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
                <Select
                    label={t('template_type') + ' *' || 'Template Type *'}
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    options={templateTypes.map(type => ({
                      value: type.value,
                      label: type.label
                    }))}
                    searchable
                    fullWidth
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  {t('subject_line') || 'Subject Line'} *
                </label>
                <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={t('subject_line_placeholder') || 'e.g., New Announcement | إعلان جديد: {{title}}'}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      fontSize: '0.95rem'
                    }}
                />
                <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.8rem' }}>
                  {t('subject_line_variables_hint') || 'You can use variables in the subject line too!'}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  {t('html_content') || 'HTML Content'} *
                </label>
                <textarea
                    value={formData.html}
                    onChange={(e) => handleHtmlChange(e.target.value)}
                    placeholder={t('html_content_placeholder') || 'Paste your HTML here from Unlayer, Stripo, or write your own...'}
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
                  {t('html_content_variables_hint') || `Use ${'{{variableName}}'} for dynamic content. Check the Variable Helper →`}
                </p>
              </div>

              {formData.variables.length > 0 && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                      {t('detected_variables', { count: formData.variables.length }) || `Detected Variables (${formData.variables.length})`}
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
                                color: 'var(--color-primary, #800020)',
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
                    background: 'var(--color-primary, #800020)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: loading ? 0.7 : 1
                  }}
              >
                {loading ? (t('saving') || 'Saving...') : (template?.id ? (t('update_template') || 'Update Template') : (t('create_template') || 'Create Template'))}
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
                <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>{getThemedIcon('ui', 'eye', 16, theme)} {t('preview') || 'Preview'}</span>
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
                {t('cancel') || 'Cancel'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Template Help + Variable Helper */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 12, padding: '1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.5rem', color:'#333' }}>
              {getThemedIcon('ui', 'info', 18, theme)} <strong>{t('about_this_template') || 'About this template'}</strong>
            </div>
            {(() => {
              const info = helpByType[formData.type] || helpByType.custom;
              return (
                  <div style={{ fontSize:'0.9rem', color:'#555', display:'grid', gap:'0.4rem' }}>
                    <div><strong>{t('purpose') || 'Purpose'}:</strong> {info.purpose}</div>
                    <div><strong>{t('trigger') || 'Trigger'}:</strong> {info.trigger}</div>
                    <div><strong>{t('actor') || 'Actor'}:</strong> {info.actor}</div>
                    <div><strong>{t('audience') || 'Audience'}:</strong> {info.audience}</div>
                    <div>
                      <strong>{t('key_variables') || 'Key Variables'}:</strong>
                      <div style={{ marginTop: 6, display:'flex', flexWrap:'wrap', gap:6 }}>
                        {Array.from(new Set(info.variables || [])).map(v => (
                            <code
                                key={v}
                                style={{
                                  background:'#f8f9fa',
                                  border:'1px solid #eee',
                                  borderRadius:6,
                                  padding:'2px 6px',
                                  cursor:'pointer',
                                  position:'relative',
                                  fontSize:'0.8rem'
                                }}
                                onClick={() => copyVariable(v)}
                                title={`Click to copy {{${v}}}`}
                            >
                              {`{{${v}}}`}
                              {getThemedIcon('ui', 'copy', 12, theme)}
                            </code>
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
        <Modal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            title={t('email_preview') || '📧 Email Preview'}
            size="large"
            showCloseButton={true}
        >
          {/* Subject */}
          <div style={{
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
              <strong>{t('subject') || 'Subject'}:</strong> {formData.subject}
            </p>
          </div>

          {/* Preview Content */}
          <div
              style={{
                padding: '1rem',
                background: '#f5f5f5a3',
                borderRadius: '8px'
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
        </Modal>
      </div>
  );
};

export default EmailTemplateEditor;
