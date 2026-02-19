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
import { withPerformanceMonitoring } from '@utils/performance';

export const signIn = withPerformanceMonitoring(async (email, password) => {
  try {
    if (!email || !password) return { success: false, error: 'Email and password are required' };
    const emailCheck = validateEmailFormat(email);
    if (!emailCheck.isValid) return { success: false, error: emailCheck.errors[0] };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };
    
    logger.info('AUTH: User sign in attempt', { email: email.substring(0, 3) + '***' });
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    logger.info('AUTH: User signed in successfully', { userId: result.user.uid });
    return { success: true, user: result.user };
  } catch (error) {
    logger.error('AUTH: Sign in failed', { 
      error: error.message, 
      email: email.substring(0, 3) + '***' 
    });
    return { success: false, error: error.message };
  }
}, 'signIn');

export const signUp = withPerformanceMonitoring(async (email, password, displayName) => {
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
}, 'signUp');

export const signOutUser = withPerformanceMonitoring(async (user = null) => {
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
        logger.warn('Failed to log logout activity:', error);
      }
    }
    
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}, 'signOut');

export const resetPassword = withPerformanceMonitoring(async (email) => {
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
}, 'resetPassword');

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

