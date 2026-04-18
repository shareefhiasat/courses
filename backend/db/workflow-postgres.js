/**
 * Workflow Database Service
 * 
 * PURPOSE: Database operations for workflow documents, versions, actions, inbox items, and private workspace links.
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get database user ID from Keycloak user object or string ID
 * 
 * @param {object|string} user - User object from request or Keycloak ID string
 * @returns {Promise<number|null>} - Database user ID or null
 */
export const getDatabaseUserId = async (user) => {
  if (!user) return null;
  
  try {
    // If user is a string, treat it as keycloakId
    if (typeof user === 'string') {
      const kcUser = await prisma.user.findUnique({
        where: { keycloakId: user },
        select: { id: true }
      });
      
      if (kcUser) return kcUser.id;
      
      // Fallback: try as email
      const emailUser = await prisma.user.findUnique({
        where: { email: user },
        select: { id: true }
      });
      
      if (emailUser) return emailUser.id;
      
      return null;
    }
    
    // If user is an object, try keycloakId first
    if (user.id) {
      const kcUser = await prisma.user.findUnique({
        where: { keycloakId: user.id },
        select: { id: true }
      });
      
      if (kcUser) return kcUser.id;
    }
    
    // Try to find user by email (primary method)
    if (user.email) {
      const emailUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true }
      });
      
      if (emailUser) return emailUser.id;
    }
    
    // If no email, try display name as fallback
    if (user.displayName) {
      const nameUser = await prisma.user.findFirst({
        where: { displayName: user.displayName },
        select: { id: true }
      });
      
      if (nameUser) return nameUser.id;
    }
    
    return null;
  } catch (error) {
    console.error('[Workflow DB] Error getting database user ID:', error);
    return null;
  }
};

// ==================== WORKFLOW DOCUMENTS ====================

/**
 * Create a new workflow document
 * 
 * @param {Object} data - Document data
 * @param {Object} user - User creating the document
 * @returns {Promise<Object>} - Result object with document data
 */
