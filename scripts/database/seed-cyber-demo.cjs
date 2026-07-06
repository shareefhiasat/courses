/**
 * Cyber Diploma Demo Seed (idempotent, additive only)
 *
 * Creates cy.* users, CY-DIP program, Fall 2027 scheduling, UCA, and Keycloak accounts.
 * Password for all new users: Password123!
 *
 * Usage:
 *   node scripts/database/seed-cyber-demo.cjs
 *   node scripts/database/seed-cyber-demo.cjs --dry-run
 *
 * Rollback: delete records listed in scripts/database/cyber_demo_manifest.json
 */

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getSuperAdminId } = require('./helpers/getSuperAdmin.cjs');

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');
const KEYCLOAK_REALM = 'master';
const MLMS_REALM = 'military-lms';
const KEYCLOAK_CLIENT_ID = 'military-lms-app';
const DEMO_PASSWORD = 'Jordan123$';
const MANIFEST_PATH = path.join(__dirname, 'cyber_demo_manifest.json');

const RANKS = [
  { rankEn: 'Recruit', rankAr: 'مجند' },
  { rankEn: 'Private', rankAr: 'جندي' },
  { rankEn: 'Corporal', rankAr: 'عريف' },
  { rankEn: 'Sergeant', rankAr: 'رقيب' },
];

const STUDENT_NAMES = [
  { firstName: 'Omar', lastName: 'Al-Saeed', displayName: 'Omar Al-Saeed', displayNameAr: 'عمر السعيد' },
  { firstName: 'Noura', lastName: 'Al-Harbi', displayName: 'Noura Al-Harbi', displayNameAr: 'نورة الحربي' },
  { firstName: 'Faisal', lastName: 'Al-Otaibi', displayName: 'Faisal Al-Otaibi', displayNameAr: 'فيصل العتيبي' },
  { firstName: 'Huda', lastName: 'Al-Mutairi', displayName: 'Huda Al-Mutairi', displayNameAr: 'هدى المطيري' },
  { firstName: 'Yousef', lastName: 'Al-Qahtani', displayName: 'Yousef Al-Qahtani', displayNameAr: 'يوسف القحطاني' },
  { firstName: 'Amal', lastName: 'Al-Dosari', displayName: 'Amal Al-Dosari', displayNameAr: 'أمل الدوسري' },
  { firstName: 'Khalid', lastName: 'Al-Shammari', displayName: 'Khalid Al-Shammari', displayNameAr: 'خالد الشمري' },
  { firstName: 'Reem', lastName: 'Al-Ghamdi', displayName: 'Reem Al-Ghamdi', displayNameAr: 'ريم الغامدي' },
  { firstName: 'Saeed', lastName: 'Al-Anazi', displayName: 'Saeed Al-Anazi', displayNameAr: 'سعيد العنزي' },
  { firstName: 'Maha', lastName: 'Al-Zahrani', displayName: 'Maha Al-Zahrani', displayNameAr: 'مها الزهراني' },
  { firstName: 'Turki', lastName: 'Al-Balawi', displayName: 'Turki Al-Balawi', displayNameAr: 'تركي البalawi' },
  { firstName: 'Dana', lastName: 'Al-Rashid', displayName: 'Dana Al-Rashid', displayNameAr: 'دانة الرashid' },
  { firstName: 'Bandar', lastName: 'Al-Fahad', displayName: 'Bandar Al-Fahad', displayNameAr: 'بندر الفهد' },
  { firstName: 'Lama', lastName: 'Al-Shehri', displayName: 'Lama Al-Shehri', displayNameAr: 'لمى الشهري' },
  { firstName: 'Majed', lastName: 'Al-Juhani', displayName: 'Majed Al-Juhani', displayNameAr: 'مaged الجuhani' },
  { firstName: 'Aisha', lastName: 'Al-Malki', displayName: 'Aisha Al-Malki', displayNameAr: 'عائشة المalki' },
  { firstName: 'Hamad', lastName: 'Al-Enezi', displayName: 'Hamad Al-Enezi', displayNameAr: 'حمد العنزي' },
  { firstName: 'Salma', lastName: 'Al-Khalidi', displayName: 'Salma Al-Khalidi', displayNameAr: 'سلمى الخالدي' },
  { firstName: 'Nasser', lastName: 'Al-Harthy', displayName: 'Nasser Al-Harthy', displayNameAr: 'ناصر الحارثي' },
  { firstName: 'Rania', lastName: 'Al-Sulaimi', displayName: 'Rania Al-Sulaimi', displayNameAr: 'رانيا السulaimi' },
];

