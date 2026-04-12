const fetch = require('node-fetch');

async function testMultiRoleUpdate() {
  try {
    console.log('🧪 Testing multi-role user update...\n');
    
    // Test data - updating user with multiple roles
    const updateData = {
      displayName: 'Test User Multi-Role',
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      roleId: 10, // Student as primary role
      roles: ['student', 'instructor'], // Multiple roles
      isActive: true
    };
    
    const response = await fetch('http://localhost:8081/api/v1/users/admin/users/4', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    
    console.log('📊 Update Response Status:', response.status);
    console.log('📋 Update Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Multi-role update successful!');
      
      // Check the updated user
      const userResponse = await fetch('http://localhost:8081/api/v1/users/admin/users');
      const userData = await userResponse.json();
      
      if (userData.success) {
        const updatedUser = userData.data.find(u => u.id === 4);
        if (updatedUser) {
          console.log('\n📊 Updated User Data:');
          console.log('Email:', updatedUser.email);
          console.log('Primary Role:', updatedUser.primaryRole?.code);
          console.log('Role Assignments:', updatedUser.roleAssignments?.map(ra => ra.role?.code).join(', ') || 'None');
          console.log('Created At:', updatedUser.createdAt);
        }
      }
    } else {
      console.log('❌ Multi-role update failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing multi-role:', error);
  }
}

testMultiRoleUpdate();
