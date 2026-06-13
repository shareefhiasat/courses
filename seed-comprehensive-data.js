import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Academic terms from Fall 2024 to Fall 2026
const ACADEMIC_TERMS = [
  { code: '2024-FALL', name: 'Fall 2024', startDate: new Date('2024-09-01'), endDate: new Date('2024-12-31') },
  { code: '2025-SPRING', name: 'Spring 2025', startDate: new Date('2025-01-15'), endDate: new Date('2025-05-15') },
  { code: '2025-SUMMER', name: 'Summer 2025', startDate: new Date('2025-06-01'), endDate: new Date('2025-08-31') },
  { code: '2025-FALL', name: 'Fall 2025', startDate: new Date('2025-09-01'), endDate: new Date('2025-12-31') },
  { code: '2026-SPRING', name: 'Spring 2026', startDate: new Date('2026-01-15'), endDate: new Date('2026-05-15') },
  { code: '2026-SUMMER', name: 'Summer 2026', startDate: new Date('2026-06-01'), endDate: new Date('2026-08-31') },
  { code: '2026-FALL', name: 'Fall 2026', startDate: new Date('2026-09-01'), endDate: new Date('2026-12-31') }
];

// Student data for 20 students
const STUDENTS = [
  { email: 'student1@military-lms.com', firstName: 'Ahmed', lastName: 'Almulla', program: 'CS-ENG' },
  { email: 'student2@military-lms.com', firstName: 'Fatima', lastName: 'Alhashmi', program: 'CS-ENG' },
  { email: 'student3@military-lms.com', firstName: 'Mohammed', lastName: 'Alrashid', program: 'CS-ENG' },
  { email: 'student4@military-lms.com', firstName: 'Nora', lastName: 'Khalifa', program: 'CS-ENG' },
  { email: 'student5@military-lms.com', firstName: 'Khalid', lastName: 'Alsaadi', program: 'ME-ENG' },
  { email: 'student6@military-lms.com', firstName: 'Layla', lastName: 'Ahmad', program: 'ME-ENG' },
  { email: 'student7@military-lms.com', firstName: 'Abdullah', lastName: 'Khalifa', program: 'ME-ENG' },
  { email: 'student8@military-lms.com', firstName: 'Mariam', lastName: 'Alali', program: 'ME-ENG' },
  { email: 'student9@military-lms.com', firstName: 'Omar', lastName: 'Alshammari', program: 'EE-ENG' },
  { email: 'student10@military-lms.com', firstName: 'Noura', lastName: 'Alfahad', program: 'EE-ENG' },
  { email: 'student11@military-lms.com', firstName: 'Yousef', lastName: 'Almarzooqi', program: 'EE-ENG' },
  { email: 'student12@military-lms.com', firstName: 'Aisha', lastName: 'Almansoori', program: 'EE-ENG' },
  { email: 'student13@military-lms.com', firstName: 'Hassan', lastName: 'Alnuaimi', program: 'CS-ENG' },
  { email: 'student14@military-lms.com', firstName: 'Sara', lastName: 'Almehairi', program: 'CS-ENG' },
  { email: 'student15@military-lms.com', firstName: 'Saeed', lastName: 'Albalushi', program: 'ME-ENG' },
  { email: 'student16@military-lms.com', firstName: 'Khawla', lastName: 'Alshamsi', program: 'ME-ENG' },
  { email: 'student17@military-lms.com', firstName: 'Mansour', lastName: 'Alqassimi', program: 'EE-ENG' },
  { email: 'student18@military-lms.com', firstName: 'Shamma', lastName: 'Alsuwaidi', program: 'EE-ENG' },
  { email: 'student19@military-lms.com', firstName: 'Sultan', lastName: 'Alhammadi', program: 'CS-ENG' },
  { email: 'student20@military-lms.com', firstName: 'Ameera', lastName: 'Alhammadi', program: 'CS-ENG' }
];

