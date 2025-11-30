import posthog from 'posthog-js';

/**
 * Initialize PostHog for product analytics and feature flags
 * 
 * To configure:
 * 1. Create a project at https://posthog.com
 * 2. Add your API key to .env file: VITE_POSTHOG_KEY=your-key-here
 * 3. Add your host: VITE_POSTHOG_HOST=https://app.posthog.com (or your self-hosted URL)
 */
export const initPostHog = () => {
  const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_POSTHOG_KEY || 'phc_mpxjjYTNPiUTxE12MYkOsbH1DLTsjuOz4EEUOWEkUuc';
  const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';
  const environment = import.meta.env.VITE_POSTHOG_ENVIRONMENT || 'development';
  
  // Only initialize if API key is provided
  if (!apiKey) {
    console.warn('PostHog API key not found. Analytics is disabled.');
    return null;
  }

  posthog.init(apiKey, {
    api_host: host,
    
    // Enable session recording
    session_recording: {
      recordCrossOriginIframes: true,
    },
    
    // Capture pageviews automatically
    capture_pageview: true,
    
    // Capture performance metrics
    capture_performance: true,
    
    // Enable feature flags
    bootstrap: {
      featureFlags: {},
    },
    
    // Disable in development unless explicitly enabled
    loaded: (posthog) => {
      if (environment === 'development' && !import.meta.env.VITE_POSTHOG_DEBUG) {
        posthog.opt_out_capturing();
        console.log('📊 PostHog initialized but capturing disabled in development');
      } else {
        console.log(`✅ PostHog initialized (${environment})`);
      }
    },
  });
  
  return posthog;
};

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {Object} properties - Event properties
 */
export const trackEvent = (eventName, properties = {}) => {
  if (posthog.__loaded) {
    posthog.capture(eventName, properties);
  }
};

/**
 * Identify a user
 * @param {string} userId - User ID
 * @param {Object} properties - User properties
 */
export const identifyUser = (userId, properties = {}) => {
  if (posthog.__loaded) {
    posthog.identify(userId, properties);
  }
};

/**
 * Reset user identity (on logout)
 */
export const resetUser = () => {
  if (posthog.__loaded) {
    posthog.reset();
  }
};

/**
 * Check if a feature flag is enabled
 * @param {string} flagKey - Feature flag key
 * @returns {boolean}
 */
export const isFeatureEnabled = (flagKey) => {
  if (posthog.__loaded) {
    return posthog.isFeatureEnabled(flagKey);
  }
  return false;
};

/**
 * Get feature flag value
 * @param {string} flagKey - Feature flag key
 * @returns {any}
 */
export const getFeatureFlag = (flagKey) => {
  if (posthog.__loaded) {
    return posthog.getFeatureFlag(flagKey);
  }
  return null;
};

/**
 * Track page view manually
 * @param {string} pageName - Page name
 */
export const trackPageView = (pageName) => {
  if (posthog.__loaded) {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName,
    });
  }
};

export default posthog;
