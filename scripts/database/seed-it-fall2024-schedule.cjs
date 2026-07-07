/**
 * IT Diploma Fall 2024 — weekly schedule seed (idempotent)
 *
 * Fixes missing scheduled_sessions for IT 2024-FALL cohort classes,
 * proper program time slots, instructor assignments, and academicTermId links.
 *
 * Usage: node scripts/database/seed-it-fall2024-schedule.cjs
 */

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();

const PROGRAM_CODE = 'IT';
const TERM_CODE = '2024-FALL';
const SEMESTER_START = new Date('2024-09-01T00:00:00');
const SEMESTER_END = new Date('2024-12-20T23:59:59');

const INSTRUCTORS = {
  shareef: 1,
  sarah: 12,
  michael: 13,
  maria: 15,
};

const CLASS_SCHEDULE = {
  'CS101-2024-FALL-A': {
    instructorId: INSTRUCTORS.sarah,
    slots: [
      { day: 'Sun', startTime: '07:00', endTime: '08:00' },
      { day: 'Wed', startTime: '07:00', endTime: '08:00' },
    ],
  },
  'DB101-2024-FALL-A': {
    instructorId: INSTRUCTORS.shareef,
    slots: [
      { day: 'Sun', startTime: '08:30', endTime: '09:30' },
      { day: 'Thu', startTime: '07:00', endTime: '08:00' },
    ],
  },
  'NET101-2024-FALL-A': {
    instructorId: INSTRUCTORS.shareef,
    slots: [
      { day: 'Mon', startTime: '07:00', endTime: '08:30' },
      { day: 'Wed', startTime: '08:30', endTime: '09:30' },
    ],
  },
  'WEB101-2024-FALL-A': {
    instructorId: INSTRUCTORS.sarah,
    slots: [
      { day: 'Tue', startTime: '07:00', endTime: '08:00' },
      { day: 'Thu', startTime: '08:30', endTime: '09:30' },
    ],
  },
  'ME102-2024-FALL-A': {
    instructorId: INSTRUCTORS.michael,
    slots: [
      { day: 'Tue', startTime: '08:30', endTime: '09:30' },
      { day: 'Wed', startTime: '10:00', endTime: '11:00' },
    ],
  },
  'ME101-2024FL': {
    instructorId: INSTRUCTORS.maria,
    slots: [
      { day: 'Mon', startTime: '09:00', endTime: '10:30' },
      { day: 'Thu', startTime: '10:00', endTime: '11:00' },
    ],
  },
};

const SLOT_DEFS = [
  { labelEn: '1st Lecture', labelAr: 'المحاضرة الأولى', startTime: '07:00', endTime: '08:00', durationMinutes: 60, sortOrder: 1, isBreak: false },
  { labelEn: 'Break', labelAr: 'استراحة', startTime: '08:00', endTime: '08:30', durationMinutes: 30, sortOrder: 2, isBreak: true, breakType: 'TeaBreak' },
  { labelEn: '2nd Lecture', labelAr: 'المحاضرة الثانية', startTime: '08:30', endTime: '09:30', durationMinutes: 60, sortOrder: 3, isBreak: false },
  { labelEn: 'Break', labelAr: 'استراحة', startTime: '09:30', endTime: '10:00', durationMinutes: 30, sortOrder: 4, isBreak: true, breakType: 'TeaBreak' },
  { labelEn: '3rd Lecture', labelAr: 'المحاضرة الثالثة', startTime: '10:00', endTime: '11:00', durationMinutes: 60, sortOrder: 5, isBreak: false },
  { labelEn: 'Office Hours', labelAr: 'ساعات مكتبية', startTime: '11:00', endTime: '12:00', durationMinutes: 60, sortOrder: 6, isBreak: true, breakType: 'OfficeHours' },
];

function parseHm(hm) {
  const [h, m] = hm.split(':').map(Number);
  return { hours: h, minutes: m };
}

