/**
 * User Display Utilities
 * 
 * PURPOSE: Reusable functions for displaying user information consistently across the application
 * Handles different user data formats (GraphQL objects, legacy strings, user objects from arrays)
 */

/**
 * Get user display information with proper fallbacks
 * @param {Object|String|null} user - User data (GraphQL User object, string ID, or null)
 * @param {Array} usersArray - Optional array of user objects for fallback lookup
 * @returns {Object} - { displayName: string, tooltip: string, fallback: string }
 */
export const getUserDisplayInfo = (user, usersArray = []) => {
  // Handle null/undefined
  if (!user) {
    return {
      displayName: '—',
      tooltip: 'No user information',
      fallback: '—'
    };
  }

  // Handle GraphQL User object (preferred format)
  if (typeof user === 'object' && user.displayName) {
    const displayName = user.displayName || user.email || user.id || 'Unknown User';
    const tooltip = user.email || user.displayName || user.id || 'No user details';
    return {
      displayName,
      tooltip,
      fallback: displayName
    };
  }

  // Handle string ID (legacy format) - try to find in users array
  if (typeof user === 'string') {
    const foundUser = usersArray?.find(u => (u.uid || u.id) === user);
    
    if (foundUser) {
      const displayName = foundUser.displayName || foundUser.name || foundUser.email || user;
      const tooltip = foundUser.email || foundUser.displayName || foundUser.name || user;
      return {
        displayName,
        tooltip,
        fallback: displayName
      };
    }

    // Fallback for string ID without user object
    if (user.length > 20) {
      const truncated = `${user.substring(0, 8)}...${user.substring(user.length - 4)}`;
      return {
        displayName: truncated,
        tooltip: user,
        fallback: user
      };
    }

    return {
      displayName: user,
      tooltip: user,
      fallback: user
    };
  }

  // Handle other object formats (legacy user objects)
  if (typeof user === 'object') {
    const displayName = user.displayName || user.name || user.email || user.id || 'Unknown User';
    const tooltip = user.email || user.displayName || user.name || user.id || 'No user details';
    return {
      displayName,
      tooltip,
      fallback: displayName
    };
  }

  // Ultimate fallback
  return {
    displayName: 'Unknown',
    tooltip: 'Unknown user',
    fallback: 'Unknown'
  };
};

/**
 * Get user display props for rendering
 * @param {Object|String|null} user - User data
 * @param {Array} usersArray - Optional array of user objects for fallback lookup
 * @param {Object} options - Additional options
 * @returns {Object} - Props object for span element
 */
export const getUserDisplayProps = (user, usersArray = [], options = {}) => {
  const { displayName, tooltip } = getUserDisplayInfo(user, usersArray);
  
  const defaultStyle = {
    fontFamily: 'monospace',
    fontSize: '12px',
    ...options.style
  };

  return {
    children: displayName,
    title: tooltip,
    style: defaultStyle,
    className: options.className
  };
};

/**
 * Get user display name only (for non-React contexts)
 * @param {Object|String|null} user - User data
 * @param {Array} usersArray - Optional array of user objects for fallback lookup
 * @returns {string} - Display name
 */
export const getUserDisplayName = (user, usersArray = []) => {
  const { displayName } = getUserDisplayInfo(user, usersArray);
  return displayName;
};

/**
 * Get user tooltip only
 * @param {Object|String|null} user - User data
 * @param {Array} usersArray - Optional array of user objects for fallback lookup
 * @returns {string} - Tooltip text
 */
export const getUserTooltip = (user, usersArray = []) => {
  const { tooltip } = getUserDisplayInfo(user, usersArray);
  return tooltip;
};
