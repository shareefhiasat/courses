import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBehaviorTypes() {
  try {
    console.log('🌱 Fixing Behavior Types...');
    
    // Get super admin user ID
    const superAdmin = await prisma.$queryRaw`SELECT id FROM users WHERE email = 'shareef.hiasat@gmail.com'`;
    const adminId = superAdmin[0].id;
    console.log(`👑 Using Super Admin ID: ${adminId}`);

    const behaviorTypes = [
      { code: 'POSITIVE', nameEn: 'Positive Behavior', nameAr: 'سلوك إيجابي', description: 'Desirable behavior', category: 'positive', points: 2, color: '#4CAF50' },
      { code: 'NEGATIVE', nameEn: 'Negative Behavior', nameAr: 'سلوك سلبي', description: 'Undesirable behavior', category: 'negative', points: -2, color: '#F44336' },
      { code: 'NEUTRAL', nameEn: 'Neutral Behavior', nameAr: 'سلوك محايد', description: 'Neutral observation', category: 'neutral', points: 0, color: '#9E9E9E' },
      { code: 'EXCELLENT', nameEn: 'Excellent Behavior', nameAr: 'سلوك ممتاز', description: 'Outstanding behavior', category: 'positive', points: 5, color: '#2196F3' },
      { code: 'CONCERNING', nameEn: 'Concerning Behavior', nameAr: 'سلوك مقلق', description: 'Behavior requiring attention', category: 'negative', points: -3, color: '#FF9800' }
    ];

    for (const typeData of behaviorTypes) {
      try {
        await prisma.$queryRaw`
          INSERT INTO "behavior_types" (code, "nameEn", "nameAr", description, category, points, color, "isActive", "createdBy", "createdAt", "updatedAt") 
          VALUES (${typeData.code}, ${typeData.nameEn}, ${typeData.nameAr}, ${typeData.description}, ${typeData.category}, ${typeData.points}, ${typeData.color}, true, ${adminId}, NOW(), NOW()) 
          ON CONFLICT (code) DO UPDATE SET
            "nameEn" = EXCLUDED."nameEn",
            "nameAr" = EXCLUDED."nameAr",
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            points = EXCLUDED.points,
            color = EXCLUDED.color,
            "isActive" = true,
            "updatedAt" = NOW()
        `;
        console.log(`  ✅ Behavior type: ${typeData.code}`);
      } catch (error) {
        console.log(`  ℹ️  Behavior type ${typeData.code} already exists or error: ${error.message}`);
      }
    }

    // Check if behavior types were created
    const behaviorTypesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM behavior_types`;
    console.log(`\n📊 Behavior Types: ${behaviorTypesCount[0].count} records`);

    // Show sample behavior types
    if (behaviorTypesCount[0].count > 0) {
      const sampleBehaviorTypes = await prisma.$queryRaw`
        SELECT code, "nameEn", category, points, color 
        FROM behavior_types 
        ORDER BY id 
        LIMIT 5
      `;
      console.log('\n📊 Sample Behavior Types:');
      sampleBehaviorTypes.forEach(bt => {
        console.log(`  - ${bt.nameEn} (${bt.code}): ${bt.category}, ${bt.points} points`);
      });
    }

    console.log('\n🎉 Behavior types fixing completed!');
    
  } catch (error) {
    console.error('❌ Error during behavior types fixing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixBehaviorTypes();
