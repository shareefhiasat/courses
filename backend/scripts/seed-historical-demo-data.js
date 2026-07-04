/**
 * Comprehensive Historical Demo Data Seed Script
 *
 * Generates realistic student journey data across:
 *   - Fall 2023 (Sep 2023 – Jan 2024)
 *   - Spring 2024 (Feb 2024 – Jun 2024)
 *   - Fall 2024 (Sep 2024 – Jan 2025)
 *   - Spring 2025 / Current semester (Feb 2025 – present)
 *
 * For each semester × student × class:
 *   - Enrollment
 *   - Attendance (10–40 records)
 *   - StudentMarks (mid-term, final, homework, etc.)
 *   - Participations (2–6 records)
 *   - Behaviors (1–4 records)
 *   - Penalties (0–3 records)
 *
 * Run: node backend/scripts/seed-historical-demo-data.js
 */

import prisma from '../db/prismaClient.js';
import { calculateLetterGrade } from '../utils/formatting/letterGrades.js';

// ─── Helpers ──────────────────────────────────────────────────────────────

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomFloat(min, max + 1));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── Semester definitions ──────────────────────────────────────────────────

const SEMESTERS = [
  {
    code: '2023-FALL',
    nameEn: 'Fall 2023',
    term: '2023-FALL',
    year: '2023',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2024-01-31'),
    weekCount: 16,
  },
  {
    code: '2024-SPRING',
    nameEn: 'Spring 2024',
    term: '2024-SPRING',
    year: '2024',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-06-30'),
    weekCount: 16,
  },
  {
    code: '2024-FALL',
    nameEn: 'Fall 2024',
    term: '2024-FALL',
    year: '2024',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-01-31'),
    weekCount: 16,
  },
  {
    code: '2025-SPRING',
    nameEn: 'Spring 2025',
    term: '2025-SPRING',
    year: '2025',
    startDate: new Date('2025-02-01'),
    endDate: new Date(),
    weekCount: 8, // current semester, partial
  },
];

// ─── Type lookups (cached) ─────────────────────────────────────────────────

let typeCache = null;

async function loadTypes() {
  if (typeCache) return typeCache;

  const [
    attendanceStatusTypes,
    penaltyTypes,
    behaviorTypes,
    participationTypes,
    enrollmentStatusTypes,
  ] = await Promise.all([
    prisma.attendanceStatusTypes.findMany({ where: { isActive: true } }),
    prisma.penaltyTypes.findMany({ where: { isActive: true } }),
    prisma.behaviorTypes.findMany({ where: { isActive: true } }),
    prisma.participationTypes.findMany({ where: { isActive: true } }),
    prisma.enrollmentStatusTypes.findMany(),
  ]);

  const byCode = (arr) => {
    const m = {};
    for (const item of arr) m[item.code] = item;
    return m;
  };

  typeCache = {
    attendance: byCode(attendanceStatusTypes),
    penalty: byCode(penaltyTypes),
    behavior: byCode(behaviorTypes),
    participation: byCode(participationTypes),
    enrollment: byCode(enrollmentStatusTypes),
    penaltyTypes,
    behaviorTypes,
    participationTypes,
  };
  return typeCache;
}

// ─── Ensure academic terms exist ───────────────────────────────────────────

async function ensureAcademicTerms() {
  for (const sem of SEMESTERS) {
    const existing = await prisma.academicTerms.findUnique({ where: { code: sem.code } });
    if (!existing) {
      await prisma.academicTerms.create({ data: { code: sem.code, nameEn: sem.nameEn, isActive: true } });
    } else {
      await prisma.academicTerms.update({ where: { code: sem.code }, data: { nameEn: sem.nameEn, isActive: true } });
    }
  }
  console.log('✅ Academic terms ensured');
}

// ─── Ensure attendance status types exist ──────────────────────────────────

