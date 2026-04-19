/**
 * Attendance Service - Backend Business Logic
 * 
 * PURPOSE: Business logic layer for attendance operations
 * ARCHITECTURE: Controller → Business Service → DB Service → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        select: { id: true }
      });
      
      if (emailUser) return emailUser.id;
    }
    
    // If no email, try display name as fallback
    if (user.displayName || user.firstName) {
      const displayName = user.displayName || `${user.firstName} ${user.lastName || ''}`.trim();
      const nameUser = await prisma.user.findFirst({
        where: { displayName },
        select: { id: true }
      });
      
      if (nameUser) return nameUser.id;
    }
    
    return null;
  } catch (error) {
    console.error('[Attendance Service] Error getting database user ID:', error);
    return null;
  }
};

// Get all attendance records with filtering
export const getAllAttendance = async (params = {}) => {
  try {
    const { userId, classId, date, subjectId, page = 1, limit = 100 } = params;
    
    const where = {};
    if (userId) where.userId = parseInt(userId);
    if (classId) where.classId = parseInt(classId);
    if (subjectId) where.subjectId = parseInt(subjectId);
    if (date) {
      // Handle date filtering - consider the whole day
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.date = {
        gte: startDate,
        lt: endDate
      };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              firstName: true,
              lastName: true,
              studentNumber: true
            }
          },
          class: {
            select: {
              id: true,
              nameEn: true,
              code: true
            }
          },
          status: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          },
          creator: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.attendance.count({ where })
    ]);
    
    return {
      success: true,
      data: attendances,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('Get all attendance error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Get attendance by ID
export const getAttendanceById = async (id) => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            code: true
          }
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });
    
    if (!attendance) {
      return {
        success: false,
        error: 'Attendance record not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: attendance
    };
  } catch (error) {
    console.error('Get attendance by ID error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Create new attendance record
export const createAttendance = async (attendanceData, user = null) => {
  try {
    const { userId, classId, status, date, notes, checkInTime, programId, subjectId } = attendanceData;
    
    // Validate required fields
    if (!userId || !classId || !status || !date) {
      return {
        success: false,
        error: 'Missing required fields: userId, classId, status, date',
        data: null
      };
    }
    
    // Find the status ID from the status code
    const attendanceStatus = await prisma.attendanceStatusTypes.findUnique({
      where: { code: status }
    });
    
    if (!attendanceStatus) {
      return {
        success: false,
        error: `Invalid attendance status: ${status}`,
        data: null
      };
    }
    
    // Check if attendance already exists for this student, class, and date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: parseInt(userId),
        classId: parseInt(classId),
        date: new Date(date)
      }
    });
    
    if (existingAttendance) {
      // Get database user ID for updatedBy field
      const updatedBy = await getDatabaseUserId(user);
      
      // Update existing record instead of creating duplicate
      const updatedAttendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          statusId: attendanceStatus.id,
          notes: notes || null,
          updatedBy: updatedBy || null,
          updatedAt: new Date(),
          programId: programId ? parseInt(programId) : null,
          subjectId: subjectId ? parseInt(subjectId) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              firstName: true,
              lastName: true,
              studentNumber: true
            }
          },
          class: {
            select: {
              id: true,
              nameEn: true,
              code: true
            }
          },
          status: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          }
        }
      });
      
      return {
        success: true,
        data: updatedAttendance,
        message: 'Attendance updated successfully'
      };
    }
    
    // Get database user ID for createdBy field
    const createdBy = await getDatabaseUserId(user);
    
    // Create new attendance record
    const newAttendance = await prisma.attendance.create({
      data: {
        userId: parseInt(userId),
        classId: parseInt(classId),
        statusId: attendanceStatus.id,
        date: new Date(date),
        notes: notes || null,
        createdBy: createdBy || null,
        programId: programId ? parseInt(programId) : null,
        subjectId: subjectId ? parseInt(subjectId) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            code: true
          }
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: newAttendance,
      message: 'Attendance marked successfully'
    };
  } catch (error) {
    console.error('Create attendance error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Update attendance record
export const updateAttendance = async (id, updateData, user = null) => {
  try {
    const { status, notes, programId, subjectId } = updateData;
    
    // Find the attendance record
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingAttendance) {
      return {
        success: false,
        error: 'Attendance record not found',
        data: null
      };
    }
    
    // Prepare update data
    const data = {
      updatedBy: user?.id ? (isNaN(parseInt(user.id)) ? null : parseInt(user.id)) : null,
      updatedAt: new Date()
    };
    
    if (status) {
      // Find the status ID from the status code
      const attendanceStatus = await prisma.attendanceStatusTypes.findUnique({
        where: { code: status }
      });
      
      if (!attendanceStatus) {
        return {
          success: false,
          error: `Invalid attendance status: ${status}`,
          data: null
        };
      }
      
      data.statusId = attendanceStatus.id;
    }
    
    if (notes !== undefined) {
      data.notes = notes;
    }
    
    if (programId !== undefined) {
      data.programId = programId ? parseInt(programId) : null;
    }
    
    if (subjectId !== undefined) {
      data.subjectId = subjectId ? parseInt(subjectId) : null;
    }
    
    const updatedAttendance = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            code: true
          }
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: updatedAttendance,
      message: 'Attendance updated successfully'
    };
  } catch (error) {
    console.error('Update attendance error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Delete attendance record
export const deleteAttendance = async (id, user = null) => {
  try {
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingAttendance) {
      return {
        success: false,
        error: 'Attendance record not found',
        data: null
      };
    }
    
    await prisma.attendance.delete({
      where: { id: parseInt(id) }
    });
    
    return {
      success: true,
      data: { id: parseInt(id) },
      message: 'Attendance deleted successfully'
    };
  } catch (error) {
    console.error('Delete attendance error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Get attendance statistics for a class
export const getClassAttendanceStats = async (classId, date) => {
  try {
    const where = { classId: parseInt(classId) };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.date = {
        gte: startDate,
        lt: endDate
      };
    }
    
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        status: {
          select: {
            code: true,
            nameEn: true
          }
        }
      }
    });
    
    const stats = {
      total: attendances.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      percentage: 0
    };
    
    attendances.forEach(attendance => {
      switch (attendance.status.code) {
        case 'PRESENT':
          stats.present++;
          break;
        case 'ABSENT':
          stats.absent++;
          break;
        case 'LATE':
          stats.late++;
          break;
        case 'EXCUSED':
        case 'SICK_LEAVE':
        case 'EARLY_DEPARTURE':
          stats.excused++;
          break;
      }
    });
    
    stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Get class attendance stats error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export const attendanceService = {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getClassAttendanceStats
};
