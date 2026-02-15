/**
 * Templates Database Service
 * Handles all Firestore operations for email templates
 * Following the project's service layer architecture
 */

import { db } from '../other/config';
import { collection, addDoc, getDocs, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const TEMPLATES_COLLECTION = 'emailTemplates';

/**
 * Get all email templates from Firestore
 */
export const getAllTemplates = async () => {
  try {
    console.log('🔍 DEBUG: Fetching all email templates from Firestore...');
    
    const templatesSnapshot = await getDocs(collection(db, TEMPLATES_COLLECTION));
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('📋 DEBUG: Templates found:', templates.length);
    console.log('📋 DEBUG: Template IDs:', templates.map(t => t.id));
    
    return { success: true, data: templates };
  } catch (error) {
    console.error('❌ DEBUG: Failed to fetch templates:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get existing template IDs for checking duplicates
 */
export const getExistingTemplateIds = async () => {
  try {
    const templatesSnapshot = await getDocs(collection(db, TEMPLATES_COLLECTION));
    const templateIds = templatesSnapshot.docs.map(doc => doc.data().id);
    
    console.log('📋 DEBUG: Existing template IDs:', templateIds);
    
    return templateIds;
  } catch (error) {
    console.error('❌ DEBUG: Failed to get existing template IDs:', error);
    return [];
  }
};

/**
 * Create a new email template
 */
export const createTemplate = async (templateData) => {
  try {
    console.log('📤 DEBUG: Creating template:', templateData.id);
    
    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
      ...templateData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ DEBUG: Template created with ID:', docRef.id);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ DEBUG: Failed to create template:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get a single template by ID
 */
export const getTemplateById = async (templateId) => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Template not found' };
    }
  } catch (error) {
    console.error('❌ DEBUG: Failed to get template:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing template
 */
export const updateTemplate = async (templateId, updateData) => {
  try {
    console.log('📝 DEBUG: Updating template:', templateId);
    
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ DEBUG: Template updated successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ DEBUG: Failed to update template:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (templateId) => {
  try {
    console.log('🗑️ DEBUG: Deleting template:', templateId);
    
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await deleteDoc(docRef);
    
    console.log('✅ DEBUG: Template deleted successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ DEBUG: Failed to delete template:', error);
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
