import React, { useState } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Input } from '@ui';
import { getSMTPConfig, updateSMTPConfig } from '@firebaseServices/emailService';

const SMTPPage = ({ user, theme }) => {
  const { t } = useLang();
  const toast = useToast();
  
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: 587, secure: false, user: '', password: '', senderName: 'CS Learning Hub', __loaded: false });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // Load SMTP config on mount
  React.useEffect(() => {
    if (!smtpLoading && !smtpConfig.__loaded) {
      (async () => {
        setSmtpLoading(true);
        const r = await getSMTPConfig();
        if (r.success && r.data) setSmtpConfig({ ...r.data, __loaded: true });
        else setSmtpConfig(s => ({ ...s, __loaded: true }));
        setSmtpLoading(false);
      })();
    }
  }, [smtpLoading, smtpConfig.__loaded]);

  return (
    <div className="smtp-tab">
      {/* Deprecation Notice */}
      <div style={{ 
        padding: '1rem 1.5rem', 
        background: '#fef3c7', 
        border: '1px solid #fbbf24', 
        borderRadius: 12, 
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          {getThemedIcon('ui', 'alert_triangle', 20, theme)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#92400e' }}>
            ⚠️ SMTP Configuration Deprecated
          </div>
          <div style={{ color: '#78350f', fontSize: '0.9rem', lineHeight: '1.5' }}>
            SMTP configuration is now managed via <strong>environment variables</strong> for better testing, tracking, and single source of truth.
            <br />
            <br />
            <strong>Configuration:</strong>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Production: Set <code>VITE_SMTP_*</code> variables in <code>.env</code></li>
              <li>Testing: Set <code>VITE_USE_TEST_SMTP=true</code> to use Mailtrap</li>
              <li>Fallback: Firestore <code>config/smtp</code> (if env vars not set)</li>
              <li>Default: Gmail super admin (last resort)</li>
            </ul>
            <br />
            See <code>client/env.template</code> for all SMTP environment variables.
            <br />
            <br />
            <strong>This UI will be removed in a future version.</strong> Please migrate to environment variables.
          </div>
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: '1.5rem', maxWidth: 760, opacity: 0.6 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <Input
              label={t('smtp_host')}
              value={smtpConfig.host}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
              placeholder="smtp.gmail.com"
              fullWidth
            />
            <Input
              label={t('smtp_port')}
              type="number"
              value={smtpConfig.port}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value || '0') })}
              placeholder="587"
              fullWidth
            />
            <Input
              label={t('sender_name')}
              value={smtpConfig.senderName}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, senderName: e.target.value })}
              fullWidth
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label={t('email_address')}
              type="email"
              value={smtpConfig.user}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
              placeholder="your-email@gmail.com"
              fullWidth
            />
            <Input
               label={t('app_password')}
               type="password"
               value={smtpConfig.password}
               onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
               placeholder={t('app_password') || 'App Password'}
               fullWidth
             />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
            <Button
              variant="success"
              onClick={() => {
                setTestEmailAddress(user?.email || smtpConfig.user);
                setTestEmailDialogOpen(true);
              }}
              disabled={smtpTesting}
              style={{ minWidth: '120px' }}
            >
              {smtpTesting ? t('testing') || 'Testing...' : t('test_email')}
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  setSmtpSaving(true);
                  const payload = {
                    host: smtpConfig.host,
                    port: smtpConfig.port,
                    secure: smtpConfig.secure,
                    user: smtpConfig.user,
                    password: smtpConfig.password,
                    senderName: smtpConfig.senderName,
                  };
                  const r = await updateSMTPConfig(payload);
                  if (r.success) toast?.showSuccess('SMTP configuration saved!');
                  else toast?.showError('Failed: ' + r.error);
                } finally {
                  setSmtpSaving(false);
                }
              }}
              disabled={smtpSaving}
              style={{ minWidth: '120px' }}
            >
              {smtpSaving ? t('saving') || 'Saving...' : t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMTPPage;
