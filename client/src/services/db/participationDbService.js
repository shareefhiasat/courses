/**
 * Participation Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for participation records. This is the database layer
 * and should NOT contain business logic. All business logic should be in the
 * corresponding business service layer.
 * 
 * USAGE:
 * Import these functions in business services or other db-services only.
 * Do NOT import directly in UI components - use business services instead.
 * 
 * ARCHITECTURE:
 * - CRUD operations for participation records
 * - Query operations for reporting and analytics
 * - Real-time listeners for live updates
 * - No business logic or validation (handled by business layer)
 * 
 * COLLECTION: 'participations'
 * 
 * EXAMPLES:
 * ```javascript
 * // In business service:
 * import { createParticipation, getParticipationsByStudent } from '@services/db/participationDbService';
 * 
 * const result = await createParticipation(participationData);
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
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

// Collection name
const COLLECTION = 'participations';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new participation record
 * @param {Object} participationData - Participation data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createParticipation = async (participationData) => {
  try {
    const docRef = doc(collection(db, COLLECTION));
    const participationWithTimestamp = {
      ...participationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(docRef, participationWithTimestamp);
    
    return {
      success: true,
      data: { id: docRef.id, ...participationWithTimestamp }
    };
  } catch (error) {
    logger.error('Error creating participation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get participation by ID
 * @param {string} id - Participation document ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getParticipation = withPerformanceMonitoring(
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
          error: 'Participation not found'
        };
      }
    } catch (error) {
      logger.error('Error getting participation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }),
  'getParticipation'
);

/**
 * Update participation record
 * @param {string} id - Participation document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateParticipation = async (id, updateData) => {
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
    logger.error('Error updating participation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete participation record
 * @param {string} id - Participation document ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteParticipation = async (id) => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
    
    return {
      success: true
    };
  } catch (error) {
    logger.error('Error deleting participation:', error);
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
 * Get participations by student ID
 * @param {string} studentId - Student user ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getParticipationsByStudent = async (studentId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const participations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: participations
    };
  } catch (error) {
    logger.error('Error getting participations by student:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get participations by class ID
 * @param {string} classId - Class document ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getParticipationsByClass = async (classId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('classId', '==', classId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const participations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: participations
    };
  } catch (error) {
    logger.error('Error getting participations by class:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get participations by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} classId - Optional class ID filter
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getParticipationsByDateRange = async (startDate, endDate, classId = null) => {
  try {
    // Note: Firestore doesn't support date range queries on timestamp fields directly
    // This would need to be implemented with a composite index or client-side filtering
    let q = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    let participations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter by date range (client-side)
    participations = participations.filter(participation => {
      const participationDate = participation.createdAt?.toDate?.();
      if (!participationDate) return false;
      
      const dateStr = participationDate.toISOString().split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
    
    // Filter by class if specified
    if (classId) {
      participations = participations.filter(p => p.classId === classId);
    }
    
    return {
      success: true,
      data: participations
    };
  } catch (error) {
    logger.error('Error getting participations by date range:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================================================
// REAL-TIME OPERATIONS
// ============================================================================

/**
 * Subscribe to participations for a class
 * @param {string} classId - Class document ID
 * @param {Function} callback - Callback function (snapshot) => void
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToParticipationsByClass = (classId, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('classId', '==', classId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, callback);
};

/**
 * Subscribe to participations for a student
 * @param {string} studentId - Student user ID
 * @param {Function} callback - Callback function (snapshot) => void
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToParticipationsByStudent = (studentId, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, callback);
};

