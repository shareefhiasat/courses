/**
 * Resources API Service - Real Database Integration
 * 
 * This file provides direct database access for resources
 * while keeping other services as mock data for now
 */

import resourceDbService from '../db/resourceDbService-postgres.cjs';

// Real resources endpoints using database
export const resources = {
  getAll: async (filters = {}) => {
    try {
      const result = await resourceDbService.getResources();
      return result;
    } catch (error) {
      console.error('Resources API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getById: async (id) => {
    try {
      const result = await resourceDbService.getResourceById(id);
      return result;
    } catch (error) {
      console.error('Resource by ID API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  create: async (data, user) => {
    try {
      const result = await resourceDbService.create(data, user);
      return result;
    } catch (error) {
      console.error('Create resource API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  update: async (id, data, user) => {
    try {
      const result = await resourceDbService.update(id, data, user);
      return result;
    } catch (error) {
      console.error('Update resource API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  delete: async (id, user) => {
    try {
      const result = await resourceDbService.deleteResource(id);
      return result;
    } catch (error) {
      console.error('Delete resource API error:', error);
      return { success: false, error: error.message, data: null };
    }
  },
  
  // Additional methods for resource-specific operations
  getByClass: async (classId) => {
    try {
      const result = await resourceDbService.getResources({ classId });
      return result;
    } catch (error) {
      console.error('Get resources by class API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getByType: async (type) => {
    try {
      const result = await resourceDbService.getResources({ type });
      return result;
    } catch (error) {
      console.error('Get resources by type API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getBySubject: async (subjectId) => {
    try {
      const result = await resourceDbService.getResources({ subjectId });
      return result;
    } catch (error) {
      console.error('Get resources by subject API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getPublic: async (filters = {}) => {
    try {
      const result = await resourceDbService.getResources({ isPublic: true, ...filters });
      return result;
    } catch (error) {
      console.error('Get public resources API error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
  
  getStats: async (filters = {}) => {
    try {
      const result = await resourceDbService.getResources(filters);
      if (result.success) {
        const resources = result.data;
        
        const stats = {
          total: resources.length,
          published: resources.filter(r => r.status === 'published').length,
          draft: resources.filter(r => r.status === 'draft').length,
          byType: {
            document: resources.filter(r => r.type === 'document').length,
            video: resources.filter(r => r.type === 'video').length,
            audio: resources.filter(r => r.type === 'audio').length,
            image: resources.filter(r => r.type === 'image').length,
            link: resources.filter(r => r.type === 'link').length,
            assignment: resources.filter(r => r.type === 'assignment').length,
            presentation: resources.filter(r => r.type === 'presentation').length,
            other: resources.filter(r => r.type === 'other').length
          },
          public: resources.filter(r => r.isPublic).length,
          private: resources.filter(r => !r.isPublic).length,
          downloadable: resources.filter(r => r.isDownloadable).length,
          totalSize: resources.reduce((sum, r) => sum + (r.fileSize || 0), 0),
          averageSize: resources.length > 0 
            ? resources.reduce((sum, r) => sum + (r.fileSize || 0), 0) / resources.length 
            : 0
        };
        
        return { success: true, data: stats };
      }
      return result;
    } catch (error) {
      console.error('Get resource stats API error:', error);
      return { success: false, error: error.message, data: null };
    }
  }
};
