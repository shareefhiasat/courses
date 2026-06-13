/**
 * Test Backend API
 * 
 * PURPOSE: Simple test script to verify backend API functionality
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: './.env' });

const testBackend = async () => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:8080';
  const apiVersion = process.env.API_VERSION || 'v1';
  
  console.log('🧪 Testing Military LMS Backend API...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('📖 Swagger docs available at:', `${baseUrl}/api-docs`);
    
    // Test programs endpoint
    console.log('\n2. Testing programs endpoint...');
    const programsResponse = await fetch(`${baseUrl}/api/${apiVersion}/programs`);
    const programsData = await programsResponse.json();
    console.log('✅ Programs list:', programsData);
    
    // Test creating a program
    console.log('\n3. Testing program creation...');
    const testProgram = {
      nameEn: 'Test Program',
      nameAr: 'برنامج اختبار',
      code: 'TEST001',
      descriptionEn: 'This is a test program',
      descriptionAr: 'هذا برنامج اختبار',
      durationYears: 2,
      minGPA: 1.5,
      totalCreditHours: 70,
      isActive: true
    };
    
    const createResponse = await fetch(`${baseUrl}/api/${apiVersion}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProgram),
    });
    
    const createData = await createResponse.json();
    console.log('✅ Program creation:', createData);
    
    if (createData.success && createData.data) {
      const programId = createData.data.id;
      
      // Test getting the program
      console.log('\n4. Testing program retrieval...');
      const getResponse = await fetch(`${baseUrl}/api/${apiVersion}/programs/${programId}`);
      const getData = await getResponse.json();
      console.log('✅ Program retrieved:', getData);
      
      // Test updating the program
      console.log('\n5. Testing program update...');
      const updateData = {
        nameEn: 'Updated Test Program',
        descriptionEn: 'This is an updated test program'
      };
      
      const updateResponse = await fetch(`${baseUrl}/api/${apiVersion}/programs/${programId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const updatedData = await updateResponse.json();
      console.log('✅ Program updated:', updatedData);
      
      // Test deleting the program
      console.log('\n6. Testing program deletion...');
      const deleteResponse = await fetch(`${baseUrl}/api/${apiVersion}/programs/${programId}`, {
        method: 'DELETE',
      });
      
      const deletedData = await deleteResponse.json();
      console.log('✅ Program deleted:', deletedData);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📚 API Documentation: http://localhost:8080/api-docs');
    console.log('🏥 Health Check: http://localhost:8080/api/health');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running:');
    console.log('   pnpm api:dev');
  }
};

// Run tests
testBackend();
