/**
 * Create participation types directly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createParticipationTypes() {
  try {
    console.log('Creating participation types...');
    
    const participationTypes = [
      { code: 'POSITIVE', nameEn: 'Positive Participation', nameAr: 'مشاركة إيجابية', description: 'Positive classroom participation', isPositive: true },
      { code: 'LATE', nameEn: 'Late Arrival', nameAr: 'تأخر عن الحضور', description: 'Student arrived late to class', isPositive: false },
      { code: 'HELPFUL', nameEn: 'Helpful Behavior', nameAr: 'سلوك مساعد', description: 'Student helped others', isPositive: true },
      { code: 'DISRUPTIVE', nameEn: 'Disruptive Behavior', nameAr: 'سلوك مزعج', description: 'Student caused disruption in class', isPositive: false },
      { code: 'EXCELLENT', nameEn: 'Excellent Work', nameAr: 'عمل ممتاز', description: 'Student demonstrated excellent understanding', isPositive: true }
    ];
    
    for (const typeData of participationTypes) {
      const existing = await prisma.participationTypes.findFirst({
        where: { code: typeData.code }
      });
      
      if (!existing) {
        const created = await prisma.participationTypes.create({
          data: typeData
        });
        console.log(`✅ Created participation type: ${created.code}`);
      } else {
        console.log(`ℹ️  Participation type already exists: ${existing.code}`);
      }
    }
    
    const count = await prisma.participationTypes.count();
    console.log(`✅ Participation types complete. Total: ${count}`);
    
  } catch (error) {
    console.error('❌ Error creating participation types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createParticipationTypes();
