import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getUserDisplayName } from '@utils/userUtils';

const WelcomeHeader = ({ user, role }) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const hour = new Date().getHours();
  let greetingKey = 'welcome_good_morning';
  if (hour >= 12 && hour < 17) greetingKey = 'welcome_good_afternoon';
  else if (hour >= 17) greetingKey = 'welcome_good_evening';

  const userName = getUserDisplayName(user, lang);
  const roleLabel = t(`welcome_role_${role}`) || role;

  return (
    <div
      className="welcome-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '32px 16px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--color-primary, #800020)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          fontWeight: 700,
          color: '#fff',
          marginBottom: '8px',
        }}
      >
        {userName?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
          color: isDark ? '#f1f5f9' : '#1e293b',
        }}
      >
        {t(greetingKey)}, {userName}
      </h1>
      <p
        style={{
          fontSize: '14px',
          margin: 0,
          color: isDark ? '#94a3b8' : '#64748b',
        }}
      >
        {t('welcome_subtitle')} — <strong style={{ color: isDark ? '#cbd5e1' : '#475569' }}>{roleLabel}</strong>
      </p>
    </div>
  );
};

export default WelcomeHeader;
