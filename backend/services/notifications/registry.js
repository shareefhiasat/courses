/**
 * Notification Registry
 * 
 * Manages channel adapters and templates.
 * Determines which channels are enabled for a user based on preferences.
 */

import { CHANNELS, CATEGORIES, DELIVERY_STATUS } from './constants.js';
import log from './logger.js';

// Registry storage
const adapters = new Map();
const templates = new Map();

/**
 * Register a channel adapter
 * @param {Object} adapter - Adapter implementation
 * @param {string} adapter.key - Channel key (e.g., 'in_app', 'email')
 * @param {Function} adapter.send - Send function (notification, recipient, rendered) => Promise
 * @param {string} adapter.name - Human-readable name
 */
export const registerAdapter = (adapter) => {
  if (!adapter.key || typeof adapter.send !== 'function') {
    throw new Error('Invalid adapter: must have key and send function');
  }
  
  adapters.set(adapter.key, adapter);
  log.info('Adapter registered', { key: adapter.key, name: adapter.name });
};

/**
 * Register a template
 * @param {Object} template - Template implementation
 * @param {string} template.event - Event name (e.g., 'workflow.assigned')
 * @param {string} template.category - Category
 * @param {string} template.defaultPriority - Default priority
 * @param {Function} template.render - Render function (payload, lang) => { titleEn, titleAr, bodyEn, bodyAr, link, groupKey? }
 * @param {Function} template.renderEmail - Optional email render (payload, lang) => { subject, html, text }
 */
export const registerTemplate = (template) => {
  if (!template.event || typeof template.render !== 'function') {
    throw new Error('Invalid template: must have event and render function');
  }
  
  templates.set(template.event, template);
  log.info('Template registered', { event: template.event });
};

/**
 * Get adapter by key
 * @param {string} key - Channel key
 * @returns {Object|null} Adapter or null if not found
 */
export const getAdapter = (key) => {
  return adapters.get(key) || null;
};

/**
 * Get all registered adapters
 * @returns {Array} Array of adapters
 */
export const getAllAdapters = () => {
  return Array.from(adapters.values());
};

/**
 * Get template by event
 * @param {string} event - Event name
 * @returns {Object|null} Template or null if not found
 */
export const getTemplate = (event) => {
  return templates.get(event) || null;
};

/**
 * Get enabled channels for a user based on preferences
 * @param {Object} userPrefs - User notification preferences
 * @param {string} category - Notification category
 * @returns {Array<string>} Array of enabled channel keys
 */
export const getEnabledChannels = (userPrefs, category) => {
  const enabled = [];
  
  if (!userPrefs) {
    // Default to in-app if no preferences
    return [CHANNELS.IN_APP];
  }
  
  // Check master toggles
  const masterEnabled = {
    [CHANNELS.IN_APP]: userPrefs.inAppEnabled !== false,
    [CHANNELS.EMAIL]: userPrefs.emailEnabled === true,
    [CHANNELS.SMS]: userPrefs.smsEnabled === true,
    [CHANNELS.PUSH]: userPrefs.pushEnabled === true
  };
  
  // Check category-specific matrix if present
  const matrix = userPrefs.matrix || {};
  const categoryConfig = matrix[category] || {};
  
  // For each channel, check if enabled (category-specific overrides master)
  Object.values(CHANNELS).forEach(channel => {
    const categoryEnabled = categoryConfig[channel] !== false;
    const masterChannelEnabled = masterEnabled[channel];
    
    if (categoryEnabled && masterChannelEnabled) {
      enabled.push(channel);
    }
  });
  
  // Always include in-app as fallback
  if (!enabled.includes(CHANNELS.IN_APP) && masterEnabled[CHANNELS.IN_APP]) {
    enabled.push(CHANNELS.IN_APP);
  }
  
  return enabled;
};

/**
 * Check if a channel is registered
 * @param {string} channel - Channel key
 * @returns {boolean}
 */
export const isChannelRegistered = (channel) => {
  return adapters.has(channel);
};

export default {
  registerAdapter,
  registerTemplate,
  getAdapter,
  getAllAdapters,
  getTemplate,
  getEnabledChannels,
  isChannelRegistered
};
