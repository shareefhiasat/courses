import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastProvider';
import ToggleSwitch from './ToggleSwitch';

const EmailSettings = ({ onEditTemplate }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(null);
  const [settings, setSettings] = useState({
    announcements: { enabled: true, template: 'announcement_default' },
    activities: { enabled: true, template: 'activity_default' },
    activityComplete: { enabled: true, template: 'activity_complete_default' },
    activityGraded: { enabled: true, requireConfirmation: true, template: 'activity_graded_default' },
    enrollments: { enabled: true, template: 'enrollment_default' },
    resources: { enabled: true, template: 'resource_default' },
    chatDigest: { enabled: true, intervalHours: 3, template: 'chat_digest_default' },
    passwordReset: { enabled: true, template: 'password_reset_default' },
    welcomeSignup: { enabled: true, template: 'welcome_signup_default' }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const docRef = doc(db, 'config', 'emailSettings');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings({ ...settings, ...docSnap.data() });
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const docRef = doc(db, 'config', 'emailSettings');
      await setDoc(docRef, settings);
      
      toast?.showSuccess('Email settings saved successfully!');
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast?.showError('Failed to save settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, field, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const settingsConfig = [
    {
      key: 'announcements',
      icon: '📢',
      title: 'Announcements',
      description: 'Send email when announcement is created',
      hasConfirmation: false
    },
    {
      key: 'activities',
      icon: '📝',
      title: 'New Activities',
      description: 'Send email when activity is published',
      hasConfirmation: false
    },
    {
      key: 'activityComplete',
      icon: '✅',
      title: 'Activity Completed (Student → Admin)',
      description: 'Notify admin when student marks activity as complete',
      hasConfirmation: false
    },
    {
      key: 'activityGraded',
      icon: '🎯',
      title: 'Activity Graded (Admin → Student)',
      description: 'Send email when admin assigns grade',
      hasConfirmation: true
    },
    {
      key: 'enrollments',
      icon: '🎓',
      title: 'Enrollment Welcome',
      description: 'Send welcome email when student is enrolled in class',
      hasConfirmation: false
    },
    {
      key: 'resources',
      icon: '📚',
      title: 'New Resources',
      description: 'Send email when resource is added',
      hasConfirmation: false
    },
    {
      key: 'chatDigest',
      icon: '💬',
      title: 'Chat Digest',
      description: 'Send periodic digest of unread messages',
      hasConfirmation: false,
      hasInterval: true
    },
    {
      key: 'passwordReset',
      icon: '🔑',
      title: 'Password Reset',
      description: 'Send email when admin sends password reset link',
      hasConfirmation: false
    },
    {
      key: 'welcomeSignup',
      icon: '🎉',
      title: 'Welcome on Signup',
      description: 'Send welcome email when user signs up',
      hasConfirmation: false
    }
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Configure email notifications for various events. All emails are bilingual (EN + AR) and use Qatar timezone (UTC+3).
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {settingsConfig.map(config => (
          <div 
            key={config.key}
            style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: 12,
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>{config.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>{config.title}</h3>
                  <ToggleSwitch
                    checked={settings[config.key]?.enabled || false}
                    onChange={(val) => updateSetting(config.key, 'enabled', val)}
                  />
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
                  {config.description}
                </p>

                {settings[config.key]?.enabled && (
                  <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
                    {config.hasConfirmation && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <input
                          type="checkbox"
                          checked={settings[config.key]?.requireConfirmation || false}
                          onChange={(e) => updateSetting(config.key, 'requireConfirmation', e.target.checked)}
                        />
                        <span>Require confirmation before sending</span>
                      </label>
                    )}

                    {config.hasInterval && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <label>Send every</label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={settings[config.key]?.intervalHours || 3}
                          onChange={(e) => updateSetting(config.key, 'intervalHours', parseInt(e.target.value))}
                          style={{ width: 60, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }}
                        />
                        <label>hours</label>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const templateId = settings[config.key]?.template;
                          if (onEditTemplate) {
                            onEditTemplate(templateId);
                          } else {
                            // Navigate to email templates with highlight
                            navigate(`/dashboard?tab=email-templates&highlight=${templateId}`);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#f8f9fa',
                          color: '#333',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        📝 Edit Template
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setTestingEmail(config.key);
                          try {
                            const { httpsCallable } = await import('firebase/functions');
                            const { functions } = await import('../firebase/config');
                            const { auth } = await import('../firebase/config');
                            
                            const testSMTP = httpsCallable(functions, 'testSMTP');
                            const result = await testSMTP({
                              to: auth.currentUser?.email,
                              subject: `Test: ${config.title}`,
                              body: `This is a test email for ${config.title} trigger.`
                            });
                            
                            if (result.data.success) {
                              toast?.showSuccess('Test email sent! Check your inbox.');
                            } else {
                              toast?.showError('Failed to send test email: ' + result.data.error);
                            }
                          } catch (error) {
                            console.error('Test email error:', error);
                            toast?.showError('Failed to send test email: ' + error.message);
                          } finally {
                            setTestingEmail(null);
                          }
                        }}
                        disabled={testingEmail === config.key}
                        style={{
                          padding: '6px 12px',
                          background: '#f8f9fa',
                          color: '#333',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          cursor: testingEmail === config.key ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem',
                          opacity: testingEmail === config.key ? 0.6 : 1
                        }}
                      >
                        {testingEmail === config.key ? '⏳ Sending...' : '📧 Test Email'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <button
          onClick={saveSettings}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #800020, #600018)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};

export default EmailSettings;
