/**
 * One-time migration script to generate ScheduleSession from Class.schedule JSON
 * 
 * This script:
 * - Reads Class.schedule JSON for each class
 * - Generates ScheduleSession rows across the class term window
 * - Skips weekends (Friday=5, Saturday=6)
 * - Skips global holidays and program-specific holidays
 * - Skips instructorAbsent dates from the old schedule
 * - Uses class.ownerEmail to set instructorUserId
 * - Classroom defaults to null (admin assigns later)
 * - Is idempotent (safe to re-run)
 * 
 * Usage:
 *   node scripts/scheduling/generate-sessions-from-class-json.cjs [--dry-run]
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

// Day mapping for schedule.days array
const DAY_MAP = {
  'SUN': 0,
  'MON': 1,
  'TUE': 2,
  'WED': 3,
  'THU': 4,
  'FRI': 5,
  'SAT': 6
};

/**
 * Get term start and end dates from class.term and class.year
 * Expected format: term = "Fall 2024" or "Spring 2025"
 */
function getTermDates(term, year) {
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  
  if (!term) {
    // Default to current year if no term
    return {
      start: new Date(currentYear, 8, 1), // September 1
      end: new Date(currentYear + 1, 5, 30) // June 30
    };
  }

  const termLower = term.toLowerCase();
  let startMonth, endMonth;

  if (termLower.includes('fall')) {
    startMonth = 8; // September
    endMonth = 11; // December
  } else if (termLower.includes('spring')) {
    startMonth = 0; // January
    endMonth = 5; // June
  } else if (termLower.includes('summer')) {
    startMonth = 5; // June
    endMonth = 7; // August
  } else if (termLower.includes('winter')) {
    startMonth = 11; // December
    endMonth = 1; // February (next year)
  } else {
    // Default to full year
    startMonth = 0;
    endMonth = 11;
  }

  return {
    start: new Date(currentYear, startMonth, 1),
    end: new Date(currentYear + (endMonth < startMonth ? 1 : 0), endMonth, 30)
  };
}

/**
 * Check if a date falls on a holiday (global or program-specific)
 */
async function isHoliday(date, programId) {
  const holidays = await prisma.holiday.findMany({
    where: {
      isActive: true,
      OR: [
        { programId: null }, // Global holidays
        { programId: programId } // Program-specific holidays
      ],
      startDate: { lte: date },
      endDate: { gte: date }
    }
  });

  return holidays.length > 0;
}

/**
 * Check if a date is a weekend (Friday=5, Saturday=6)
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 5 || day === 6;
}

/**
 * Parse time string "HH:MM" to minutes from midnight
 */
function parseTimeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Find or create a time slot for a program
 */
async function findOrCreateTimeSlot(programId, startTime, durationMinutes) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endTime = new Date();
  endTime.setHours(0, startMinutes + durationMinutes, 0, 0);
  const endTimeStr = endTime.toTimeString().slice(0, 5);

  // Try to find existing time slot
  let timeSlot = await prisma.timeSlot.findFirst({
    where: {
      programId,
      startTime,
      endTime: endTimeStr,
      isBreak: false,
      isActive: true
    }
  });

  if (!timeSlot) {
    // Create new time slot
    const maxSort = await prisma.timeSlot.findFirst({
      where: { programId },
      orderBy: { sortOrder: 'desc' }
    });

    timeSlot = await prisma.timeSlot.create({
      data: {
        programId,
        labelEn: `Period ${(maxSort?.sortOrder || 0) + 1}`,
        labelAr: `الحصة ${(maxSort?.sortOrder || 0) + 1}`,
        startTime,
        endTime: endTimeStr,
        durationMinutes,
        isBreak: false,
        sortOrder: (maxSort?.sortOrder || 0) + 1,
        isActive: true
      }
    });

    console.log(`  Created new TimeSlot: ${timeSlot.labelEn} (${timeSlot.startTime}-${timeSlot.endTime})`);
  }

  return timeSlot;
}

/**
 * Generate sessions from a class's schedule JSON
 */
