/**
 * Lookup Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for unified lookup operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 * 
 * This is the SINGLE SOURCE OF TRUTH for all lookup data
 */

import prisma from '../db/prismaClient.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';
import { checkLookupUsage, buildDependencyMessage } from '../db/deleteGuard.js';


// Mapping of lookup types to their database models and default fields
const LOOKUP_CONFIG = {
  'behavior-types': {
    model: 'behaviorTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'category', 'points', 'color', 'icon', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'participation-types': {
    model: 'participationTypes', 
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isPositive', 'icon', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'penalty-types': {
    model: 'penaltyTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'severity', 'color', 'icon', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'subject-types': {
    model: 'subjectTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'requirement-types': {
    model: 'requirementTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'category-types': {
    model: 'categoryTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'descriptionEn', 'descriptionAr', 'icon', 'color', 'sort', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'resource-types': {
    model: 'resourceTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'icon', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'priority-types': {
    model: 'priorityTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'level', 'color', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'user-status-types': {
    model: 'userStatusTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'enrollment-status-types': {
    model: 'enrollmentStatusTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'activity-types': {
    model: 'activityTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'icon', 'color', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'attendance-status-types': {
    model: 'attendanceStatusTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'icon', 'color', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'user-roles': {
    model: 'userRoles',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'level', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  // Additional lookup tables from Prisma schema
  'submission-status-types': {
    model: 'submissionStatusTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'quiz-status-types': {
    model: 'quizStatusTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'question-difficulty-types': {
    model: 'questionDifficultyTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'schedule-types': {
    model: 'scheduleTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'template-types': {
    model: 'templateTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'config-types': {
    model: 'configTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'assessment-types': {
    model: 'assessmentTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'activity-log-action-types': {
    model: 'activityLogActionTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'question-types': {
    model: 'questionTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  },
  'target-audience-types': {
    model: 'targetAudienceTypes',
    defaultFields: ['id', 'code', 'nameEn', 'nameAr', 'description', 'isActive', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
  }
};

const NON_WRITABLE_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'creator', 'updater']);

const getWritableFields = (config) => {
  return new Set(
    (config?.defaultFields || []).filter((field) => !NON_WRITABLE_FIELDS.has(field))
  );
};

const normalizeLookupWriteData = (lookupType, payload = {}) => {
  const config = LOOKUP_CONFIG[lookupType];
  const writableFields = getWritableFields(config);
  const normalized = {};

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (writableFields.has(key)) {
      normalized[key] = value;
    }
  });

  if (writableFields.has('sort') && payload.sortOrder !== undefined && normalized.sort === undefined) {
    normalized.sort = payload.sortOrder;
  }

  if (writableFields.has('sortOrder') && payload.sort !== undefined && normalized.sortOrder === undefined) {
    normalized.sortOrder = payload.sort;
  }

  if (writableFields.has('description')) {
    if (normalized.description === undefined) {
      normalized.description = payload.descriptionEn ?? payload.descriptionAr ?? payload.description;
    }
  }

  if (writableFields.has('descriptionEn') && normalized.descriptionEn === undefined && payload.description !== undefined) {
    normalized.descriptionEn = payload.description;
  }

  if (writableFields.has('descriptionAr') && normalized.descriptionAr === undefined && payload.description !== undefined) {
    normalized.descriptionAr = payload.description;
  }

  return normalized;
};

const normalizeLookupReadRecord = (lookupType, item) => {
  if (!item || typeof item !== 'object') {
    return item;
  }

  const normalized = { ...item };

  if (normalized.descriptionEn === undefined && normalized.description !== undefined) {
    normalized.descriptionEn = normalized.description;
  }

  if (normalized.descriptionAr === undefined && normalized.description !== undefined) {
    normalized.descriptionAr = normalized.description;
  }

  if (normalized.description === undefined) {
    normalized.description = normalized.descriptionEn ?? normalized.descriptionAr ?? null;
  }

  if (normalized.sortOrder === undefined) {
    if (normalized.sort !== undefined) {
      normalized.sortOrder = normalized.sort;
    } else if (normalized.level !== undefined) {
      normalized.sortOrder = normalized.level;
    }
  }

  if (normalized.icon === undefined) {
    normalized.icon = null;
  }

  if (normalized.color === undefined) {
    normalized.color = null;
  }

  if (normalized.isPositive === undefined && lookupType === 'participation-types') {
    normalized.isPositive = true;
  }

  return normalized;
};

/**
 * Create lookup data
 * 
 * @param {string} lookupType - The lookup type key
 * @param {object} data - Data to create
 * @param {string} userId - User ID for auditing
 * @returns {Promise<object>} - Result with success flag and data
 */
