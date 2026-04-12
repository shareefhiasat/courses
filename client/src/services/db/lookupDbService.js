/**
 * Lookup Service - Fetches lookup data from database
 * 
 * PURPOSE: Fetch behavior, participation, and penalty types from database
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

class LookupDbService {
  constructor() {
    this.serviceName = 'LookupDbService';
  }

  /**
   * Generic method to get any lookup type
   */
  async getAll(lookupType, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.isActive) queryParams.append('isActive', params.isActive);
      
      const url = `/lookup/${lookupType}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const result = await api.get(url);
      
      return result;
    } catch (error) {
      console.error(`Error fetching ${lookupType}:`, error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get all behavior types
   */
  async getBehaviorTypes() {
    try {
      const result = await api.get('/lookup/behavior-types');
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching behavior types:', error);
      return [];
    }
  }

  /**
   * Get all participation types
   */
  async getParticipationTypes() {
    try {
      const result = await api.get('/lookup/participation-types');
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching participation types:', error);
      return [];
    }
  }

  /**
   * Get all penalty types
   */
  async getPenaltyTypes() {
    try {
      const result = await api.get('/lookup/penalty-types');
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching penalty types:', error);
      return [];
    }
  }
}

// Create and export singleton instance
const lookupDbService = new LookupDbService();
export default lookupDbService;