const SUBJECTS = [
  { code: 'CY101', nameEn: 'Introduction to Cybersecurity', nameAr: 'مقدمة في الأمن السيبراني', instructorKey: 'instructor1' },
  { code: 'CY102', nameEn: 'Network Security', nameAr: 'أمن الشبكات', instructorKey: 'instructor1' },
  { code: 'CY103', nameEn: 'Cryptography & Data Protection', nameAr: 'التشفير وحماية البيانات', instructorKey: 'instructor2' },
  { code: 'CY104', nameEn: 'Ethical Hacking', nameAr: 'الاختراق الأخلاقي', instructorKey: 'instructor3' },
  { code: 'CY105', nameEn: 'Digital Forensics', nameAr: 'الطب الشرعي الرقمي', instructorKey: 'instructor4' },
];

/** Weekly slot assignments per subject code */
const SUBJECT_SCHEDULE = {
  CY101: [
    { day: 'Sun', startTime: '07:00', endTime: '08:00' },
    { day: 'Tue', startTime: '10:00', endTime: '11:00' },
  ],
  CY102: [
    { day: 'Sun', startTime: '08:30', endTime: '09:30' },
    { day: 'Wed', startTime: '07:00', endTime: '08:30' },
  ],
  CY103: [
    { day: 'Sun', startTime: '10:00', endTime: '11:00' },
    { day: 'Wed', startTime: '09:00', endTime: '10:30' },
    { day: 'Thu', startTime: '07:00', endTime: '08:00' },
  ],
  CY104: [
    { day: 'Mon', startTime: '07:00', endTime: '08:30' },
    { day: 'Tue', startTime: '07:00', endTime: '08:00' },
    { day: 'Thu', startTime: '08:30', endTime: '09:30' },
  ],
  CY105: [
    { day: 'Mon', startTime: '09:00', endTime: '10:30' },
    { day: 'Tue', startTime: '08:30', endTime: '09:30' },
    { day: 'Thu', startTime: '10:00', endTime: '11:00' },
  ],
};

const INSTRUCTOR_OFFICE_DAYS = {
  instructor1: ['Sun', 'Tue', 'Wed'],
  instructor2: ['Sun', 'Wed', 'Thu'],
  instructor3: ['Mon', 'Tue', 'Thu'],
  instructor4: ['Mon', 'Tue', 'Thu'],
};

/** Matches hr1/admin1/instructor1/student1 master realm role pattern */
const KC_ROLE_PATTERNS = {
  HR: { realm: ['HR', 'hr'], client: ['HR'] },
  ADMIN: { realm: ['ADMIN', 'admin'], client: ['ADMIN'] },
  INSTRUCTOR: { realm: ['INSTRUCTOR', 'instructor'], client: ['INSTRUCTOR'] },
  STUDENT: { realm: ['STUDENT', 'student'], client: ['STUDENT'] },
};

function emailToUsername(email) {
  return email.split('@')[0];
}

const manifest = {
  seededAt: new Date().toISOString(),
  dryRun: DRY_RUN,
  users: [],
  programId: null,
  categoryId: null,
  subjectIds: [],
  classIds: [],
  enrollmentIds: [],
  sessionIds: [],
  ucaIds: [],
};

function log(msg) {
  console.log(msg);
}

