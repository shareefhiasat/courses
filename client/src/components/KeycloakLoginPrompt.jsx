import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './KeycloakLoginPrompt.module.css';

const KeycloakLoginPrompt = () => {
  const { keycloak } = useKeycloak();
  const { theme } = useTheme();
  const { t } = useLang();

  const handleLogin = () => {
    keycloak.login({
      redirectUri: window.location.origin
    });
  };

  return (
    <div className={`${styles.prompt} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <div className={styles.header}>
        <div className={styles.icon}>
          {getThemedIcon('ui', 'shield', 32, theme)}
        </div>
        <h2 className={styles.title}>{t('login_title')}</h2>
        <p className={styles.subtitle}>{t('login_subtitle')}</p>
      </div>

      <button onClick={handleLogin} className={styles.button} type="button">
        {getThemedIcon('ui', 'login', 18, theme)}
        <span>{t('login_with_keycloak')}</span>
      </button>
    </div>
  );
};

export default KeycloakLoginPrompt;
