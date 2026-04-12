const fetch = require('node-fetch');

async function testUsersAPI() {
  try {
    console.log('🔍 Testing the users API endpoint...\n');
    
    const response = await fetch('http://localhost:8081/api/v1/users/admin/users');
    const data = await response.json();
    
    console.log('📊 API Response Status:', response.status);
    console.log('📋 API Response Data:');
    
    if (data.success && data.data) {
      data.data.forEach((user, index) => {
        console.log(`\n${index + 1}. User: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Display Name: ${user.displayName || 'N/A'}`);
        console.log(`   isActive: ${user.isActive}`);
        console.log(`   Primary Role: ${user.primaryRole?.code || 'N/A'}`);
        
        // Check roleAssignments
        if (user.roleAssignments && user.roleAssignments.length > 0) {
          console.log(`   Role Assignments: ${user.roleAssignments.map(ra => ra.role?.code).filter(Boolean).join(', ')}`);
        }
      });
    } else {
      console.log('❌ API Response:', data);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testUsersAPI();
