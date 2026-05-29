/**
 * AuthContext - Keycloak Integration
 * 
 * Replaces Firebase Auth with Keycloak authentication
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { info, error, warn, debug } from '@logger';
import { ConfirmModal } from '@ui';
import { ROLES } from '@constants/permissionConfig';
import { useLang } from '@contexts/LangContext';

// Session configuration from environment variables
const SESSION_CONFIG = {
  WARNING_TIME_MINUTES: parseInt(import.meta.env.VITE_SESSION_WARNING_MINUTES || '5'),
  AUTO_LOGOUT_MINUTES: parseInt(import.meta.env.VITE_SESSION_AUTO_LOGOUT_MINUTES || '15'),
  REFRESH_BUFFER_MINUTES: parseInt(import.meta.env.VITE_SESSION_REFRESH_BUFFER_MINUTES || '2'),
  MINIMUM_BUFFER_SECONDS: parseInt(import.meta.env.VITE_SESSION_MINIMUM_BUFFER_SECONDS || '30'),
  EXPIRY_BUFFER_SECONDS: parseInt(import.meta.env.VITE_SESSION_EXPIRY_BUFFER_SECONDS || '10')
};

info('🔧 [SESSION CONFIG] Loaded configuration:', SESSION_CONFIG);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();
  const { t } = useLang();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHR, setIsHR] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [role, setRole] = useState(null);

  // Nextcloud authentication state
  const [nextcloudAuth, setNextcloudAuth] = useState(null);

  // Permissions state (moved from usePermissions hook)
  const [permissions, setPermissions] = useState(null);

  // Session extension modal state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('lastRefreshTime');
    return saved ? parseInt(saved) : null;
  });
  const [countdownTime, setCountdownTime] = useState(null);

  // Debug wrapper for setLastRefreshTime
  const debugSetLastRefreshTime = useCallback((value) => {
    info('🔧 [DIALOG DEBUG] setLastRefreshTime called:', {
      oldValue: lastRefreshTime ? new Date(lastRefreshTime).toISOString() : null,
      newValue: value ? new Date(value).toISOString() : null,
      stackTrace: new Error().stack?.split('\n')[2]?.trim()
    });
    
    // Save to localStorage for persistence across page refreshes
    if (value) {
      localStorage.setItem('lastRefreshTime', value.toString());
    } else {
      localStorage.removeItem('lastRefreshTime');
    }
    
    setLastRefreshTime(value);
  }, [lastRefreshTime]);
  
  // Refs for timers
  const warningTimerRef = useRef(null);
  const autoLogoutTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const lastScheduleTimeRef = useRef(0);
  const lastActivityTimeRef = useRef(Date.now());
  const idleWarningTimerRef = useRef(null);
  const lastIdleDebugTimeRef = useRef(0);
  const lastDialogDebugRef = useRef(0);
  const lastSessionDebugRef = useRef(0);
  const provisioningInProgressRef = useRef(false);

  // Debounced dialog debug to prevent spam
  const debugDialog = useCallback((message, data = {}) => {
    const now = Date.now();
    if (now - lastDialogDebugRef.current > 1000) { // Only log once per second
      // console.log(`⏭️ [DIALOG DEBUG] ${message}`, data);
      lastDialogDebugRef.current = now;
    }
  }, []);

  // Debounced session debug to prevent spam
  const debugSession = useCallback((message, data = {}) => {
    const now = Date.now();
    if (now - lastSessionDebugRef.current > 30000) { // Only log every 30 seconds
      console.log(`🔍 [SESSION DEBUG] ${message}`, data);
      lastSessionDebugRef.current = now;
    }
  }, []);

  /**
   * Nextcloud provisioning removed - using MinIO instead
   * Smart Drive now uses MinIO buckets directly
   */
  const fetchNextcloudAuth = useCallback(async () => {
    // No-op - Nextcloud has been removed
    console.log('[AuthContext] Nextcloud provisioning disabled - using MinIO');
    setNextcloudAuth({ provisioned: false, error: 'Nextcloud removed - using MinIO' });
  }, []);

  /**
   * Fetch permissions with debouncing (only once per session)
   */
  const fetchPermissions = useCallback(async () => {
    // Check if permissions already loaded in this session
    const cachedPermissions = localStorage.getItem('permissions');
    if (cachedPermissions) {
      try {
        setPermissions(JSON.parse(cachedPermissions));
        return;
      } catch (e) {
        // Invalid cache, fetch fresh
      }
    }

    try {
      const token = localStorage.getItem('keycloak_token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1'}/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.data);
        localStorage.setItem('permissions', JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('[AuthContext] Failed to fetch permissions:', error);
    }
  }, []);

  // Schedule warning 5 minutes before token expiry (with debouncing)
  const scheduleSessionWarning = useCallback(() => {
    // Debounce: prevent multiple calls within 500ms
    const now = Date.now();
    if (now - lastScheduleTimeRef.current < 500) {
      debugDialog('Skipping - debounced');
      return;
    }
    lastScheduleTimeRef.current = now;

    debugSession('=== Session Warning Analysis ===');
    debugSession('Current time:', new Date(now).toISOString());
    debugSession('Has token:', !!keycloak.token);
    debugSession('Has tokenParsed:', !!keycloak.tokenParsed);
    debugSession('Token expired:', keycloak.tokenExpired);
    debugSession('Config:', SESSION_CONFIG);

    if (!keycloak.tokenParsed?.exp) {
      debugSession('No token expiry found - cannot schedule warning');
      warn('⚠️ [DIALOG DEBUG] No token expiry found');
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAt = keycloak.tokenParsed.exp;
    const timeUntilExpiry = (expiresAt - nowSec) * 1000;
    const warningTime = SESSION_CONFIG.WARNING_TIME_MINUTES * 60 * 1000;
    const timeUntilWarning = timeUntilExpiry - warningTime;

    debugSession('Token expiry timestamp:', expiresAt);
    debugSession('Token expiry time:', new Date(expiresAt * 1000).toISOString());
    debugSession('Time until expiry:', Math.floor(timeUntilExpiry / 1000), 'seconds');
    debugSession('Warning time:', Math.floor(warningTime / 1000), 'seconds');
    debugSession('Time until warning:', Math.floor(timeUntilWarning / 1000), 'seconds');

    const bufferTime = lastRefreshTime ? SESSION_CONFIG.REFRESH_BUFFER_MINUTES * 60 * 1000 : 0;
    const adjustedTimeUntilWarning = timeUntilWarning - bufferTime;
    const bufferExpired = lastRefreshTime ? (Date.now() - lastRefreshTime) > bufferTime : false;

    debugSession('Buffer time:', Math.floor(bufferTime / 1000), 'seconds');
    debugSession('Adjusted time until warning:', Math.floor(adjustedTimeUntilWarning / 1000), 'seconds');
    debugSession('Buffer expired:', bufferExpired);
    debugSession('Last refresh time:', lastRefreshTime ? new Date(lastRefreshTime).toISOString() : 'none');

    // Clear existing timers
    if (warningTimerRef.current) {
      debugDialog('Clearing existing warning timer');
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (autoLogoutTimerRef.current) {
      debugDialog('Clearing existing auto-logout timer');
      clearTimeout(autoLogoutTimerRef.current);
      autoLogoutTimerRef.current = null;
    }

    if (adjustedTimeUntilWarning > 0) {
      // console.log('⏰ [SESSION DEBUG] Scheduling warning for', Math.floor(adjustedTimeUntilWarning / 1000 / 60), 'minutes');
      warningTimerRef.current = setTimeout(() => {
        // console.log('⚠️ [SESSION DEBUG] Timer triggered - Checking if user is idle before showing warning');
        debugDialog('Timer triggered - Checking if user is idle before showing warning');
        
        // Only show modal if user is idle (no activity in last 5 minutes)
        const idleThreshold = 5 * 60 * 1000; // 5 minutes
        const timeSinceLastActivity = Date.now() - lastActivityTimeRef.current;
        
        if (timeSinceLastActivity > idleThreshold) {
          debugDialog('User is idle, showing session expiration warning');
          setShowSessionModal(true);
        } else {
          debugDialog('User is active, skipping session warning (will auto-refresh if needed)');
          // Don't show modal - auto-refresh will handle it if user is active
        }
      }, adjustedTimeUntilWarning);
    } else if (timeUntilExpiry > 0 && (!lastRefreshTime || bufferExpired)) { // Removed 1-minute requirement
      const timeRemainingSec = Math.floor(timeUntilExpiry / 1000);
      const timeRemainingMin = (timeRemainingSec / 60).toFixed(1);
      // console.log(`⚠️ [SESSION DEBUG] Token expiring in ${timeRemainingSec}s (${timeRemainingMin}min), checking if user is idle`);

      // Only show modal if user is idle
      const idleThreshold = 5 * 60 * 1000; // 5 minutes
      const timeSinceLastActivity = Date.now() - lastActivityTimeRef.current;

      if (timeSinceLastActivity > idleThreshold) {
        // console.log(`⚠️ [SESSION DEBUG] User is idle (inactive for ${Math.floor(timeSinceLastActivity / 1000)}s), showing warning immediately`);
        warn(`⚠️ [DIALOG DEBUG] Token expiring in ${timeRemainingSec}s, showing warning immediately`);
        setShowSessionModal(true);
      } else {
        // console.log(`⚠️ [SESSION DEBUG] User is active (last activity ${Math.floor(timeSinceLastActivity / 1000)}s ago), skipping warning (will auto-refresh)`);
      }
      
      if (bufferExpired) {
        debugSetLastRefreshTime(null);
      }
    } else if (lastRefreshTime && timeUntilExpiry > 0 && !bufferExpired) { // Removed 1-minute requirement
      const minBuffer = SESSION_CONFIG.MINIMUM_BUFFER_SECONDS * 1000;
      const delay = Math.max(minBuffer, timeUntilExpiry - SESSION_CONFIG.EXPIRY_BUFFER_SECONDS * 1000);
      
      // console.log('⏰ [SESSION DEBUG] Scheduling warning after buffer for', Math.floor(delay / 1000), 'seconds');
      warningTimerRef.current = setTimeout(() => {
        // console.log('⚠️ [SESSION DEBUG] Buffer timer triggered - Checking if user is idle');
        debugDialog('Buffer timer triggered - Checking if user is idle');
        
        // Only show modal if user is idle
        const idleThreshold = 5 * 60 * 1000; // 5 minutes
        const timeSinceLastActivity = Date.now() - lastActivityTimeRef.current;
        
        if (timeSinceLastActivity > idleThreshold) {
          debugDialog('User is idle, showing session expiration warning');
          setShowSessionModal(true);
        } else {
          debugDialog('User is active, skipping session warning');
        }
      }, delay);
    } else {
      debugSession('No warning scheduled - conditions not met');
      debugSession('Time until expiry:', Math.floor(timeUntilExpiry / 1000), 'seconds');
      debugSession('Token still valid?', timeUntilExpiry > 0);
      debugSession('Has last refresh?', !!lastRefreshTime);
      debugSession('Buffer expired?', bufferExpired);
      debugDialog('No warning scheduled - conditions not met');
    }
  }, [keycloak, lastRefreshTime, showSessionModal, debugSetLastRefreshTime, debugDialog, debugSession]);

  // Schedule idle timeout warning based on user inactivity
  const scheduleIdleWarning = useCallback(() => {
    const now = Date.now();
    
    // Debounce debug logs to prevent spam (only log every 5 seconds)
    const shouldLogDebug = now - lastIdleDebugTimeRef.current > 5000;
    if (shouldLogDebug) {
      lastIdleDebugTimeRef.current = now;
      
      const timeSinceLastActivity = now - lastActivityTimeRef.current;
      const idleWarningTime = (SESSION_CONFIG.WARNING_TIME_MINUTES - 1) * 60 * 1000; // Show 1 min before auto-logout
      const timeUntilIdleWarning = idleWarningTime - timeSinceLastActivity;
      
      // console.log('🕰️ [IDLE DEBUG] === Idle Timeout Analysis ===');
      // console.log('🕰️ [IDLE DEBUG] Current time:', new Date(now).toISOString());
      // console.log('🕰️ [IDLE DEBUG] Last activity:', new Date(lastActivityTimeRef.current).toISOString());
      // console.log('🕰️ [IDLE DEBUG] Time since last activity:', Math.floor(timeSinceLastActivity / 1000), 'seconds');
      // console.log('🕰️ [IDLE DEBUG] Idle warning time:', Math.floor(idleWarningTime / 1000), 'seconds');
      // console.log('🕰️ [IDLE DEBUG] Time until idle warning:', Math.floor(timeUntilIdleWarning / 1000), 'seconds');
    }

    // Clear existing idle timer
    if (idleWarningTimerRef.current) {
      clearTimeout(idleWarningTimerRef.current);
      idleWarningTimerRef.current = null;
    }

    const timeSinceLastActivity = now - lastActivityTimeRef.current;
    const idleWarningTime = (SESSION_CONFIG.WARNING_TIME_MINUTES - 1) * 60 * 1000;
    const timeUntilIdleWarning = idleWarningTime - timeSinceLastActivity;

    if (timeUntilIdleWarning > 0 && !showSessionModal) {
      if (shouldLogDebug) {
        // console.log('⏰ [IDLE DEBUG] Scheduling idle warning for', Math.floor(timeUntilIdleWarning / 1000), 'seconds');
      }
      idleWarningTimerRef.current = setTimeout(() => {
        console.log('⚠️ [IDLE DEBUG] Idle timeout reached - Showing idle warning');
        setShowSessionModal(true);
      }, timeUntilIdleWarning);
    } else if (timeUntilIdleWarning <= 0 && !showSessionModal) {
      console.log('⚠️ [IDLE DEBUG] User already idle - Showing idle warning immediately');
      setShowSessionModal(true);
    }
  }, [lastActivityTimeRef, showSessionModal, SESSION_CONFIG.WARNING_TIME_MINUTES]);

  // User activity detection - reset idle timer on user interaction
  useEffect(() => {
    const handleUserActivity = async () => {
      const now = Date.now();
      lastActivityTimeRef.current = now;
      
      // Only log activity every 10 seconds to reduce spam
      if (now - lastIdleDebugTimeRef.current > 10000) {
        // console.log('👆 [ACTIVITY] User activity detected, rescheduling both timers');
        lastIdleDebugTimeRef.current = now;
      }
      
      // Auto-refresh token if user is active and token is about to expire (within 2 minutes)
      const nowSec = Math.floor(Date.now() / 1000);
      const expiresAt = keycloak.tokenParsed?.exp;
      const timeUntilExpiry = expiresAt ? (expiresAt - nowSec) : null;
      const refreshThreshold = 120; // 2 minutes in seconds
      
      if (timeUntilExpiry && timeUntilExpiry > 0 && timeUntilExpiry < refreshThreshold) {
        // Check if we recently refreshed (within buffer time)
        const bufferTime = SESSION_CONFIG.REFRESH_BUFFER_MINUTES * 60;
        const recentlyRefreshed = lastRefreshTime && (now - lastRefreshTime) < bufferTime * 1000;

        if (!recentlyRefreshed) {
          const timeRemainingSec = Math.floor(timeUntilExpiry / 1000);
          // console.log(`🔄 [AUTO-REFRESH] User active and token expiring in ${timeRemainingSec}s, auto-refreshing...`);
          try {
            const oldExpiry = keycloak.tokenParsed?.exp;
            const refreshed = await keycloak.updateToken(60); // Refresh if valid for less than 60s
            const newExpiry = keycloak.tokenParsed?.exp;

            if (refreshed && newExpiry > oldExpiry) {
              // console.log('✅ [AUTO-REFRESH] Token auto-refreshed successfully!');
              // console.log('✅ [AUTO-REFRESH] New expiry:', new Date(newExpiry * 1000).toISOString());
              
              // Update localStorage and cookie
              if (keycloak.token) {
                localStorage.setItem('keycloak_token', keycloak.token);
                // Update cookie for image proxy
                document.cookie = `kc_token=${keycloak.token}; path=/api; secure; samesite=strict`;
              }

              // Set refresh time
              const refreshTime = Date.now();
              debugSetLastRefreshTime(refreshTime);
              
              // Reschedule warning with new token
              scheduleSessionWarning();
            }
          } catch (error) {
            console.error('❌ [AUTO-REFRESH] Auto-refresh failed:', error);
          }
        }
      }
      
      // Reschedule both token expiry and idle timeout warnings
      scheduleSessionWarning();
      scheduleIdleWarning();
    };

    // Listen for user activity events
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 
      'click', 'keydown', 'keyup', 'focus', 'blur'
    ];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [showSessionModal, scheduleSessionWarning, scheduleIdleWarning, keycloak, lastRefreshTime, debugSetLastRefreshTime]);

  // Add global functions for testing session management
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.testSessionWarning = () => {
        console.log('🧪 [TEST] Manually triggering session warning for testing');
        setShowSessionModal(true);
      };

      window.testTokenRefresh = async () => {
        console.log('🧪 [TEST] Manually testing token refresh...');
        const oldExpiry = keycloak.tokenParsed?.exp;
        console.log('🧪 [TEST] Current token expiry:', oldExpiry ? new Date(oldExpiry * 1000).toISOString() : 'No expiry');
        
        try {
          const refreshed = await keycloak.updateToken(-1);
          const newExpiry = keycloak.tokenParsed?.exp;
          
          console.log('🧪 [TEST] Refresh result:', refreshed);
          console.log('🧪 [TEST] New token expiry:', newExpiry ? new Date(newExpiry * 1000).toISOString() : 'No expiry');
          
          if (oldExpiry && newExpiry) {
            const extended = newExpiry > oldExpiry;
            console.log('🧪 [TEST] Token extended:', extended ? 'YES ✅' : 'NO ❌');
            if (extended) {
              const extensionMinutes = Math.floor((newExpiry - oldExpiry) / 60);
              console.log('🧪 [TEST] Extended by:', extensionMinutes, 'minutes');
            }
          }

          // Update localStorage and cookie
          if (keycloak.token) {
            localStorage.setItem('keycloak_token', keycloak.token);
            document.cookie = `kc_token=${keycloak.token}; path=/api; secure; samesite=strict`;
          }

          return refreshed;
        } catch (error) {
          console.error('🧪 [TEST] Refresh failed:', error);
          return false;
        }
      };

      window.testSessionInfo = () => {
        const nowSec = Math.floor(Date.now() / 1000);
        const expiresAt = keycloak.tokenParsed?.exp;
        const timeUntilExpiry = expiresAt ? (expiresAt - nowSec) : null;
        
        console.log('🧪 [TEST] === Session Info ===');
        console.log('🧪 [TEST] Current time:', new Date().toISOString());
        console.log('🧪 [TEST] Token expiry:', expiresAt ? new Date(expiresAt * 1000).toISOString() : 'No expiry');
        console.log('🧪 [TEST] Time until expiry:', timeUntilExpiry ? `${Math.floor(timeUntilExpiry / 60)}m ${timeUntilExpiry % 60}s` : 'Unknown');
        console.log('🧪 [TEST] Token length:', keycloak.token?.length || 'No token');
        console.log('🧪 [TEST] Authenticated:', keycloak.authenticated);
        console.log('🧪 [TEST] Token expired:', keycloak.tokenExpired);
        
        return {
          currentTime: new Date().toISOString(),
          tokenExpiry: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
          timeUntilExpiry: timeUntilExpiry,
          authenticated: keycloak.authenticated,
          tokenExpired: keycloak.tokenExpired
        };
      };

      console.log('🧪 [TEST] Test functions available:');
      console.log('🧪 [TEST] - window.testSessionWarning() - Show session dialog');
      console.log('🧪 [TEST] - window.testTokenRefresh() - Test token refresh');
      console.log('🧪 [TEST] - window.testSessionInfo() - Show session info');
    }
  }, [keycloak]);

  // Process Keycloak user info
  useEffect(() => {
    if (initialized && keycloak.authenticated && keycloak.tokenParsed) {
      const tokenParsed = keycloak.tokenParsed;
      
      // Merge roles from both realm and client sources
      const realmRoles = tokenParsed.realm_access?.roles || [];
      const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'military-lms-app';
      const clientRoles = tokenParsed.resource_access?.[clientId]?.roles || [];
      
      // Combine and deduplicate roles
      const allRoles = [...new Set([...realmRoles, ...clientRoles])];
      
      // Normalize role names (ensure uppercase and underscores to match database codes)
      const normalizedRoles = allRoles.map(role => {
        // Convert to uppercase and replace hyphens with underscores
        return role.toUpperCase().replace(/-/g, '_');
      });
      
      // Create user object from Keycloak token
      const userObj = {
        id: tokenParsed.sub, // Primary ID for Drive and other services
        uid: tokenParsed.sub, // Keep for backward compatibility
        username: tokenParsed.preferred_username,
        email: tokenParsed.email,
        displayName: tokenParsed.name || tokenParsed.preferred_username,
        firstName: tokenParsed.given_name,
        lastName: tokenParsed.family_name,
        roles: normalizedRoles,
        token: keycloak.token,
        refreshToken: keycloak.refreshToken
      };

      // Fetch database ID from backend (non-blocking - failure doesn't prevent login)
      const fetchDbId = async () => {
        try {
          const response = await fetch('/api/v1/users/me', {
            headers: {
              'Authorization': `Bearer ${keycloak.token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              userObj.dbId = data.data.id;
              console.log('[AuthContext] Fetched dbId:', userObj.dbId);
            } else {
              console.warn('[AuthContext] /users/me returned non-success:', data);
            }
          } else {
            console.warn('[AuthContext] /users/me failed with status:', response.status, '- continuing without dbId');
          }
        } catch (error) {
          console.warn('[AuthContext] Failed to fetch dbId:', error, '- continuing without dbId');
        }
      };

      fetchDbId().then(() => {
        // Set role flags (matching database user_roles table codes)
        setIsAdmin(normalizedRoles.includes(ROLES.ADMIN));
        setIsHR(normalizedRoles.includes(ROLES.HR));
        setIsInstructor(normalizedRoles.includes(ROLES.INSTRUCTOR));
        setIsStudent(normalizedRoles.includes(ROLES.STUDENT));
        setIsSuperAdmin(normalizedRoles.includes(ROLES.SUPER_ADMIN));

        // Set role code
        if (normalizedRoles.includes(ROLES.SUPER_ADMIN)) setRole(ROLES.SUPER_ADMIN);
        else if (normalizedRoles.includes(ROLES.ADMIN)) setRole(ROLES.ADMIN);
        else if (normalizedRoles.includes(ROLES.HR)) setRole(ROLES.HR);
        else if (normalizedRoles.includes(ROLES.INSTRUCTOR)) setRole(ROLES.INSTRUCTOR);
        else if (normalizedRoles.includes(ROLES.STUDENT)) setRole(ROLES.STUDENT);
        else setRole(null);

        setUser(userObj);
      });
      setLoading(false);
      
      // Save token to localStorage for API calls and cookie for image proxy
      if (keycloak.token) {
        localStorage.setItem('keycloak_token', keycloak.token);
        // Set cookie for image proxy (path=/api so it goes to backend only)
        document.cookie = `kc_token=${keycloak.token}; path=/api; secure; samesite=strict`;
        console.log('[AuthContext] ✅ Token saved to localStorage and cookie');
      }
      
      // console.log('🔐 [DEBUG] Keycloak user authenticated:', {
      //   email: userObj.email,
      //   realmRoles: realmRoles,
      //   clientRoles: clientRoles,
      //   mergedRoles: normalizedRoles,
      //   isAdmin: normalizedRoles.includes(ROLES.ADMIN),
      //   isSuperAdmin: normalizedRoles.includes(ROLES.SUPER_ADMIN),
      //   isInstructor: normalizedRoles.includes(ROLES.INSTRUCTOR)
      // });
      
      // Schedule session warning
      scheduleSessionWarning();

      // Schedule idle timeout warning
      scheduleIdleWarning();

      // Fetch Nextcloud authentication
      fetchNextcloudAuth();

      // Fetch permissions (debounced, only once per session)
      fetchPermissions();
    } else if (initialized && !keycloak.authenticated) {
      setUser(null);
      setIsAdmin(false);
      setIsHR(false);
      setIsInstructor(false);
      setIsStudent(false);
      setIsSuperAdmin(false);
      setRole(null);
      setLoading(false);
    }
  }, [initialized, keycloak, scheduleSessionWarning, scheduleIdleWarning, fetchNextcloudAuth, fetchPermissions]);

  // Update localStorage token when it changes
  useEffect(() => {
    if (keycloak.token) {
      localStorage.setItem('keycloak_token', keycloak.token);
      // Update cookie for image proxy
      document.cookie = `kc_token=${keycloak.token}; path=/api; secure; samesite=strict`;
      // console.log('[AuthContext] ✅ Token updated in localStorage and cookie');
    }
  }, [keycloak.token]);

  const logout = useCallback(async () => {
    try {
      console.log('[AuthContext] 🔄 Initiating logout');

      // Clear all storage
      localStorage.removeItem('keycloak_token');
      localStorage.removeItem('lastRefreshTime');
      localStorage.removeItem('nextcloud_token');
      localStorage.removeItem('permissions');
      localStorage.removeItem('keycloak_refresh_token');

      // Clear Nextcloud auth and permissions state
      setNextcloudAuth(null);
      setPermissions(null);
      localStorage.clear();
      sessionStorage.clear();
      // Clear cookie
      document.cookie = 'kc_token=; path=/api; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      console.log('[AuthContext] 🧹 Storage cleared');

      // Use Keycloak's logout method with redirect to app login page
      // This properly clears the Keycloak session and redirects back to the app
      await keycloak.logout({
        redirectUri: window.location.origin + '/login'
      });
    } catch (error) {
      error('Logout error:', error);
      // As a fallback, just clear everything and redirect to app login page
      console.log('[AuthContext] 🔄 Fallback: clearing session and redirecting to app');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = window.location.origin + '/login';
    }
  }, [keycloak]);

  const hasRole = (role) => {
    return user?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles) => {
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  };

  const hasAllRoles = (roles) => {
    if (!user?.roles) return false;
    return roles.every(role => user.roles.includes(role));
  };

  // Format countdown time
  const formatCountdown = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get token expiry in local time
  const getTokenExpiryLocalTime = () => {
    if (!keycloak.tokenParsed?.exp) return 'Unknown';
    const expiryDate = new Date(keycloak.tokenParsed.exp * 1000);
    return expiryDate.toLocaleTimeString();
  };

  // Generate dynamic modal message with countdown and local time
  const getModalMessage = () => {
    const expiryTime = getTokenExpiryLocalTime();
    const baseMessage = `Your session will expire soon. Token expires at ${expiryTime}. Would you like to extend your session or logout?`;
    if (countdownTime !== null) {
      const countdownText = formatCountdown(countdownTime);
      return `${baseMessage}\n\n⏰\n${countdownText}`;
    }
    return baseMessage;
  };

  // Countdown timer with reduced logging
  useEffect(() => {
    if (showSessionModal && countdownTime !== null) {
      // Only log when countdown starts or reaches important milestones
      if (!countdownTimerRef.current) {
        console.log(`🕐 [COUNTDOWN DEBUG] Starting countdown: ${countdownTime} seconds remaining`);
      }
      
      countdownTimerRef.current = setInterval(() => {
        setCountdownTime(prev => {
          const newTime = prev - 1;
          
          // Only log countdown updates at important intervals
          if (newTime <= 10) {
            console.log(`🕐 [COUNTDOWN DEBUG] ${newTime}s remaining - Auto-logout imminent!`);
          } else if (newTime % 60 === 0 && newTime !== prev - 1) { // Every minute, not every second
            console.log(`🕐 [COUNTDOWN DEBUG] ${newTime}s remaining (${Math.floor(newTime / 60)} minutes)`);
          }
          
          if (newTime <= 0) {
            console.log('🕐 [COUNTDOWN DEBUG] Countdown reached zero - Triggering auto-logout');
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (countdownTimerRef.current) {
        console.log('🕐 [COUNTDOWN DEBUG] Cleaning up countdown timer');
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [showSessionModal, countdownTime]);

  // Handle session refresh
  const handleRefresh = useCallback(async () => {
    console.log('🔄 [REFRESH DEBUG] Session refresh initiated by user');
    const oldExpiry = keycloak.tokenParsed?.exp;
    console.log('🔄 [REFRESH DEBUG] Current token expiry:', oldExpiry ? new Date(oldExpiry * 1000).toISOString() : 'No expiry info');
    
    setIsRefreshing(true);
    try {
      // Use Keycloak's built-in updateToken method
      // This will refresh the token if it's expired or about to expire
      console.log('🔄 [REFRESH DEBUG] Calling keycloak.updateToken(-1) to force refresh');
      const refreshed = await keycloak.updateToken(-1); // Force refresh
      
      const newExpiry = keycloak.tokenParsed?.exp;
      
      if (refreshed) {
        console.log('✅ [REFRESH DEBUG] Token refreshed successfully!');
        console.log('✅ [REFRESH DEBUG] New token expiry:', newExpiry ? new Date(newExpiry * 1000).toISOString() : 'No expiry info');
        console.log('✅ [REFRESH DEBUG] New token length:', keycloak.token?.length || 'No token');
        
        // Verify token was actually extended
        if (oldExpiry && newExpiry && newExpiry <= oldExpiry) {
          console.warn('⚠️ [REFRESH DEBUG] WARNING: Token expiry was not extended! Old:', new Date(oldExpiry * 1000).toISOString(), 'New:', new Date(newExpiry * 1000).toISOString());
          warn('⚠️ [REFRESH DEBUG] Token refresh did not extend expiry - refresh token may be expired');
        }
        
        // Update localStorage
        if (keycloak.token) {
          localStorage.setItem('keycloak_token', keycloak.token);
          console.log('✅ [REFRESH DEBUG] New token saved to localStorage');
        }
        
        // Set refresh time and close modal first
        const refreshTime = Date.now();
        debugSetLastRefreshTime(refreshTime);
        console.log('🔒 [REFRESH DEBUG] Modal closing, refresh time set to', new Date(refreshTime).toISOString());
        setShowSessionModal(false);
        
        // Reschedule warning after a short delay to ensure modal is closed
        setTimeout(() => {
          console.log('📅 [REFRESH DEBUG] Rescheduling both warnings after refresh');
          scheduleSessionWarning();
          scheduleIdleWarning();
        }, 100);
      } else {
        console.log('⚠️ [REFRESH DEBUG] Token refresh returned false - token was still valid');
        console.log('⚠️ [REFRESH DEBUG] Current token expiry remains:', keycloak.tokenParsed?.exp ? new Date(keycloak.tokenParsed.exp * 1000).toISOString() : 'No expiry info');
        // Token is still valid, just close modal
        setShowSessionModal(false);
        scheduleSessionWarning();
      }
    } catch (err) {
      console.error('❌ [REFRESH DEBUG] Token refresh failed:', err);
      console.error('❌ [REFRESH DEBUG] Error details:', {
        message: err.message,
        stack: err.stack,
        tokenExpired: keycloak.tokenExpired,
        tokenParsed: keycloak.tokenParsed
      });
      // On refresh failure, logout
      await logout();
    } finally {
      setIsRefreshing(false);
      // Clear auto-logout timer
      if (autoLogoutTimerRef.current) {
        clearTimeout(autoLogoutTimerRef.current);
        autoLogoutTimerRef.current = null;
      }
      console.log('🔄 [REFRESH DEBUG] Refresh process completed');
    }
  }, [keycloak, logout, scheduleSessionWarning, scheduleIdleWarning, debugSetLastRefreshTime]);

  // Handle session modal close (logout)
  const handleSessionModalClose = useCallback(async () => {
    info('🚪 User chose to logout from session modal');
    await logout();
  }, [logout]);

  // Effect to handle auto-logout when modal is shown
  useEffect(() => {
    if (showSessionModal) {
      console.log(`🚨 [AUTO-LOGOUT DEBUG] Modal shown, calculating actual time until token expiry`);
      
      // Calculate actual time until token expiry
      const nowSec = Math.floor(Date.now() / 1000);
      const expiresAt = keycloak.tokenParsed?.exp;
      let remainingSeconds;
      
      if (expiresAt) {
        remainingSeconds = Math.max(0, expiresAt - nowSec);
        console.log(`🚨 [AUTO-LOGOUT DEBUG] Token expires at ${new Date(expiresAt * 1000).toLocaleTimeString()}, ${remainingSeconds}s from now`);
      } else {
        // Fallback to configured minutes if no token expiry
        const autoLogoutMinutes = SESSION_CONFIG.AUTO_LOGOUT_MINUTES;
        remainingSeconds = autoLogoutMinutes * 60;
        console.log(`🚨 [AUTO-LOGOUT DEBUG] No token expiry found, using ${autoLogoutMinutes}-minute fallback`);
      }
      
      setCountdownTime(remainingSeconds);
      console.log(`🚨 [AUTO-LOGOUT DEBUG] Countdown initialized: ${remainingSeconds} seconds`);
      
      // Start countdown timer
      countdownTimerRef.current = setInterval(() => {
        setCountdownTime(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            console.log('🚨 [AUTO-LOGOUT DEBUG] Countdown timer finished');
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          
          return newTime;
        });
      }, 1000);
      
      // Start auto-logout timer based on actual token expiry
      const autoLogoutMs = remainingSeconds * 1000;
      console.log(`🚨 [AUTO-LOGOUT DEBUG] Setting auto-logout timeout for ${autoLogoutMs}ms (${remainingSeconds}s)`);
      autoLogoutTimerRef.current = setTimeout(async () => {
        console.log(`🚨 [AUTO-LOGOUT DEBUG] Auto-logout triggered after token expiry`);
        await logout();
      }, autoLogoutMs);
    }

    // Cleanup
    return () => {
      if (autoLogoutTimerRef.current) {
        console.log('🧹 [AUTO-LOGOUT DEBUG] Cleaning up auto-logout timer');
        clearTimeout(autoLogoutTimerRef.current);
        autoLogoutTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (idleWarningTimerRef.current) {
        console.log('🧹 [AUTO-LOGOUT DEBUG] Cleaning up idle timer');
        clearTimeout(idleWarningTimerRef.current);
        idleWarningTimerRef.current = null;
      }
      setCountdownTime(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSessionModal, logout]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (autoLogoutTimerRef.current) {
        clearTimeout(autoLogoutTimerRef.current);
      }
    };
  }, []);

  const value = {
    user,
    loading,
    isAdmin,
    isHR,
    isInstructor,
    isStudent,
    isSuperAdmin,
    role,
    logout,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    token: keycloak.token,
    refreshToken: keycloak.refreshToken,
    initialized,
    nextcloudAuth,
    permissions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Session Extension Modal */}
      <ConfirmModal
        isOpen={showSessionModal}
        onClose={handleSessionModalClose}
        onConfirm={handleRefresh}
        title="Session Expiring Soon"
        message={getModalMessage()}
        confirmText="Extend Session"
        cancelText="Logout"
        loading={isRefreshing}
        variant="primary"
        size="small"
      />
    </AuthContext.Provider>
  );
};

export default AuthContext;
