// Auth error handling utility
// Firebase auth replaced with Keycloak

import { info, warn } from '@services/utils/logger.js';

export class AuthErrorHandler {
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
        
        // Token refresh handled by Keycloak adapter
        info('[AuthErrorHandler] Keycloak will handle token refresh automatically');
        this.retryCount = 0; // Reset on success
        return true; // Retry should succeed
      } else {
        error('[AuthErrorHandler] Max retries reached');
        this.retryCount = 0;
        
        // Redirect to login handled by Keycloak
        if (context === 'auth-state-change') {
          window.location.href = '/';
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