// Penalty types with varying severity
const PENALTY_COMMENTS = {
  LATE_SUBMISSION: [
    'Assignment submitted 2 days late',
    'Project submitted after deadline',
    'Lab report turned in late',
    'Homework submitted 1 day late',
    'Code submission delayed'
  ],
  ABSENCE: [
    'Unexcused absence from lecture',
    'Missed lab session without excuse',
    'Absent from tutorial session',
    'No show for scheduled class',
    'Skipped mandatory workshop'
  ],
  MISCONDUCT: [
    'Talking during lecture',
    'Using phone in class',
    'Disruptive behavior',
    'Not following instructions',
    'Inappropriate classroom behavior'
  ],
  CHEATING: [
    'Caught looking at neighbor\'s paper',
    'Unauthorized notes found during exam',
    'Copying from online sources',
    'Plagiarized assignment detected',
    'Using unauthorized materials'
  ],
  PLAGIARISM: [
    'Text copied from internet',
    'Assignment not original work',
    'Source not properly cited',
    'Direct copy from textbook',
    'Work matches online source'
  ],
  DISRUPTION: [
    'Making noise during lecture',
    'Distracting other students',
    'Interrupting instructor',
    'Causing disturbance in class',
    'Inappropriate comments'
  ],
  DRESS_CODE: [
    'Not following dress code',
    'Inappropriate attire for lab',
    'Missing required safety gear',
    'Improper uniform',
    'Dress code violation'
  ]
};

// Behavior comments
const BEHAVIOR_COMMENTS = {
  EXCELLENT_PARTICIPATION: [
    'Outstanding contributions to class discussion',
    'Exceptional participation in group work',
    'Excellent questions and insights',
    'Active engagement throughout session',
    'Thoughtful contributions to debate'
  ],
  HELPING_PEERS: [
    'Assisted struggling classmates',
    'Volunteered to help with difficult concepts',
    'Mentored fellow students',
    'Provided valuable help to peers',
    'Collaborative and supportive attitude'
  ],
  LEADERSHIP: [
    'Took initiative in group project',
    'Led class discussion effectively',
    'Demonstrated natural leadership',
    'Organized study group',
    'Showed leadership qualities'
  ],
  CREATIVITY: [
    'Innovative solution to problem',
    'Creative approach to assignment',
    'Original thinking demonstrated',
    'Unique perspective on topic',
    'Creative problem-solving skills'
  ],
  IMPROVEMENT: [
    'Significant progress this term',
    'Notable improvement in grades',
    'Great advancement in understanding',
    'Substantial growth in skills',
    'Impressive academic development'
  ],
  DISRUPTIVE: [
    'Disrupted class with phone usage',
    'Talking while instructor teaching',
    'Caused distraction during lecture',
    'Disrupted group work',
    'Inappropriate classroom behavior'
  ],
  DISRESPECTFUL: [
    'Disrespectful to instructor',
    'Rude to fellow students',
    'Inappropriate language used',
    'Disregarded authority',
    'Unprofessional conduct'
  ],
  UNPREPARED: [
    'Not prepared for class discussion',
    'Failed to complete required reading',
    'Missing homework assignment',
    'Unprepared for lab session',
    'Did not bring required materials'
  ]
};

// Participation comments
const PARTICIPATION_COMMENTS = {
  POSITIVE: [
    'Excellent participation in class discussion',
    'Active engagement in learning activities',
    'Positive contribution to group work',
    'Enthusiastic participation throughout',
    'Valuable insights shared'
  ],
  LATE: [
    'Arrived 15 minutes late to class',
    'Late to lab session',
    'Delayed arrival to lecture',
    'Missed first half of class',
    'Late but caught up quickly'
  ],
  HELPFUL: [
    'Helped fellow students understand concepts',
    'Assisted peers with difficult problems',
    'Volunteered to explain topics',
    'Supported classmates in learning',
    'Collaborative and helpful attitude'
  ],
  DISRUPTIVE: [
    'Caused disruption during lecture',
    'Distracted other students',
    'Inappropriate classroom behavior',
    'Disrupted group activities',
    'Created disturbance in class'
  ],
  EXCELLENT: [
    'Exceptional work on assignment',
    'Outstanding performance in class',
    'Excellent understanding demonstrated',
    'Superior academic achievement',
    'Exceptional effort and results'
  ]
};

