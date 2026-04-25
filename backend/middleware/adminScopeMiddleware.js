/**
 * Admin Scope Middleware
 * 
 * PURPOSE: Middleware to check if user has admin scope for specific resources
 * ARCHITECTURE: Routes → Admin Scope Middleware → Controller
 * 
 * This middleware enforces role-based access control based on admin scopes:
 * - PROGRAM scope: User can manage all resources within a program
 * - CLASSROOM scope: User can manage resources in specific classrooms
 * - INSTRUCTOR scope: User can manage resources for specific instructors
 * 
 * SUPER_ADMIN and HR roles bypass scope checks.
 */

import { checkUserAdminScope, getUserEffectiveScope } from '../db/admin-scopes-postgres.js';

/**
 * Check if user has SUPER_ADMIN or HR role (bypass scope check)
 * 
 * @param {Object} user - User object from request
 * @returns {boolean} - True if user has bypass role
 */
const hasBypassRole = (user) => {
  if (!user || !user.roles) return false;
  
  const bypassRoles = ['SUPER_ADMIN', 'HR'];
  return user.roles.some(role => bypassRoles.includes(role));
};

/**
 * Middleware to check if user has admin scope for a program
 * 
 * @param {boolean} optional - If true, scope check is optional (allow access if no scopes defined)
 */
