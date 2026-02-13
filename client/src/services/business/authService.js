import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { ActivityLogger } from '../other/activityLogger';
import { auth } from '../other/config';

export const signIn = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signUp = async (email, password, displayName) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // If a displayName is provided, update the profile
    if (displayName && displayName.trim()) {
      try {
        await updateProfile(result.user, { displayName: displayName.trim() });
      } catch (e) {
        // Non-fatal: continue even if profile update fails
        console.warn('Failed to set displayName on signup:', e);
      }
    }
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signOutUser = async (user = null) => {
  try {
    // Reset session flag immediately when logout is initiated
    sessionStorage.removeItem('hasLoggedInThisSession');
    sessionStorage.removeItem('sessionStart');
    
    // Store logout reason if not already set (manual logout)
    if (!sessionStorage.getItem('logoutReason')) {
      sessionStorage.setItem('logoutReason', 'manual_logout');
      sessionStorage.setItem('logoutTimestamp', Date.now().toString());
    }
    
    // Log logout activity before signing out
    if (user) {
      try {
        await ActivityLogger.logout();
      } catch (error) {
        console.warn('Failed to log logout activity:', error);
      }
    }
    
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    
    // Log password reset activity
    try {
      await ActivityLogger.passwordChange();
    } catch (error) {
      console.warn('Failed to log password change activity:', error);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
