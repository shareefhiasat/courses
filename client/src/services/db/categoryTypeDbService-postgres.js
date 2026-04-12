/**
 * Category Type Database Service
 * 
 * PURPOSE: Database operations for category types using PostgreSQL
 * ARCHITECTURE: Business Services → Database Services → PostgreSQL
 */

import BaseDbService from './baseDbService.js';

class CategoryTypeDbService extends BaseDbService {
  constructor() {
    super('CategoryTypeDbService', 'category-types');
  }
}

// Create and export singleton instance
const categoryTypeDbService = new CategoryTypeDbService();
export default categoryTypeDbService;
