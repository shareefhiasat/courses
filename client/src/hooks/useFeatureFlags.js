/**
 * Feature Flags Hook
 * Integrates with Auth context to provide easy feature flag checking in React components
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';

import { info, error, warn, debug } from '@services/utils/logger.js';import { 
  isFeatureEnabledForUser, 
  isFeatureEnabledForRole,
  getEnabledFeaturesForRole,
  getFeaturesByCategory,
  featureExists,
  getFeatureInfo
} from '@constants/featureFlags';

/**
 * useFeatureFlags Hook
 * 
 * Provides feature flag checking functionality integrated with the current user's authentication state
 * 
 * @returns {Object} Feature flag utilities
 */
export const useFeatureFlags = () => {
  const { user, role, loading: authLoading } = useAuth();

  /**
   * Check if a specific feature is enabled for the current user
   * @param {string} featureId - Feature flag ID
   * @returns {boolean} Whether the feature is enabled
   */
  const isEnabled = useCallback((featureId) => {
    if (authLoading || !user) {
      return false;
    }

    // Create a user object with role property for the feature flag system
    const userWithRole = {
      ...user,
      role: role
    };

    return isFeatureEnabledForUser(featureId, userWithRole);
  }, [user, role, authLoading]);

  /**
   * Check if a feature is enabled for a specific role (useful for testing/admin)
   * @param {string} featureId - Feature flag ID
   * @param {string} targetRole - Role to check against
   * @returns {boolean} Whether the feature is enabled for the role
   */
  const isEnabledForRole = useCallback((featureId, targetRole) => {
    return isFeatureEnabledForRole(featureId, targetRole);
  }, []);

  /**
   * Get all features enabled for the current user's role
   * @returns {Array} Array of enabled feature objects
   */
  const getEnabledFeatures = useCallback(() => {
    if (!role) {
      return [];
    }

    return getEnabledFeaturesForRole(role);
  }, [role]);

  /**
   * Get features by category
   * @param {string} category - Feature category
   * @returns {Array} Array of feature objects in the category
   */
  const getCategoryFeatures = useCallback((category) => {
    return getFeaturesByCategory(category);
  }, []);

  /**
   * Check if a feature flag exists
   * @param {string} featureId - Feature flag ID
   * @returns {boolean} Whether the feature exists
   */
  const hasFeature = useCallback((featureId) => {
    return featureExists(featureId);
  }, []);

  /**
   * Get feature information
   * @param {string} featureId - Feature flag ID
   * @returns {Object|null} Feature object or null if not found
   */
  const getFeature = useCallback((featureId) => {
    return getFeatureInfo(featureId);
  }, []);

  // Memoize the enabled features for the current user
  const enabledFeatures = useMemo(() => {
    return getEnabledFeatures();
  }, [getEnabledFeatures]);

  return {
    // Core checking functions
    isEnabled,
    isEnabledForRole,
    
    // Discovery functions
    getEnabledFeatures,
    getCategoryFeatures,
    enabledFeatures,
    
    // Utility functions
    hasFeature,
    getFeature,
    
    // State
    loading: authLoading,
    user,
    role
  };
};

export default useFeatureFlags;
