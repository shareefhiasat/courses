/**
 * Class Database Service - MongoDB/Prisma
 * 
 * PURPOSE:
 * Handles all database operations for classes using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 * 
 * COLLECTION: classes (via Prisma Class model)
 * 
 * @typedef {import('@types/index').Class} Class
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[ClassDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[ClassDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'ClassDbService' });
  })
  .catch((err) => {
    console.error('[ClassDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', { 
      service: 'ClassDbService', 
      error: err.message,
      stack: err.stack 
    });
  });

/**
 * Get all classes from MongoDB
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getClasses = async () => {
  const startTime = Date.now();
  try {
    logger.info('Getting all classes', { 
      service: 'ClassDbService', 
      operation: 'getClasses' 
    });
    
    const classes = await prisma.class.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        program: true,
        subject: true,
        instructor: true,
        students: true,
        activities: true,
        announcements: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'class', {}, classes, duration);
    
    logger.info('Classes retrieved successfully', { 
      service: 'ClassDbService', 
      operation: 'getClasses',
      count: classes.length,
      duration: `${duration}ms`
    });
    
    console.log(`[ClassDbService] ✅ Retrieved ${classes.length} classes in ${duration}ms`);
    return { success: true, data: classes };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting classes', { 
      service: 'ClassDbService', 
      operation: 'getClasses',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ClassDbService] ❌ Error getting classes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get class by ID
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getClassById = async (classId) => {
  const startTime = Date.now();
  try {
    logger.info('Getting class by ID', { 
      service: 'ClassDbService', 
      operation: 'getClassById',
      classId 
    });
    
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        program: true,
        subject: true,
        instructor: true,
        students: true,
        activities: true,
        announcements: true,
        resources: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'class', { id: classId }, classData, duration);
    
    if (classData) {
      logger.info('Class retrieved successfully', { 
        service: 'ClassDbService', 
        operation: 'getClassById',
        classId,
        duration: `${duration}ms`
      });
      console.log(`[ClassDbService] ✅ Retrieved class in ${duration}ms`);
      return { success: true, data: classData };
    } else {
      logger.warn('Class not found', { 
        service: 'ClassDbService', 
        operation: 'getClassById',
        classId,
        duration: `${duration}ms`
      });
      console.log(`[ClassDbService] ⚠️ Class not found in ${duration}ms`);
      return { success: false, error: 'Class not found' };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting class by ID', { 
      service: 'ClassDbService', 
      operation: 'getClassById',
      classId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ClassDbService] ❌ Error getting class by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new class
 * @param {Object} classData - Class data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (classData) => {
  const startTime = Date.now();
  try {
    logger.info('Creating new class', { 
      service: 'ClassDbService', 
      operation: 'create',
      data: classData
    });
    
    const newClass = await prisma.class.create({
      data: classData,
      include: {
        program: true,
        subject: true,
        instructor: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('create', 'class', classData, newClass, duration);
    
    logger.info('Class created successfully', { 
      service: 'ClassDbService', 
      operation: 'create',
      classId: newClass.id,
      duration: `${duration}ms`
    });
    
    console.log(`[ClassDbService] ✅ Created class in ${duration}ms`);
    return { success: true, data: newClass };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating class', { 
      service: 'ClassDbService', 
      operation: 'create',
      data: classData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ClassDbService] ❌ Error creating class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update class
 * @param {string} classId - Class ID
 * @param {Object} updateData - Update data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (classId, updateData) => {
  const startTime = Date.now();
  try {
    logger.info('Updating class', { 
      service: 'ClassDbService', 
      operation: 'update',
      classId,
      data: updateData
    });
    
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        program: true,
        subject: true,
        instructor: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('update', 'class', { id: classId, ...updateData }, updatedClass, duration);
    
    logger.info('Class updated successfully', { 
      service: 'ClassDbService', 
      operation: 'update',
      classId,
      duration: `${duration}ms`
    });
    
    console.log(`[ClassDbService] ✅ Updated class in ${duration}ms`);
    return { success: true, data: updatedClass };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating class', { 
      service: 'ClassDbService', 
      operation: 'update',
      classId,
      data: updateData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ClassDbService] ❌ Error updating class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete class
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteClass = async (classId) => {
  const startTime = Date.now();
  try {
    logger.info('Deleting class', { 
      service: 'ClassDbService', 
      operation: 'deleteClass',
      classId
    });
    
    const deletedClass = await prisma.class.delete({
      where: { id: classId }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('delete', 'class', { id: classId }, deletedClass, duration);
    
    logger.info('Class deleted successfully', { 
      service: 'ClassDbService', 
      operation: 'deleteClass',
      classId,
      duration: `${duration}ms`
    });
    
    console.log(`[ClassDbService] ✅ Deleted class in ${duration}ms`);
    return { success: true, message: 'Class deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting class', { 
      service: 'ClassDbService', 
      operation: 'deleteClass',
      classId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ClassDbService] ❌ Error deleting class:', error);
    return { success: false, error: error.message };
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[ClassDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[ClassDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getClasses,
  getClassById,
  create,
  update,
  deleteClass
};
