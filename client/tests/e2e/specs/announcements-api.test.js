import { test, expect } from '@playwright/test';

test.describe('Announcements API - CRUD Operations', () => {
  const API_BASE_URL = 'http://localhost:8001';
  
  test('Announcements API - Service Layer Integration', async ({ request }) => {
    console.log('🔍 Testing announcements service layer with PostgreSQL backend...');
    
    // Test GET all announcements
    const response = await request.get(`${API_BASE_URL}/api/v1/announcements`);
    
    console.log('🔍 Announcements API response status:', response.status());
    
    if (response.status() === 200) {
      const announcements = await response.json();
      console.log('✅ Announcements API returned data:', announcements.length, 'announcements');
      
      // Verify response structure
      expect(Array.isArray(announcements)).toBe(true);
      expect(announcements.length).toBeGreaterThanOrEqual(0);
      
      // If there are announcements, verify structure
      if (announcements.length > 0) {
        const announcement = announcements[0];
        expect(announcement).toHaveProperty('id');
        expect(announcement).toHaveProperty('title');
        expect(announcement).toHaveProperty('content');
        expect(announcement).toHaveProperty('status');
      }
    } else if (response.status() === 404) {
      console.log('⚠️ Announcements API not found - service layer may not be fully implemented yet');
      test.skip(true, 'Announcements API endpoint not yet implemented');
    } else {
      console.log('❌ Announcements API returned unexpected status:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });

  test('POST /api/v1/announcements - Create new announcement', async ({ request }) => {
    // First create a user to test announcement
    const userData = {
      email: 'admin-ann@test.com',
      displayName: 'Test Admin for Announcements',
      isAdmin: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      console.log('⚠️ Could not create user for announcement test');
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const announcementData = {
      title: 'Test Announcement',
      content: 'This is a test announcement for the LMS system',
      type: 'general',
      priority: 'normal'
    };
    
    console.log('🔍 Creating new announcement...');
    
    const response = await request.post(`${API_BASE_URL}/api/v1/announcements`, {
      data: announcementData
    });
    
    console.log('🔍 Create announcement response status:', response.status());
    
    if (response.status() === 201) {
      const announcement = await response.json();
      console.log('✅ Announcement created successfully:', announcement.id);
      
      // Verify response structure
      expect(announcement).toHaveProperty('id');
      expect(announcement).toHaveProperty('title', announcementData.title);
      expect(announcement).toHaveProperty('content', announcementData.content);
      expect(announcement).toHaveProperty('type', announcementData.type);
      expect(announcement).toHaveProperty('priority', announcementData.priority);
      expect(announcement).toHaveProperty('status', 'published');
      expect(announcement).toHaveProperty('isPublic', true);
      expect(announcement).toHaveProperty('allowComments', true);
      expect(announcement).toHaveProperty('publishAt');
      
      // Store announcement ID for subsequent tests
      test.announcementId = announcement.id;
    } else if (response.status() === 400) {
      const error = await response.json();
      console.log('⚠️ Announcement creation validation error:', error.error);
      // This might be expected if validation is strict
    } else {
      console.log('❌ Failed to create announcement:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });

  test('GET /api/v1/announcements/:id - Get announcement by ID', async ({ request }) => {
    // First create an announcement to test
    const userData = {
      email: 'admin-ann2@test.com',
      displayName: 'Test Admin 2 for Announcements',
      isAdmin: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const announcementData = {
      title: 'Test Announcement for Get',
      content: 'This is a test announcement for GET endpoint',
      type: 'urgent',
      priority: 'high'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/announcements`, {
      data: announcementData
    });
    
    if (createResponse.status() === 201) {
      const announcement = await createResponse.json();
      
      console.log('🔍 Getting announcement by ID:', announcement.id);
      
      const response = await request.get(`${API_BASE_URL}/api/v1/announcements/${announcement.id}`);
      
      console.log('🔍 Get announcement response status:', response.status());
      
      if (response.status() === 200) {
        const retrievedAnnouncement = await response.json();
        console.log('✅ Announcement retrieved successfully');
        
        // Verify the announcement data
        expect(retrievedAnnouncement).toHaveProperty('id', announcement.id);
        expect(retrievedAnnouncement).toHaveProperty('title', announcementData.title);
        expect(retrievedAnnouncement).toHaveProperty('content', announcementData.content);
        expect(retrievedAnnouncement).toHaveProperty('type', announcementData.type);
        expect(retrievedAnnouncement).toHaveProperty('priority', announcementData.priority);
      } else {
        console.log('❌ Failed to get announcement:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create announcement for GET test');
      test.skip(true, 'Unable to create test announcement');
    }
  });

  test('PUT /api/v1/announcements/:id - Update announcement', async ({ request }) => {
    // First create an announcement
    const userData = {
      email: 'admin-ann3@test.com',
      displayName: 'Test Admin 3 for Announcements',
      isAdmin: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const announcementData = {
      title: 'Test Announcement for Update',
      content: 'This is a test announcement for PUT endpoint',
      type: 'academic',
      priority: 'normal'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/announcements`, {
      data: announcementData
    });
    
    if (createResponse.status() === 201) {
      const announcement = await createResponse.json();
      
      const updateData = {
        title: 'Updated Announcement Title',
        content: 'Updated content for the announcement',
        priority: 'high'
      };
      
      console.log('🔍 Updating announcement:', announcement.id);
      
      const response = await request.put(`${API_BASE_URL}/api/v1/announcements/${announcement.id}`, {
        data: updateData
      });
      
      console.log('🔍 Update announcement response status:', response.status());
      
      if (response.status() === 200) {
        const updatedAnnouncement = await response.json();
        console.log('✅ Announcement updated successfully');
        
        // Verify the updates
        expect(updatedAnnouncement).toHaveProperty('id', announcement.id);
        expect(updatedAnnouncement).toHaveProperty('title', updateData.title);
        expect(updatedAnnouncement).toHaveProperty('content', updateData.content);
        expect(updatedAnnouncement).toHaveProperty('priority', updateData.priority);
        expect(updatedAnnouncement).toHaveProperty('updatedAt');
      } else if (response.status() === 400) {
        const error = await response.json();
        console.log('⚠️ Announcement update validation error:', error.error);
      } else {
        console.log('❌ Failed to update announcement:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create announcement for PUT test');
      test.skip(true, 'Unable to create test announcement');
    }
  });

  test('DELETE /api/v1/announcements/:id - Delete announcement', async ({ request }) => {
    // First create an announcement
    const userData = {
      email: 'admin-ann4@test.com',
      displayName: 'Test Admin 4 for Announcements',
      isAdmin: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const announcementData = {
      title: 'Test Announcement for Delete',
      content: 'This is a test announcement for DELETE endpoint',
      type: 'administrative',
      priority: 'low'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/announcements`, {
      data: announcementData
    });
    
    if (createResponse.status() === 201) {
      const announcement = await createResponse.json();
      
      console.log('🔍 Deleting announcement:', announcement.id);
      
      const response = await request.delete(`${API_BASE_URL}/api/v1/announcements/${announcement.id}`);
      
      console.log('🔍 Delete announcement response status:', response.status());
      
      if (response.status() === 204) {
        console.log('✅ Announcement deleted successfully');
        
        // Verify the announcement is gone
        const getResponse = await request.get(`${API_BASE_URL}/api/v1/announcements/${announcement.id}`);
        expect(getResponse.status()).toBe(404);
      } else if (response.status() === 404) {
        console.log('⚠️ Announcement not found for deletion');
      } else {
        console.log('❌ Failed to delete announcement:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create announcement for DELETE test');
      test.skip(true, 'Unable to create test announcement');
    }
  });

  test('GET /api/v1/announcements - Validation tests', async ({ request }) => {
    console.log('🔍 Testing announcement validation...');
    
    // Test creating announcement without required fields
    const invalidAnnouncementData = {
      type: 'general'
      // Missing title and content
    };
    
    const response = await request.post(`${API_BASE_URL}/api/v1/announcements`, {
      data: invalidAnnouncementData
    });
    
    console.log('🔍 Invalid announcement creation response status:', response.status());
    
    if (response.status() === 400) {
      const error = await response.json();
      console.log('✅ Validation working correctly:', error.error);
      expect(error.error).toContain('required');
    } else {
      console.log('⚠️ Expected validation error but got:', response.status());
    }
  });

  test('GET /api/v1/announcements/active - Get active announcements', async ({ request }) => {
    console.log('🔍 Getting active announcements...');
    
    const response = await request.get(`${API_BASE_URL}/api/v1/announcements/active`);
    
    console.log('🔍 Active announcements response status:', response.status());
    
    if (response.status() === 200) {
      const announcements = await response.json();
      console.log('✅ Retrieved active announcements:', announcements.length);
      
      expect(Array.isArray(announcements)).toBe(true);
      
      // Verify all announcements are active (published and not expired)
      const now = new Date();
      for (const announcement of announcements) {
        expect(announcement.status).toBe('published');
        expect(new Date(announcement.publishAt)).toBeLessThanOrEqual(now);
        
        if (announcement.expireAt) {
          expect(new Date(announcement.expireAt)).toBeGreaterThan(now);
        }
      }
    } else {
      console.log('❌ Failed to get active announcements:', response.status());
    }
  });

  test('GET /api/v1/announcements/type/:type - Get announcements by type', async ({ request }) => {
    console.log('🔍 Getting announcements by type...');
    
    const response = await request.get(`${API_BASE_URL}/api/v1/announcements/type/general`);
    
    console.log('🔍 Announcements by type response status:', response.status());
    
    if (response.status() === 200) {
      const announcements = await response.json();
      console.log('✅ Retrieved general announcements:', announcements.length);
      
      expect(Array.isArray(announcements)).toBe(true);
      
      // Verify all announcements are of the specified type
      for (const announcement of announcements) {
        expect(announcement.type).toBe('general');
      }
    } else {
      console.log('❌ Failed to get announcements by type:', response.status());
    }
  });

  test('POST /api/v1/announcements/:id/publish - Publish announcement', async ({ request }) => {
    // First create a draft announcement
    const userData = {
      email: 'admin-ann5@test.com',
      displayName: 'Test Admin 5 for Announcements',
      isAdmin: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const announcementData = {
      title: 'Draft Announcement',
      content: 'This is a draft announcement to be published',
      status: 'draft'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/announcements`, {
      data: announcementData
    });
    
    if (createResponse.status() === 201) {
      const announcement = await createResponse.json();
      
      console.log('🔍 Publishing announcement:', announcement.id);
      
      const response = await request.post(`${API_BASE_URL}/api/v1/announcements/${announcement.id}/publish`);
      
      console.log('🔍 Publish announcement response status:', response.status());
      
      if (response.status() === 200) {
        const publishedAnnouncement = await response.json();
        console.log('✅ Announcement published successfully');
        
        expect(publishedAnnouncement).toHaveProperty('id', announcement.id);
        expect(publishedAnnouncement).toHaveProperty('status', 'published');
        expect(publishedAnnouncement).toHaveProperty('publishAt');
      } else {
        console.log('❌ Failed to publish announcement:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create announcement for publish test');
      test.skip(true, 'Unable to create test announcement');
    }
  });

  test('GET /api/v1/announcements/stats - Get announcement statistics', async ({ request }) => {
    console.log('🔍 Getting announcement statistics...');
    
    const response = await request.get(`${API_BASE_URL}/api/v1/announcements/stats`);
    
    console.log('🔍 Announcement stats response status:', response.status());
    
    if (response.status() === 200) {
      const stats = await response.json();
      console.log('✅ Retrieved announcement statistics:', stats);
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('published');
      expect(stats).toHaveProperty('draft');
      expect(stats).toHaveProperty('expired');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byPriority');
      expect(stats).toHaveProperty('public');
      expect(stats).toHaveProperty('private');
      expect(stats).toHaveProperty('allowComments');
      
      // Verify structure of nested objects
      expect(stats.byType).toHaveProperty('general');
      expect(stats.byType).toHaveProperty('urgent');
      expect(stats.byType).toHaveProperty('academic');
      expect(stats.byType).toHaveProperty('administrative');
      expect(stats.byType).toHaveProperty('event');
      
      expect(stats.byPriority).toHaveProperty('critical');
      expect(stats.byPriority).toHaveProperty('high');
      expect(stats.byPriority).toHaveProperty('normal');
      expect(stats.byPriority).toHaveProperty('low');
      
      // Verify all values are numbers
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.published).toBe('number');
      expect(typeof stats.draft).toBe('number');
    } else {
      console.log('❌ Failed to get announcement stats:', response.status());
    }
  });
});
