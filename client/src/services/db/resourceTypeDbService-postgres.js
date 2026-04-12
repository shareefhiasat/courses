/**
 * Resource Type Database Service
 * 
 * PURPOSE: Database operations for resource types using PostgreSQL
 * ARCHITECTURE: Business Services → Database Services → PostgreSQL
 */

import BaseDbService from './baseDbService.js';

class ResourceTypeDbService extends BaseDbService {
  constructor() {
    super('ResourceTypeDbService', 'resource-types');
  }
}

// Create and export singleton instance
const resourceTypeDbService = new ResourceTypeDbService();
export default resourceTypeDbService;
