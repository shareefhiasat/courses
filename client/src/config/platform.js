// Smart platform URL configuration
// Automatically detects localhost vs production

export const getPlatformUrl = () => {
  if (typeof window === 'undefined') {
    return 'https://main-one-32026.web.app';
  }
  
  const hostname = window.location.hostname;
  
  // Localhost detection
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:${window.location.port || 5174}`;
  }
  
  // Production
  return 'https://main-one-32026.web.app';
};

export const PLATFORM_URL = getPlatformUrl();

export default {
  getPlatformUrl,
  PLATFORM_URL
};
