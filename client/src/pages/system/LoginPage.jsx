import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import AuthForm from '@/components/AuthForm';
import { Container } from '@ui';
import { GlobalLoadingFallback } from '@/contexts/GlobalLoadingContext';
import { Navbar } from '@ui';
import VersionDisplay from '@ui/VersionDisplay/VersionDisplay';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const { t } = useLang();
  const [logoutReason, setLogoutReason] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';
  
  const pageClass = `${styles.loginPage} ${isDark ? styles.dark : ''}`;

  // Handle post-login redirect with backUrl
  const handlePostLoginRedirect = useCallback(() => {
    const urlParams = new URLSearchParams(location.search);
    const backUrl = urlParams.get('backUrl');
    
    if (backUrl) {
      // Validate the backUrl to prevent open redirects
      try {
        const url = new URL(backUrl, window.location.origin);
        // Only allow same-origin redirects
        if (url.origin === window.location.origin) {
          return <Navigate to={backUrl} replace />;
        }
      } catch (error) {
        console.warn('Invalid backUrl:', backUrl);
      }
    }
    
    // Fallback to default redirect
    return <Navigate to="/" replace />;
  }, [location]);

  // Check for logout reason on component mount
  useEffect(() => {
    const reason = sessionStorage.getItem('logoutReason');
    const timestamp = sessionStorage.getItem('logoutTimestamp');
    const lastActivity = sessionStorage.getItem('lastActivityTime');
    
    if (reason && timestamp) {
      const logoutTime = new Date(parseInt(timestamp));
      const timeAgo = getTimeAgo(logoutTime);
      
      let lastActivityInfo = null;
      if (lastActivity) {
        const lastActivityTime = new Date(parseInt(lastActivity));
        const inactiveDuration = Math.floor((logoutTime - lastActivityTime) / 1000 / 60); // minutes
        lastActivityInfo = {
          time: lastActivityTime,
          inactiveMinutes: inactiveDuration
        };
      }
      
      setLogoutReason({
        type: reason,
        timeAgo: timeAgo,
        timestamp: logoutTime,
        lastActivity: lastActivityInfo
      });
      
      // Clear the logout reason after displaying it
      sessionStorage.removeItem('logoutReason');
      sessionStorage.removeItem('logoutTimestamp');
      sessionStorage.removeItem('lastActivityTime');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTimeAgo = useCallback((date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return t('just_now') || 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t('minute') || 'minute'}${Math.floor(seconds / 60) > 1 ? (t('minutes_plural') || 's') : ''} ${t('ago') || 'ago'}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t('hour') || 'hour'}${Math.floor(seconds / 3600) > 1 ? (t('hours_plural') || 's') : ''} ${t('ago') || 'ago'}`;
    return `${Math.floor(seconds / 86400)} ${t('day') || 'day'}${Math.floor(seconds / 86400) > 1 ? (t('days_plural') || 's') : ''} ${t('ago') || 'ago'}`;
  }, [t]);

  const getLogoutMessage = useCallback((reason) => {
    switch (reason.type) {
      case 'session_timeout':
        let message = `${t('auto_logout_inactivity') || 'You were automatically logged out due to inactivity'} ${reason.timeAgo}.`;
        if (reason.lastActivity) {
          const inactiveMinutes = reason.lastActivity.inactiveMinutes;
          if (inactiveMinutes >= 30) {
            message += ` ${t('last_activity_minutes') || 'Last activity was'} ${inactiveMinutes} ${t('minute') || 'minute'}${inactiveMinutes > 1 ? (t('minutes_plural') || 's') : ''} ${t('ago') || 'ago'}.`;
          } else {
            message += ` ${t('last_activity_just_now') || 'Last activity was just now'}.`;
          }
        }
        return {
          title: t('session_expired') || 'Session Expired',
          message: message,
          type: 'warning',
          icon: '⏰'
        };
      case 'manual_logout':
        return {
          title: t('successfully_logged_out') || 'Successfully Logged Out',
          message: `${t('you_logged_out') || 'You logged out'} ${reason.timeAgo}.`,
          type: 'info',
          icon: '👋'
        };
      case 'network_error':
        return {
          title: t('connection_lost') || 'Connection Lost',
          message: `${t('logged_out_network_issues') || 'You were logged out due to network issues'} ${reason.timeAgo}.`,
          type: 'error',
          icon: '🔌'
        };
      case 'auth_error':
        return {
          title: t('authentication_error') || 'Authentication Error',
          message: `${t('logged_out_auth_issue') || 'You were logged out due to an authentication issue'} ${reason.timeAgo}.`,
          type: 'error',
          icon: '⚠️'
        };
      default:
        return {
          title: t('session_ended') || 'Session Ended',
          message: `${t('session_ended_time') || 'Your session ended'} ${reason.timeAgo}.`,
          type: 'info',
          icon: 'ℹ️'
        };
    }
  }, [t]);

  if (loading) {
    return <GlobalLoadingFallback />;
  }

  if (user) {
    return handlePostLoginRedirect();
  }

  return (
    <div className={pageClass}>
      {/* Add Navbar without SideDrawer and hamburger menu */}
      <Navbar hideHamburger={true} />
      
      <Container maxWidth="sm" className={styles.formContainer}>
        <AuthForm />
        
        {/* Logout Reason Message - Moved to bottom */}
        {logoutReason && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: `1px solid ${
              logoutReason.type === 'error' ? '#ef4444' :
              logoutReason.type === 'warning' ? '#f59e0b' : '#3b82f6'
            }`,
            background: isDark ? '#1f2937' : '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            animation: 'slideUp 0.3s ease-out',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                {getLogoutMessage(logoutReason).icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                  margin: '0 0 0.25rem 0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isDark ? '#f3f4f6' : '#111827',
                  wordBreak: 'break-word'
                }}>
                  {getLogoutMessage(logoutReason).title}
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: isDark ? '#d1d5db' : '#6b7280',
                  lineHeight: '1.4',
                  wordBreak: 'break-word'
                }}>
                  {getLogoutMessage(logoutReason).message}
                </p>
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.625rem',
                  color: isDark ? '#9ca3af' : '#9ca3af'
                }}>
                  {t('logout_time') || 'Logout time'}: {logoutReason.timestamp.toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={() => setLogoutReason(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  flexShrink: 0
                }}
                title={t('dismiss_message') || 'Dismiss message'}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </Container>
      
      {/* Version Display */}
      <VersionDisplay />
      
      {/* Add slideUp animation */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
