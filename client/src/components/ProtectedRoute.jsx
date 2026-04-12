import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Navigate } from 'react-router-dom';
import RoleGuard from './RoleGuard';
import { GlobalLoadingFallback } from '@/contexts/GlobalLoadingContext';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * ProtectedRoute Component
 * 
 * A comprehensive wrapper component that protects routes with:
 * 1. Authentication check (redirects to login if not authenticated)
 * 2. Authorization check (redirects to unauthorized if role doesn't have access)
 * 
 * Usage:
 * // Authentication only
 * <ProtectedRoute>
 *   <YourComponent />
 * </ProtectedRoute>
 * 
 * // Authentication + Authorization
 * <ProtectedRoute screenId="dashboard" screenName="Dashboard">
 *   <YourComponent />
 * </ProtectedRoute>
 * 
 * // Public route (no auth required)
 * <ProtectedRoute allowPublic={true}>
 *   <YourComponent />
 * </ProtectedRoute>
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string} props.screenId - Optional screen ID for role-based access control
 * @param {string} props.screenName - Optional display name for the screen
 * @param {string} props.redirectTo - Login page path (default: '/login')
 * @param {string} props.fallbackRedirect - Fallback redirect after login (default: '/')
 * @param {boolean} props.allowPublic - Allow public access without authentication (default: false)
 * @param {React.ReactNode} props.loadingComponent - Optional custom loading component
 */
const ProtectedRoute = ({ 
  children, 
  screenId,
  screenName,
  redirectTo = '/login',
  fallbackRedirect = '/',
  allowPublic = false,
  loadingComponent = null
}) => {
  const { keycloak, initialized } = useKeycloak();

  // Add logging for debugging
  console.log('🛡️ ProtectedRoute - Keycloak State:', {
    initialized,
    authenticated: keycloak?.authenticated,
    hasToken: !!keycloak?.token
  });

  // Show loading while Keycloak is initializing
  if (!initialized) {
    info('🔄 ProtectedRoute - Keycloak initializing...');
    if (loadingComponent); {
      return loadingComponent;
    }
    return <GlobalLoadingFallback />;
  }

  // If not authenticated and auth is required, redirect to login
  if (!keycloak.authenticated && !allowPublic) {
    info('🚫 ProtectedRoute - Not authenticated, redirecting to login...');
    return <Navigate to="/login" replace />;
  }

  info('✅ ProtectedRoute - User authenticated, proceeding...');

  // If screenId is provided, wrap with RoleGuard for authorization
  if (screenId) {
    return (
      <RoleGuard 
        screenId={screenId} 
        screenName={screenName}
        loadingComponent={loadingComponent}
      >
        {children}
      </RoleGuard>
    );
  }

  // Render children if authenticated (or public) and no role guard needed
  return <>{children}</>;
};

/**
 * Higher-Order Component version of ProtectedRoute
 * 
 * Usage:
 * const ProtectedComponent = withProtectedRoute(YourComponent, {
 *   screenId: 'dashboard',
 *   screenName: 'Dashboard'
 * });
 */
export const withProtectedRoute = (Component, options = {}) => {
  return (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

export default ProtectedRoute;
