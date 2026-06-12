import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

/**
 * Find available instructors for a given time slot
 * Returns instructors who are:
 * 1. Available according to their availability schedule
 * 2. Not already scheduled at this time
 * 3. Optionally qualified for the subject/class
 */
export const findAvailableInstructors = async (classId, startDateTime, endDateTime, subjectId = null) => {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][start.getDay()];
  const startTime = start.toTimeString().substring(0, 5);
  const endTime = end.toTimeString().substring(0, 5);

  // Get all instructors with availability on this day
  const availableInstructors = await prisma.instructorAvailability.findMany({
    where: {
      isActive: true,
      startDate: { lte: start },
      endDate: { gte: start },
      dayOfWeek: { has: dayOfWeek }
    },
    include: {
      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          email: true,
          instructorClasses: {
            where: { subjectId: subjectId ? parseInt(subjectId) : undefined },
            select: { id: true, subjectId: true }
          }
        }
      },
      slots: true
    }
  });

  // Filter instructors who have matching time slots
  const instructorsWithSlots = availableInstructors.filter(avail => {
    return avail.slots.some(slot => 
      slot.startTime <= startTime && slot.endTime >= endTime
    );
  });

  // Check each instructor for conflicts
  const results = await Promise.all(
    instructorsWithSlots.map(async (avail) => {
      const hasConflict = await prisma.scheduledSession.findFirst({
        where: {
          instructorId: avail.instructor.id,
          isActive: true,
          AND: [
            { startDateTime: { lt: end } },
            { endDateTime: { gt: start } }
          ]
        }
      });

      if (hasConflict) return null;

      // Calculate match score
      const hasSubjectExperience = avail.instructor.instructorClasses.length > 0;
      const matchScore = hasSubjectExperience ? 1.0 : 0.5;

      return {
        instructor: avail.instructor,
        matchScore,
        hasSubjectExperience,
        availableSlots: avail.slots.map(s => `${s.startTime}-${s.endTime}`)
      };
    })
  );

  return results.filter(r => r !== null);
};

/**
 * Find available rooms for a given time slot
 * Returns rooms that are:
 * 1. Available according to their availability schedule
 * 2. Not already booked at this time
 * 3. Have sufficient capacity for the class
 */
export const findAvailableRooms = async (classId, startDateTime, endDateTime, requiredCapacity = null) => {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][start.getDay()];
  const startTime = start.toTimeString().substring(0, 5);
  const endTime = end.toTimeString().substring(0, 5);

  // Get class enrollment count if capacity not provided
  let capacity = requiredCapacity;
  if (!capacity && classId) {
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      include: {
        enrollments: {
          where: { isActive: true },
          select: { id: true }
        }
      }
    });
    capacity = classData?.enrollments.length || 0;
  }

  // Get all classrooms with availability on this day
  const availableClassrooms = await prisma.classroomAvailability.findMany({
    where: {
      isActive: true,
      startDate: { lte: start },
      endDate: { gte: start },
      dayOfWeek: { has: dayOfWeek }
    },
    include: {
      classroom: {
        select: {
          id: true,
          code: true,
          nameEn: true,
          nameAr: true,
          capacity: true,
          locationEn: true,
          locationAr: true
        }
      },
      slots: true
    }
  });

  // Filter classrooms with matching time slots and sufficient capacity
  const classroomsWithSlots = availableClassrooms.filter(avail => {
    const hasMatchingSlot = avail.slots.some(slot => 
      slot.startTime <= startTime && slot.endTime >= endTime
    );
    const hasCapacity = !capacity || avail.classroom.capacity >= capacity;
    return hasMatchingSlot && hasCapacity;
  });

  // Check each classroom for conflicts
  const results = await Promise.all(
    classroomsWithSlots.map(async (avail) => {
      const hasConflict = await prisma.scheduledSession.findFirst({
        where: {
          classroomId: avail.classroom.id,
          isActive: true,
          AND: [
            { startDateTime: { lt: end } },
            { endDateTime: { gt: start } }
          ]
        }
      });

      if (hasConflict) return null;

      // Calculate capacity score (how well does capacity match)
      const capacityRatio = capacity ? (avail.classroom.capacity / capacity) : 1;
      const capacityScore = capacityRatio >= 1 && capacityRatio <= 1.5 ? 1.0 : 
                           capacityRatio > 1.5 ? 0.7 : 0.5;

      return {
        classroom: avail.classroom,
        capacityScore,
        capacityMatch: {
          required: capacity,
          available: avail.classroom.capacity,
          utilization: capacity ? Math.round((capacity / avail.classroom.capacity) * 100) : 0
        },
        availableSlots: avail.slots.map(s => `${s.startTime}-${s.endTime}`)
      };
    })
  );

  return results.filter(r => r !== null);
};

/**
 * Suggest best instructor/room combinations with weighted scoring
 * Score = (instructorMatch * 0.4) + (roomCapacity * 0.3) + (timePreference * 0.2) + (availability * 0.1)
 */
