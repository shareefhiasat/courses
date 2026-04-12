import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPenaltiesAndBehaviors() {
  try {
    console.log('🔍 Checking penalties and behaviors tables...\n');
    
    // Check penalties
    try {
      const penalties = await prisma.$queryRaw`SELECT COUNT(*) as count FROM penalties`;
      console.log(`Penalties: ${penalties[0].count} records`);
      
      if (penalties[0].count > 0) {
        const samplePenalties = await prisma.$queryRaw`
          SELECT p.id, p."descriptionEn", u."displayName", c.code as class_code, pt.code as penalty_type
          FROM penalties p 
          JOIN users u ON p."userId" = u.id 
          JOIN classes c ON p."classId" = c.id 
          JOIN penalty_types pt ON p."typeId" = pt.id 
          LIMIT 3
        `;
        console.log('Sample penalties:');
        samplePenalties.forEach(p => {
          console.log(`  - ${p.displayName} in ${p.class_code}: ${p.penalty_type} - ${p.descriptionEn}`);
        });
      }
    } catch (error) {
      console.log(`Penalties check failed: ${error.message}`);
    }
    
    // Check behaviors
    try {
      const behaviors = await prisma.$queryRaw`SELECT COUNT(*) as count FROM behaviors`;
      console.log(`\nBehaviors: ${behaviors[0].count} records`);
      
      if (behaviors[0].count > 0) {
        const sampleBehaviors = await prisma.$queryRaw`
          SELECT b.id, b."descriptionEn", u."displayName", c.code as class_code, bt.code as behavior_type
          FROM behaviors b 
          JOIN users u ON b."userId" = u.id 
          JOIN classes c ON b."classId" = c.id 
          JOIN behavior_types bt ON b."typeId" = bt.id 
          LIMIT 3
        `;
        console.log('Sample behaviors:');
        sampleBehaviors.forEach(b => {
          console.log(`  - ${b.displayName} in ${b.class_code}: ${b.behavior_type} - ${b.descriptionEn}`);
        });
      }
    } catch (error) {
      console.log(`Behaviors check failed: ${error.message}`);
    }
    
    // Check penalty_types and behavior_types
    try {
      const penaltyTypes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM penalty_types`;
      console.log(`\nPenalty Types: ${penaltyTypes[0].count} records`);
      
      const behaviorTypes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM behavior_types`;
      console.log(`Behavior Types: ${behaviorTypes[0].count} records`);
    } catch (error) {
      console.log(`Type tables check failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPenaltiesAndBehaviors();
