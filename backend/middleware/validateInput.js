/**
 * Lightweight input validation middleware for Express routes.
 *
 * Usage:
 *   router.post('/users', validateBody({
 *     email: { type: 'string', required: true, format: 'email' },
 *     displayName: { type: 'string', required: true, maxLength: 200 },
 *     role: { type: 'string', required: true, enum: ['admin', 'hr', 'instructor', 'student'] },
 *   }), controller);
 *
 * Returns 400 with a descriptive error if validation fails.
 */

/**
 * @typedef {Object} FieldRule
 * @property {'string'|'number'|'boolean'|'array'|'object'} [type]
 * @property {boolean} [required]
 * @property {number} [maxLength]
 * @property {number} [minLength]
 * @property {number} [min]
 * @property {number} [max]
 * @property {string[]} [enum]
 * @property {'email'|'uuid'|'url'} [format]
 */

/**
 * Validate a single field value against a rule.
 * @param {*} value
 * @param {FieldRule} rule
 * @param {string} fieldName
 * @returns {string|null} Error message or null if valid
 */
function validateField(value, rule, fieldName) {
  if (value === undefined || value === null || value === '') {
    return rule.required ? `${fieldName} is required` : null;
  }

  if (rule.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (rule.type === 'number' && actualType === 'string' && !isNaN(Number(value))) {
      // accept numeric strings
    } else if (actualType !== rule.type) {
      return `${fieldName} must be a ${rule.type}`;
    }
  }

  if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
    return `${fieldName} must be at most ${rule.maxLength} characters`;
  }

  if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
    return `${fieldName} must be at least ${rule.minLength} characters`;
  }

  if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
    return `${fieldName} must be at least ${rule.min}`;
  }

  if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
    return `${fieldName} must be at most ${rule.max}`;
  }

  if (rule.enum && !rule.enum.includes(value)) {
    return `${fieldName} must be one of: ${rule.enum.join(', ')}`;
  }

  if (rule.format === 'email') {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof value === 'string' && !emailRe.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
  }

  if (rule.format === 'uuid') {
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof value === 'string' && !uuidRe.test(value)) {
      return `${fieldName} must be a valid UUID`;
    }
  }

  if (rule.format === 'url') {
    try {
      new URL(value);
    } catch {
      return `${fieldName} must be a valid URL`;
    }
  }

  return null;
}

/**
 * Create an Express middleware that validates req.body against a schema.
 * @param {Record<string, FieldRule>} schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rule] of Object.entries(schema)) {
      const err = validateField(req.body?.[field], rule, field);
      if (err) errors.push(err);
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }
    next();
  };
}

/**
 * Create an Express middleware that validates req.params against a schema.
 * @param {Record<string, FieldRule>} schema
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rule] of Object.entries(schema)) {
      const err = validateField(req.params?.[field], rule, field);
      if (err) errors.push(err);
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }
    next();
  };
}

export default { validateBody, validateParams };
