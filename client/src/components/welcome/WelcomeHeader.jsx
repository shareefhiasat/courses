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
  const rank = lang === 'ar' ? (user?.rankAr || user?.rankEn) : (user?.rankEn || user?.rankAr);
  const displayUser = rank ? `${rank} ${userName}` : userName;

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
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
          color: isDark ? '#f1f5f9' : '#1e293b',
        }}displayU
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
