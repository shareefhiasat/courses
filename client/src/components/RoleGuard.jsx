import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Loading } from '@ui';
import { useLang } from '@contexts/LangContext';
import logger from '@utils/logger';

/**
 * RoleGuard Component
 * 
 * Protects routes based on role-based access control.
 * Checks if the current user's role has permission to access a screen.
 * Redirects to /unauthorized if access is denied.
 * 
 * Usage:
 * <RoleGuard screenId="dashboard">
 *   <YourComponent />
 * </RoleGuard>
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string} props.screenId - Screen ID from screenDefinitions.js
 * @param {string} props.screenName - Optional display name for the screen
 * @param {React.ReactNode} props.loadingComponent - Optional custom loading component
 */
const RoleGuard = ({ 
  children, 
  screenId,
  screenName,
  loadingComponent = null 
}) => {
  const { hasAccess, loading } = useRoleAccess();
  const location = useLocation();
  const { t } = useLang();

  // Show loading while checking permissions
  if (loading) {
    if (loadingComponent) {
      return loadingComponent;
    }
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <Loading variant="overlay" message={t('checking_permissions') || 'Checking permissions...'} />
      </div>
    );
  }

  // Check if user has access to this screen
  const authorized = hasAccess(screenId);

  if (!authorized) {
    logger.warn(`[RoleGuard] Access denied to screen: ${screenId}`);
    
    // Redirect to unauthorized page with context
    return (
      <Navigate 
        to={`/unauthorized?backUrl=${encodeURIComponent(location.pathname)}${screenName ? `&screen=${encodeURIComponent(screenName)}` : ''}`}
        replace 
        state={{ from: location.pathname }}
      />
    );
  }

  // User is authorized, render children
  return <>{children}</>;
};

/**
 * Higher-Order Component version of RoleGuard
 * 
 * Usage:
 * const ProtectedComponent = withRoleGuard(YourComponent, {
 *   screenId: 'dashboard',
 *   screenName: 'Dashboard'
 * });
 */
export const withRoleGuard = (Component, options = {}) => {
  const { screenId, screenName, ...restOptions } = options;
  
  return (props) => (
    <RoleGuard screenId={screenId} screenName={screenName} {...restOptions}>
      <Component {...props} />
    </RoleGuard>
  );
};

export default RoleGuard;
