/**
 * Base Database Service
 * 
 * PURPOSE: Common functionality for all database services
 * ARCHITECTURE: Base class with shared methods and configuration
 */

import { appConfig } from '@services/config/apiConfig.js';
import { info, error, warn, debug } from '@services/utils/logger.js';

class BaseDbService {
  constructor(serviceName, endpoint) {
    this.serviceName = serviceName;
    this.endpoint = endpoint;
  }
  
  /**
   * Log service operation start
   */
  logStart(operation, data = {}) {
    console.log(`[${this.serviceName}] ${operation}:`, data);
  }
  
  /**
   * Log service operation success
   */
  logSuccess(operation, data = {}, duration = 0) {
    console.log(`[${this.serviceName}] ✅ ${operation} in ${duration}ms`, data);
  }
  
  /**
   * Log service operation error
   */
  logError(operation, error, data = {}) {
    console.error(`[${this.serviceName}] ❌ Error ${operation}:`, error, data);
  }
  
  /**
   * Measure operation duration
   */
  measureDuration(startTime) {
    return Date.now() - startTime;
  }
  
  /**
   * Get all items with pagination and filtering
   */
  async getAll(params = {}) {
    const startTime = Date.now();
    try {
      const url = appConfig.buildApiUrl(this.endpoint, params);
      const options = appConfig.createFetchOptions({ method: 'GET' });
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const duration = this.measureDuration(startTime);
      
      // Only log success for debugging, not every fetch
      if (import.meta.env?.VITE_LOG_LEVEL === 'debug') {
        this.logSuccess('Retrieved items', { count: result.data?.length || 0 }, duration);
      }
      
      return {
        success: true,
        data: result.data || [],
        total: result.total || result.data?.length || 0,
        duration: `${duration}ms`
      };
      
    } catch (err) {
      const duration = this.measureDuration(startTime);
      this.logError('getting items', err, { params });
      
      return { 
        success: false, 
        error: err.message,
        data: [],
        duration: `${duration}ms`
      };
    }
  }
  
  /**
   * Get item by ID
   */
  async getById(id) {
    const startTime = Date.now();
    try {
      const url = appConfig.buildApiUrl(`${this.endpoint}/${id}`);
      const options = appConfig.createFetchOptions({ method: 'GET' });
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: `${this.serviceName} not found`, data: null };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const duration = this.measureDuration(startTime);
      
      // Only log success for debugging
      if (import.meta.env?.VITE_LOG_LEVEL === 'debug') {
        this.logSuccess('Retrieved item', { id }, duration);
      }
      
      return { success: true, data: result.data, duration: `${duration}ms` };
      
    } catch (err) {
      const duration = this.measureDuration(startTime);
      this.logError('getting item by ID', err, { id });
      
      return { 
        success: false, 
        error: err.message,
        data: null,
        duration: `${duration}ms`
      };
    }
  }
  
  /**
   * Create new item
   */
  async create(itemData) {
    const startTime = Date.now();
    try {
      const url = appConfig.buildApiUrl(this.endpoint);
      const options = appConfig.createFetchOptions({
        method: 'POST',
        body: JSON.stringify(itemData)
      });
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const duration = this.measureDuration(startTime);
      
      this.logSuccess('Created item', { id: result.data?.id }, duration);
      
      return { success: true, data: result.data, duration: `${duration}ms` };
      
    } catch (err) {
      const duration = this.measureDuration(startTime);
      this.logError('creating item', err, { data: itemData });
      
      return { 
        success: false, 
        error: err.message,
        data: null,
        duration: `${duration}ms`
      };
    }
  }
  
  /**
   * Update item
   */
  async update(id, updateData) {
    const startTime = Date.now();
    try {
      this.logStart('Updating item', { id, data: updateData });
      
      const url = appConfig.buildApiUrl(`${this.endpoint}/${id}`);
      const options = appConfig.createFetchOptions({
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const duration = this.measureDuration(startTime);
      
      this.logSuccess('Updated item', { id }, duration);
      
      return { success: true, data: result.data, duration: `${duration}ms` };
      
    } catch (err) {
      const duration = this.measureDuration(startTime);
      this.logError('updating item', err, { id, data: updateData });
      
      return { 
        success: false, 
        error: err.message,
        data: null,
        duration: `${duration}ms`
      };
    }
  }
  
  /**
   * Delete item (soft delete)
   */
  async delete(id) {
    const startTime = Date.now();
    try {
      this.logStart('Deleting item', { id });
      
      const url = appConfig.buildApiUrl(`${this.endpoint}/${id}`);
      const options = appConfig.createFetchOptions({ method: 'DELETE' });
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const duration = this.measureDuration(startTime);
      
      this.logSuccess('Deleted item', { id }, duration);
      
      return { success: true, data: result.data, duration: `${duration}ms` };
      
    } catch (err) {
      const duration = this.measureDuration(startTime);
      this.logError('deleting item', err, { id });
      
      return { 
        success: false, 
        error: err.message,
        data: null,
        duration: `${duration}ms`
      };
    }
  }
  
  /**
   * Get service configuration for debugging
   */
  getConfig() {
    return {
      serviceName: this.serviceName,
      endpoint: this.endpoint,
      apiConfig: appConfig.getConfig()
    };
  }
}

export { BaseDbService };

export default BaseDbService;
