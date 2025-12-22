import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAllowlist, ensureUserDoc, addLoginLog } from '../firebase/firestore';
import { signOutUser } from '../firebase/auth';
import { ActivityLogger } from '../firebase/activityLogger';

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
  const [role, setRole] = useState('guest'); // 'guest' | 'student' | 'instructor' | 'hr' | 'admin'
  const [impersonating, setImpersonating] = useState(null); // { originalUser, impersonatedUser }
  const [realUser, setRealUser] = useState(null); // Store the real admin user
  
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
        setUser(null);
        setIsAdmin(false);
        setRole('guest');
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      try {
        // Ensure a user doc exists
        try {
          await ensureUserDoc(firebaseUser.uid, { email: firebaseUser.email, displayName: firebaseUser.displayName || null });
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
                  const { app } = await import('../firebase/config');
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
        let userRole = 'student';
        let hr = false;
        let instructor = false;
        let adminFromDoc = false;
        let superAdminFromDoc = false;
        let profile = null;
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            adminFromDoc = (userData.role === 'admin' || userData.role === 'super_admin') || userData.isAdmin === true;
            superAdminFromDoc = userData.role === 'super_admin' || userData.isSuperAdmin === true;
            hr = userData.role === 'hr' || userData.isHR === true;
            instructor = userData.role === 'instructor' || userData.isInstructor === true;
            
            // Store full profile with display name
            profile = {
              uid: firebaseUser.uid,
              email: userData.email || firebaseUser.email,
              displayName: userData.displayName || userData.name || firebaseUser.displayName || userData.email?.split('@')[0],
              name: userData.name || userData.displayName || firebaseUser.displayName,
              role: userData.role,
              studentNumber: userData.studentNumber,
              photoURL: userData.photoURL || firebaseUser.photoURL,
              ...userData
            };
            
            // Cache in sessionStorage
            sessionStorage.setItem('userProfile', JSON.stringify(profile));
            setUserProfile(profile);
          }
        } catch {}

        // If Firestore says admin, honor it (hot-fix for missing claims/allowlist)
        if (!admin && adminFromDoc) admin = true;

        setIsAdmin(!!admin);
        setIsSuperAdmin(!!superAdminFromDoc || (!!admin && userRole === 'super_admin'));
        setIsHR(hr);
        setIsInstructor(instructor);
        
        if (admin) userRole = 'admin';
        else if (hr) userRole = 'hr';
        else if (instructor) userRole = 'instructor';
        else userRole = 'student';
        
        setRole(userRole);

        // Best-effort login log
        try {
          await addLoginLog({ userId: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName || null });
          // Log activity with new logger
          await ActivityLogger.login();
        } catch {}

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
        setRole('student');
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
      setRole(studentData.role || 'student');
      
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
    const wasAdmin = impersonating?.originalUser?.role === 'admin';
    const wasHR = impersonating?.originalUser?.role === 'hr';
    const wasInstructor = impersonating?.originalUser?.role === 'instructor';
    setIsAdmin(wasAdmin || false);
    setIsHR(wasHR || false);
    setIsInstructor(wasInstructor || false);
    setRole(impersonating?.originalUser?.role || 'admin');
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