async function ensureAttendanceStatusTypes() {
  const codes = [
    { code: 'ATTENDANCE_PRESENT', nameEn: 'Present', nameAr: 'حاضر' },
    { code: 'ATTENDANCE_LATE', nameEn: 'Late', nameAr: 'متأخر' },
    { code: 'ATTENDANCE_ABSENT', nameEn: 'Absent', nameAr: 'غائب' },
    { code: 'ATTENDANCE_LEAVE', nameEn: 'Excused Leave', nameAr: 'معذور' },
    { code: 'ATTENDANCE_HUMAN_CASE', nameEn: 'Human Case', nameAr: 'حالة إنسانية' },
  ];
  for (const s of codes) {
    const existing = await prisma.attendanceStatusTypes.findUnique({ where: { code: s.code } });
    if (!existing) {
      await prisma.attendanceStatusTypes.create({ data: { code: s.code, nameEn: s.nameEn, nameAr: s.nameAr, isActive: true } });
    } else {
      await prisma.attendanceStatusTypes.update({ where: { code: s.code }, data: { nameEn: s.nameEn, nameAr: s.nameAr, isActive: true } });
    }
  }
  console.log('✅ Attendance status types ensured');
}

// ─── Ensure penalty types exist ────────────────────────────────────────────

async function ensurePenaltyTypes() {
  const types = [
    { code: 'LATE_SUBMISSION', nameEn: 'Late Submission', nameAr: 'تسليم متأخر', severity: 'low' },
    { code: 'ABSENCE', nameEn: 'Absence', nameAr: 'غياب', severity: 'medium' },
    { code: 'MISCONDUCT', nameEn: 'Misconduct', nameAr: 'سلوك غير لائق', severity: 'high' },
    { code: 'CHEATING', nameEn: 'Cheating', nameAr: 'غش', severity: 'critical' },
    { code: 'PLAGIARISM', nameEn: 'Plagiarism', nameAr: 'سرقة أدبية', severity: 'high' },
    { code: 'DISRUPTION', nameEn: 'Disruption', nameAr: 'إزعاج', severity: 'medium' },
    { code: 'DRESS_CODE', nameEn: 'Dress Code Violation', nameAr: 'مخالفة الزي', severity: 'low' },
  ];
  for (const t of types) {
    const existing = await prisma.penaltyTypes.findUnique({ where: { code: t.code } });
    if (!existing) {
      await prisma.penaltyTypes.create({ data: { code: t.code, nameEn: t.nameEn, nameAr: t.nameAr, severity: t.severity, isActive: true } });
    } else {
      await prisma.penaltyTypes.update({ where: { code: t.code }, data: { nameEn: t.nameEn, nameAr: t.nameAr, severity: t.severity, isActive: true } });
    }
  }
  console.log('✅ Penalty types ensured');
}

// ─── Ensure behavior types exist ───────────────────────────────────────────

async function ensureBehaviorTypes() {
  const types = [
    { code: 'EXCELLENT_PARTICIPATION', nameEn: 'Excellent Participation', nameAr: 'مشاركة ممتازة', category: 'positive', points: 5 },
    { code: 'HELPING_PEERS', nameEn: 'Helping Peers', nameAr: 'مساعدة الزملاء', category: 'positive', points: 3 },
    { code: 'LEADERSHIP', nameEn: 'Leadership', nameAr: 'قيادة', category: 'positive', points: 4 },
    { code: 'DISRUPTIVE', nameEn: 'Disruptive', nameAr: 'مزعج', category: 'negative', points: -2 },
    { code: 'UNPREPARED', nameEn: 'Unprepared', nameAr: 'غير مستعد', category: 'negative', points: -1 },
    { code: 'RESPECTFUL', nameEn: 'Respectful Conduct', nameAr: 'سلوك محترم', category: 'positive', points: 2 },
    { code: 'TEAM_PLAYER', nameEn: 'Team Player', nameAr: 'روح الفريق', category: 'positive', points: 3 },
  ];
  for (const t of types) {
    const existing = await prisma.behaviorTypes.findUnique({ where: { code: t.code } });
    if (!existing) {
      await prisma.behaviorTypes.create({ data: { code: t.code, nameEn: t.nameEn, nameAr: t.nameAr, category: t.category, points: t.points, isActive: true } });
    } else {
      await prisma.behaviorTypes.update({ where: { code: t.code }, data: { nameEn: t.nameEn, nameAr: t.nameAr, category: t.category, points: t.points, isActive: true } });
    }
  }
  console.log('✅ Behavior types ensured');
}

