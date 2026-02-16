import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

/**
 * Global authentication redirect hook
 * Handles redirecting unauthenticated users to login with backUrl parameter
 * and redirecting back after successful login
 */
export const useAuthRedirect = (options = {}) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    requireAuth = true,           // Whether authentication is required
    redirectTo = '/login',       // Where to redirect for login
    fallbackRedirect = '/',      // Where to go after login if no backUrl
    allowPublic = false          // Allow public access without auth
  } = options;

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) return;

    // If auth is required and user is not authenticated
    if (requireAuth && !user && !allowPublic) {
      // Create backUrl from current location
      const currentPath = location.pathname + location.search + location.hash;
      
      // Only add backUrl if it's not already the login page
      if (currentPath !== redirectTo && !currentPath.includes('/login')) {
        const loginUrl = `${redirectTo}?backUrl=${encodeURIComponent(currentPath)}`;
        navigate(loginUrl, { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    }
  }, [user, authLoading, requireAuth, allowPublic, redirectTo, location, navigate]);

  // Function to handle post-login redirect
  const handlePostLoginRedirect = () => {
    const urlParams = new URLSearchParams(location.search);
    const backUrl = urlParams.get('backUrl');
    
    if (backUrl) {
      // Validate the backUrl to prevent open redirects
      try {
        const url = new URL(backUrl, window.location.origin);
        // Only allow same-origin redirects
        if (url.origin === window.location.origin) {
          navigate(backUrl, { replace: true });
          return true;
        }
      } catch (error) {
        console.warn('Invalid backUrl:', backUrl);
      }
    }
    
    // Fallback to default redirect
    navigate(fallbackRedirect, { replace: true });
    return false;
  };

  return {
    user,
    authLoading,
    isAuthenticated: !!user,
    handlePostLoginRedirect
  };
};

// Note: The withAuthRedirect HOC has been removed since hooks should not contain JSX
// Use the ProtectedRoute component instead for wrapping components with auth guards

export default useAuthRedirect;
