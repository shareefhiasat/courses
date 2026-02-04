/**
 * User Role Management Utility
 * 
 * This script helps set user roles in Firebase for development.
 * Run this in the browser console when logged in as the user you want to modify.
 */

import { db } from '@firebaseServices/config';
import { auth } from '@firebaseServices/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { USER_ROLES } from '@constants/userRoles';

/**
 * Set user role in Firebase
 * @param {string} userId - User ID (Firebase auth UID)
 * @param {string} role - Role from USER_ROLES
 * @param {Object} additionalRoles - Additional role flags
 */
export async function setUserRole(userId, role, additionalRoles = {}) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error('❌ User document does not exist for:', userId);
      return { success: false, error: 'User document not found' };
    }
    
    const currentData = userDoc.data();
    console.log('🔧 Current user data:', currentData);
    
    // Update user document with role information
    const updatedData = {
      ...currentData,
      role: role,
      // Set role flags for backward compatibility
      isAdmin: role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN,
      isSuperAdmin: role === USER_ROLES.SUPER_ADMIN,
      isHR: role === USER_ROLES.HR,
      isInstructor: role === USER_ROLES.INSTRUCTOR,
      isStudent: role === USER_ROLES.STUDENT,
      // Override with any additional role flags
      ...additionalRoles,
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(userDocRef, updatedData, { merge: true });
    
    console.log('✅ User role updated successfully:', updatedData);
    return { success: true, data: updatedData };
    
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Make current user a super admin
 */
export async function makeCurrentUserSuperAdmin() {
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ No user logged in');
    return { success: false, error: 'No user logged in' };
  }
  
  console.log('🔧 Making current user super admin:', user.uid);
  return await setUserRole(user.uid, USER_ROLES.SUPER_ADMIN);
}

/**
 * Make current user an instructor
 */
export async function makeCurrentUserInstructor() {
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ No user logged in');
    return { success: false, error: 'No user logged in' };
  }
  
  console.log('🔧 Making current user instructor:', user.uid);
  return await setUserRole(user.uid, USER_ROLES.INSTRUCTOR);
}

/**
 * Make current user both super admin AND instructor
 */
export async function makeCurrentUserSuperAdminAndInstructor() {
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ No user logged in');
    return { success: false, error: 'No user logged in' };
  }
  
  console.log('🔧 Making current user super admin AND instructor:', user.uid);
  return await setUserRole(user.uid, USER_ROLES.SUPER_ADMIN, {
    isInstructor: true  // Additional flag for instructor
  });
}

/**
 * Check current user's role
 */
export async function checkCurrentUserRole() {
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ No user logged in');
    return { success: false, error: 'No user logged in' };
  }
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error('❌ User document does not exist');
      return { success: false, error: 'User document not found' };
    }
    
    const userData = userDoc.data();
    console.log('🔧 Current user role data:', {
      uid: user.uid,
      email: user.email,
      role: userData.role,
      isAdmin: userData.isAdmin,
      isSuperAdmin: userData.isSuperAdmin,
      isHR: userData.isHR,
      isInstructor: userData.isInstructor,
      isStudent: userData.isStudent
    });
    
    return { success: true, data: userData };
    
  } catch (error) {
    console.error('❌ Error checking user role:', error);
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
  
  console.log('🔧 User role utilities available in window.userRoleUtils');
  console.log('🔧 Usage:');
  console.log('  window.userRoleUtils.checkCurrentUserRole()');
  console.log('  window.userRoleUtils.makeCurrentUserSuperAdmin()');
  console.log('  window.userRoleUtils.makeCurrentUserInstructor()');
  console.log('  window.userRoleUtils.makeCurrentUserSuperAdminAndInstructor()');
}
