/**
 * Categories Database Service (MongoDB/Prisma Version)
 * 
 * PURPOSE:
 * Direct MongoDB operations for category records using Prisma ORM.
 * This replaces the Firestore-based categoryDbService.
 * 
 * COLLECTION: categories (via Prisma Category model)
 * 
 * @typedef {import('@types/index').Category} Category
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { PrismaClient } from '@prisma/client';
import logger from '@utils/logger';

console.log('[CategoryDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

prisma.$connect()
  .then(() => console.log('[CategoryDbService] ✅ Prisma connected successfully'))
  .catch((err) => console.error('[CategoryDbService] ❌ Prisma connection failed:', err));

/**
 * Get all categories from MongoDB
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getCategories = async () => {
  try {
    console.log('[CategoryDbService] 📥 Getting all categories...');
    logger.debug('[CategoryDbService] Getting all categories');
    
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    });
    
    console.log(`[CategoryDbService] ✅ Retrieved ${categories.length} categories`);
    logger.debug('[CategoryDbService] Retrieved categories', { count: categories.length });
    return { success: true, data: categories };
  } catch (error) {
    console.error('[CategoryDbService] ❌ Error getting categories:', error);
    logger.error('[CategoryDbService] Error getting categories:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getCategoryById = async (categoryId) => {
  try {
    console.log(`[CategoryDbService] Getting category by ID: ${categoryId}`);
    logger.debug('[CategoryDbService] Getting category by ID', { categoryId });
    
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      console.log(`[CategoryDbService] Category not found: ${categoryId}`);
      return { success: false, error: 'Category not found' };
    }
    
    console.log(`[CategoryDbService] Retrieved category: ${category.nameEn}`);
    return { success: true, data: category };
  } catch (error) {
    console.error(`[CategoryDbService] Error getting category ${categoryId}:`, error);
    logger.error('[CategoryDbService] Error getting category by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new category
 * @param {Object} categoryData - Category data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const create = async (categoryData, user = null) => {
  try {
    console.log('[CategoryDbService] Creating category:', categoryData.nameEn);
    logger.debug('[CategoryDbService] Creating category', { data: categoryData });
    
    const category = await prisma.category.create({
      data: categoryData
    });
    
    console.log(`[CategoryDbService] Category created: ${category.id}`);
    logger.info('[CategoryDbService] Category created successfully', { id: category.id });
    return { success: true, id: category.id };
  } catch (error) {
    console.error('[CategoryDbService] Error creating category:', error);
    logger.error('[CategoryDbService] Error creating category:', error);
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
export const update = async (categoryId, categoryData, user = null) => {
  try {
    console.log(`[CategoryDbService] Updating category: ${categoryId}`);
    logger.debug('[CategoryDbService] Updating category', { id: categoryId, data: categoryData });
    
    await prisma.category.update({
      where: { id: categoryId },
      data: categoryData
    });
    
    console.log(`[CategoryDbService] Category updated: ${categoryId}`);
    logger.info('[CategoryDbService] Category updated successfully', { id: categoryId });
    return { success: true };
  } catch (error) {
    console.error(`[CategoryDbService] Error updating category ${categoryId}:`, error);
    logger.error('[CategoryDbService] Error updating category:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete category
 * @param {string} categoryId - Category ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteCategory = async (categoryId) => {
  try {
    console.log(`[CategoryDbService] Deleting category: ${categoryId}`);
    logger.debug('[CategoryDbService] Deleting category', { id: categoryId });
    
    await prisma.category.delete({
      where: { id: categoryId }
    });
    
    console.log(`[CategoryDbService] Category deleted: ${categoryId}`);
    logger.info('[CategoryDbService] Category deleted successfully', { id: categoryId });
    return { success: true };
  } catch (error) {
    console.error(`[CategoryDbService] Error deleting category ${categoryId}:`, error);
    logger.error('[CategoryDbService] Error deleting category:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active categories only
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActiveCategories = async () => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });
    
    return { success: true, data: categories };
  } catch (error) {
    logger.error('[CategoriesDbService] Error getting active categories:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Disconnect Prisma client (cleanup)
 */
export const disconnect = async () => {
  try {
    await prisma.$disconnect();
    logger.info('[CategoriesDbService] Prisma client disconnected');
  } catch (error) {
    logger.error('[CategoriesDbService] Error disconnecting Prisma:', error);
  }
};
