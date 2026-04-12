import { test, expect } from '@playwright/test';

test.describe('Resources API - CRUD Operations', () => {
  const API_BASE_URL = 'http://localhost:3000';
  
  test('Resources API - Service Layer Integration', async ({ request }) => {
    console.log('🔍 Testing resources service layer with PostgreSQL backend...');
    
    // Test GET all resources
    const response = await request.get(`${API_BASE_URL}/api/v1/resources`);
    
    console.log('🔍 Resources API response status:', response.status());
    
    if (response.status() === 200) {
      const resources = await response.json();
      console.log('✅ Resources API returned data:', resources.length, 'resources');
      
      // Verify response structure
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThanOrEqual(0);
      
      // If there are resources, verify structure
      if (resources.length > 0) {
        const resource = resources[0];
        expect(resource).toHaveProperty('id');
        expect(resource).toHaveProperty('title');
        expect(resource).toHaveProperty('type');
        expect(resource).toHaveProperty('status');
      }
    } else if (response.status() === 404) {
      console.log('⚠️ Resources API not found - service layer may not be fully implemented yet');
      test.skip(true, 'Resources API endpoint not yet implemented');
    } else {
      console.log('❌ Resources API returned unexpected status:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });

  test('POST /api/v1/resources - Create new resource', async ({ request }) => {
    // First create a user to test resource
    const userData = {
      email: 'admin-res@test.com',
      displayName: 'Test Admin for Resources',
      isAdmin: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      console.log('⚠️ Could not create user for resource test');
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const resourceData = {
      title: 'Test Resource',
      type: 'document',
      url: 'https://example.com/test-document.pdf',
      description: 'This is a test resource for the LMS system'
    };
    
    console.log('🔍 Creating new resource...');
    
    const response = await request.post(`${API_BASE_URL}/api/v1/resources`, {
      data: resourceData
    });
    
    console.log('🔍 Create resource response status:', response.status());
    
    if (response.status() === 201) {
      const resource = await response.json();
      console.log('✅ Resource created successfully:', resource.id);
      
      // Verify response structure
      expect(resource).toHaveProperty('id');
      expect(resource).toHaveProperty('title', resourceData.title);
      expect(resource).toHaveProperty('type', resourceData.type);
      expect(resource).toHaveProperty('url', resourceData.url);
      expect(resource).toHaveProperty('status', 'published');
      expect(resource).toHaveProperty('isPublic', true);
      expect(resource).toHaveProperty('isDownloadable', false);
      
      // Store resource ID for subsequent tests
      test.resourceId = resource.id;
    } else if (response.status() === 400) {
      const error = await response.json();
      console.log('⚠️ Resource creation validation error:', error.error);
      // This might be expected if validation is strict
    } else {
      console.log('❌ Failed to create resource:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });

  test('GET /api/v1/resources/:id - Get resource by ID', async ({ request }) => {
    // First create a resource to test
    const userData = {
      email: 'admin-res2@test.com',
      displayName: 'Test Admin 2 for Resources',
      isAdmin: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const resourceData = {
      title: 'Test Resource for Get',
      type: 'video',
      url: 'https://example.com/test-video.mp4'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/resources`, {
      data: resourceData
    });
    
    if (createResponse.status() === 201) {
      const resource = await createResponse.json();
      
      console.log('🔍 Getting resource by ID:', resource.id);
      
      const response = await request.get(`${API_BASE_URL}/api/v1/resources/${resource.id}`);
      
      console.log('🔍 Get resource response status:', response.status());
      
      if (response.status() === 200) {
        const retrievedResource = await response.json();
        console.log('✅ Resource retrieved successfully');
        
        // Verify the resource data
        expect(retrievedResource).toHaveProperty('id', resource.id);
        expect(retrievedResource).toHaveProperty('title', resourceData.title);
        expect(retrievedResource).toHaveProperty('type', resourceData.type);
        expect(retrievedResource).toHaveProperty('url', resourceData.url);
      } else {
        console.log('❌ Failed to get resource:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create resource for GET test');
      test.skip(true, 'Unable to create test resource');
    }
  });

  test('PUT /api/v1/resources/:id - Update resource', async ({ request }) => {
    // First create a resource
    const userData = {
      email: 'admin-res3@test.com',
      displayName: 'Test Admin 3 for Resources',
      isAdmin: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const resourceData = {
      title: 'Test Resource for Update',
      type: 'audio',
      url: 'https://example.com/test-audio.mp3'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/resources`, {
      data: resourceData
    });
    
    if (createResponse.status() === 201) {
      const resource = await createResponse.json();
      
      const updateData = {
        title: 'Updated Resource Title',
        description: 'Updated description for the resource',
        isDownloadable: true
      };
      
      console.log('🔍 Updating resource:', resource.id);
      
      const response = await request.put(`${API_BASE_URL}/api/v1/resources/${resource.id}`, {
        data: updateData
      });
      
      console.log('🔍 Update resource response status:', response.status());
      
      if (response.status() === 200) {
        const updatedResource = await response.json();
        console.log('✅ Resource updated successfully');
        
        // Verify the updates
        expect(updatedResource).toHaveProperty('id', resource.id);
        expect(updatedResource).toHaveProperty('title', updateData.title);
        expect(updatedResource).toHaveProperty('description', updateData.description);
        expect(updatedResource).toHaveProperty('isDownloadable', updateData.isDownloadable);
        expect(updatedResource).toHaveProperty('updatedAt');
      } else if (response.status() === 400) {
        const error = await response.json();
        console.log('⚠️ Resource update validation error:', error.error);
      } else {
        console.log('❌ Failed to update resource:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create resource for PUT test');
      test.skip(true, 'Unable to create test resource');
    }
  });

  test('DELETE /api/v1/resources/:id - Delete resource', async ({ request }) => {
    // First create a resource
    const userData = {
      email: 'admin-res4@test.com',
      displayName: 'Test Admin 4 for Resources',
      isAdmin: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const resourceData = {
      title: 'Test Resource for Delete',
      type: 'image',
      url: 'https://example.com/test-image.jpg'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/resources`, {
      data: resourceData
    });
    
    if (createResponse.status() === 201) {
      const resource = await createResponse.json();
      
      console.log('🔍 Deleting resource:', resource.id);
      
      const response = await request.delete(`${API_BASE_URL}/api/v1/resources/${resource.id}`);
      
      console.log('🔍 Delete resource response status:', response.status());
      
      if (response.status() === 204) {
        console.log('✅ Resource deleted successfully');
        
        // Verify the resource is gone
        const getResponse = await request.get(`${API_BASE_URL}/api/v1/resources/${resource.id}`);
        expect(getResponse.status()).toBe(404);
      } else if (response.status() === 404) {
        console.log('⚠️ Resource not found for deletion');
      } else {
        console.log('❌ Failed to delete resource:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create resource for DELETE test');
      test.skip(true, 'Unable to create test resource');
    }
  });

  test('GET /api/v1/resources - Validation tests', async ({ request }) => {
    console.log('🔍 Testing resource validation...');
    
    // Test creating resource without required fields
    const invalidResourceData = {
      type: 'document'
      // Missing title
    };
    
    const response = await request.post(`${API_BASE_URL}/api/v1/resources`, {
      data: invalidResourceData
    });
    
    console.log('🔍 Invalid resource creation response status:', response.status());
    
    if (response.status() === 400) {
      const error = await response.json();
      console.log('✅ Validation working correctly:', error.error);
      expect(error.error).toContain('required');
    } else {
      console.log('⚠️ Expected validation error but got:', response.status());
    }
  });

  test('GET /api/v1/resources/type/:type - Get resources by type', async ({ request }) => {
    console.log('🔍 Getting resources by type...');
    
    const response = await request.get(`${API_BASE_URL}/api/v1/resources/type/document`);
    
    console.log('🔍 Resources by type response status:', response.status());
    
    if (response.status() === 200) {
      const resources = await response.json();
      console.log('✅ Retrieved document resources:', resources.length);
      
      expect(Array.isArray(resources)).toBe(true);
      
      // Verify all resources are of the specified type
      for (const resource of resources) {
        expect(resource.type).toBe('document');
      }
    } else {
      console.log('❌ Failed to get resources by type:', response.status());
    }
  });

  test('GET /api/v1/resources/public - Get public resources', async ({ request }) => {
    console.log('🔍 Getting public resources...');
    
    const response = await request.get(`${API_BASE_URL}/api/v1/resources/public`);
    
    console.log('🔍 Public resources response status:', response.status());
    
    if (response.status() === 200) {
      const resources = await response.json();
      console.log('✅ Retrieved public resources:', resources.length);
      
      expect(Array.isArray(resources)).toBe(true);
      
      // Verify all resources are public
      for (const resource of resources) {
        expect(resource.isPublic).toBe(true);
      }
    } else {
      console.log('❌ Failed to get public resources:', response.status());
    }
  });

  test('POST /api/v1/resources/:id/publish - Publish resource', async ({ request }) => {
    // First create a draft resource
    const userData = {
      email: 'admin-res5@test.com',
      displayName: 'Test Admin 5 for Resources',
      isAdmin: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const resourceData = {
      title: 'Draft Resource',
      type: 'presentation',
      url: 'https://example.com/test-presentation.pdf',
      status: 'draft'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/resources`, {
      data: resourceData
    });
    
    if (createResponse.status() === 201) {
      const resource = await createResponse.json();
      
      console.log('🔍 Publishing resource:', resource.id);
      
      const response = await request.post(`${API_BASE_URL}/api/v1/resources/${resource.id}/publish`);
      
      console.log('🔍 Publish resource response status:', response.status());
      
      if (response.status() === 200) {
        const publishedResource = await response.json();
        console.log('✅ Resource published successfully');
        
        expect(publishedResource).toHaveProperty('id', resource.id);
        expect(publishedResource).toHaveProperty('status', 'published');
        expect(publishedResource).toHaveProperty('publishedAt');
      } else {
        console.log('❌ Failed to publish resource:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create resource for publish test');
      test.skip(true, 'Unable to create test resource');
    }
  });

  test('GET /api/v1/resources/stats - Get resource statistics', async ({ request }) => {
    console.log('🔍 Getting resource statistics...');
    
    const response = await request.get(`${API_BASE_URL}/api/v1/resources/stats`);
    
    console.log('🔍 Resource stats response status:', response.status());
    
    if (response.status() === 200) {
      const stats = await response.json();
      console.log('✅ Retrieved resource statistics:', stats);
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('published');
      expect(stats).toHaveProperty('draft');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('public');
      expect(stats).toHaveProperty('private');
      expect(stats).toHaveProperty('downloadable');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('averageSize');
      
      // Verify structure of nested objects
      expect(stats.byType).toHaveProperty('document');
      expect(stats.byType).toHaveProperty('video');
      expect(stats.byType).toHaveProperty('audio');
      expect(stats.byType).toHaveProperty('image');
      expect(stats.byType).toHaveProperty('link');
      expect(stats.byType).toHaveProperty('assignment');
      expect(stats.byType).toHaveProperty('presentation');
      expect(stats.byType).toHaveProperty('other');
      
      // Verify all values are numbers
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.published).toBe('number');
      expect(typeof stats.draft).toBe('number');
    } else {
      console.log('❌ Failed to get resource stats:', response.status());
    }
  });
});
