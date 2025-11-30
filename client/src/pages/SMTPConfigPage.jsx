import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getSMTPConfig, updateSMTPConfig, sendEmail as sendEmailFn } from '../firebase/firestore';
import { Container, Card, CardBody, Button, Input, Spinner, Badge, useToast } from '../components/ui';
import { Mail, Server, Key, User as UserIcon } from 'lucide-react';
import styles from './SMTPConfigPage.module.css';

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
      toast.success('SMTP configuration saved successfully');
    } else {
      toast.error('Failed to save configuration: ' + result.error);
    }
    
    setSaving(false);
  };

  const handleTestEmail = async () => {
    try {
      if (!config.user || !config.password) {
        toast.error('Please save a valid SMTP config first');
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
        toast.success('✅ Test email sent to ' + to);
      } else {
        const errorMsg = resp.error || 'Unknown error';
        toast.error(`❌ Failed to send test email: ${errorMsg}`);
        console.error('[SMTP Test] Full error:', resp);
        setTimeout(() => {
          toast.info('💡 Check Cloud Functions logs in Firebase Console for detailed error information');
        }, 2000);
      }
    } catch (err) {
      toast.error('❌ Failed to send test email: ' + (err.message || err));
      console.error('[SMTP Test] Exception:', err);
    }
  };

  if (!user || !isAdmin) return <Navigate to="/" />;
  
  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Container maxWidth="md" className={styles.page}>
      <div className={styles.header}>
        <Mail size={32} className={styles.headerIcon} />
        <div>
          <h1 className={styles.title}>SMTP Configuration</h1>
          <p className={styles.subtitle}>Configure email server settings</p>
        </div>
      </div>

      <Card>
        <CardBody>
          <div className={styles.instructions}>
            <h3>📌 Setup Instructions</h3>
            <ol>
              <li>Go to your Google Account settings</li>
              <li>Enable 2-Factor Authentication</li>
              <li>Go to Security → App Passwords</li>
              <li>Generate an app password for "Mail"</li>
              <li>Copy the 16-character password and paste below</li>
            </ol>
          </div>

          <form onSubmit={handleSave} className={styles.form}>
            <Input
              type="text"
              label="🌐 SMTP Host"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder={t('smtp_host_placeholder')}
              icon={<Server size={18} />}
              required
            />

            <Input
              type="number"
              label="🔌 SMTP Port"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
              placeholder={t('smtp_port_placeholder')}
              helperText="Use 587 for TLS or 465 for SSL"
              required
            />

            <Input
              type="email"
              label="📧 Email Address"
              value={config.user}
              onChange={(e) => setConfig({ ...config, user: e.target.value })}
              placeholder={t('email_placeholder')}
              icon={<Mail size={18} />}
              required
            />

            <Input
              type="password"
              label="🔑 App Password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              placeholder={t('app_password_placeholder')}
              icon={<Key size={18} />}
              helperText="Not your regular password - use Google App Password"
              className={styles.passwordInput}
              required
            />

            <Input
              type="text"
              label="👤 Sender Name"
              value={config.senderName}
              onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
              placeholder={t('sender_name_placeholder')}
              icon={<UserIcon size={18} />}
              helperText="This will appear as the sender name in emails"
              required
            />

            <div className={styles.actions}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={saving}
                loading={saving}
                fullWidth
              >
                {saving ? '⏳ Saving...' : '💾 Save Configuration'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleTestEmail}
              >
                📨 Test Email
              </Button>
            </div>
          </form>

          {config.user && config.password && (
            <div className={styles.successBanner}>
              <span className={styles.successIcon}>✅</span>
              <div>
                <strong>SMTP Configured</strong>
                <p>Email notifications are active and ready to use</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </Container>
  );
};

export default SMTPConfigPage;
