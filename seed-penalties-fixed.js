import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPenaltyTypesFixed() {
  try {
    console.log('🌱 Seeding Penalty Types (Fixed)...');
    
    // Get super admin user ID
    const superAdmin = await prisma.$queryRaw`SELECT id FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
    const adminId = superAdmin[0].id;
    console.log(`👑 Using Super Admin ID: ${adminId}`);

    const penaltyTypes = [
      { code: 'MINOR', nameEn: 'Minor Offense', nameAr: 'مخالفة طفيفة', description: 'Minor rule violation', severity: 'low', color: '#FFA500' },
      { code: 'MODERATE', nameEn: 'Moderate Offense', nameAr: 'مخالفة متوسطة', description: 'Moderate rule violation', severity: 'medium', color: '#FF8C00' },
      { code: 'MAJOR', nameEn: 'Major Offense', nameAr: 'مخالفة رئيسية', description: 'Major rule violation', severity: 'high', color: '#FF6347' },
      { code: 'SEVERE', nameEn: 'Severe Offense', nameAr: 'مخالفة شديدة', description: 'Severe rule violation', severity: 'critical', color: '#DC143C' },
      { code: 'TARDINESS', nameEn: 'Tardiness', nameAr: 'تأخر', description: 'Late arrival to class', severity: 'low', color: '#FFD700' },
      { code: 'ABSENCE', nameEn: 'Unexcused Absence', nameAr: 'غياب بدون عذر', description: 'Missing class without permission', severity: 'medium', color: '#FF8C00' },
      { code: 'MISCONDUCT', nameEn: 'Misconduct', nameAr: 'سوء سلوك', description: 'Inappropriate behavior', severity: 'medium', color: '#FF8C00' }
    ];

    for (const typeData of penaltyTypes) {
      try {
        await prisma.$queryRaw`
          INSERT INTO "penalty_types" (code, "nameEn", "nameAr", description, severity, color, "isActive", "createdBy", "createdAt", "updatedAt") 
          VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, ${typeData.severity}, ${typeData.color}, true, ${adminId}, NOW(), NOW()) 
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
        SELECT p."descriptionEn", u."displayName", c.code as class_code, pt.code as penalty_type, pt.severity
        FROM penalties p 
        JOIN users u ON p."userId" = u.id 
        JOIN classes c ON p."classId" = c.id 
        JOIN penalty_types pt ON p."typeId" = pt.id 
        LIMIT 3
      `;
      console.log('\n📊 Sample Penalties:');
      samplePenalties.forEach(p => {
        console.log(`  - ${p.displayName} in ${p.class_code}: ${p.penalty_type} (${p.severity}) - ${p.descriptionEn}`);
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

seedPenaltyTypesFixed();