export const suggestBestMatch = async (classId, preferredTime = null) => {
  const classData = await prisma.class.findUnique({
    where: { id: parseInt(classId) },
    include: {
      subject: { select: { id: true, nameEn: true, nameAr: true } },
      enrollments: {
        where: { isActive: true },
        select: { id: true }
      }
    }
  });

  if (!classData) {
    return { success: false, error: 'Class not found' };
  }

  const enrolledCount = classData.enrollments.length;
  const subjectId = classData.subject.id;

  // Use preferred time or default to next week, 9 AM for 2 hours
  const startDateTime = preferredTime?.startDateTime || 
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).setHours(9, 0, 0, 0);
  const endDateTime = preferredTime?.endDateTime || 
    new Date(startDateTime).setHours(11, 0, 0, 0);

  const [instructors, rooms] = await Promise.all([
    findAvailableInstructors(classId, startDateTime, endDateTime, subjectId),
    findAvailableRooms(classId, startDateTime, endDateTime, enrolledCount)
  ]);

  // Generate combinations
  const combinations = [];
  for (const instrData of instructors) {
    for (const roomData of rooms) {
      // Weighted scoring
      const instructorScore = instrData.matchScore * 0.4;
      const capacityScore = roomData.capacityScore * 0.3;
      const timeScore = 0.2; // Default time preference (could be enhanced)
      const availabilityScore = 0.1; // Both are available so full score

      const totalScore = instructorScore + capacityScore + timeScore + availabilityScore;

      combinations.push({
        instructor: instrData.instructor,
        classroom: roomData.classroom,
        score: totalScore,
        breakdown: {
          instructorScore: instructorScore,
          capacityScore: capacityScore,
          timeScore: timeScore,
          availabilityScore: availabilityScore
        },
        details: {
          hasSubjectExperience: instrData.hasSubjectExperience,
          capacityUtilization: roomData.capacityMatch.utilization,
          startDateTime,
          endDateTime
        }
      });
    }
  }

  // Sort by score and return top 3
  combinations.sort((a, b) => b.score - a.score);

  return {
    success: true,
    suggestions: combinations.slice(0, 3),
    totalCombinations: combinations.length
  };
};

/**
 * Suggest alternative time slots when conflicts exist
 * Finds next available slots for the given instructor and classroom
 */
export const suggestAlternativeTimes = async (classId, instructorId, classroomId, originalStart = null) => {
  const start = originalStart ? new Date(originalStart) : new Date();
  const suggestions = [];

  // Get instructor and classroom availability patterns
  const [instructorAvailability, classroomAvailability] = await Promise.all([
    prisma.instructorAvailability.findMany({
      where: {
        instructorUserId: parseInt(instructorId),
        isActive: true,
        startDate: { lte: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000) }, // Next 30 days
        endDate: { gte: start }
      },
      include: { slots: true }
    }),
    prisma.classroomAvailability.findMany({
      where: {
        classroomId: parseInt(classroomId),
        isActive: true,
        startDate: { lte: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000) },
        endDate: { gte: start }
      },
      include: { slots: true }
    })
  ]);

  // Find overlapping availability
  const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let daysAhead = 1; daysAhead <= 14 && suggestions.length < 5; daysAhead++) {
    const checkDate = new Date(start);
    checkDate.setDate(checkDate.getDate() + daysAhead);
    const dayOfWeek = dayMap[checkDate.getDay()];

    const instrAvail = instructorAvailability.find(a => 
      a.dayOfWeek.includes(dayOfWeek) && 
      checkDate >= a.startDate && 
      checkDate <= a.endDate
    );

    const roomAvail = classroomAvailability.find(a => 
      a.dayOfWeek.includes(dayOfWeek) && 
      checkDate >= a.startDate && 
      checkDate <= a.endDate
    );

    if (instrAvail && roomAvail) {
      // Find overlapping time slots
      for (const instrSlot of instrAvail.slots) {
        for (const roomSlot of roomAvail.slots) {
          const slotStart = instrSlot.startTime > roomSlot.startTime ? instrSlot.startTime : roomSlot.startTime;
          const slotEnd = instrSlot.endTime < roomSlot.endTime ? instrSlot.endTime : roomSlot.endTime;

          if (slotStart < slotEnd) {
            // Create datetime from date and time
            const [startHour, startMin] = slotStart.split(':').map(Number);
            const [endHour, endMin] = slotEnd.split(':').map(Number);

            const suggestedStart = new Date(checkDate);
            suggestedStart.setHours(startHour, startMin, 0, 0);

            const suggestedEnd = new Date(checkDate);
            suggestedEnd.setHours(endHour, endMin, 0, 0);

            // Check for conflicts at this time
            const [instrConflict, roomConflict] = await Promise.all([
              prisma.scheduledSession.findFirst({
                where: {
                  instructorId: parseInt(instructorId),
                  isActive: true,
                  AND: [
                    { startDateTime: { lt: suggestedEnd } },
                    { endDateTime: { gt: suggestedStart } }
                  ]
                }
              }),
              prisma.scheduledSession.findFirst({
                where: {
                  classroomId: parseInt(classroomId),
                  isActive: true,
                  AND: [
                    { startDateTime: { lt: suggestedEnd } },
                    { endDateTime: { gt: suggestedStart } }
                  ]
                }
              })
            ]);

            if (!instrConflict && !roomConflict) {
              suggestions.push({
                startDateTime: suggestedStart,
                endDateTime: suggestedEnd,
                dayOfWeek,
                timeSlot: `${slotStart}-${slotEnd}`,
                daysFromNow: daysAhead
              });

              if (suggestions.length >= 5) break;
            }
          }
        }
        if (suggestions.length >= 5) break;
      }
    }
  }

  return {
    success: true,
    suggestions: suggestions.slice(0, 5)
  };
};

export default {
  findAvailableInstructors,
  findAvailableRooms,
  suggestBestMatch,
  suggestAlternativeTimes
};