export async function createLookupData(lookupType, data, userId = null) {
  try {
    // Validate lookup type
    const config = LOOKUP_CONFIG[lookupType];
    if (!config) {
      return {
        success: false,
        message: `Unknown lookup type: ${lookupType}. Available types: ${Object.keys(LOOKUP_CONFIG).join(', ')}`
      };
    }

    // Add audit fields if they exist in the model
    const createData = normalizeLookupWriteData(lookupType, data);
    if (userId) {
      if (config.defaultFields.includes('createdBy') && !createData.createdBy) {
        createData.createdBy = userId;
      }
      if (config.defaultFields.includes('updatedBy') && !createData.updatedBy) {
        createData.updatedBy = userId;
      }
    }

    // Set default values
    if (config.defaultFields.includes('isActive') && createData.isActive === undefined) {
      createData.isActive = true;
    }

    // Create record
    const result = await prisma[config.model].create({
      data: createData
    });

    return {
      success: true,
      data: result,
      message: `${lookupType} created successfully`
    };
  } catch (error) {
    console.error(`Error creating ${lookupType}:`, error);
    return {
      success: false,
      message: isPrismaError(error) ? getPrismaErrorMessage(error) : error.message,
      error: error.message
    };
  }
}

/**
 * Update lookup data
 * 
 * @param {string} lookupType - The lookup type key
 * @param {string} id - Record ID to update
 * @param {object} data - Data to update
 * @param {string} userId - User ID for auditing
 * @returns {Promise<object>} - Result with success flag and data
 */
export async function updateLookupData(lookupType, id, data, userId = null) {
  try {
    // Validate lookup type
    const config = LOOKUP_CONFIG[lookupType];
    if (!config) {
      return {
        success: false,
        message: `Unknown lookup type: ${lookupType}. Available types: ${Object.keys(LOOKUP_CONFIG).join(', ')}`
      };
    }

    // Add audit fields if they exist in the model
    const updateData = normalizeLookupWriteData(lookupType, data);
    if (userId && !updateData.updatedBy) {
      if (config.defaultFields.includes('updatedBy')) {
        updateData.updatedBy = userId;
      }
    }

    // Update record - PK is always integer, convert string to int
    const result = await prisma[config.model].update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return {
      success: true,
      data: result,
      message: `${lookupType} updated successfully`
    };
  } catch (error) {
    console.error(`Error updating ${lookupType}:`, error);
    return {
      success: false,
      message: isPrismaError(error) ? getPrismaErrorMessage(error) : error.message,
      error: error.message
    };
  }
}

/**
 * Delete lookup data (soft delete)
 * 
 * @param {string} lookupType - The lookup type key
 * @param {string} id - Record ID to delete
 * @param {string} userId - User ID for auditing
 * @returns {Promise<object>} - Result with success flag and data
 */
export async function deleteLookupData(lookupType, id, userId = null, options = {}) {
  try {
    // Validate lookup type
    const config = LOOKUP_CONFIG[lookupType];
    if (!config) {
      return {
        success: false,
        message: `Unknown lookup type: ${lookupType}. Available types: ${Object.keys(LOOKUP_CONFIG).join(', ')}`
      };
    }

    // Check if this lookup record is used by any dependent model
    const usageCheck = await checkLookupUsage(config.model, id);
    
    if (usageCheck.hasDependencies && !options.force) {
      return {
        success: false,
        message: buildDependencyMessage(usageCheck.dependencies),
        error: buildDependencyMessage(usageCheck.dependencies),
        code: 'IN_USE',
        dependencies: usageCheck.dependencies
      };
    }

    let result;
    
    // Try soft delete first if model supports isActive
    if (config.defaultFields.includes('isActive')) {
      const updateData = { isActive: false };
      if (userId && config.defaultFields.includes('updatedBy')) {
        updateData.updatedBy = userId;
      }

      // Soft delete - PK is always integer, convert string to int
      result = await prisma[config.model].update({
        where: { id: parseInt(id) },
        data: updateData
      });
    } else {
      // Hard delete if no isActive field - PK is always integer, convert string to int
      result = await prisma[config.model].delete({
        where: { id: parseInt(id) }
      });
    }

    return {
      success: true,
      data: result,
      message: usageCheck.hasDependencies
        ? `${lookupType} deactivated successfully (was in use)`
        : `${lookupType} deleted successfully`
    };
  } catch (error) {
    console.error(`Error deleting ${lookupType}:`, error);
    return {
      success: false,
      message: isPrismaError(error) ? getPrismaErrorMessage(error) : error.message,
      error: error.message
    };
  }
}

