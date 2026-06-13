/**
 * Generic CRUD Helper Functions for Database Operations
 * 
 * PURPOSE: Reduce code duplication across database service files
 * Provides common patterns for filtering, pagination, sorting, and error handling
 */

import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../../constants/prisma-errors.js';

/**
 * Build a where clause for Prisma queries based on filter parameters
 * @param {Object} params - Query parameters
 * @param {Object} filterConfig - Configuration for which filters to apply
 * @returns {Object} Prisma where clause
 */
export function buildWhereClause(params, filterConfig = {}) {
  const where = { isActive: true };
  
  const {
    search = '',
    searchFields = [],
    filters = {},
    dateFilters = {}
  } = filterConfig;
  
  // Add search filter if search term provided
  if (search && searchFields.length > 0) {
    where.OR = searchFields.map(field => ({
      [field]: { contains: search, mode: 'insensitive' }
    }));
  }
  
  // Add specific filters
  Object.entries(filters).forEach(([param, field]) => {
    if (params[param]) {
      where[field] = typeof params[param] === 'string' ? parseInt(params[param]) : params[param];
    }
  });
  
  // Add date filters
  Object.entries(dateFilters).forEach(([param, config]) => {
    if (params[param]) {
      const value = new Date(params[param]);
      if (config.operator === 'lte') {
        where[config.field] = { lte: value };
      } else if (config.operator === 'gte') {
        where[config.field] = { gte: value };
      } else if (config.operator === 'eq') {
        where[config.field] = value;
      }
    }
  });
  
  // Allow overriding isActive filter if explicitly provided
  if (params.isActive !== null && params.isActive !== undefined) {
    where.isActive = params.isActive === 'true' || params.isActive === true;
  }
  
  return where;
}

/**
 * Build an order clause for Prisma queries
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {Object} Prisma order clause
 */
export function buildOrderClause(sortBy = 'createdAt', sortOrder = 'desc') {
  return {
    [sortBy]: sortOrder.toLowerCase()
  };
}

/**
 * Calculate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Object with skip and limit values
 */
export function calculatePagination(page = 1, limit = 50) {
  return {
    skip: (parseInt(page) - 1) * parseInt(limit),
    limit: parseInt(limit)
  };
}

/**
 * Execute a paginated Prisma query with standard response format
 * @param {Object} prisma - Prisma client instance
 * @param {string} model - Prisma model name
 * @param {Object} options - Query options (where, orderBy, skip, take, include)
 * @returns {Promise<Object>} Result object with success status and data
 */
export async function executePaginatedQuery(prisma, model, options = {}) {
  try {
    const [data, total] = await Promise.all([
      prisma[model].findMany(options),
      prisma[model].count({ where: options.where })
    ]);
    
    return {
      success: true,
      data,
      total,
      page: options.skip ? Math.floor(options.skip / options.take) + 1 : 1,
      limit: options.take || 50
    };
  } catch (error) {
    console.error(`[CRUD Helper] Error executing paginated query for ${model}:`, error);
    return {
      success: false,
      error: getPrismaErrorMessage(error) || 'Query failed'
    };
  }
}

/**
 * Handle Prisma errors with consistent error response format
 * @param {Error} error - Error object
 * @param {string} context - Context for error logging
 * @returns {Object} Error response object
 */
export function handlePrismaError(error, context = 'Database operation') {
  console.error(`[${context}] Error:`, error);
  
  if (isPrismaError(error)) {
    return {
      success: false,
      error: getPrismaErrorMessage(error),
      code: error.code
    };
  }
  
  return {
    success: false,
    error: error.message || `${context} failed`
  };
}

/**
 * Create a standard success response
 * @param {*} data - Response data
 * @param {Object} metadata - Optional metadata (total, page, limit)
 * @returns {Object} Success response object
 */
export function createSuccessResponse(data, metadata = {}) {
  return {
    success: true,
    data,
    ...metadata
  };
}

/**
 * Validate required fields in an object
 * @param {Object} data - Data object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateRequiredFields(data, requiredFields) {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} is required`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
