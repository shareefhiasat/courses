/**
 * Categories Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for category records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: categories
 * 
 * @typedef {import('@types/index').Category} Category
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
  getDocs,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../other/config';
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import logger from '@utils/logger';

/**
 * Get all categories from Firestore
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getCategories = async () => {
  try {
    const q = query(
      collection(db, 'categories'),
      orderBy('order', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const categories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const category = { 
        docId: doc.id, 
        ...data,
        // Always use camelCase for consistency
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr
      };
      
      // Keep dates as strings (don't convert to Date objects)
      // This matches Activities, Resources, and other entities
      
      return category;
    });
    
    return { success: true, data: categories };
  } catch (error) {
    logger.error('CATEGORY: Failed to fetch categories', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Get a single category by ID
 * @param {string} docId - Category document ID
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export const getCategoryById = async (docId) => {
  try {
    const docRef = doc(db, 'categories', docId);
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const categoryData = { 
        docId: docSnapshot.id, 
        ...data,
        // Always use camelCase for consistency
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr
      };
      
      // Keep dates as strings (don't convert to Date objects)
      // This matches Activities, Resources, and other entities
      
      return { success: true, data: categoryData };
    } else {
      return { success: false, error: 'Category not found' };
    }
  } catch (error) {
    logger.error('CATEGORY: Failed to fetch category by ID', { docId, error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Create a new category
 * @param {Object} categoryData - Category data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, id: string, error?: string}>}
 */
export const create = async (categoryData, user = null) => {
  try {
    logger.info('CATEGORY: Creating new category', { name: categoryData.nameEn });
    
    const docRef = doc(collection(db, 'categories'));
    const categoryWithAudit = {
      ...categoryData,
      ...getCreateAuditData(user || { uid: 'system' })
    };
    
    await setDoc(docRef, categoryWithAudit);
    
    logger.info('CATEGORY: Successfully created category', { docId: docRef.id });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('CATEGORY: Failed to create category', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing category
 * @param {string} docId - Category document ID
 * @param {Object} categoryData - Updated category data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const update = async (docId, categoryData, user = null) => {
  try {
    logger.info('CATEGORY: Updating category', { docId, name: categoryData.nameEn });
    
    const docRef = doc(db, 'categories', docId);
    const updateData = {
      ...categoryData,
      ...getUpdateAuditData(user || { uid: 'system' })
    };
    
    await updateDoc(docRef, updateData);
    
    logger.info('CATEGORY: Successfully updated category', { docId });
    return { success: true };
  } catch (error) {
    logger.error('CATEGORY: Failed to update category', { docId, error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Delete a category
 * @param {string} docId - Category document ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteCategory = async (docId) => {
  try {
    logger.info('CATEGORY: Deleting category', { docId });
    
    const docRef = doc(db, 'categories', docId);
    await deleteDoc(docRef);
    
    logger.info('CATEGORY: Successfully deleted category', { docId });
    return { success: true };
  } catch (error) {
    logger.error('CATEGORY: Failed to delete category', { docId, error: error.message });
    return { success: false, error: error.message };
  }
};
