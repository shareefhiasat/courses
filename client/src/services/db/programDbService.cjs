/**
 * Program Database Service - MongoDB/Prisma
 * 
 * PURPOSE:
 * Handles all database operations for programs using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 * 
 * COLLECTION: programs (via Prisma Program model)
 * 
 * @typedef {import('@types/index').Program} Program
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[ProgramDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[ProgramDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'ProgramDbService' });
  })
  .catch((err) => {
    console.error('[ProgramDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', { 
      service: 'ProgramDbService', 
      error: err.message,
      stack: err.stack 
    });
  });

/**
 * Get all programs from MongoDB
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getPrograms = async () => {
  const startTime = Date.now();
  try {
    logger.info('Getting all programs', { 
      service: 'ProgramDbService', 
      operation: 'getPrograms' 
    });
    
    const programs = await prisma.program.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        classes: true,
        subjects: true,
        resources: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'program', {}, programs, duration);
    
    logger.info('Programs retrieved successfully', { 
      service: 'ProgramDbService', 
      operation: 'getPrograms',
      count: programs.length,
      duration: `${duration}ms`
    });
    
    console.log(`[ProgramDbService] ✅ Retrieved ${programs.length} programs in ${duration}ms`);
    return { success: true, data: programs };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting programs', { 
      service: 'ProgramDbService', 
      operation: 'getPrograms',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ProgramDbService] ❌ Error getting programs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get program by ID
 * @param {string} programId - Program ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getProgramById = async (programId) => {
  const startTime = Date.now();
  try {
    logger.info('Getting program by ID', { 
      service: 'ProgramDbService', 
      operation: 'getProgramById',
      programId 
    });
    
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        classes: true,
        subjects: true,
        resources: true
      }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'program', { id: programId }, program, duration);
    
    if (program) {
      logger.info('Program retrieved successfully', { 
        service: 'ProgramDbService', 
        operation: 'getProgramById',
        programId,
        duration: `${duration}ms`
      });
      console.log(`[ProgramDbService] ✅ Retrieved program in ${duration}ms`);
      return { success: true, data: program };
    } else {
      logger.warn('Program not found', { 
        service: 'ProgramDbService', 
        operation: 'getProgramById',
        programId,
        duration: `${duration}ms`
      });
      console.log(`[ProgramDbService] ⚠️ Program not found in ${duration}ms`);
      return { success: false, error: 'Program not found' };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting program by ID', { 
      service: 'ProgramDbService', 
      operation: 'getProgramById',
      programId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ProgramDbService] ❌ Error getting program by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new program
 * @param {Object} programData - Program data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (programData) => {
  const startTime = Date.now();
  try {
    logger.info('Creating new program', { 
      service: 'ProgramDbService', 
      operation: 'create',
      data: programData
    });
    
    const program = await prisma.program.create({
      data: programData
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('create', 'program', programData, program, duration);
    
    logger.info('Program created successfully', { 
      service: 'ProgramDbService', 
      operation: 'create',
      programId: program.id,
      duration: `${duration}ms`
    });
    
    console.log(`[ProgramDbService] ✅ Created program in ${duration}ms`);
    return { success: true, data: program };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating program', { 
      service: 'ProgramDbService', 
      operation: 'create',
      data: programData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ProgramDbService] ❌ Error creating program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update program
 * @param {string} programId - Program ID
 * @param {Object} updateData - Update data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (programId, updateData) => {
  const startTime = Date.now();
  try {
    logger.info('Updating program', { 
      service: 'ProgramDbService', 
      operation: 'update',
      programId,
      data: updateData
    });
    
    const program = await prisma.program.update({
      where: { id: programId },
      data: { ...updateData, updatedAt: new Date() }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('update', 'program', { id: programId, ...updateData }, program, duration);
    
    logger.info('Program updated successfully', { 
      service: 'ProgramDbService', 
      operation: 'update',
      programId,
      duration: `${duration}ms`
    });
    
    console.log(`[ProgramDbService] ✅ Updated program in ${duration}ms`);
    return { success: true, data: program };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating program', { 
      service: 'ProgramDbService', 
      operation: 'update',
      programId,
      data: updateData,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ProgramDbService] ❌ Error updating program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete program
 * @param {string} programId - Program ID
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteProgram = async (programId) => {
  const startTime = Date.now();
  try {
    logger.info('Deleting program', { 
      service: 'ProgramDbService', 
      operation: 'deleteProgram',
      programId
    });
    
    const program = await prisma.program.delete({
      where: { id: programId }
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('delete', 'program', { id: programId }, program, duration);
    
    logger.info('Program deleted successfully', { 
      service: 'ProgramDbService', 
      operation: 'deleteProgram',
      programId,
      duration: `${duration}ms`
    });
    
    console.log(`[ProgramDbService] ✅ Deleted program in ${duration}ms`);
    return { success: true, message: 'Program deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting program', { 
      service: 'ProgramDbService', 
      operation: 'deleteProgram',
      programId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ProgramDbService] ❌ Error deleting program:', error);
    return { success: false, error: error.message };
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[ProgramDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[ProgramDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getPrograms,
  getProgramById,
  create,
  update,
  deleteProgram
};
