import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from './config';

/**
 * Centralized User Service - DRY Firebase user operations
 */

// Get user by ID (centralized)
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: error.message };
  }
};

// Get user by student number (centralized)
export const getUserByStudentNumber = async (studentNumber) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', studentNumber));
    if (userDoc.exists()) {
      return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
    }
    return { success: false, error: 'Student not found' };
  } catch (error) {
    console.error('Error fetching student by number:', error);
    return { success: false, error: error.message };
  }
};

// Check if user exists by ID
export const userExists = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

// Get user preferences (centralized)
export const getUserPreferences = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data().preferences || {} };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return { success: false, error: error.message };
  }
};

// Get users by role (centralized)
export const getUsersByRole = async (role) => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return { success: false, error: error.message };
  }
};

// Search users by display name or email (centralized)
export const searchUsers = async (searchTerm) => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = { id: doc.id, ...doc.data() };
      const searchLower = searchTerm.toLowerCase();
      if (
        userData.displayName?.toLowerCase().includes(searchLower) ||
        userData.email?.toLowerCase().includes(searchLower) ||
        userData.realName?.toLowerCase().includes(searchLower) ||
        userData.studentNumber?.toLowerCase().includes(searchLower)
      ) {
        users.push(userData);
      }
    });
    return { success: true, data: users };
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, error: error.message };
  }
};
