import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit as firebaseLimit,
  startAfter
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';
import { handleServiceError, withRetry } from '@utils/errorHandling';
import { withPerformanceMonitoring } from '@utils/performance';

// Get all resources
export const getResources = withPerformanceMonitoring(
  withRetry(async () => {
    try {
      logger.debug('[ResourceDb] Fetching all resources');
      
      const querySnapshot = await getDocs(collection(db, 'resources'));
      const resources = [];
      querySnapshot.forEach((d) => {
        const resourceData = { id: d.id, ...d.data() };
        resources.push(resourceData);
      });
      
      logger.debug('[ResourceDb] Successfully fetched resources', { count: resources.length });
      return { success: true, data: resources };
    } catch (error) {
      logger.error('[ResourceDb] Failed to fetch resources', { error: error.message });
      return handleServiceError(error, { operation: 'getResources', layer: 'database' });
    }
  }),
  'getResources_db'
);

// Get resource by ID
export const getResource = async (resourceId) => {
  try {
    if (!resourceId) {
      return { success: false, error: 'Resource ID is required' };
    }
    
    logger.debug('[ResourceDb] Fetching resource by ID', { resourceId });
    
    const resourceDoc = await getDoc(doc(db, 'resources', resourceId));
    if (resourceDoc.exists()) {
      const resourceData = { id: resourceDoc.id, ...resourceDoc.data() };
      logger.debug('[ResourceDb] Successfully fetched resource', { resourceId });
      return { success: true, data: resourceData };
    }
    
    logger.warn('[ResourceDb] Resource not found', { resourceId });
    return { success: false, error: 'Resource not found' };
  } catch (error) {
    logger.error('[ResourceDb] Failed to fetch resource', { error: error.message, resourceId });
    return { success: false, error: error.message };
  }
};

// Create new resource
export const createResource = async (resourceData) => {
  try {
    logger.debug('[ResourceDb] Creating new resource', { title: resourceData.title });
    
    const docRef = await addDoc(collection(db, 'resources'), resourceData);
    
    logger.debug('[ResourceDb] Successfully created resource', { resourceId: docRef.id });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[ResourceDb] Failed to create resource', { error: error.message });
    return { success: false, error: error.message };
  }
};

// Update resource
export const updateResource = async (resourceId, updateData) => {
  try {
    if (!resourceId) {
      return { success: false, error: 'Resource ID is required' };
    }
    
    logger.debug('[ResourceDb] Updating resource', { resourceId });
    
    await updateDoc(doc(db, 'resources', resourceId), updateData);
    
    logger.debug('[ResourceDb] Successfully updated resource', { resourceId });
    return { success: true };
  } catch (error) {
    logger.error('[ResourceDb] Failed to update resource', { error: error.message, resourceId });
    return { success: false, error: error.message };
  }
};

// Delete resource
export const deleteResource = async (resourceId) => {
  try {
    if (!resourceId) {
      return { success: false, error: 'Resource ID is required' };
    }
    
    logger.debug('[ResourceDb] Deleting resource', { resourceId });
    
    await deleteDoc(doc(db, 'resources', resourceId));
    
    logger.debug('[ResourceDb] Successfully deleted resource', { resourceId });
    return { success: true };
  } catch (error) {
    logger.error('[ResourceDb] Failed to delete resource', { error: error.message, resourceId });
    return { success: false, error: error.message };
  }
};

// Get resources by class ID
export const getResourcesByClass = async (classId) => {
  try {
    if (!classId) {
      return { success: false, error: 'Class ID is required' };
    }
    
    logger.debug('[ResourceDb] Fetching resources by class', { classId });
    
    const q = query(collection(db, 'resources'), where('classId', '==', classId));
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach((d) => {
      const resourceData = { id: d.id, ...d.data() };
      resources.push(resourceData);
    });
    
    logger.debug('[ResourceDb] Successfully fetched resources by class', { classId, count: resources.length });
    return { success: true, data: resources };
  } catch (error) {
    logger.error('[ResourceDb] Failed to fetch resources by class', { error: error.message, classId });
    return { success: false, error: error.message };
  }
};

