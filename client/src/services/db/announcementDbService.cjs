/**
 * Announcement Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for announcements using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: announcements (via Prisma Announcement model)
 *
 * @typedef {import('@types/index').Announcement} Announcement
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[AnnouncementDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[AnnouncementDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'AnnouncementDbService' });
  })
  .catch((err) => {
    console.error('[AnnouncementDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'AnnouncementDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all announcements
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getAnnouncements = async () => {
  const startTime = Date.now();
  try {
    logger.info('Getting all announcements', {
      service: 'AnnouncementDbService',
      operation: 'getAnnouncements'
    });

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        class: true,
        author: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'announcement', {}, announcements, duration);

    logger.info('Announcements retrieved successfully', {
      service: 'AnnouncementDbService',
      operation: 'getAnnouncements',
      count: announcements.length,
      duration: `${duration}ms`
    });

    console.log(`[AnnouncementDbService] ✅ Retrieved ${announcements.length} announcements in ${duration}ms`);
    return { success: true, data: announcements };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting announcements', {
      service: 'AnnouncementDbService',
      operation: 'getAnnouncements',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[AnnouncementDbService] ❌ Error getting announcements:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get announcement by ID
 * @param {string} announcementId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getAnnouncementById = async (announcementId) => {
  const startTime = Date.now();
  try {
    logger.info('Getting announcement by ID', {
      service: 'AnnouncementDbService',
      operation: 'getAnnouncementById',
      announcementId
    });

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        class: true,
        author: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'announcement', { id: announcementId }, announcement, duration);

    if (announcement) {
      logger.info('Announcement retrieved successfully', {
        service: 'AnnouncementDbService',
        operation: 'getAnnouncementById',
        announcementId,
        duration: `${duration}ms`
      });
      console.log(`[AnnouncementDbService] ✅ Retrieved announcement in ${duration}ms`);
      return { success: true, data: announcement };
    }

    logger.warn('Announcement not found', {
      service: 'AnnouncementDbService',
      operation: 'getAnnouncementById',
      announcementId,
      duration: `${duration}ms`
    });
    console.log(`[AnnouncementDbService] ⚠️ Announcement not found in ${duration}ms`);
    return { success: false, error: 'Announcement not found' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting announcement by ID', {
      service: 'AnnouncementDbService',
      operation: 'getAnnouncementById',
      announcementId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[AnnouncementDbService] ❌ Error getting announcement by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new announcement
 * @param {Object} announcementData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (announcementData) => {
  const startTime = Date.now();
  try {
    logger.info('Creating new announcement', {
      service: 'AnnouncementDbService',
      operation: 'create',
      data: announcementData
    });

    const announcement = await prisma.announcement.create({
      data: announcementData,
      include: {
        class: true,
        author: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'announcement', announcementData, announcement, duration);

    logger.info('Announcement created successfully', {
      service: 'AnnouncementDbService',
      operation: 'create',
      announcementId: announcement.id,
      duration: `${duration}ms`
    });

    console.log(`[AnnouncementDbService] ✅ Created announcement in ${duration}ms`);
    return { success: true, data: announcement };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating announcement', {
      service: 'AnnouncementDbService',
      operation: 'create',
      data: announcementData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[AnnouncementDbService] ❌ Error creating announcement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update announcement
 * @param {string} announcementId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (announcementId, updateData) => {
  const startTime = Date.now();
  try {
    logger.info('Updating announcement', {
      service: 'AnnouncementDbService',
      operation: 'update',
      announcementId,
      data: updateData
    });

    const announcement = await prisma.announcement.update({
      where: { id: announcementId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        class: true,
        author: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'announcement', { id: announcementId, ...updateData }, announcement, duration);

    logger.info('Announcement updated successfully', {
      service: 'AnnouncementDbService',
      operation: 'update',
      announcementId,
      duration: `${duration}ms`
    });

    console.log(`[AnnouncementDbService] ✅ Updated announcement in ${duration}ms`);
    return { success: true, data: announcement };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating announcement', {
      service: 'AnnouncementDbService',
      operation: 'update',
      announcementId,
      data: updateData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[AnnouncementDbService] ❌ Error updating announcement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete announcement
 * @param {string} announcementId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteAnnouncement = async (announcementId) => {
  const startTime = Date.now();
  try {
    logger.info('Deleting announcement', {
      service: 'AnnouncementDbService',
      operation: 'deleteAnnouncement',
      announcementId
    });

    const announcement = await prisma.announcement.delete({
      where: { id: announcementId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'announcement', { id: announcementId }, announcement, duration);

    logger.info('Announcement deleted successfully', {
      service: 'AnnouncementDbService',
      operation: 'deleteAnnouncement',
      announcementId,
      duration: `${duration}ms`
    });

    console.log(`[AnnouncementDbService] ✅ Deleted announcement in ${duration}ms`);
    return { success: true, message: 'Announcement deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting announcement', {
      service: 'AnnouncementDbService',
      operation: 'deleteAnnouncement',
      announcementId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[AnnouncementDbService] ❌ Error deleting announcement:', error);
    return { success: false, error: error.message };
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[AnnouncementDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[AnnouncementDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  create,
  update,
  deleteAnnouncement
};
