import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LangContext';
import AuthForm from '../components/AuthForm';
import { Container, Spinner } from '../components/ui';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const { t } = useLang();
  const [logoutReason, setLogoutReason] = useState(null);
  const isDark = theme === 'dark';
  
  const pageClass = `${styles.loginPage} ${isDark ? styles.dark : ''}`;

  // Check for logout reason on component mount
  useEffect(() => {
    const reason = sessionStorage.getItem('logoutReason');
    const timestamp = sessionStorage.getItem('logoutTimestamp');
    
    if (reason && timestamp) {
      const logoutTime = new Date(parseInt(timestamp));
      const timeAgo = getTimeAgo(logoutTime);
      
      setLogoutReason({
        type: reason,
        timeAgo: timeAgo,
        timestamp: logoutTime
      });
      
      // Clear the logout reason after displaying it
      sessionStorage.removeItem('logoutReason');
      sessionStorage.removeItem('logoutTimestamp');
    }
  }, []);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) > 1 ? 's' : ''} ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
    return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
  };

  const getLogoutMessage = (reason) => {
    switch (reason.type) {
      case 'session_timeout':
        return {
          title: 'Session Expired',
          message: `You were automatically logged out due to inactivity ${reason.timeAgo}.`,
          type: 'warning',
          icon: '⏰'
        };
      case 'manual_logout':
        return {
          title: 'Successfully Logged Out',
          message: `You logged out ${reason.timeAgo}.`,
          type: 'info',
          icon: '👋'
        };
      case 'network_error':
        return {
          title: 'Connection Lost',
          message: `You were logged out due to network issues ${reason.timeAgo}.`,
          type: 'error',
          icon: '🔌'
        };
      case 'auth_error':
        return {
          title: 'Authentication Error',
          message: `You were logged out due to an authentication issue ${reason.timeAgo}.`,
          type: 'error',
          icon: '⚠️'
        };
      default:
        return {
          title: 'Session Ended',
          message: `Your session ended ${reason.timeAgo}.`,
          type: 'info',
          icon: 'ℹ️'
        };
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={pageClass}>
      <Container maxWidth="sm" className={styles.formContainer}>
        {/* Logout Reason Message */}
        {logoutReason && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: `1px solid ${
              logoutReason.type === 'error' ? '#ef4444' :
              logoutReason.type === 'warning' ? '#f59e0b' : '#3b82f6'
            }`,
            background: isDark ? '#1f2937' : '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>
                {getLogoutMessage(logoutReason).icon}
              </span>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  margin: '0 0 0.25rem 0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isDark ? '#f3f4f6' : '#111827'
                }}>
                  {getLogoutMessage(logoutReason).title}
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: isDark ? '#d1d5db' : '#6b7280',
                  lineHeight: '1.4'
                }}>
                  {getLogoutMessage(logoutReason).message}
                </p>
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.625rem',
                  color: isDark ? '#9ca3af' : '#9ca3af'
                }}>
                  Logout time: {logoutReason.timestamp.toLocaleTimeString()}
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
                  fontSize: '0.75rem'
                }}
                title="Dismiss message"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        <AuthForm />
      </Container>
      
      {/* Add slideDown animation */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
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
