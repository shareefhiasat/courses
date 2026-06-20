/**
 * Users Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for user operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { getDatabaseUserId, findUserByParam } from '../utils/database/userResolver.js';

const prisma = new PrismaClient();

/**
 * GET /api/v1/users/me
 * Get current user profile from database (merged with auth context)
 */
export const getCurrentUserController = async (req, res) => {
  try {
    const authUser = req.user;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const dbUser = authUser.dbId
      ? await prisma.user.findUnique({
          where: { id: authUser.dbId },
          select: {
            id: true,
            keycloakId: true,
            email: true,
            displayName: true,
            displayNameAr: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            realName: true,
            studentNumber: true,
          }
        })
      : null;

    return res.json({
      success: true,
      data: {
        id: dbUser?.id ?? authUser.dbId,
        keycloakId: authUser.keycloakId,
        email: dbUser?.email ?? authUser.email,
        displayName: dbUser?.displayName ?? authUser.displayName,
        displayNameAr: dbUser?.displayNameAr ?? null,
        firstName: dbUser?.firstName ?? authUser.firstName,
        lastName: dbUser?.lastName ?? authUser.lastName,
        firstNameAr: dbUser?.firstNameAr ?? null,
        lastNameAr: dbUser?.lastNameAr ?? null,
        realName: dbUser?.realName ?? null,
        studentNumber: dbUser?.studentNumber ?? null,
        dbId: authUser.dbId
      }
    });
  } catch (error) {
    console.error('[getCurrentUserController] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/users
 * Get all users (admin only)
 */
export const listUsersController = async (req, res) => {
  try {
    const { studentsOnly, excludeStudents, search, limit: limitStr, max: maxStr } = req.query;
    const parsedLimit = parseInt(maxStr || limitStr, 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5000;

    console.log('[listUsersController] Query params:', { studentsOnly, excludeStudents, search, limit });

    let where = { isActive: true };

    // Build search conditions
    const searchConditions = search ? [
      { displayName: { contains: search, mode: 'insensitive' } },
      { displayNameAr: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { firstNameAr: { contains: search, mode: 'insensitive' } },
      { lastNameAr: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ] : [];

    if (searchConditions.length > 0) {
      where.OR = searchConditions;
    }

    console.log('[listUsersController] Prisma where clause:', JSON.stringify(where, null, 2));

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        displayNameAr: true,
        firstName: true,
        lastName: true,
        firstNameAr: true,
        lastNameAr: true,
        realName: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        roleAssignments: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        }
      },
      take: limit,
      orderBy: { displayName: 'asc' },
    });

    console.log('[listUsersController] Users fetched from DB:', users.length);
    console.log('[listUsersController] Sample users:', JSON.stringify(users.slice(0, 3), null, 2));

    // Client-side filtering for studentsOnly/excludeStudents
    let filteredUsers = users;
    
    if (studentsOnly === 'true') {
      filteredUsers = users.filter(user => {
        const hasStudentRole = user.roleAssignments?.some(ra => ra.role?.code === 'student');
        return hasStudentRole;
      });
      console.log('[listUsersController] After studentsOnly filter:', filteredUsers.length);
    }

    if (excludeStudents === 'true') {
      filteredUsers = users.filter(user => {
        const hasStudentRole = user.roleAssignments?.some(ra => ra.role?.code === 'student');
        return !hasStudentRole;
      });
      console.log('[listUsersController] After excludeStudents filter:', filteredUsers.length);
    }

    res.status(200).json({
      success: true,
      data: filteredUsers,
      total: filteredUsers.length
    });
  } catch (error) {
    console.error('Error in listUsersController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/users/:id
 * Get user by ID
 */
export const getUserByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await findUserByParam(id, {
        id: true,
        displayName: true,
        displayNameAr: true,
        firstName: true,
        lastName: true,
        firstNameAr: true,
        lastNameAr: true,
        realName: true,
        email: true,
        isActive: true,
        keycloakId: true,
        studentNumber: true,
        sequence: true,
        roleAssignments: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getUserByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/users
 * Create new user (admin only)
 */
export const createUserController = async (req, res) => {
  try {
    const { displayName, realName, firstName: firstNameParam, lastName: lastNameParam, firstNameAr, lastNameAr, displayNameAr, email, role, studentNumber, sequence } = req.body;
    
    // Import Keycloak service
    const { createUser, setUserRoles } = await import('../services/keycloakAdminService.js');
    
    // Get current user info from auth middleware
    const currentUser = req.user;
    
    // Find the current user's database ID from their Keycloak ID
    let currentUserId = null;
    if (currentUser?.id) {
      const currentUserRecord = await prisma.user.findUnique({
        where: { keycloakId: currentUser.id },
        select: { id: true }
      });
      currentUserId = currentUserRecord?.id || null;
    } else {
      // For testing: use Shareef's user ID (1) when no auth
      currentUserId = 1;
    }
    
    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    
    // Helper function to split name into firstName and lastName
    const splitName = (fullName) => {
      if (!fullName) return { firstName: '', lastName: '' };
      
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' };
      } else if (parts.length === 2) {
        return { firstName: parts[0], lastName: parts[1] };
      } else {
        // For 3+ parts: first word as firstName, rest as lastName
        return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
      }
    };

    // Get the best name for Keycloak
    const nameForSplit = realName || displayName || '';
    const { firstName, lastName } = splitName(nameForSplit);
    
    // Use explicit params first, then fallback to split names
    const finalFirstName = firstNameParam || firstName || '';
    const finalLastName = lastNameParam || lastName || '';
    
    // Create user in Keycloak
    const keycloakUser = await createUser({
      email: email,
      firstName: finalFirstName,
      lastName: finalLastName,
      enabled: true,
      temporaryPassword: temporaryPassword
    });
    
    if (!keycloakUser.success) {
      throw new Error(keycloakUser.error || 'Failed to create user in Keycloak');
    }
    
    // Map role to Keycloak role
    const roleMapping = {
      'super_admin': 'super_admin',
      'admin': 'admin', 
      'instructor': 'instructor',
      'hr': 'hr',
      'student': 'student'
    };
    
    const keycloakRole = roleMapping[role] || 'student';
    
    // Assign role in Keycloak
    await setUserRoles(keycloakUser.data.id, [keycloakRole]);
    
    // Get role ID from database
    const roleRecord = await prisma.userRoles.findUnique({
      where: { code: keycloakRole }
    });
    
    if (!roleRecord) {
      throw new Error(`Role ${keycloakRole} not found in database`);
    }
    
    // Also create user in PostgreSQL for tracking
    const user = await prisma.user.create({
      data: {
        displayName,
        displayNameAr: displayNameAr || null,
        realName,
        firstName: finalFirstName,
        lastName: finalLastName,
        firstNameAr: firstNameAr || null,
        lastNameAr: lastNameAr || null,
        email,
        studentNumber: studentNumber || null,
        sequence: sequence ? parseInt(sequence, 10) : null,
        isActive: true,
        keycloakId: keycloakUser.data.id,
        createdBy: currentUserId
      }
    });
    
    // Create role assignment
    await prisma.userRoleAssignment.create({
      data: {
        userId: user.id,
        roleId: roleRecord.id,
        assignedBy: currentUserId
      }
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...user,
        temporaryPassword: temporaryPassword,
        keycloakId: keycloakUser.data.id
      },
      message: 'User created successfully in Keycloak and database'
    });
  } catch (error) {
    console.error('Error in createUserController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/users/:id
 * Update user (admin only)
 */
export const updateUserController = async (req, res) => {
  console.log('🚀 updateUserController called!', { 
    method: req.method, 
    url: req.url, 
    params: req.params,
    bodyKeys: Object.keys(req.body)
  });
  
  try {
    const { id } = req.params;
    const { displayName, realName, firstName, lastName, firstNameAr, lastNameAr, displayNameAr, email, roles, isActive, studentNumber, sequence } = req.body;
    
    // Import Keycloak services for role sync
    const { setUserRoles } = await import('../services/keycloakAdminService.js');
    
    // Get current user info from auth middleware
    const currentUser = req.user;
    
    // Find the current user's database ID from their Keycloak ID
    let currentUserId = null;
    console.log('🔍 Auth Debug:', { currentUser: req.user });
    
    if (currentUser?.id) {
      console.log('🔍 Looking up user with Keycloak ID:', currentUser.id);
      const currentUserRecord = await prisma.user.findUnique({
        where: { keycloakId: currentUser.id },
        select: { id: true }
      });
      console.log('🔍 Database lookup result:', currentUserRecord);
      currentUserId = currentUserRecord?.id || null;
      
      if (!currentUserId) {
        console.log('⚠️ User not found in database with Keycloak ID:', currentUser.id);
      }
    } else {
      // For testing: use Shareef's user ID (1) when no auth
      currentUserId = 1;
      console.log('🔧 Using fallback user ID: 1');
    }
    
    const existingUser = await findUserByParam(id, { id: true, keycloakId: true });
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const targetUserId = existingUser.id;
    
    // Update user in PostgreSQL
    console.log('🔧 Update Debug:', {
      currentUserId,
      updatedByValue: currentUserId,
      userId: targetUserId
    });
    
    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        displayName,
        displayNameAr,
        realName,
        firstName,
        lastName,
        firstNameAr,
        lastNameAr,
        email,
        isActive,
        studentNumber,
        sequence: sequence ? parseInt(sequence, 10) : null,
        updatedBy: currentUserId
      }
    });
    
    console.log('✅ User Updated:', {
      userId: user.id,
      updatedBy: user.updatedBy
    });
    
    // Handle multi-role assignments
    if (roles && Array.isArray(roles)) {
      // Delete existing role assignments
      await prisma.userRoleAssignment.deleteMany({
        where: { userId: targetUserId }
      });
      
      // Create new role assignments
      for (const roleCode of roles) {
        // Find role by code
        const role = await prisma.userRoles.findFirst({
          where: { 
            code: roleCode,
            isActive: true 
          }
        });
        
        if (role) {
          await prisma.userRoleAssignment.create({
            data: {
              userId: targetUserId,
              roleId: role.id,
              assignedAt: new Date(),
              assignedBy: 1 // TODO: Get actual admin user ID
            }
          });
        }
      }
    }
    
    // Sync roles to Keycloak if user has Keycloak ID
    if (existingUser.keycloakId && roles && roles.length > 0) {
      const keycloakResult = await setUserRoles({
        keycloakUserId: existingUser.keycloakId,
        roles: roles
      });
      
      if (!keycloakResult.success) {
        console.warn('Failed to sync roles to Keycloak:', keycloakResult.error);
      }
    }
    
    res.status(200).json({
      success: true,
      data: user,
      message: existingUser.keycloakId ? 'User updated successfully in database and Keycloak' : 'User updated successfully in database'
    });
  } catch (error) {
    console.error('Error in updateUserController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/users/:id/password
 * Set user password (admin only)
 */
export const setPasswordController = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, temporary = false } = req.body;
    
    // Convert string ID to integer for Prisma
    const userId = parseInt(id, 10);
    
    // Import Keycloak admin service
    const { setUserPassword: setKeycloakPassword } = await import('../services/keycloakAdminService.js');
    
    // Find user in database to get Keycloak ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { keycloakId: true, email: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (!user.keycloakId) {
      return res.status(400).json({
        success: false,
        error: 'User not found in Keycloak'
      });
    }
    
    // Set password in Keycloak
    const result = await setKeycloakPassword({
      keycloakUserId: user.keycloakId,
      newPassword: newPassword,
      temporary: temporary
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to set password in Keycloak');
    }
    
    res.status(200).json({
      success: true,
      message: temporary ? 'Temporary password set successfully in Keycloak' : 'Password set successfully in Keycloak'
    });
  } catch (error) {
    console.error('Error in setPasswordController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/users/:id/enabled
 * Set user enabled status (admin only)
 */
export const setEnabledController = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    
    // Convert string ID to integer for Prisma
    const userId = parseInt(id, 10);
    
    // Import Keycloak admin service
    const { setUserEnabled: setKeycloakUserEnabled } = await import('../services/keycloakAdminService.js');
    
    // Find user in database to get Keycloak ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { keycloakId: true, email: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (!user.keycloakId) {
      return res.status(400).json({
        success: false,
        error: 'User not found in Keycloak'
      });
    }
    
    // Update status in Keycloak
    const keycloakResult = await setKeycloakUserEnabled({
      keycloakUserId: user.keycloakId,
      enabled: enabled
    });
    
    if (!keycloakResult.success) {
      throw new Error(keycloakResult.error || 'Failed to update user status in Keycloak');
    }
    
    // Update status in database as well
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: enabled }
    });
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: `User ${enabled ? 'enabled' : 'disabled'} successfully in Keycloak and database`
    });
  } catch (error) {
    console.error('Error in setEnabledController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/users/:id
 * Delete user (admin only)
 */
export const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteUserController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/users/instructors
 * Get all users with instructor role
 */
export const getInstructorsController = async (req, res) => {
  try {
    // Find the INSTRUCTOR role
    const instructorRole = await prisma.userRoles.findFirst({
      where: { code: 'instructor' }
    });
    
    if (!instructorRole) {
      return res.status(404).json({
        success: false,
        error: 'Instructor role not found'
      });
    }
    
    // Get all users with instructor role
    const instructors = await prisma.user.findMany({
      where: {
        roleAssignments: {
          some: { roleId: instructorRole.id }
        },
        isActive: true
      },
      select: {
        id: true,
        displayName: true,
        firstName: true,
        lastName: true,
        email: true,
        roleAssignments: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        }
      },
      orderBy: {
        displayName: 'asc'
      }
    });
    
    res.status(200).json({
      success: true,
      data: instructors
    });
    
  } catch (error) {
    console.error('Error in getInstructorsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/users/programs
 * Get all programs (for dropdown)
 */
export const getProgramsController = async (req, res) => {
  try {
    const programs = await prisma.program.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameAr: true
      },
      orderBy: {
        nameEn: 'asc'
      }
    });
    
    res.status(200).json({
      success: true,
      data: programs
    });
    
  } catch (error) {
    console.error('Error in getProgramsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/users/subjects
 * Get all subjects (for dropdown)
 */
export const getSubjectsController = async (req, res) => {
  try {
    const { programId } = req.query;
    
    const where = {
      isActive: true
    };
    
    if (programId) {
      where.programId = parseInt(programId);
    }
    
    const subjects = await prisma.subject.findMany({
      where,
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameAr: true,
        programId: true,
        program: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        }
      },
      orderBy: {
        nameEn: 'asc'
      }
    });
    
    res.status(200).json({
      success: true,
      data: subjects
    });
    
  } catch (error) {
    console.error('Error in getSubjectsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export default {
  getInstructorsController,
  getProgramsController,
  getSubjectsController
};
