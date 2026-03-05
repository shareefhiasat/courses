/**
 * Feature Flags Configuration System
 * Controls visibility of UI elements based on user roles
 */

import { ROLE_STRINGS } from '@utils/userUtils';

// ===== FEATURE FLAGS CONFIGURATION =====

export const FEATURE_FLAGS = {
  // QR Scanner Features
  QR_SCANNER_ACCESS: {
    id: 'QR_SCANNER_ACCESS',
    name: 'QR Scanner Access',
    description: 'Controls visibility of the entire QR Scanner component',
    category: 'qr_scanner',
    enabledForRoles: [ROLE_STRINGS.INSTRUCTOR, ROLE_STRINGS.ADMIN, ROLE_STRINGS.HR, ROLE_STRINGS.SUPER_ADMIN], // All roles except Student
    defaultValue: true,
    version: '1.0.0'
  },

  // Add more feature flags here as needed
  BULK_SCAN_DIALOG: {
    id: 'BULK_SCAN_DIALOG',
    name: 'Bulk Scan Dialog',
    description: 'Enables bulk scanning functionality',
    category: 'qr_scanner',
    enabledForRoles: [ROLE_STRINGS.INSTRUCTOR, ROLE_STRINGS.ADMIN, ROLE_STRINGS.HR, ROLE_STRINGS.SUPER_ADMIN],
    defaultValue: true,
    version: '1.0.0'
  },

  ADVANCED_ANALYTICS: {
    id: 'ADVANCED_ANALYTICS',
    name: 'Advanced Analytics Dashboard',
    description: 'Shows advanced analytics and reporting features',
    category: 'analytics',
    enabledForRoles: [ROLE_STRINGS.ADMIN, ROLE_STRINGS.SUPER_ADMIN],
    defaultValue: false,
    version: '1.0.0'
  },

  STUDENT_ACTION_PANELS: {
    id: 'STUDENT_ACTION_PANELS',
    name: 'Student Action Panels',
    description: 'Shows behavior, participation, and penalty action panels',
    category: 'qr_scanner',
    enabledForRoles: [ROLE_STRINGS.INSTRUCTOR, ROLE_STRINGS.ADMIN, ROLE_STRINGS.HR, ROLE_STRINGS.SUPER_ADMIN],
    defaultValue: true,
    version: '1.0.0'
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Check if a feature is enabled for a specific role
 * @param {string} featureId - Feature flag ID
 * @param {string} userRole - User role
 * @returns {boolean} Whether the feature is enabled for the role
 */
export const isFeatureEnabledForRole = (featureId, userRole) => {
  const feature = FEATURE_FLAGS[featureId];
  
  if (!feature) {
    console.warn(`Feature flag not found: ${featureId}`);
    return false;
  }

  // If no roles are specified, use default value
  if (!feature.enabledForRoles || feature.enabledForRoles.length === 0) {
    return feature.defaultValue;
  }

  // Check if user's role is in the enabled roles list
  return feature.enabledForRoles.includes(userRole);
};

/**
 * Check if a feature is enabled for the current user
 * @param {string} featureId - Feature flag ID
 * @param {Object} user - User object with role property
 * @returns {boolean} Whether the feature is enabled for the user
 */
export const isFeatureEnabledForUser = (featureId, user) => {
  if (!user || !user.role) {
    return false;
  }

  return isFeatureEnabledForRole(featureId, user.role);
};

/**
 * Get all features enabled for a specific role
 * @param {string} userRole - User role
 * @returns {Array} Array of enabled feature objects
 */
export const getEnabledFeaturesForRole = (userRole) => {
  return Object.values(FEATURE_FLAGS).filter(feature => 
    isFeatureEnabledForRole(feature.id, userRole)
  );
};

/**
 * Get features by category
 * @param {string} category - Feature category
 * @returns {Array} Array of feature objects in the category
 */
export const getFeaturesByCategory = (category) => {
  return Object.values(FEATURE_FLAGS).filter(feature => 
    feature.category === category
  );
};

/**
 * Check if a feature exists
 * @param {string} featureId - Feature flag ID
 * @returns {boolean} Whether the feature exists
 */
export const featureExists = (featureId) => {
  return FEATURE_FLAGS.hasOwnProperty(featureId);
};

/**
 * Get feature information
 * @param {string} featureId - Feature flag ID
 * @returns {Object|null} Feature object or null if not found
 */
export const getFeatureInfo = (featureId) => {
  return FEATURE_FLAGS[featureId] || null;
};

// ===== HOOK FOR REACT COMPONENTS =====

/**
 * Custom hook to check feature flags in React components
 * @param {string} featureId - Feature flag ID
 * @returns {boolean} Whether the feature is enabled for current user
 */
export const useFeatureFlag = (featureId) => {
  // This would typically use useAuth hook, but to keep it simple
  // we'll return a function that expects the user object
  return (user) => isFeatureEnabledForUser(featureId, user);
};

// Export all feature flags for reference
export default FEATURE_FLAGS;
