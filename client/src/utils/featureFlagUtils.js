/**
 * Feature Flag Utilities
 * Helper functions for managing and debugging feature flags
 */

import { FEATURE_FLAGS } from '@constants/featureFlags';
import { ROLE_STRINGS } from '@utils/userUtils';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Get all feature flags organized by category
 * @returns {Object} Feature flags grouped by category
 */
export const getFeatureFlagsByCategory = () => {
  const categorized = {};
  
  Object.values(FEATURE_FLAGS).forEach(feature => {
    if (!categorized[feature.category]) {
      categorized[feature.category] = [];
    }
    categorized[feature.category].push(feature);
  });
  
  return categorized;
};

/**
 * Get all features enabled for a specific role
 * @param {string} role - User role
 * @returns {Array} Array of enabled feature objects
 */
export const getEnabledFeaturesForRole = (role) => {
  return Object.values(FEATURE_FLAGS).filter(feature => {
    if (!feature.enabledForRoles || feature.enabledForRoles.length === 0) {
      return feature.defaultValue;
    }
    return feature.enabledForRoles.includes(role);
  });
};

/**
 * Get all features disabled for a specific role
 * @param {string} role - User role
 * @returns {Array} Array of disabled feature objects
 */
export const getDisabledFeaturesForRole = (role) => {
  return Object.values(FEATURE_FLAGS).filter(feature => {
    if (!feature.enabledForRoles || feature.enabledForRoles.length === 0) {
      return !feature.defaultValue;
    }
    return !feature.enabledForRoles.includes(role);
  });
};

/**
 * Generate a feature flag report for all roles
 * @returns {Object} Report showing which features are enabled for each role
 */
export const generateFeatureFlagReport = () => {
  const report = {};
  
  Object.values(ROLE_STRINGS).forEach(role => {
    report[role] = {
      enabled: getEnabledFeaturesForRole(role).map(f => f.id),
      disabled: getDisabledFeaturesForRole(role).map(f => f.id),
      total: {
        enabled: getEnabledFeaturesForRole(role).length,
        disabled: getDisabledFeaturesForRole(role).length
      }
    };
  });
  
  return report;
};

/**
 * Validate feature flag configuration
 * @returns {Array} Array of validation errors
 */
export const validateFeatureFlags = () => {
  const errors = [];
  
  Object.values(FEATURE_FLAGS).forEach((feature, index) => {
    // Check required fields
    if (!feature.id) {
      errors.push(`Feature ${index}: Missing id`);
    }
    
    if (!feature.name) {
      errors.push(`Feature ${feature.id || index}: Missing name`);
    }
    
    if (!feature.category) {
      errors.push(`Feature ${feature.id}: Missing category`);
    }
    
    // Check if enabledForRoles is valid
    if (feature.enabledForRoles && !Array.isArray(feature.enabledForRoles)) {
      errors.push(`Feature ${feature.id}: enabledForRoles must be an array`);
    }
    
    // Check if roles are valid
    if (feature.enabledForRoles && Array.isArray(feature.enabledForRoles)) {
      feature.enabledForRoles.forEach(role => {
        if (!Object.values(ROLE_STRINGS).includes(role)) {
          errors.push(`Feature ${feature.id}: Invalid role '${role}'`);
        }
      });
    }
  });
  
  return errors;
};

/**
 * Enable a feature for specific roles (for dynamic configuration)
 * @param {string} featureId - Feature ID
 * @param {Array} roles - Array of roles to enable for
 * @returns {boolean} Success status
 */
export const enableFeatureForRoles = (featureId, roles) => {
  if (!FEATURE_FLAGS[featureId]) {
    error(`Feature flag not found: ${featureId}`);
    return false;
  }
  
  if (!Array.isArray(roles)) {
    console.error('Roles must be an array');
    return false;
  }
  
  // Validate roles
  const validRoles = roles.filter(role => Object.values(ROLE_STRINGS).includes(role));
  if (validRoles.length !== roles.length) {
    console.error('Invalid roles provided:', roles.filter(r => !validRoles.includes(r)));
    return false;
  }
  
  // Update the feature flag (in a real app, this would persist to backend)
  FEATURE_FLAGS[featureId].enabledForRoles = validRoles;
  
  info(`Feature ${featureId} enabled for roles:`, validRoles);
  return true;
};

/**
 * Disable a feature for all roles
 * @param {string} featureId - Feature ID
 * @returns {boolean} Success status
 */
export const disableFeatureForAllRoles = (featureId) => {
  if (!FEATURE_FLAGS[featureId]) {
    error(`Feature flag not found: ${featureId}`);
    return false;
  }
  
  FEATURE_FLAGS[featureId].enabledForRoles = [];
  info(`Feature ${featureId} disabled for all roles`);
  return true;
};

/**
 * Get feature flag statistics
 * @returns {Object} Statistics about feature flags
 */
export const getFeatureFlagStatistics = () => {
  const totalFeatures = Object.keys(FEATURE_FLAGS).length;
  const categories = [...new Set(Object.values(FEATURE_FLAGS).map(f => f.category))];
  
  const roleStats = {};
  Object.values(ROLE_STRINGS).forEach(role => {
    roleStats[role] = {
      enabled: getEnabledFeaturesForRole(role).length, disabled: getDisabledFeaturesForRole(role);.length
    };
  });
  
  return {
    totalFeatures,
    categories: categories.length,
    categoryList: categories,
    roleStats
  };
};

/**
 * Debug function to log current feature flag state
 */
export const debugFeatureFlags = () => {
  console.group('🚩 Feature Flags Debug Information');
  
  info('Total Features:', Object.keys(FEATURE_FLAGS).length);
  info('Categories:', getFeatureFlagsByCategory());
  info('Validation Errors:', validateFeatureFlags());
  info('Statistics:', getFeatureFlagStatistics());
  info('Role Report:', generateFeatureFlagReport());
  
  console.groupEnd();
};

// Export for easy access in browser console during development
if (typeof window !== 'undefined') {
  window.featureFlagUtils = {
    debug: debugFeatureFlags,
    report: generateFeatureFlagReport,
    validate: validateFeatureFlags,
    stats: getFeatureFlagStatistics
  };
}

export default {
  getFeatureFlagsByCategory,
  getEnabledFeaturesForRole,
  getDisabledFeaturesForRole,
  generateFeatureFlagReport,
  validateFeatureFlags,
  enableFeatureForRoles,
  disableFeatureForAllRoles,
  getFeatureFlagStatistics,
  debugFeatureFlags
};
