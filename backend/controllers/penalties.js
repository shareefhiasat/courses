/**
 * Penalties Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for penalty operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/v1/penalties
 * Get all penalties
 */
export const getAllPenaltiesController = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, classId, typeId, isActive } = req.query;
    
    const where = {};
    if (userId) where.userId = parseInt(userId);
    if (classId) where.classId = parseInt(classId);
    if (typeId) where.typeId = parseInt(typeId);
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [penalties, total] = await Promise.all([
      prisma.penalty.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              realName: true,
              email: true
            }
          },
          class: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true,
              program: {
                select: {
                  id: true,
                  code: true,
                  nameEn: true,
                  nameAr: true
                }
              }
            }
          },
          penaltyType: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          },
          creator: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.penalty.count({ where })
    ]);
    
    res.status(200).json({
      success: true,
      data: penalties,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error in getAllPenaltiesController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/penalties/:id
 * Get penalty by ID
 */
export const getPenaltyByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const penalty = await prisma.penalty.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            realName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            program: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        },
        penaltyType: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });
    
    if (!penalty) {
      return res.status(404).json({
        success: false,
        error: 'Penalty not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: penalty
    });
  } catch (error) {
    console.error('Error in getPenaltyByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/penalties
 * Create new penalty
 */
export const createPenaltyController = async (req, res) => {
  try {
    const {
      studentId,
      classId,
      subjectId,
      programId,
      type,
      descriptionEn,
      descriptionAr,
      points,
      comment,
      createdBy,
      performedBy,
      performedByName,
      performedByEmail,
      sendInAppNotification,
      sendEmailNotification
    } = req.body;
    
    // Get current user info from auth middleware
    const currentUser = req.user;
    let currentUserId = null;
    
    if (currentUser?.id) {
      const currentUserRecord = await prisma.user.findUnique({
        where: { keycloakId: currentUser.id },
        select: { id: true }
      });
      currentUserId = currentUserRecord?.id || createdBy || 1;
    } else {
      currentUserId = createdBy || 1;
    }
    
    // Find the penalty type (case-insensitive)
    const penaltyType = await prisma.penaltyTypes.findFirst({
      where: { 
        OR: [
          { code: type },
          { code: type.toUpperCase() }
        ]
      }
    });
    
    if (!penaltyType) {
      return res.status(400).json({
        success: false,
        error: 'Invalid penalty type'
      });
    }
    
    const penalty = await prisma.penalty.create({
      data: {
        userId: parseInt(studentId),
        classId: classId ? parseInt(classId) : null,
        subjectId: subjectId ? parseInt(subjectId) : null,
        programId: programId ? parseInt(programId) : null,
        typeId: penaltyType.id,
        descriptionEn: descriptionEn || '',
        descriptionAr: descriptionAr || null,
        points: parseInt(points) || 0,
        comment: comment || null,
        isActive: true,
        createdBy: currentUserId
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            realName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            program: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        },
        penaltyType: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: penalty,
      message: 'Penalty created successfully'
    });
  } catch (error) {
    console.error('Error in createPenaltyController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/penalties/:id
 * Update penalty
 */
export const updatePenaltyController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      descriptionEn,
      descriptionAr,
      points,
      comment,
      isActive
    } = req.body;
    
    // Get current user info from auth middleware
    const currentUser = req.user;
    let currentUserId = null;
    
    if (currentUser?.id) {
      const currentUserRecord = await prisma.user.findUnique({
        where: { keycloakId: currentUser.id },
        select: { id: true }
      });
      currentUserId = currentUserRecord?.id || 1;
    } else {
      currentUserId = 1;
    }
    
    const updateData = {
      updatedBy: currentUserId
    };
    
    if (type !== undefined) {
      const penaltyType = await prisma.penaltyTypes.findFirst({
        where: { 
          OR: [
            { code: type },
            { code: type.toUpperCase() }
          ]
        }
      });
      
      if (!penaltyType) {
        return res.status(400).json({
          success: false,
          error: 'Invalid penalty type'
        });
      }
      updateData.typeId = penaltyType.id;
    }
    
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;
    if (points !== undefined) updateData.points = parseInt(points);
    if (comment !== undefined) updateData.comment = comment;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const penalty = await prisma.penalty.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            realName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            program: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        },
        penaltyType: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      data: penalty,
      message: 'Penalty updated successfully'
    });
  } catch (error) {
    console.error('Error in updatePenaltyController:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/penalties/:id
 * Delete penalty
 */
export const deletePenaltyController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const penalty = await prisma.penalty.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({
      success: true,
      message: 'Penalty deleted successfully'
    });
  } catch (error) {
    console.error('Error in deletePenaltyController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/penalties/student/:studentId
 * Get penalties by student ID
 */
export const getPenaltiesByStudentController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [penalties, total] = await Promise.all([
      prisma.penalty.findMany({
        where: { userId: parseInt(studentId) },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              realName: true,
              email: true
            }
          },
          class: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true,
              program: {
                select: {
                  id: true,
                  code: true,
                  nameEn: true,
                  nameAr: true
                }
              }
            }
          },
          penaltyType: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          },
          creator: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.penalty.count({ where: { userId: parseInt(studentId) } })
    ]);
    
    res.status(200).json({
      success: true,
      data: penalties,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error in getPenaltiesByStudentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/penalties/class/:classId
 * Get penalties by class ID
 */
export const getPenaltiesByClassController = async (req, res) => {
  try {
    const { classId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [penalties, total] = await Promise.all([
      prisma.penalty.findMany({
        where: { classId: parseInt(classId) },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              realName: true,
              email: true
            }
          },
          class: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true,
              program: {
                select: {
                  id: true,
                  code: true,
                  nameEn: true,
                  nameAr: true
                }
              }
            }
          },
          penaltyType: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          },
          creator: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.penalty.count({ where: { classId: parseInt(classId) } })
    ]);
    
    res.status(200).json({
      success: true,
      data: penalties,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error in getPenaltiesByClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
