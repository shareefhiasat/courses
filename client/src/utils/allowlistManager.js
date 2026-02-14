/**
 * Firebase Allowlist Management Utility
 * 
 * This utility helps manage the Firebase allowlist for admin permissions
 * since the security rules depend on either custom claims or allowlist.
 */

import { db } from '@services/other/config';
import { auth } from '@services/other/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Get current allowlist configuration
 */
export async function getAllowlistConfig() {
  try {
    const allowlistRef = doc(db, 'config', 'allowlist');
    const allowlistSnap = await getDoc(allowlistRef);
    
    if (allowlistSnap.exists()) {
      return { success: true, data: allowlistSnap.data() };
    } else {
      // Create default allowlist if it doesn't exist
      const defaultAllowlist = {
        adminEmails: [],
        enabled: true,
        requireApproval: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(allowlistRef, defaultAllowlist);
      return { success: true, data: defaultAllowlist };
    }
  } catch (error) {
    logger.error('Error getting allowlist:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add email to admin allowlist
 * @param {string} email - Email to add to admin allowlist
 */
export async function addToAdminAllowlist(email) {
  try {
    const allowlistResult = await getAllowlistConfig();
    if (!allowlistResult.success) {
      return allowlistResult;
    }
    
    const allowlistData = allowlistResult.data;
    const adminEmails = allowlistData.adminEmails || [];
    
    // Check if email is already in allowlist
    if (adminEmails.includes(email)) {
      logger.log('🔧 Email already in admin allowlist:', email);
      return { success: true, message: 'Email already in allowlist' };
    }
    
    // Add email to allowlist
    const updatedEmails = [...adminEmails, email];
    
    const allowlistRef = doc(db, 'config', 'allowlist');
    await updateDoc(allowlistRef, {
      adminEmails: updatedEmails,
      updatedAt: new Date().toISOString()
    });
    
    logger.log('✅ Added email to admin allowlist:', email);
    return { success: true, message: 'Email added to admin allowlist' };
    
  } catch (error) {
    logger.error('Error adding email to allowlist:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove email from admin allowlist
 * @param {string} email - Email to remove from admin allowlist
 */
export async function removeFromAdminAllowlist(email) {
  try {
    const allowlistResult = await getAllowlistConfig();
    if (!allowlistResult.success) {
      return allowlistResult;
    }
    
    const allowlistData = allowlistResult.data;
    const adminEmails = allowlistData.adminEmails || [];
    
    // Remove email from allowlist
    const updatedEmails = adminEmails.filter(e => e !== email);
    
    const allowlistRef = doc(db, 'config', 'allowlist');
    await updateDoc(allowlistRef, {
      adminEmails: updatedEmails,
      updatedAt: new Date().toISOString()
    });
    
    logger.log('✅ Removed email from admin allowlist:', email);
    return { success: true, message: 'Email removed from admin allowlist' };
    
  } catch (error) {
    logger.error('Error removing email from allowlist:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add current user to admin allowlist
 */
export async function addCurrentUserToAllowlist() {
  const user = auth.currentUser;
  
  if (!user) {
    logger.error('❌ No user logged in');
    return { success: false, error: 'No user logged in' };
  }
  
  logger.log('🔧 Adding current user to admin allowlist:', user.email);
  return await addToAdminAllowlist(user.email);
}

/**
 * Check if email is in admin allowlist
 * @param {string} email - Email to check
 */
export async function isEmailInAllowlist(email) {
  try {
    const allowlistResult = await getAllowlistConfig();
    if (!allowlistResult.success) {
      return false;
    }
    
    const adminEmails = allowlistResult.data.adminEmails || [];
    return adminEmails.includes(email);
    
  } catch (error) {
    logger.error('Error checking allowlist:', error);
    return false;
  }
}

// Console helper functions for easy debugging
if (typeof window !== 'undefined') {
  window.allowlistUtils = {
    getAllowlistConfig,
    addToAdminAllowlist,
    removeFromAdminAllowlist,
    addCurrentUserToAllowlist,
    isEmailInAllowlist
  };
  
  // logger.log('🔧 Allowlist utilities available in window.allowlistUtils');
  // logger.log('🔧 Usage:');
  // logger.log('  window.allowlistUtils.getAllowlistConfig()');
  // logger.log('  window.allowlistUtils.addCurrentUserToAllowlist()');
  // logger.log('  window.allowlistUtils.addToAdminAllowlist("email@example.com")');
  // logger.log('  window.allowlistUtils.isEmailInAllowlist("email@example.com")');
}

