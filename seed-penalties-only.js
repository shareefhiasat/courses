import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPenaltyTypesOnly() {
  try {
    console.log('🌱 Seeding Penalty Types only...');
    
    // Get super admin user ID
    const superAdmin = await prisma.$queryRaw`SELECT id FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
    const adminId = superAdmin[0].id;
    console.log(`👑 Using Super Admin ID: ${adminId}`);

    const penaltyTypes = [
      { code: 'MINOR', nameEn: 'Minor Offense', nameAr: 'مخالفة طفيفة', description: 'Minor rule violation', points: -1 },
      { code: 'MODERATE', nameEn: 'Moderate Offense', nameAr: 'مخالفة متوسطة', description: 'Moderate rule violation', points: -3 },
      { code: 'MAJOR', nameEn: 'Major Offense', nameAr: 'مخالفة رئيسية', description: 'Major rule violation', points: -5 },
      { code: 'SEVERE', nameEn: 'Severe Offense', nameAr: 'مخالفة شديدة', description: 'Severe rule violation', points: -10 },
      { code: 'TARDINESS', nameEn: 'Tardiness', nameAr: 'تأخر', description: 'Late arrival to class', points: -2 },
      { code: 'ABSENCE', nameEn: 'Unexcused Absence', nameAr: 'غياب بدون عذر', description: 'Missing class without permission', points: -4 },
      { code: 'MISCONDUCT', nameEn: 'Misconduct', nameAr: 'سوء سلوك', description: 'Inappropriate behavior', points: -3 }
    ];

    for (const typeData of penaltyTypes) {
      try {
        await prisma.$queryRaw`
          INSERT INTO "penalty_types" (code, "nameEn", "nameAr", description, points, "isActive", "createdBy", "createdAt", "updatedAt") 
          VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, ${typeData.points}, true, ${adminId}, NOW(), NOW()) 
          ON CONFLICT (code) DO NOTHING
        `;
        console.log(`  ✅ Penalty type: ${typeData.code}`);
      } catch (error) {
        console.log(`  ℹ️  Penalty type ${typeData.code} already exists or error: ${error.message}`);
      }
    }

    // Check if penalty types were created
    const penaltyTypesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM penalty_types`;
    console.log(`\n📊 Penalty Types: ${penaltyTypesCount[0].count} records`);

    // Now seed penalties
    console.log('\n🌱 Seeding Penalties...');
    const penaltiesData = [
      { studentEmail: 'mohammed.alrashid@military-lms.com', classCode: 'CS101-SEC1', penaltyTypeCode: 'TARDINESS', descriptionEn: 'Late to class on Monday', descriptionAr: 'متأخر عن الفصل يوم الاثنين', comment: 'Student arrived 10 minutes late without valid reason' },
      { studentEmail: 'nora.khalifa@military-lms.com', classCode: 'CS101-SEC2', penaltyTypeCode: 'MINOR', descriptionEn: 'Used phone during lecture', descriptionAr: 'استخدام الهاتف خلال المحاضرة', comment: 'Warning issued for phone usage during class' },
      { studentEmail: 'fatima.alhashmi@military-lms.com', classCode: 'EE101-SEC1', penaltyTypeCode: 'ABSENCE', descriptionEn: 'Unexcused absence from lab', descriptionAr: 'غياب بدون عذر من المعمل', comment: 'Student missed laboratory session without prior notification' },
      { studentEmail: 'khalid.alsaadi@military-lms.com', classCode: 'CS102-SEC1', penaltyTypeCode: 'MODERATE', descriptionEn: 'Late assignment submission', descriptionAr: 'تأخر في تسليم الواجب', comment: 'Assignment submitted 2 days past deadline' },
      { studentEmail: 'shareef.hiasat@gmail.com', classCode: 'ME101-SEC1', penaltyTypeCode: 'MINOR', descriptionEn: 'Missing textbook', descriptionAr: 'غياب الكتاب المقرر', comment: 'Student came to class without required textbook' }
    ];

    for (const penaltyData of penaltiesData) {
      try {
        await prisma.$queryRaw`
          INSERT INTO penalties ("userId", "classId", "programId", "subjectId", "typeId", "descriptionEn", "descriptionAr", comment, "isActive", "createdBy", "createdAt", "updatedAt") 
          VALUES ((SELECT id FROM users WHERE email = ${penaltyData.studentEmail}), 
                  (SELECT id FROM classes WHERE code = ${penaltyData.classCode}), 
                  (SELECT "programId" FROM classes WHERE code = ${penaltyData.classCode}), 
                  (SELECT "subjectId" FROM classes WHERE code = ${penaltyData.classCode}), 
                  (SELECT id FROM penalty_types WHERE code = ${penaltyData.penaltyTypeCode}), 
                  ${penaltyData.descriptionEn}, ${penaltyData.descriptionAr}, ${penaltyData.comment}, true, ${adminId}, NOW(), NOW()) 
          ON CONFLICT DO NOTHING
        `;
        console.log(`  ✅ Penalty for ${penaltyData.studentEmail} in ${penaltyData.classCode}`);
      } catch (error) {
        console.log(`  ℹ️  Penalty for ${penaltyData.studentEmail} in ${penaltyData.classCode} already exists or error: ${error.message}`);
      }
    }

    // Check final state
    const penaltiesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM penalties`;
    console.log(`\n📊 Penalties: ${penaltiesCount[0].count} records`);

    // Show sample penalties
    if (penaltiesCount[0].count > 0) {
      const samplePenalties = await prisma.$queryRaw`
        SELECT p."descriptionEn", u."displayName", c.code as class_code, pt.code as penalty_type
        FROM penalties p 
        JOIN users u ON p."userId" = u.id 
        JOIN classes c ON p."classId" = c.id 
        JOIN penalty_types pt ON p."typeId" = pt.id 
        LIMIT 3
      `;
      console.log('\n📊 Sample Penalties:');
      samplePenalties.forEach(p => {
        console.log(`  - ${p.displayName} in ${p.class_code}: ${p.penalty_type} - ${p.descriptionEn}`);
      });
    }

    console.log('\n🎉 Penalty seeding completed!');
    
  } catch (error) {
    console.error('❌ Error during penalty seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPenaltyTypesOnly();
