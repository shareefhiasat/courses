import { getUsers } from './firestore';

/**
 * Get current user's profile information from Firestore
 * @param {Object} user - Auth user object
 * @returns {Promise<Object|null>} User profile or null if not found
 */
export async function getUserProfile(user) {
  if (!user) return null;
  try {
    const usersResult = await getUsers();
    const userProfile = usersResult.data?.find(u => u.docId === user?.uid);
    return userProfile || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get user's display name with proper fallbacks
 * @param {Object} user - Auth user object
 * @returns {Promise<string>} Display name
 */
export async function getUserDisplayName(user) {
  const userProfile = await getUserProfile(user);
  return userProfile?.displayName || user?.displayName || user?.email || 'Instructor';
}

/**
 * Get user's email with proper fallbacks
 * @param {Object} user - Auth user object
 * @returns {Promise<string>} User email
 */
export async function getUserEmail(user) {
  const userProfile = await getUserProfile(user);
  return userProfile?.email || user?.email || '';
}

/**
 * Get performedBy fields for Firebase operations
 * @param {Object} user - Auth user object
 * @returns {Promise<Object>} { performedBy, performedByName, performedByEmail }
 */
export async function getPerformedByFields(user) {
  const userProfile = await getUserProfile(user);
  const performedByName = userProfile?.displayName || user?.displayName || user?.email || 'Instructor';
  const performedByEmail = userProfile?.email || user?.email || '';
  
  return {
    performedBy: user?.uid,
    performedByName,
    performedByEmail
  };
}
