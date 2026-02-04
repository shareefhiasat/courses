import { doc, getDoc, query, collection, where, getDocs, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';

// Prevent duplicate ensureUserDoc writes during React StrictMode re-mounts
const _ensureUserDocOnce = new Set();

/**
 * Centralized User Service - DRY Firebase user operations
 * This REPLACES the limited user.js file
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

// ===== LEGACY COMPATIBILITY FUNCTIONS (from user.js) =====

/**
 * Get current user's profile information from Firestore
 * @param {Object} user - Auth user object
 * @returns {Promise<Object|null>} User profile or null if not found
 */
export async function getUserProfile(user) {
  if (!user) return null;
  try {
    const userResult = await getUserById(user.uid);
    return userResult.success ? userResult.data : null;
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
 * Get performed by fields for audit logging
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

// ===== USER MANAGEMENT FUNCTIONS =====

// Ensure a deterministic users/{uid} doc exists
export const ensureUserDoc = async (uid, data = {}) => {
  if (!uid) return { success: false, error: "uid required" };
  if (_ensureUserDocOnce.has(uid)) return { success: true, skipped: true };
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    const base = {
      email: data.email || null,
      displayName: data.displayName || null,
      realName: data.realName || null,
      studentNumber: data.studentNumber || null,
      role: data.role || "student",
      createdAt: Timestamp.now(),
    };
    // If document exists, only merge the provided data fields
    // If document doesn't exist, use the base object with provided data
    const updateData = snap.exists() ? data : { ...base, ...data };
    await setDoc(ref, updateData, { merge: true });
    _ensureUserDocOnce.add(uid);
    return { success: true };
  } catch (error) {
    // Ignore permission-denied to avoid noisy console during restricted environments
    const code = error && (error.code || "").toString();
    if (code === "permission-denied") {
      console.warn("ensureUserDoc permission denied for uid:", uid);
      return { success: false, error: "permission-denied" };
    }
    return { success: false, error: error.message };
  }
};

// Get all users
export const getUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((d) => {
      users.push({ docId: d.id, ...d.data() });
    });
    return { success: true, data: users };
  } catch (error) {
    console.error("Error getting users:", error);
    return { success: false, error: error.message };
  }
};

// Get user by ID
export const getUser = async (uid) => {
  if (!uid) {
    return { success: false, error: "uid required" };
  }

  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { success: false, error: "user_not_found" };
    }

    return {
      success: true,
      data: {
        docId: uid,
        ...snap.data(),
      },
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return { success: false, error: error.message };
  }
};

// Add user function
export const addUser = async (userData) => {
  try {
    // Enforce deterministic ID: uid is required
    if (!userData?.uid) {
      return { success: false, error: "uid is required for addUser" };
    }
    const { uid, ...rest } = userData;
    await setDoc(
      doc(db, "users", uid),
      { ...rest, createdAt: Timestamp.now() },
      { merge: true }
    );
    return { success: true, id: uid };
  } catch (error) {
    console.error("Error adding user:", error);
    return { success: false, error: error.message };
  }
};

// Update user function
export const updateUser = async (id, userData) => {
  try {
    // Check if email is being changed
    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists() && userData.email && userData.email !== userSnap.data().email) {
      // Log email change activity
      try {
        const { ActivityLogger } = await import('./activityLogger');
        await ActivityLogger.emailChange();
      } catch (error) {
        console.warn('Failed to log email change activity:', error);
      }
    }
    
    await updateDoc(userRef, userData);
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message };
  }
};

// Delete user function
export const deleteUser = async (id) => {
  try {
    await deleteDoc(doc(db, "users", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
};

// Admin cascade delete for a user
export const deleteUserCascade = async (uid) => {
  try {
    if (!uid) return { success: false, error: "uid required" };
    const deletions = [];
    
    // notifications
    const nqs = await getDocs(
      query(collection(db, "notifications"), where("userId", "==", uid))
    );
    nqs.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "notifications", d.id)))
    );
    
    // enrollments
    const eqs = await getDocs(
      query(collection(db, "enrollments"), where("userId", "==", uid))
    );
    eqs.forEach((d) => deletions.push(deleteDoc(doc(db, "enrollments", d.id))));
    
    // submissions
    const sqs = await getDocs(
      query(collection(db, "submissions"), where("userId", "==", uid))
    );
    sqs.forEach((d) => deletions.push(deleteDoc(doc(db, "submissions", d.id))));
    
    // attendance records
    const attQuery = await getDocs(
      query(collection(db, "attendance"), where("studentId", "==", uid))
    );
    attQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "attendance", d.id)))
    );
    
    // quiz submissions
    const quizSubQuery = await getDocs(
      query(collection(db, "quizSubmissions"), where("userId", "==", uid))
    );
    quizSubQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "quizSubmissions", d.id)))
    );
    
    // quiz results
    const quizResQuery = await getDocs(
      query(collection(db, "quizResults"), where("userId", "==", uid))
    );
    quizResQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "quizResults", d.id)))
    );
    
    // marks/grades
    const marksQuery = await getDocs(
      query(collection(db, "studentMarks"), where("studentId", "==", uid))
    );
    marksQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "studentMarks", d.id)))
    );
    
    // messages (sent by user)
    const mqs = await getDocs(
      query(collection(db, "messages"), where("senderId", "==", uid))
    );
    mqs.forEach((d) => deletions.push(deleteDoc(doc(db, "messages", d.id))));
    
    // direct rooms containing user (delete room)
    const rqs = await getDocs(
      query(
        collection(db, "directRooms"),
        where("participants", "array-contains", uid)
      )
    );
    rqs.forEach((d) => deletions.push(deleteDoc(doc(db, "directRooms", d.id))));
    
    await Promise.allSettled(deletions);
    
    // finally delete users/{uid}
    await deleteDoc(doc(db, "users", uid));
    return { success: true };
  } catch (error) {
    console.error("Error deleting user cascade:", error);
    return { success: false, error: error.message };
  }
};
