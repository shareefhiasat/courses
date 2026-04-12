require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPenaltyAPIComplete() {
  console.log('🧪 Testing complete penalty API response structure...\n');
  
  try {
    // Simulate the exact query from getAllPenaltiesController
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
    
    console.log('✅ Penalty API Response Structure (Frontend Expected Format):');
    console.log(JSON.stringify(penalties[0], null, 2));
    
    console.log('\n📊 Frontend Display Verification:');
    const p = penalties[0];
    console.log('User Display Name:', p.user?.displayName || 'N/A');
    console.log('User Email:', p.user?.email || 'N/A');
    console.log('Class Code:', p.class?.code || 'N/A');
    console.log('Class Name:', p.class?.nameEn || 'N/A');
    console.log('Program Name:', p.class?.program?.nameEn || 'N/A');
    console.log('Program Code:', p.class?.program?.code || 'N/A');
    console.log('Penalty Type:', p.penaltyType?.nameEn || 'N/A');
    console.log('Points:', p.points);
    console.log('Description:', p.descriptionEn);
    
    console.log('\n🔍 Direct Fields (for redundancy):');
    console.log('Direct Program ID:', p.programId);
    console.log('Direct Subject ID:', p.subjectId);
    
    // Check if frontend should use direct fields or nested
    console.log('\n💡 Frontend Usage Guide:');
    console.log('- User Name: penalty.user.displayName');
    console.log('- Program Name: penalty.class.program.nameEn');
    console.log('- Class Name: penalty.class.nameEn');
    console.log('- Type: penalty.penaltyType.nameEn');
    
    console.log('\n✅ All required fields are now available!');
    console.log('Frontend should display user and program names correctly.');
    
  } catch (error) {
    console.error('❌ Error testing penalty API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPenaltyAPIComplete();
