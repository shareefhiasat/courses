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
import logger from '@utils/logger';
import { validateEmail as validateEmailFormat } from '@utils/validationHelpers';
import AuthErrorHandler from '@utils/authErrorHandler';

export const signIn = async (email, password) => {
  try {
    if (!email || !password) return { success: false, error: 'Email and password are required' };
    const emailCheck = validateEmailFormat(email);
    if (!emailCheck.isValid) return { success: false, error: emailCheck.errors[0] };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };
    
    logger.info('AUTH: User sign in attempt', { email: email.substring(0, 3) + '***' });
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Log successful login
    try {
      await ActivityLogger.login();
    } catch (logError) {
      logger.warn('Failed to log login activity:', logError);
    }
    
    logger.info('AUTH: User signed in successfully', { userId: result.user.uid });
    return { success: true, user: result.user };
  } catch (error) {
    logger.error('AUTH: Sign in failed', { 
      error: error.message, 
      email: email.substring(0, 3) + '***' 
    });
    return { success: false, error: error.message };
  }
};

export const signUp = async (email, password, displayName) => {
  try {
    if (!email || !password) return { success: false, error: 'Email and password are required' };
    const emailCheck = validateEmailFormat(email);
    if (!emailCheck.isValid) return { success: false, error: emailCheck.errors[0] };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };
    if (displayName && (typeof displayName !== 'string' || displayName.trim().length === 0)) {
      return { success: false, error: 'Display name must be a non-empty string' };
    }
    
    logger.info('AUTH: User sign up attempt', { email: email.substring(0, 3) + '***' });
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // If a displayName is provided, update the profile
    if (displayName && displayName.trim()) {
      try {
        await updateProfile(result.user, { displayName: displayName.trim() });
        logger.info('AUTH: Display name updated successfully');
      } catch (e) {
        // Non-fatal: continue even if profile update fails
        logger.warn('AUTH: Failed to set displayName on signup:', e);
      }
    }
    
    logger.info('AUTH: User signed up successfully', { userId: result.user.uid });
    return { success: true, user: result.user };
  } catch (error) {
    logger.error('AUTH: Sign up failed', { 
      error: error.message, 
      email: email.substring(0, 3) + '***' 
    });
    return { success: false, error: error.message };
  }
};

export const signOutUser = async (user = null) => {
  try {
    const logoutReason = sessionStorage.getItem('logoutReason');
    const logoutTimestamp = sessionStorage.getItem('logoutTimestamp');
    const sessionTimeoutUser = sessionStorage.getItem('sessionTimeoutUser');
    
    logger.log(`[Auth] signOutUser called - Reason: ${logoutReason}, Timestamp: ${logoutTimestamp}`);
    logger.log(`[Auth] User provided: ${user ? user.email : 'null'}, Session user: ${sessionTimeoutUser}`);
    
    // Reset session flag immediately when logout is initiated
    sessionStorage.removeItem('hasLoggedInThisSession');
    sessionStorage.removeItem('sessionStart');
    
    // Store logout reason if not already set (manual logout)
    if (!sessionStorage.getItem('logoutReason')) {
      sessionStorage.setItem('logoutReason', 'manual_logout');
      sessionStorage.setItem('logoutTimestamp', Date.now().toString());
      logger.log('[Auth] Manual logout detected');
    }
    
    // Log logout activity before signing out
    if (user) {
      try {
        logger.log(`[Auth] Attempting to log logout activity for user: ${user.email}`);
        await ActivityLogger.logout();
        logger.log('[Auth] Logout activity logged successfully');
      } catch (error) {
        logger.warn('Failed to log logout activity:', error);
      }
    } else {
      logger.warn('[Auth] No user provided to signOutUser, trying session timeout user');
      // Try to use session timeout user if available
      if (sessionTimeoutUser) {
        try {
          const timeoutUser = JSON.parse(sessionTimeoutUser);
          logger.log(`[Auth] Using session timeout user for logout: ${timeoutUser.email}`);
          await ActivityLogger.logout();
        } catch (error) {
          logger.warn('Failed to log logout with session timeout user:', error);
        }
      }
    }
    
    logger.log('[Auth] Calling Firebase signOut...');
    await signOut(auth);
    logger.log('[Auth] Firebase signOut completed successfully');
    return { success: true };
  } catch (error) {
    logger.error('[Auth] Error in signOutUser:', error);
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
      logger.warn('Failed to log password change activity:', error);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    try {
      await callback(user);
    } catch (error) {
      // Handle permission errors gracefully during logout
      if (error?.code === 'permission-denied' || error?.message?.includes('permission-denied') || error?.message?.includes('Missing or insufficient permissions')) {
        logger.warn('[Auth] Permission error in auth state change, continuing without retry:', error.message);
        // For permission errors, continue with null user to allow logout to complete
        if (user === null) {
          await callback(null);
        } else {
          // If user exists but permission error occurs, try with null to force logout
          await callback(null);
        }
      } else {
        // For other errors, let them propagate
        throw error;
      }
    }
  });
};

