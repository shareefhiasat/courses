/**
 * Target Audience Types Database Service
 * 
 * Database service layer for target audience types operations
 */

import { BaseDbService } from '@services/db/baseDbService.js';

class TargetAudienceTypesDbService extends BaseDbService {
  constructor() {
    super('target-audience-types', 'target-audience-types');
  }
}

// Create singleton instance
const targetAudienceTypesDbService = new TargetAudienceTypesDbService();

export { targetAudienceTypesDbService };
export default targetAudienceTypesDbService;