export const requireProgramScope = (optional = false) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Bypass for SUPER_ADMIN and HR
      if (hasBypassRole(user)) {
        return next();
      }
      
      // Get programId from request params, query, or body
      const programId = req.params.programId || req.query.programId || req.body.programId;
      
      if (!programId) {
        return res.status(400).json({
          success: false,
          error: 'Program ID is required'
        });
      }
      
      // Get user's database ID
      const userId = user.id || user.sub;
      
      // Check if user has PROGRAM scope for this program
      const hasScope = await checkUserAdminScope(userId, 'PROGRAM', programId);
      
      if (!hasScope) {
        // If optional and user has no scopes at all, allow access
        if (optional) {
          const effectiveScope = await getUserEffectiveScope(userId);
          if (effectiveScope.success && effectiveScope.data.scopes.length === 0) {
            return next();
          }
        }
        
        return res.status(403).json({
          success: false,
          error: 'You do not have admin scope for this program',
          code: 'INSUFFICIENT_SCOPE'
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in requireProgramScope middleware:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to check if user has admin scope for a classroom
 * 
 * @param {boolean} optional - If true, scope check is optional
 */
export const requireClassroomScope = (optional = false) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Bypass for SUPER_ADMIN and HR
      if (hasBypassRole(user)) {
        return next();
      }
      
      const classroomId = req.params.classroomId || req.query.classroomId || req.body.classroomId;
      
      if (!classroomId) {
        return res.status(400).json({
          success: false,
          error: 'Classroom ID is required'
        });
      }
      
      const userId = user.id || user.sub;
      
      // Check if user has CLASSROOM scope for this classroom
      const hasScope = await checkUserAdminScope(userId, 'CLASSROOM', null, classroomId);
      
      if (!hasScope) {
        if (optional) {
          const effectiveScope = await getUserEffectiveScope(userId);
          if (effectiveScope.success && effectiveScope.data.scopes.length === 0) {
            return next();
          }
        }
        
        return res.status(403).json({
          success: false,
          error: 'You do not have admin scope for this classroom',
          code: 'INSUFFICIENT_SCOPE'
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in requireClassroomScope middleware:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to check if user has admin scope for an instructor
 * 
 * @param {boolean} optional - If true, scope check is optional
 */
export const requireInstructorScope = (optional = false) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Bypass for SUPER_ADMIN and HR
      if (hasBypassRole(user)) {
        return next();
      }
      
      const instructorUserId = req.params.instructorUserId || req.query.instructorUserId || req.body.instructorUserId;
      
      if (!instructorUserId) {
        return res.status(400).json({
          success: false,
          error: 'Instructor user ID is required'
        });
      }
      
      const userId = user.id || user.sub;
      
      // Check if user has INSTRUCTOR scope for this instructor
      const hasScope = await checkUserAdminScope(userId, 'INSTRUCTOR', null, null, instructorUserId);
      
      if (!hasScope) {
        if (optional) {
          const effectiveScope = await getUserEffectiveScope(userId);
          if (effectiveScope.success && effectiveScope.data.scopes.length === 0) {
            return next();
          }
        }
        
        return res.status(403).json({
          success: false,
          error: 'You do not have admin scope for this instructor',
          code: 'INSUFFICIENT_SCOPE'
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in requireInstructorScope middleware:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to check if user has admin scope for any of the specified resources
 * This is used for operations that may involve multiple resource types
 * 
 * @param {Object} options - Options for scope checking
 * @param {boolean} options.requireProgram - Check program scope
 * @param {boolean} options.requireClassroom - Check classroom scope
 * @param {boolean} options.requireInstructor - Check instructor scope
 * @param {boolean} options.optional - If true, scope check is optional
 */
export const requireAnyScope = (options = {}) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Bypass for SUPER_ADMIN and HR
      if (hasBypassRole(user)) {
        return next();
      }
      
      const { requireProgram = false, requireClassroom = false, requireInstructor = false, optional = false } = options;
      
      const userId = user.id || user.sub;
      
      // Get user's effective scope
      const effectiveScope = await getUserEffectiveScope(userId);
      
      if (!effectiveScope.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to verify admin scope'
        });
      }
      
      const { programIds, classroomIds, instructorUserIds, scopes } = effectiveScope.data;
      
      // If optional and user has no scopes, allow access
      if (optional && scopes.length === 0) {
        return next();
      }
      
      // Check if user has any scope at all
      if (scopes.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'You do not have any admin scopes configured',
          code: 'NO_SCOPE'
        });
      }
      
      // If no specific requirements, having any scope is sufficient
      if (!requireProgram && !requireClassroom && !requireInstructor) {
        return next();
      }
      
      // Check specific requirements
      let hasRequiredScope = false;
      
      if (requireProgram && programIds.length > 0) {
        const programId = req.params.programId || req.query.programId || req.body.programId;
        if (programId && programIds.includes(parseInt(programId))) {
          hasRequiredScope = true;
        }
      }
      
      if (requireClassroom && classroomIds.length > 0) {
        const classroomId = req.params.classroomId || req.query.classroomId || req.body.classroomId;
        if (classroomId && classroomIds.includes(parseInt(classroomId))) {
          hasRequiredScope = true;
        }
      }
      
      if (requireInstructor && instructorUserIds.length > 0) {
        const instructorUserId = req.params.instructorUserId || req.query.instructorUserId || req.body.instructorUserId;
        if (instructorUserId && instructorUserIds.includes(parseInt(instructorUserId))) {
          hasRequiredScope = true;
        }
      }
      
      if (!hasRequiredScope) {
        return res.status(403).json({
          success: false,
          error: 'You do not have the required admin scope for this operation',
          code: 'INSUFFICIENT_SCOPE'
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in requireAnyScope middleware:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to attach user's effective scope to request object
 * This allows controllers to access the user's scope for filtering data
 */
export const attachUserScope = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Bypass for SUPER_ADMIN and HR (they get full access)
    if (hasBypassRole(user)) {
      req.userScope = {
        isFullAccess: true,
        programIds: [],
        classroomIds: [],
        instructorUserIds: []
      };
      return next();
    }
    
    const userId = user.id || user.sub;
    const effectiveScope = await getUserEffectiveScope(userId);
    
    if (effectiveScope.success) {
      req.userScope = {
        isFullAccess: false,
        ...effectiveScope.data
      };
    } else {
      req.userScope = {
        isFullAccess: false,
        programIds: [],
        classroomIds: [],
        instructorUserIds: [],
        scopes: []
      };
    }
    
    next();
  } catch (error) {
    console.error('Error in attachUserScope middleware:', error);
    req.userScope = {
      isFullAccess: false,
      programIds: [],
      classroomIds: [],
      instructorUserIds: [],
      scopes: []
    };
    next();
  }
};
