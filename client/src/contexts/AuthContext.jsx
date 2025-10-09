import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAllowlist, ensureUserDoc, addLoginLog } from '../firebase/firestore';
import { signOutUser } from '../firebase/auth';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('guest'); // 'guest' | 'student' | 'admin'

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

        setIsAdmin(!!admin);
        setRole(admin ? 'admin' : 'student');

        // Best-effort login log
        try {
          await addLoginLog({ userId: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName || null });
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

  const value = {
    user,
    isAdmin,
    role,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
