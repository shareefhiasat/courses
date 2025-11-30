import React from 'react';
import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * 
 * To configure:
 * 1. Create a project at https://sentry.io
 * 2. Add your DSN to .env file: VITE_SENTRY_DSN=your-dsn-here
 * 3. Set environment: VITE_SENTRY_ENVIRONMENT=production (or development)
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN || 'https://226bc4d018e5d5b73f2dfd03014bb4c9@o570111.ingest.us.sentry.io/4510386883067904';
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
  
  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('Sentry DSN not found. Error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Send default PII data to Sentry (IP addresses, user info)
    sendDefaultPii: true,
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ['localhost', /^https:\/\/.*\.firebaseapp\.com/, /^https:\/\/.*\.web\.app/],
    
    // Capture Replay for 10% of all sessions,
    // plus 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      // Replay integration for session replay
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      // React profiler for component performance
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
      }),
    ],
    
    // Filter out certain errors
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (environment === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
        return null;
      }
      
      // Filter out specific errors
      const error = hint.originalException;
      if (error && error.message) {
        // Ignore network errors
        if (error.message.match(/network/i)) {
          return null;
        }
        // Ignore Firebase permission errors (expected)
        if (error.message.match(/permission-denied/i)) {
          return null;
        }
      }
      
      return event;
    },
  });
  
  console.log(`✅ Sentry initialized (${environment})`);
};

/**
 * Manually capture an exception
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    contexts: context,
  });
};

/**
 * Manually capture a message
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
export const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking
 * @param {Object} user - User information
 */
export const setUser = (user) => {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  
  Sentry.setUser({
    id: user.uid,
    email: user.email,
    username: user.displayName,
  });
};

/**
 * Add breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {Object} data - Additional data
 */
export const addBreadcrumb = (message, data = {}) => {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
};

export default Sentry;
