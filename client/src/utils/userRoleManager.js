/**
 * User Role Management Utility
 * 
 * This script helps set user roles in Firebase for development.
 * Run this in the browser console when logged in as the user you want to modify.
 */

import { db } from '@services/other/config';
import { auth } from '@services/other/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '@services/other/activityLogger';

/**
 * Set user role flags in Firebase
 * @param {string} userId - User ID (Firebase auth UID)
 * @param {Object} roleFlags - Boolean role flags (isAdmin, isSuperAdmin, isHR, isInstructor, isStudent)
 * @param {Object} additionalData - Additional user data to update
 */
export async function setUserRole(userId, roleFlags = {}, additionalData = {}) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      logger.error('❌ User document does not exist for:', userId);
      return { success: false, error: 'User document not found' };
    }
    
    const currentData = userDoc.data();
    logger.log('🔧 Current user data:', currentData);
    
    // Update user document with role flag information
    const updatedData = {
      ...currentData,
      // Set role flags
      isAdmin: Boolean(roleFlags.isAdmin),
      isSuperAdmin: Boolean(roleFlags.isSuperAdmin),
      isHR: Boolean(roleFlags.isHR),
      isInstructor: Boolean(roleFlags.isInstructor),
      isStudent: Boolean(roleFlags.isStudent),
      // Remove old role field
      role: null,
      // Override with any additional data
      ...additionalData,
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(userDocRef, updatedData, { merge: true });
    
    // Log role change activity
    try {
      const changedRoles = [];
      if (currentData.isAdmin !== updatedData.isAdmin) changedRoles.push('isAdmin');
      if (currentData.isSuperAdmin !== updatedData.isSuperAdmin) changedRoles.push('isSuperAdmin');
      if (currentData.isHR !== updatedData.isHR) changedRoles.push('isHR');
      if (currentData.isInstructor !== updatedData.isInstructor) changedRoles.push('isInstructor');
      if (currentData.isStudent !== updatedData.isStudent) changedRoles.push('isStudent');
      
      if (changedRoles.length > 0) {
        await logActivity(ACTIVITY_LOG_TYPES.ROLE_CHANGE, {
          userId: userId,
          changedRoles: changedRoles,
          oldRoles: {
            isAdmin: currentData.isAdmin,
            isSuperAdmin: currentData.isSuperAdmin,
            isHR: currentData.isHR,
            isInstructor: currentData.isInstructor,
            isStudent: currentData.isStudent
          },
          newRoles: {
            isAdmin: updatedData.isAdmin,
            isSuperAdmin: updatedData.isSuperAdmin,
            isHR: updatedData.isHR,
            isInstructor: updatedData.isInstructor,
            isStudent: updatedData.isStudent
          }
        });
      }
    } catch (logError) {
      logger.warn('Failed to log role change activity:', logError);
    }
    
    logger.log('✅ User role flags updated successfully:', updatedData);
    return { success: true, data: updatedData };
    
  } catch (error) {
    logger.error('❌ Error updating user role flags:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Make current user a super admin
 */
export async function makeCurrentUserSuperAdmin() {
  const user = auth.currentUser;
  
  if (!user) {
    logger.error('❌ No user logged in');
    return { success: false, error: 'No user logged in' };
  }
  
  logger.log('🔧 Making current user super admin:', user.uid);
  return await setUserRole(user.uid, {
    isSuperAdmin: true,
    isAdmin: true
  });
}

/**
 * Make current user an instructor
 */
export async function makeCurrentUserInstructor() {
  const user = auth.currentUser;
  
  if (!user) {
    logger.error('❌ No user logged in');
    return { success: false, error: 'No user logged in' };
  }
  
  logger.log('🔧 Making current user instructor:', user.uid);
  return await setUserRole(user.uid, {
    isInstructor: true
  });
}

/**
 * Make current user both super admin AND instructor
 */
export async function makeCurrentUserSuperAdminAndInstructor() {
  const user = auth.currentUser;
  
  if (!user) {
    logger.error('❌ No user logged in');
    return { success: false, error: 'No user logged in' };
  }
  
  logger.log('🔧 Making current user super admin AND instructor:', user.uid);
  return await setUserRole(user.uid, {
    isSuperAdmin: true,
    isAdmin: true,
    isInstructor: true
  });
}

/**
 * Check current user's role
 */
export async function checkCurrentUserRole() {
  const user = auth.currentUser;
  
  if (!user) {
    logger.error('❌ No user logged in');
    return { success: false, error: 'No user logged in' };
  }
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      logger.error('❌ User document does not exist');
      return { success: false, error: 'User document not found' };
    }
    
    const userData = userDoc.data();
    logger.log('🔧 Current user role flags:', {
      uid: user.uid,
      email: user.email,
      isAdmin: userData.isAdmin,
      isSuperAdmin: userData.isSuperAdmin,
      isHR: userData.isHR,
      isInstructor: userData.isInstructor,
      isStudent: userData.isStudent
    });
    
    return { success: true, data: userData };
    
  } catch (error) {
    logger.error('❌ Error checking user role:', error);
    return { success: false, error: error.message };
  }
}

// Console helper functions for easy debugging
if (typeof window !== 'undefined') {
  window.userRoleUtils = {
    setUserRole,
    makeCurrentUserSuperAdmin,
    makeCurrentUserInstructor,
    makeCurrentUserSuperAdminAndInstructor,
    checkCurrentUserRole
  };
  
  // logger.log('🔧 User role utilities available in window.userRoleUtils');
  // logger.log('🔧 Usage:');
  // logger.log('  window.userRoleUtils.checkCurrentUserRole()');
  // logger.log('  window.userRoleUtils.makeCurrentUserSuperAdmin()');
  // logger.log('  window.userRoleUtils.makeCurrentUserInstructor()');
  // logger.log('  window.userRoleUtils.makeCurrentUserSuperAdminAndInstructor()');
}

