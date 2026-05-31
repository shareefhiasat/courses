import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Instructor Availability Database Operations
 */

// Create instructor availability
async function createInstructorAvailability(data) {
  try {
    const availability = await prisma.instructorAvailability.create({
      data: {
        instructorUserId: data.instructorUserId,
        availableDays: data.availableDays || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
        unavailableDates: data.unavailableDates || [],
        maxSessionsPerDay: data.maxSessionsPerDay || 3,
        maxHoursPerWeek: data.maxHoursPerWeek || null,
        status: data.status || 'Active',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: data.createdBy || null,
      },
      include: {
        instructor: true,
      },
    });
    return { success: true, data: availability };
  } catch (error) {
    console.error('Error creating instructor availability:', error);
    return { success: false, error: error.message };
  }
}

// Get instructor availability by user ID
async function getInstructorAvailabilityByUserId(instructorUserId) {
  try {
    const availability = await prisma.instructorAvailability.findUnique({
      where: { instructorUserId: parseInt(instructorUserId) },
      include: {
        instructor: true,
      },
    });
    return { success: true, data: availability };
  } catch (error) {
    console.error('Error getting instructor availability:', error);
    return { success: false, error: error.message };
  }
}

// Get all instructor availabilities
async function getAllInstructorAvailabilities(filters = {}) {
  try {
    const where = {
      isActive: true,
      ...(filters.status && { status: filters.status }),
    };

    const availabilities = await prisma.instructorAvailability.findMany({
      where,
      include: {
        instructor: true,
      },
    });
    return { success: true, data: availabilities };
  } catch (error) {
    console.error('Error getting all instructor availabilities:', error);
    return { success: false, error: error.message };
  }
}

// Update instructor availability
async function updateInstructorAvailability(instructorUserId, data) {
  try {
    const availability = await prisma.instructorAvailability.update({
      where: { instructorUserId: parseInt(instructorUserId) },
      data: {
        ...(data.availableDays !== undefined && { availableDays: data.availableDays }),
        ...(data.unavailableDates !== undefined && { unavailableDates: data.unavailableDates }),
        ...(data.maxSessionsPerDay !== undefined && { maxSessionsPerDay: data.maxSessionsPerDay }),
        ...(data.maxHoursPerWeek !== undefined && { maxHoursPerWeek: data.maxHoursPerWeek }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
      },
      include: {
        instructor: true,
      },
    });
    return { success: true, data: availability };
  } catch (error) {
    console.error('Error updating instructor availability:', error);
    return { success: false, error: error.message };
  }
}

// Delete instructor availability
async function deleteInstructorAvailability(instructorUserId) {
  try {
    const availability = await prisma.instructorAvailability.delete({
      where: { instructorUserId: parseInt(instructorUserId) },
    });
    return { success: true, data: availability };
  } catch (error) {
    console.error('Error deleting instructor availability:', error);
    return { success: false, error: error.message };
  }
}

// Check if instructor is available on a specific date
async function checkInstructorAvailability(instructorUserId, date) {
  try {
    const availability = await prisma.instructorAvailability.findUnique({
      where: { instructorUserId: parseInt(instructorUserId) },
    });

    if (!availability || !availability.isActive) {
      return { success: true, data: { available: false, reason: 'No availability record or inactive' } };
    }

    const checkDate = new Date(date);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][checkDate.getDay()];

    // Check if day is available
    if (!availability.availableDays.includes(dayName)) {
      return { success: true, data: { available: false, reason: 'Day not in available days' } };
    }

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
    console.error('Error checking instructor availability:', error);
    return { success: false, error: error.message };
  }
}

// Get instructor workload for a date range
async function getInstructorWorkload(instructorUserId, startDate, endDate) {
  try {
    const sessions = await prisma.flexibleScheduleSession.findMany({
      where: {
        instructorUserId: parseInt(instructorUserId),
        isActive: true,
        isCancelled: false,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        timeSlot: true,
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
    console.error('Error getting instructor workload:', error);
    return { success: false, error: error.message };
  }
}

export default {
  createInstructorAvailability,
  getInstructorAvailabilityByUserId,
  getAllInstructorAvailabilities,
  updateInstructorAvailability,
  deleteInstructorAvailability,
  checkInstructorAvailability,
  getInstructorWorkload,
};
