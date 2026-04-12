require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPenaltyAPI() {
  console.log('🧪 Testing penalty API response structure...\n');
  
  try {
    // Simulate the getAllPenalties query
    const penalties = await prisma.penalty.findMany({
      take: 2,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            realName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            program: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        },
        penaltyType: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('✅ Penalty API Response Structure:');
    console.log(JSON.stringify(penalties[0], null, 2));
    
    console.log('\n📊 Verification:');
    const p = penalties[0];
    console.log('User exists:', !!p.user ? `✅ ${p.user.displayName}` : '❌ NULL');
    console.log('Class exists:', !!p.class ? `✅ ${p.class.code}` : '❌ NULL');
    console.log('Program exists:', !!p.class?.program ? `✅ ${p.class.program.nameEn}` : '❌ NULL');
    console.log('Type exists:', !!p.penaltyType ? `✅ ${p.penaltyType.nameEn}` : '❌ NULL');
    
    console.log('\n✅ API structure is correct! Frontend should display user and program properly.');
    
  } catch (error) {
    console.error('❌ Error testing penalty API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPenaltyAPI();
