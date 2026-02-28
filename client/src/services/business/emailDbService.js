import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  getDoc, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@services/other/config';
import logger from '@utils/logger';

/**
 * Email Database Service
 * Centralized service for all email template database operations
 * Used by emailService.js and EmailTemplateList.jsx
 */

// Template collection reference
const TEMPLATES_COLLECTION = 'emailTemplates';

/**
 * Get all email templates
 * @param {boolean} forceRefresh - Force refresh by clearing cache
 * @returns {Promise<Array>} Array of template objects
 */
export const getEmailTemplates = async (forceRefresh = false) => {
  try {
    logger.info('📋 Loading email templates...', { forceRefresh });
    
    const q = query(
      collection(db, TEMPLATES_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const templateList = [];
    const templateIds = [];
    
    snapshot.forEach(doc => {
      const templateData = { id: doc.id, ...doc.data() };
      templateList.push(templateData);
      templateIds.push(doc.id);
    });

    logger.info('📊 Templates loaded:', { count: templateList.length, ids: templateIds });
    
    return templateList;
  } catch (error) {
    logger.error('❌ Error loading templates:', error);
    throw new Error('Failed to load templates: ' + error.message);
  }
};

/**
 * Get template by template ID field
 * @param {string} templateId - The template ID field value
 * @returns {Promise<Object|null>} Template object or null if not found
 */
export const getTemplateById = async (templateId) => {
  try {
    logger.info('🔍 Getting template by ID:', { templateId });
    
    const q = query(
      collection(db, TEMPLATES_COLLECTION), 
      where('id', '==', templateId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      const data = docSnapshot.data();
      const template = { 
        docId: docSnapshot.id, 
        ...data 
      };
      
      logger.info('✅ Template found:', { templateId, docId: docSnapshot.id, name: data.name });
      return template;
    } else {
      logger.info('❌ Template not found:', { templateId });
      return null;
    }
  } catch (error) {
    logger.error('❌ Error getting template:', { templateId, error: error.message });
    throw new Error('Failed to get template: ' + error.message);
  }
};

/**
 * Check if template exists
 * @param {string} templateId - The template ID field value
 * @returns {Promise<Object>} Object with exists boolean and template data if found
 */
export const verifyTemplateExists = async (templateId) => {
  try {
    logger.info('🔍 Verifying template exists:', { templateId });
    
    const q = query(
      collection(db, TEMPLATES_COLLECTION), 
      where('id', '==', templateId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      const data = docSnapshot.data();
      
      logger.info('✅ Template exists:', { 
        templateId, 
        docId: docSnapshot.id, 
        name: data.name 
      });
      
      return { 
        exists: true, 
        data, 
        docId: docSnapshot.id 
      };
    } else {
      logger.info('❌ Template does not exist:', { templateId });
      return { exists: false };
    }
  } catch (error) {
    logger.error('❌ Error verifying template:', { templateId, error: error.message });
    return { exists: false, error };
  }
};

/**
 * Delete template by template ID field
 * @param {string} templateId - The template ID field value
 * @returns {Promise<Object>} Deletion result with templateId and docId
 */
export const deleteTemplate = async (templateId) => {
  try {
    logger.info('🗑️ Deleting template:', { templateId });
    
    // Find the document by template ID field
    const q = query(
      collection(db, TEMPLATES_COLLECTION), 
      where('id', '==', templateId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      logger.warn('⚠️ Template not found for deletion:', { templateId });
      throw new Error('Template not found. It may have already been deleted.');
    }
    
    // Get the document reference (there should be only one)
    const docSnapshot = querySnapshot.docs[0];
    const docRef = docSnapshot.ref;
    
    logger.info('📄 Template found, proceeding with deletion:', { 
      templateId, 
      docId: docSnapshot.id,
      name: docSnapshot.data().name 
    });
    
    // Delete the document
    await deleteDoc(docRef);
    
    logger.info('✅ Template deleted successfully:', { templateId, docId: docSnapshot.id });
    
    return { 
      success: true, 
      templateId, 
      docId: docSnapshot.id 
    };
  } catch (error) {
    logger.error('❌ Error deleting template:', { templateId, error: error.message });
    throw new Error('Failed to delete template: ' + error.message);
  }
};

/**
 * Create new template
 * @param {Object} templateData - Template data object
 * @returns {Promise<Object>} Created template with docId
 */
export const createTemplate = async (templateData) => {
  try {
    logger.info('➕ Creating new template:', { templateId: templateData.id });
    
    const docData = {
      ...templateData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), docData);
    
    logger.info('✅ Template created successfully:', { 
      templateId: templateData.id, 
      docId: docRef.id 
    });
    
    return {
      success: true,
      templateId: templateData.id,
      docId: docRef.id,
      ...docData
    };
  } catch (error) {
    logger.error('❌ Error creating template:', { templateId: templateData.id, error: error.message });
    throw new Error('Failed to create template: ' + error.message);
  }
};

/**
 * Update template by template ID field
 * @param {string} templateId - The template ID field value
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated template result
 */
export const updateTemplate = async (templateId, updateData) => {
  try {
    logger.info('📝 Updating template:', { templateId });
    
    // Find the document by template ID field
    const q = query(
      collection(db, TEMPLATES_COLLECTION), 
      where('id', '==', templateId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      logger.warn('⚠️ Template not found for update:', { templateId });
      throw new Error('Template not found for update.');
    }
    
    // Get the document reference
    const docSnapshot = querySnapshot.docs[0];
    const docRef = docSnapshot.ref;
    
    const docData = {
      ...updateData,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(docRef, docData);
    
    logger.info('✅ Template updated successfully:', { 
      templateId, 
      docId: docSnapshot.id 
    });
    
    return {
      success: true,
      templateId,
      docId: docSnapshot.id,
      ...docData
    };
  } catch (error) {
    logger.error('❌ Error updating template:', { templateId, error: error.message });
    throw new Error('Failed to update template: ' + error.message);
  }
};

/**
 * Search templates by multiple fields
 * @param {string} searchTerm - Search term
 * @param {Array} templates - Array of templates to search
 * @returns {Array} Filtered templates
 */
export const searchTemplates = (searchTerm, templates) => {
  if (!searchTerm.trim()) return templates;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return templates.filter(template =>
    template.name?.toLowerCase().includes(lowerSearchTerm) ||
    template.subject?.toLowerCase().includes(lowerSearchTerm) ||
    template.type?.toLowerCase().includes(lowerSearchTerm) ||
    template.id?.toLowerCase().includes(lowerSearchTerm)
  );
};

// Export all functions
export default {
  getEmailTemplates,
  getTemplateById,
  verifyTemplateExists,
  deleteTemplate,
  createTemplate,
  updateTemplate,
  searchTemplates
};
