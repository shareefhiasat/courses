import React, { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, Card, CardBody } from '@ui';
import { getThemedIcon, getColoredIcon } from '@constants/iconTypes';
import { getUserRoleDisplay } from '@utils/userUtils';

import { info, error, warn, debug } from '@services/utils/logger.js';import './UnauthorizedPage.css';

/**
 * UnauthorizedPage Component
 * 
 * Displays when a user tries to access a page they don't have permission for.
 * Shows their current role and provides navigation options.
 */
const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, role, isSuperAdmin, loading } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Debug logging
  console.log('🔍 [UnauthorizedPage] Current auth state:', {
    user: user ? { email: user.email, uid: user.uid } : null,
    role,
    isSuperAdmin,
    loading
  });

  // If user is super admin and auth is loaded, redirect to dashboard
  useEffect(() => {
    if (!loading && user && isSuperAdmin) {
      info('🔍 [UnauthorizedPage] Super admin detected, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, isSuperAdmin, navigate]);

  // Get the page they tried to access
  const backUrl = searchParams.get('backUrl') || location.state?.from || '/';
  const screenName = searchParams.get('screen') || t('this_page') || 'this page';

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactAdmin = () => {
    navigate('/chat');
  };

  return (
    <div className="unauthorized-page" data-theme={theme}>
      <div className="unauthorized-container">
        <Card className="unauthorized-card">
          <CardBody className="unauthorized-content">
            {/* Icon */}
            <div className="unauthorized-icon">
              {getColoredIcon('ui', 'shield', 80, isDark ? '#ef4444' : '#dc2626', theme)}
            </div>

            {/* Title */}
            <h1 className="unauthorized-title">
              {t('access_denied') || 'Access Denied'}
            </h1>

            {/* Message */}
            <p className="unauthorized-message">
              {lang === 'ar' 
                ? `عذراً، ليس لديك صلاحية للوصول إلى ${screenName}`
                : `Sorry, you don't have permission to access ${screenName}`
              }
            </p>

            {/* Role Info */}
            {user && role && (
              <div className="unauthorized-role-info">
                <div className="role-badge" data-theme={theme}>
                  {getThemedIcon('ui', 'user', 16, theme)}
                  <span>
                    {t('your_role') || 'Your Role'}: <strong>{getUserRoleDisplay(user, t, lang)}</strong>
                  </span>
                </div>
                <p className="role-hint">
                  {t('contact_admin_for_access') || 'Contact your administrator if you need access to this page.'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="unauthorized-actions">
              <Button
                variant="outline"
                onClick={handleGoBack}
                style={{ minWidth: 120 }}
              >
                <span style={{ marginLeft: lang === 'ar' ? 0 : 8, marginRight: lang === 'ar' ? 8 : 0 }}>
                  {t('go_back') || 'Go Back'}
                </span>
              </Button>

              <Button
                variant="primary"
                onClick={handleGoHome}
                style={{ minWidth: 120 }}
              >
                <span style={{ marginLeft: lang === 'ar' ? 0 : 8, marginRight: lang === 'ar' ? 8 : 0 }}>
                  {t('go_home') || 'Go Home'}
                </span>
              </Button>
            </div>

            {/* Help Text */}
            <div className="unauthorized-help">
              <p>
                {t('unauthorized_help_text') || 
                  'If you believe this is an error, please contact your system administrator to request access to this feature.'}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
