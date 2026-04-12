import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { GlobalLoadingFallback } from '@/contexts/GlobalLoadingContext';
import { useLang } from '@contexts/LangContext';
import { hasScreenAccess } from '@constants/screenDefinitions';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * RoleGuard Component
 * 
 * Protects routes based on Keycloak role-based access control.
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
  const { user, loading, isSuperAdmin } = useAuth();
  const location = useLocation();
  const { t } = useLang();

  // Show loading while checking permissions
  if (loading) {
    if (loadingComponent) {
      return loadingComponent;
    }
    return <GlobalLoadingFallback />;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return (
      <Navigate 
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace 
        state={{ from: location.pathname }}
      />
    );
  }

  // Super admin always has access
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Check if user has access to this screen based on Keycloak roles
  const authorized = hasScreenAccess(screenId, user.roles || []);

  if (!authorized) {
    warn(`[RoleGuard] Access denied to screen: ${screenId}`, {
      userRoles: user.roles,
      screenId
    });
    
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