// Random date generator within term
function randomDateInTerm(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function calculateBehaviorPointsComprehensive(code) {
  const positiveCodes = ['EXCELLENT', 'LEADERSHIP', 'CREATIVITY', 'IMPROVEMENT', 'HELPING'];
  const negativeCodes = ['DISRUPTIVE', 'DISRESPECTFUL', 'UNPREPARED'];
  
  if (positiveCodes.some(c => code.includes(c))) {
    return Math.floor(Math.random() * 5) + 3;
  }
  if (negativeCodes.some(c => code.includes(c))) {
    return -(Math.floor(Math.random() * 5) + 1);
  }
  return 0;
}

function calculateParticipationPointsComprehensive(code) {
  if (code === 'POSITIVE' || code === 'EXCELLENT' || code === 'HELPFUL') {
    return Math.floor(Math.random() * 5) + 3;
  }
  if (code === 'LATE' || code === 'DISRUPTIVE') {
    return -(Math.floor(Math.random() * 3) + 1);
  }
  return Math.floor(Math.random() * 3) + 1;
}

async function createPenaltyRecordComprehensive(userId, classItem, penaltyType, recordDate) {
  const comments = PENALTY_COMMENTS[penaltyType.code] || ['General penalty'];
  const comment = comments[Math.floor(Math.random() * comments.length)];
  
  await prisma.$queryRaw`
    INSERT INTO penalties (
      "userId", "classId", "programId", "subjectId", "typeId", 
      "descriptionEn", "descriptionAr", comment, "isActive", 
      "createdAt", "updatedAt"
    ) VALUES (
      ${userId}, ${classItem.id}, ${classItem.programId}, ${classItem.subjectId}, ${penaltyType.id},
      'Penalty for ${penaltyType.code.toLowerCase().replace('_', ' ')}',
      'عقوبة ل${penaltyType.code}',
      ${comment}, true,
      ${recordDate}, ${recordDate}
    ) ON CONFLICT DO NOTHING
  `;
}

async function createBehaviorRecordComprehensive(userId, classItem, behaviorType, recordDate) {
  const comments = BEHAVIOR_COMMENTS[behaviorType.code] || ['General behavior'];
  const comment = comments[Math.floor(Math.random() * comments.length)];
  const points = calculateBehaviorPointsComprehensive(behaviorType.code);
  
  await prisma.$queryRaw`
    INSERT INTO behaviors (
      "userId", "classId", "programId", "subjectId", "typeId", points,
      "descriptionEn", "descriptionAr", comment, "isActive",
      "createdAt", "updatedAt"
    ) VALUES (
      ${userId}, ${classItem.id}, ${classItem.programId}, ${classItem.subjectId}, ${behaviorType.id},
      ${points},
      'Behavior: ${behaviorType.code.toLowerCase().replace('_', ' ')}',
      'سلوك: ${behaviorType.code}',
      ${comment}, true,
      ${recordDate}, ${recordDate}
    ) ON CONFLICT DO NOTHING
  `;
}

async function createParticipationRecordComprehensive(userId, classItem, participationType, recordDate) {
  const comments = PARTICIPATION_COMMENTS[participationType.code] || ['General participation'];
  const comment = comments[Math.floor(Math.random() * comments.length)];
  const points = calculateParticipationPointsComprehensive(participationType.code);
  
  await prisma.$queryRaw`
    INSERT INTO participations (
      "userId", "classId", "programId", "subjectId", "typeId", points,
      "descriptionEn", "descriptionAr", comment, "isActive",
      "createdAt", "updatedAt"
    ) VALUES (
      ${userId}, ${classItem.id}, ${classItem.programId}, ${classItem.subjectId}, ${participationType.id},
      ${points},
      'Participation: ${participationType.code.toLowerCase().replace('_', ' ')}',
      'مشاركة: ${participationType.code}',
      ${comment}, true,
      ${recordDate}, ${recordDate}
    ) ON CONFLICT DO NOTHING
  `;
}

async function generateRecordsForClass(userId, classItem, penaltyTypes, behaviorTypes, participationTypes) {
  const termInfo = ACADEMIC_TERMS.find(t => t.code === classItem.term);
  const recordDate = termInfo ? randomDateInTerm(termInfo.startDate, termInfo.endDate) : new Date();
  const recordsPerClass = Math.floor(Math.random() * 11) + 5;
  
  let totalPenalties = 0;
  let totalBehaviors = 0;
  let totalParticipations = 0;
  
  for (let i = 0; i < recordsPerClass; i++) {
    const randomRecordDate = new Date(recordDate.getTime() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000);
    
    // Generate Penalty (30% chance)
    if (Math.random() < 0.3) {
      const penaltyType = penaltyTypes[Math.floor(Math.random() * penaltyTypes.length)];
      await createPenaltyRecordComprehensive(userId, classItem, penaltyType, randomRecordDate);
      totalPenalties++;
    }
    
    // Generate Behavior (40% chance)
    if (Math.random() < 0.4) {
      const behaviorType = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];
      await createBehaviorRecordComprehensive(userId, classItem, behaviorType, randomRecordDate);
      totalBehaviors++;
    }
    
    // Generate Participation (50% chance)
    if (Math.random() < 0.5) {
      const participationType = participationTypes[Math.floor(Math.random() * participationTypes.length)];
      await createParticipationRecordComprehensive(userId, classItem, participationType, randomRecordDate);
      totalParticipations++;
    }
  }
  
  return { totalPenalties, totalBehaviors, totalParticipations };
}

