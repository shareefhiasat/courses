/**
 * Behavior Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for behavior records. This is the database layer
 * and should NOT contain business logic. All business logic should be in the
 * corresponding business service layer.
 * 
 * USAGE:
 * Import these functions in business services or other db-services only.
 * Do NOT import directly in UI components - use business services instead.
 * 
 * ARCHITECTURE:
 * - CRUD operations for behavior records
 * - Query operations for reporting and analytics
 * - No business logic or validation (handled by business layer)
 * 
 * COLLECTION: 'behaviors'
 * 
 * EXAMPLES:
 * ```javascript
 * // In business service:
 * import { createBehavior, getBehaviorsByStudent } from '@services/db/behaviorDbService';
 * 
 * const result = await createBehavior(behaviorData);
 * if (result.success) {
 *   // Handle success, send notifications, etc.
 * }
 * ```
 * 
 * @author Service Layer Architecture
 * @since v2.0.0
 */

import { 
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  where
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

const COLLECTION = COLLECTIONS.BEHAVIOR;

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new behavior record
 * @param {Object} behaviorData - Behavior data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createBehavior = async (behaviorData) => {
  try {
    const docRef = doc(collection(dbService.getDb(), COLLECTION));
    const behaviorWithTimestamp = {
      ...behaviorData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(docRef, behaviorWithTimestamp);
    
    return {
      success: true,
      data: { id: docRef.id, ...behaviorWithTimestamp }
    };
  } catch (error) {
    logger.error('[BehaviorDbService] Error creating behavior:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get behavior by ID
 * @param {string} id - Behavior document ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getBehavior = async (id) => {
  try {
    const docRef = doc(dbService.getDb(), COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        data: { id: docSnap.id, ...docSnap.data() }
      };
    } else {
      return {
        success: false,
        error: 'Behavior not found'
      };
    }
  } catch (error) {
    logger.error('[BehaviorDbService] Error getting behavior:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update behavior record
 * @param {string} id - Behavior document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateBehavior = async (id, updateData) => {
  try {
    const docRef = doc(dbService.getDb(), COLLECTION, id);
    const updateWithTimestamp = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updateWithTimestamp);
    
    return {
      success: true,
      data: { id, ...updateWithTimestamp }
    };
  } catch (error) {
    logger.error('[BehaviorDbService] Error updating behavior:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete behavior record
 * @param {string} id - Behavior document ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteBehavior = async (id) => {
  try {
    const docRef = doc(dbService.getDb(), COLLECTION, id);
    await deleteDoc(docRef);
    
    return {
      success: true
    };
  } catch (error) {
    logger.error('[BehaviorDbService] Error deleting behavior:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Get behaviors by student ID
 * @param {string} studentId - Student user ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getBehaviorsByStudent = async (studentId) => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTION),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const behaviors = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: behaviors
    };
  } catch (error) {
    logger.error('[BehaviorDbService] Error getting behaviors by student:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all behaviors
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getBehaviors = async () => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const behaviors = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: behaviors
    };
  } catch (error) {
    // Check if this is a missing collection or permission error
    if (error.message.includes('Missing or insufficient permissions') || 
        error.code === 'permission-denied' ||
        error.message.includes('No document to update')) {
      // Silently return empty array for missing collections - this is expected in some setups
      return {
        success: true,
        data: []
      };
    }
    
    logger.error('[BehaviorDbService] Error getting behaviors:', { error: error.message, code: error.code });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get behaviors by class ID
 * @param {string} classId - Class document ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getBehaviorsByClass = async (classId) => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTION),
      where('classId', '==', classId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const behaviors = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: behaviors
    };
  } catch (error) {
    logger.error('[BehaviorDbService] Error getting behaviors by class:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get behaviors by class and date
 * @param {string} classId - Class document ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getBehaviorsByClassAndDate = async (classId, date) => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTION),
      where('classId', '==', classId),
      where('date', '==', date),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const behaviors = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: behaviors
    };
  } catch (error) {
    logger.error('[BehaviorDbService] Error getting behaviors by class and date:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};