// ─── Ensure participation types exist ──────────────────────────────────────

async function ensureParticipationTypes() {
  const types = [
    { code: 'POSITIVE', nameEn: 'Positive Participation', nameAr: 'مشاركة إيجابية', isPositive: true },
    { code: 'EXCELLENT', nameEn: 'Excellent Participation', nameAr: 'مشاركة ممتازة', isPositive: true },
    { code: 'HELPFUL', nameEn: 'Helpful', nameAr: 'مفيد', isPositive: true },
    { code: 'ACTIVE_DISCUSSION', nameEn: 'Active Discussion', nameAr: 'مناقشة نشطة', isPositive: true },
    { code: 'ANSWERED_QUESTION', nameEn: 'Answered Question', nameAr: 'أجاب على سؤال', isPositive: true },
    { code: 'HELPED_CLASSMATE', nameEn: 'Helped Classmate', nameAr: 'ساعد زميل', isPositive: true },
    { code: 'GAVE_PRESENTATION', nameEn: 'Gave Presentation', nameAr: 'قدم عرضاً', isPositive: true },
  ];
  for (const t of types) {
    const existing = await prisma.participationTypes.findUnique({ where: { code: t.code } });
    if (!existing) {
      await prisma.participationTypes.create({ data: { code: t.code, nameEn: t.nameEn, nameAr: t.nameAr, isPositive: t.isPositive, isActive: true } });
    } else {
      await prisma.participationTypes.update({ where: { code: t.code }, data: { nameEn: t.nameEn, nameAr: t.nameAr, isPositive: t.isPositive, isActive: true } });
    }
  }
  console.log('✅ Participation types ensured');
}

// ─── Ensure marks distributions exist for all subjects ─────────────────────

async function ensureMarksDistributions(subjects, adminId) {
  for (const subject of subjects) {
    const existing = await prisma.marksDistribution.findUnique({ where: { subjectId: subject.id } });
    if (!existing) {
      await prisma.marksDistribution.create({
        data: {
          subjectId: subject.id,
          midTermExam: 20,
          finalExam: 40,
          homework: 5,
          labsProjectResearch: 10,
          quizzes: 5,
          participation: 10,
          attendance: 10,
          createdBy: adminId,
        },
      });
    }
  }
  console.log(`✅ Marks distributions ensured for ${subjects.length} subjects`);
}

// ─── Fix sequences after bulk inserts ──────────────────────────────────────

