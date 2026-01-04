/**
 * Utility functions for role-based access control
 * Super admins bypass all role restrictions
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Check if a user has access to a specific screen
 * Super admins always have access
 * @param {string} screenId - The screen ID to check
 * @param {Object} userContext - User context from useAuth hook
 * @param {Object} roleScreens - Optional cached roleScreens config
 * @returns {Promise<boolean>} - Whether the user has access
 */
export const hasScreenAccess = async (
  screenId,
  userContext,
  roleScreens = null
) => {
  const { isSuperAdmin, role } = userContext;

  // Super admins bypass all restrictions
  if (isSuperAdmin) {
    return true;
  }

  // Load role screens if not provided
  let screens = roleScreens;
  if (!screens) {
    try {
      const docRef = doc(db, "config", "roleScreens");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        screens = snap.data();
      }
    } catch (error) {
      console.warn("Failed to load role screens:", error);
      return true; // Default to allowing access if we can't check
    }
  }

  if (!screens || !screens[role]) {
    return true; // Default to allowing access
  }

  return screens[role][screenId] === true;
};

/**
 * Check if a user has access to a specific screen (synchronous version using cached data)
 * Super admins always have access
 * @param {string} screenId - The screen ID to check
 * @param {Object} userContext - User context from useAuth hook
 * @param {Object} roleScreens - Cached roleScreens config
 * @returns {boolean} - Whether the user has access
 */
export const hasScreenAccessSync = (
  screenId,
  userContext,
  roleScreens = {}
) => {
  const { isSuperAdmin, role } = userContext;

  // Super admins bypass all restrictions
  if (isSuperAdmin) {
    return true;
  }

  if (!roleScreens || !roleScreens[role]) {
    return true; // Default to allowing access
  }

  return roleScreens[role][screenId] === true;
};