// Generate random records for students
async function generateStudentRecords() {
  console.log('🎓 Generating comprehensive student records...');
  
  // Get existing data
  const classes = await prisma.$queryRaw`SELECT id, code, "programId", "subjectId", term, year FROM classes`;
  const penaltyTypes = await prisma.$queryRaw`SELECT id, code FROM penalty_types`;
  const behaviorTypes = await prisma.$queryRaw`SELECT id, code FROM behavior_types`;
  const participationTypes = await prisma.$queryRaw`SELECT id, code FROM participation_types`;
  
  let totalPenalties = 0;
  let totalBehaviors = 0;
  let totalParticipations = 0;
  
  for (const student of STUDENTS) {
    const user = await prisma.$queryRaw`SELECT id FROM users WHERE email = ${student.email}`;
    if (!user || user.length === 0) {
      console.log(`⚠️  Student not found: ${student.email}`);
      continue;
    }
    
    const userId = user[0].id;
    
    // Get student's classes
    const studentClasses = classes.filter(c => {
      // Filter by program
      const classProgram = c.programId;
      // This is a simplified check - in reality you'd need to join with programs table
      return true; // For now, include all classes
    });
    
    for (const classItem of studentClasses) {
      const { totalPenalties: p, totalBehaviors: b, totalParticipations: pt } = 
        await generateRecordsForClass(userId, classItem, penaltyTypes, behaviorTypes, participationTypes);
      
      totalPenalties += p;
      totalBehaviors += b;
      totalParticipations += pt;
    }
    
    console.log(`  ✅ Generated records for ${student.firstName} ${student.lastName}`);
  }
  
  console.log(`\n📊 Summary of generated records:`);
  console.log(`  - Total Penalties: ${totalPenalties}`);
  console.log(`  - Total Behaviors: ${totalBehaviors}`);
  console.log(`  - Total Participations: ${totalParticipations}`);
}

// Update academic terms to include all terms until Fall 2026
async function updateAcademicTerms() {
  console.log('📅 Updating academic terms...');
  
  for (const term of ACADEMIC_TERMS) {
    await prisma.$queryRaw`
      INSERT INTO academic_terms (code, "nameEn", "nameAr", description, "isActive", "createdAt", "updatedAt")
      VALUES (${term.code}, ${term.name}, ${term.name}, ${term.description || term.name}, true, NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET
        "nameEn" = EXCLUDED."nameEn",
        "nameAr" = EXCLUDED."nameAr",
        "isActive" = true,
        "updatedAt" = NOW()
    `;
  }
  
  console.log(`  ✅ Updated ${ACADEMIC_TERMS.length} academic terms`);
}

// Create additional classes for all terms
async function createAdditionalClasses() {
  console.log('🏫 Creating additional classes for all terms...');
  
  const subjects = await prisma.$queryRaw`SELECT id, code, "programId" FROM subjects`;
  const instructors = await prisma.$queryRaw`SELECT id, email FROM users WHERE "roleId" = (SELECT id FROM user_roles WHERE code = 'INSTRUCTOR') LIMIT 5`;
  
  for (const term of ACADEMIC_TERMS) {
    for (const subject of subjects) {
      // Create 1-2 sections per subject per term
      const sectionsCount = Math.random() < 0.7 ? 1 : 2;
      
      for (let section = 1; section <= sectionsCount; section++) {
        const instructor = instructors[Math.floor(Math.random() * instructors.length)];
        const classCode = `${subject.code.replace('-', '').toUpperCase()}-${term.code.split('-')[0]}-SEC${section}`;
        
        await prisma.$queryRaw`
          INSERT INTO classes (
            code, "nameEn", "nameAr", "maxCapacity", "programId", "subjectId", 
            "instructorId", term, year, "isActive", "createdAt", "updatedAt"
          ) VALUES (
            ${classCode}, 
            ${`${subject.code} - Section ${section} (${term.name})`},
            ${`${subject.code} - شعبة ${section} (${term.name})`},
            ${Math.floor(Math.random() * 10) + 25}, 
            ${subject.programId}, 
            ${subject.id}, 
            ${instructor.id}, 
            ${term.code}, 
            ${term.code.split('-')[0]}, 
            true, 
            NOW(), 
            NOW()
          ) ON CONFLICT (code) DO NOTHING
        `;
      }
    }
  }
  
  console.log(`  ✅ Created additional classes for all terms`);
}

