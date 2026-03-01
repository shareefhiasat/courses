/**
 * Templates Database Service
 * Handles all Firestore operations for email templates
 * Following the project's service layer architecture
 */

import { serverTimestamp, doc, getDoc, updateDoc, setDoc, deleteDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import dbService from '@services/other/dbService';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

const TEMPLATES_COLLECTION = COLLECTIONS.EMAIL_TEMPLATES;

/**
 * Get all email templates from Firestore
 */
export const getAllTemplates = async () => {
  try {
    logger.debug('Fetching all email templates from Firestore');
    
    const templatesSnapshot = await getDocs(collection(dbService.getDb(), TEMPLATES_COLLECTION));
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.debug('Templates found:', templates.length);
    logger.debug('Template IDs:', templates.map(t => t.id));
    
    return { success: true, data: templates };
  } catch (error) {
    logger.error('Failed to fetch templates:', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Get existing template IDs for checking duplicates
 */
export const getExistingTemplateIds = async () => {
  try {
    const templatesSnapshot = await getDocs(collection(dbService.getDb(), TEMPLATES_COLLECTION));
    const templateIds = templatesSnapshot.docs.map(doc => doc.data().id);
    
    logger.debug('Existing template IDs:', templateIds);
    
    return templateIds;
  } catch (error) {
    logger.error('Failed to get existing template IDs:', { error: error.message });
    return [];
  }
};

/**
 * Create a new email template
 */
export const createTemplate = async (templateData) => {
  try {
    logger.debug('Creating template:', templateData.id);
    
    const docRef = await addDoc(collection(dbService.getDb(), TEMPLATES_COLLECTION), {
      ...templateData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    logger.debug('Template created with ID:', docRef.id);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('Failed to create template:', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Get a single template by ID
 */
export const getTemplateById = async (templateId) => {
  try {
    const docRef = doc(dbService.getDb(), TEMPLATES_COLLECTION, templateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Template not found' };
    }
  } catch (error) {
    logger.error('Failed to get template:', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing template
 */
export const updateTemplate = async (templateId, updateData) => {
  try {
    logger.debug('Updating template:', templateId);
    
    const docRef = doc(dbService.getDb(), TEMPLATES_COLLECTION, templateId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    logger.debug('Template updated successfully');
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to update template:', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (templateId) => {
  try {
    logger.debug('Deleting template:', templateId);
    
    const docRef = doc(dbService.getDb(), TEMPLATES_COLLECTION, templateId);
    await deleteDoc(docRef);
    
    logger.debug('Template deleted successfully');
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete template:', { error: error.message });
    return { success: false, error: error.message };
  }
};

export default {
  getAllTemplates,
  getExistingTemplateIds,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate
};