async function fixSequence(tableName) {
  if (DRY_RUN) return;
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE((SELECT MAX(id) FROM "${tableName}"), 1))`
  );
}

function kcExec(cmd) {
  if (DRY_RUN) return '';
  return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
}

function ensureKeycloakAuth() {
  if (DRY_RUN) return;
  try {
    kcExec(
      `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin123`
    );
  } catch (e) {
    log(`  ⚠️  Keycloak auth config: ${e.message}`);
  }
}

function assignKcRoles(userId, roleCode) {
  const pattern = KC_ROLE_PATTERNS[roleCode];
  if (!pattern) return;
  const realmArgs = pattern.realm.map((r) => `--rolename ${r}`).join(' ');
  const clientArgs = pattern.client.map((r) => `--rolename ${r}`).join(' ');
  try {
    kcExec(
      `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh add-roles -r ${KEYCLOAK_REALM} --uid ${userId} ${realmArgs}`
    );
  } catch (_) {}
  try {
    kcExec(
      `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh add-roles -r ${KEYCLOAK_REALM} --uid ${userId} --cclientid ${KEYCLOAK_CLIENT_ID} ${clientArgs}`
    );
  } catch (_) {}
}

function syncKeycloakUser({ email, firstName, lastName, roleCode }) {
  if (DRY_RUN) {
    log(`  [dry-run] Keycloak master: ${emailToUsername(email)} (${roleCode})`);
    return null;
  }
  const username = emailToUsername(email);
  try {
    const getUserCmd = `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh get users -r ${KEYCLOAK_REALM} -q username="${username}" --fields id,username`;
    let userId = null;

    try {
      const parsed = JSON.parse(kcExec(getUserCmd).trim() || '[]');
      userId = parsed.find((u) => u.username === username)?.id || null;
    } catch (_) {
      userId = null;
    }

    if (userId) {
      log(`  ⏭️  Keycloak master exists: ${username}`);
    } else {
      try {
        kcExec(
          `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh create users -r ${KEYCLOAK_REALM} -s username="${username}" -s email="${email}" -s firstName="${firstName.replace(/"/g, '')}" -s lastName="${lastName.replace(/"/g, '')}" -s enabled=true -s emailVerified=true`
        );
        log(`  ✅ Keycloak master created: ${username}`);
      } catch (createErr) {
        if (!String(createErr.message || createErr).includes('User exists')) throw createErr;
        log(`  ⏭️  Keycloak master exists (by email): ${username}`);
      }
      const parsedAfter = JSON.parse(kcExec(getUserCmd).trim() || '[]');
      userId = parsedAfter.find((u) => u.username === username)?.id || null;
    }

    if (userId) {
      try {
        kcExec(
          `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh set-password -r ${KEYCLOAK_REALM} --username "${username}" --new-password '${DEMO_PASSWORD.replace(/'/g, "'\\''")}'`
        );
      } catch (_) {}
      assignKcRoles(userId, roleCode);
    }
    return userId;
  } catch (error) {
    log(`  ⚠️  Keycloak failed for ${email}: ${error.message}`);
    return null;
  }
}

async function ensureRole(code) {
  return prisma.userRoles.findFirst({ where: { code } });
}

async function ensureUser({ email, firstName, lastName, displayName, displayNameAr, roleCode, studentNumber, rankEn, rankAr, createdBy }) {
  const role = await ensureRole(roleCode);
  if (!role) throw new Error(`Role ${roleCode} not found`);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    if (DRY_RUN) {
      log(`  [dry-run] Would create user: ${email}`);
      return { id: -1, email };
    }
    user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        displayName,
        displayNameAr: displayNameAr || null,
        studentNumber: studentNumber || null,
        rankEn: rankEn || null,
        rankAr: rankAr || null,
        isActive: true,
        createdBy,
      },
    });
    log(`  ✅ User created: ${email}`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName,
        displayNameAr: displayNameAr || user.displayNameAr,
        studentNumber: studentNumber || user.studentNumber,
        rankEn: rankEn || user.rankEn,
        rankAr: rankAr || user.rankAr,
      },
    });
    log(`  ⏭️  User exists: ${email}`);
  }

  const hasRole = await prisma.userRoleAssignment.findFirst({
    where: { userId: user.id, roleId: role.id },
  });
  if (!hasRole && !DRY_RUN) {
    await prisma.userRoleAssignment.create({ data: { userId: user.id, roleId: role.id } });
  }

  const keycloakId = syncKeycloakUser({ email, firstName, lastName, roleCode });
  if (keycloakId && !DRY_RUN) {
    await prisma.user.update({ where: { id: user.id }, data: { keycloakId } });
  } else if (!DRY_RUN && !user.keycloakId) {
    try {
      const username = emailToUsername(email);
      const getUserCmd = `docker exec lms-qaf-keycloak /opt/keycloak/bin/kcadm.sh get users -r ${KEYCLOAK_REALM} -q username="${username}" --fields id`;
      const parsed = JSON.parse(execSync(getUserCmd, { encoding: 'utf8', stdio: 'pipe' }).trim() || '[]');
      if (parsed[0]?.id) {
        await prisma.user.update({ where: { id: user.id }, data: { keycloakId: parsed[0].id } });
      }
    } catch (_) {
      // ignore
    }
  }

  manifest.users.push({ id: user.id, email, role: roleCode });
  return user;
}

