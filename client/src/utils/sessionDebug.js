/**
 * Session Debug Utility
 * Use this to debug session timeout and auto-logout issues
 */

export const debugSessionState = () => {
  const sessionStart = sessionStorage.getItem('sessionStart');
  const logoutReason = sessionStorage.getItem('logoutReason');
  const logoutTimestamp = sessionStorage.getItem('logoutTimestamp');
  const lastActivityTime = sessionStorage.getItem('lastActivityTime');
  const sessionTimeoutUser = sessionStorage.getItem('sessionTimeoutUser');
  
  return {
    hasSession: !!sessionStorage.getItem('hasLoggedInThisSession'),
    sessionAge: sessionStart ? Date.now() - parseInt(sessionStart) : 0,
    logoutReason,
    hasUserProfile: !!sessionStorage.getItem('userProfile')
  };
};

export const clearSessionDebugInfo = () => {
  sessionStorage.removeItem('logoutReason');
  sessionStorage.removeItem('logoutTimestamp');
  sessionStorage.removeItem('lastActivityTime');
  sessionStorage.removeItem('sessionTimeoutUser');
};

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  window.debugSession = debugSessionState;
  window.clearSessionDebug = clearSessionDebugInfo;
}
