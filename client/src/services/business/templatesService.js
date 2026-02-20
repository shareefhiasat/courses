/**
 * Templates Business Service
 * Handles business logic for email template operations
 * Following the project's service layer architecture
 */

import templatesDb from '../db/templatesDb';
import { defaultTemplates } from '@utils/defaultEmailTemplates';
import logger from '@utils/logger';

/**
 * Upload default templates to Firestore (smart upload - only missing templates)
 */
export const uploadDefaultTemplates = async () => {
  logger.info('🚀 Starting SMART upload of default email templates...');
  
  try {
    // Get existing templates from database
    const existingTemplateIds = await templatesDb.getExistingTemplateIds();
    
    logger.info(`📋 Found ${defaultTemplates.length} default templates`);
    logger.info('📋 Existing templates in Firestore:', existingTemplateIds);
    
    let uploaded = 0;
    let alreadyExists = 0;
    let errors = 0;
    
    for (const template of defaultTemplates) {
      try {
        // Check if template already exists
        if (existingTemplateIds.includes(template.id)) {
          logger.info(`⏭️ Skipped ${template.id} - already exists in Firestore`);
          alreadyExists++;
          continue;
        }
        
        logger.info(`📤 Uploading NEW template: ${template.id} (${template.name})`);
        
        // Create template via database service
        const result = await templatesDb.createTemplate(template);
        
        if (result.success) {
          logger.info(`✅ Uploaded ${template.id} with ID: ${result.id}`);
          uploaded++;
        } else {
          logger.error(`❌ Failed to upload ${template.id}: ${result.error}`);
          errors++;
        }
        
      } catch (error) {
        logger.error(`❌ Error processing ${template.id}:`, error);
        errors++;
      }
    }
    
    logger.info('📊 SMART Upload Summary:');
    logger.info(`✅ Uploaded (new): ${uploaded}`);
    logger.info(`⏭️ Already existed: ${alreadyExists}`);
    logger.info(`❌ Errors: ${errors}`);
    logger.info(`📋 Total processed: ${defaultTemplates.length}`);
    
    // Return detailed results
    return {
      success: errors === 0,
      uploaded,
      alreadyExists,
      errors,
      total: defaultTemplates.length,
      message: getUploadMessage(uploaded, alreadyExists, errors)
    };
    
  } catch (error) {
    logger.error('❌ Upload templates service error:', error);
    return {
      success: false,
      uploaded: 0,
      alreadyExists: 0,
      errors: 1,
      total: defaultTemplates.length,
      message: 'Error uploading templates: ' + error.message
    };
  }
};

/**
 * Get all templates with business logic - with performance monitoring and memoization
 */
export const getAllTemplates = async () => {
  try {
    const result = await templatesDb.getAllTemplates();
    
    if (result.success) {
      logger.info(`📋 Retrieved ${result.data.length} templates`);
      return result;
    } else {
      logger.error('Failed to get templates:', result.error);
      return result;
    }
  } catch (error) {
    logger.error('Get all templates service error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get template by ID with business logic - with performance monitoring and memoization
 */
export const getTemplateById = async (templateId) => {
  try {
    const result = await templatesDb.getTemplateById(templateId);
    
    if (result.success) {
      logger.info(`📋 Retrieved template: ${templateId}`);
    } else {
      logger.warn(`Template not found: ${templateId}`);
    }
    
    return result;
  } catch (error) {
    logger.error('Get template by ID service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update template with business logic
 */
export const updateTemplate = async (templateId, updateData) => {
  try {
    // Validate template data
    if (!updateData.name || !updateData.subject || !updateData.html) {
      return {
        success: false,
        error: 'Template must have name, subject, and html content'
      };
    }
    
    const result = await templatesDb.updateTemplate(templateId, updateData);
    
    if (result.success) {
      logger.info(`📝 Updated template: ${templateId}`);
    } else {
      logger.error(`Failed to update template ${templateId}:`, result.error);
    }
    
    return result;
  } catch (error) {
    logger.error('Update template service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete template with business logic
 */
export const deleteTemplate = async (templateId) => {
  try {
    // Check if template exists before deleting
    const template = await templatesDb.getTemplateById(templateId);
    
    if (!template.success) {
      return {
        success: false,
        error: 'Template not found'
      };
    }
    
    const result = await templatesDb.deleteTemplate(templateId);
    
    if (result.success) {
      logger.info(`🗑️ Deleted template: ${templateId}`);
    } else {
      logger.error(`Failed to delete template ${templateId}:`, result.error);
    }
    
    return result;
  } catch (error) {
    logger.error('Delete template service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create user-friendly upload message
 */
const getUploadMessage = (uploaded, alreadyExists, errors) => {
  let message = '';
  
  if (uploaded > 0) {
    message += `Successfully uploaded ${uploaded} new email templates!\n`;
  }
  
  if (alreadyExists > 0) {
    message += `${alreadyExists} templates already exist (not overwritten).\n`;
  }
  
  if (errors > 0) {
    message += `${errors} templates had errors.\n`;
  }
  
  if (uploaded > 0) {
    message += '\n🎉 Try sending QR email again!';
  } else if (alreadyExists > 0) {
    message += '\n✅ Your QR email should work now!';
  } else {
    message += '\nUpload completed with some issues. Check console for details.';
  }
  
  return message.trim();
};

export default {
  uploadDefaultTemplates,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate
};
