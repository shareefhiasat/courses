/**
 * WOPI Service for Collabora Online integration
 * Handles access token generation and validation
 */

import jwt from 'jsonwebtoken';

const WOPI_SECRET = process.env.WOPI_SECRET || 'wopi-secret-change-in-production';
const TOKEN_EXPIRY = '1h'; // 1 hour

/**
 * Generate a WOPI access token for a user and file
 * @param {string} userId - User ID
 * @param {string} fileId - File ID
 * @param {string} permission - 'read' or 'write'
 * @param {object} userInfo - User information (displayName, email)
 * @returns {string} JWT access token
 */
export function generateWopiToken(userId, fileId, permission = 'write', userInfo = {}) {
  const payload = {
    userId,
    fileId,
    permission,
    type: 'wopi',
    userInfo: {
      displayName: userInfo.displayName || 'User',
      email: userInfo.email || '',
      id: userInfo.id || userId,
    },
  };

  return jwt.sign(payload, WOPI_SECRET, {
    expiresIn: TOKEN_EXPIRY,
    issuer: 'military-lms',
  });
}

/**
 * Verify and decode a WOPI access token
 * @param {string} token - JWT access token
 * @returns {object|null} Decoded token payload or null if invalid
 */
export function verifyWopiToken(token) {
  try {
    const decoded = jwt.verify(token, WOPI_SECRET, {
      issuer: 'military-lms',
    });

    if (decoded.type !== 'wopi') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('[wopiService] Token verification failed:', error.message);
    return null;
  }
}

/**
 * Extract access token from request query or header
 * @param {object} req - Express request object
 * @returns {string|null} Access token or null
 */
export function extractWopiToken(req) {
  // Check query parameter first (standard WOPI approach)
  if (req.query.access_token) {
    return req.query.access_token;
  }

  // Check Authorization header as fallback
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}
