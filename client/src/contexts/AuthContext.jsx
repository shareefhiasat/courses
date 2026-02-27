import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthChange, signOutUser } from '@services/business/authService';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@services/other/config';
import { getUserProfile } from '@utils/userUtils';
import { getAllowlist } from '@services/business/configService';
import { ensureUserDoc } from '@services/business/userService';
import { addLoginLog } from '@services/business/activityService';
import { ActivityLogger } from '@services/other/activityLogger.jsx';
import { canUserLogin, getUserStatus, getUserStatusSummary } from '../utils/userStatus';
import logger from '@utils/logger';
import { applyAccentColorGlobally } from '@utils/theme';
import { 
  USER_ROLES
} from '@constants/userRoles';
import { 
  isAdmin as isAdminCheck,
  isSuperAdmin as isSuperAdminCheck,
  isHR as isHRCheck,
  isInstructor as isInstructorCheck,
  isStudent as isStudentCheck
} from '@constants/userRoles';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Full user profile from Firestore
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHR, setIsHR] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(USER_ROLES.STUDENT); // 'guest' | 'student' | 'instructor' | 'hr' | 'admin'
  const [impersonating, setImpersonating] = useState(null); // { originalUser, impersonatedUser }
  const [realUser, setRealUser] = useState(null); // Store the real admin user
  
  // Track if we've logged this session - use sessionStorage to persist across refreshes
  const [hasLoggedInThisSession, setHasLoggedInThisSession] = useState(() => {
    const sessionStart = sessionStorage.getItem('sessionStart');
    const hasLoggedIn = sessionStorage.getItem('hasLoggedInThisSession') === 'true';
    
    // If session is older than 1 hour, reset it
    if (sessionStart && hasLoggedIn) {
      const sessionAge = Date.now() - parseInt(sessionStart);
      if (sessionAge > 60 * 60 * 1000) { // 1 hour
        sessionStorage.removeItem('hasLoggedInThisSession');
        sessionStorage.removeItem('sessionStart');
        return false;
      }
    }
    
    return hasLoggedIn;
  });

  // Session timeout detection - SET TO 30 MINUTES FOR TESTING
  useEffect(() => {
    if (!user) return;

    const sessionTimeout = 30 * 60 * 1000; // 30 minutes (for testing)
    let timeoutId;
    let lastActivityTime = Date.now();
    let debounceTimer = null;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      lastActivityTime = Date.now();
      logger.log(`[Auth] Session timeout reset - will logout at ${new Date(Date.now() + sessionTimeout).toLocaleTimeString()}`);
      logger.log(`[Auth] User: ${user.email}, UID: ${user.uid}, Last activity: ${new Date(lastActivityTime).toLocaleTimeString()}`);
      timeoutId = setTimeout(async () => {
        logger.log('[Auth] Session timeout reached - logging out user');
        logger.log(`[Auth] Session details - User: ${user.email}, Last activity: ${new Date(lastActivityTime).toLocaleTimeString()}, Timeout duration: ${sessionTimeout/1000/60} minutes`);
        
        // Store logout reason with last activity info
        sessionStorage.setItem('logoutReason', 'session_timeout');
        sessionStorage.setItem('logoutTimestamp', Date.now().toString());
        sessionStorage.setItem('lastActivityTime', lastActivityTime.toString());
        sessionStorage.setItem('sessionTimeoutUser', JSON.stringify({ email: user.email, uid: user.uid }));
        
        // Log session timeout
        try {
          await ActivityLogger.sessionTimeout();
        } catch (error) {
          logger.warn('Failed to log session timeout:', error);
        }
        // Sign out user
        await signOutUser(user);
      }, sessionTimeout);
    };

    // Set initial timeout
    logger.log(`[Auth] Initial session timeout set for ${user.email} at ${new Date(Date.now() + sessionTimeout).toLocaleTimeString()}`);
    resetTimeout();

    // Reset timeout on user activity - WITH DEBOUNCING
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => {
      // Debounce activity events to prevent storm
      if (debounceTimer) clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(() => {
        logger.log('[Auth] User activity detected - resetting session timeout');
        resetTimeout();
      }, 1000); // Only process activity once per second
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (debounceTimer) clearTimeout(debounceTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user]);
  
  // Add loading timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        logger.error('[Auth] Loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Load cached profile from sessionStorage on mount
  useEffect(() => {
    const cached = sessionStorage.getItem('userProfile');
    if (cached) {
      try {
        setUserProfile(JSON.parse(cached));
      } catch (e) {
        logger.warn('Failed to parse cached user profile');
      }
    }
  }, []);

  useEffect(() => {
    let userDocUnsub = null;
    let isSubscribed = true; // Prevent state updates if component unmounted
    let authRetryCount = 0;
    const maxRetries = 3;
    let authTimeoutId = null;

    // Add auth initialization timeout
    authTimeoutId = setTimeout(() => {
      if (loading && isSubscribed) {
        logger.error('[Auth] Auth initialization timeout - forcing loading to false');
        setLoading(false);
      }
    }, 20000); // 20 second timeout for auth initialization

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      // Prevent race conditions - if user changed during async operations, skip
      if (!isSubscribed) return;
      
      if (!firebaseUser) {
        // Only logout if this wasn't a temporary auth state change
        if (authRetryCount < maxRetries) {
          authRetryCount++;
          const logoutReason = sessionStorage.getItem('logoutReason');
          const logoutTimestamp = sessionStorage.getItem('logoutTimestamp');
          const sessionTimeoutUser = sessionStorage.getItem('sessionTimeoutUser');
          
          logger.warn(`[Auth] Temporary auth state change detected, retry ${authRetryCount}/${maxRetries}`);
          logger.log(`[Auth] Debug info - Logout reason: ${logoutReason}, Timestamp: ${logoutTimestamp}, Session user: ${sessionTimeoutUser}`);
          
          // Check if this is actually a network issue vs real logout
          const hasRecentActivity = sessionStorage.getItem('hasLoggedInThisSession') === 'true';
          const sessionStart = sessionStorage.getItem('sessionStart');
          const recentSession = sessionStart && (Date.now() - parseInt(sessionStart)) < 5 * 60 * 1000; // 5 minutes
          
          logger.log(`[Auth] Session analysis - Has recent activity: ${hasRecentActivity}, Recent session: ${recentSession}, Session start: ${sessionStart}`);
          
          if (hasRecentActivity && recentSession) {
            // Wait a bit and see if auth state recovers
            logger.log('[Auth] Waiting to see if auth state recovers...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time
            return;
          } else {
            // If no recent activity, this might be a real logout
            logger.info('[Auth] No recent session activity, treating as real logout');
          }
        }

        logger.warn('[Auth] User signed out - Firebase auth state changed to null');
        
        // Store logout reason if not already set (likely Firebase auth error)
        if (!sessionStorage.getItem('logoutReason')) {
          sessionStorage.setItem('logoutReason', 'auth_error');
          sessionStorage.setItem('logoutTimestamp', Date.now().toString());
        }
        
        // Cleanup any existing listeners
        if (userDocUnsub) {
          userDocUnsub();
          userDocUnsub = null;
        }
        
        setUser(null);
        setIsAdmin(false);
        setIsHR(false);
        setIsInstructor(false);
        setIsSuperAdmin(false);
        setRole('guest');
        setLoading(false);
        setHasLoggedInThisSession(false);
        sessionStorage.removeItem('hasLoggedInThisSession');
        sessionStorage.removeItem('sessionStart');
        sessionStorage.removeItem('userProfile');
        sessionStorage.removeItem('sessionTimeoutUser'); // Clean up session timeout user data
        authRetryCount = 0; // Reset retry count
        return;
      }

      // Reset retry count on successful auth
      authRetryCount = 0;
      logger.log('[Auth] User authenticated:', firebaseUser.email);

      // Only log login if we haven't logged this session yet
      const isNewLogin = !hasLoggedInThisSession;
      
      setUser(firebaseUser);

      // Apply cached accent color immediately to prevent flash
      try {
        const cachedColor = localStorage.getItem(`accent_color_${firebaseUser.uid}`);
        if (cachedColor) {
          applyAccentColorGlobally(cachedColor);
        }
      } catch {}

      try {
        // Ensure a user doc exists (only pass displayName if it exists in Firebase Auth)
        try {
          const userData = {};
          userData.email = firebaseUser.email;
          if (firebaseUser.displayName) {
            userData.displayName = firebaseUser.displayName;
          }
          await ensureUserDoc(firebaseUser.uid, userData);
          
          // Load the user document to get the display name from Firestore
          try {
            const userProfile = await getUserProfile(firebaseUser);
            if (userProfile) {
              // logger.log('🔧 AuthContext loaded user profile:', userProfile);
              // logger.log('🔧 AuthContext userProfile.displayName:', userProfile.displayName);
              // logger.log('🔧 AuthContext userProfile.realName:', userProfile.realName);
              userData.displayName = userProfile.displayName || userProfile.realName || userData.displayName;
              // logger.log('🔧 AuthContext final userData.displayName:', userData.displayName);
            } else {
              logger.log('🔧 AuthContext user profile does not exist');
            }
          } catch (error) {
            logger.warn("Failed to load user document for display name:", error);
          }
        } catch {}

        // Claims and allowlist
        let token = null;
        let admin = false;
        try {
          token = await firebaseUser.getIdTokenResult(true); // Force refresh to get latest claims
          admin = !!token.claims.admin;
        } catch (error) {
          logger.warn('[Auth] Failed to get ID token result:', error);
          // Continue with allowlist check as fallback
        }
        
        if (!admin) {
          try {
            const allow = await getAllowlist();
            const email = (firebaseUser.email || '').toLowerCase();
            if (allow.success) {
              const admins = (allow.data.adminEmails || []).map(e => (e || '').toLowerCase());
              admin = admins.includes(email);
              // Attempt to set claim via Cloud Function (production only)
              if (admin && !token?.claims?.admin && import.meta.env.PROD) {
                try {
                  const { getFunctions, httpsCallable } = await import('firebase/functions');
                  const { app } = await import('@services/other/config');
                  const functions = getFunctions(app);
                  const ensureAdminClaim = httpsCallable(functions, 'ensureAdminClaim');
                  await ensureAdminClaim({ email });
                  try { await firebaseUser.getIdToken(true); } catch {}
                } catch (e) {
                  // Silent in dev; logged only in prod
                  if (import.meta.env.PROD) logger.warn('ensureAdminClaim failed:', e?.message || e);
                }
              }
            }
          } catch (error) {
            logger.warn('[Auth] Failed to check allowlist:', error);
          }
        }

        // Check user doc for roles and fetch full profile
        let userRole = USER_ROLES.STUDENT;
        let hr = false;
        let instructor = false;
        let adminFromDoc = false;
        let superAdminFromDoc = false;
        let profile = null;
        
        try {
          profile = await getUserProfile(firebaseUser);
          if (profile && isSubscribed) {
            adminFromDoc = isAdminCheck(profile.role) || profile.isAdmin === true;
            superAdminFromDoc = isSuperAdminCheck(profile.role) || profile.isSuperAdmin === true;
            hr = isHRCheck(profile.role) || profile.isHR === true;
            instructor = isInstructorCheck(profile.role) || profile.isInstructor === true;
            
            // Cache profile in sessionStorage
            try {
              sessionStorage.setItem('userProfile', JSON.stringify(profile));
            } catch (e) {
              logger.warn('[Auth] Failed to cache user profile:', e);
            }
            
            // Load user enrollments for status check
            let enrollments = [];
            try {
              const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('userId', '==', firebaseUser.uid)));
              enrollments = enrollmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            } catch (e) {
              logger.warn('[Auth] Failed to load enrollments for status check:', e);
            }
            
            // Check user status
            const userStatus = getUserStatus(profile, enrollments);
            const statusSummary = getUserStatusSummary(profile, enrollments);
            
            // Only update state if component is still subscribed
            if (isSubscribed) {
              setUserProfile(profile);
              setIsAdmin(admin || adminFromDoc);
              setIsHR(hr);
              setIsInstructor(instructor);
              setIsSuperAdmin(superAdminFromDoc);
              
              // Determine role with priority
              if (superAdminFromDoc || adminFromDoc || admin) {
                userRole = superAdminFromDoc ? USER_ROLES.SUPER_ADMIN : USER_ROLES.ADMIN;
              } else if (hr) {
                userRole = USER_ROLES.HR;
              } else if (instructor) {
                userRole = USER_ROLES.INSTRUCTOR;
              } else {
                userRole = USER_ROLES.STUDENT;
              }
              
              setRole(userRole);
              setRealUser({ ...firebaseUser, role: userRole });
              
              // Log login if new session
              if (isNewLogin) {
                try {
                  await addLoginLog(firebaseUser, statusSummary);
                } catch (e) {
                  logger.warn('[Auth] Failed to add login log:', e);
                }
                
                // Mark session as logged in
                setHasLoggedInThisSession(true);
                sessionStorage.setItem('hasLoggedInThisSession', 'true');
                sessionStorage.setItem('sessionStart', Date.now().toString());
              }
            }
          } else if (!profile) {
            logger.warn('[Auth] User profile not found, using defaults');
            // Set basic admin status from allowlist if profile is missing
            if (isSubscribed) {
              setIsAdmin(admin);
              setRole(admin ? USER_ROLES.ADMIN : USER_ROLES.STUDENT);
            }
          }
        } catch (error) {
          logger.error('[Auth] Error loading user profile:', error);
          // Set fallback role based on admin status from allowlist
          if (isSubscribed) {
            setIsAdmin(admin);
            setRole(admin ? USER_ROLES.ADMIN : USER_ROLES.STUDENT);
          }
        }
        
        // Set loading to false only after all operations are complete
        if (isSubscribed) {
          setLoading(false);
        }
      } catch (error) {
        logger.error('[Auth] Critical error in auth state change:', error);
        if (isSubscribed) {
          // Set fallback state to prevent app from breaking
          setUser(firebaseUser);
          setIsAdmin(false);
          setRole('guest');
          setLoading(false);
        }
      }
    });

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (authTimeoutId) clearTimeout(authTimeoutId);
      if (userDocUnsub) {
        userDocUnsub();
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [hasLoggedInThisSession, loading]);

  const impersonateUser = async (studentId) => {
    if (!isAdmin) return { success: false, error: 'Only admins can impersonate' };
    
    try {
      // Get student data
      const studentDoc = await getDoc(doc(db, 'users', studentId));
      if (!studentDoc.exists()) {
        return { success: false, error: 'Student not found' };
      }
      
      const studentData = studentDoc.data();
      
      // Store real admin user
      setRealUser(user);
      
      // Create impersonated user object
      const impersonatedUser = {
        uid: studentId,
        email: studentData.email,
        displayName: studentData.displayName || studentData.email,
        ...studentData
      };
      
      // Set impersonation state
      setImpersonating({
        originalUser: user,
        impersonatedUser: impersonatedUser
      });
      
      // Switch to impersonated user view
      setUser(impersonatedUser);
      setIsAdmin(false);
      setIsHR(false);
      setIsInstructor(false);
      setRole(studentData.role || USER_ROLES.STUDENT);
      
      return { success: true };
    } catch (error) {
      logger.error('Impersonation error:', error);
      return { success: false, error: error.message };
    }
  };

  const stopImpersonation = () => {
    if (!impersonating) return;
    
    // Restore original user
    setUser(realUser);
    // Restore original role
    const wasAdmin = impersonating?.originalUser?.role === USER_ROLES.ADMIN;
    const wasHR = impersonating?.originalUser?.role === USER_ROLES.HR;
    const wasInstructor = impersonating?.originalUser?.role === USER_ROLES.INSTRUCTOR;
    setIsAdmin(wasAdmin || false);
    setIsHR(wasHR || false);
    setIsInstructor(wasInstructor || false);
    setRole(impersonating?.originalUser?.role || USER_ROLES.ADMIN);
    setImpersonating(null);
    setRealUser(null);
  };

  const value = {
    user,
    userProfile,
    isAdmin,
    isSuperAdmin,
    isHR,
    isInstructor,
    role,
    loading,
    impersonating,
    impersonateUser,
    stopImpersonation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

