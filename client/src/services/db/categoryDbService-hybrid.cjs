/**
 * Category Database Service - Hybrid Prisma + Native MongoDB
 * 
 * PURPOSE:
 * Uses Prisma for READ operations (no transactions needed)
 * Uses native MongoDB driver for WRITE operations (no replica set needed)
 * 
 * This hybrid approach gives you:
 * - Prisma's type safety and query builder for reads
 * - Native MongoDB's flexibility for writes without replica set
 * 
 * COLLECTION: categories
 */

const { PrismaClient } = require('@prisma/client');
const { MongoClient, ObjectId } = require('mongodb');

console.log('[CategoryDbService] Initializing Hybrid Prisma + MongoDB...');

// Prisma for READ operations
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

// Native MongoDB for WRITE operations
let mongoClient;
let db;
let categoriesCollection;

async function initMongoDB() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    mongoClient = new MongoClient(connectionString);
    await mongoClient.connect();
    
    // Extract database name from connection string
    const dbName = connectionString.split('/').pop().split('?')[0];
    db = mongoClient.db(dbName);
    categoriesCollection = db.collection('Category');
    
    console.log('[CategoryDbService] ✅ Native MongoDB connected successfully');
    console.log('[CategoryDbService] Database:', dbName);
  } catch (error) {
    console.error('[CategoryDbService] ❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Initialize connections
prisma.$connect()
  .then(() => console.log('[CategoryDbService] ✅ Prisma connected successfully'))
  .catch((err) => console.error('[CategoryDbService] ❌ Prisma connection failed:', err));

initMongoDB().catch(err => {
  console.error('[CategoryDbService] Failed to initialize MongoDB:', err);
});

/**
 * Get all categories from MongoDB (using Prisma)
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getCategories = async () => {
  try {
    console.log('[CategoryDbService] 📥 Getting all categories (Prisma)...');
    
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    });
    
    console.log(`[CategoryDbService] ✅ Retrieved ${categories.length} categories`);
    return { success: true, data: categories };
  } catch (error) {
    console.error('[CategoryDbService] ❌ Error getting categories:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get category by ID (using Prisma)
 * @param {string} categoryId - Category ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getCategoryById = async (categoryId) => {
  try {
    console.log(`[CategoryDbService] 📥 Getting category by ID (Prisma): ${categoryId}`);
    
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
 * Create new category (using native MongoDB)
 * @param {Object} categoryData - Category data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
const create = async (categoryData, user = null) => {
  try {
    console.log('[CategoryDbService] 📝 Creating category (Native MongoDB):', categoryData.nameEn);
    
    if (!categoriesCollection) {
      throw new Error('MongoDB not initialized');
    }
    
    // Prepare document for MongoDB
    const document = {
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await categoriesCollection.insertOne(document);
    
    console.log(`[CategoryDbService] ✅ Category created: ${result.insertedId}`);
    return { success: true, id: result.insertedId.toString() };
  } catch (error) {
    console.error('[CategoryDbService] ❌ Error creating category:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update category (using native MongoDB)
 * @param {string} categoryId - Category ID
 * @param {Object} categoryData - Updated category data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const update = async (categoryId, categoryData, user = null) => {
  try {
    console.log(`[CategoryDbService] 📝 Updating category (Native MongoDB): ${categoryId}`);
    
    if (!categoriesCollection) {
      throw new Error('MongoDB not initialized');
    }
    
    // Prepare update document
    const updateDoc = {
      $set: {
        ...categoryData,
        updatedAt: new Date()
      }
    };
    
    const result = await categoriesCollection.updateOne(
      { _id: new ObjectId(categoryId) },
      updateDoc
    );
    
    if (result.matchedCount === 0) {
      console.log(`[CategoryDbService] ⚠️ Category not found: ${categoryId}`);
      return { success: false, error: 'Category not found' };
    }
    
    console.log(`[CategoryDbService] ✅ Category updated: ${categoryId}`);
    return { success: true };
  } catch (error) {
    console.error(`[CategoryDbService] ❌ Error updating category ${categoryId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete category (using native MongoDB)
 * @param {string} categoryId - Category ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const deleteCategory = async (categoryId) => {
  try {
    console.log(`[CategoryDbService] 🗑️ Deleting category (Native MongoDB): ${categoryId}`);
    
    if (!categoriesCollection) {
      throw new Error('MongoDB not initialized');
    }
    
    const result = await categoriesCollection.deleteOne({
      _id: new ObjectId(categoryId)
    });
    
    if (result.deletedCount === 0) {
      console.log(`[CategoryDbService] ⚠️ Category not found: ${categoryId}`);
      return { success: false, error: 'Category not found' };
    }
    
    console.log(`[CategoryDbService] ✅ Category deleted: ${categoryId}`);
    return { success: true };
  } catch (error) {
    console.error(`[CategoryDbService] ❌ Error deleting category ${categoryId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active categories only (using Prisma)
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getActiveCategories = async () => {
  try {
    console.log('[CategoryDbService] 📥 Getting active categories (Prisma)...');
    
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

// Cleanup on process exit
process.on('SIGINT', async () => {
  console.log('[CategoryDbService] Closing connections...');
  await prisma.$disconnect();
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

module.exports = {
  getCategories,
  getCategoryById,
  create,
  update,
  deleteCategory,
  getActiveCategories
};
