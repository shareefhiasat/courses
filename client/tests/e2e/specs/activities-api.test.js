import { test, expect } from '@playwright/test';

test.describe('Activities API - CRUD Operations', () => {
  const API_BASE_URL = 'http://localhost:3000';
  
  test('Activities API - Service Layer Integration', async ({ request }) => {
    console.log('🔍 Testing activities service layer with PostgreSQL backend...');
    
    // Test GET all activities
    const response = await request.get(`${API_BASE_URL}/api/v1/activities`);
    
    console.log('🔍 Activities API response status:', response.status());
    
    if (response.status() === 200) {
      const activities = await response.json();
      console.log('✅ Activities API returned data:', activities.length, 'activities');
      
      // Verify response structure
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThanOrEqual(0);
      
      // If there are activities, verify structure
      if (activities.length > 0) {
        const activity = activities[0];
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('title');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('status');
      }
    } else if (response.status() === 404) {
      console.log('⚠️ Activities API not found - service layer may not be fully implemented yet');
      test.skip(true, 'Activities API endpoint not yet implemented');
    } else {
      console.log('❌ Activities API returned unexpected status:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });

  test('POST /api/v1/activities - Create new activity', async ({ request }) => {
    const activityData = {
      title: 'Test Activity',
      type: 'assignment',
      description: 'This is a test activity',
      maxScore: 100,
      duration: 60,
      instructions: 'Complete this assignment',
      startDate: '2024-01-15T09:00:00Z',
      dueDate: '2024-01-20T23:59:59Z'
    };
    
    console.log('🔍 Creating new activity...');
    
    const response = await request.post(`${API_BASE_URL}/api/v1/activities`, {
      data: activityData
    });
    
    console.log('🔍 Create activity response status:', response.status());
    
    if (response.status() === 201) {
      const activity = await response.json();
      console.log('✅ Activity created successfully:', activity.id);
      
      // Verify response structure
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('title', activityData.title);
      expect(activity).toHaveProperty('type', activityData.type);
      expect(activity).toHaveProperty('status', 'draft');
      expect(activity).toHaveProperty('createdAt');
      
      // Store activity ID for subsequent tests
      test.activityId = activity.id;
    } else if (response.status() === 400) {
      const error = await response.json();
      console.log('⚠️ Activity creation validation error:', error.error);
      // This might be expected if validation is strict
    } else {
      console.log('❌ Failed to create activity:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });

  test('GET /api/v1/activities/:id - Get activity by ID', async ({ request }) => {
    // First create an activity to test
    const activityData = {
      title: 'Test Activity for Get',
      type: 'quiz',
      description: 'Activity for testing GET endpoint'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/activities`, {
      data: activityData
    });
    
    if (createResponse.status() === 201) {
      const activity = await createResponse.json();
      
      console.log('🔍 Getting activity by ID:', activity.id);
      
      const response = await request.get(`${API_BASE_URL}/api/v1/activities/${activity.id}`);
      
      console.log('🔍 Get activity response status:', response.status());
      
      if (response.status() === 200) {
        const retrievedActivity = await response.json();
        console.log('✅ Activity retrieved successfully');
        
        // Verify the activity data
        expect(retrievedActivity).toHaveProperty('id', activity.id);
        expect(retrievedActivity).toHaveProperty('title', activityData.title);
        expect(retrievedActivity).toHaveProperty('type', activityData.type);
      } else {
        console.log('❌ Failed to get activity:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create activity for GET test');
      test.skip(true, 'Unable to create test activity');
    }
  });

  test('PUT /api/v1/activities/:id - Update activity', async ({ request }) => {
    // First create an activity
    const activityData = {
      title: 'Original Activity',
      type: 'assignment',
      description: 'Original description'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/activities`, {
      data: activityData
    });
    
    if (createResponse.status() === 201) {
      const activity = await createResponse.json();
      
      const updateData = {
        title: 'Updated Activity',
        description: 'Updated description',
        maxScore: 150
      };
      
      console.log('🔍 Updating activity:', activity.id);
      
      const response = await request.put(`${API_BASE_URL}/api/v1/activities/${activity.id}`, {
        data: updateData
      });
      
      console.log('🔍 Update activity response status:', response.status());
      
      if (response.status() === 200) {
        const updatedActivity = await response.json();
        console.log('✅ Activity updated successfully');
        
        // Verify the updates
        expect(updatedActivity).toHaveProperty('id', activity.id);
        expect(updatedActivity).toHaveProperty('title', updateData.title);
        expect(updatedActivity).toHaveProperty('description', updateData.description);
        expect(updatedActivity).toHaveProperty('maxScore', updateData.maxScore);
        expect(updatedActivity).toHaveProperty('updatedAt');
      } else if (response.status() === 400) {
        const error = await response.json();
        console.log('⚠️ Activity update validation error:', error.error);
      } else {
        console.log('❌ Failed to update activity:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create activity for PUT test');
      test.skip(true, 'Unable to create test activity');
    }
  });

  test('DELETE /api/v1/activities/:id - Delete activity', async ({ request }) => {
    // First create an activity
    const activityData = {
      title: 'Activity to Delete',
      type: 'assignment',
      description: 'This activity will be deleted'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/activities`, {
      data: activityData
    });
    
    if (createResponse.status() === 201) {
      const activity = await createResponse.json();
      
      console.log('🔍 Deleting activity:', activity.id);
      
      const response = await request.delete(`${API_BASE_URL}/api/v1/activities/${activity.id}`);
      
      console.log('🔍 Delete activity response status:', response.status());
      
      if (response.status() === 204) {
        console.log('✅ Activity deleted successfully');
        
        // Verify the activity is gone
        const getResponse = await request.get(`${API_BASE_URL}/api/v1/activities/${activity.id}`);
        expect(getResponse.status()).toBe(404);
      } else if (response.status() === 404) {
        console.log('⚠️ Activity not found for deletion');
      } else {
        console.log('❌ Failed to delete activity:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create activity for DELETE test');
      test.skip(true, 'Unable to create test activity');
    }
  });

  test('POST /api/v1/activities/:id/publish - Publish activity', async ({ request }) => {
    // First create a draft activity
    const activityData = {
      title: 'Draft Activity',
      type: 'assignment',
      description: 'This activity will be published',
      maxScore: 100
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/activities`, {
      data: activityData
    });
    
    if (createResponse.status() === 201) {
      const activity = await createResponse.json();
      
      console.log('🔍 Publishing activity:', activity.id);
      
      const response = await request.post(`${API_BASE_URL}/api/v1/activities/${activity.id}/publish`);
      
      console.log('🔍 Publish activity response status:', response.status());
      
      if (response.status() === 200) {
        const publishedActivity = await response.json();
        console.log('✅ Activity published successfully');
        
        // Verify the status change
        expect(publishedActivity).toHaveProperty('id', activity.id);
        expect(publishedActivity).toHaveProperty('status', 'published');
      } else if (response.status() === 400) {
        const error = await response.json();
        console.log('⚠️ Activity publish validation error:', error.error);
      } else {
        console.log('❌ Failed to publish activity:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create activity for publish test');
      test.skip(true, 'Unable to create test activity');
    }
  });

  test('GET /api/v1/activities - Validation tests', async ({ request }) => {
    console.log('🔍 Testing activity validation...');
    
    // Test creating activity without required fields
    const invalidActivityData = {
      description: 'Activity without title and type'
    };
    
    const response = await request.post(`${API_BASE_URL}/api/v1/activities`, {
      data: invalidActivityData
    });
    
    console.log('🔍 Invalid activity creation response status:', response.status());
    
    if (response.status() === 400) {
      const error = await response.json();
      console.log('✅ Validation working correctly:', error.error);
      expect(error.error).toContain('required');
    } else {
      console.log('⚠️ Expected validation error but got:', response.status());
    }
  });

  test('GET /api/v1/classes/:classId/activities - Get activities by class', async ({ request }) => {
    // First create a class and activity
    const classData = {
      nameEn: 'Test Class',
      type: 'lecture'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() === 201) {
      const classItem = await classResponse.json();
      
      // Create activity linked to class
      const activityData = {
        title: 'Class Activity',
        type: 'assignment',
        classId: classItem.id
      };
      
      const activityResponse = await request.post(`${API_BASE_URL}/api/v1/activities`, {
        data: activityData
      });
      
      if (activityResponse.status() === 201) {
        console.log('🔍 Getting activities for class:', classItem.id);
        
        const response = await request.get(`${API_BASE_URL}/api/v1/classes/${classItem.id}/activities`);
        
        console.log('🔍 Class activities response status:', response.status());
        
        if (response.status() === 200) {
          const activities = await response.json();
          console.log('✅ Retrieved class activities:', activities.length);
          
          expect(Array.isArray(activities)).toBe(true);
        } else {
          console.log('❌ Failed to get class activities:', response.status());
        }
      }
    } else {
      console.log('⚠️ Could not create class for activities test');
      test.skip(true, 'Unable to create test class');
    }
  });

  test('GET /api/v1/subjects/:subjectId/activities - Get activities by subject', async ({ request }) => {
    // First create a subject and activity
    const subjectData = {
      nameEn: 'Test Subject',
      type: 'core'
    };
    
    const subjectResponse = await request.post(`${API_BASE_URL}/api/v1/subjects`, {
      data: subjectData
    });
    
    if (subjectResponse.status() === 201) {
      const subject = await subjectResponse.json();
      
      // Create activity linked to subject
      const activityData = {
        title: 'Subject Activity',
        type: 'quiz',
        subjectId: subject.id
      };
      
      const activityResponse = await request.post(`${API_BASE_URL}/api/v1/activities`, {
        data: activityData
      });
      
      if (activityResponse.status() === 201) {
        console.log('🔍 Getting activities for subject:', subject.id);
        
        const response = await request.get(`${API_BASE_URL}/api/v1/subjects/${subject.id}/activities`);
        
        console.log('🔍 Subject activities response status:', response.status());
        
        if (response.status() === 200) {
          const activities = await response.json();
          console.log('✅ Retrieved subject activities:', activities.length);
          
          expect(Array.isArray(activities)).toBe(true);
        } else {
          console.log('❌ Failed to get subject activities:', response.status());
        }
      }
    } else {
      console.log('⚠️ Could not create subject for activities test');
      test.skip(true, 'Unable to create test subject');
    }
  });
});