// Main function
async function seedComprehensiveData() {
  try {
    console.log('🚀 Starting comprehensive data seeding...\n');
    
    // 1. Update academic terms
    await updateAcademicTerms();
    
    // 2. Create additional classes for all terms
    await createAdditionalClasses();
    
    // 3. Generate comprehensive student records
    await generateStudentRecords();
    
    // 4. Check final state
    await checkFinalState();
    
    console.log('\n🎉 Comprehensive data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkFinalState() {
  console.log('\n📋 Final Database State:');
  
  const penalties = await prisma.$queryRaw`SELECT COUNT(*) as count FROM penalties`;
  const behaviors = await prisma.$queryRaw`SELECT COUNT(*) as count FROM behaviors`;
  const participations = await prisma.$queryRaw`SELECT COUNT(*) as count FROM participations`;
  const classes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM classes`;
  const academicTerms = await prisma.$queryRaw`SELECT COUNT(*) as count FROM academic_terms`;
  
  console.log(`  Penalties: ${penalties[0].count}`);
  console.log(`  Behaviors: ${behaviors[0].count}`);
  console.log(`  Participations: ${participations[0].count}`);
  console.log(`  Classes: ${classes[0].count}`);
  console.log(`  Academic Terms: ${academicTerms[0].count}`);
  
  // Show sample records
  console.log('\n📊 Sample Records:');
  
  try {
    const samplePenalties = await prisma.$queryRaw`
      SELECT p.comment, pt.code as type_code, u."displayName", c.code as class_code 
      FROM penalties p 
      JOIN penalty_types pt ON p."typeId" = pt.id 
      JOIN users u ON p."userId" = u.id 
      JOIN classes c ON p."classId" = c.id 
      LIMIT 3
    `;
    console.log('  Recent Penalties:');
    samplePenalties.forEach(p => {
      console.log(`    - ${p.displayName} (${p.class_code}): ${p.comment}`);
    });
  } catch (error) {
    console.log('  Recent Penalties: No penalties found');
  }
  
  try {
    const sampleBehaviors = await prisma.$queryRaw`
      SELECT p.comment, p.points, pt.code as type_code, u."displayName", c.code as class_code 
      FROM behaviors p 
      JOIN behavior_types pt ON p."typeId" = pt.id 
      JOIN users u ON p."userId" = u.id 
      JOIN classes c ON p."classId" = c.id 
      LIMIT 3
    `;
    console.log('  Recent Behaviors:');
    sampleBehaviors.forEach(p => {
      console.log(`    - ${p.displayName} (${p.class_code}): ${p.comment} (${p.points} points)`);
    });
  } catch (error) {
    console.log('  Recent Behaviors: No behaviors found');
  }
  
  try {
    const sampleParticipations = await prisma.$queryRaw`
      SELECT p.comment, p.points, pt.code as type_code, u."displayName", c.code as class_code 
      FROM participations p 
      JOIN participation_types pt ON p."typeId" = pt.id 
      JOIN users u ON p."userId" = u.id 
      JOIN classes c ON p."classId" = c.id 
      LIMIT 3
    `;
    console.log('  Recent Participations:');
    sampleParticipations.forEach(p => {
      console.log(`    - ${p.displayName} (${p.class_code}): ${p.comment} (${p.points} points)`);
    });
  } catch (error) {
    console.log('  Recent Participations: No participations found');
  }
  
  // Show class distribution by term
  try {
    const classDistribution = await prisma.$queryRaw`
      SELECT term, COUNT(*) as class_count 
      FROM classes 
      GROUP BY term 
      ORDER BY term
    `;
    console.log('\n📚 Classes by Term:');
    classDistribution.forEach(c => {
      console.log(`    - ${c.term}: ${c.class_count} classes`);
    });
  } catch (error) {
    console.log('  Classes by Term: Unable to retrieve');
  }
}

// Run the seed
seedComprehensiveData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
