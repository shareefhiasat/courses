// Auth error handling utility
import { signOut } from 'firebase/auth';
import { auth } from '@services/other/config';


import { info, error, warn, debug } from '@services/utils/logger.js';export class AuthErrorHandler {
  private static retryCount = 0;
  private static maxRetries = 3;
  private static retryDelay = 1000; // 1 second

  static async handlePermissionError(error: any, context: string = 'unknown'): Promise<boolean> {
    warn(`[AuthErrorHandler] Permission error in ${context}:`, error);
    
    // Check if it's a permission-denied error
    if (error?.code === 'permission-denied' || error?.message?.includes('permission-denied')) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        info(`[AuthErrorHandler] Retrying auth operation (${this.retryCount}/${this.maxRetries})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        // Try to refresh the token
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.getIdTokenResult(true);
            info('[AuthErrorHandler] Token refreshed successfully');
            this.retryCount = 0; // Reset on success
            return true; // Retry should succeed
          }
        } catch (refreshError) {
          error('[AuthErrorHandler] Failed to refresh token:', refreshError);
        }
      } else {
        error('[AuthErrorHandler] Max retries reached, signing out');
        this.retryCount = 0;
        
        // Only sign out if this is a critical auth failure
        if (context === 'auth-state-change') {
          await signOut(auth);
          return false;
        }
      }
    }
    
    return false;
  }

  static resetRetryCount(): void {
    this.retryCount = 0;
  }

  static shouldRetry(error: any): boolean {
    return this.retryCount < this.maxRetries && 
           (error?.code === 'permission-denied' || 
            error?.message?.includes('permission-denied') ||
            error?.code === 'unavailable' ||
            error?.message?.includes('unavailable'));
  }
}

export default AuthErrorHandler;
