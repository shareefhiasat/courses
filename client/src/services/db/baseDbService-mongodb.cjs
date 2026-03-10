/**
 * Base Database Service Template
 * 
 * PURPOSE:
 * Provides a reusable template for creating database services
 * Can be copied and adapted for any collection/model
 * 
 * USAGE:
 * 1. Copy this file: baseDbService-mongodb.cjs -> newCollectionDbService-mongodb.cjs
 * 2. Replace 'Collection' with your collection name
 * 3. Replace 'collection' with your collection name (lowercase)
 * 4. Update the model name in Prisma calls
 * 5. Add/modify operations as needed
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[CollectionDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[CollectionDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'CollectionDbService' });
  })
  .catch((err) => {
    console.error('[CollectionDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', { 
      service: 'CollectionDbService', 
      error: err.message,
      stack: err.stack 
    });
  });

/**
 * Get all collections from MongoDB
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getCollections = async () => {
  const startTime = Date.now();
  try {
    logger.info('Getting all collections', { 
      service: 'CollectionDbService', 
      operation: 'getCollections' 
    });
    
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'collection', {}, collections, duration);
    
    logger.info('Collections retrieved successfully', { 
      service: 'CollectionDbService', 
      operation: 'getCollections',
      count: collections.length,
      duration: `${duration}ms`
    });
    
    console.log(`[CollectionDbService] ✅ Retrieved ${collections.length} collections in ${duration}ms`);
    return { success: true, data: collections };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting collections', { 
      service: 'CollectionDbService', 
      operation: 'getCollections',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[CollectionDbService] ❌ Error getting collections:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get collection by ID
 * @param {string} collectionId - Collection ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getCollectionById = async (collectionId) => {
  const startTime = Date.now();
  try {
    logger.info('Getting collection by ID', { 
      service: 'CollectionDbService', 
      operation: 'getCollectionById',
      collectionId 
    });
    
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'collection', { id: collectionId }, collection, duration);
    
    if (collection) {
      logger.info('Collection retrieved successfully', { 
        service: 'CollectionDbService', 
        operation: 'getCollectionById',
        collectionId,
        duration: `${duration}ms`
      });
      console.log(`[CollectionDbService] ✅ Retrieved collection in ${duration}ms`);
      return { success: true, data: collection };
    } else {
      logger.warn('Collection not found', { 
        service: 'CollectionDbService', 
        operation: 'getCollectionById',
        collectionId,
        duration: `${duration}ms`
      });
      console.log(`[CollectionDbService] ⚠️ Collection not found in ${duration}ms`);
      return { success: false, error: 'Collection not found' };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting collection by ID', { 
      service: 'CollectionDbService', 
      operation: 'getCollectionById',
      collectionId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[CollectionDbService] ❌ Error getting collection by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new collection
 * @param {Object} collectionData - Collection data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (collectionData) => {
  const startTime = Date.now();
  try {
    logger.info('Creating new collection', { 
      service: 'CollectionDbService', 
      operation: 'create',
      data: collectionData
    });
    
    const collection = await prisma.collection.create({
      data: collectionData
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('create', 'collection', collectionData, collection, duration);
    
    logger.info('Collection created successfully', { 
      service: 'CollectionDbService', 
      operation: 'create',
      collectionId: collection.id,
      duration: `${duration}ms`
    });
    
    console.log(`[CollectionDbService] ✅ Created collection in ${duration}ms`);
    return { success: true, data: collection };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating collection', { 
      service: 'CollectionDbService', 
      operation: 'create',
      data: collectionData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[CollectionDbService] ❌ Error creating collection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update collection
 * @param {string} collectionId - Collection ID
 * @param {Object} updateData - Update data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (collectionId, updateData) => {
  const startTime = Date.now();
  try {
    logger.info('Updating collection', { 
      service: 'CollectionDbService', 
      operation: 'update',
      collectionId,
      data: updateData
    });
    
    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: { ...updateData, updatedAt: new Date() }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('update', 'collection', { id: collectionId, ...updateData }, collection, duration);
    
    logger.info('Collection updated successfully', { 
      service: 'CollectionDbService', 
      operation: 'update',
      collectionId,
      duration: `${duration}ms`
    });
    
    console.log(`[CollectionDbService] ✅ Updated collection in ${duration}ms`);
    return { success: true, data: collection };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating collection', { 
      service: 'CollectionDbService', 
      operation: 'update',
      collectionId,
      data: updateData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[CollectionDbService] ❌ Error updating collection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete collection
 * @param {string} collectionId - Collection ID
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteCollection = async (collectionId) => {
  const startTime = Date.now();
  try {
    logger.info('Deleting collection', { 
      service: 'CollectionDbService', 
      operation: 'deleteCollection',
      collectionId
    });
    
    const collection = await prisma.collection.delete({
      where: { id: collectionId }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('delete', 'collection', { id: collectionId }, collection, duration);
    
    logger.info('Collection deleted successfully', { 
      service: 'CollectionDbService', 
      operation: 'deleteCollection',
      collectionId,
      duration: `${duration}ms`
    });
    
    console.log(`[CollectionDbService] ✅ Deleted collection in ${duration}ms`);
    return { success: true, message: 'Collection deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting collection', { 
      service: 'CollectionDbService', 
      operation: 'deleteCollection',
      collectionId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[CollectionDbService] ❌ Error deleting collection:', error);
    return { success: false, error: error.message };
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[CollectionDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[CollectionDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getCollections,
  getCollectionById,
  create,
  update,
  deleteCollection
};
