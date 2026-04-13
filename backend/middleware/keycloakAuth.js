/**
 * Keycloak Authentication Middleware
 * 
 * PURPOSE: Verify Keycloak JWT tokens and check user roles
 * ARCHITECTURE: Middleware → Controller → Service
 */

import jwt from 'jsonwebtoken';
import { LMS_ROLES as ROLES } from '../services/keycloakAdminService.js';

/**
 * Verify Keycloak JWT token
 * @param {string} token - JWT token from Authorization header
 * @returns {Promise<Object>} Decoded token payload
 */
const verifyToken = async (token) => {
  try {
    // Simple JWT decode without verification for development
    // In production, you should verify the token signature
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      throw new Error('Invalid token');
    }
    
    // Check token expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw new Error('Invalid token');
  }
};

/**
 * Extract token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Check if user has required role
 * @param {Object} token - Decoded JWT token
 * @param {string[]} requiredRoles - Required roles
 * @returns {boolean} Whether user has required role
 */
const hasRequiredRole = (token, requiredRoles) => {
  const userRoles = [];
  
  // Extract roles from realm_access
  if (token.realm_access && token.realm_access.roles) {
    userRoles.push(...token.realm_access.roles);
  }
  
  // Extract roles from client_access
  if (token.resource_access) {
    Object.values(token.resource_access).forEach(client => {
      if (client.roles) {
        userRoles.push(...client.roles);
      }
    });
  }
  
  // Normalize role names to match LMS canonical roles
  const normalizedRoles = userRoles.map(role => {
    const lowerRole = role.toLowerCase();
    // Handle common Keycloak role format variations
    if (lowerRole === 'super-admin' || lowerRole === 'superadmin') return ROLES.SUPER_ADMIN;
    return lowerRole;
  });
  
  // Check if user has any of the required roles
  return requiredRoles.some(role => normalizedRoles.includes(role));
};

/**
 * Keycloak authentication middleware
 * @param {string[]} requiredRoles - Required roles to access the endpoint
 * @returns {Function} Express middleware function
 */
export const keycloakAuth = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      // Extract token
      const token = extractToken(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }
      
      // Verify token
      const decoded = await verifyToken(token);
      
      // Check if user has required role
      if (requiredRoles.length > 0 && !hasRequiredRole(decoded, requiredRoles)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }
      
      // Extract all roles from token
      const userRoles = [];
      
      // Extract roles from realm_access
      if (decoded.realm_access && decoded.realm_access.roles) {
        userRoles.push(...decoded.realm_access.roles);
      }
      
      // Extract roles from client_access
      if (decoded.resource_access) {
        Object.values(decoded.resource_access).forEach(client => {
          if (client.roles) {
            userRoles.push(...client.roles);
          }
        });
      }
      
      // Normalize role names
      const normalizedRoles = userRoles.map(role => {
        if (role === 'super-admin' || role === 'superadmin') return LMS_ROLES.SUPER_ADMIN;
        return role.toLowerCase();
      });
      
      // Add user info to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        roles: normalizedRoles,
        isAdmin: hasRequiredRole(decoded, [ROLES.SUPER_ADMIN, ROLES.ADMIN])
      };
      
      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  };
};

/**
 * Middleware for super admin only endpoints
 */
export const requireSuperAdmin = keycloakAuth([ROLES.SUPER_ADMIN]);

/**
 * Middleware for admin or super admin endpoints
 */
export const requireAdmin = keycloakAuth([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

/**
 * Middleware for any authenticated user
 */
export const requireAuth = keycloakAuth([]);

export default {
  keycloakAuth,
  requireSuperAdmin,
  requireAdmin,
  requireAuth
};
