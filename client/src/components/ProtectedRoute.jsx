import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Navigate } from 'react-router-dom';
import RoleGuard from './RoleGuard';
import { GlobalLoadingFallback } from '@/contexts/GlobalLoadingContext';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
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

  // Show loading while Keycloak is initializing
  if (!initialized) {
    info('🔄 ProtectedRoute - Keycloak initializing...');
    if (loadingComponent) {
      return loadingComponent;
    }
    return <GlobalLoadingFallback />;
  }

  // If not authenticated and auth is required, redirect to login
  // Use Keycloak as the primary source of truth for authentication
  // But also check if there's a valid token (handles timing issues during refresh)
  const hasValidToken = keycloak.token && !keycloak.tokenExpired;
  if (!keycloak.authenticated && !hasValidToken && !allowPublic) {
    info('🚫 ProtectedRoute - Not authenticated, redirecting to login...');
    // Pass the current location to LoginPage so it can redirect back after login
    return <Navigate to="/login" state={{ from: window.location.pathname + window.location.search }} replace />;
  }

  // If Keycloak is not authenticated but has a valid token, wait a moment
  // This handles the timing issue during refresh when authenticated might be temporarily false
  if (!keycloak.authenticated && hasValidToken) {
    info('⏳ ProtectedRoute - Keycloak not authenticated but has valid token, waiting...');
    if (loadingComponent) {
      return loadingComponent;
    }
    return <GlobalLoadingFallback />;
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
