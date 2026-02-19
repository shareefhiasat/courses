/**
 * Activities Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for activity records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: RECORD_TYPES.ACTIVITY
 * 
 * @typedef {import('@types/index').Activity} Activity
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../other/config';
import { RECORD_TYPES } from '@utils/sharedTypes';
import logger from '@utils/logger';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

/**
 * Get activities by class ID - with performance monitoring and memoization
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivitiesByClass = withPerformanceMonitoring(
  memoize(async (classId, options = {}) => {
    try {
      const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
      
      const q = query(
        collection(db, RECORD_TYPES.ACTIVITY),
        where('classId', '==', classId),
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      return { success: true, data: activities };
    } catch (error) {
      logger.error('[ActivitiesDbService] Error getting activities by class:', error);
      return { success: false, error: error.message };
    }
  }),
  'getActivitiesByClass'
);

/**
 * Get activities by multiple class IDs - with performance monitoring and memoization
 * @param {Array} classIds - Array of class IDs
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivitiesByClasses = withPerformanceMonitoring(
  memoize(async (classIds, options = {}) => {
    try {
      const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
      
      // Firestore 'in' query supports up to 10 values
      const limitedClassIds = classIds.slice(0, 10);
      
      const q = query(
        collection(db, RECORD_TYPES.ACTIVITY),
        where('classId', 'in', limitedClassIds),
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      return { success: true, data: activities };
    } catch (error) {
      logger.error('[ActivitiesDbService] Error getting activities by classes:', error);
      return { success: false, error: error.message };
    }
  }),
  'getActivitiesByClasses'
);

/**
 * Get activities by user ID - with performance monitoring and memoization
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivitiesByUser = withPerformanceMonitoring(
  memoize(async (userId, options = {}) => {
    try {
      const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
      
      const q = query(
        collection(db, RECORD_TYPES.ACTIVITY),
        where('userId', '==', userId),
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      return { success: true, data: activities };
    } catch (error) {
      logger.error('[ActivitiesDbService] Error getting activities by user:', error);
      return { success: false, error: error.message };
    }
  }),
  'getActivitiesByUser'
);

/**
 * Get activity by ID - with performance monitoring and memoization
 * @param {string} activityId - Activity ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getActivity = withPerformanceMonitoring(
  memoize(async (activityId) => {
    try {
      const docSnap = await getDoc(doc(db, RECORD_TYPES.ACTIVITY, activityId));
      if (docSnap.exists()) {
        return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
      }
      return { success: false, error: 'Activity not found' };
    } catch (error) {
      logger.error('[ActivitiesDbService] Error getting activity:', error);
      return { success: false, error: error.message };
    }
  }),
  'getActivity'
);

/**
 * Create activity
 * @param {Object} activityData - Activity data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createActivity = async (activityData) => {
  try {
    const docRef = doc(collection(db, RECORD_TYPES.ACTIVITY));
    await setDoc(docRef, {
      ...activityData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[ActivitiesDbService] Error creating activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update activity
 * @param {string} activityId - Activity ID
 * @param {Object} activityData - Updated activity data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateActivity = async (activityId, activityData) => {
  try {
    await updateDoc(doc(db, RECORD_TYPES.ACTIVITY, activityId), {
      ...activityData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[ActivitiesDbService] Error updating activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete activity
 * @param {string} activityId - Activity ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteActivity = async (activityId) => {
  try {
    await deleteDoc(doc(db, RECORD_TYPES.ACTIVITY, activityId));
    return { success: true };
  } catch (error) {
    logger.error('[ActivitiesDbService] Error deleting activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all activities with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivities = async (filters = {}) => {
  try {
    const { 
      userId,
      classId,
      programId,
      subjectId,
      type,
      status,
      limitCount = 100,
      orderByField = 'createdAt',
      orderDirection = 'desc'
    } = filters;
    
    let conditions = [];
    
    if (userId) conditions.push(where('userId', '==', userId));
    if (classId) conditions.push(where('classId', '==', classId));
    if (programId) conditions.push(where('programId', '==', programId));
    if (subjectId) conditions.push(where('subjectId', '==', subjectId));
    if (type) conditions.push(where('type', '==', type));
    if (status) conditions.push(where('status', '==', status));
    
    // If no conditions provided, create a simple query without where clauses
    let q;
    if (conditions.length === 0) {
      q = query(
        collection(db, RECORD_TYPES.ACTIVITY),
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, RECORD_TYPES.ACTIVITY),
        ...conditions,
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const activities = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: activities };
  } catch (error) {
    logger.error('[ActivitiesDbService] Error getting activities:', error);
    return { success: false, error: error.message };
  }
};
