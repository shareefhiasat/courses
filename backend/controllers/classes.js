/**
 * Classes Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for class operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getAllClasses, 
  getClassById, 
  createClass, 
  updateClass, 
  deleteClass, 
  getClassesByProgram,
  getClassesBySubject,
  getClassesByInstructor
} from '../services/classes.js';
import { applyListScope } from '../utils/applyListScope.js';

async function applyClassScope(result, req) {
  return applyListScope(req, result, 'class');
}

/**
 * GET /api/v1/classes
 * Get all classes
 */
export const getAllClassesController = async (req, res) => {
  try {
    const result = await getAllClasses(req.query, req.user);
    
    // Apply data scoping
    const scopedResult = await applyClassScope(result, req);
    
    res.status(200).json({
      success: true,
      data: scopedResult.data,
      total: scopedResult.total,
      page: scopedResult.page,
      limit: scopedResult.limit,
      totalPages: scopedResult.totalPages
    });
    
  } catch (error) {
    console.error('Error in getAllClassesController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/classes/:id
 * Get class by ID
 */
export const getClassByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getClassById(id, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getClassByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/classes
 * Create new class
 */
export const createClassController = async (req, res) => {
  try {
    const result = await createClass(req.body, req.user);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in createClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/classes/:id
 * Update class
 */
export const updateClassController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await updateClass(id, req.body, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in updateClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/classes/:id
 * Delete class
 */
export const deleteClassController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteClass(id, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in deleteClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/classes/program/:programId
 * Get classes by program
 */
export const getClassesByProgramController = async (req, res) => {
  try {
    const { programId } = req.params;
    
    const result = await applyClassScope(await getClassesByProgram(programId, req.query, req.user), req);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getClassesByProgramController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/classes/subject/:subjectId
 * Get classes by subject
 */
export const getClassesBySubjectController = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const result = await applyClassScope(await getClassesBySubject(subjectId, req.query, req.user), req);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getClassesBySubjectController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/classes/instructor/:instructorId
 * Get classes by instructor
 */
export const getClassesByInstructorController = async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    const result = await applyClassScope(await getClassesByInstructor(instructorId, req.query, req.user), req);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getClassesByInstructorController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export default {
  getAllClassesController,
  getClassByIdController,
  createClassController,
  updateClassController,
  deleteClassController,
  getClassesByProgramController,
  getClassesBySubjectController,
  getClassesByInstructorController
};
