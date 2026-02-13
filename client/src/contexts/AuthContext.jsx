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

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      lastActivityTime = Date.now();
      // console.log(`[Auth] Session timeout reset - will logout at ${new Date(Date.now() + sessionTimeout).toLocaleTimeString()}`);
      timeoutId = setTimeout(async () => {
        // console.log('[Auth] Session timeout reached - logging out user');
        
        // Store logout reason with last activity info
        sessionStorage.setItem('logoutReason', 'session_timeout');
        sessionStorage.setItem('logoutTimestamp', Date.now().toString());
        sessionStorage.setItem('lastActivityTime', lastActivityTime.toString());
        
        // Log session timeout
        try {
          await ActivityLogger.sessionTimeout();
        } catch (error) {
          console.warn('Failed to log session timeout:', error);
        }
        // Sign out user
        await signOutUser(user);
      }, sessionTimeout);
    };

    // Set initial timeout
    resetTimeout();

    // Reset timeout on user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => {
      // console.log('[Auth] User activity detected - resetting session timeout');
      resetTimeout();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user]);
  
  // Load cached profile from sessionStorage on mount
  useEffect(() => {
    const cached = sessionStorage.getItem('userProfile');
    if (cached) {
      try {
        setUserProfile(JSON.parse(cached));
      } catch (e) {
        console.warn('Failed to parse cached user profile');
      }
    }
  }, []);

  useEffect(() => {
    let userDocUnsub = null;
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        // console.warn('[Auth] User signed out - Firebase auth state changed to null');
        // console.warn('[Auth] Session storage at logout:', {
        //   hasLoggedIn: sessionStorage.getItem('hasLoggedInThisSession'),
        //   sessionStart: sessionStorage.getItem('sessionStart'),
        //   userProfile: sessionStorage.getItem('userProfile') ? 'exists' : 'missing',
        //   logoutReason: sessionStorage.getItem('logoutReason')
        // });
        
        // Store logout reason if not already set (likely Firebase auth error)
        if (!sessionStorage.getItem('logoutReason')) {
          sessionStorage.setItem('logoutReason', 'auth_error');
          sessionStorage.setItem('logoutTimestamp', Date.now().toString());
        }
        
        setUser(null);
        setIsAdmin(false);
        setRole('guest');
        setLoading(false);
        setHasLoggedInThisSession(false); // Reset on logout
        sessionStorage.removeItem('hasLoggedInThisSession');
        sessionStorage.removeItem('sessionStart');
        return;
      }

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
              // console.log('🔧 AuthContext loaded user profile:', userProfile);
              // console.log('🔧 AuthContext userProfile.displayName:', userProfile.displayName);
              // console.log('🔧 AuthContext userProfile.realName:', userProfile.realName);
              userData.displayName = userProfile.displayName || userProfile.realName || userData.displayName;
              // console.log('🔧 AuthContext final userData.displayName:', userData.displayName);
            } else {
              console.log('🔧 AuthContext user profile does not exist');
            }
          } catch (error) {
            console.warn("Failed to load user document for display name:", error);
          }
        } catch {}

        // Claims and allowlist
        const token = await firebaseUser.getIdTokenResult();
        let admin = !!token.claims.admin;
        if (!admin) {
          try {
            const allow = await getAllowlist();
            const email = (firebaseUser.email || '').toLowerCase();
            if (allow.success) {
              const admins = (allow.data.adminEmails || []).map(e => (e || '').toLowerCase());
              admin = admins.includes(email);
              // Attempt to set claim via Cloud Function (production only)
              if (admin && !token.claims.admin && import.meta.env.PROD) {
                try {
                  const { getFunctions, httpsCallable } = await import('firebase/functions');
                  const { app } = await import('@services/other/config');
                  const functions = getFunctions(app);
                  const ensureAdminClaim = httpsCallable(functions, 'ensureAdminClaim');
                  await ensureAdminClaim({ email });
                  try { await firebaseUser.getIdToken(true); } catch {}
                } catch (e) {
                  // Silent in dev; logged only in prod
                  if (import.meta.env.PROD) console.warn('ensureAdminClaim failed:', e?.message || e);
                }
              }
            }
          } catch {}
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
          // console.log('🔧 AuthContext getUserProfile result:', profile);
          if (profile) {
            // console.log('🔧 AuthContext full profile data:', profile);
            // console.log('🔧 AuthContext profile.role:', profile.role);
            // console.log('🔧 AuthContext profile.isAdmin:', profile.isAdmin);
            // console.log('🔧 AuthContext profile.isSuperAdmin:', profile.isSuperAdmin);
            // console.log('🔧 AuthContext profile.isHR:', profile.isHR);
            // console.log('🔧 AuthContext profile.isInstructor:', profile.isInstructor);
            
            adminFromDoc = isAdminCheck(profile.role) || profile.isAdmin === true;
            superAdminFromDoc = isSuperAdminCheck(profile.role) || profile.isSuperAdmin === true;
            hr = isHRCheck(profile.role) || profile.isHR === true;
            instructor = isInstructorCheck(profile.role) || profile.isInstructor === true;
            
            // console.log('🔧 AuthContext role detection debug:', {
            //   profileRole: profile.role,
            //   isSuperAdminRole: isSuperAdminCheck(profile.role),
            //   profileIsSuperAdmin: profile.isSuperAdmin,
            //   superAdminFromDoc,
            //   'profile.role === USER_ROLES.SUPER_ADMIN': profile.role === USER_ROLES.SUPER_ADMIN,
            //   'USER_ROLES.SUPER_ADMIN': USER_ROLES.SUPER_ADMIN
            // });
            
            // console.log('🔧 AuthContext detected roles:', {
            //   adminFromDoc,
            //   superAdminFromDoc,
            //   hr,
            //   instructor
            // });
            
            // Load user enrollments for status check
            let enrollments = [];
            try {
              const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('userId', '==', firebaseUser.uid)));
              enrollments = enrollmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            } catch (e) {
              console.warn('Failed to load enrollments for status check:', e);
            }
            
            // Check user status
            const userStatus = getUserStatus(profile, enrollments);
            const statusSummary = getUserStatusSummary(profile, enrollments);
            
            // Prevent deleted users from logging in
            if (!canUserLogin(profile)) {
              console.warn('[Auth] User is deleted. Signing out.');
              await signOutUser();
              return;
            }
            
            // Store full profile with display name and status
            profile = {
              uid: firebaseUser.uid,
              email: profile.email || firebaseUser.email,
              displayName: profile.displayName || profile.name || firebaseUser.displayName || profile.email?.split('@')[0],
              name: profile.name || profile.displayName || firebaseUser.displayName,
              role: profile.role,
              studentNumber: profile.studentNumber,
              photoURL: profile.photoURL || firebaseUser.photoURL,
              status: userStatus,
              statusSummary,
              ...profile
            };
            
            // console.log('🔧 AuthContext final profile:', profile);
            // console.log('🔧 AuthContext final profile.displayName:', profile.displayName);
            
            // Cache in sessionStorage
            sessionStorage.setItem('userProfile', JSON.stringify(profile));
            setUserProfile(profile);

            // Update localStorage with messageColor for ColorThemeContext
            try {
              if (profile?.messageColor) {
                localStorage.setItem(`accent_color_${firebaseUser.uid}`, profile.messageColor);
                // Notify ColorThemeContext to update
                window.dispatchEvent(new CustomEvent('accent-color-updated', { detail: { uid: firebaseUser.uid, color: profile.messageColor } }));
              }
            } catch {}
          }
        } catch (error) {
          console.error('🔧 AuthContext error in role detection:', error);
          console.error('🔧 AuthContext error stack:', error?.stack);
        }

        // If Firestore says admin, honor it (hot-fix for missing claims/allowlist)
        if (!admin && adminFromDoc) admin = true;

        // console.log('🔧 AuthContext before final assignment:', {
        //   admin,
        //   adminFromDoc,
        //   superAdminFromDoc,
        //   hr,
        //   instructor,
        //   'typeof superAdminFromDoc': typeof superAdminFromDoc
        // });

        setIsAdmin(!!admin);
        setIsSuperAdmin(!!superAdminFromDoc);
        setIsHR(hr);
        setIsInstructor(instructor);
        
        if (superAdminFromDoc) userRole = USER_ROLES.SUPER_ADMIN;
        else if (admin) userRole = USER_ROLES.ADMIN;
        else if (hr) userRole = USER_ROLES.HR;
        else if (instructor) userRole = USER_ROLES.INSTRUCTOR;
        else userRole = USER_ROLES.STUDENT;
        
        // console.log('🔧 AuthContext final role assignment:', {
        //   superAdminFromDoc,
        //   admin,
        //   hr,
        //   instructor,
        //   finalRole: userRole
        // });
        
        setRole(userRole);

        // Only log login on actual login action (new session), not on every auth state change
        if (isNewLogin) {
          try {
            await addLoginLog({ userId: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName || null });
            // Log activity with new logger - only on actual login
            await ActivityLogger.login();
            setHasLoggedInThisSession(true); // Mark as logged for this session
            sessionStorage.setItem('hasLoggedInThisSession', 'true');
            sessionStorage.setItem('sessionStart', Date.now().toString());
          } catch {}
        }

        // Listen to user doc existence (sign out if removed)
        try {
          if (userDocUnsub) userDocUnsub();
          userDocUnsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
            if (!snap.exists()) {
              console.warn('[Auth] User doc removed. Signing out.');
              signOutUser();
            }
          });
        } catch {}
      } catch (error) {
        console.warn('Auth init non-fatal error:', error?.message || error);
        setIsAdmin(false);
        setRole(USER_ROLES.STUDENT);
      }
      setLoading(false);
    });

    return () => {
      if (userDocUnsub) userDocUnsub();
      unsubscribe();
    };
  }, []);

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
      console.error('Impersonation error:', error);
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
