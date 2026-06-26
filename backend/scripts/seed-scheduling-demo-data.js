/**
 * Seed demo scheduling data: scheduled sessions, breaks, holidays.
 * Run: node backend/scripts/seed-scheduling-demo-data.js
 */

import prisma from '../db/prismaClient.js';


function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function atTime(date, hours, minutes = 0) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function main() {
  const programs = await prisma.program.findMany({ where: { isActive: true }, take: 3 });
  const classes = await prisma.class.findMany({ where: { isActive: true }, take: 6, include: { program: true } });
  const instructors = await prisma.user.findMany({
    where: { roleAssignments: { some: { role: { code: 'INSTRUCTOR' } } } },
    take: 5,
  });
  const classrooms = await prisma.classroom.findMany({ take: 4 });

  if (!programs.length || !classes.length || !instructors.length) {
    console.error('Need at least 1 program, 1 class, and 1 instructor in DB. Aborting.');
    process.exit(1);
  }

  const statuses = ['scheduled', 'scheduled', 'completed', 'in_progress', 'cancelled'];
  const today = new Date();
  let created = 0;

  for (let offset = -90; offset <= 30; offset += 7) {
    for (let i = 0; i < Math.min(classes.length, 3); i++) {
      const cls = classes[i % classes.length];
      const instructor = instructors[i % instructors.length];
      const classroom = classrooms[i % Math.max(classrooms.length, 1)] || null;
      const day = addDays(today, offset + i);
      const start = atTime(day, 9 + i, 0);
      const end = atTime(day, 10 + i, 30);
      const status = statuses[(Math.abs(offset) + i) % statuses.length];

      await prisma.scheduledSession.create({
        data: {
          classId: cls.id,
          instructorId: instructor.id,
          classroomId: classroom?.id || null,
          startDateTime: start,
          endDateTime: end,
          status,
          isActive: true,
        },
      });
      created += 1;
    }
  }

  const program = programs[0];
  let breakSlot = await prisma.timeSlot.findFirst({
    where: { programId: program.id, isBreak: true },
  });
  if (!breakSlot) {
    breakSlot = await prisma.timeSlot.create({
      data: {
        programId: program.id,
        labelEn: 'Tea Break',
        labelAr: 'استراحة شاي',
        startTime: '10:30',
        endTime: '10:45',
        durationMinutes: 15,
        isBreak: true,
        sortOrder: 99,
      },
    });
  }

  for (let d = 0; d < 5; d++) {
    await prisma.breakSession.create({
      data: {
        programId: program.id,
        timeSlotId: breakSlot.id,
        instructorUserId: instructors[d % instructors.length].id,
        date: addDays(today, d * 3),
        breakType: ['TeaBreak', 'PrayerBreak', 'LunchBreak'][d % 3],
        notes: 'Demo break session',
        isActive: true,
      },
    }).catch(() => {});
  }

  const holidayStart = addDays(today, 14);
  const holidayEnd = addDays(today, 16);
  await prisma.holiday.create({
    data: {
      programId: program.id,
      descriptionEn: 'Demo National Holiday',
      descriptionAr: 'عطلة وطنية تجريبية',
      type: 'National',
      startDate: holidayStart,
      endDate: holidayEnd,
      isActive: true,
    },
  }).catch(() => {});

  console.log(`✅ Seeded ${created} scheduled sessions, break sessions, and a demo holiday for program "${program.nameEn}".`);
  console.log('Restart backend if running, then refresh summary-dashboard with time range = Year.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
