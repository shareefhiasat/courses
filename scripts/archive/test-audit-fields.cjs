const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuditFields() {
  try {
    // Simulate what happens when user 1 updates user 4
    const currentUserKeycloakId = '79d3cc1c-1257-4b94-8b39-10ee509cfb9e';
    
    // Find current user's database ID
    const currentUser = await prisma.user.findUnique({
      where: { keycloakId: currentUserKeycloakId },
      select: { id: true }
    });
    
    console.log('🔍 Current User Lookup:');
    console.log(`KeycloakID: ${currentUserKeycloakId}`);
    console.log(`Database ID: ${currentUser?.id}`);
    
    if (currentUser) {
      // Now update user 4 with this current user ID
      const updatedUser = await prisma.user.update({
        where: { id: 4 },
        data: {
          realName: 'Test Real Name with Audit Fields',
          updatedBy: currentUser.id
        }
      });
      
      console.log('\n✅ User Updated Successfully:');
      console.log(`UpdatedBy: ${updatedUser.updatedBy}`);
      console.log(`RealName: ${updatedUser.realName}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuditFields();
