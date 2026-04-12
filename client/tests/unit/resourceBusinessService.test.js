/**
 * Unit Tests for Resource Business Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as resourceService from '../src/services/business/resourceBusinessService.js';

// Mock the API service
vi.mock('../src/services/api/resources-api.js', () => ({
  resources: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getByClass: vi.fn(),
    getByType: vi.fn(),
    getBySubject: vi.fn(),
    getPublic: vi.fn(),
    getStats: vi.fn()
  }
}));

// Mock the logger
vi.mock('../src/services/utils/logger.js', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
}));

describe('Resource Business Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllResources', () => {
    it('should return all resources successfully', async () => {
      const mockResources = [
        { id: '1', title: 'Resource 1', type: 'document', status: 'published' },
        { id: '2', title: 'Resource 2', type: 'video', status: 'draft' }
      ];
      
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.getAll.mockResolvedValue({ success: true, data: mockResources });
      
      const result = await resourceService.getAllResources();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResources);
      expect(result.total).toBe(2);
    });

    it('should handle API errors gracefully', async () => {
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.getAll.mockRejectedValue(new Error('API Error'));
      
      const result = await resourceService.getAllResources();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load resources');
      expect(result.data).toEqual([]);
    });
  });

  describe('getResourceById', () => {
    it('should return resource by ID successfully', async () => {
      const mockResource = { id: '1', title: 'Resource 1', type: 'document', status: 'published' };
      
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.getById.mockResolvedValue({ success: true, data: mockResource });
      
      const result = await resourceService.getResourceById('1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResource);
    });

    it('should handle not found resource', async () => {
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.getById.mockResolvedValue({ success: false, error: 'Resource not found' });
      
      const result = await resourceService.getResourceById('999');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Resource not found');
      expect(result.data).toBeNull();
    });
  });

  describe('createResource', () => {
    it('should create resource successfully with valid data', async () => {
      const resourceData = {
        title: 'Test Resource',
        type: 'document',
        url: 'https://example.com/file.pdf'
      };
      
      const mockCreatedResource = { 
        id: '1', 
        ...resourceData, 
        isPublic: true,
        isDownloadable: false,
        status: 'published',
        metadata: {}
      };
      
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.create.mockResolvedValue({ success: true, data: mockCreatedResource });
      
      const result = await resourceService.createResource(resourceData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedResource);
      expect(result.message).toBe('Resource created successfully');
    });

    it('should reject resource without title', async () => {
      const resourceData = {
        type: 'document',
        url: 'https://example.com/file.pdf'
      };
      
      const result = await resourceService.createResource(resourceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Resource title is required');
      expect(result.data).toBeNull();
    });

    it('should reject resource without type', async () => {
      const resourceData = {
        title: 'Test Resource',
        url: 'https://example.com/file.pdf'
      };
      
      const result = await resourceService.createResource(resourceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Resource type is required');
      expect(result.data).toBeNull();
    });

    it('should reject invalid resource type', async () => {
      const resourceData = {
        title: 'Test Resource',
        type: 'invalid',
        url: 'https://example.com/file.pdf'
      };
      
      const result = await resourceService.createResource(resourceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid resource type. Must be one of: document, video, audio, image, link, assignment, presentation, other');
      expect(result.data).toBeNull();
    });

    it('should reject negative file size', async () => {
      const resourceData = {
        title: 'Test Resource',
        type: 'document',
        url: 'https://example.com/file.pdf',
        fileSize: -1000
      };
      
      const result = await resourceService.createResource(resourceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('File size must be a positive number');
      expect(result.data).toBeNull();
    });

    it('should require URL for link type', async () => {
      const resourceData = {
        title: 'Test Resource',
        type: 'link'
      };
      
      const result = await resourceService.createResource(resourceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('URL is required for link type resources');
      expect(result.data).toBeNull();
    });

    it('should require file path or URL for non-link types', async () => {
      const resourceData = {
        title: 'Test Resource',
        type: 'document'
      };
      
      const result = await resourceService.createResource(resourceData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('File path or URL is required for non-link resources');
      expect(result.data).toBeNull();
    });
  });

  describe('updateResource', () => {
    it('should update resource successfully', async () => {
      const updateData = {
        title: 'Updated Resource',
        description: 'Updated description'
      };
      
      const mockUpdatedResource = { 
        id: '1', 
        ...updateData, 
        updatedAt: new Date().toISOString() 
      };
      
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.update.mockResolvedValue({ success: true, data: mockUpdatedResource });
      
      const result = await resourceService.updateResource('1', updateData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedResource);
      expect(result.message).toBe('Resource updated successfully');
    });

    it('should reject update without ID', async () => {
      const updateData = { title: 'Updated Resource' };
      
      const result = await resourceService.updateResource('', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Resource ID is required');
      expect(result.data).toBeNull();
    });

    it('should reject invalid type', async () => {
      const updateData = { type: 'invalid' };
      
      const result = await resourceService.updateResource('1', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid resource type. Must be one of: document, video, audio, image, link, assignment, presentation, other');
      expect(result.data).toBeNull();
    });

    it('should reject negative file size', async () => {
      const updateData = { fileSize: -1000 };
      
      const result = await resourceService.updateResource('1', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('File size must be a positive number');
      expect(result.data).toBeNull();
    });
  });

  describe('deleteResource', () => {
    it('should delete resource successfully', async () => {
      const { resources } = await import('../src/services/api/resources-api.js');
      // Mock resource without activities
      resources.getById.mockResolvedValue({ 
        success: true, 
        data: { id: '1', title: 'Resource 1', activityIds: [] } 
      });
      resources.delete.mockResolvedValue({ success: true });
      
      const result = await resourceService.deleteResource('1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Resource deleted successfully');
    });

    it('should reject delete without ID', async () => {
      const result = await resourceService.deleteResource('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Resource ID is required');
      expect(result.data).toBeNull();
    });

    it('should prevent deletion of resources with activities', async () => {
      const { resources } = await import('../src/services/api/resources-api.js');
      // Mock resource with activities
      resources.getById.mockResolvedValue({ 
        success: true, 
        data: { id: '1', title: 'Resource 1', activityIds: ['activity1', 'activity2'] } 
      });
      
      const result = await resourceService.deleteResource('1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete resource that is associated with activities');
      expect(result.data).toBeNull();
    });
  });

  describe('getResourcesByClass', () => {
    it('should return resources for a specific class', async () => {
      const mockResources = [
        { id: '1', classId: 'class1', title: 'Class Resource 1' },
        { id: '2', classId: 'class1', title: 'Class Resource 2' }
      ];
      
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.getAll.mockResolvedValue({ success: true, data: mockResources });
      
      const result = await resourceService.getResourcesByClass('class1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResources);
      expect(result.total).toBe(2);
    });

    it('should reject without class ID', async () => {
      const result = await resourceService.getResourcesByClass('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Class ID is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('getResourcesByType', () => {
    it('should return resources for a specific type', async () => {
      const mockResources = [
        { id: '1', type: 'document', title: 'Document Resource' },
        { id: '2', type: 'document', title: 'Another Document' }
      ];
      
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.getAll.mockResolvedValue({ success: true, data: mockResources });
      
      const result = await resourceService.getResourcesByType('document');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResources);
      expect(result.total).toBe(2);
    });

    it('should reject without type', async () => {
      const result = await resourceService.getResourcesByType('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Resource type is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('getResourcesBySubject', () => {
    it('should return resources for a specific subject', async () => {
      const mockResources = [
        { id: '1', subjectId: 'subject1', title: 'Subject Resource 1' },
        { id: '2', subjectId: 'subject1', title: 'Subject Resource 2' }
      ];
      
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.getAll.mockResolvedValue({ success: true, data: mockResources });
      
      const result = await resourceService.getResourcesBySubject('subject1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResources);
      expect(result.total).toBe(2);
    });

    it('should reject without subject ID', async () => {
      const result = await resourceService.getResourcesBySubject('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Subject ID is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('getPublicResources', () => {
    it('should return only public resources', async () => {
      const mockResources = [
        { id: '1', isPublic: true, title: 'Public Resource 1' },
        { id: '2', isPublic: true, title: 'Public Resource 2' }
      ];
      
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.getAll.mockResolvedValue({ success: true, data: mockResources });
      
      const result = await resourceService.getPublicResources();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResources);
      expect(result.total).toBe(2);
      expect(resources.getAll).toHaveBeenCalledWith({ isPublic: true });
    });
  });

  describe('publishResource', () => {
    it('should publish resource successfully', async () => {
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.update.mockResolvedValue({ success: true, data: { id: '1', status: 'published' } });
      
      const result = await resourceService.publishResource('1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Resource published successfully');
      expect(resources.update).toHaveBeenCalledWith('1', {
        status: 'published',
        publishedAt: expect.any(Date)
      }, null);
    });

    it('should reject without ID', async () => {
      const result = await resourceService.publishResource('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Resource ID is required');
      expect(result.data).toBeNull();
    });
  });

  describe('unpublishResource', () => {
    it('should unpublish resource successfully', async () => {
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.update.mockResolvedValue({ success: true, data: { id: '1', status: 'draft' } });
      
      const result = await resourceService.unpublishResource('1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Resource unpublished successfully');
      expect(resources.update).toHaveBeenCalledWith('1', {
        status: 'draft'
      }, null);
    });
  });

  describe('getResourceStats', () => {
    it('should return resource statistics', async () => {
      const mockResources = [
        { id: '1', status: 'published', type: 'document', isPublic: true, isDownloadable: true, fileSize: 1000 },
        { id: '2', status: 'draft', type: 'video', isPublic: false, isDownloadable: false, fileSize: 5000 },
        { id: '3', status: 'published', type: 'document', isPublic: true, isDownloadable: true, fileSize: 2000 }
      ];
      
      const { resources } = await import('../src/services/api/resources-api.js');
      resources.getAll.mockResolvedValue({ success: true, data: mockResources });
      
      const result = await resourceService.getResourceStats();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        total: 3,
        published: 2,
        draft: 1,
        byType: {
          document: 2,
          video: 1,
          audio: 0,
          image: 0,
          link: 0,
          assignment: 0,
          presentation: 0,
          other: 0
        },
        public: 2,
        private: 1,
        downloadable: 2,
        totalSize: 8000,
        averageSize: 2666.6666666666665
      });
    });
  });
});
