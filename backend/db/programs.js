/**
 * Programs Database Service
 * 
 * PURPOSE: Direct database operations for programs using Prisma
 * ARCHITECTURE: Business Services → DB Services → Prisma → PostgreSQL
 */

import prisma from './prismaClient.js';
import { checkDependencies, buildDependencyMessage, PROGRAM_DEPENDENCIES } from './deleteGuard.js';

/**
 * Get all programs from database
 * 
 * @param {object} params - Query parameters
 * @returns {Promise<object>} - Result object with programs data
 */
const getPrograms = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[Programs DB Service] Getting programs with params:', params);
    
    const {
      page = 1,
      limit = 20,
      search,
      status,
      includeSubjects = false,
      includeClasses = false,
      orderBy = 'nameEn',
      orderDirection = 'asc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    
    // Build include options
    const include = {};
    if (includeSubjects) include.subjects = true;
    if (includeClasses) include.classes = true;
    
    // Build order by
    const orderByClause = {};
    orderByClause[orderBy] = orderDirection.toLowerCase();
    
    // Execute query
    const [programs, totalCount] = await Promise.all([
      prisma.program.findMany({
        where,
        include,
        orderBy: orderByClause,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.program.count({ where })
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`[Programs DB Service] ✅ Retrieved ${programs.length} programs in ${duration}ms`);
    
    // Build pagination metadata
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const totalPages = Math.ceil(totalCount / limitNum);
    
    return {
      success: true,
      data: programs,
      total: totalCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB Service] ❌ Error getting programs:', error);
    return { 
      success: false, 
      error: error.message,
      duration: `${duration}ms`
    };
  }
};

/**
 * Get program by ID
 * 
 * @param {string} programId - Program ID
 * @param {object} params - Additional parameters
 * @returns {Promise<object>} - Result object with program data
 */
const getProgramById = async (programId, params = {}) => {
  const startTime = Date.now();
  try {
    console.log(`[Programs DB Service] Getting program by ID: ${programId}`);
    
    const { includeSubjects = false, includeClasses = false } = params;
    
    const include = {};
    if (includeSubjects) include.subjects = true;
    if (includeClasses) include.classes = true;
    
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include
    });
    
    const duration = Date.now() - startTime;
    
    if (program) {
      console.log(`[Programs DB Service] ✅ Retrieved program in ${duration}ms`);
      return { success: true, data: program };
    } else {
      console.log(`[Programs DB Service] ⚠️ Program not found in ${duration}ms`);
      return { success: false, error: 'Program not found' };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB Service] ❌ Error getting program:', error);
    return { 
      success: false, 
      error: error.message,
      duration: `${duration}ms`
    };
  }
};

/**
 * Create new program
 * 
 * @param {object} programData - Program data
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with created program
 */
const create = async (programData, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[Programs DB Service] Creating new program:', programData.nameEn || 'unnamed');
    
    const newProgram = await prisma.program.create({
      data: {
        ...programData,
        // Ensure dates are properly formatted
        createdAt: programData.createdAt || new Date(),
        updatedAt: programData.updatedAt || new Date()
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Programs DB Service] ✅ Created program in ${duration}ms`);
    
    return { success: true, data: newProgram };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB Service] ❌ Error creating program:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return { 
        success: false, 
        error: 'A program with this code already exists',
        duration: `${duration}ms`
      };
    }
    
    return { 
      success: false, 
      error: error.message,
      duration: `${duration}ms`
    };
  }
};

/**
 * Update program
 * 
 * @param {string} programId - Program ID
 * @param {object} updateData - Update data
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with updated program
 */
const update = async (programId, updateData, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[Programs DB Service] Updating program: ${programId}`);
    
    const updatedProgram = await prisma.program.update({
      where: { id: programId },
      data: {
        ...updateData,
        updatedAt: updateData.updatedAt || new Date()
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Programs DB Service] ✅ Updated program in ${duration}ms`);
    
    return { success: true, data: updatedProgram };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB Service] ❌ Error updating program:', error);
    
    if (error.code === 'P2025') {
      return { 
        success: false, 
        error: 'Program not found',
        duration: `${duration}ms`
      };
    }
    
    if (error.code === 'P2002') {
      return { 
        success: false, 
        error: 'A program with this code already exists',
        duration: `${duration}ms`
      };
    }
    
    return { 
      success: false, 
      error: error.message,
      duration: `${duration}ms`
    };
  }
};

/**
 * Delete program (soft delete)
 * 
 * @param {string} programId - Program ID
 * @returns {Promise<object>} - Result object
 */
const deleteProgram = async (programId, options = {}) => {
  const startTime = Date.now();
  try {
    console.log(`[Programs DB Service] Soft deleting program: ${programId}`, { force: options.force });
    
    // Check if program exists
    const existing = await prisma.program.findUnique({
      where: { id: programId }
    });
    
    if (!existing) {
      return { success: false, error: 'Program not found' };
    }
    
    // Check all dependencies (including inactive records)
    const depCheck = await checkDependencies('program', programId, PROGRAM_DEPENDENCIES);
    
    if (depCheck.hasDependencies && !options.force) {
      return {
        success: false,
        error: buildDependencyMessage(depCheck.dependencies),
        code: 'HAS_DEPENDENCIES',
        dependencies: depCheck.dependencies
      };
    }
    
    const deletedProgram = await prisma.program.update({
      where: { id: programId },
      data: { 
        isActive: false, 
        updatedAt: new Date() 
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Programs DB Service] ✅ Soft deleted program in ${duration}ms`);
    
    return { 
      success: true, 
      data: deletedProgram,
      message: depCheck.hasDependencies
        ? 'Program deactivated successfully (had dependencies)'
        : 'Program deleted successfully'
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB Service] ❌ Error deleting program:', error);
    
    if (error.code === 'P2025') {
      return { 
        success: false, 
        error: 'Program not found',
        duration: `${duration}ms`
      };
    }
    
    return { 
      success: false, 
      error: error.message,
      duration: `${duration}ms`
    };
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  console.log('[Programs DB Service] Disconnecting Prisma...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('[Programs DB Service] Disconnecting Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

export default {
  getPrograms,
  getProgramById,
  create,
  update,
  deleteProgram
};
