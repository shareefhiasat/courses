/**
 * Keycloak Authentication Middleware
 * 
 * PURPOSE: Verify Keycloak JWT tokens and check user roles
 * ARCHITECTURE: Middleware → Controller → Service
 */

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { LMS_ROLES as ROLES } from '../services/keycloakAdminService.js';
import { getDatabaseUserId } from '../utils/database/userResolver.js';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'military-lms';
const KEYCLOAK_ISSUER = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;

// Cached JWKS client - fetches and caches Keycloak's public signing keys
const jwks = jwksClient({
  jwksUri: `${KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 10 * 60 * 1000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

/**
 * Resolve the RSA public key for a given JWT header (by `kid`)
 * @param {Object} header - Decoded JWT header
 * @returns {Promise<string>} PEM public key
 */
const getSigningKey = (header) => {
  return new Promise((resolve, reject) => {
    if (!header || !header.kid) {
      return reject(new Error('Token missing key id (kid)'));
    }
    jwks.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey());
    });
  });
};

/**
 * Verify Keycloak JWT token
 * Verifies the RS256 signature against Keycloak's published JWKS, and
 * validates issuer/expiration. Never trust a decoded-but-unverified token.
 * @param {string} token - JWT token from Authorization header
 * @returns {Promise<Object>} Decoded + verified token payload
 */
const verifyToken = async (token) => {
  try {
    const unverified = jwt.decode(token, { complete: true });
    if (!unverified || !unverified.header) {
      throw new Error('Invalid token');
    }

    const signingKey = await getSigningKey(unverified.header);

    const decoded = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      issuer: KEYCLOAK_ISSUER,
    });

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
 * Extract token from cookies
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
const extractTokenFromCookie = (req) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  return cookies['kc_token'] || null;
};

/**
 * Set token in cookie (for frontend to call after login)
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 */
export const setTokenCookie = (res, token) => {
  res.cookie('kc_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
};

/**
 * Clear token cookie
 * @param {Object} res - Express response object
 */
export const clearTokenCookie = (res) => {
  res.clearCookie('kc_token');
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
    console.log(`[keycloakAuth] ${req.method} ${req.originalUrl}`);
    try {
      // Extract token from header or cookie
      let token = extractToken(req);
      // Fallback to cookie for <img> tag support
      if (!token) {
        token = extractTokenFromCookie(req);
      }
      // NOTE: a `?token=` query-string fallback used to exist here for
      // <audio>/<img> tags. It was removed because it leaks bearer tokens
      // into server logs, browser history, and Referer headers, and no
      // current frontend code relies on it (media requests use the
      // Authorization header or the httpOnly `kc_token` cookie instead).
      if (!token) {
        console.log(`[keycloakAuth] No token found for ${req.originalUrl}`);
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
        if (role === 'super-admin' || role === 'superadmin' || role === 'super_admin') return ROLES.SUPER_ADMIN;
        return role.toLowerCase();
      });
      
      // Add user info to request
      req.user = {
        id: decoded.sub,                 // Keycloak UUID (legacy alias)
        keycloakId: decoded.sub,
        username: decoded.preferred_username,
        email: decoded.email,
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        displayName: decoded.name,
        roles: normalizedRoles,
        isAdmin: hasRequiredRole(decoded, [ROLES.SUPER_ADMIN, ROLES.ADMIN])
      };

      // Resolve local DB user id once per request. Failures don't block the
      // request (some endpoints like presence/status may be fine without it)
      // but `dbId` will be null and downstream code can decide how to react.
      try {
        req.user.dbId = await getDatabaseUserId(req.user);
      } catch (resolveErr) {
        console.warn('[keycloakAuth] could not resolve dbId for user', req.user.email, resolveErr?.message);
        req.user.dbId = null;
      }

      // Typed actor envelope for services that prefer it (new DMS code).
      req.actor = {
        userId: req.user.dbId,
        keycloakId: req.user.keycloakId,
        email: req.user.email,
        roles: req.user.roles,
        isAdmin: req.user.isAdmin,
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
