/**
 * Reusable User Service for createdBy/updatedBy tracking
 * Used across all database services for consistent user attribution
 */

/**
 * Extract user display information from user object
 * @param {Object} user - User object from context
 * @returns {string} - Display name for user attribution
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'System';
  
  // Priority order for user display
  return user.displayName || 
         user.name || 
         user.preferred_username || 
         user.email || 
         'System';
};

/**
 * Add user tracking fields to data object
 * @param {Object} data - Data object to enhance
 * @param {Object} user - User object from context
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Enhanced data object with user tracking
 */
export const addUserTracking = (data, user, isUpdate = false) => {
  const displayName = getUserDisplayName(user);
  
  if (isUpdate) {
    return {
      ...data,
      updatedBy: displayName
    };
  } else {
    return {
      ...data,
      createdBy: displayName,
      updatedBy: displayName // Set both for new records
    };
  }
};

/**
 * Standard user tracking fields for database schemas
 */
export const USER_TRACKING_FIELDS = {
  createdBy: {
    type: 'String',
    description: 'User who created this record'
  },
  updatedBy: {
    type: 'String', 
    description: 'User who last updated this record'
  }
};

/**
 * Standard user tracking fields for GraphQL schemas
 */
export const USER_TRACKING_GQL_FIELDS = `
  createdBy: String
  updatedBy: String
`;