// Get resources by subject ID
export const getResourcesBySubject = async (subjectId) => {
  try {
    if (!subjectId) {
      return { success: false, error: 'Subject ID is required' };
    }
    
    logger.debug('[ResourceDb] Fetching resources by subject', { subjectId });
    
    const q = query(collection(db, 'resources'), where('subjectId', '==', subjectId));
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach((d) => {
      const resourceData = { id: d.id, ...d.data() };
      resources.push(resourceData);
    });
    
    logger.debug('[ResourceDb] Successfully fetched resources by subject', { subjectId, count: resources.length });
    return { success: true, data: resources };
  } catch (error) {
    logger.error('[ResourceDb] Failed to fetch resources by subject', { error: error.message, subjectId });
    return { success: false, error: error.message };
  }
};

// Get resources by type
export const getResourcesByType = async (resourceType) => {
  try {
    if (!resourceType) {
      return { success: false, error: 'Resource type is required' };
    }
    
    logger.debug('[ResourceDb] Fetching resources by type', { resourceType });
    
    const q = query(collection(db, 'resources'), where('type', '==', resourceType));
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach((d) => {
      const resourceData = { id: d.id, ...d.data() };
      resources.push(resourceData);
    });
    
    logger.debug('[ResourceDb] Successfully fetched resources by type', { resourceType, count: resources.length });
    return { success: true, data: resources };
  } catch (error) {
    logger.error('[ResourceDb] Failed to fetch resources by type', { error: error.message, resourceType });
    return { success: false, error: error.message };
  }
};

// Search resources
export const searchResources = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return { success: false, error: 'Search term is required' };
    }
    
    logger.debug('[ResourceDb] Searching resources', { searchTerm });
    
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation that could be enhanced with Algolia or similar
    const querySnapshot = await getDocs(collection(db, 'resources'));
    const resources = [];
    querySnapshot.forEach((d) => {
      const resourceData = { id: d.id, ...d.data() };
      const searchLower = searchTerm.toLowerCase();
      
      // Search in title, description, and type
      if (
        (resourceData.title_en && resourceData.title_en.toLowerCase().includes(searchLower)) ||
        (resourceData.title && resourceData.title.toLowerCase().includes(searchLower)) ||
        (resourceData.description_en && resourceData.description_en.toLowerCase().includes(searchLower)) ||
        (resourceData.description && resourceData.description.toLowerCase().includes(searchLower)) ||
        (resourceData.type && resourceData.type.toLowerCase().includes(searchLower))
      ) {
        resources.push(resourceData);
      }
    });
    
    logger.debug('[ResourceDb] Successfully searched resources', { searchTerm, count: resources.length });
    return { success: true, data: resources };
  } catch (error) {
    logger.error('[ResourceDb] Failed to search resources', { error: error.message, searchTerm });
    return { success: false, error: error.message };
  }
};

// Get resource count
export const getResourceCount = async (filters = {}) => {
  try {
    logger.debug('[ResourceDb] Getting resource count', { filters });
    
    let q;
    if (filters.classId) {
      q = query(collection(db, 'resources'), where('classId', '==', filters.classId));
    } else if (filters.subjectId) {
      q = query(collection(db, 'resources'), where('subjectId', '==', filters.subjectId));
    } else if (filters.type) {
      q = query(collection(db, 'resources'), where('type', '==', filters.type));
    } else {
      q = collection(db, 'resources');
    }
    
    const querySnapshot = await getDocs(q);
    const count = querySnapshot.size;
    
    logger.debug('[ResourceDb] Successfully got resource count', { count });
    return { success: true, count };
  } catch (error) {
    logger.error('[ResourceDb] Failed to get resource count', { error: error.message });
    return { success: false, error: error.message, count: 0 };
  }
};
