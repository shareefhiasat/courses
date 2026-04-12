const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRoleAssignments() {
  try {
    console.log('🔧 Fixing role assignments for users...\n');
    
    // Get all users with primaryRole but no roleAssignments
    const users = await prisma.user.findMany({
      where: {
        primaryRole: { isNot: null },
        roleAssignments: { none: {} }
      },
      include: {
        primaryRole: true,
        roleAssignments: true
      }
    });
    
    console.log(`📊 Found ${users.length} users with primaryRole but no roleAssignments:`);
    
    for (const user of users) {
      console.log(`\n🔄 Processing user: ${user.email} (ID: ${user.id})`);
      console.log(`   Primary Role: ${user.primaryRole.code} (ID: ${user.primaryRole.id})`);
      
      try {
        // Create role assignment for the primary role
        const assignment = await prisma.userRoleAssignment.create({
          data: {
            userId: user.id,
            roleId: user.primaryRole.id,
            assignedAt: new Date(),
            assignedBy: 1 // Assuming admin user ID 1
          }
        });
        
        console.log(`   ✅ Created role assignment: ${JSON.stringify(assignment)}`);
        
      } catch (error) {
        console.log(`   ❌ Failed to create role assignment: ${error.message}`);
      }
    }
    
    // Verify the results
    console.log('\n🔍 Verification - checking updated users:');
    const updatedUsers = await prisma.user.findMany({
      where: { id: { in: users.map(u => u.id) } },
      include: {
        primaryRole: { select: { id: true, code: true } },
        roleAssignments: { 
          select: { 
            id: true,
            roleId: true,
            assignedAt: true,
            role: { select: { id: true, code: true } }
          } 
        }
      }
    });
    
    updatedUsers.forEach(user => {
      console.log(`\n📋 User: ${user.email}`);
      console.log(`   Primary Role: ${user.primaryRole.code}`);
      console.log(`   Role Assignments: ${user.roleAssignments.length}`);
      user.roleAssignments.forEach(ra => {
        console.log(`     - ${ra.role.code} (assigned: ${ra.assignedAt.toISOString()})`);
      });
    });
    
    console.log('\n🎉 Role assignments fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing role assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoleAssignments();
