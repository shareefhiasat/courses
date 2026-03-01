/**
 * Activity Log Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for activity log records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'activityLogs'
 * 
 * @typedef {import('@types/index').ActivityLog} ActivityLog
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get all activity logs
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivityLogs = async (options = {}) => {
  try {
    const { limitCount = 100, orderByField = 'timestamp', orderDirection = 'desc' } = options;
    
    const result = await dbService.getAll(COLLECTIONS.ACTIVITY_LOG, {
      orderBy: {
        field: orderByField,
        direction: orderDirection
      },
      limit: limitCount
    });
    
    return result;
  } catch (error) {
    logger.error('[ActivityLogDbService] Error getting activity logs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activity log by ID
 * @param {string} logId - Activity log ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getActivityLog = async (logId) => {
  try {
    const result = await dbService.getById(COLLECTIONS.ACTIVITY_LOG, logId);
    return result;
  } catch (error) {
    logger.error('[ActivityLogDbService] Error getting activity log:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create activity log
 * @param {Object} logData - Activity log data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createActivityLog = async (logData) => {
  try {
    const result = await dbService.add(COLLECTIONS.ACTIVITY_LOG, logData);
    return result;
  } catch (error) {
    logger.error('[ActivityLogDbService] Error creating activity log:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activity logs by user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivityLogsByUser = async (userId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'timestamp', orderDirection = 'desc' } = options;
    
    const result = await dbService.getAll(COLLECTIONS.ACTIVITY_LOG, {
      where: {
        field: 'userId',
        operator: '==',
        value: userId
      },
      orderBy: {
        field: orderByField,
        direction: orderDirection
      },
      limit: limitCount
    });
    
    return result;
  } catch (error) {
    logger.error('[ActivityLogDbService] Error getting activity logs by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activity logs by type
 * @param {string} type - Activity type
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivityLogsByType = async (type, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'timestamp', orderDirection = 'desc' } = options;
    
    const result = await dbService.getAll(COLLECTIONS.ACTIVITY_LOG, {
      where: {
        field: 'type',
        operator: '==',
        value: type
      },
      orderBy: {
        field: orderByField,
        direction: orderDirection
      },
      limit: limitCount
    });
    
    return result;
  } catch (error) {
    logger.error('[ActivityLogDbService] Error getting activity logs by type:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activity logs by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivityLogsByDateRange = async (startDate, endDate, options = {}) => {
  try {
    const { limitCount = 100, orderByField = 'timestamp', orderDirection = 'desc' } = options;
    
    // Note: Firestore doesn't support date range queries directly on timestamp fields
    // This would need to be implemented with a composite index or client-side filtering
    const result = await getActivityLogs({ limitCount: 1000 });
    if (!result.success) {
      return result;
    }
    
    // Filter by date range client-side
    const filteredLogs = result.data.filter(log => {
      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
    
    return { success: true, data: filteredLogs };
  } catch (error) {
    logger.error('[ActivityLogDbService] Error getting activity logs by date range:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all activity logs (for login/activity page display)
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getLoginLogs = async (options = {}) => {
  try {
    const { limitCount = 500 } = options;
    
    const result = await dbService.getAll(COLLECTIONS.ACTIVITY_LOG, {
      orderBy: {
        field: 'timestamp',
        direction: 'desc'
      },
      limit: limitCount
    });
    
    return result;
  } catch (error) {
    logger.error('[ActivityLogDbService] Error getting activity logs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete activity log
 * @param {string} logId - Activity log ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteActivityLog = async (logId) => {
  try {
    const result = await dbService.delete(COLLECTIONS.ACTIVITY_LOG, logId);
    return result;
  } catch (error) {
    logger.error('[ActivityLogDbService] Error deleting activity log:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete all activity logs
 * @param {Object} options - Deletion options
 * @returns {Promise<{success: boolean, deletedCount?: number, error?: string}>}
 */
export const deleteAllActivityLogs = async (options = {}) => {
  try {
    const { batchSize = 400 } = options;
    
    let deletedCount = 0;
    let lastVisible = null;
    
    do {
      let q = query(collection(dbService.getDb(), COLLECTIONS.ACTIVITY_LOG), limit(batchSize));
      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) break;
      
      const batch = querySnapshot.docs.map(doc => dbService.delete(COLLECTIONS.ACTIVITY_LOG, doc.id));
      await Promise.all(batch);
      
      deletedCount += querySnapshot.size;
      lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
    } while (querySnapshot.size === batchSize);
    
    return { success: true, deletedCount };
  } catch (error) {
    logger.error('[ActivityLogDbService] Error deleting all activity logs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search activity logs
 * @param {string} searchTerm - Search term
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const searchActivityLogs = async (searchTerm) => {
  try {
    // This would typically require a full-text search index
    // For now, get all logs and filter client-side
    const result = await getActivityLogs({ limitCount: 1000 });
    if (!result.success) {
      return result;
    }
    
    const filteredLogs = result.data.filter(log => 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.metadata?.toString()?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return { success: true, data: filteredLogs };
  } catch (error) {
    logger.error('[ActivityLogDbService] Error searching activity logs:', error);
    return { success: false, error: error.message };
  }
};
