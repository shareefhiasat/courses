import { info, error, warn, debug } from '@services/utils/logger.js';

class HelpItemsService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
  }

  /**
   * Get all help items
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Help items response
   */
  async getAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${this.baseURL}/api/v1/help-items?${queryString}` : `${this.baseURL}/api/v1/help-items`;
      
      info('[HelpItemsService] Getting help items with params:', params);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get help items');
      }

      info('[HelpItemsService] ✅ Retrieved help items:', { count: result.data?.length || 0 });
      return result;
    } catch (error) {
      error('[HelpItemsService] Error getting help items:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get help items by page
   * @param {string} page - Page identifier
   * @returns {Promise<Object>} Help items for page
   */
  async getByPage(page) {
    try {
      const url = `${this.baseURL}/api/v1/help-items/page/${encodeURIComponent(page)}`;
      
      info(`[HelpItemsService] Getting help items for page: ${page}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get help items for page');
      }

      info(`[HelpItemsService] ✅ Retrieved help items for page ${page}:`, { count: result.data?.length || 0 });
      return result;
    } catch (error) {
      error(`[HelpItemsService] Error getting help items for page ${page}:`, error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get organized help items (by page and section)
   * @returns {Promise<Object>} Organized help items
   */
  async getOrganizedHelp() {
    try {
      const url = `${this.baseURL}/api/v1/help-items/organized`;
      
      info('[HelpItemsService] Getting organized help items');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get organized help items');
      }

      info('[HelpItemsService] ✅ Retrieved organized help items:', { pages: Object.keys(result.data || {}).length });
      return result;
    } catch (error) {
      error('[HelpItemsService] Error getting organized help items:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  /**
   * Get help item by ID
   * @param {number} id - Help item ID
   * @returns {Promise<Object>} Help item
   */
  async getById(id) {
    try {
      const url = `${this.baseURL}/api/v1/help-items/${id}`;
      
      info(`[HelpItemsService] Getting help item: ${id}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get help item');
      }

      info(`[HelpItemsService] ✅ Retrieved help item ${id}`);
      return result;
    } catch (error) {
      error(`[HelpItemsService] Error getting help item ${id}:`, error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Create help item
   * @param {Object} data - Help item data
   * @returns {Promise<Object>} Created help item
   */
  async create(data) {
    try {
      const url = `${this.baseURL}/api/v1/help-items`;
      
      info('[HelpItemsService] Creating help item:', { page: data.page, section: data.section, key: data.key });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create help item');
      }

      info('[HelpItemsService] ✅ Created help item:', { id: result.data?.id });
      return result;
    } catch (error) {
      error('[HelpItemsService] Error creating help item:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Update help item
   * @param {number} id - Help item ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated help item
   */
  async update(id, data) {
    try {
      const url = `${this.baseURL}/api/v1/help-items/${id}`;
      
      info(`[HelpItemsService] Updating help item: ${id}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update help item');
      }

      info(`[HelpItemsService] ✅ Updated help item ${id}`);
      return result;
    } catch (error) {
      error(`[HelpItemsService] Error updating help item ${id}:`, error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Delete help item
   * @param {number} id - Help item ID
   * @returns {Promise<Object>} Deleted help item
   */
  async delete(id) {
    try {
      const url = `${this.baseURL}/api/v1/help-items/${id}`;
      
      info(`[HelpItemsService] Deleting help item: ${id}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete help item');
      }

      info(`[HelpItemsService] ✅ Deleted help item ${id}`);
      return result;
    } catch (error) {
      error(`[HelpItemsService] Error deleting help item ${id}:`, error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

// Create singleton instance
const helpItemsService = new HelpItemsService();

export default helpItemsService;
export { HelpItemsService };