async function ensureDataScopeProfile(userId, createdBy) {
  if (DRY_RUN || userId < 0) return;
  await prisma.userDataScopeProfile.upsert({
    where: { userId },
    create: { userId, programsMode: 'UCA', subjectsMode: 'UCA', classesMode: 'UCA', createdBy },
    update: { programsMode: 'UCA', subjectsMode: 'UCA', classesMode: 'UCA' },
  });
}

async function ensureUca({ userId, categoryId, programId, subjectId, canManage, createdBy }) {
  if (DRY_RUN || userId < 0) return;
  const existing = await prisma.userCategoryAccess.findFirst({
    where: {
      userId,
      categoryId,
      programId: programId || null,
      subjectId: subjectId || null,
      classId: null,
    },
  });
  if (existing) {
    await prisma.userCategoryAccess.update({
      where: { id: existing.id },
      data: { canView: true, canManage: !!canManage, isActive: true },
    });
    manifest.ucaIds.push(existing.id);
    return existing;
  }
  const row = await prisma.userCategoryAccess.create({
    data: {
      userId,
      categoryId,
      programId: programId || null,
      subjectId: subjectId || null,
      canView: true,
      canManage: !!canManage,
      isActive: true,
      createdBy,
    },
  });
  manifest.ucaIds.push(row.id);
  return row;
}

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

