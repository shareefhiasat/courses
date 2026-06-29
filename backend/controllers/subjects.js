/**
 * Subjects Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for subject operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getAllSubjects, 
  getSubjectById, 
  createSubject, 
  updateSubject, 
  deleteSubject, 
  getSubjectsByProgram 
} from '../services/subjects.js';
import { applyListScope } from '../utils/applyListScope.js';

function applySubjectScope(result, req) {
  return applyListScope(req, result, 'subject');
}

/**
 * GET /api/v1/subjects
 * Get all subjects
 */
export const getAllSubjectsController = async (req, res) => {
  try {
    console.log('🔍 Subjects controller called with query:', req.query);
    const result = await getAllSubjects(req.query, req.user);
    const scoped = await applySubjectScope(result, req);
    
    console.log('🔍 Subjects controller sending response:', {
      success: scoped.success,
      dataLength: scoped.data?.length,
      firstSubject: scoped.data?.[0],
      responseData: scoped.data
    });
    
    if (scoped.success) {
      res.status(200).json({
        success: true,
        data: scoped.data,
        total: scoped.total,
        page: scoped.page,
        limit: scoped.limit,
        totalPages: scoped.totalPages
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getAllSubjectsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/subjects/:id
 * Get subject by ID
 */
export const getSubjectByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getSubjectById(id, req.user);
    
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
    console.error('Error in getSubjectByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/subjects
 * Create new subject
 */
export const createSubjectController = async (req, res) => {
  try {
    const result = await createSubject(req.body, req.user);
    
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
    console.error('Error in createSubjectController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/subjects/:id
 * Update subject
 */
export const updateSubjectController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await updateSubject(id, req.body, req.user);
    
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
    console.error('Error in updateSubjectController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/subjects/:id
 * Delete subject
 */
export const deleteSubjectController = async (req, res) => {
  try {
    const { id } = req.params;
    const options = { force: req.body?.force || req.query?.force === 'true' };
    
    const result = await deleteSubject(id, req.user, options);
    
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
        error: result.error,
        code: result.code || undefined,
        dependencies: result.dependencies || undefined
      });
    }
    
  } catch (error) {
    console.error('Error in deleteSubjectController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/subjects/program/:programId
 * Get subjects by program
 */
export const getSubjectsByProgramController = async (req, res) => {
  try {
    const { programId } = req.params;
    
    const result = await getSubjectsByProgram(programId, req.query, req.user);
    
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
    console.error('Error in getSubjectsByProgramController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export default {
  getAllSubjectsController,
  getSubjectByIdController,
  createSubjectController,
  updateSubjectController,
  deleteSubjectController,
  getSubjectsByProgramController
};
