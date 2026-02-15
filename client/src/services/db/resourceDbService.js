/**
 * Resource Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for resource records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'resources'
 * 
 * @typedef {import('@types/index').Resource} Resource
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
import logger from '@utils/logger';

/**
 * Get all resources
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getResources = async (options = {}) => {
  try {
    const { 
      limitCount = 100, 
      orderByField = 'createdAt', 
      orderDirection = 'desc',
      classId,
      subjectId,
      programId,
      type
    } = options;
    
    let q = query(collection(db, 'resources'));
    
    // Add filters
    if (classId) q = query(q, where('classId', '==', classId));
    if (subjectId) q = query(q, where('subjectId', '==', subjectId));
    if (programId) q = query(q, where('programId', '==', programId));
    if (type) q = query(q, where('type', '==', type));
    
    // Add ordering and limit
    q = query(q, orderBy(orderByField, orderDirection));
    if (limitCount) q = query(q, limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    const resources = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: resources };
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resources:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resource by ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getResource = async (resourceId) => {
  try {
    const docSnap = await getDoc(doc(db, 'resources', resourceId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Resource not found' };
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create resource
 * @param {Object} resourceData - Resource data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createResource = async (resourceData) => {
  try {
    const docRef = doc(collection(db, 'resources'));
    await setDoc(docRef, {
      ...resourceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[ResourceDbService] Error creating resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update resource
 * @param {string} resourceId - Resource ID
 * @param {Object} resourceData - Updated resource data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateResource = async (resourceId, resourceData) => {
  try {
    await updateDoc(doc(db, 'resources', resourceId), {
      ...resourceData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[ResourceDbService] Error updating resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete resource
 * @param {string} resourceId - Resource ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteResource = async (resourceId) => {
  try {
    await deleteDoc(doc(db, 'resources', resourceId));
    return { success: true };
  } catch (error) {
    logger.error('[ResourceDbService] Error deleting resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resources by class
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getResourcesByClass = async (classId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'resources'),
      where('classId', '==', classId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const resources = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: resources };
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resources by class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resources by subject
 * @param {string} subjectId - Subject ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getResourcesBySubject = async (subjectId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'resources'),
      where('subjectId', '==', subjectId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const resources = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: resources };
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resources by subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resources by type
 * @param {string} type - Resource type
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getResourcesByType = async (type, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'resources'),
      where('type', '==', type),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const resources = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: resources };
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resources by type:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search resources
 * @param {string} searchTerm - Search term
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const searchResources = async (searchTerm) => {
  try {
    // This would typically require a full-text search index
    // For now, get all resources and filter client-side
    const result = await getResources({ limitCount: 1000 });
    if (!result.success) {
      return result;
    }
    
    const filteredResources = result.data.filter(resource => 
      resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return { success: true, data: filteredResources };
  } catch (error) {
    logger.error('[ResourceDbService] Error searching resources:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resource count
 * @param {Object} filters - Filters to apply
 * @returns {Promise<{success: boolean, count: number, error?: string}>}
 */
export const getResourceCount = async (filters = {}) => {
  try {
    const { classId, subjectId, programId, type } = filters;
    
    let q = query(collection(db, 'resources'));
    
    // Add filters
    if (classId) q = query(q, where('classId', '==', classId));
    if (subjectId) q = query(q, where('subjectId', '==', subjectId));
    if (programId) q = query(q, where('programId', '==', programId));
    if (type) q = query(q, where('type', '==', type));
    
    const querySnapshot = await getDocs(q);
    return { success: true, count: querySnapshot.size };
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resource count:', error);
    return { success: false, error: error.message };
  }
};
