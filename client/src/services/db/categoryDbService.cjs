/**
 * Category Database Service - MongoDB/Prisma
 * 
 * PURPOSE:
 * Handles all database operations for categories using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 * 
 * COLLECTION: categories (via Prisma Category model)
 * 
 * @typedef {import('@types/index').Category} Category
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('@services/utils/logger');

console.log('[CategoryDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[CategoryDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'CategoryDbService' });
  })
  .catch((err) => {
    console.error('[CategoryDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', { 
      service: 'CategoryDbService', 
      error: err.message,
      stack: err.stack 
    });
  });

/**
 * Get all categories from MongoDB
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getCategories = async () => {
  const startTime = Date.now();
  try {
    logger.info('Getting all categories', { 
      service: 'CategoryDbService', 
      operation: 'getCategories' 
    });
    
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    });
    
    const duration = Date.now() - startTime;
    logger.info('Categories retrieved successfully', { 
      service: 'CategoryDbService', 
      operation: 'getCategories',
      count: categories.length,
      duration: `${duration}ms`
    });
    
    console.log(`[CategoryDbService] ✅ Retrieved ${categories.length} categories in ${duration}ms`);
    return { success: true, data: categories };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting categories', { 
      service: 'CategoryDbService', 
      operation: 'getCategories',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[CategoryDbService] ❌ Error getting categories:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getCategoryById = async (categoryId) => {
  try {
    console.log(`[CategoryDbService] 📥 Getting category by ID: ${categoryId}`);
    
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      console.log(`[CategoryDbService] ⚠️ Category not found: ${categoryId}`);
      return { success: false, error: 'Category not found' };
    }
    
    console.log(`[CategoryDbService] ✅ Retrieved category: ${category.nameEn}`);
    return { success: true, data: category };
  } catch (error) {
    console.error(`[CategoryDbService] ❌ Error getting category ${categoryId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new category
 * @param {Object} categoryData - Category data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
const create = async (categoryData, user = null) => {
  try {
    console.log('[CategoryDbService] 📝 Creating category:', categoryData.nameEn);
    
    const category = await prisma.category.create({
      data: categoryData
    });
    
    console.log(`[CategoryDbService] ✅ Category created: ${category.id}`);
    return { success: true, id: category.id };
  } catch (error) {
    console.error('[CategoryDbService] ❌ Error creating category:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update category
 * @param {string} categoryId - Category ID
 * @param {Object} categoryData - Updated category data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const update = async (categoryId, categoryData, user = null) => {
  try {
    console.log(`[CategoryDbService] 📝 Updating category: ${categoryId}`);
    
    await prisma.category.update({
      where: { id: categoryId },
      data: categoryData
    });
    
    console.log(`[CategoryDbService] ✅ Category updated: ${categoryId}`);
    return { success: true };
  } catch (error) {
    console.error(`[CategoryDbService] ❌ Error updating category ${categoryId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete category
 * @param {string} categoryId - Category ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const deleteCategory = async (categoryId) => {
  try {
    console.log(`[CategoryDbService] 🗑️ Deleting category: ${categoryId}`);
    
    await prisma.category.delete({
      where: { id: categoryId }
    });
    
    console.log(`[CategoryDbService] ✅ Category deleted: ${categoryId}`);
    return { success: true };
  } catch (error) {
    console.error(`[CategoryDbService] ❌ Error deleting category ${categoryId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active categories only
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getActiveCategories = async () => {
  try {
    console.log('[CategoryDbService] 📥 Getting active categories...');
    
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });
    
    console.log(`[CategoryDbService] ✅ Retrieved ${categories.length} active categories`);
    return { success: true, data: categories };
  } catch (error) {
    console.error('[CategoryDbService] ❌ Error getting active categories:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  create,
  update,
  deleteCategory,
  getActiveCategories
};
