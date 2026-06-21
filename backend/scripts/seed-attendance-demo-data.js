/**
 * Seed class + daily (standup) attendance for dashboard analytics demos.
 * Run: node backend/scripts/seed-attendance-demo-data.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
}

const STANDUP_CODES = [
  { code: 'STANDUP_PRESENT', nameEn: 'Standup Present', nameAr: 'حاضر يومياً' },
  { code: 'STANDUP_LATE', nameEn: 'Standup Late', nameAr: 'متأخر يومياً' },
  { code: 'STANDUP_ABSENT', nameEn: 'Standup Absent', nameAr: 'غائب يومياً' },
  { code: 'STANDUP_CLINIC', nameEn: 'Standup Clinic', nameAr: 'عيادة' },
];

const CLASS_STATUS_ROTATION = ['PRESENT', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'PRESENT'];
const STANDUP_STATUS_ROTATION = ['STANDUP_PRESENT', 'STANDUP_PRESENT', 'STANDUP_LATE', 'STANDUP_ABSENT', 'STANDUP_CLINIC'];

const CLASS_STATUS_CODES = [
  { code: 'PRESENT', nameEn: 'Present', nameAr: 'حاضر' },
  { code: 'LATE', nameEn: 'Late', nameAr: 'متأخر' },
  { code: 'ABSENT', nameEn: 'Absent', nameAr: 'غائب' },
  { code: 'EXCUSED', nameEn: 'Excused', nameAr: 'معذور' },
];

async function ensureStandupStatusTypes() {
  for (const s of STANDUP_CODES) {
    await prisma.attendanceStatusTypes.upsert({
      where: { code: s.code },
      create: { code: s.code, nameEn: s.nameEn, nameAr: s.nameAr, isActive: true },
      update: { nameEn: s.nameEn, nameAr: s.nameAr, isActive: true },
    });
  }
}

async function ensureClassStatusTypes() {
  for (const s of CLASS_STATUS_CODES) {
    await prisma.attendanceStatusTypes.upsert({
      where: { code: s.code },
      create: { code: s.code, nameEn: s.nameEn, nameAr: s.nameAr, isActive: true },
      update: { nameEn: s.nameEn, nameAr: s.nameAr, isActive: true },
    });
  }
}

async function fixSequences() {
  const tables = ['attendances', 'standup_attendances'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        COALESCE((SELECT MAX(id) FROM "${table}"), 1)
      );
    `);
  }
}

async function main() {
  await ensureStandupStatusTypes();
  await ensureClassStatusTypes();
  await fixSequences();

  const statusByCode = new Map(
    (await prisma.attendanceStatusTypes.findMany({ where: { isActive: true } }))
      .map((s) => [s.code, s.id]),
  );

  const program = await prisma.program.findFirst({
    where: {
      isActive: true,
      OR: [
        { nameEn: { contains: 'Information Technology', mode: 'insensitive' } },
        { nameEn: { contains: 'IT', mode: 'insensitive' } },
      ],
    },
  }) || await prisma.program.findFirst({ where: { isActive: true } });

  if (!program) {
    console.error('No active program found. Aborting.');
    process.exit(1);
  }

  const classes = await prisma.class.findMany({
    where: { isActive: true, programId: program.id },
    include: { subject: true },
    take: 6,
  });

  if (!classes.length) {
    console.error(`No classes for program "${program.nameEn}". Aborting.`);
    process.exit(1);
  }

  let students = await prisma.user.findMany({
    where: {
      enrollments: { some: { classId: { in: classes.map((c) => c.id) } } },
    },
    take: 24,
  });

  if (students.length < 4) {
    students = await prisma.user.findMany({
      where: { roleAssignments: { some: { role: { code: 'STUDENT' } } } },
      take: 12,
    });
    for (const cls of classes.slice(0, 3)) {
      for (const student of students.slice(0, 4)) {
        await prisma.enrollment.upsert({
          where: { userId_classId: { userId: student.id, classId: cls.id } },
          create: { userId: student.id, classId: cls.id },
          update: {},
        }).catch(() => {});
      }
    }
  }

  if (!students.length) {
    console.error('No students found. Create students/enrollments first.');
    process.exit(1);
  }

  const instructor = await prisma.user.findFirst({
    where: { roleAssignments: { some: { role: { code: 'INSTRUCTOR' } } } },
  });
  const admin = await prisma.user.findFirst({
    where: { roleAssignments: { some: { role: { code: 'ADMIN' } } } },
  }) || instructor;

  const today = new Date();
  let classCreated = 0;
  let standupCreated = 0;

  for (let dayOffset = -45; dayOffset <= 0; dayOffset += 1) {
    const date = addDays(today, dayOffset);
    if (date.getDay() === 5) continue; // skip Friday

    for (let ci = 0; ci < classes.length; ci++) {
      const cls = classes[ci];
      const classStudents = students.filter((_, i) => (i + ci) % 2 === 0).slice(0, 5);
      if (!classStudents.length) continue;

      for (let si = 0; si < classStudents.length; si++) {
        const student = classStudents[si % classStudents.length];
        const code = CLASS_STATUS_ROTATION[(dayOffset + ci + si) % CLASS_STATUS_ROTATION.length];
        const statusId = statusByCode.get(code);
        if (!statusId) continue;

        const existing = await prisma.attendance.findFirst({
          where: {
            userId: student.id,
            classId: cls.id,
            date: {
              gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
              lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
            },
          },
        });
        if (existing) continue;

        await prisma.attendance.create({
          data: {
            userId: student.id,
            classId: cls.id,
            programId: program.id,
            subjectId: cls.subjectId,
            date,
            statusId,
            createdBy: instructor?.id,
          },
        });
        classCreated += 1;
      }
    }

    for (let si = 0; si < Math.min(students.length, 8); si++) {
      const student = students[si];
      const code = STANDUP_STATUS_ROTATION[(dayOffset + si) % STANDUP_STATUS_ROTATION.length];
      const statusId = statusByCode.get(code);
      if (!statusId) continue;

      const existing = await prisma.standupAttendance.findFirst({
        where: {
          userId: student.id,
          date: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
          },
        },
      });
      if (existing) continue;

      await prisma.standupAttendance.create({
        data: {
          userId: student.id,
          programId: program.id,
          date,
          statusId,
          createdBy: admin?.id,
        },
      });
      standupCreated += 1;
    }
  }

  console.log(`✅ Program: ${program.nameEn}`);
  console.log(`   Classes: ${classes.map((c) => c.nameEn || c.code).join(', ')}`);
  console.log(`   Class attendance records created: ${classCreated}`);
  console.log(`   Daily (standup) attendance records created: ${standupCreated}`);
  console.log('Restart backend and refresh summary dashboard (time range: Year or Last 90 days).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