export const createWorkflowDocument = async (data, user) => {
  try {
    console.log('[Workflow DB] Creating workflow document:', { data, user: user?.email });
    
    const userId = await getDatabaseUserId(user);
    if (!userId) {
      return {
        success: false,
        error: 'User not found in database'
      };
    }

    const document = await prisma.workflowDocument.create({
      data: {
        ...data,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        currentOwner: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        currentAssignee: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`[Workflow DB] ✅ Created workflow document: ${document.id}`);
    return {
      success: true,
      data: document
    };
    
  } catch (error) {
    console.error('[Workflow DB] ❌ Error creating workflow document:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to create workflow document';
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Get workflow documents with filtering and pagination
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with documents data
 */
export const getWorkflowDocuments = async (params = {}) => {
  try {
    console.log('[Workflow DB] Getting workflow documents with params:', params);
    
    const {
      page = 1,
      limit = 50,
      search = '',
      documentType = '',
      currentStatus = '',
      currentOwnerId = '',
      currentAssigneeId = '',
      createdBy = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = { isActive: true };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (documentType) {
      where.documentType = documentType;
    }
    
    if (currentStatus) {
      where.currentStatus = currentStatus;
    }
    
    if (currentOwnerId) {
      where.currentOwnerId = parseInt(currentOwnerId);
    }
    
    if (currentAssigneeId) {
      where.currentAssigneeId = parseInt(currentAssigneeId);
    }
    
    if (createdBy) {
      where.createdBy = parseInt(createdBy);
    }
    
    // Build order clause
    const orderByClause = {};
    orderByClause[sortBy] = sortOrder.toLowerCase();
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Execute query
    const documents = await prisma.workflowDocument.findMany({
      where,
      orderBy: orderByClause,
      skip,
      take: limitNum,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        currentOwner: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        currentAssignee: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        versions: {
          where: { isActive: true },
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            uploader: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            actions: true,
            inboxItems: true
          }
        }
      }
    });
    
    // Get total count
    const total = await prisma.workflowDocument.count({ where });
    
    console.log(`[Workflow DB] ✅ Retrieved ${documents.length} workflow documents`);
    
    return {
      success: true,
      data: documents,
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
    
  } catch (error) {
    console.error('[Workflow DB] ❌ Error getting workflow documents:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve workflow documents';
    
    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};

/**
 * Get workflow document by ID
 * 
 * @param {number|string} documentId - Document ID
 * @returns {Promise<Object>} - Result object with document data
 */
export const getWorkflowDocumentById = async (documentId) => {
  try {
    console.log(`[Workflow DB] Getting workflow document by ID: ${documentId}`);
    
    const document = await prisma.workflowDocument.findUnique({
      where: { id: parseInt(documentId) },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        currentOwner: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        currentAssignee: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        versions: {
          where: { isActive: true },
          orderBy: { versionNumber: 'desc' },
          include: {
            uploader: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        actions: {
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            receiver: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        inboxItems: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    if (!document) {
      return {
        success: false,
        error: 'Workflow document not found',
        data: null
      };
    }

    console.log(`[Workflow DB] ✅ Retrieved workflow document: ${document.id}`);
    return {
      success: true,
      data: document
    };
    
  } catch (error) {
    console.error('[Workflow DB] ❌ Error getting workflow document by ID:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve workflow document';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Update workflow document
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} updateData - Data to update
 * @param {Object} user - User performing the update
 * @returns {Promise<Object>} - Result object with updated document data
 */
export const updateWorkflowDocument = async (documentId, updateData, user) => {
  try {
    console.log(`[Workflow DB] Updating workflow document: ${documentId}`, { updateData, user: user?.email });
    
    const userId = await getDatabaseUserId(user);
    if (!userId) {
      return {
        success: false,
        error: 'User not found in database'
      };
    }

    const document = await prisma.workflowDocument.update({
      where: { id: parseInt(documentId) },
      data: {
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        currentOwner: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        currentAssignee: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`[Workflow DB] ✅ Updated workflow document: ${document.id}`);
    return {
      success: true,
      data: document
    };
    
  } catch (error) {
    console.error('[Workflow DB] ❌ Error updating workflow document:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to update workflow document';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

// ==================== WORKFLOW ACTIONS ====================

/**
 * Create a workflow action
 * 
 * @param {Object} data - Action data
 * @param {Object} user - User creating the action
 * @returns {Promise<Object>} - Result object with action data
 */
export const createWorkflowAction = async (data, user) => {
  try {
    console.log('[Workflow DB] Creating workflow action:', { data, user: user?.email });
    
    const userId = await getDatabaseUserId(user);
    if (!userId) {
      return {
        success: false,
        error: 'User not found in database'
      };
    }

    const action = await prisma.workflowAction.create({
      data: {
        ...data,
        senderId: userId
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            currentStatus: true
          }
        },
        sender: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`[Workflow DB] ✅ Created workflow action: ${action.id}`);
    return {
      success: true,
      data: action
    };
    
  } catch (error) {
    console.error('[Workflow DB] ❌ Error creating workflow action:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to create workflow action';
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// ==================== WORKFLOW INBOX ====================

/**
 * Get workflow inbox items for a user
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with inbox items data
 */
export const getWorkflowInboxItems = async (params = {}) => {
  try {
    console.log('[Workflow DB] Getting workflow inbox items with params:', params);
    
    const {
      userId,
      page = 1,
      limit = 50,
      isRead = null,
      action = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        data: []
      };
    }
    
    // Build where clause
    const where = { userId: parseInt(userId) };
    
    if (isRead !== null) {
      where.isRead = isRead === 'true' || isRead === true;
    }
    
    if (action) {
      where.action = action;
    }
    
    // Build order clause
    const orderByClause = {};
    orderByClause[sortBy] = sortOrder.toLowerCase();
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Execute query
    const inboxItems = await prisma.workflowInboxItem.findMany({
      where,
      orderBy: orderByClause,
      skip,
      take: limitNum,
      include: {
        document: {
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            currentOwner: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            currentAssignee: {
              select: {
                id: true,
                displayName: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            versions: {
              where: { isActive: true },
              orderBy: { versionNumber: 'desc' },
              take: 1
            }
          }
        },
        user: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    // Get total count
    const total = await prisma.workflowInboxItem.count({ where });
    
    console.log(`[Workflow DB] ✅ Retrieved ${inboxItems.length} inbox items for user ${userId}`);
    
    return {
      success: true,
      data: inboxItems,
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
    
  } catch (error) {
    console.error('[Workflow DB] ❌ Error getting workflow inbox items:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve workflow inbox items';
    
    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};

/**
 * Mark workflow inbox item as read
 * 
 * @param {number|string} inboxItemId - Inbox item ID
 * @param {Object} user - User marking the item as read
 * @returns {Promise<Object>} - Result object
 */
export const markWorkflowInboxItemAsRead = async (inboxItemId, user) => {
  try {
    console.log(`[Workflow DB] Marking inbox item as read: ${inboxItemId}`, { user: user?.email });
    
    const userId = await getDatabaseUserId(user);
    if (!userId) {
      return {
        success: false,
        error: 'User not found in database'
      };
    }

    const inboxItem = await prisma.workflowInboxItem.update({
      where: { id: parseInt(inboxItemId) },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    console.log(`[Workflow DB] ✅ Marked inbox item as read: ${inboxItem.id}`);
    return {
      success: true,
      data: inboxItem
    };
    
  } catch (error) {
    console.error('[Workflow DB] ❌ Error marking inbox item as read:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to mark inbox item as read';
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// ==================== PRIVATE WORKSPACE ====================

/**
 * Get or create private workspace link for a user
 * 
 * @param {number|string} userId - User ID
 * @param {Object} workspaceData - Workspace data
 * @returns {Promise<Object>} - Result object with workspace link data
 */
export const getOrCreatePrivateWorkspaceLink = async (userId, workspaceData) => {
  try {
    console.log(`[Workflow DB] Getting/creating private workspace link for user: ${userId}`);
    
    // First try to find existing link
    let workspaceLink = await prisma.privateWorkspaceLink.findUnique({
      where: { userId: parseInt(userId) }
    });
    
    if (workspaceLink) {
      console.log(`[Workflow DB] ✅ Found existing workspace link: ${workspaceLink.id}`);
      return {
        success: true,
        data: workspaceLink
      };
    }
    
    // Create new link if not found
    workspaceLink = await prisma.privateWorkspaceLink.create({
      data: {
        userId: parseInt(userId),
        ...workspaceData
      }
    });

    console.log(`[Workflow DB] ✅ Created workspace link: ${workspaceLink.id}`);
    return {
      success: true,
      data: workspaceLink
    };
    
  } catch (error) {
    console.error('[Workflow DB] ❌ Error getting/creating workspace link:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to get or create workspace link';
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

