/**
 * Feature Flag Wrapper Component
 * Conditionally renders children based on feature flags
 */

import React from 'react';
import { useFeatureFlags } from '@hooks/useFeatureFlags';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * FeatureFlagWrapper Component
 * 
 * Conditionally renders its children based on whether a feature is enabled for the current user
 * 
 * @param {Object} props
 * @param {string} props.featureId - Feature flag ID to check
 * @param {React.ReactNode} props.children - Children to render if feature is enabled
 * @param {React.ReactNode} props.fallback - Optional fallback to render if feature is disabled
 * @param {boolean} props.showFallback - Whether to show fallback when feature is disabled (default: false)
 * @param {Function} props.onFeatureCheck - Optional callback called with feature status
 * @returns {React.ReactNode} Rendered content or null
 */
export const FeatureFlagWrapper = ({ 
  featureId, 
  children, 
  fallback = null, 
  showFallback = false,
  onFeatureCheck = null 
}) => {
  const { isEnabled, loading } = useFeatureFlags();

  if (loading) {
    // You can customize loading state if needed
    return null;
  }

  const featureEnabled = isEnabled(featureId);

  // Call callback if provided
  if (onFeatureCheck && typeof onFeatureCheck === 'function') {
    onFeatureCheck(featureId, featureEnabled);
  }

  // Render children if feature is enabled
  if (featureEnabled) {
    return children;
  }

  // Render fallback if feature is disabled and showFallback is true
  if (showFallback && fallback) {
    return fallback;
  }

  // Return null if feature is disabled and no fallback should be shown
  return null;
};

/**
 * FeatureFlagDisabled Component
 * 
 * Renders children only when a feature is disabled
 * 
 * @param {Object} props
 * @param {string} props.featureId - Feature flag ID to check
 * @param {React.ReactNode} props.children - Children to render if feature is disabled
 * @returns {React.ReactNode} Rendered content or null
 */
export const FeatureFlagDisabled = ({ featureId, children }) => {
  const { isEnabled, loading } = useFeatureFlags();

  if (loading) {
    return null;
  }

  const featureEnabled = isEnabled(featureId);

  // Render children only if feature is disabled
  return !featureEnabled ? children : null;
};

/**
 * MultiFeatureWrapper Component
 * 
 * Renders children only if ALL specified features are enabled
 * 
 * @param {Object} props
 * @param {string[]} props.featureIds - Array of feature flag IDs to check
 * @param {'all'|'any'} props.requirement - Whether all or any features must be enabled (default: 'all')
 * @param {React.ReactNode} props.children - Children to render if requirements are met
 * @param {React.ReactNode} props.fallback - Optional fallback to render if requirements are not met
 * @returns {React.ReactNode} Rendered content or null
 */
export const MultiFeatureWrapper = ({ 
  featureIds, 
  requirement = 'all', 
  children, 
  fallback = null 
}) => {
  const { isEnabled, loading } = useFeatureFlags();

  if (loading) {
    return null;
  }

  if (!Array.isArray(featureIds) || featureIds.length === 0) {
    warn('MultiFeatureWrapper: featureIds must be a non-empty array');
    return children;
  }

  const featureStatuses = featureIds.map(id => ({
    id, enabled: isEnabled(id)
  }));

  let shouldRender = false;

  if (requirement === 'any') {
    // Render if ANY feature is enabled
    shouldRender = featureStatuses.some(status => status.enabled);
  } else {
    // Render if ALL features are enabled (default)
    shouldRender = featureStatuses.every(status => status.enabled);
  }

  return shouldRender ? children : fallback;
};

export default FeatureFlagWrapper;
