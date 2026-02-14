/**
 * Logging Configuration
 * 
 * Configure logging for different environments
 */

import logger from '../utils/logger';

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Loggly configuration (for production and testing)
export const LOGGLY_CONFIG = {
  enabled: isProduction, // Only enable in production
  token: import.meta.env.VITE_LOGGLY_TOKEN || '', // Get from environment variables
  tags: ['qr-scanner', isProduction ? 'production' : 'development']
};

// Local logging configuration (for development)
export const LOCAL_LOGGING_CONFIG = {
  enabled: isDevelopment, // Only enable in development
  interceptConsole: false, // Keep disabled to prevent infinite loop
  bufferSize: isDevelopment ? 50 : 100, // Smaller buffer in dev for faster feedback
  flushInterval: isDevelopment ? 2000 : 5000, // Faster flush in dev
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 3
};

// Initialize logger with appropriate configuration
export const initializeLogger = (logger) => {
  // Configure local logging
  Object.assign(logger, LOCAL_LOGGING_CONFIG);
  
  // Configure Loggly for production
  if (LOGGLY_CONFIG.enabled && LOGGLY_CONFIG.token) {
    logger.configureLoggly(LOGGLY_CONFIG);
    logger.log('📊 Loggly logging enabled for production');
  } else if (LOGGLY_CONFIG.enabled && !LOGGLY_CONFIG.token) {
    logger.warn('⚠️ Loggly enabled but no token provided. Set VITE_LOGGLY_TOKEN environment variable.');
  }
  
  // Log initialization
  logger.info('Logger', 'initialized', {
    environment: isProduction ? 'production' : 'development',
    logglyEnabled: LOGGLY_CONFIG.enabled && !!LOGGLY_CONFIG.token,
    localLoggingEnabled: LOCAL_LOGGING_CONFIG.enabled,
    consoleInterception: LOCAL_LOGGING_CONFIG.interceptConsole
  });
  
  return logger;
};

// Instructions for setting up Loggly
export const LOGGLY_SETUP_INSTRUCTIONS = `
🔧 Loggly Setup Instructions:

1. Sign up for a free Loggly account at https://www.loggly.com/
2. Get your Customer Token from Loggly dashboard
3. Add the token to your environment variables:

   For development (.env file):
   VITE_LOGGLY_TOKEN=your-customer-token-here

   For production (your hosting platform):
   VITE_LOGGLY_TOKEN=your-customer-token-here

4. The logger will automatically send logs to Loggly in production

📊 Loggly Free Tier Benefits:
- 200 MB of log data per day
- 7-day log retention
- Real-time log search
- Dashboards and alerts
- No credit card required for free tier

💡 Pro Tip: Use different tokens for different environments if needed
`;

export default {
  LOGGLY_CONFIG,
  LOCAL_LOGGING_CONFIG,
  initializeLogger,
  LOGGLY_SETUP_INSTRUCTIONS
};
