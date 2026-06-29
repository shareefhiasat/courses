import prisma from '../db/prismaClient.js';


/**
 * Get database user ID from Keycloak user object
 *
 * @param {object} user - User object from request
 * @returns {Promise<number|null>} - Database user ID or null
 */
const getDatabaseUserId = async (user) => {
  if (!user) return null;

  try {
    // Try to find user by email (primary method)
    if (user.email) {
      const emailUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });

      if (emailUser) return emailUser.id;
    }

    // If no email, try display name as fallback
    if (user.displayName || user.firstName) {
      const displayName =
        user.displayName || `${user.firstName} ${user.lastName || ""}`.trim();
      const nameUser = await prisma.user.findFirst({
        where: { displayName },
        select: { id: true },
      });

      if (nameUser) return nameUser.id;
    }

    return null;
  } catch (error) {
    console.error(
      "[Standup Attendance Service] Error getting database user ID:",
      error,
    );
    return null;
  }
};

// Create standup attendance record
export const createStandupAttendance = async (
  userId,
  status,
  date,
  notes = null,
  user = null,
  programId = null,
) => {
  try {
    // Find the status ID from the status code
    const attendanceStatus = await prisma.attendanceStatusTypes.findUnique({
      where: { code: status },
    });

    if (!attendanceStatus) {
      return {
        success: false,
        error: "Invalid attendance status",
        data: null,
      };
    }

    // Check if standup attendance already exists for this user and date
    const existingAttendance = await prisma.standupAttendance.findFirst({
      where: {
        userId: parseInt(userId),
        date: new Date(date),
      },
    });

    if (existingAttendance) {
      // Get database user ID for updatedBy field
      const updatedBy = await getDatabaseUserId(user);

      // Update existing record instead of creating duplicate
      const updatedAttendance = await prisma.standupAttendance.update({
        where: { id: existingAttendance.id },
        data: {
          statusId: attendanceStatus.id,
          notes: notes || null,
          updatedBy: updatedBy || null,
          updatedAt: new Date(),
          programId: programId ? parseInt(programId) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
          status: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedAttendance,
        message: "Standup attendance updated successfully",
      };
    }

    // Get database user ID for createdBy field
    const createdBy = await getDatabaseUserId(user);

    // Create new standup attendance record
    const newAttendance = await prisma.standupAttendance.create({
      data: {
        userId: parseInt(userId),
        statusId: attendanceStatus.id,
        date: new Date(date),
        notes: notes || null,
        createdBy: createdBy || null,
        programId: programId ? parseInt(programId) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
          },
        },
      },
    });

    return {
      success: true,
      data: newAttendance,
      message: "Standup attendance marked successfully",
    };
  } catch (error) {
    console.error("Create standup attendance error:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// Get standup attendance by user and date
export const getStandupAttendanceByUserAndDate = async (userId, date) => {
  try {
    const attendance = await prisma.standupAttendance.findFirst({
      where: {
        userId: parseInt(userId),
        date: new Date(date),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
          },
        },
      },
    });

    return {
      success: true,
      data: attendance,
    };
  } catch (error) {
    console.error("Get standup attendance error:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// Get all standup attendance for a date
export const getAllStandupAttendanceByDate = async (date) => {
  try {
    const attendances = await prisma.standupAttendance.findMany({
      where: {
        date: new Date(date),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
          },
        },
      },
    });

    return {
      success: true,
      data: attendances,
    };
  } catch (error) {
    console.error("Get all standup attendance error:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// Get all standup attendance for a class and date
export const getStandupAttendanceByClassAndDate = async (classId, date) => {
  try {
    const attendances = await prisma.standupAttendance.findMany({
      where: {
        date: new Date(date),
        user: {
          enrollments: {
            some: {
              classId: parseInt(classId),
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
          },
        },
      },
    });

    return {
      success: true,
      data: attendances,
    };
  } catch (error) {
    console.error("Get standup attendance by class and date error:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// Get all standup attendance for a user
export const getStandupAttendanceByUser = async (userId) => {
  try {
    const attendances = await prisma.standupAttendance.findMany({
      where: {
        userId: parseInt(userId),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return {
      success: true,
      data: attendances,
    };
  } catch (error) {
    console.error("Get standup attendance by user error:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// Get all standup attendance for a program and date
export const getStandupAttendanceByProgramAndDate = async (programId, date) => {
  try {
    const attendances = await prisma.standupAttendance.findMany({
      where: {
        programId: parseInt(programId),
        date: new Date(date),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            studentNumber: true,
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
          },
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
          },
        },
      },
    });

    return {
      success: true,
      data: attendances,
    };
  } catch (error) {
    console.error("Get standup attendance by program and date error:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// Get all standup attendance for a program within a date range
export const getStandupAttendanceByProgramForDateRange = async (programId, startDate, endDate) => {
  try {
    const attendances = await prisma.standupAttendance.findMany({
      where: {
        programId: parseInt(programId),
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      success: true,
      data: attendances,
    };
  } catch (error) {
    console.error("Get standup attendance by program for date range error:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// Delete standup attendance by ID
export const deleteStandupAttendance = async (id) => {
  try {
    const deletedAttendance = await prisma.standupAttendance.delete({
      where: { id: parseInt(id) },
    });

    return {
      success: true,
      data: deletedAttendance,
      message: "Standup attendance deleted successfully",
    };
  } catch (error) {
    console.error("Delete standup attendance error:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

export const standupAttendanceService = {
  createStandupAttendance,
  getStandupAttendanceByUserAndDate,
  getAllStandupAttendanceByDate,
  getStandupAttendanceByClassAndDate,
  getStandupAttendanceByUser,
  getStandupAttendanceByProgramAndDate,
  getStandupAttendanceByProgramForDateRange,
  deleteStandupAttendance,
};