function atDateTime(baseDate, hm) {
  const { hours, minutes } = parseHm(hm);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function generateSessionsForSlot({
  classId, instructorId, classroomId, day, startTime, endTime, semesterStart, semesterEnd, createdBy,
}) {
  const sessions = [];
  const dayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const targetDay = dayIndex[day];
  const current = new Date(semesterStart);
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1);
  }
  while (current <= semesterEnd) {
    const start = atDateTime(current, startTime);
    const end = atDateTime(current, endTime);
    sessions.push({
      classId,
      instructorId,
      classroomId,
      startDateTime: start,
      endDateTime: end,
      status: 'scheduled',
      sessionType: 'lecture',
      recurrenceType: 'weekly',
      recurrenceDays: [day],
      recurrenceEndDate: semesterEnd,
      isRecurringInstance: sessions.length > 0,
      isActive: true,
      createdBy,
    });
    current.setDate(current.getDate() + 7);
  }
  return sessions;
}

async function main() {
  console.log('📅 IT Fall 2024 schedule seed\n');

  const createdBy = await getSuperAdminId();
  if (!createdBy) throw new Error('Super admin not found');

  const program = await prisma.program.findFirst({ where: { code: PROGRAM_CODE } });
  if (!program) throw new Error(`Program ${PROGRAM_CODE} not found`);

  const academicTerm = await prisma.academicTerms.findFirst({ where: { code: TERM_CODE } });
  if (!academicTerm) throw new Error(`Academic term ${TERM_CODE} not found`);

  let classroom = await prisma.classroom.findFirst({ where: { isActive: true } });
  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: { nameEn: 'Room A', nameAr: 'قاعة أ', isActive: true, createdBy },
    });
  }

  // Ensure lecture/break/office time slots exist (additive — do not delete existing breaks)
  const existingSlots = await prisma.timeSlot.findMany({ where: { programId: program.id } });
  const hasLectureSlot = existingSlots.some((ts) => !ts.isBreak && !(ts.labelEn || '').toLowerCase().includes('office'));
  if (!hasLectureSlot) {
    for (const slot of SLOT_DEFS) {
      const exists = await prisma.timeSlot.findFirst({
        where: { programId: program.id, startTime: slot.startTime, endTime: slot.endTime },
      });
      if (!exists) {
        await prisma.timeSlot.create({ data: { ...slot, programId: program.id } });
      }
    }
    console.log('✅ Added IT program lecture/break/office time slots');
  } else {
    console.log('⏭️  IT program time slots already include lectures');
  }

  let sessionCount = 0;
  for (const [classCode, config] of Object.entries(CLASS_SCHEDULE)) {
    const cls = await prisma.class.findFirst({
      where: { code: classCode, programId: program.id },
    });
    if (!cls) {
      console.warn(`⚠️  Class ${classCode} not found — skipping`);
      continue;
    }

    await prisma.class.update({
      where: { id: cls.id },
      data: {
        instructorId: config.instructorId,
        academicTermId: academicTerm.id,
        classroomId: cls.classroomId || classroom.id,
        year: '2024',
        term: TERM_CODE,
        isActive: true,
      },
    });

    for (const slot of config.slots) {
      const sessions = generateSessionsForSlot({
        classId: cls.id,
        instructorId: config.instructorId,
        classroomId: cls.classroomId || classroom.id,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        semesterStart: SEMESTER_START,
        semesterEnd: SEMESTER_END,
        createdBy,
      });

      for (const sess of sessions) {
        const exists = await prisma.scheduledSession.findFirst({
          where: {
            classId: sess.classId,
            startDateTime: sess.startDateTime,
            endDateTime: sess.endDateTime,
          },
        });
        if (!exists) {
          await prisma.scheduledSession.create({ data: sess });
          sessionCount += 1;
        }
      }
    }
    console.log(`✅ ${classCode} — instructor ${config.instructorId}, ${config.slots.length} weekly slots`);
  }

  // Deactivate legacy PY-I duplicate (term "Fall" without cohort code)
  const legacy = await prisma.class.findFirst({ where: { code: 'PY-I', programId: program.id } });
  if (legacy) {
    await prisma.class.update({
      where: { id: legacy.id },
      data: { isActive: false },
    });
    console.log('✅ Deactivated legacy PY-I class (superseded by NET101-2024-FALL-A)');
  }

  console.log(`\n✅ Done — ${sessionCount} new scheduled sessions created`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
