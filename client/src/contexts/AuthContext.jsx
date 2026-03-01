import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthChange, signOutUser } from '@services/business/authService';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@services/other/config';
import { getUserProfile, ROLE_STRINGS } from '@utils/userUtils';
import { getUserStatus, getUserStatusSummary, canUserLogin, USER_STATUS } from '@utils/userStatus';
import { getAllowlist } from '@services/business/configService';
import { ensureUserDoc } from '@services/business/userService';
import { addLoginLog } from '@services/business/activityService';
import { ActivityLogger } from '@services/other/activityLogger.jsx';
import logger from '@utils/logger';
import { applyAccentColorGlobally } from '@utils/theme';
import { 
  isAdmin as isAdminCheck,
  isSuperAdmin as isSuperAdminCheck,
  isHR as isHRCheck,
  isInstructor as isInstructorCheck,
  isStudent as isStudentCheck
} from '@services/business/userService';

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
  const [role, setRole] = useState(ROLE_STRINGS.STUDENT); // 'guest' | 'student' | 'instructor' | 'hr' | 'admin'
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
      // Removed session timeout logs to reduce console noise
      // logger.log(`[Auth] Session timeout reset - will logout at ${new Date(Date.now() + sessionTimeout).toLocaleTimeString()}`);
      // logger.log(`[Auth] User: ${user.email}, UID: ${user.uid}, Last activity: ${new Date(lastActivityTime).toLocaleTimeString()}`);
      timeoutId = setTimeout(async () => {
        // logger.log('[Auth] Session timeout reached - logging out user');
        // logger.log(`[Auth] Session details - User: ${user.email}, Last activity: ${new Date(lastActivityTime).toLocaleTimeString()}, Timeout duration: ${sessionTimeout/1000/60} minutes`);
        
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
    resetTimeout();

    // Reset timeout on user activity - WITH DEBOUNCING
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => {
      // Debounce activity events to prevent storm
      if (debounceTimer) clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(() => {
        // logger.log('[Auth] User activity detected - resetting session timeout'); // Removed to reduce console noise
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
        const hasUser = !!user;
        const hasProfile = !!userProfile;
        const hasSession = sessionStorage.getItem('hasLoggedInThisSession') === 'true';
        
        logger.error('[Auth] Loading timeout - forcing loading to false', {
          hasUser,
          hasProfile, 
          hasSession,
          userEmail: user?.email || 'none'
        });
        
        // Only force loading to false if we have some session data
        if (hasUser || hasProfile || hasSession) {
          setLoading(false);
        } else {
          logger.warn('[Auth] No session data available, keeping loading state');
        }
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading, user, userProfile]);

  // Make current user available globally for Activity Logger
  useEffect(() => {
    if (user) {
      window.__AUTH_USER__ = user;
    } else {
      delete window.__AUTH_USER__;
    }
  }, [user]);

  // Load cached profile from sessionStorage on mount
  useEffect(() => {
    const cached = sessionStorage.getItem('userProfile');
    if (cached) {
      try {
        setUserProfile(JSON.parse(cached));
        
        // Restore session flags if user profile exists but session flags are missing
        const hasLoggedIn = sessionStorage.getItem('hasLoggedInThisSession');
        const sessionStart = sessionStorage.getItem('sessionStart');
        
        if (!hasLoggedIn || !sessionStart) {
          sessionStorage.setItem('hasLoggedInThisSession', 'true');
          sessionStorage.setItem('sessionStart', Date.now().toString());
          setHasLoggedInThisSession(true);
        }
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
          
          // Check if this is actually a network issue vs real logout
          const hasRecentActivity = sessionStorage.getItem('hasLoggedInThisSession') === 'true';
          const sessionStart = sessionStorage.getItem('sessionStart');
          const recentSession = sessionStart && (Date.now() - parseInt(sessionStart)) < 5 * 60 * 1000; // 5 minutes
          const hasUserProfile = !!sessionStorage.getItem('userProfile');
          
          // More lenient check: if user profile exists, treat as potential temporary issue
          if ((hasRecentActivity && recentSession) || hasUserProfile) {
            // Wait a bit and see if auth state recovers
            await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time
            return;
          } else {
            // If no recent activity and no user profile, this might be a real logout
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
              // Check if user is disabled or deleted - logout immediately
              if (userProfile.disabled === true || userProfile.status === 'disabled' || userProfile.deleted === true) {
                logger.warn('[Auth] User is disabled/deleted, logging out:', { 
                  uid: firebaseUser.uid, 
                  email: firebaseUser.email,
                  disabled: userProfile.disabled,
                  status: userProfile.status,
                  deleted: userProfile.deleted
                });
                await auth.signOut();
                return;
              }
              
              // logger.log('🔧 AuthContext loaded user profile:', userProfile);
              // logger.log('🔧 AuthContext userProfile.displayName:', userProfile.displayName);
              // logger.log('🔧 AuthContext userProfile.realName:', userProfile.realName);
              userData.displayName = userProfile.displayName || userProfile.realName || userData.displayName;
              // logger.log('🔧 AuthContext final userData.displayName:', userData.displayName);
            } else {
              // User profile does not exist
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
        
        // Check allowlist for admin and super admin status in one go
        let superAdminFromAllowlist = false;
        try {
          const allow = await getAllowlist();
          const email = (firebaseUser.email || '').toLowerCase();
          if (allow.success) {
            const admins = (allow.data.adminEmails || []).map(e => (e || '').toLowerCase());
            const superAdmins = (allow.data.superAdmins || []).map(e => (e || '').toLowerCase());
            admin = admin || admins.includes(email); // Use token claims OR allowlist
            superAdminFromAllowlist = superAdmins.includes(email);
            
            // Set super admin status immediately to prevent race conditions
            if (superAdminFromAllowlist && isSubscribed) {
              setIsSuperAdmin(true);
              setRole(ROLE_STRINGS.SUPER_ADMIN);
            }
            
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

        // Check user doc for roles and fetch full profile
        let userRole = ROLE_STRINGS.STUDENT;
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
            
            // Use super admin from allowlist if not set in profile
            if (!superAdminFromDoc && superAdminFromAllowlist) {
              superAdminFromDoc = true;
            }
            
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
            
            // 🔒 SECURITY: Prevent disabled users from logging in
            if (!canUserLogin(profile)) {
              const isDisabled = userStatus === USER_STATUS.DISABLED;
              const isDeleted = userStatus === USER_STATUS.DELETED;
              
              logger.warn('[Auth] Login blocked - user account disabled or deleted', { 
                userId: firebaseUser.uid, 
                email: firebaseUser.email,
                status: userStatus,
                isDisabled,
                isDeleted
              });
              
              // Sign out the user immediately
              try {
                await signOutUser(firebaseUser);
              } catch (signOutError) {
                logger.error('[Auth] Failed to sign out disabled user:', signOutError);
              }
              
              // Show specific error message
              if (typeof window !== 'undefined' && window.toast) {
                if (isDisabled) {
                  window.toast.showError('Your account has been disabled. Please contact support.');
                } else if (isDeleted) {
                  window.toast.showError('Your account has been deleted. Please contact support.');
                } else {
                  window.toast.showError('Access denied. Please contact support.');
                }
              }
              
              return; // Stop authentication process
            }
            
            // Only update state if component is still subscribed
            if (isSubscribed) {
              setUserProfile(profile);
              setIsAdmin(admin || adminFromDoc);
              setIsHR(hr);
              setIsInstructor(instructor);
              
              // Determine role with priority - super admin from allowlist should be handled
              if (superAdminFromDoc || superAdminFromAllowlist) {
                userRole = ROLE_STRINGS.SUPER_ADMIN;
                // Ensure super admin state is set correctly (include allowlist)
                setIsSuperAdmin(true);
              } else {
                // Only set to false if not super admin from any source
                setIsSuperAdmin(false);
              }
              
              if (superAdminFromDoc || superAdminFromAllowlist) {
                userRole = ROLE_STRINGS.SUPER_ADMIN;
              } else if (adminFromDoc || admin) {
                userRole = ROLE_STRINGS.ADMIN;
              } else if (hr) {
                userRole = ROLE_STRINGS.HR;
              } else if (instructor) {
                userRole = ROLE_STRINGS.INSTRUCTOR;
              } else {
                userRole = ROLE_STRINGS.STUDENT;
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
            // Set basic admin and super admin status from allowlist if profile is missing
            if (isSubscribed) {
              setIsAdmin(admin);
              setIsSuperAdmin(superAdminFromAllowlist);
              const finalRole = superAdminFromAllowlist ? ROLE_STRINGS.SUPER_ADMIN : 
                              (admin ? ROLE_STRINGS.ADMIN : ROLE_STRINGS.STUDENT);
              setRole(finalRole);
            }
          }
        } catch (error) {
          logger.error('[Auth] Error loading user profile:', error);
          // Set fallback role based on admin and super admin status from allowlist
          if (isSubscribed) {
            setIsAdmin(admin);
            setIsSuperAdmin(superAdminFromAllowlist);
            const fallbackRole = superAdminFromAllowlist ? ROLE_STRINGS.SUPER_ADMIN : 
                              (admin ? ROLE_STRINGS.ADMIN : ROLE_STRINGS.STUDENT);
            setRole(fallbackRole);
            logger.warn('[Auth] Fallback role set from allowlist (error):', { 
              email: firebaseUser.email, 
              admin, 
              superAdmin: superAdminFromAllowlist,
              fallbackRole,
              error: error.message 
            });
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
      setRole(studentData.role || ROLE_STRINGS.STUDENT);
      
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
    const wasAdmin = impersonating?.originalUser?.role === ROLE_STRINGS.ADMIN;
    const wasHR = impersonating?.originalUser?.role === ROLE_STRINGS.HR;
    const wasInstructor = impersonating?.originalUser?.role === ROLE_STRINGS.INSTRUCTOR;
    setIsAdmin(wasAdmin || false);
    setIsHR(wasHR || false);
    setIsInstructor(wasInstructor || false);
    setRole(impersonating?.originalUser?.role || ROLE_STRINGS.ADMIN);
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