/**
 * Generic lookup function - SINGLE SOURCE OF TRUTH
 * 
 * @param {string} lookupType - The lookup type key (e.g., 'behavior-types', 'subject-types')
 * @param {object} options - Query options
 * @param {boolean} options.activeOnly - Fetch only active records (default: true)
 * @param {Array} options.fields - Specific fields to select (optional)
 * @param {object} options.where - Additional where conditions (optional)
 * @param {object} options.orderBy - Order by configuration (optional)
 * @returns {Promise<object>} - Result with success flag and data
 */
export async function getLookupData(lookupType, options = {}) {
  const {
    activeOnly = true,
    fields = null,
    where = {},
    orderBy = { nameEn: 'asc' }
  } = options;

  try {
    // Validate lookup type
    const config = LOOKUP_CONFIG[lookupType];
    if (!config) {
      return {
        success: false,
        message: `Unknown lookup type: ${lookupType}. Available types: ${Object.keys(LOOKUP_CONFIG).join(', ')}`
      };
    }

    // Build query
    const selectFields = fields || config.defaultFields;
    const whereConditions = { ...where };
    
    // Add active filter if requested
    if (activeOnly && config.defaultFields.includes('isActive')) {
      whereConditions.isActive = true;
    }

    // Build include for user relations
    const include = {};
    if (selectFields.includes('createdBy')) {
      include.creator = {
        select: {
          id: true,
          displayName: true,
            displayNameAr: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true
        }
      };
    }
    if (selectFields.includes('updatedBy')) {
      include.updater = {
        select: {
          id: true,
          displayName: true,
            displayNameAr: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true
        }
      };
    }

    // Build select object (only fields that are not relations)
    const select = {};
    selectFields.forEach(field => {
      if (field !== 'createdBy' && field !== 'updatedBy') {
        select[field] = true;
      }
    });

    // Execute query - use include only, no select
    const result = await prisma[config.model].findMany({
      where: whereConditions,
      orderBy,
      include: Object.keys(include).length > 0 ? include : undefined
    });

    const normalizedResult = result.map((item) => normalizeLookupReadRecord(lookupType, item));

    return {
      success: true,
      data: normalizedResult,
      lookupType,
      count: normalizedResult.length
    };

  } catch (error) {
    console.error(`[Lookup Service] Error fetching ${lookupType}:`, error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      console.error(`[Lookup Service] Prisma error:`, errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
    
    return {
      success: false,
      message: `Failed to fetch ${lookupType}`
    };
  }
}

/**
 * Get multiple lookup types at once
 * 
 * @param {Array} lookupTypes - Array of lookup type keys
 * @param {object} options - Query options (applied to all lookups)
 * @returns {Promise<object>} - Result with success flag and data for each type
 */
export async function getMultipleLookupData(lookupTypes, options = {}) {
  try {
    const results = {};
    const errors = [];

    // Fetch all lookup types in parallel
    const promises = lookupTypes.map(async (lookupType) => {
      const result = await getLookupData(lookupType, options);
      if (result.success) {
        results[lookupType] = result.data;
      } else {
        errors.push(`${lookupType}: ${result.message}`);
      }
      return result;
    });

    await Promise.all(promises);

    return {
      success: errors.length === 0,
      data: results,
      errors: errors.length > 0 ? errors : null,
      message: errors.length > 0 ? `Some lookups failed: ${errors.join(', ')}` : 'All lookups fetched successfully'
    };

  } catch (error) {
    console.error('[Lookup Service] Error fetching multiple lookups:', error);
    return {
      success: false,
      message: 'Failed to fetch multiple lookup types'
    };
  }
}

/**
 * Get all available lookup types (metadata)
 * 
 * @returns {Promise<object>} - Available lookup types and their configurations
 */
export async function getLookupTypes() {
  try {
    return {
      success: true,
      data: Object.keys(LOOKUP_CONFIG).map(key => ({
        key,
        model: LOOKUP_CONFIG[key].model,
        defaultFields: LOOKUP_CONFIG[key].defaultFields
      }))
    };
  } catch (error) {
    console.error('[Lookup Service] Error getting lookup types:', error);
    return {
      success: false,
      message: 'Failed to get lookup types'
    };
  }
}

// Legacy functions for backward compatibility (deprecated)
export async function getBehaviorTypes(user) {
  return getLookupData('behavior-types');
}

export async function getParticipationTypes(user) {
  return getLookupData('participation-types');
}

export async function getPenaltyTypes(user) {
  return getLookupData('penalty-types');
}
