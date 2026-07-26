/**
 * Seed script for test marks data:
 * - Complementary exam PASS (score >= 60 → final mark 60, grade D)
 * - Complementary exam FAIL (score < 60 → actual score, grade F)
 * - FB (Fail due to absence > 20%)
 * - FA (Fail due to absent from final exam)
 * - WF (Compulsory withdrawal)
 * - Civil Engineering subjects, classes, students, marks (flood data)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding test marks data...\n');

  const adminUser = await prisma.user.findFirst({ where: { email: 'shareef.hiasat@gmail.com' } });
  const adminId = adminUser.id;
  const enrolledStatus = await prisma.enrollmentStatusTypes.findFirst({ where: { code: 'ENROLLED' } });

  // ============================================================
  // 1. COMPLEMENTARY EXAM — PASS CASE
  // Fatima (STU002, userId=18) failed DB101 in Fall 2024 (classId=27, subjectId=4)
  // Add complementary record with score 65 → pass → totalMarks=60, grade=D
  // ============================================================
  console.log('📚 Adding complementary PASS case (Fatima, DB101 Fall 2024)...');
  await prisma.studentMarks.upsert({
    where: { userId_subjectId_classId_isRepeated: { userId: 18, subjectId: 4, classId: 27, isRepeated: true } },
    update: {
      finalExam: 65,
      totalMarks: 60,
      letterGrade: 'D',
      gradeType: 'complementary',
      updatedBy: adminId,
    },
    create: {
      userId: 18,
      subjectId: 4,
      classId: 27,
      isRepeated: true,
      gradeType: 'complementary',
      midTermExam: 0,
      finalExam: 65,
      homework: 0,
      labsProjectResearch: 0,
      quizzes: 0,
      participation: 0,
      attendance: 0,
      totalMarks: 60,
      letterGrade: 'D',
      createdBy: adminId,
    },
  });
  console.log('  ✅ Fatima complementary PASS: 65/100 → D (60%)');

  // ============================================================
  // 2. COMPLEMENTARY EXAM — FAIL CASE (already exists for Ahmed)
  // Ahmed (STU001, userId=17) has complementary in DB101 Spring 2024 (classId=20)
  // Score 20.05/100 → F. Let's also add one for Mohammed.
  // Mohammed (STU003, userId=19) failed NET101 Fall 2023 (classId=14, subjectId=5)
  // ============================================================
  console.log('📚 Adding complementary FAIL case (Mohammed, NET101 Fall 2023)...');
  await prisma.studentMarks.upsert({
    where: { userId_subjectId_classId_isRepeated: { userId: 19, subjectId: 5, classId: 14, isRepeated: true } },
    update: {
      finalExam: 45,
      totalMarks: 45,
      letterGrade: 'F',
      gradeType: 'complementary',
      updatedBy: adminId,
    },
    create: {
      userId: 19,
      subjectId: 5,
      classId: 14,
      isRepeated: true,
      gradeType: 'complementary',
      midTermExam: 0,
      finalExam: 45,
      homework: 0,
      labsProjectResearch: 0,
      quizzes: 0,
      participation: 0,
      attendance: 0,
      totalMarks: 45,
      letterGrade: 'F',
      createdBy: adminId,
    },
  });
  console.log('  ✅ Mohammed complementary FAIL: 45/100 → F (45%)');

  // ============================================================
  // 3. COMPLEMENTARY EXAM — PASS in same semester (merge test)
  // Omar (STU005, userId=21) failed CS102-A (classId=3, subjectId=2)
  // Add complementary with score 72 → pass → 60, D
  // ============================================================
  console.log('📚 Adding complementary PASS merge case (Omar, CS101 Spring 2025)...');
  await prisma.studentMarks.upsert({
    where: { userId_subjectId_classId_isRepeated: { userId: 21, subjectId: 2, classId: 3, isRepeated: true } },
    update: {
      finalExam: 72,
      totalMarks: 60,
      letterGrade: 'D',
      gradeType: 'complementary',
      updatedBy: adminId,
    },
    create: {
      userId: 21,
      subjectId: 2,
      classId: 3,
      isRepeated: true,
      gradeType: 'complementary',
      midTermExam: 0,
      finalExam: 72,
      homework: 0,
      labsProjectResearch: 0,
      quizzes: 0,
      participation: 0,
      attendance: 0,
      totalMarks: 60,
      letterGrade: 'D',
      createdBy: adminId,
    },
  });
  console.log('  ✅ Omar complementary PASS: 72/100 → D (60%)');

  // ============================================================
  // 4. FB — Fail due to absence exceeding 20%
  // Mariam (STU008, userId=24) failed CS201-A (classId=4, subjectId=3)
  // ============================================================
  console.log('📚 Adding FB case (Mariam, WEB101 Spring 2025)...');
  await prisma.studentMarks.update({
    where: { id: 24 }, // Mariam's mark in classId=4
    data: {
      gradeType: 'FB',
      letterGrade: 'FB',
      totalMarks: 0,
      updatedBy: adminId,
    },
  });
  console.log('  ✅ Mariam FB: Fail due to absence > 20%');

  // ============================================================
  // 5. FA — Fail due to absent from final exam
  // Youssef (STU007, userId=23) — let's set his mark in a class to FA
  // Check if he has marks... Let's use a class where he has a mark
  // ============================================================
  console.log('📚 Adding FA case...');
  // Find Youssef's marks
  const youssefMarks = await prisma.studentMarks.findFirst({ where: { userId: 23, isRepeated: false } });
  if (youssefMarks) {
    await prisma.studentMarks.update({
      where: { id: youssefMarks.id },
      data: {
        gradeType: 'FA',
        letterGrade: 'FA',
        totalMarks: 0,
        finalExam: 0,
        updatedBy: adminId,
      },
    });
    console.log(`  ✅ Youssef FA: Fail due to absent from final exam (mark id: ${youssefMarks.id})`);
  }

  // ============================================================
  // 6. WF — Compulsory withdrawal
  // Layla (STU006, userId=22) — set one of her marks to WF
  // ============================================================
  console.log('📚 Adding WF case...');
  const laylaMarks = await prisma.studentMarks.findFirst({ where: { userId: 22, isRepeated: false } });
  if (laylaMarks) {
    await prisma.studentMarks.update({
      where: { id: laylaMarks.id },
      data: {
        gradeType: 'WF',
        letterGrade: 'WF',
        totalMarks: 0,
        updatedBy: adminId,
      },
    });
    console.log(`  ✅ Layla WF: Compulsory withdrawal (mark id: ${laylaMarks.id})`);
  }

  // ============================================================
  // 7. CIVIL ENGINEERING — Create subjects, classes, students, marks
  // ============================================================
  console.log('📚 Creating Civil Engineering program data...');

  const ceProgram = await prisma.program.findFirst({ where: { code: 'CE-ENG' } });
  if (!ceProgram) {
    console.log('  ⚠️ Civil Engineering program not found, skipping CE data');
  } else {
    const coreType = await prisma.subjectTypes.findFirst({ where: { code: 'major' } });
    const mandatoryType = await prisma.requirementTypes.findFirst({ where: { code: 'compulsory' } });

    // Create CE subjects
    const ceSubjectsData = [
      { code: 'CE101', nameEn: 'Engineering Mechanics', nameAr: 'ميكانيكا الهندسة', credits: 4 },
      { code: 'CE102', nameEn: 'Structural Analysis', nameAr: 'تحليل الإنشاءات', credits: 3 },
      { code: 'CE201', nameEn: 'Fluid Mechanics', nameAr: 'ميكانيكا الموائع', credits: 3 },
      { code: 'CE202', nameEn: 'Geotechnical Engineering', nameAr: 'الهندسة الجيوتقنية', credits: 3 },
      { code: 'CE301', nameEn: 'Construction Materials', nameAr: 'مواد البناء', credits: 3 },
    ];

    const ceSubjects = [];
    for (const sd of ceSubjectsData) {
      let subject = await prisma.subject.findFirst({ where: { code: sd.code } });
      if (!subject) {
        subject = await prisma.subject.create({
          data: { ...sd, programId: ceProgram.id, typeId: coreType.id, requirementTypeId: mandatoryType.id, isActive: true, createdBy: adminId },
        });
      } else {
        subject = await prisma.subject.update({ where: { id: subject.id }, data: { nameEn: sd.nameEn, nameAr: sd.nameAr, credits: sd.credits, programId: ceProgram.id } });
      }
      ceSubjects.push(subject);
      console.log(`  ✅ CE Subject: ${subject.nameEn}`);

      // Create marks distribution for each CE subject
      await prisma.marksDistribution.upsert({
        where: { subjectId: subject.id },
        update: {},
        create: {
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

    // Create CE classes across multiple terms
    const terms = ['2023-FALL', '2024-SPRING', '2024-FALL', '2025-SPRING'];
    const ceClasses = [];
    for (const subject of ceSubjects) {
      for (const term of terms) {
        const year = term.split('-')[0];
        const classCode = `${subject.code}-${term}-A`;
        let cls = await prisma.class.findFirst({ where: { code: classCode } });
        if (!cls) {
          cls = await prisma.class.create({
            data: {
              code: classCode,
              nameEn: `${subject.nameEn} - ${term} Section A`,
              nameAr: `${subject.nameAr} - ${term} شعبة أ`,
              programId: ceProgram.id,
              subjectId: subject.id,
              term,
              year,
              maxCapacity: 30,
              isActive: true,
              createdBy: adminId,
            },
          });
        }
        ceClasses.push(cls);
      }
    }
    console.log(`  ✅ Created ${ceClasses.length} CE classes`);

    // Create CE students
    const ceStudentsData = [
      { email: 'ce.student1@example.com', firstName: 'Khaled', lastName: 'Al-Rashid', displayName: 'Khaled Al-Rashid', studentNumber: 'CE001' },
      { email: 'ce.student2@example.com', firstName: 'Sara', lastName: 'Al-Mansour', displayName: 'Sara Al-Mansour', studentNumber: 'CE002' },
      { email: 'ce.student3@example.com', firstName: 'Hassan', lastName: 'Al-Zahrawi', displayName: 'Hassan Al-Zahrawi', studentNumber: 'CE003' },
      { email: 'ce.student4@example.com', firstName: 'Lina', lastName: 'Al-Kindi', displayName: 'Lina Al-Kindi', studentNumber: 'CE004' },
      { email: 'ce.student5@example.com', firstName: 'Tariq', lastName: 'Al-Farabi', displayName: 'Tariq Al-Farabi', studentNumber: 'CE005' },
      { email: 'ce.student6@example.com', firstName: 'Maya', lastName: 'Al-Idrisi', displayName: 'Maya Al-Idrisi', studentNumber: 'CE006' },
    ];

    const ceStudents = [];
    for (const sd of ceStudentsData) {
      let user = await prisma.user.findFirst({ where: { email: sd.email } });
      if (!user) {
        user = await prisma.user.create({ data: { ...sd, isActive: true, keycloakId: `temp-${sd.email}` } });
      } else {
        user = await prisma.user.update({ where: { id: user.id }, data: { displayName: sd.displayName, firstName: sd.firstName, lastName: sd.lastName, studentNumber: sd.studentNumber } });
      }
      ceStudents.push(user);
      console.log(`  ✅ CE Student: ${user.displayName} (${user.studentNumber})`);
    }

    // Enroll CE students in classes and create marks
    let marksCount = 0;
    for (const student of ceStudents) {
      // Enroll in 2-3 subjects per term
      const subjectsToEnroll = ceSubjects.slice(0, 3); // First 3 subjects
      for (const subject of subjectsToEnroll) {
        // Pick one class for this subject (2024-SPRING term)
        const cls = ceClasses.find(c => c.subjectId === subject.id && c.term === '2024-SPRING');
        if (!cls) continue;

        let enrollment = await prisma.enrollment.findFirst({ where: { userId: student.id, classId: cls.id } });
        if (!enrollment) {
          enrollment = await prisma.enrollment.create({
            data: {
              userId: student.id,
              classId: cls.id,
              programId: ceProgram.id,
              subjectId: subject.id,
              statusId: enrolledStatus.id,
              createdBy: adminId,
            },
          });
        } else {
          enrollment = await prisma.enrollment.update({ where: { id: enrollment.id }, data: { statusId: enrolledStatus.id } });
        }

        // Generate marks based on student index (varying performance)
        const studentIdx = ceStudents.findIndex(s => s.id === student.id);
        const subjectIdx = subjectsToEnroll.findIndex(s => s.id === subject.id);

        // Different patterns: some pass, some fail, some complementary
        const patterns = [
          { mid: 16, final: 32, hw: 4, lab: 8, quiz: 4, part: 8, att: 9 },   // Pass B
          { mid: 10, final: 18, hw: 3, lab: 5, quiz: 2, part: 5, att: 6 },   // Fail F
          { mid: 14, final: 28, hw: 4, lab: 7, quiz: 3, part: 7, att: 8 },   // Pass C
          { mid: 8, final: 15, hw: 2, lab: 4, quiz: 1, part: 4, att: 5 },    // Fail F → complementary
          { mid: 18, final: 36, hw: 5, lab: 9, quiz: 5, part: 9, att: 10 },  // Pass A
          { mid: 12, final: 22, hw: 3, lab: 6, quiz: 3, part: 6, att: 7 },   // Fail F → complementary
        ];

        const pattern = patterns[(studentIdx * subjectsToEnroll.length + subjectIdx) % patterns.length];
        const total = pattern.mid + pattern.final + pattern.hw + pattern.lab + pattern.quiz + pattern.part + pattern.att;
        const percentage = (total / 100) * 100;
        let letterGrade = 'F';
        if (percentage >= 90) letterGrade = 'A';
        else if (percentage >= 85) letterGrade = 'A-';
        else if (percentage >= 80) letterGrade = 'B+';
        else if (percentage >= 75) letterGrade = 'B';
        else if (percentage >= 70) letterGrade = 'B-';
        else if (percentage >= 65) letterGrade = 'C+';
        else if (percentage >= 60) letterGrade = 'D';
        else letterGrade = 'F';

        await prisma.studentMarks.upsert({
          where: { userId_subjectId_classId_isRepeated: { userId: student.id, subjectId: subject.id, classId: cls.id, isRepeated: false } },
          update: {
            midTermExam: pattern.mid,
            finalExam: pattern.final,
            homework: pattern.hw,
            labsProjectResearch: pattern.lab,
            quizzes: pattern.quiz,
            participation: pattern.part,
            attendance: pattern.att,
            totalMarks: total,
            letterGrade,
            gradeType: 'calculated',
            updatedBy: adminId,
          },
          create: {
            userId: student.id,
            subjectId: subject.id,
            classId: cls.id,
            isRepeated: false,
            gradeType: 'calculated',
            midTermExam: pattern.mid,
            finalExam: pattern.final,
            homework: pattern.hw,
            labsProjectResearch: pattern.lab,
            quizzes: pattern.quiz,
            participation: pattern.part,
            attendance: pattern.att,
            totalMarks: total,
            letterGrade,
            createdBy: adminId,
          },
        });
        marksCount++;

        // Add complementary records for failing students (CE004 and CE006)
        if (letterGrade === 'F' && (student.studentNumber === 'CE004' || student.studentNumber === 'CE006')) {
          if (student.studentNumber === 'CE004') {
            // CE004 — complementary PASS (score 68)
            await prisma.studentMarks.upsert({
              where: { userId_subjectId_classId_isRepeated: { userId: student.id, subjectId: subject.id, classId: cls.id, isRepeated: true } },
              update: { finalExam: 68, totalMarks: 60, letterGrade: 'D', gradeType: 'complementary', updatedBy: adminId },
              create: {
                userId: student.id, subjectId: subject.id, classId: cls.id, isRepeated: true,
                gradeType: 'complementary', midTermExam: 0, finalExam: 68, homework: 0,
                labsProjectResearch: 0, quizzes: 0, participation: 0, attendance: 0,
                totalMarks: 60, letterGrade: 'D', createdBy: adminId,
              },
            });
            console.log(`  ✅ CE004 complementary PASS in ${subject.code}: 68/100 → D`);
          } else {
            // CE006 — complementary FAIL (score 35)
            await prisma.studentMarks.upsert({
              where: { userId_subjectId_classId_isRepeated: { userId: student.id, subjectId: subject.id, classId: cls.id, isRepeated: true } },
              update: { finalExam: 35, totalMarks: 35, letterGrade: 'F', gradeType: 'complementary', updatedBy: adminId },
              create: {
                userId: student.id, subjectId: subject.id, classId: cls.id, isRepeated: true,
                gradeType: 'complementary', midTermExam: 0, finalExam: 35, homework: 0,
                labsProjectResearch: 0, quizzes: 0, participation: 0, attendance: 0,
                totalMarks: 35, letterGrade: 'F', createdBy: adminId,
              },
            });
            console.log(`  ✅ CE006 complementary FAIL in ${subject.code}: 35/100 → F`);
          }
        }

        // Add FB for CE002 in one subject
        if (student.studentNumber === 'CE002' && subject.code === 'CE102') {
          await prisma.studentMarks.update({
            where: { userId_subjectId_classId_isRepeated: { userId: student.id, subjectId: subject.id, classId: cls.id, isRepeated: false } },
            data: { gradeType: 'FB', letterGrade: 'FB', totalMarks: 0, updatedBy: adminId },
          });
          console.log(`  ✅ CE002 FB in CE102: Fail due to absence > 20%`);
        }

        // Add FA for CE003 in one subject
        if (student.studentNumber === 'CE003' && subject.code === 'CE201') {
          await prisma.studentMarks.update({
            where: { userId_subjectId_classId_isRepeated: { userId: student.id, subjectId: subject.id, classId: cls.id, isRepeated: false } },
            data: { gradeType: 'FA', letterGrade: 'FA', totalMarks: 0, finalExam: 0, updatedBy: adminId },
          });
          console.log(`  ✅ CE003 FA in CE201: Fail due to absent from final exam`);
        }

        // Add WF for CE005 in one subject
        if (student.studentNumber === 'CE005' && subject.code === 'CE202') {
          await prisma.studentMarks.update({
            where: { userId_subjectId_classId_isRepeated: { userId: student.id, subjectId: subject.id, classId: cls.id, isRepeated: false } },
            data: { gradeType: 'WF', letterGrade: 'WF', totalMarks: 0, updatedBy: adminId },
          });
          console.log(`  ✅ CE005 WF in CE202: Compulsory withdrawal`);
        }
      }
    }
    console.log(`  ✅ Created ${marksCount} CE marks records`);
  }

  // ============================================================
  // 8. Add complementary for a student in the SAME subject/semester
  //    to test merge with previous attempt visibility
  // Abdullah (STU009, userId=25) — find a failing mark and add complementary
  // ============================================================
  console.log('📚 Adding complementary for Abdullah...');
  const abdullahFail = await prisma.studentMarks.findFirst({ where: { userId: 25, letterGrade: 'F', isRepeated: false } });
  if (abdullahFail) {
    // Complementary PASS with score 80
    await prisma.studentMarks.upsert({
      where: { userId_subjectId_classId_isRepeated: { userId: 25, subjectId: abdullahFail.subjectId, classId: abdullahFail.classId, isRepeated: true } },
      update: { finalExam: 80, totalMarks: 60, letterGrade: 'D', gradeType: 'complementary', updatedBy: adminId },
      create: {
        userId: 25, subjectId: abdullahFail.subjectId, classId: abdullahFail.classId, isRepeated: true,
        gradeType: 'complementary', midTermExam: 0, finalExam: 80, homework: 0,
        labsProjectResearch: 0, quizzes: 0, participation: 0, attendance: 0,
        totalMarks: 60, letterGrade: 'D', createdBy: adminId,
      },
    });
    console.log(`  ✅ Abdullah complementary PASS: 80/100 → D (subjectId: ${abdullahFail.subjectId}, classId: ${abdullahFail.classId})`);
  }

  // ============================================================
  // 9. Noura (STU010, userId=26) — add complementary FAIL
  // ============================================================
  console.log('📚 Adding complementary for Noura...');
  const nouraFail = await prisma.studentMarks.findFirst({ where: { userId: 26, letterGrade: 'F', isRepeated: false } });
  if (nouraFail) {
    await prisma.studentMarks.upsert({
      where: { userId_subjectId_classId_isRepeated: { userId: 26, subjectId: nouraFail.subjectId, classId: nouraFail.classId, isRepeated: true } },
      update: { finalExam: 30, totalMarks: 30, letterGrade: 'F', gradeType: 'complementary', updatedBy: adminId },
      create: {
        userId: 26, subjectId: nouraFail.subjectId, classId: nouraFail.classId, isRepeated: true,
        gradeType: 'complementary', midTermExam: 0, finalExam: 30, homework: 0,
        labsProjectResearch: 0, quizzes: 0, participation: 0, attendance: 0,
        totalMarks: 30, letterGrade: 'F', createdBy: adminId,
      },
    });
    console.log(`  ✅ Noura complementary FAIL: 30/100 → F (subjectId: ${nouraFail.subjectId}, classId: ${nouraFail.classId})`);
  }

  console.log('\n🎉 Test marks seeding complete!');
  console.log('\n📊 Summary:');
  console.log('  ✅ Complementary PASS: Fatima (DB101), Omar (CS101), Abdullah, CE004');
  console.log('  ✅ Complementary FAIL: Ahmed (DB101), Mohammed (NET101), Noura, CE006');
  console.log('  ✅ FB: Mariam (WEB101), CE002 (CE102)');
  console.log('  ✅ FA: Youssef, CE003 (CE201)');
  console.log('  ✅ WF: Layla, CE005 (CE202)');
  console.log('  ✅ Civil Engineering: 5 subjects, 20 classes, 6 students, marks with various grade types');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
