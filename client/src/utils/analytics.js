/**
 * Analytics and logging utility with PostHog integration
 * Configurable through environment variables
 */

import PostHog from 'posthog-js';
import logger from './logger';

class AnalyticsManager {
  constructor() {
    this.enabled = false;
    this.environment = import.meta.env.MODE || 'development';
    // PostHogProvider handles initialization
  }

  initialize() {
    // Check if analytics is enabled
    this.enabled = import.meta.env.VITE_PUBLIC_POSTHOG_ENABLED !== 'false';
    
    console.log('🔍 PostHog Debug - Analytics Manager:', {
      enabled: this.enabled,
      envKey: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
      envHost: import.meta.env.VITE_PUBLIC_POSTHOG_HOST
    });
    
    if (!this.enabled) {
      logger.info('Analytics disabled via VITE_PUBLIC_POSTHOG_ENABLED');
      return;
    }
  }

  setUserProperties() {
    if (!this.posthog) return;

    try {
      const userProperties = {
        environment: this.environment,
        app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
        build_time: import.meta.env.VITE_BUILD_TIME || 'unknown',
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
      };

      this.posthog.register(userProperties);
      logger.debug('User properties set:', userProperties);
    } catch (error) {
      logger.error('Failed to set user properties:', error);
    }
  }

  // Identify user
  identify(userId, properties = {}) {
    if (!this.posthog || !this.enabled) return;

    try {
      this.posthog.identify(userId, properties);
      logger.info(`User identified: ${userId}`);
    } catch (error) {
      logger.error('Failed to identify user:', error);
    }
  }

