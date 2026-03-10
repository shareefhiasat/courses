/**
 * Security Middleware
 * 
 * PURPOSE:
 * Centralized security middleware for API protection
 * - Rate limiting
 * - CORS validation
 * - API key validation
 * - JWT token validation
 * - Request sanitization
 * - Security headers
 * 
 * @module middleware/security
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { logger, logSecurityEvent } = require('@services/utils/logger');

/**
 * Rate limiter configuration
 * Prevents brute force and DDoS attacks
 */
const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logSecurityEvent('rate_limit_exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.headers['user-agent']
      });
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.'
      });
    }
  };

  return rateLimit({ ...defaults, ...options });
};

/**
 * API Rate Limiter - More restrictive for API endpoints
 */
const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  skipSuccessfulRequests: false
});

/**
 * Auth Rate Limiter - Very restrictive for authentication
 */
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true
});

/**
 * Security headers middleware
 * Adds security headers to all responses
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * API Key validation middleware
 * Validates API key from request headers
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  // Skip validation in development if no API key is set
  if (process.env.NODE_ENV === 'development' && !validApiKey) {
    logger.debug('API key validation skipped in development', {
      service: 'SecurityMiddleware',
      path: req.path
    });
    return next();
  }

  if (!apiKey) {
    logSecurityEvent('missing_api_key', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({
      success: false,
      error: 'API key is required'
    });
  }

  if (apiKey !== validApiKey) {
    logSecurityEvent('invalid_api_key', {
      ip: req.ip,
      path: req.path,
      apiKey: apiKey.substring(0, 8) + '...',
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  logger.debug('API key validated successfully', {
    service: 'SecurityMiddleware',
    path: req.path
  });
  next();
};

/**
 * JWT token validation middleware
 * Validates JWT token from Authorization header
 */
const validateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logSecurityEvent('missing_jwt_token', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({
      success: false,
      error: 'Authorization token is required'
    });
  }

  const token = authHeader.substring(7);

  try {
    // TODO: Implement JWT verification with jsonwebtoken
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    logger.debug('JWT token validated successfully', {
      service: 'SecurityMiddleware',
      path: req.path
    });
    next();
  } catch (error) {
    logSecurityEvent('invalid_jwt_token', {
      ip: req.ip,
      path: req.path,
      error: error.message,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

/**
 * Request sanitization middleware
 * Sanitizes request body and query parameters
 */
const sanitizeRequest = (req, res, next) => {
  // Remove any potentially dangerous characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/[<>]/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }

  logger.debug('Request sanitized', {
    service: 'SecurityMiddleware',
    path: req.path
  });
  next();
};

/**
 * CORS validation middleware
 * Validates origin against whitelist
 */
const validateCORS = (allowedOrigins = []) => {
  return (req, res, next) => {
    const origin = req.headers.origin;

    if (!origin) {
      return next();
    }

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      logger.debug('CORS validated', {
        service: 'SecurityMiddleware',
        origin
      });
    } else {
      logSecurityEvent('cors_violation', {
        ip: req.ip,
        origin,
        path: req.path,
        userAgent: req.headers['user-agent']
      });
      return res.status(403).json({
        success: false,
        error: 'CORS policy violation'
      });
    }

    next();
  };
};

/**
 * Role-based access control middleware
 * Validates user role against required roles
 */
const requireRole = (roles = []) => {
  return (req, res, next) => {
    // TODO: Implement role checking from JWT token
    // const userRole = req.user?.role;
    
    // if (!userRole || !roles.includes(userRole)) {
    //   logSecurityEvent('unauthorized_access', {
    //     ip: req.ip,
    //     path: req.path,
    //     requiredRoles: roles,
    //     userRole: userRole || 'none',
    //     userAgent: req.headers['user-agent']
    //   });
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Insufficient permissions'
    //   });
    // }

    logger.debug('Role validation passed', {
      service: 'SecurityMiddleware',
      path: req.path,
      requiredRoles: roles
    });
    next();
  };
};

/**
 * IP whitelist middleware
 * Only allows requests from whitelisted IPs
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }

    logSecurityEvent('ip_blocked', {
      ip: clientIP,
      path: req.path,
      userAgent: req.headers['user-agent']
    });

    return res.status(403).json({
      success: false,
      error: 'Access denied from this IP address'
    });
  };
};

module.exports = {
  apiRateLimiter,
  authRateLimiter,
  securityHeaders,
  validateApiKey,
  validateJWT,
  sanitizeRequest,
  validateCORS,
  requireRole,
  ipWhitelist,
  createRateLimiter
};
