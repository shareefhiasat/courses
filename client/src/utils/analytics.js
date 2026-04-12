/**
 * Simplified analytics and logging utility
 * All PostHog functionality has been deprecated
 * Only local logging remains for debugging purposes
 */

import { info, error, warn, debug } from '../services/utils/logger.js';

class AnalyticsManager {
  constructor() {
    this.enabled = false;
    this.environment = import.meta.env.MODE || 'development';
    // Analytics functionality has been deprecated
  }

  initialize() {
    // Analytics disabled - PostHog has been deprecated
    this.enabled = false;
    info('Analytics functionality has been deprecated');
  }

  setUserProperties() {
    // Deprecated - PostHog functionality removed
    debug('User properties setting deprecated - no analytics service active');
  }

  // Identify user - deprecated
  identify(userId, properties = {}) {
    // Deprecated - PostHog functionality removed
    info(`User identification deprecated for user: ${userId}`);
  }

  // Track custom events - deprecated
  track(eventName, properties = {}) {
    // Deprecated - PostHog functionality removed, only local logging remains
    info('🔍 Analytics Track called (deprecated):', {
      eventName,
      properties,
      enabled: this.enabled
    });
    
    if (!this.enabled) {
      info('🔍 Analytics Track blocked: Analytics deprecated');
      return;
    }

    // Only log locally - no external tracking
    debug(`Event tracked locally (deprecated): ${eventName}`, properties);
  }

  // Track page views - deprecated
  pageview(path = null, properties = {}) {
    // Deprecated - PostHog functionality removed
    info('🔍 Analytics Pageview called (deprecated):', {
      path,
      properties,
      enabled: this.enabled
    });
    
    const pagePath = path || window.location.pathname;
    debug(`Page view tracked locally (deprecated): ${pagePath}`);
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

  // Reset user identification - deprecated
  reset() {
    // Deprecated - PostHog functionality removed
    info('User identification reset deprecated');
  }

  // Get current user distinct ID - deprecated
  getDistinctId() {
    // Deprecated - PostHog functionality removed
    debug('Get distinct ID deprecated - no analytics service active');
    return null;
  }

  // Feature flag checking - deprecated
  isFeatureEnabled(flagKey, defaultValue = false) {
    // Deprecated - PostHog functionality removed
    debug(`Feature flag check deprecated for: ${flagKey}`);
    return defaultValue;
  }

  // A/B testing - deprecated
  getVariant(experimentKey, defaultValue = null) {
    // Deprecated - PostHog functionality removed
    debug(`A/B test variant get deprecated for: ${experimentKey}`);
    return defaultValue;
  }

  // Flush events - deprecated
  flush() {
    // Deprecated - PostHog functionality removed
    debug('Event flush deprecated - no analytics service active');
  }

  // Opt out of tracking - deprecated
  optOut() {
    // Deprecated - PostHog functionality removed
    info('Opt out deprecated - no analytics service active');
  }

  // Opt in to tracking - deprecated
  optIn() {
    // Deprecated - PostHog functionality removed
    info('Opt in deprecated - no analytics service active');
  }
}

// Create singleton instance
const analytics = new AnalyticsManager();

export default analytics;

