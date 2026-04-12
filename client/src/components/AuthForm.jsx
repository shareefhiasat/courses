/**
 * AuthForm - Keycloak Integration
 * 
 * Simple redirect to Keycloak login
 */

import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';

import { info, error, warn, debug } from '@services/utils/logger.js';

import './AuthForm.css';

const AuthForm = () => {
  const { keycloak } = useKeycloak();
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';

  const handleLogin = () => {
    keycloak.login({
      redirectUri: window.location.origin
    });
  };

  return (
    <div className={`auth-form ${isDark ? 'dark' : 'light'}`}>
      <div className="auth-form-header">
        <div className="auth-form-icon">
          {getThemedIcon('military', isDark)}
        </div>
        <h2 className="auth-form-title">
          {t ? t('military_lms_login') : 'Military LMS Login'}
        </h2>
        <p className="auth-form-subtitle">
          {t ? t('sign_in_with_keycloak') : 'Sign in with your military credentials'}
        </p>
      </div>

      <div className="auth-form-body">
        <button
          onClick={handleLogin}
          className="auth-form-button"
          type="button"
        >
          {getThemedIcon('login', isDark)}
          <span>{t ? t('login_with_keycloak') : 'Login with Keycloak'}</span>
        </button>

        <div className="auth-form-help">
          <h4>{t ? t('test_credentials') : 'Test Credentials'}</h4>
          <div className="auth-form-credentials">
            <p><strong>Email:</strong> shareef.hiasat@gmail.com</p>
            <p><strong>Password:</strong> Test123@</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
