const prisma = require('./prismaClient.js');

class HelpItemsDbService {
  constructor() {
    this.model = prisma.helpItems;
  }

  /**
   * Get all help items
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Array of help items
   */
  async getAll(params = {}) {
    try {
      const { page = 'all', section = null, isActive = true } = params;
      
      const where = {
        isActive,
        ...(page && page !== 'all' && { page }),
        ...(section && { section })
      };

      const items = await this.model.findMany({
        where,
        orderBy: [
          { page: 'asc' },
          { section: 'asc' },
          { order: 'asc' }
        ],
        include: {
          creator: {
            select: { id: true, email: true, displayName: true }
          },
          updater: {
            select: { id: true, email: true, displayName: true }
          }
        }
      });

      return {
        success: true,
        data: items,
        total: items.length
      };
    } catch (error) {
      console.error('[HelpItemsDbService] Error getting help items:', error);
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
   * @returns {Promise<Array>} Array of help items for the page
   */
  async getByPage(page) {
    try {
      const items = await this.model.findMany({
        where: {
          page,
          isActive: true
        },
        orderBy: [
          { section: 'asc' },
          { order: 'asc' }
        ]
      });

      return {
        success: true,
        data: items,
        total: items.length
      };
    } catch (error) {
      console.error(`[HelpItemsDbService] Error getting help items for page ${page}:`, error);
      return {
        success: false,
        error: error.message,
        data: []
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
      const item = await this.model.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, email: true, displayName: true }
          },
          updater: {
            select: { id: true, email: true, displayName: true }
          }
        }
      });

      if (!item) {
        return {
          success: false,
          error: 'Help item not found',
          data: null
        };
      }

      return {
        success: true,
        data: item
      };
    } catch (error) {
      console.error(`[HelpItemsDbService] Error getting help item ${id}:`, error);
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
   * @param {number} userId - User ID creating the help item
   * @returns {Promise<Object>} Created help item
   */
  async create(data, userId) {
    try {
      const item = await this.model.create({
        data: {
          ...data,
          createdBy: userId
        },
        include: {
          creator: {
            select: { id: true, email: true, displayName: true }
          }
        }
      });

      return {
        success: true,
        data: item
      };
    } catch (error) {
      console.error('[HelpItemsDbService] Error creating help item:', error);
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
   * @param {number} userId - User ID updating the help item
   * @returns {Promise<Object>} Updated help item
   */
  async update(id, data, userId) {
    try {
      const item = await this.model.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId
        },
        include: {
          creator: {
            select: { id: true, email: true, displayName: true }
          },
          updater: {
            select: { id: true, email: true, displayName: true }
          }
        }
      });

      return {
        success: true,
        data: item
      };
    } catch (error) {
      console.error(`[HelpItemsDbService] Error updating help item ${id}:`, error);
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
      const item = await this.model.delete({
        where: { id }
      });

      return {
        success: true,
        data: item
      };
    } catch (error) {
      console.error(`[HelpItemsDbService] Error deleting help item ${id}:`, error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get help items organized by page and section
   * @returns {Promise<Object>} Help items organized by page and section
   */
  async getOrganizedHelp() {
    try {
      const items = await this.model.findMany({
        where: { isActive: true },
        orderBy: [
          { page: 'asc' },
          { section: 'asc' },
          { order: 'asc' }
        ]
      });

      // Organize by page and section
      const organized = {};
      items.forEach(item => {
        if (!organized[item.page]) {
          organized[item.page] = {};
        }
        if (!organized[item.page][item.section]) {
          organized[item.page][item.section] = [];
        }
        organized[item.page][item.section].push(item);
      });

      return {
        success: true,
        data: organized
      };
    } catch (error) {
      console.error('[HelpItemsDbService] Error getting organized help:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }
}

module.exports = HelpItemsDbService;
