import { useState, useEffect, useRef } from 'react';
import { useToast } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { ToggleSwitch } from '@ui';
import { formatDateTime } from '@utils/date';
import { collection, getDocs, query, orderBy, getDoc, doc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@services/other/config';
import { Loading } from '@ui';

const EmailTemplateList = ({ onEdit, onCreateNew, highlightId }) => {
  const toast = useToast();
  const { t } = useLang();
  const { theme } = useTheme();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState({});
  const [testingEmail, setTestingEmail] = useState(null);
  const templateRefs = useRef({});

  useEffect(() => {
    loadTemplates();
    loadSettings();
  }, []);

  useEffect(() => {
    // Scroll to and highlight template if highlightId is provided
    if (highlightId && templateRefs.current[highlightId]) {
      setTimeout(() => {
        templateRefs.current[highlightId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [highlightId, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'emailTemplates'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const templateList = [];
      snapshot.forEach(doc => {
        templateList.push({ id: doc.id, ...doc.data() });
      });

      setTemplates(templateList);
    } catch (error) {
      logger.error('Error loading templates:', error);
      toast?.showError('Failed to load templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'config', 'emailSettings');
      const ref = doc(db, 'config', 'emailSettings');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSettings(snap.data());
      } else {
        setSettings({});
      }
    } catch (e) {
      logger.error('Error loading email settings:', e);
    }
  };

  // Map template types to trigger types (singular → plural)
  const mapTypeToTrigger = (templateType) => {
    const mapping = {
      'announcement': 'announcements',
      'activity': 'activities',
      'activity_complete': 'activityComplete',
      'activity_graded': 'activityGraded',
      'enrollment': 'enrollments',
      'resource': 'resources',
      'chat_digest': 'chatDigest',
      'password_reset': 'passwordReset',
      'welcome_signup': 'welcomeSignup',
      'qr_code': 'qrCode',
      'student_summary': 'studentSummary'
    };
    return mapping[templateType] || templateType;
  };

  const saveSetting = async (typeKey, enabled, templateId) => {
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@services/other/config');
      const ref = doc(db, 'config', 'emailSettings');

      // Map template type to trigger type
      const triggerKey = mapTypeToTrigger(typeKey);

      const next = {
        ...(settings || {}),
        [triggerKey]: {
          ...(settings?.[triggerKey] || {}),
          enabled: enabled,
          template: templateId
        }
      };
      setSettings(next);
      await setDoc(ref, next, { merge: true });
      toast?.showSuccess(enabled ? (t('email_notifications_enabled') || 'Email notifications enabled') : (t('email_notifications_disabled') || 'Email notifications disabled'));
    } catch (e) {
      logger.error('Error saving setting:', e);
      toast?.showError(t('failed_to_save_setting') + ': ' + e.message);
    }
  };

  const generateSampleVariables = (template) => {
    // Smart platform URL detection
    const platformUrl = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `http://${window.location.hostname}:${window.location.port || 5174}`
        : 'https://main-one-32026.web.app';

    const prettyNow = formatDateTime(new Date());
    const base = {
      recipientName: 'John Doe',
      siteName: 'CS Learning Hub',
      platformName: 'CS Learning Hub',
      platformUrl: platformUrl,
      siteUrl: platformUrl,
      currentDate: prettyNow ? prettyNow.split(' ')[0] : ''
    };
    switch (template.type) {
      case 'announcement':
        return { ...base, title: 'New Quiz', content: 'Please attempt the quiz', link: 'https://example.com/ann' };
      case 'activity':
        return { ...base, activityTitle: 'Arrays 101', className: 'Computing 1' };
      case 'activity_graded':
        return { ...base, activityTitle: 'Loops', grade: '9/10' };
      case 'activity_complete':
        return { ...base, activityTitle: 'Sorting', studentName: 'Jane Student' };
      case 'enrollment':
        return { ...base, className: 'Python A', startDate: base.currentDate };
      case 'resource':
        return { ...base, resourceTitle: 'Intro PDF', resourceLink: 'https://example.com/pdf' };
      case 'chat_digest':
        return { ...base, unreadCount: 5, chatLink: base.platformUrl + '/chat' };
      case 'password_reset':
        return { ...base, userEmail: 'user@example.com', resetLink: base.platformUrl + '/reset?token=demo' };
      case 'welcome_signup':
        return { ...base, userEmail: 'user@example.com', displayName: 'John D.' };
      case 'qr_code':
        return { ...base, studentName: 'John Student', studentId: 'STU-1234', qrCodeDataURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' };
      case 'student_summary':
        return {
          ...base,
          studentName: 'John Student',
          studentEmail: 'john@example.com',
          studentId: 'STU-1234',
          className: 'Computing 1',
          attendanceStats: { present: 15, late: 2, absent: 1, percentage: 88 },
          participationStats: { total: 25, positive: 20, neutral: 5 },
          behaviorStats: { total: 30, positive: 25, negative: 5 },
          penaltyStats: { total: 2, minor: 1, major: 1, recentPenalties: 'Late arrival (Oct 15), Missing homework (Oct 20)' },
          overallGrade: 'B+',
          reportPeriod: 'This Term'
        };
      default:
        return base;
    }
  };

  const deleteTemplate = async (templateId, templateName) => {
    if (!window.confirm(t('confirm_delete_template', { name: templateName }) || `Delete template "${templateName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'emailTemplates', templateId));
      toast?.showSuccess(t('template_deleted_successfully') || 'Template deleted successfully!');
      loadTemplates();
    } catch (error) {
      logger.error('Error deleting template:', error);
      toast?.showError(t('failed_to_delete_template') + ': ' + error.message);
    }
  };

  const duplicateTemplate = async (template) => {
    try {
      const newTemplate = {
        ...template,
        name: `${template.name} ${t('copy') || '(Copy)'}`,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      delete newTemplate.id;

      const docRef = await addDoc(collection(db, 'emailTemplates'), newTemplate);
      toast?.showSuccess(t('template_duplicated_successfully') || 'Template duplicated successfully!');
      loadTemplates();
    } catch (error) {
      logger.error('Error duplicating template:', error);
      toast?.showError(t('failed_to_duplicate_template') + ': ' + error.message);
    }
  };

  const filteredTemplates = templates.filter(t =>
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type) => {
    const iconMap = {
      announcement: getThemedIcon('notification_type', 'announcement', 20, theme),
      activity: getThemedIcon('notification_type', 'activity', 20, theme),
      activity_complete: getThemedIcon('notification_type', 'activity_complete', 20, theme),
      activity_graded: getThemedIcon('notification_type', 'activity_graded', 20, theme),
      enrollment: getThemedIcon('notification_type', 'enrollment', 20, theme),
      resource: getThemedIcon('notification_type', 'resource', 20, theme),
      chat_digest: getThemedIcon('notification_type', 'chat_digest', 20, theme),
      password_reset: getThemedIcon('notification_type', 'password_reset', 20, theme),
      welcome_signup: getThemedIcon('notification_type', 'welcome_signup', 20, theme),
      qr_code: getThemedIcon('notification_type', 'qr_code', 20, theme),
      student_summary: getThemedIcon('notification_type', 'student_summary', 20, theme),
      custom: getThemedIcon('notification_type', 'custom', 20, theme)
    };
    return iconMap[type] || getThemedIcon('notification_type', 'custom', 20, theme);
  };

  if (loading) {
    return <Loading message={t('loading_email_templates') || 'Loading email templates...'} fancyVariant="dots" />;
  }

  return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <input
              type="text"
              placeholder={t('search_templates') || 'Search templates...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: 8,
                width: 300,
                fontSize: '0.95rem',
                background: 'white'
              }}
          />
          <button
              onClick={onCreateNew}
              style={{
                padding: '10px 20px',
                background: 'var(--color-primary, #800020)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
          >
            {t('create_new_template') || 'Create New Template'}
          </button>
        </div>

        {filteredTemplates.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              background: '#f8f9fa',
              borderRadius: 12,
              border: '2px dashed #ddd'
            }}>
              <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1rem' }}>
                {searchTerm ? (t('no_templates_found') || 'No templates found matching your search.') : (t('no_email_templates_yet') || 'No email templates yet.')}
              </p>
              {!searchTerm && (
                  <button
                      onClick={onCreateNew}
                      style={{
                        padding: '12px 24px',
                        background: 'var(--color-primary, #800020)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                  >
                    {t('create_your_first_template') || 'Create Your First Template'}
                  </button>
              )}
            </div>
        ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredTemplates.map(template => (
                  <div
                      key={template.id}
                      ref={(el) => templateRefs.current[template.id] = el}
                      style={{
                        background: highlightId === template.id ? '#fff9e6' : 'white',
                        border: highlightId === template.id ? '2px solid #ffc107' : '1px solid #e0e0e0',
                        borderRadius: 12,
                        padding: '1.5rem',
                        boxShadow: highlightId === template.id ? '0 8px 24px rgba(255, 193, 7, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.3s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ fontSize: '2rem' }}>{getTypeIcon(template.type)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <div>
                            <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>{template.name}</h3>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#999', fontSize: '0.85rem' }}>
                              {template.type?.replace('_', ' ').toUpperCase()}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems:'center' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:12 }}>
                              <span style={{ color:'#666', fontSize:'0.85rem' }}>{t('enabled') || 'Enabled'}</span>
                              <ToggleSwitch
                                  checked={!!settings?.[mapTypeToTrigger(template.type)]?.enabled}
                                  onChange={(val) => saveSetting(template.type, val, template.id)}
                              />
                            </div>

                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(template);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: '#16a34a',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                            >
                              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>{getThemedIcon('ui', 'edit', 14, theme)} {t('edit') || 'Edit'}</span>
                            </button>
                            <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setTestingEmail(template.id);
                                  try {
                                    const { httpsCallable } = await import('firebase/functions');
                                    const { functions } = await import('@services/other/config');
                                    const sendTest = httpsCallable(functions, 'sendTestEmailTemplate');
                                    const vars = generateSampleVariables(template);
                                    const res = await sendTest({ templateId: template.id, variables: vars });
                                    if (res.data?.success) {
                                      toast?.showSuccess(t('test_email_sent') || 'Test email sent to your email');
                                    } else {
                                      toast?.showError(t('failed_to_send_test_email') || 'Failed to send test email');
                                    }
                                  } catch (err) {
                                    logger.error(err);
                                    toast?.showError(t('failed_to_send_test_email') + ': ' + err.message);
                                  } finally {
                                    setTestingEmail(null);
                                  }
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: '#f97316',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                            >
                              {testingEmail === template.id
                                  ? (t('sending') || 'Sending…')
                                  : <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>{getThemedIcon('ui', 'send', 14, theme)} {t('test_email') || 'Test Email'}</span>}
                            </button>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateTemplate(template);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                            >
                              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>{getThemedIcon('ui', 'copy', 14, theme)} {t('duplicate') || 'Duplicate'}</span>
                            </button>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTemplate(template.id, template.name);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                            >
                              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>{getThemedIcon('ui', 'trash', 14, theme)} {t('delete') || 'Delete'}</span>
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: '0.75rem 0', color: '#555', fontSize: '0.9rem' }}>
                          <strong>{t('subject') || 'Subject'}:</strong> {template.subject}
                        </p>
                        {template.variables && template.variables.length > 0 && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.85rem' }}>
                                <strong>Variables:</strong>
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {template.variables.slice(0, 8).map(variable => (
                                    <span
                                        key={variable}
                                        style={{
                                          padding: '4px 8px',
                                          background: '#f0f0f0',
                                          borderRadius: 4,
                                          fontSize: '0.75rem',
                                          color: '#555',
                                          fontFamily: 'monospace'
                                        }}
                                    >
                            {`{{${variable}}}`}
                          </span>
                                ))}
                                {template.variables.length > 8 && (
                                    <span style={{ fontSize: '0.75rem', color: '#999' }}>
                            +{template.variables.length - 8} more
                          </span>
                                )}
                              </div>
                            </div>
                        )}
                        <p style={{ margin: '0.75rem 0 0 0', color: '#999', fontSize: '0.8rem' }}>
                          Last updated: {template.updatedAt ? formatDateTime(template.updatedAt) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
};

export default EmailTemplateList;

