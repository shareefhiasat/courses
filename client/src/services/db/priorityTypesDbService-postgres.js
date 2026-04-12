/**
 * Priority Types Database Service
 * Handles API calls to priority types endpoints
 */

import BaseDbService from './baseDbService.js';

class PriorityTypesDbService extends BaseDbService {
  constructor() {
    super('PriorityTypesDbService', 'priority-types');
  }
}

// Create and export singleton instance
const priorityTypesDbService = new PriorityTypesDbService();
export default priorityTypesDbService;
