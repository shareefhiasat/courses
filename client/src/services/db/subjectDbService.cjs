/**
 * Subject Database Service - MongoDB/Prisma
 * 
 * PURPOSE:
 * Handles all database operations for subjects using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 * 
 * COLLECTION: subjects (via Prisma Subject model)
 * 
 * @typedef {import('@types/index').Subject} Subject
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[SubjectDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[SubjectDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'SubjectDbService' });
  })
  .catch((err) => {
    console.error('[SubjectDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', { 
      service: 'SubjectDbService', 
      error: err.message,
      stack: err.stack 
    });
  });

/**
 * Get all subjects from MongoDB
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getSubjects = async () => {
  const startTime = Date.now();
  try {
    logger.info('Getting all subjects', { 
      service: 'SubjectDbService', 
      operation: 'getSubjects' 
    });
    
    const subjects = await prisma.subject.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        program: true,
        classes: true,
        resources: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'subject', {}, subjects, duration);
    
    logger.info('Subjects retrieved successfully', { 
      service: 'SubjectDbService', 
      operation: 'getSubjects',
      count: subjects.length,
      duration: `${duration}ms`
    });
    
    console.log(`[SubjectDbService] ✅ Retrieved ${subjects.length} subjects in ${duration}ms`);
    return { success: true, data: subjects };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting subjects', { 
      service: 'SubjectDbService', 
      operation: 'getSubjects',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[SubjectDbService] ❌ Error getting subjects:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get subject by ID
 * @param {string} subjectId - Subject ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getSubjectById = async (subjectId) => {
  const startTime = Date.now();
  try {
    logger.info('Getting subject by ID', { 
      service: 'SubjectDbService', 
      operation: 'getSubjectById',
      subjectId 
    });
    
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        program: true,
        classes: true,
        resources: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'subject', { id: subjectId }, subject, duration);
    
    if (subject) {
      logger.info('Subject retrieved successfully', { 
        service: 'SubjectDbService', 
        operation: 'getSubjectById',
        subjectId,
        duration: `${duration}ms`
      });
      console.log(`[SubjectDbService] ✅ Retrieved subject in ${duration}ms`);
      return { success: true, data: subject };
    } else {
      logger.warn('Subject not found', { 
        service: 'SubjectDbService', 
        operation: 'getSubjectById',
        subjectId,
        duration: `${duration}ms`
      });
      console.log(`[SubjectDbService] ⚠️ Subject not found in ${duration}ms`);
      return { success: false, error: 'Subject not found' };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting subject by ID', { 
      service: 'SubjectDbService', 
      operation: 'getSubjectById',
      subjectId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[SubjectDbService] ❌ Error getting subject by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new subject
 * @param {Object} subjectData - Subject data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (subjectData) => {
  const startTime = Date.now();
  try {
    logger.info('Creating new subject', { 
      service: 'SubjectDbService', 
      operation: 'create',
      data: subjectData
    });
    
    const subject = await prisma.subject.create({
      data: subjectData,
      include: {
        program: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('create', 'subject', subjectData, subject, duration);
    
    logger.info('Subject created successfully', { 
      service: 'SubjectDbService', 
      operation: 'create',
      subjectId: subject.id,
      duration: `${duration}ms`
    });
    
    console.log(`[SubjectDbService] ✅ Created subject in ${duration}ms`);
    return { success: true, data: subject };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating subject', { 
      service: 'SubjectDbService', 
      operation: 'create',
      data: subjectData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[SubjectDbService] ❌ Error creating subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update subject
 * @param {string} subjectId - Subject ID
 * @param {Object} updateData - Update data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (subjectId, updateData) => {
  const startTime = Date.now();
  try {
    logger.info('Updating subject', { 
      service: 'SubjectDbService', 
      operation: 'update',
      subjectId,
      data: updateData
    });
    
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        program: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('update', 'subject', { id: subjectId, ...updateData }, subject, duration);
    
    logger.info('Subject updated successfully', { 
      service: 'SubjectDbService', 
      operation: 'update',
      subjectId,
      duration: `${duration}ms`
    });
    
    console.log(`[SubjectDbService] ✅ Updated subject in ${duration}ms`);
    return { success: true, data: subject };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating subject', { 
      service: 'SubjectDbService', 
      operation: 'update',
      subjectId,
      data: updateData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[SubjectDbService] ❌ Error updating subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete subject
 * @param {string} subjectId - Subject ID
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteSubject = async (subjectId) => {
  const startTime = Date.now();
  try {
    logger.info('Deleting subject', { 
      service: 'SubjectDbService', 
      operation: 'deleteSubject',
      subjectId
    });
    
    const subject = await prisma.subject.delete({
      where: { id: subjectId }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('delete', 'subject', { id: subjectId }, subject, duration);
    
    logger.info('Subject deleted successfully', { 
      service: 'SubjectDbService', 
      operation: 'deleteSubject',
      subjectId,
      duration: `${duration}ms`
    });
    
    console.log(`[SubjectDbService] ✅ Deleted subject in ${duration}ms`);
    return { success: true, message: 'Subject deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting subject', { 
      service: 'SubjectDbService', 
      operation: 'deleteSubject',
      subjectId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[SubjectDbService] ❌ Error deleting subject:', error);
    return { success: false, error: error.message };
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[SubjectDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[SubjectDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getSubjects,
  getSubjectById,
  create,
  update,
  deleteSubject
};
