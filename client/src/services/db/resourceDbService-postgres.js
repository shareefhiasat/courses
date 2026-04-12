/**
 * Resource Database Service - API Client
 * 
 * PURPOSE: Handles all resource operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import BaseDbService from '@services/db/baseDbService.js';

class ResourceDbService extends BaseDbService {
  constructor() {
    super('ResourceDbService', 'resources');
  }
  
  // Specific methods for resources can be added here if needed
  // Most common CRUD operations are inherited from BaseDbService
  
  /**
   * Get active resources only
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }
  
  /**
   * Get resources by type
   */
  async getByType(type, params = {}) {
    return this.getAll({ ...params, type });
  }
  
  /**
   * Get resources by program
   */
  async getByProgram(programId, params = {}) {
    return this.getAll({ ...params, programId });
  }
  
  /**
   * Get resources with download count
   */
  async getWithDownloadCount(params = {}) {
    return this.getAll({ ...params, includeDownloads: true });
  }
}

// Create singleton instance
const resourceDbService = new ResourceDbService();

// Export the instance and class
export { ResourceDbService };
export default resourceDbService;
