import logger from '@utils/logger';
import { 
  getCategories as getCategoriesFromDb,
  getCategoryById as getCategoryByIdFromDb,
  create as createCategoryToDb,
  update as updateCategoryInDb,
  deleteCategory as deleteCategoryFromDb
} from '../db/categoryDbService';

/**
 * Get all categories - with performance monitoring and memoization
 */
export const getCategories = async () => {
  try {
    logger.info('CATEGORY: Fetching all categories');
    
    const result = await getCategoriesFromDb();
    
    if (result.success) {
      logger.info('CATEGORY: Successfully fetched categories', { count: result.data.length });
    } else {
      logger.warn('CATEGORY: Failed to fetch categories', { error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('CATEGORY: Failed to fetch categories', { error: error.message });
    return handleServiceError(error, { operation: 'getCategories' });
  }
};

/**
 * Seed default categories
 */
export const seedDefaultCategories = async () => {
  try {
    logger.info('CATEGORY: Seeding default categories');
    
    const defaultCategories = [
      {
        nameEn: 'Programming',
        nameAr: 'البرمجة',
        icon: 'code',
        descriptionEn: 'Programming activities and resources',
        descriptionAr: 'الأنشطة والموارد البرمجية',
        color: '#3b82f6',
        order: 1
      },
      {
        nameEn: 'Computing',
        nameAr: 'الحوسبة',
        icon: 'monitor',
        descriptionEn: 'Computing fundamentals and concepts',
        descriptionAr: 'أساسيات ومفاهيم الحوسبة',
        color: '#0ea5e9',
        order: 2
      },
      {
        nameEn: 'Algorithm',
        nameAr: 'الخوارزميات',
        icon: 'brain',
        descriptionEn: 'Algorithm design and analysis',
        descriptionAr: 'تصميم وتحليل الخوارزميات',
        color: '#8b5cf6',
        order: 3
      },
      {
        nameEn: 'General',
        nameAr: 'عام',
        icon: 'folder',
        descriptionEn: 'General activities and resources',
        descriptionAr: 'الأنشطة والموارد العامة',
        color: '#6b7280',
        order: 4
      }
    ];

    const results = [];
    for (const category of defaultCategories) {
      try {
        const result = await createCategoryToDb(category, { uid: 'system' });
        if (result.success) {
          logger.info('CATEGORY: Successfully seeded category', { name: category.nameEn, docId: result.id });
          results.push({ action: 'created', category: category.nameEn, success: true, id: result.id });
        } else {
          logger.warn('CATEGORY: Failed to seed category', { name: category.nameEn, error: result.error });
          results.push({ action: 'error', category: category.nameEn, success: false, error: result.error });
        }
      } catch (error) {
        logger.error('CATEGORY: Error seeding category', { name: category.nameEn, error: error.message });
        results.push({ action: 'error', category: category.nameEn, success: false, error: error.message });
      }
    }

    logger.info('CATEGORY: Seeding completed', { total: results.length, successful: results.filter(r => r.success).length });
    return { success: true, data: results };
  } catch (error) {
    logger.error('CATEGORY: Error seeding categories', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Add a new category
 */
export const addCategory = async (categoryData, user = null) => {
  try {
    logger.info('CATEGORY: Adding new category', { name: categoryData.nameEn });
    
    const result = await createCategoryToDb(categoryData, user);
    
    if (result.success) {
      logger.info('CATEGORY: Successfully added category', { name: categoryData.nameEn, docId: result.id });
    } else {
      logger.warn('CATEGORY: Failed to add category', { name: categoryData.nameEn, error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('CATEGORY: Error adding category', { error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (docId, categoryData, user = null) => {
  try {
    logger.info('CATEGORY: Updating category', { docId, name: categoryData.nameEn });
    
    const result = await updateCategoryInDb(docId, categoryData, user);
    
    if (result.success) {
      logger.info('CATEGORY: Successfully updated category', { docId, name: categoryData.nameEn });
    } else {
      logger.warn('CATEGORY: Failed to update category', { docId, name: categoryData.nameEn, error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('CATEGORY: Error updating category', { docId, error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (docId) => {
  try {
    logger.info('CATEGORY: Deleting category', { docId });
    
    const result = await deleteCategoryFromDb(docId);
    
    if (result.success) {
      logger.info('CATEGORY: Successfully deleted category', { docId });
    } else {
      logger.warn('CATEGORY: Failed to delete category', { docId, error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('CATEGORY: Error deleting category', { docId, error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (docId) => {
  try {
    logger.info('CATEGORY: Fetching category by ID', { docId });
    
    const result = await getCategoryByIdFromDb(docId);
    
    if (result.success) {
      logger.info('CATEGORY: Successfully fetched category by ID', { docId });
    } else {
      logger.warn('CATEGORY: Failed to fetch category by ID', { docId, error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('CATEGORY: Error fetching category by ID', { docId, error: error.message });
    return { success: false, error: error.message };
  }
};
