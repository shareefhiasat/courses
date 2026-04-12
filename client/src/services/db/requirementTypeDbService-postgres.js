/**
 * Requirement Type Database Service - API Client
 * 
 * PURPOSE: Handles all requirement type operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import BaseDbService from '@services/db/baseDbService.js';

class RequirementTypeDbService extends BaseDbService {
  constructor() {
    super('RequirementTypeDbService', 'requirement-types');
  }
  
  // Specific methods for requirement types can be added here if needed
  // Most common CRUD operations are inherited from BaseDbService
  
  /**
   * Get active requirement types only
   */
  async getActive(params = {}) {
    return this.getAll({ ...params, isActive: true });
  }
  
  /**
   * Get requirement types by code
   */
  async getByCode(code) {
    return this.getAll({ code });
  }
}

// Create singleton instance
const requirementTypeDbService = new RequirementTypeDbService();

// Export the instance and class
export { RequirementTypeDbService };
export default requirementTypeDbService;
