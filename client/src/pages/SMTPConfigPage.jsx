import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getSMTPConfig, updateSMTPConfig, sendEmail as sendEmailFn } from '../firebase/firestore';
import { useToast } from '../components/ToastProvider';
import Loading from '../components/Loading';
import './DashboardPage.css';

const SMTPConfigPage = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    password: '',
    senderName: 'CS Learning Hub'
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const result = await getSMTPConfig();
    if (result.success && result.data) {
      setConfig(result.data);
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const result = await updateSMTPConfig(config);
    
    if (result.success) {
      toast?.showSuccess('SMTP configuration saved successfully');
    } else {
      toast?.showError('Failed to save configuration: ' + result.error);
    }
    
    setSaving(false);
  };

  const handleTestEmail = async () => {
    try {
      if (!config.user || !config.password) {
        toast?.showError('Please save a valid SMTP config first');
        return;
      }
      const to = user.email;
      const subject = 'SMTP Test Email';
      const html = `<div style="font-family:Arial,sans-serif;padding:16px">
        <h2 style="margin:0 0 8px 0">SMTP Test</h2>
        <p>This is a test email from ${config.senderName || 'CS Learning Hub'}.</p>
      </div>`;
      const resp = await sendEmailFn({ to, subject, html, type: 'test' });
      if (resp.success) {
        toast?.showSuccess('✅ Test email sent to ' + to);
      } else {
        const errorMsg = resp.error || 'Unknown error';
        toast?.showError(`❌ Failed to send test email: ${errorMsg}`);
        console.error('[SMTP Test] Full error:', resp);
        // Show hint about Cloud Functions logs
        setTimeout(() => {
          toast?.showInfo('💡 Check Cloud Functions logs in Firebase Console for detailed error information (us-central1/sendEmail)');
        }, 2000);
      }
    } catch (err) {
      toast?.showError('❌ Failed to send test email: ' + (err.message || err));
      console.error('[SMTP Test] Exception:', err);
    }
  };

  if (!user || !isAdmin) return <Navigate to="/" />;
  if (loading) return <Loading />;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>📧 SMTP Configuration</h1>
        <p>Configure email server settings</p>
      </div>

      <div className="dashboard-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            background: '#e3f2fd', 
            padding: '1rem', 
            borderRadius: '8px',
            marginBottom: '2rem',
            borderLeft: '4px solid #2196f3'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>📌 Setup Instructions</h3>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>Go to your Google Account settings</li>
              <li>Enable 2-Factor Authentication</li>
              <li>Go to Security → App Passwords</li>
              <li>Generate an app password for "Mail"</li>
              <li>Copy the 16-character password and paste below</li>
            </ol>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* SMTP Host */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  🌐 SMTP Host
                </label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  placeholder={t('smtp_host_placeholder')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>

              {/* SMTP Port */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  🔌 SMTP Port
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                  placeholder={t('smtp_port_placeholder')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  required
                />
                <small style={{ color: '#666' }}>Use 587 for TLS or 465 for SSL</small>
              </div>

              {/* Email Address */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  📧 Email Address
                </label>
                <input
                  type="email"
                  value={config.user}
                  onChange={(e) => setConfig({ ...config, user: e.target.value })}
                  placeholder={t('email_placeholder')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>

              {/* App Password */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  🔑 App Password
                </label>
                <input
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder={t('app_password_placeholder')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'monospace'
                  }}
                  required
                />
                <small style={{ color: '#666' }}>Not your regular password - use Google App Password</small>
              </div>

              {/* Sender Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  👤 Sender Name
                </label>
                <input
                  type="text"
                  value={config.senderName}
                  onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                  placeholder={t('sender_name_placeholder')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  required
                />
                <small style={{ color: '#666' }}>This will appear as the sender name in emails</small>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #eee'
              }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? '⏳ Saving...' : '💾 Save Configuration'}
                </button>
                
                <button
                  type="button"
                  onClick={handleTestEmail}
                  style={{
                    padding: '1rem 2rem',
                    background: 'white',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  📨 Test Email
                </button>
              </div>
            </div>
          </form>

          {/* Success Indicator */}
          {config.user && config.password && (
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#e8f5e9',
              borderRadius: '8px',
              borderLeft: '4px solid #4caf50',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '2rem' }}>✅</span>
              <div>
                <strong style={{ color: '#2e7d32' }}>SMTP Configured</strong>
                <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  Email notifications are active and ready to use
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SMTPConfigPage;