function generateSessionsForSlot({ classId, instructorId, classroomId, day, startTime, endTime, semesterStart, semesterEnd, createdBy }) {
  const sessions = [];
  const dayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const targetDay = dayIndex[day];
  let current = new Date(semesterStart);
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
  log('🔐 Cyber Diploma Demo Seed\n');
  if (DRY_RUN) log('⚠️  DRY RUN — no writes\n');

  const createdBy = await getSuperAdminId();
  if (!createdBy) throw new Error('Super admin not found');

  ensureKeycloakAuth();

  // Fix broken id sequences (common after manual imports)
  for (const table of [
    'category_types', 'programs', 'subjects', 'classes', 'users',
    'user_role_assignments', 'enrollments', 'scheduled_sessions', 'time_slots',
    'break_sessions', 'instructor_availability', 'instructor_availability_slot',
    'user_category_access', 'user_data_scope_profiles',
  ]) {
    await fixSequence(table);
  }

  // --- Academic term ---
  if (!DRY_RUN) {
    await prisma.academicTerms.upsert({
      where: { code: '2027-FALL' },
      create: { code: '2027-FALL', nameEn: 'Fall 2027', nameAr: 'خريف 2027', isActive: true },
      update: { nameEn: 'Fall 2027', nameAr: 'خريف 2027', isActive: true },
    });
    log('✅ Academic term 2027-FALL');
  }

  // --- Category ---
  let category = await prisma.categoryTypes.findFirst({ where: { code: 'CYBER' } });
  if (!category && !DRY_RUN) {
    category = await prisma.categoryTypes.create({
        data: {
          code: 'CYBER',
          nameEn: 'Cyber Security',
          nameAr: 'الأمن السيبراني',
          categoryType: 'ACCESS_SCOPE',
          isActive: true,
          createdBy,
        },
      });
      log('✅ Category CYBER created');
  } else if (category) {
    log('⏭️  Category CYBER exists');
  } else if (!category && DRY_RUN) {
    category = await prisma.categoryTypes.findFirst({ where: { code: 'TECHNICAL' } });
  }
  manifest.categoryId = category?.id;

  // --- Program ---
  const semesterStart = new Date('2027-09-01T00:00:00');
  const semesterEnd = new Date('2027-12-15T23:59:59');

  let program = await prisma.program.findFirst({ where: { code: 'CY-DIP' } });
  if (!program && !DRY_RUN) {
    program = await prisma.program.create({
      data: {
        code: 'CY-DIP',
        nameEn: 'Cyber Diploma',
        nameAr: 'دبلوم الأمن السيبراني',
        descriptionEn: 'Two-year diploma in cybersecurity — Fall 2027 cohort',
        descriptionAr: 'دبلوم لمدة عامين في الأمن السيبراني — دفعة خريف 2027',
        durationYears: 2,
        durationType: 'ACADEMIC_SEMESTER',
        startDate: semesterStart,
        endDate: new Date('2029-06-30'),
        categoryId: category?.id || null,
        isActive: true,
        createdBy,
      },
    });
    log('✅ Program CY-DIP created');
  } else if (program) {
    if (!DRY_RUN && category) {
      program = await prisma.program.update({
        where: { id: program.id },
        data: { categoryId: category.id },
      });
    }
    log('⏭️  Program CY-DIP exists');
  }
  manifest.programId = program?.id;

  // --- Staff users ---
  const staffDefs = [
    { key: 'hr1', email: 'cy.hr1@example.com', firstName: 'Nadia', lastName: 'Al-Harbi', displayName: 'Nadia Al-Harbi', displayNameAr: 'نادية الحربي', roleCode: 'HR' },
    { key: 'admin1', email: 'cy.admin1@example.com', firstName: 'Rashid', lastName: 'Al-Mutairi', displayName: 'Rashid Al-Mutairi', displayNameAr: 'رashid المطيري', roleCode: 'ADMIN' },
    { key: 'instructor1', email: 'cy.instructor1@example.com', firstName: 'Dr. Sami', lastName: 'Al-Qahtani', displayName: 'Dr. Sami Al-Qahtani', displayNameAr: 'د. سami القحطاني', roleCode: 'INSTRUCTOR' },
    { key: 'instructor2', email: 'cy.instructor2@example.com', firstName: 'Dr. Layla', lastName: 'Al-Dosari', displayName: 'Dr. Layla Al-Dosari', displayNameAr: 'د. layla الدوسري', roleCode: 'INSTRUCTOR' },
    { key: 'instructor3', email: 'cy.instructor3@example.com', firstName: 'Prof. Tariq', lastName: 'Al-Shammari', displayName: 'Prof. Tariq Al-Shammari', displayNameAr: 'أ. tariq الشمري', roleCode: 'INSTRUCTOR' },
    { key: 'instructor4', email: 'cy.instructor4@example.com', firstName: 'Dr. Hana', lastName: 'Al-Ghamdi', displayName: 'Dr. Hana Al-Ghamdi', displayNameAr: 'د. hana الغامdi', roleCode: 'INSTRUCTOR' },
  ];

  const users = {};
  for (const s of staffDefs) {
    users[s.key] = await ensureUser({ ...s, createdBy });
    await ensureDataScopeProfile(users[s.key].id, createdBy);
  }

  // --- Students ---
  const students = [];
  for (let i = 0; i < 20; i++) {
    const n = STUDENT_NAMES[i];
    const rank = RANKS[i % RANKS.length];
    const num = String(1001 + i);
    const student = await ensureUser({
      email: `cy.student${i + 1}@example.com`,
      firstName: n.firstName,
      lastName: n.lastName,
      displayName: n.displayName,
      displayNameAr: n.displayNameAr,
      roleCode: 'STUDENT',
      studentNumber: num,
      rankEn: rank.rankEn,
      rankAr: rank.rankAr,
      createdBy,
    });
    students.push(student);
  }

  if (DRY_RUN) {
    log('\n✅ Dry run complete — no data written');
    return;
  }

  const coreType = await prisma.subjectTypes.findFirst({ where: { code: 'major' } });
  const mandatoryType = await prisma.requirementTypes.findFirst({ where: { code: 'compulsory' } });
  const enrolledStatus = await prisma.enrollmentStatusTypes.findFirst({ where: { code: 'ENROLLED' } });
  const classroom = await prisma.classroom.findFirst({ where: { isActive: true } });
  if (!classroom) throw new Error('No active classroom found');

  // --- Subjects & classes ---
  const subjectMap = {};
  const classMap = {};

  for (const sd of SUBJECTS) {
    let subject = await prisma.subject.findFirst({ where: { code: sd.code, programId: program.id } });
    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          code: sd.code,
          nameEn: sd.nameEn,
          nameAr: sd.nameAr,
          programId: program.id,
          typeId: coreType?.id || 1,
          requirementTypeId: mandatoryType?.id || 1,
          credits: 3,
          isActive: true,
          createdBy,
        },
      });
      log(`  ✅ Subject ${sd.code}`);
    }
    subjectMap[sd.code] = subject;
    manifest.subjectIds.push(subject.id);

    const classCode = `${sd.code}-2027-FALL-SEC1`;
    const classNameEn = sd.nameEn;
    const classNameAr = sd.nameAr;
    let cls = await prisma.class.findFirst({ where: { code: classCode } });
    const classData = {
      nameEn: classNameEn,
      nameAr: classNameAr,
      term: 'Fall',
      year: '2027',
      startDate: semesterStart,
      endDate: semesterEnd,
      maxCapacity: 30,
      isActive: true,
    };
    if (!cls) {
      cls = await prisma.class.create({
        data: {
          code: classCode,
          ...classData,
          programId: program.id,
          subjectId: subject.id,
          instructorId: users[sd.instructorKey].id,
          classroomId: classroom.id,
          createdBy,
        },
      });
      log(`  ✅ Class ${classCode}`);
    } else {
      cls = await prisma.class.update({
        where: { id: cls.id },
        data: classData,
      });
      log(`  ↻ Class ${classCode} (names/term updated)`);
    }
    classMap[sd.code] = cls;
    manifest.classIds.push(cls.id);
  }

  // --- Enrollments ---
  for (const student of students) {
    for (const sd of SUBJECTS) {
      const cls = classMap[sd.code];
      const existing = await prisma.enrollment.findFirst({
        where: { userId: student.id, classId: cls.id },
      });
      if (!existing) {
        const enr = await prisma.enrollment.create({
          data: {
            userId: student.id,
            classId: cls.id,
            programId: program.id,
            subjectId: subjectMap[sd.code].id,
            statusId: enrolledStatus.id,
            createdBy,
          },
        });
        manifest.enrollmentIds.push(enr.id);
      }
    }
  }
  log(`✅ Enrollments: ${students.length} students × 5 subjects`);

  // --- Time slots ---
  const slotDefs = [
    { labelEn: '1st Lecture', labelAr: 'المحاضرة الأولى', startTime: '07:00', endTime: '08:00', durationMinutes: 60, sortOrder: 1, isBreak: false },
    { labelEn: 'Break', labelAr: 'استراحة', startTime: '08:00', endTime: '08:30', durationMinutes: 30, sortOrder: 2, isBreak: true, breakType: 'TeaBreak' },
    { labelEn: '2nd Lecture', labelAr: 'المحاضرة الثانية', startTime: '08:30', endTime: '09:30', durationMinutes: 60, sortOrder: 3, isBreak: false },
    { labelEn: 'Break', labelAr: 'استراحة', startTime: '09:30', endTime: '10:00', durationMinutes: 30, sortOrder: 4, isBreak: true, breakType: 'TeaBreak' },
    { labelEn: '3rd Lecture', labelAr: 'المحاضرة الثالثة', startTime: '10:00', endTime: '11:00', durationMinutes: 60, sortOrder: 5, isBreak: false },
    { labelEn: 'Office Hours', labelAr: 'ساعات مكتبية', startTime: '11:00', endTime: '12:00', durationMinutes: 60, sortOrder: 6, isBreak: true, breakType: 'OfficeHours' },
  ];

  const timeSlots = {};
  for (const slot of slotDefs) {
    let ts = await prisma.timeSlot.findFirst({
      where: { programId: program.id, startTime: slot.startTime, endTime: slot.endTime },
    });
    if (!ts) {
      ts = await prisma.timeSlot.create({ data: { ...slot, programId: program.id } });
    }
    timeSlots[slot.sortOrder] = ts;
  }
  log('✅ Time slots for CY-DIP');

  // --- Scheduled sessions ---
  let sessionCount = 0;
  for (const sd of SUBJECTS) {
    const cls = classMap[sd.code];
    const instructor = users[sd.instructorKey];
    const slots = SUBJECT_SCHEDULE[sd.code] || [];

    for (const slot of slots) {
      const sessions = generateSessionsForSlot({
        classId: cls.id,
        instructorId: instructor.id,
        classroomId: classroom.id,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        semesterStart,
        semesterEnd,
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
          const created = await prisma.scheduledSession.create({ data: sess });
          manifest.sessionIds.push(created.id);
          sessionCount++;
        }
      }
    }
  }
  log(`✅ Scheduled sessions: ${sessionCount} new`);

  // --- Instructor availability (office hours) ---
  for (const [key, days] of Object.entries(INSTRUCTOR_OFFICE_DAYS)) {
    const instructor = users[key];
    const existing = await prisma.instructorAvailability.findFirst({
      where: { instructorUserId: instructor.id, programId: program.id },
    });
    if (!existing) {
      await prisma.instructorAvailability.create({
        data: {
          instructorUserId: instructor.id,
          dayOfWeek: days,
          startDate: semesterStart,
          endDate: semesterEnd,
          maxSessionsPerDay: 3,
          programId: program.id,
          isActive: true,
          createdBy,
          slots: {
            create: [{ startTime: '11:00', endTime: '12:00' }],
          },
        },
      });
      log(`  ✅ Office hours: ${key}`);
    }
  }

  // --- Break sessions (sample week starting 2027-09-07 Sun) ---
  const breakWeekStart = new Date('2027-09-07');
  const breakDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  for (let d = 0; d < 5; d++) {
    const date = new Date(breakWeekStart);
    date.setDate(date.getDate() + d);
    for (const sortOrder of [2, 4]) {
      const ts = timeSlots[sortOrder];
      if (!ts) continue;
      const exists = await prisma.breakSession.findFirst({
        where: { programId: program.id, timeSlotId: ts.id, date },
      });
      if (!exists) {
        await prisma.breakSession.create({
          data: {
            programId: program.id,
            timeSlotId: ts.id,
            date,
            breakType: 'TeaBreak',
            descriptionEn: 'Morning break',
            descriptionAr: 'استراحة صباحية',
            isActive: true,
            createdBy,
          },
        });
      }
    }
  }
  log('✅ Break sessions for sample week');

  // --- User category access ---
  if (category) {
    await ensureUca({ userId: users.admin1.id, categoryId: category.id, programId: program.id, canManage: true, createdBy });
    await ensureUca({ userId: users.hr1.id, categoryId: category.id, programId: program.id, canManage: true, createdBy });

    for (const sd of SUBJECTS) {
      const instructor = users[sd.instructorKey];
      await ensureUca({
        userId: instructor.id,
        categoryId: category.id,
        programId: program.id,
        subjectId: subjectMap[sd.code].id,
        canManage: false,
        createdBy,
      });
    }
    log('✅ User category access rows');
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  log(`\n📋 Manifest written: ${MANIFEST_PATH}`);

  // Backfill Keycloak IDs for all cy.* users (master realm)
  log('\n🔗 Linking Keycloak master IDs...');
  const cyUsers = await prisma.user.findMany({
    where: { email: { startsWith: 'cy.' } },
    include: { roleAssignments: { include: { role: true } } },
  });
  for (const u of cyUsers) {
    const roleCode = u.roleAssignments[0]?.role?.code || 'STUDENT';
    const kcId = syncKeycloakUser({
      email: u.email,
      firstName: u.firstName || 'Cyber',
      lastName: u.lastName || 'User',
      roleCode,
    });
    if (kcId) {
      await prisma.user.update({ where: { id: u.id }, data: { keycloakId: kcId } });
      log(`  🔗 Linked ${emailToUsername(u.email)}`);
    }
  }

  log('\n🎉 Cyber Diploma demo seed complete!');
  log(`\nDemo logins (password: ${DEMO_PASSWORD}):`);
  log('  cy.hr1@example.com');
  log('  cy.admin1@example.com');
  log('  cy.instructor1@example.com … cy.instructor4@example.com');
  log('  cy.student1@example.com … cy.student20@example.com');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
