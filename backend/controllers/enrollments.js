/**
 * Enrollments Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for enrollment operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getAllEnrollments, 
  getEnrollmentById, 
  createEnrollment, 
  updateEnrollment, 
  deleteEnrollment, 
  getEnrollmentsByStudent,
  getEnrollmentsByClass,
  getEnrollmentsByProgram
} from '../services/enrollments.js';
import { applyListScope } from '../utils/applyListScope.js';

/**
 * GET /api/v1/enrollments
 * Get all enrollments
 */
export const getAllEnrollmentsController = async (req, res) => {
  try {
    console.log('🔍 [EnrollmentsController] getAllEnrollments - Query:', req.query);
    console.log('🔍 [EnrollmentsController] getAllEnrollments - User:', req.user);
    
    const result = await applyListScope(req, await getAllEnrollments(req.query, req.user), 'enrollment');
    
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
      console.log('❌ [EnrollmentsController] getAllEnrollments - Error:', result.error);
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getAllEnrollmentsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/enrollments/:id
 * Get enrollment by ID
 */
export const getEnrollmentByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getEnrollmentById(parseInt(id), req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      if (result.error.includes('not found')) {
        res.status(404).json({
          success: false,
          error: result.error
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    }
    
  } catch (error) {
    console.error('Error in getEnrollmentByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/enrollments
 * Create new enrollment
 */
export const createEnrollmentController = async (req, res) => {
  try {
    const result = await createEnrollment(req.body, req.user);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Enrollment created successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in createEnrollmentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/enrollments/:id
 * Update enrollment
 */
export const updateEnrollmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateEnrollment(parseInt(id), req.body, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Enrollment updated successfully'
      });
    } else {
      if (result.error.includes('not found')) {
        res.status(404).json({
          success: false,
          error: result.error
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    }
    
  } catch (error) {
    console.error('Error in updateEnrollmentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/enrollments/:id
 * Delete enrollment
 */
export const deleteEnrollmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteEnrollment(parseInt(id), req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Enrollment deleted successfully'
      });
    } else {
      if (result.error.includes('not found')) {
        res.status(404).json({
          success: false,
          error: result.error
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    }
    
  } catch (error) {
    console.error('Error in deleteEnrollmentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/enrollments/student/:studentId
 * Get enrollments by student ID
 */
export const getEnrollmentsByStudentController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await applyListScope(req, await getEnrollmentsByStudent(parseInt(studentId), req.query, req.user), 'enrollment');
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getEnrollmentsByStudentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/enrollments/class/:classId
 * Get enrollments by class ID
 */
export const getEnrollmentsByClassController = async (req, res) => {
  try {
    const { classId } = req.params;
    const result = await applyListScope(req, await getEnrollmentsByClass(parseInt(classId), req.query, req.user), 'enrollment');
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getEnrollmentsByClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/enrollments/students-by-class
 * Get students by class ID (returns user data for enrolled students)
 */
export const getStudentsByClassController = async (req, res) => {
  try {
    const { classId } = req.query;
    const result = await applyListScope(req, await getEnrollmentsByClass(
      classId ? parseInt(classId) : null,
      { ...req.query },
      req.user
    ), 'enrollment');

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getStudentsByClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/enrollments/program/:programId
 * Get enrollments by program ID
 */
export const getEnrollmentsByProgramController = async (req, res) => {
  try {
    const { programId } = req.params;
    const result = await applyListScope(req, await getEnrollmentsByProgram(parseInt(programId), req.query, req.user), 'enrollment');
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getEnrollmentsByProgramController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