  // Track custom events using usePostHog hook pattern
  track(eventName, properties = {}) {
    console.log('🔍 PostHog Debug - Track called:', {
      eventName,
      properties,
      enabled: this.enabled
    });
    
    if (!this.enabled) {
      console.log('🔍 PostHog Debug - Track blocked: Analytics disabled');
      return;
    }

    try {
      // Use global PostHog instance from PostHogProvider
      const posthog = window.posthog;
      if (!posthog) {
        console.log('🔍 PostHog Debug - Track blocked: No PostHog instance');
        return;
      }

      // Add common properties
      const enrichedProperties = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ...properties,
      };

      console.log('🔍 PostHog Debug - Sending event:', {
        eventName,
        enrichedProperties
      });

      posthog.capture(eventName, enrichedProperties);
      logger.debug(`Event tracked: ${eventName}`, enrichedProperties);
    } catch (error) {
      console.error('❌ PostHog track error:', error);
      logger.error('Failed to track event:', error);
    }
  }

  // Track page views
  pageview(path = null, properties = {}) {
    console.log('🔍 PostHog Debug - Pageview called:', {
      path,
      properties,
      enabled: this.enabled
    });
    
    if (!this.enabled) {
      console.log('🔍 PostHog Debug - Pageview blocked: Analytics disabled');
      return;
    }

    try {
      // Use global PostHog instance from PostHogProvider
      const posthog = window.posthog;
      if (!posthog) {
        console.log('🔍 PostHog Debug - Pageview blocked: No PostHog instance');
        return;
      }

      const pagePath = path || window.location.pathname;
      const enrichedProperties = {
        path: pagePath,
        referrer: document.referrer,
        title: document.title,
        ...properties,
      };

      console.log('🔍 PostHog Debug - Sending pageview:', {
        pagePath,
        enrichedProperties
      });

      posthog.capture('$pageview', enrichedProperties);
      logger.debug(`Page view tracked: ${pagePath}`);
    } catch (error) {
      console.error('❌ PostHog pageview error:', error);
      logger.error('Failed to track page view:', error);
    }
  }

  // Track user actions with comprehensive data
  trackAction(action, element, properties = {}) {
    this.track(`user_action_${action}`, {
      element_type: element.tagName?.toLowerCase(),
      element_id: element.id || null,
      element_class: element.className || null,
      element_text: element.textContent?.slice(0, 100) || null,
      page_url: window.location.href,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      ...properties,
    });
  }

  // Track page visits with detailed context
  trackPageVisit(path = null, properties = {}) {
    const pagePath = path || window.location.pathname;
    this.track('page_visit', {
      page_path: pagePath,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      ...properties,
    });
  }

  // Track user interactions with forms
  trackFormInteraction(formName, action, properties = {}) {
    this.track('form_interaction', {
      form_name: formName,
      action: action, // submit, focus, blur, change
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  // Track notification interactions
  trackNotificationInteraction(notificationId, action, properties = {}) {
    this.track('notification_interaction', {
      notification_id: notificationId,
      action: action, // click, dismiss, read, unread
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  // Track user session events
  trackSessionEvent(eventType, properties = {}) {
    this.track('session_event', {
      event_type: eventType, // login, logout, session_start, session_end
      timestamp: new Date().toISOString(),
      session_duration: properties.duration || null,
      ...properties,
    });
  }

  // Track performance metrics
  trackPerformance(metricName, value, properties = {}) {
    this.track('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      metric_unit: properties.unit || 'ms',
      ...properties,
    });
  }

  // Track errors
  trackError(error, context = {}) {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context: JSON.stringify(context),
      user_agent: navigator.userAgent,
    });
  }

  // Track Firebase operations
  trackFirebaseOperation(operation, success = true, duration = null, properties = {}) {
    this.track('firebase_operation', {
      operation_type: operation,
      success: success,
      duration_ms: duration,
      ...properties,
    });
  }

  // Track email operations
  trackEmailOperation(operation, recipientCount = 1, success = true, properties = {}) {
    this.track('email_operation', {
      operation_type: operation,
      recipient_count: recipientCount,
      success: success,
      ...properties,
    });
  }

  // Track user engagement
  trackEngagement(type, duration = null, properties = {}) {
    this.track('user_engagement', {
      engagement_type: type,
      duration_ms: duration,
      ...properties,
    });
  }

  // Reset user identification
  reset() {
    if (!this.posthog || !this.enabled) return;

    try {
      this.posthog.reset();
      logger.info('User identification reset');
    } catch (error) {
      logger.error('Failed to reset user identification:', error);
    }
  }

  // Get current user distinct ID
  getDistinctId() {
    if (!this.posthog || !this.enabled) return null;
    
    try {
      return this.posthog.get_distinct_id();
    } catch (error) {
      logger.error('Failed to get distinct ID:', error);
      return null;
    }
  }

  // Feature flag checking
  isFeatureEnabled(flagKey, defaultValue = false) {
    if (!this.posthog || !this.enabled) return defaultValue;

    try {
      return this.posthog.isFeatureEnabled(flagKey);
    } catch (error) {
      logger.error('Failed to check feature flag:', error);
      return defaultValue;
    }
  }

  // A/B testing
  getVariant(experimentKey, defaultValue = null) {
    if (!this.posthog || !this.enabled) return defaultValue;

    try {
      return this.posthog.getFeatureFlag(experimentKey);
    } catch (error) {
      logger.error('Failed to get experiment variant:', error);
      return defaultValue;
    }
  }

  // Flush events
  flush() {
    if (!this.posthog || !this.enabled) return;

    try {
      this.posthog.flush();
      logger.debug('PostHog events flushed');
    } catch (error) {
      logger.error('Failed to flush PostHog events:', error);
    }
  }

  // Opt out of tracking
  optOut() {
    if (!this.posthog || !this.enabled) return;

    try {
      this.posthog.opt_out_capturing();
      logger.info('User opted out of tracking');
    } catch (error) {
      logger.error('Failed to opt out:', error);
    }
  }

  // Opt in to tracking
  optIn() {
    if (!this.posthog || !this.enabled) return;

    try {
      this.posthog.opt_in_capturing();
      logger.info('User opted in to tracking');
    } catch (error) {
      logger.error('Failed to opt in:', error);
    }
  }
}

// Create singleton instance
const analytics = new AnalyticsManager();

export default analytics;
