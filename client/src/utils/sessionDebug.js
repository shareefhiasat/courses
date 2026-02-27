/**
 * Session Debug Utility
 * Use this to debug session timeout and auto-logout issues
 */

export const debugSessionState = () => {
  console.group('🔍 Session Debug Information');
  
  // Session storage info
  console.log('Session Storage:');
  console.log('  hasLoggedInThisSession:', sessionStorage.getItem('hasLoggedInThisSession'));
  console.log('  sessionStart:', sessionStorage.getItem('sessionStart'));
  console.log('  userProfile exists:', !!sessionStorage.getItem('userProfile'));
  console.log('  logoutReason:', sessionStorage.getItem('logoutReason'));
  console.log('  logoutTimestamp:', sessionStorage.getItem('logoutTimestamp'));
  console.log('  lastActivityTime:', sessionStorage.getItem('lastActivityTime'));
  console.log('  sessionTimeoutUser:', sessionStorage.getItem('sessionTimeoutUser'));
  
  // Calculate session age
  const sessionStart = sessionStorage.getItem('sessionStart');
  if (sessionStart) {
    const sessionAge = Date.now() - parseInt(sessionStart);
    console.log(`  Session age: ${Math.floor(sessionAge / 1000 / 60)} minutes`);
  }
  
  // Calculate time since logout
  const logoutTimestamp = sessionStorage.getItem('logoutTimestamp');
  if (logoutTimestamp) {
    const timeSinceLogout = Date.now() - parseInt(logoutTimestamp);
    console.log(`  Time since logout: ${Math.floor(timeSinceLogout / 1000)} seconds`);
  }
  
  // Local storage info
  console.log('\nLocal Storage:');
  const keys = Object.keys(localStorage);
  const authKeys = keys.filter(key => key.includes('auth') || key.includes('firebase') || key.includes('user'));
  authKeys.forEach(key => {
    console.log(`  ${key}:`, localStorage.getItem(key) ? 'exists' : 'empty');
  });
  
  // Current page info
  console.log('\nPage Info:');
  console.log('  Current URL:', window.location.pathname);
  console.log('  User Agent:', navigator.userAgent);
  console.log('  Online:', navigator.onLine);
  
  // Check for common issues
  console.log('\n🚨 Potential Issues:');
  
  if (!sessionStorage.getItem('hasLoggedInThisSession')) {
    console.warn('  ⚠️ No login session flag found');
  }
  
  if (!sessionStorage.getItem('sessionStart')) {
    console.warn('  ⚠️ No session start time found');
  }
  
  if (!sessionStorage.getItem('userProfile')) {
    console.warn('  ⚠️ No user profile in session storage');
  }
  
  const logoutReason = sessionStorage.getItem('logoutReason');
  if (logoutReason === 'session_timeout') {
    console.warn('  ⚠️ Last logout was due to session timeout');
  }
  
  console.groupEnd();
  
  return {
    hasSession: !!sessionStorage.getItem('hasLoggedInThisSession'),
    sessionAge: sessionStart ? Date.now() - parseInt(sessionStart) : 0,
    logoutReason,
    hasUserProfile: !!sessionStorage.getItem('userProfile')
  };
};

export const clearSessionDebugInfo = () => {
  console.log('🧹 Clearing session debug info...');
  sessionStorage.removeItem('logoutReason');
  sessionStorage.removeItem('logoutTimestamp');
  sessionStorage.removeItem('lastActivityTime');
  sessionStorage.removeItem('sessionTimeoutUser');
  console.log('✅ Session debug info cleared');
};

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  window.debugSession = debugSessionState;
  window.clearSessionDebug = clearSessionDebugInfo;
  
  console.log('🔧 Debug utilities available:');
  console.log('  debugSession() - Show current session state');
  console.log('  clearSessionDebug() - Clear session debug info');
}
