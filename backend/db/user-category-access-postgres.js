import prisma from './prismaClient.js';

/**
 * User Category Access Database Operations
 */

// Create user category access
async function createUserCategoryAccess(data) {
  try {
    const existing = await prisma.userCategoryAccess.findFirst({
      where: {
        userId: data.userId,
        categoryId: data.categoryId,
        programId: data.programId || null,
        subjectId: data.subjectId || null,
        classId: data.classId || null,
        isActive: true,
      },
    });
    if (existing) {
      return { success: false, error: 'Duplicate access row for this scope' };
    }

    const access = await prisma.userCategoryAccess.create({
      data: {
        userId: data.userId,
        categoryId: data.categoryId,
        roleId: data.roleId || null,
        programId: data.programId || null,
        subjectId: data.subjectId || null,
        classId: data.classId || null,
        canView: data.canView !== undefined ? data.canView : true,
        canManage: data.canManage !== undefined ? data.canManage : false,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        user: true,
        category: true,
        program: true,
        subject: true,
        class: true,
        creator: true,
        updater: true,
      },
    });
    return { success: true, data: access };
  } catch (error) {
    console.error('Error creating user category access:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Get user category access by ID
async function getUserCategoryAccessById(id) {
  try {
    const access = await prisma.userCategoryAccess.findUnique({
      where: { id },
      include: {
        user: true,
        category: true,
        program: true,
        subject: true,
        class: true,
        creator: true,
        updater: true,
      },
    });
    return { success: true, data: access };
  } catch (error) {
    console.error('Error getting user category access:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Get all category access for a user
async function getUserCategoryAccessByUserId(userId) {
  try {
    const accesses = await prisma.userCategoryAccess.findMany({
      where: {
        userId: parseInt(userId),
        isActive: true,
      },
      include: {
        user: true,
        category: true,
        program: true,
        subject: true,
        class: true,
        creator: true,
        updater: true,
      },
    });
    return { success: true, data: accesses };
  } catch (error) {
    console.error('Error getting user category access:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Get all users with access to a category
async function getUsersByCategoryAccess(categoryId) {
  try {
    const accesses = await prisma.userCategoryAccess.findMany({
      where: {
        categoryId: parseInt(categoryId),
        isActive: true,
      },
      include: {
        user: true,
        category: true,
        program: true,
        subject: true,
        class: true,
        creator: true,
        updater: true,
      },
    });
    return { success: true, data: accesses };
  } catch (error) {
    console.error('Error getting users by category access:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Get all user category accesses
async function getAllUserCategoryAccesses(filters = {}) {
  try {
    const where = {
      isActive: true,
      ...(filters.userId && { userId: parseInt(filters.userId) }),
      ...(filters.categoryId && { categoryId: parseInt(filters.categoryId) }),
      ...(filters.roleId && { roleId: parseInt(filters.roleId) }),
      ...(filters.programId && { programId: parseInt(filters.programId) }),
      ...(filters.subjectId && { subjectId: parseInt(filters.subjectId) }),
      ...(filters.classId && { classId: parseInt(filters.classId) }),
      ...(filters.canView !== undefined && { canView: filters.canView }),
      ...(filters.canManage !== undefined && { canManage: filters.canManage }),
    };

    const accesses = await prisma.userCategoryAccess.findMany({
      where,
      include: {
        user: true,
        category: true,
        program: true,
        subject: true,
        class: true,
        creator: true,
        updater: true,
      },
    });
    return { success: true, data: accesses };
  } catch (error) {
    console.error('Error getting all user category accesses:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Update user category access
async function updateUserCategoryAccess(id, data) {
  try {
    const access = await prisma.userCategoryAccess.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.userId !== undefined && { userId: data.userId }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.roleId !== undefined && { roleId: data.roleId }),
        ...(data.programId !== undefined && { programId: data.programId }),
        ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
        ...(data.classId !== undefined && { classId: data.classId }),
        ...(data.canView !== undefined && { canView: data.canView }),
        ...(data.canManage !== undefined && { canManage: data.canManage }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
      },
      include: {
        user: true,
        category: true,
        program: true,
        subject: true,
        class: true,
        creator: true,
        updater: true,
      },
    });
    return { success: true, data: access };
  } catch (error) {
    console.error('Error updating user category access:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Delete user category access
async function deleteUserCategoryAccess(id) {
  try {
    const access = await prisma.userCategoryAccess.delete({
      where: { id },
    });
    return { success: true, data: access };
  } catch (error) {
    console.error('Error deleting user category access:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Check if user has access to a category
async function checkUserCategoryAccess(userId, categoryId, permission = 'view') {
  try {
    const access = await prisma.userCategoryAccess.findFirst({
      where: {
        userId: parseInt(userId),
        categoryId: parseInt(categoryId),
        isActive: true,
      },
    });

    if (!access) {
      return { success: true, data: { hasAccess: false, reason: 'No access record found' } };
    }

    if (permission === 'view' && !access.canView) {
      return { success: true, data: { hasAccess: false, reason: 'View permission not granted' } };
    }

    if (permission === 'manage' && !access.canManage) {
      return { success: true, data: { hasAccess: false, reason: 'Manage permission not granted' } };
    }

    return { success: true, data: { hasAccess: true, access } };
  } catch (error) {
    console.error('Error checking user category access:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Get categories accessible to a user
async function getAccessibleCategoriesForUser(userId) {
  try {
    const accesses = await prisma.userCategoryAccess.findMany({
      where: {
        userId: parseInt(userId),
        isActive: true,
        canView: true,
      },
      include: {
        category: true,
      },
    });

    const categories = accesses.map(access => access.category);
    return { success: true, data: categories };
  } catch (error) {
    console.error('Error getting accessible categories:', error);
    return { success: false, error: 'Internal server error' };
  }
}

async function resolveClassIdsForAccess(access) {
  const where = { isActive: true };
  if (access.classId) {
    where.id = access.classId;
  } else if (access.subjectId) {
    where.subjectId = access.subjectId;
  } else if (access.programId) {
    where.programId = access.programId;
  } else if (access.categoryId) {
    where.program = { categoryId: access.categoryId };
  }
  const rows = await prisma.class.findMany({ where, select: { id: true, programId: true } });
  return rows;
}

async function getUcaActivityStats(userId) {
  try {
    const accesses = await prisma.userCategoryAccess.findMany({
      where: { userId: parseInt(userId, 10), isActive: true },
    });

    const stats = await Promise.all(accesses.map(async (access) => {
      const classRows = await resolveClassIdsForAccess(access);
      const classIds = classRows.map((r) => r.id);
      const programIds = [...new Set(classRows.map((r) => r.programId).filter(Boolean))];

      if (!classIds.length) {
        return {
          accessId: access.id,
          classes: 0,
          workflows: 0,
          attendances: 0,
          sessions: 0,
        };
      }

      const [workflows, attendances, sessions] = await Promise.all([
        prisma.workflowDocument.count({ where: { classId: { in: classIds } } }),
        prisma.attendance.count({ where: { classId: { in: classIds } } }),
        prisma.scheduledSession.count({
          where: { classId: { in: classIds }, isActive: true, deletedAt: null },
        }),
      ]);

      return {
        accessId: access.id,
        classes: classIds.length,
        workflows,
        attendances,
        sessions,
      };
    }));

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting UCA activity stats:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Get programs accessible to a user based on category access
async function getAccessibleProgramsForUser(userId) {
  try {
    const accesses = await prisma.userCategoryAccess.findMany({
      where: {
        userId: parseInt(userId),
        isActive: true,
        canView: true,
      },
      include: {
        category: {
          include: {
            programs: true,
          },
        },
      },
    });

    const programs = [];
    accesses.forEach((access) => {
      if (access.category?.programs) {
        programs.push(...access.category.programs);
      }
    });

    const uniquePrograms = programs.filter((program, index, self) =>
      index === self.findIndex((p) => p.id === program.id),
    );

    return { success: true, data: uniquePrograms };
  } catch (error) {
    console.error('Error getting accessible programs:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Bulk assign category access to users
async function bulkAssignCategoryAccess(assignments) {
  try {
    const results = await prisma.userCategoryAccess.createMany({
      data: assignments.map(assignment => ({
        userId: assignment.userId,
        categoryId: assignment.categoryId,
        roleId: assignment.roleId || null,
        canView: assignment.canView !== undefined ? assignment.canView : true,
        canManage: assignment.canManage !== undefined ? assignment.canManage : false,
        isActive: assignment.isActive !== undefined ? assignment.isActive : true,
      })),
      skipDuplicates: true,
    });
    return { success: true, data: { count: results.count } };
  } catch (error) {
    console.error('Error bulk assigning category access:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export default {
  createUserCategoryAccess,
  getUserCategoryAccessById,
  getUserCategoryAccessByUserId,
  getUsersByCategoryAccess,
  getAllUserCategoryAccesses,
  updateUserCategoryAccess,
  deleteUserCategoryAccess,
  checkUserCategoryAccess,
  getAccessibleCategoriesForUser,
  getAccessibleProgramsForUser,
  getUcaActivityStats,
  bulkAssignCategoryAccess,
};
