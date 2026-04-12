/**
 * Subject Type Database Service - API Client
 * 
 * PURPOSE: Handles all subject type operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import BaseDbService from '@services/db/baseDbService.js';

class SubjectTypeDbService extends BaseDbService {
  constructor() {
    super('SubjectTypeDbService', 'subject-types');
  }
  
  // Specific methods for subject types can be added here if needed
  // Most common CRUD operations are inherited from BaseDbService
  
  /**
   * Get active subject types only
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }
  
  /**
   * Get subject types by code
   */
  async getByCode(code) {
    return this.getAll({ code });
  }
}

// Create singleton instance
const subjectTypeDbService = new SubjectTypeDbService();

// Export the instance and class
export { SubjectTypeDbService };
export default subjectTypeDbService;
