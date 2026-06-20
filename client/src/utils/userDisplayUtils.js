/**
 * User Display Utilities
 *
 * PURPOSE: Reusable functions for displaying user information consistently across the application
 * Handles different user data formats (GraphQL objects, legacy strings, user objects from arrays)
 */

import { getLocalizedUserName } from './localizedUserName.js';

function resolveUserObject(user, usersArray = []) {
  if (!user) return null;
  if (typeof user === 'object') return user;
  if (typeof user === 'number') {
    return usersArray?.find((u) => u.id === user || u.dbId === user) || null;
  }
  if (typeof user === 'string') {
    return usersArray?.find((u) => (u.uid || u.id) === user) || null;
  }
  return null;
}

/**
 * Get user display information with proper fallbacks
 * @param {Object|String|null} user - User data (GraphQL User object, string ID, or null)
 * @param {Array} usersArray - Optional array of user objects for fallback lookup
 * @param {string} [lang='en'] - Active UI language
 * @returns {Object} - { displayName: string, tooltip: string, fallback: string }
 */
export const getUserDisplayInfo = (user, usersArray = [], lang = 'en') => {
  if (!user) {
    return {
      displayName: '—',
      tooltip: 'No user information',
      fallback: '—'
    };
  }

  const resolved = resolveUserObject(user, usersArray);

  if (resolved) {
    const displayName = getLocalizedUserName(resolved, lang, 'Unknown User');
    const tooltip = resolved.email || displayName || resolved.id || 'No user details';
    return {
      displayName,
      tooltip,
      fallback: displayName
    };
  }

  if (typeof user === 'string') {
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

  return {
    displayName: 'Unknown',
    tooltip: 'Unknown user',
    fallback: 'Unknown'
  };
};

/**
 * Get user display props for rendering
 */
export const getUserDisplayProps = (user, usersArray = [], options = {}) => {
  const lang = options.lang || 'en';
  const { displayName, tooltip } = getUserDisplayInfo(user, usersArray, lang);

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
 */
export const getUserDisplayName = (user, usersArray = [], lang = 'en') => {
  const { displayName } = getUserDisplayInfo(user, usersArray, lang);
  return displayName;
};

/**
 * Get user tooltip only
 */
export const getUserTooltip = (user, usersArray = [], lang = 'en') => {
  const { tooltip } = getUserDisplayInfo(user, usersArray, lang);
  return tooltip;
};
