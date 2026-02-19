/**
 * Penalty Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for penalty records. This is the database layer
 * and should NOT contain business logic. All business logic should be in the
 * corresponding business service layer.
 * 
 * USAGE:
 * Import these functions in business services or other db-services only.
 * Do NOT import directly in UI components - use business services instead.
 * 
 * ARCHITECTURE:
 * - CRUD operations for penalty records
 * - Query operations for reporting and analytics
 * - No business logic or validation (handled by business layer)
 * 
 * COLLECTION: 'penalties'
 * 
 * EXAMPLES:
 * ```javascript
 * // In business service:
 * import { createPenalty, getPenaltiesByStudent } from '@services/db/penaltyDbService';
 * 
 * const result = await createPenalty(penaltyData);
 * if (result.success) {
 *   // Handle success, send notifications, etc.
 * }
 * ```
 * 
 * @author Service Layer Architecture
 * @since v2.0.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

// Collection name
const COLLECTION = 'penalties';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new penalty record
 * @param {Object} penaltyData - Penalty data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createPenalty = async (penaltyData) => {
  try {
    const docRef = doc(collection(db, COLLECTION));
    const penaltyWithTimestamp = {
      ...penaltyData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(docRef, penaltyWithTimestamp);
    
    return {
      success: true,
      data: { id: docRef.id, ...penaltyWithTimestamp }
    };
  } catch (error) {
    logger.error('[PenaltyDbService] Error creating penalty:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get penalty by ID
 * @param {string} id - Penalty document ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getPenalty = withPerformanceMonitoring(
  memoize(async (id) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          success: true,
          data: { id: docSnap.id, ...docSnap.data() }
        };
      } else {
        return {
          success: false,
          error: 'Penalty not found'
        };
      }
    } catch (error) {
      logger.error('[PenaltyDbService] Error getting penalty:', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }),
  'getPenalty'
);

/**
 * Update penalty record
 * @param {string} id - Penalty document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updatePenalty = async (id, updateData) => {
  try {
    const docRef = doc(db, COLLECTION, id);
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
    logger.error('[PenaltyDbService] Error updating penalty:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete penalty record
 * @param {string} id - Penalty document ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deletePenalty = async (id) => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
    
    return {
      success: true
    };
  } catch (error) {
    logger.error('[PenaltyDbService] Error deleting penalty:', { error: error.message });
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
 * Get penalties by student ID
 * @param {string} studentId - Student user ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getPenaltiesByStudent = async (studentId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const penalties = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: penalties
    };
  } catch (error) {
    logger.error('[PenaltyDbService] Error getting penalties by student:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get penalties by class ID
 * @param {string} classId - Class document ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getPenaltiesByClass = async (classId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('classId', '==', classId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const penalties = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: penalties
    };
  } catch (error) {
    logger.error('[PenaltyDbService] Error getting penalties by class:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};