async function generateSessionsForClass(cls, holidays, dryRun = false) {
  const schedule = cls.schedule;
  
  if (!schedule || !schedule.days || schedule.days.length === 0) {
    console.log(`  Skipping ${cls.code}: No schedule data`);
    return 0;
  }

  const termDates = getTermDates(cls.term, cls.year);
  const dayNumbers = schedule.days.map(d => DAY_MAP[d]).filter(d => d !== undefined);
  
  if (dayNumbers.length === 0) {
    console.log(`  Skipping ${cls.code}: Invalid day mapping`);
    return 0;
  }

  // Get instructor user ID from ownerEmail
  let instructorUserId = null;
  if (cls.ownerEmail) {
    const instructor = await prisma.user.findUnique({
      where: { email: cls.ownerEmail }
    });
    if (instructor) {
      instructorUserId = instructor.id;
    }
  }

  if (!instructorUserId) {
    console.log(`  Skipping ${cls.code}: No valid instructor found (ownerEmail: ${cls.ownerEmail})`);
    return 0;
  }

  // Find or create time slot
  const timeSlot = await findOrCreateTimeSlot(
    cls.programId,
    schedule.startTime || '09:00',
    schedule.duration || 60
  );

  // Get existing sessions to avoid duplicates
  const existingSessions = await prisma.scheduleSession.findMany({
    where: {
      classId: cls.id,
      timeSlotId: timeSlot.id
    },
    select: { date: true }
  });
  const existingDates = new Set(existingSessions.map(s => s.date.toISOString().split('T')[0]));

  let sessionsCreated = 0;
  let currentDate = new Date(termDates.start);

  while (currentDate <= termDates.end) {
    const dayOfWeek = currentDate.getDay();
    
    // Check if this day is scheduled
    if (dayNumbers.includes(dayOfWeek)) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Skip if already exists
      if (existingDates.has(dateStr)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Skip weekends
      if (isWeekend(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Skip holidays
      const isHolidayDay = await isHoliday(currentDate, cls.programId);
      if (isHolidayDay) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Skip instructor absent dates
      if (schedule.instructorAbsent && schedule.instructorAbsent.includes(dateStr)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Create session
      if (!dryRun) {
        await prisma.scheduleSession.create({
          data: {
            classId: cls.id,
            subjectId: cls.subjectId,
            instructorUserId,
            classroomId: null, // Will be assigned by admin
            timeSlotId: timeSlot.id,
            date: currentDate,
            isActive: true,
            createdBy: instructorUserId
          }
        });
      }

      sessionsCreated++;
      console.log(`    ${dateStr} - ${cls.code} - ${cls.nameEn || cls.nameAr}`);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessionsCreated;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Schedule Session Migration Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will create sessions)'}`);
  console.log('');

  try {
    // Get all classes with schedule data
    const classes = await prisma.class.findMany({
      where: {
        schedule: { not: null },
        isActive: true
      },
      include: {
        program: true,
        subject: true
      }
    });

    console.log(`Found ${classes.length} classes with schedule data`);
    console.log('');

    if (classes.length === 0) {
      console.log('No classes to process. Exiting.');
      return;
    }

    let totalSessionsCreated = 0;

    for (const cls of classes) {
      console.log(`Processing: ${cls.code} - ${cls.nameEn || cls.nameAr} (${cls.program?.nameEn || cls.program?.nameAr})`);
      
      const sessionsCreated = await generateSessionsForClass(cls, [], DRY_RUN);
      totalSessionsCreated += sessionsCreated;
      
      console.log(`  Sessions created: ${sessionsCreated}`);
      console.log('');
    }

    console.log('='.repeat(60));
    console.log(`Total sessions to create: ${totalSessionsCreated}`);
    console.log('='.repeat(60));

    if (DRY_RUN) {
      console.log('');
      console.log('This was a DRY RUN. Run without --dry-run to actually create sessions.');
    } else {
      console.log('');
      console.log('Migration completed successfully.');
    }

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
