import prisma from '../db/prismaClient.js';

const PROGRAM_ID = 5;
const START_DATE = new Date('2026-07-26T00:00:00.000Z'); // Sunday
const WEEKS = 4;
const WORK_DAYS_PER_WEEK = 5; // Sun-Thu

const STATUS = {
  PRESENT: 1,
  ABSENT: 2,
  LATE: 3,
  LEAVE: 4,
  HUMAN_CASE: 17,
};

const STATUS_WEIGHTS_DEFAULT = {
  [STATUS.PRESENT]: 75,
  [STATUS.ABSENT]: 8,
  [STATUS.LATE]: 8,
  [STATUS.LEAVE]: 5,
  [STATUS.HUMAN_CASE]: 4,
};

function getWorkingDays(start, weeks) {
  const days = [];
  const cur = new Date(start);
  while (days.length < weeks * WORK_DAYS_PER_WEEK) {
    const dow = cur.getUTCDay();
    if (dow !== 5 && dow !== 6) { // skip Fri, Sat
      days.push(new Date(cur));
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

function pickStatus(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [status, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) return Number(status);
  }
  return STATUS.PRESENT;
}

function seededRandom(seed) {
  let t = seed % 2147483647;
  if (t <= 0) t += 2147483646;
  return function () {
    t = (t * 16807) % 2147483647;
    return (t - 1) / 2147483646;
  };
}

async function main() {
  const days = getWorkingDays(START_DATE, WEEKS);
  const endDate = days[days.length - 1];

  const classes = await prisma.class.findMany({
    where: { programId: PROGRAM_ID, term: 'Fall', year: '2027' },
    include: { subject: true, instructor: true },
  });

  if (classes.length === 0) {
    console.error('No Cyber Diploma Fall 2027 classes found.');
    process.exit(1);
  }

  // Clear existing attendance for the simulation window and program
  const attendanceIds = await prisma.attendance.findMany({
    where: {
      programId: PROGRAM_ID,
      date: { gte: START_DATE, lte: endDate },
    },
    select: { id: true },
  });

  if (attendanceIds.length > 0) {
    const ids = attendanceIds.map((a) => a.id);
    const deletedAmendments = await prisma.attendanceAmendment.deleteMany({
      where: { attendanceId: { in: ids } },
    });
    console.log(`Cleared ${deletedAmendments.count} existing attendance amendments.`);

    const deleted = await prisma.attendance.deleteMany({
      where: { id: { in: ids } },
    });
    console.log(`Cleared ${deleted.count} existing attendance records.`);
  } else {
    console.log('No existing attendance records to clear.');
  }

  // Clear any existing attendance workflow links and documents for the window
  const docIds = await prisma.workflowDocument.findMany({
    where: {
      workflowType: 'ATTENDANCE_DAILY',
      program: 'Cyber Diploma',
      date: { gte: START_DATE, lte: endDate },
    },
    select: { id: true },
  });
  if (docIds.length > 0) {
    await prisma.workflowDocumentAttendance.deleteMany({
      where: { workflowDocumentId: { in: docIds.map((d) => d.id) } },
    });
    await prisma.workflowDocument.deleteMany({
      where: { id: { in: docIds.map((d) => d.id) } },
    });
    console.log(`Cleared ${docIds.length} existing daily workflow documents.`);
  }

  const records = [];
  const workflowDocs = [];
  const workflowLinks = [];

  for (const cls of classes) {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: cls.id, status: { code: 'ENROLLED' } },
      include: { user: { select: { id: true, displayName: true } } },
    });

    if (enrollments.length === 0) {
      console.warn(`No enrollments for class ${cls.nameEn}`);
      continue;
    }

    // Profiles: a few students will be in each warning tier
    const students = enrollments.map((e, i) => e.userId);
    const studentProfiles = new Map();
    const shuffled = [...students].sort((a, b) => 0.5 - Math.random());

    // Dismissal candidates: 9+ unexcused
    const dismissalCandidates = shuffled.slice(0, 2);
    // Final warning candidates: 8 unexcused
    const finalCandidates = shuffled.slice(2, 4);
    // First warning candidates: 4-7 unexcused
    const firstCandidates = shuffled.slice(4, 8);
    // Mixed mild: some unexcused/excused/human but below 4
    const mildCandidates = shuffled.slice(8, 14);

    for (const studentId of students) {
      if (dismissalCandidates.includes(studentId)) {
        studentProfiles.set(studentId, {
          absentWeight: 75,
          humanWeight: 15,
          leaveWeight: 5,
          lateWeight: 3,
          presentWeight: 2,
        });
      } else if (finalCandidates.includes(studentId)) {
        studentProfiles.set(studentId, {
          absentWeight: 55,
          humanWeight: 15,
          leaveWeight: 10,
          lateWeight: 10,
          presentWeight: 10,
        });
      } else if (firstCandidates.includes(studentId)) {
        studentProfiles.set(studentId, {
          absentWeight: 30,
          humanWeight: 15,
          leaveWeight: 15,
          lateWeight: 15,
          presentWeight: 25,
        });
      } else if (mildCandidates.includes(studentId)) {
        studentProfiles.set(studentId, {
          absentWeight: 10,
          humanWeight: 10,
          leaveWeight: 10,
          lateWeight: 20,
          presentWeight: 50,
        });
      } else {
        studentProfiles.set(studentId, {
          absentWeight: 3,
          humanWeight: 2,
          leaveWeight: 5,
          lateWeight: 15,
          presentWeight: 75,
        });
      }
    }

    for (const day of days) {
      // Daily workflow document for each class per day
      const workflowDoc = {
        workflowType: 'ATTENDANCE_DAILY',
        title: `Daily Attendance - ${cls.nameEn} - ${day.toISOString().slice(0, 10)}`,
        description: `Simulated daily attendance for ${cls.nameEn}`,
        status: 'APPROVED',
        submitterId: cls.instructorId || 1,
        currentAssigneeId: null,
        classId: cls.id,
        instructorId: cls.instructorId,
        date: day,
        program: 'Cyber Diploma',
        subject: cls.subject?.nameEn || '',
        approvalFlow: 'HR_ONLY',
        attendanceSubtype: null,
        workflowCategory: 'ATTENDANCE',
        createdBy: 1,
        updatedBy: 1,
      };
      workflowDocs.push(workflowDoc);
    }

    // We'll need the actual workflow document IDs after insert, so create them now
  }

  // Insert workflow documents first so we can link attendances
  const createdDocs = [];
  for (let i = 0; i < workflowDocs.length; i += 100) {
    const batch = workflowDocs.slice(i, i + 100);
    const res = await prisma.workflowDocument.createMany({ data: batch });
    console.log(`Inserted ${res.count} workflow documents in batch.`);
  }

  // Fetch back the inserted workflow documents to get IDs
  const insertedDocs = await prisma.workflowDocument.findMany({
    where: {
      workflowType: 'ATTENDANCE_DAILY',
      program: 'Cyber Diploma',
      date: { gte: START_DATE, lte: endDate },
    },
    select: { id: true, classId: true, date: true },
  });

  const docByClassDate = new Map();
  for (const d of insertedDocs) {
    docByClassDate.set(`${d.classId}_${d.date.toISOString().slice(0, 10)}`, d.id);
  }

  // Re-fetch class list with enrollments for record generation
  for (const cls of classes) {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: cls.id, status: { code: 'ENROLLED' } },
      include: { user: { select: { id: true } } },
    });

    const students = enrollments.map((e) => e.userId);
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const dismissalCandidates = shuffled.slice(0, 2);
    const finalCandidates = shuffled.slice(2, 4);
    const firstCandidates = shuffled.slice(4, 8);
    const mildCandidates = shuffled.slice(8, 14);

    const profileFor = (studentId) => {
      if (dismissalCandidates.includes(studentId)) return [70, 5, 5, 10, 10];
      if (finalCandidates.includes(studentId)) return [55, 10, 10, 12, 13];
      if (firstCandidates.includes(studentId)) return [30, 15, 15, 15, 25];
      if (mildCandidates.includes(studentId)) return [10, 10, 10, 20, 50];
      return [3, 2, 5, 15, 75];
    };

    // Choose per-student seed to keep it deterministic-ish per run but varied
    for (const studentId of students) {
      const [a, h, l, le, p] = profileFor(studentId);
      const weights = { [STATUS.ABSENT]: a, [STATUS.HUMAN_CASE]: h, [STATUS.LATE]: le, [STATUS.LEAVE]: l, [STATUS.PRESENT]: p };
      const rng = seededRandom(studentId + cls.id * 1000);

      for (const day of days) {
        // Use weighted random with per-student seed
        const total = Object.values(weights).reduce((x, y) => x + y, 0);
        let r = rng() * total;
        let statusId = STATUS.PRESENT;
        for (const [sid, w] of Object.entries(weights)) {
          r -= w;
          if (r <= 0) {
            statusId = Number(sid);
            break;
          }
        }

        records.push({
          userId: studentId,
          classId: cls.id,
          date: day,
          statusId,
          notes: statusId === STATUS.PRESENT ? null : 'Simulated',
          programId: PROGRAM_ID,
          subjectId: cls.subjectId,
          createdBy: 1,
          updatedBy: 1,
        });
      }
    }
  }

  // Insert attendance records in batches
  for (let i = 0; i < records.length; i += 500) {
    const batch = records.slice(i, i + 500);
    const res = await prisma.attendance.createMany({ data: batch, skipDuplicates: true });
    console.log(`Inserted ${res.count} attendance records in batch.`);
  }

  // Link attendances to workflow documents
  const insertedAttendances = await prisma.attendance.findMany({
    where: {
      programId: PROGRAM_ID,
      date: { gte: START_DATE, lte: endDate },
    },
    select: { id: true, classId: true, date: true },
  });

  const links = [];
  for (const a of insertedAttendances) {
    const docId = docByClassDate.get(`${a.classId}_${a.date.toISOString().slice(0, 10)}`);
    if (docId) {
      links.push({ workflowDocumentId: docId, attendanceId: a.id });
    }
  }

  for (let i = 0; i < links.length; i += 500) {
    const batch = links.slice(i, i + 500);
    const res = await prisma.workflowDocumentAttendance.createMany({ data: batch, skipDuplicates: true });
    console.log(`Linked ${res.count} attendances in batch.`);
  }

  console.log('Simulation complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
