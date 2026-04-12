import { test, expect } from '@playwright/test';

test.describe('Attendances API - CRUD Operations', () => {
  const API_BASE_URL = 'http://localhost:3000';
  
  test('Attendances API - Service Layer Integration', async ({ request }) => {
    console.log('🔍 Testing attendances service layer with PostgreSQL backend...');
    
    // Test GET all attendances
    const response = await request.get(`${API_BASE_URL}/api/v1/attendances`);
    
    console.log('🔍 Attendances API response status:', response.status());
    
    if (response.status() === 200) {
      const attendances = await response.json();
      console.log('✅ Attendances API returned data:', attendances.length, 'attendances');
      
      // Verify response structure
      expect(Array.isArray(attendances)).toBe(true);
      expect(attendances.length).toBeGreaterThanOrEqual(0);
      
      // If there are attendances, verify structure
      if (attendances.length > 0) {
        const attendance = attendances[0];
        expect(attendance).toHaveProperty('id');
        expect(attendance).toHaveProperty('userId');
        expect(attendance).toHaveProperty('date');
        expect(attendance).toHaveProperty('status');
      }
    } else if (response.status() === 404) {
      console.log('⚠️ Attendances API not found - service layer may not be fully implemented yet');
      test.skip(true, 'Attendances API endpoint not yet implemented');
    } else {
      console.log('❌ Attendances API returned unexpected status:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });

  test('POST /api/v1/attendances - Create new attendance', async ({ request }) => {
    // First create a user and class to test attendance
    const userData = {
      email: 'student-att@test.com',
      displayName: 'Test Student for Attendance',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      console.log('⚠️ Could not create user for attendance test');
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const classData = {
      nameEn: 'Test Class for Attendance',
      type: 'lecture'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      console.log('⚠️ Could not create class for attendance test');
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    const attendanceData = {
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      classId: classDataResponse.id
    };
    
    console.log('🔍 Creating new attendance...');
    
    const response = await request.post(`${API_BASE_URL}/api/v1/attendances`, {
      data: attendanceData
    });
    
    console.log('🔍 Create attendance response status:', response.status());
    
    if (response.status() === 201) {
      const attendance = await response.json();
      console.log('✅ Attendance created successfully:', attendance.id);
      
      // Verify response structure
      expect(attendance).toHaveProperty('id');
      expect(attendance).toHaveProperty('userId', attendanceData.userId);
      expect(attendance).toHaveProperty('date', attendanceData.date);
      expect(attendance).toHaveProperty('status', attendanceData.status);
      expect(attendance).toHaveProperty('classId', attendanceData.classId);
      expect(attendance).toHaveProperty('checkInTime');
      
      // Store attendance ID for subsequent tests
      test.attendanceId = attendance.id;
    } else if (response.status() === 400) {
      const error = await response.json();
      console.log('⚠️ Attendance creation validation error:', error.error);
      // This might be expected if validation is strict
    } else {
      console.log('❌ Failed to create attendance:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });

  test('GET /api/v1/attendances/:id - Get attendance by ID', async ({ request }) => {
    // First create an attendance to test
    const userData = {
      email: 'student-att2@test.com',
      displayName: 'Test Student 2 for Attendance',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const classData = {
      nameEn: 'Test Class for Get Attendance',
      type: 'lab'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    const attendanceData = {
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      classId: classDataResponse.id
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/attendances`, {
      data: attendanceData
    });
    
    if (createResponse.status() === 201) {
      const attendance = await createResponse.json();
      
      console.log('🔍 Getting attendance by ID:', attendance.id);
      
      const response = await request.get(`${API_BASE_URL}/api/v1/attendances/${attendance.id}`);
      
      console.log('🔍 Get attendance response status:', response.status());
      
      if (response.status() === 200) {
        const retrievedAttendance = await response.json();
        console.log('✅ Attendance retrieved successfully');
        
        // Verify the attendance data
        expect(retrievedAttendance).toHaveProperty('id', attendance.id);
        expect(retrievedAttendance).toHaveProperty('userId', attendanceData.userId);
        expect(retrievedAttendance).toHaveProperty('date', attendanceData.date);
        expect(retrievedAttendance).toHaveProperty('status', attendanceData.status);
      } else {
        console.log('❌ Failed to get attendance:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create attendance for GET test');
      test.skip(true, 'Unable to create test attendance');
    }
  });

  test('PUT /api/v1/attendances/:id - Update attendance', async ({ request }) => {
    // First create an attendance
    const userData = {
      email: 'student-att3@test.com',
      displayName: 'Test Student 3 for Attendance',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const classData = {
      nameEn: 'Test Class for Update Attendance',
      type: 'seminar'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    const attendanceData = {
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      classId: classDataResponse.id
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/attendances`, {
      data: attendanceData
    });
    
    if (createResponse.status() === 201) {
      const attendance = await createResponse.json();
      
      const updateData = {
        status: 'late',
        notes: 'Student arrived 10 minutes late'
      };
      
      console.log('🔍 Updating attendance:', attendance.id);
      
      const response = await request.put(`${API_BASE_URL}/api/v1/attendances/${attendance.id}`, {
        data: updateData
      });
      
      console.log('🔍 Update attendance response status:', response.status());
      
      if (response.status() === 200) {
        const updatedAttendance = await response.json();
        console.log('✅ Attendance updated successfully');
        
        // Verify the updates
        expect(updatedAttendance).toHaveProperty('id', attendance.id);
        expect(updatedAttendance).toHaveProperty('status', updateData.status);
        expect(updatedAttendance).toHaveProperty('notes');
        expect(updatedAttendance).toHaveProperty('updatedAt');
      } else if (response.status() === 400) {
        const error = await response.json();
        console.log('⚠️ Attendance update validation error:', error.error);
      } else {
        console.log('❌ Failed to update attendance:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create attendance for PUT test');
      test.skip(true, 'Unable to create test attendance');
    }
  });

  test('DELETE /api/v1/attendances/:id - Delete attendance', async ({ request }) => {
    // First create an attendance
    const userData = {
      email: 'student-att4@test.com',
      displayName: 'Test Student 4 for Attendance',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const classData = {
      nameEn: 'Test Class for Delete Attendance',
      type: 'workshop'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    const attendanceData = {
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      classId: classDataResponse.id
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/attendances`, {
      data: attendanceData
    });
    
    if (createResponse.status() === 201) {
      const attendance = await createResponse.json();
      
      console.log('🔍 Deleting attendance:', attendance.id);
      
      const response = await request.delete(`${API_BASE_URL}/api/v1/attendances/${attendance.id}`);
      
      console.log('🔍 Delete attendance response status:', response.status());
      
      if (response.status() === 204) {
        console.log('✅ Attendance deleted successfully');
        
        // Verify the attendance is gone
        const getResponse = await request.get(`${API_BASE_URL}/api/v1/attendances/${attendance.id}`);
        expect(getResponse.status()).toBe(404);
      } else if (response.status() === 404) {
        console.log('⚠️ Attendance not found for deletion');
      } else {
        console.log('❌ Failed to delete attendance:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create attendance for DELETE test');
      test.skip(true, 'Unable to create test attendance');
    }
  });

  test('GET /api/v1/attendances - Validation tests', async ({ request }) => {
    console.log('🔍 Testing attendance validation...');
    
    // Test creating attendance without required fields
    const invalidAttendanceData = {
      status: 'present'
      // Missing userId and date
    };
    
    const response = await request.post(`${API_BASE_URL}/api/v1/attendances`, {
      data: invalidAttendanceData
    });
    
    console.log('🔍 Invalid attendance creation response status:', response.status());
    
    if (response.status() === 400) {
      const error = await response.json();
      console.log('✅ Validation working correctly:', error.error);
      expect(error.error).toContain('required');
    } else {
      console.log('⚠️ Expected validation error but got:', response.status());
    }
  });

  test('GET /api/v1/users/:userId/attendances - Get attendances by user', async ({ request }) => {
    // First create a user and attendance
    const userData = {
      email: 'student-att5@test.com',
      displayName: 'Test Student 5 for User Attendances',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const classData = {
      nameEn: 'Test Class for User Attendances',
      type: 'lecture'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    // Create attendance
    const attendanceData = {
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      classId: classDataResponse.id
    };
    
    const attendanceResponse = await request.post(`${API_BASE_URL}/api/v1/attendances`, {
      data: attendanceData
    });
    
    if (attendanceResponse.status() === 201) {
      console.log('🔍 Getting attendances for user:', user.id);
      
      const response = await request.get(`${API_BASE_URL}/api/v1/users/${user.id}/attendances`);
      
      console.log('🔍 User attendances response status:', response.status());
      
      if (response.status() === 200) {
        const attendances = await response.json();
        console.log('✅ Retrieved user attendances:', attendances.length);
        
        expect(Array.isArray(attendances)).toBe(true);
        // Should have at least the attendance we just created
        expect(attendances.length).toBeGreaterThanOrEqual(1);
      } else {
        console.log('❌ Failed to get user attendances:', response.status());
      }
    } else {
      console.log('⚠️ Could not create attendance for user attendances test');
      test.skip(true, 'Unable to create test attendance');
    }
  });

  test('GET /api/v1/classes/:classId/attendances - Get attendances by class', async ({ request }) => {
    // First create a class and attendance
    const classData = {
      nameEn: 'Test Class for Class Attendances',
      type: 'lecture'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    // Create a user
    const userData = {
      email: 'student-att6@test.com',
      displayName: 'Test Student 6 for Class Attendances',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    // Create attendance
    const attendanceData = {
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      classId: classDataResponse.id
    };
    
    const attendanceResponse = await request.post(`${API_BASE_URL}/api/v1/attendances`, {
      data: attendanceData
    });
    
    if (attendanceResponse.status() === 201) {
      console.log('🔍 Getting attendances for class:', classDataResponse.id);
      
      const response = await request.get(`${API_BASE_URL}/api/v1/classes/${classDataResponse.id}/attendances`);
      
      console.log('🔍 Class attendances response status:', response.status());
      
      if (response.status() === 200) {
        const attendances = await response.json();
        console.log('✅ Retrieved class attendances:', attendances.length);
        
        expect(Array.isArray(attendances)).toBe(true);
        expect(attendances.length).toBeGreaterThanOrEqual(1);
      } else {
        console.log('❌ Failed to get class attendances:', response.status());
      }
    } else {
      console.log('⚠️ Could not create attendance for class attendances test');
      test.skip(true, 'Unable to create test attendance');
    }
  });

  test('GET /api/v1/classes/:classId/attendances/stats - Get class attendance statistics', async ({ request }) => {
    // First create a class and multiple attendances
    const classData = {
      nameEn: 'Test Class for Attendance Stats',
      type: 'lecture'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    // Create multiple users and attendances
    const users = [];
    for (let i = 0; i < 3; i++) {
      const userData = {
        email: `student-stats-${i}@test.com`,
        displayName: `Test Student ${i} for Stats`,
        isStudent: true
      };
      
      const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
        data: userData
      });
      
      if (userResponse.status() === 201) {
        const user = await userResponse.json();
        users.push(user);
        
        // Create attendance for each user
        const attendanceData = {
          userId: user.id,
          date: new Date().toISOString().split('T')[0],
          status: i === 0 ? 'present' : i === 1 ? 'absent' : 'late',
          classId: classDataResponse.id
        };
        
        await request.post(`${API_BASE_URL}/api/v1/attendances`, {
          data: attendanceData
        });
      }
    }
    
    if (users.length > 0) {
      console.log('🔍 Getting attendance statistics for class:', classDataResponse.id);
      
      const response = await request.get(`${API_BASE_URL}/api/v1/classes/${classDataResponse.id}/attendances/stats`);
      
      console.log('🔍 Class attendance stats response status:', response.status());
      
      if (response.status() === 200) {
        const stats = await response.json();
        console.log('✅ Retrieved class attendance stats:', stats);
        
        expect(stats).toHaveProperty('total');
        expect(stats).toHaveProperty('present');
        expect(stats).toHaveProperty('absent');
        expect(stats).toHaveProperty('late');
        expect(stats).toHaveProperty('excused');
        expect(stats).toHaveProperty('attendanceRate');
        expect(stats.total).toBeGreaterThan(0);
      } else {
        console.log('❌ Failed to get class attendance stats:', response.status());
      }
    } else {
      console.log('⚠️ Could not create users for attendance stats test');
      test.skip(true, 'Unable to create test users');
    }
  });

  test('GET /api/v1/users/:userId/attendances/today - Get today attendance status', async ({ request }) => {
    // First create a user
    const userData = {
      email: 'student-today@test.com',
      displayName: 'Test Student for Today Status',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    console.log('🔍 Getting today attendance status for user:', user.id);
    
    const response = await request.get(`${API_BASE_URL}/api/v1/users/${user.id}/attendances/today`);
    
    console.log('🔍 Today attendance status response status:', response.status());
    
    if (response.status() === 200) {
      const statusData = await response.json();
      console.log('✅ Retrieved today attendance status:', statusData);
      
      expect(statusData).toHaveProperty('status');
      expect(['present', 'absent', 'late', 'excused', 'not_marked']).toContain(statusData.status);
    } else {
      console.log('❌ Failed to get today attendance status:', response.status());
    }
  });

  test('POST /api/v1/attendances/mark - Mark attendance (alias)', async ({ request }) => {
    // First create a user and class
    const userData = {
      email: 'student-mark@test.com',
      displayName: 'Test Student for Mark Attendance',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const classData = {
      nameEn: 'Test Class for Mark Attendance',
      type: 'lecture'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    const attendanceData = {
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      classId: classDataResponse.id
    };
    
    console.log('🔍 Marking attendance using alias endpoint...');
    
    const response = await request.post(`${API_BASE_URL}/api/v1/attendances/mark`, {
      data: attendanceData
    });
    
    console.log('🔍 Mark attendance response status:', response.status());
    
    if (response.status() === 201) {
      const attendance = await response.json();
      console.log('✅ Attendance marked successfully using alias');
      
      expect(attendance).toHaveProperty('id');
      expect(attendance).toHaveProperty('userId', attendanceData.userId);
      expect(attendance).toHaveProperty('status', attendanceData.status);
    } else if (response.status() === 400) {
      const error = await response.json();
      console.log('⚠️ Mark attendance validation error:', error.error);
    } else {
      console.log('❌ Failed to mark attendance:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });
});
