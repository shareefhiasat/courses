import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Classroom Availability Database Operations
 */

// Create classroom availability
async function createClassroomAvailability(data) {
  try {
    const availability = await prisma.classroomAvailability.create({
      data: {
        classroomId: data.classroomId,
        unavailableDates: data.unavailableDates || [],
        status: data.status || 'Available',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: data.createdBy || null,
      },
      include: {
        classroom: true,
      },
    });
    return { success: true, data: availability };
  } catch (error) {
    console.error('Error creating classroom availability:', error);
    return { success: false, error: error.message };
  }
}

// Get classroom availability by classroom ID
async function getClassroomAvailabilityByClassroomId(classroomId) {
  try {
    const availability = await prisma.classroomAvailability.findUnique({
      where: { classroomId: parseInt(classroomId) },
      include: {
        classroom: true,
      },
    });
    return { success: true, data: availability };
  } catch (error) {
    console.error('Error getting classroom availability:', error);
    return { success: false, error: error.message };
  }
}

// Get all classroom availabilities
async function getAllClassroomAvailabilities(filters = {}) {
  try {
    const where = {
      isActive: true,
      ...(filters.status && { status: filters.status }),
    };

    const availabilities = await prisma.classroomAvailability.findMany({
      where,
      include: {
        classroom: true,
      },
    });
    return { success: true, data: availabilities };
  } catch (error) {
    console.error('Error getting all classroom availabilities:', error);
    return { success: false, error: error.message };
  }
}

// Update classroom availability
async function updateClassroomAvailability(classroomId, data) {
  try {
    const availability = await prisma.classroomAvailability.update({
      where: { classroomId: parseInt(classroomId) },
      data: {
        ...(data.unavailableDates !== undefined && { unavailableDates: data.unavailableDates }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
      },
      include: {
        classroom: true,
      },
    });
    return { success: true, data: availability };
  } catch (error) {
    console.error('Error updating classroom availability:', error);
    return { success: false, error: error.message };
  }
}

// Delete classroom availability
async function deleteClassroomAvailability(classroomId) {
  try {
    const availability = await prisma.classroomAvailability.delete({
      where: { classroomId: parseInt(classroomId) },
    });
    return { success: true, data: availability };
  } catch (error) {
    console.error('Error deleting classroom availability:', error);
    return { success: false, error: error.message };
  }
}

// Check if classroom is available on a specific date
async function checkClassroomAvailability(classroomId, date) {
  try {
    const availability = await prisma.classroomAvailability.findUnique({
      where: { classroomId: parseInt(classroomId) },
    });

    if (!availability || !availability.isActive) {
      return { success: true, data: { available: false, reason: 'No availability record or inactive' } };
    }

    const checkDate = new Date(date);

    // Check if date is in unavailable dates
    if (availability.unavailableDates && availability.unavailableDates.length > 0) {
      const isUnavailable = availability.unavailableDates.some(
        unavailableDate => {
          const ud = new Date(unavailableDate);
          return ud.toDateString() === checkDate.toDateString();
        }
      );
      if (isUnavailable) {
        return { success: true, data: { available: false, reason: 'Date marked as unavailable' } };
      }
    }

    return { success: true, data: { available: true, availability } };
  } catch (error) {
    console.error('Error checking classroom availability:', error);
    return { success: false, error: error.message };
  }
}

// Get classroom utilization for a date range
async function getClassroomUtilization(classroomId, startDate, endDate) {
  try {
    const sessions = await prisma.flexibleScheduleSession.findMany({
      where: {
        classroomId: parseInt(classroomId),
        isActive: true,
        isCancelled: false,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        timeSlot: true,
        program: true,
      },
    });

    // Calculate total hours
    const totalHours = sessions.reduce((sum, session) => {
      if (session.timeSlot) {
        return sum + (session.timeSlot.durationMinutes / 60);
      }
      return sum;
    }, 0);

    // Group by date
    const sessionsByDate = sessions.reduce((acc, session) => {
      const dateKey = session.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(session);
      return acc;
    }, {});

    return {
      success: true,
      data: {
        totalSessions: sessions.length,
        totalHours,
        sessionsByDate,
        sessions,
      },
    };
  } catch (error) {
    console.error('Error getting classroom utilization:', error);
    return { success: false, error: error.message };
  }
}

// Get all available classrooms for a specific date and time slot
async function getAvailableClassroomsForDate(date, timeSlotId, programId) {
  try {
    // Get all classrooms for the program
    const classrooms = await prisma.classroom.findMany({
      where: {
        programId: parseInt(programId),
        isActive: true,
      },
      include: {
        classroomAvailability: true,
      },
    });

    // Check availability for each classroom
    const availableClassrooms = [];

    for (const classroom of classrooms) {
      // Check if classroom has availability record
      if (classroom.classroomAvailability && !classroom.classroomAvailability.isActive) {
        continue;
      }

      // Check if date is in unavailable dates
      if (classroom.classroomAvailability && classroom.classroomAvailability.unavailableDates) {
        const checkDate = new Date(date);
        const isUnavailable = classroom.classroomAvailability.unavailableDates.some(
          unavailableDate => {
            const ud = new Date(unavailableDate);
            return ud.toDateString() === checkDate.toDateString();
          }
        );
        if (isUnavailable) {
          continue;
        }
      }

      // Check if classroom is already booked for this date and time slot
      const existingSession = await prisma.flexibleScheduleSession.findFirst({
        where: {
          classroomId: classroom.id,
          timeSlotId: parseInt(timeSlotId),
          date: new Date(date),
          isActive: true,
          isCancelled: false,
        },
      });

      if (!existingSession) {
        availableClassrooms.push(classroom);
      }
    }

    return { success: true, data: availableClassrooms };
  } catch (error) {
    console.error('Error getting available classrooms:', error);
    return { success: false, error: error.message };
  }
}

export default {
  createClassroomAvailability,
  getClassroomAvailabilityByClassroomId,
  getAllClassroomAvailabilities,
  updateClassroomAvailability,
  deleteClassroomAvailability,
  checkClassroomAvailability,
  getClassroomUtilization,
  getAvailableClassroomsForDate,
};
