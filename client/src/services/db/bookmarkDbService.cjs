/**
 * Bookmark Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for bookmarks using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: bookmarks (via Prisma Bookmark model)
 *
 * @typedef {import('@types/index').Bookmark} Bookmark
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[BookmarkDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[BookmarkDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'BookmarkDbService' });
  })
  .catch((err) => {
    console.error('[BookmarkDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'BookmarkDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all bookmarks
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getBookmarks = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { userId, type, limitCount = 200 } = options;

    logger.info('Getting bookmarks', {
      service: 'BookmarkDbService',
      operation: 'getBookmarks',
      filters: { userId, type, limitCount }
    });

    const where = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;

    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitCount,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'bookmark', where, bookmarks, duration);

    console.log(`[BookmarkDbService] ✅ Retrieved ${bookmarks.length} bookmarks in ${duration}ms`);
    return { success: true, data: bookmarks };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting bookmarks', {
      service: 'BookmarkDbService',
      operation: 'getBookmarks',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[BookmarkDbService] ❌ Error getting bookmarks:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get bookmark by ID
 * @param {string} bookmarkId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getBookmarkById = async (bookmarkId) => {
  const startTime = Date.now();
  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'bookmark', { id: bookmarkId }, bookmark, duration);

    if (!bookmark) return { success: false, error: 'Bookmark not found' };
    return { success: true, data: bookmark };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting bookmark by ID', {
      service: 'BookmarkDbService',
      operation: 'getBookmarkById',
      bookmarkId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create bookmark
 * @param {Object} bookmarkData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (bookmarkData) => {
  const startTime = Date.now();
  try {
    const bookmark = await prisma.bookmark.create({
      data: bookmarkData,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'bookmark', bookmarkData, bookmark, duration);

    return { success: true, data: bookmark };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating bookmark', {
      service: 'BookmarkDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update bookmark
 * @param {string} bookmarkId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (bookmarkId, updateData) => {
  const startTime = Date.now();
  try {
    const bookmark = await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'bookmark', { id: bookmarkId, ...updateData }, bookmark, duration);

    return { success: true, data: bookmark };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating bookmark', {
      service: 'BookmarkDbService',
      operation: 'update',
      bookmarkId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete bookmark
 * @param {string} bookmarkId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteBookmark = async (bookmarkId) => {
  const startTime = Date.now();
  try {
    const bookmark = await prisma.bookmark.delete({
      where: { id: bookmarkId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'bookmark', { id: bookmarkId }, bookmark, duration);

    return { success: true, message: 'Bookmark deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting bookmark', {
      service: 'BookmarkDbService',
      operation: 'deleteBookmark',
      bookmarkId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[BookmarkDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[BookmarkDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getBookmarks,
  getBookmarkById,
  create,
  update,
  deleteBookmark
};