async function fixSequences() {
  const tables = [
    'attendances',
    'penalties',
    'behaviors',
    'participations',
    'student_marks',
    'enrollments',
    'classes',
  ];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        COALESCE((SELECT MAX(id) FROM "${table}"), 1)
      );
    `).catch(() => {});
  }
  console.log('✅ Sequences fixed');
}

// ─── Create historical classes for each semester ───────────────────────────

async function createHistoricalClasses(programs, subjects, adminUser) {
  const allClasses = [];

  for (const sem of SEMESTERS) {
    // For each semester, create a section for each subject
    for (let si = 0; si < subjects.length; si++) {
      const subject = subjects[si];
      const program = programs.find((p) => p.id === subject.programId) || programs[0];
      const classCode = `${subject.code}-${sem.term}-A`;

      const cls = await prisma.class.findUnique({ where: { code: classCode } });
      if (cls) {
        await prisma.class.update({
          where: { code: classCode },
          data: {
            term: sem.term,
            year: sem.year,
            startDate: sem.startDate,
            endDate: sem.endDate,
          },
        });
      } else {
        const newCls = await prisma.class.create({
          data: {
            code: classCode,
            nameEn: `${subject.nameEn} - ${sem.nameEn}`,
            nameAr: `${subject.nameAr || subject.nameEn} - ${sem.nameEn}`,
            programId: program.id,
            subjectId: subject.id,
            term: sem.term,
            year: sem.year,
            startDate: sem.startDate,
            endDate: sem.endDate,
            maxCapacity: 30,
            isActive: true,
            createdBy: adminUser.id,
          },
        });
        allClasses.push({ ...newCls, semester: sem });
        continue;
      }
      allClasses.push({ ...cls, semester: sem });
    }
  }

  console.log(`✅ Historical classes created: ${allClasses.length}`);
  return allClasses;
}

// ─── Generate realistic marks components ───────────────────────────────────

function generateMarksComponents(studentIndex, subjectIndex, semesterIndex) {
  // Base ability per student (some students are stronger)
  const ability = 55 + (studentIndex % 5) * 8 + randomFloat(-5, 5);
  // Slight improvement over semesters
  const semesterBoost = semesterIndex * 2;
  // Subject difficulty adjustment
  const subjectDifficulty = (subjectIndex % 3) * 3;

  const baseScore = Math.max(40, Math.min(95, ability + semesterBoost - subjectDifficulty));

  const midTermExam = Math.max(0, Math.min(20, baseScore * 0.2 + randomFloat(-3, 3)));
  const finalExam = Math.max(0, Math.min(40, baseScore * 0.4 + randomFloat(-5, 5)));
  const homework = Math.max(0, Math.min(5, baseScore * 0.05 + randomFloat(-1, 1)));
  const labsProjectResearch = Math.max(0, Math.min(10, baseScore * 0.1 + randomFloat(-2, 2)));
  const quizzes = Math.max(0, Math.min(5, baseScore * 0.05 + randomFloat(-1, 1)));
  const participation = Math.max(0, Math.min(10, baseScore * 0.1 + randomFloat(-2, 2)));
  const attendance = Math.max(0, Math.min(10, baseScore * 0.1 + randomFloat(-1, 1)));

  const totalMarks =
    midTermExam + finalExam + homework + labsProjectResearch + quizzes + participation + attendance;

  return {
    midTermExam: parseFloat(midTermExam.toFixed(2)),
    finalExam: parseFloat(finalExam.toFixed(2)),
    homework: parseFloat(homework.toFixed(2)),
    labsProjectResearch: parseFloat(labsProjectResearch.toFixed(2)),
    quizzes: parseFloat(quizzes.toFixed(2)),
    participation: parseFloat(participation.toFixed(2)),
    attendance: parseFloat(attendance.toFixed(2)),
    totalMarks: parseFloat(totalMarks.toFixed(2)),
  };
}

// ─── Generate attendance records for a student × class × semester ──────────

function generateAttendanceDates(sem, density = 0.8) {
  const dates = [];
  const totalDays = sem.weekCount * 3; // 3 classes per week approx

  for (let i = 0; i < totalDays; i++) {
    if (Math.random() > density) continue;
    const date = addDays(sem.startDate, Math.floor((i / totalDays) * (sem.endDate - sem.startDate) / (1000 * 60 * 60 * 24)));
    if (date > new Date()) continue; // Don't create future attendance
    if (date.getDay() === 5) continue; // Skip Friday
    dates.push(date);
  }
  return dates;
}

// ─── Main seeding function ─────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting historical demo data seeding...\n');

  // Fix sequences for all type tables to prevent id conflicts
  const typeTables = [
    'academic_terms', 'attendance_status_types', 'penalty_types',
    'behavior_types', 'participation_types', 'enrollment_status_types',
    'marks_distributions', 'classes', 'enrollments', 'attendances',
    'student_marks', 'penalties', 'behaviors', 'participations',
  ];
  for (const table of typeTables) {
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        COALESCE((SELECT MAX(id) FROM "${table}"), 1)
      );
    `).catch(() => {});
  }
  console.log('✅ All sequences pre-fixed');

  // Ensure types and terms
  await ensureAcademicTerms();
  await ensureAttendanceStatusTypes();
  await ensurePenaltyTypes();
  await ensureBehaviorTypes();
  await ensureParticipationTypes();

  const types = await loadTypes();

  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: 'shareef.hiasat@gmail.com' },
  }) || await prisma.user.findFirst();

  if (!adminUser) {
    console.error('No admin user found. Run comprehensive-seed-v2.js first.');
    process.exit(1);
  }

  // Get all programs and subjects
  const programs = await prisma.program.findMany({ where: { isActive: true } });
  const subjects = await prisma.subject.findMany({ where: { isActive: true } });

  if (!programs.length || !subjects.length) {
    console.error('No programs/subjects found. Run comprehensive-seed-v2.js first.');
    process.exit(1);
  }

  // Ensure marks distributions
  await ensureMarksDistributions(subjects, adminUser.id);

  // Create historical classes
  const allClasses = await createHistoricalClasses(programs, subjects, adminUser);

  // Get all students (users with STUDENT role assignment)
  let students = await prisma.user.findMany({
    where: { roleAssignments: { some: { role: { code: 'STUDENT' } } } },
  });

  // Fallback: get users with student-like emails
  if (students.length < 3) {
    students = await prisma.user.findMany({
      where: { email: { contains: 'student' } },
    });
  }

  if (!students.length) {
    console.error('No students found. Run comprehensive-seed-v2.js first.');
    process.exit(1);
  }

  console.log(`📋 Found ${students.length} students, ${subjects.length} subjects, ${allClasses.length} classes\n`);

  // Get enrollment status (fallback chain: ENROLLED → ACTIVE → first available)
  let enrolledStatus = types.enrollment['ENROLLED'] || types.enrollment['ACTIVE'];
  if (!enrolledStatus) {
    enrolledStatus = await prisma.enrollmentStatusTypes.findFirst();
  }
  if (!enrolledStatus) {
    // Create a default ENROLLED status if none exists
    enrolledStatus = await prisma.enrollmentStatusTypes.create({
      data: { code: 'ENROLLED', nameEn: 'Enrolled', nameAr: 'مسجل', isActive: true },
    });
  }

  // Stats counters
  let stats = {
    enrollments: 0,
    attendance: 0,
    marks: 0,
    participations: 0,
    behaviors: 0,
    penalties: 0,
  };

  // For each semester
  for (let semIdx = 0; semIdx < SEMESTERS.length; semIdx++) {
    const sem = SEMESTERS[semIdx];
    console.log(`\n📅 Processing ${sem.nameEn}...`);

    const semClasses = allClasses.filter((c) => c.semester.code === sem.code);

    // For each class in this semester
    for (const cls of semClasses) {
      // Enroll a subset of students (vary by class)
      const classStudents = students.filter((_, i) => (i + cls.id) % 3 !== 0).slice(0, 6);

      for (let stuIdx = 0; stuIdx < classStudents.length; stuIdx++) {
        const student = classStudents[stuIdx];
        const subjIdx = subjects.findIndex((s) => s.id === cls.subjectId);

        // ── Enrollment ────────────────────────────────────────────────
        const existingEnrollment = await prisma.enrollment.findUnique({
          where: { userId_classId: { userId: student.id, classId: cls.id } },
        });

        if (!existingEnrollment) {
          await prisma.enrollment.create({
            data: {
              userId: student.id,
              programId: cls.programId,
              subjectId: cls.subjectId,
              classId: cls.id,
              statusId: enrolledStatus.id,
              createdBy: adminUser.id,
            },
          }).catch(() => {});
          stats.enrollments++;
        }

        // ── Attendance ────────────────────────────────────────────────
        const attendanceDates = generateAttendanceDates(sem, 0.75);
        const attendanceCodes = ['ATTENDANCE_PRESENT', 'ATTENDANCE_PRESENT', 'ATTENDANCE_PRESENT', 'ATTENDANCE_LATE', 'ATTENDANCE_ABSENT', 'ATTENDANCE_LEAVE'];
        // Better students have better attendance
        const studentAdjust = (stuIdx % 3); // 0,1,2
        const adjustedCodes = studentAdjust === 0
          ? ['ATTENDANCE_PRESENT', 'ATTENDANCE_PRESENT', 'ATTENDANCE_PRESENT', 'ATTENDANCE_PRESENT', 'ATTENDANCE_LATE', 'ATTENDANCE_ABSENT']
          : studentAdjust === 1
          ? ['ATTENDANCE_PRESENT', 'ATTENDANCE_PRESENT', 'ATTENDANCE_LATE', 'ATTENDANCE_ABSENT', 'ATTENDANCE_LEAVE', 'ATTENDANCE_PRESENT']
          : ['ATTENDANCE_PRESENT', 'ATTENDANCE_LATE', 'ATTENDANCE_ABSENT', 'ATTENDANCE_ABSENT', 'ATTENDANCE_PRESENT', 'ATTENDANCE_HUMAN_CASE'];

        for (const date of attendanceDates) {
          const code = pick(adjustedCodes);
          const statusId = types.attendance[code]?.id;
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
              programId: cls.programId,
              subjectId: cls.subjectId,
              date,
              statusId,
              createdBy: adminUser.id,
            },
          }).catch(() => {});
          stats.attendance++;
        }

        // ── Student Marks ─────────────────────────────────────────────
        const existingMarks = await prisma.studentMarks.findUnique({
          where: {
            userId_subjectId_classId_isRepeated: {
              userId: student.id,
              subjectId: cls.subjectId,
              classId: cls.id,
              isRepeated: false,
            },
          },
        }).catch(() => null);

        if (!existingMarks) {
          const marksData = generateMarksComponents(stuIdx, subjIdx, semIdx);
          const gradeResult = calculateLetterGrade(marksData.totalMarks);

          await prisma.studentMarks.create({
            data: {
              userId: student.id,
              subjectId: cls.subjectId,
              classId: cls.id,
              ...marksData,
              letterGrade: gradeResult.letter,
              gradeType: 'calculated',
              isRepeated: false,
              createdBy: adminUser.id,
            },
          }).catch(() => {});
          stats.marks++;
        }

        // ── Participations (2-6 per semester) ────────────────────────
        const participationCount = randomInt(2, 6);
        for (let p = 0; p < participationCount; p++) {
          const pType = pick(types.participationTypes);
          const date = addDays(sem.startDate, randomInt(7, sem.weekCount * 7 - 7));
          if (date > new Date()) continue;

          await prisma.participation.create({
            data: {
              userId: student.id,
              classId: cls.id,
              programId: cls.programId,
              subjectId: cls.subjectId,
              typeId: pType.id,
              points: pType.isPositive ? randomInt(2, 5) : 0,
              descriptionEn: pick([
                'Active participation in class discussion',
                'Excellent presentation on the topic',
                'Helped peers with lab exercises',
                'Good questions during lecture',
                'Outstanding project contribution',
                'Consistent class participation',
                'Answered challenging questions',
                'Led a study group session',
              ]),
              descriptionAr: pick([
                'مشاركة نشطة في مناقشة الفصل',
                'عرض ممتاز حول الموضوع',
                'ساعد الزملاء في تمارين المختبر',
                'أسئلة جيدة خلال المحاضرة',
                'مساهمة استثنائية في المشروع',
                'مشاركة صفية مستمرة',
                'أجاب على أسئلة صعبة',
                'قاد جلسة دراسة جماعية',
              ]),
              createdBy: adminUser.id,
            },
          }).catch(() => {});
          stats.participations++;
        }

        // ── Behaviors (1-4 per semester) ─────────────────────────────
        const behaviorCount = randomInt(1, 4);
        for (let b = 0; b < behaviorCount; b++) {
          const bType = weightedPick(
            types.behaviorTypes,
            types.behaviorTypes.map((t) => t.category === 'positive' ? 3 : 1),
          );
          const date = addDays(sem.startDate, randomInt(7, sem.weekCount * 7 - 7));
          if (date > new Date()) continue;

          await prisma.behavior.create({
            data: {
              userId: student.id,
              classId: cls.id,
              programId: cls.programId,
              subjectId: cls.subjectId,
              typeId: bType.id,
              points: bType.points,
              descriptionEn: pick([
                'Consistently demonstrates leadership in group activities',
                'Regularly assists other students with difficult concepts',
                'Occasional disruption during lectures',
                'Led successful group project presentation',
                'Outstanding contribution to class discussions',
                'Unprepared for several classes',
                'Helps organize study groups',
                'Exceptional lab work and documentation',
                'Took initiative in class project',
                'Respectful and attentive in all sessions',
              ]),
              descriptionAr: pick([
                'يظهر باستمرار قيادة في الأنشطة الجماعية',
                'يساعد بانتظام الطلاب الآخرين في المفاهيم الصعبة',
                'إزعاج عرضي خلال المحاضرات',
                'قاد عرض مشروع جماعي ناجح',
                'مساهمة استثنائية في المناقشات الصفية',
                'غير مستعد لعدة فصول',
                'يساعد في تنظيم مجموعات الدراسة',
                'عمل مختبري وتوثيق استثنائي',
                'أبادر في مشروع الفصل',
                'محترم ومنتبه في جميع الجلسات',
              ]),
              comment: pick([
                'Keep up the good work',
                'Needs improvement in focus',
                'Excellent attitude',
                'Should participate more',
                'Great team player',
              ]),
              eventDate: date,
              createdBy: adminUser.id,
            },
          }).catch(() => {});
          stats.behaviors++;
        }

        // ── Penalties (0-3 per semester, not every student) ──────────
        const penaltyCount = Math.random() > 0.4 ? randomInt(0, 3) : 0;
        for (let pe = 0; pe < penaltyCount; pe++) {
          const penType = pick(types.penaltyTypes);
          const date = addDays(sem.startDate, randomInt(14, sem.weekCount * 7 - 7));
          if (date > new Date()) continue;

          const penaltyPoints = penType.severity === 'critical' ? -10
            : penType.severity === 'high' ? randomInt(-8, -5)
            : penType.severity === 'medium' ? randomInt(-5, -2)
            : randomInt(-3, -1);

          await prisma.penalty.create({
            data: {
              userId: student.id,
              classId: cls.id,
              programId: cls.programId,
              subjectId: cls.subjectId,
              typeId: penType.id,
              points: penaltyPoints,
              descriptionEn: pick([
                'Submitted assignment late',
                'Unexcused absence from lecture',
                'Inappropriate behavior during lab session',
                'Caught cheating during quiz',
                'Plagiarized content in assignment',
                'Disrupted class with inappropriate comments',
                'Violation of dress code policy',
                'Late to class multiple times',
                'Failed to submit required homework',
              ]),
              descriptionAr: pick([
                'قدم الواجب متأخراً',
                'غياب غير معذور من المحاضرة',
                'سلوك غير لائق خلال جلسة المختبر',
                'القبض عليه يغش خلال الاختبار',
                'محتوى منسوخ في الواجب',
                'أزعج الفصل بتعليقات غير لائقة',
                'مخالفة سياسة الزي الموحد',
                'تأخر عن الفصل عدة مرات',
                'لم يقدم الواجب المطلوب',
              ]),
              comment: pick([
                'Warning issued',
                'Meeting with advisor recommended',
                'Second offense this semester',
                'Parent notified',
                'Counseling session scheduled',
              ]),
              eventDate: date,
              createdBy: adminUser.id,
            },
          }).catch(() => {});
          stats.penalties++;
        }
      }
    }

    console.log(`   ${sem.nameEn}: enrollments=${stats.enrollments}, attendance=${stats.attendance}, marks=${stats.marks}, participations=${stats.participations}, behaviors=${stats.behaviors}, penalties=${stats.penalties}`);
  }

  // Fix sequences
  await fixSequences();

  console.log('\n🎉 Historical demo data seeding complete!');
  console.log('\n📊 Summary:');
  console.log(`  ✅ Semesters: ${SEMESTERS.length}`);
  console.log(`  ✅ Historical classes: ${allClasses.length}`);
  console.log(`  ✅ Students: ${students.length}`);
  console.log(`  ✅ New enrollments: ${stats.enrollments}`);
  console.log(`  ✅ Attendance records: ${stats.attendance}`);
  console.log(`  ✅ Student marks: ${stats.marks}`);
  console.log(`  ✅ Participations: ${stats.participations}`);
  console.log(`  ✅ Behaviors: ${stats.behaviors}`);
  console.log(`  ✅ Penalties: ${stats.penalties}`);
  console.log('\n💡 To view charts: select any student, go to Performance tab → Marks & Grades category.');
  console.log('   Line charts will show marks trends across semesters. Filter by semester/year to see specific terms.');
}

main()
  .catch((error) => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
