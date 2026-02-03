/**
 * Validation Helper Functions
 * Provides utilities for data validation and error handling
 */

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string[]} errors - Array of error messages
 * @property {string[]} warnings - Array of warning messages
 */

/**
 * Create validation result
 * @param {boolean} isValid - Whether validation passed
 * @param {string[]} errors - Array of error messages
 * @param {string[]} warnings - Array of warning messages
 * @returns {ValidationResult} Validation result object
 */
export const createValidationResult = (isValid = true, errors = [], warnings = []) => ({
  isValid,
  errors: Array.isArray(errors) ? errors : [errors],
  warnings: Array.isArray(warnings) ? warnings : [warnings]
});

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {ValidationResult} Validation result
 */
export const validateRequiredFields = (data, requiredFields) => {
  const errors = [];
  const warnings = [];
  
  requiredFields.forEach(field => {
    const value = data[field];
    
    if (value === null || value === undefined || value === '') {
      errors.push(`${field} is required`);
    }
  });
  
  return createValidationResult(errors.length === 0, errors, warnings);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {ValidationResult} Validation result
 */
export const validateEmail = (email) => {
  const errors = [];
  const warnings = [];
  
  if (!email) {
    errors.push('Email is required');
    return createValidationResult(false, errors, warnings);
  }
  
  if (typeof email !== 'string') {
    errors.push('Email must be a string');
    return createValidationResult(false, errors, warnings);
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }
  
  if (email.length > 254) {
    warnings.push('Email is very long');
  }
  
  return createValidationResult(errors.length === 0, errors, warnings);
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {ValidationResult} Validation result
 */
export const validatePhone = (phone) => {
  const errors = [];
  const warnings = [];
  
  if (!phone) {
    return createValidationResult(true, errors, warnings); // Phone is optional
  }
  
  if (typeof phone !== 'string') {
    errors.push('Phone must be a string');
    return createValidationResult(false, errors, warnings);
  }
  
  // Remove common phone formatting
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
    errors.push('Invalid phone number format');
  }
  
  return createValidationResult(errors.length === 0, errors, warnings);
};

/**
 * Validate student ID
 * @param {string} studentId - Student ID to validate
 * @returns {ValidationResult} Validation result
 */
export const validateStudentId = (studentId) => {
  const errors = [];
  const warnings = [];
  
  if (!studentId) {
    errors.push('Student ID is required');
    return createValidationResult(false, errors, warnings);
  }
  
  if (typeof studentId !== 'string') {
    errors.push('Student ID must be a string');
    return createValidationResult(false, errors, warnings);
  }
  
  // Common student ID patterns (adjust based on your requirements)
  const studentIdRegex = /^[A-Z0-9]{4,20}$/i;
  if (!studentIdRegex.test(studentId)) {
    errors.push('Student ID must be 4-20 alphanumeric characters');
  }
  
  return createValidationResult(errors.length === 0, errors, warnings);
};

/**
 * Validate date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {ValidationResult} Validation result
 */
export const validateDateRange = (startDate, endDate) => {
  const errors = [];
  const warnings = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) {
    errors.push('Invalid start date');
  }
  
  if (isNaN(end.getTime())) {
    errors.push('Invalid end date');
  }
  
  if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
    errors.push('Start date must be before end date');
  }
  
  return createValidationResult(errors.length === 0, errors, warnings);
};

/**
 * Validate points value
 * @param {number} points - Points to validate
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation result
 */
export const validatePoints = (points, options = {}) => {
  const { min = -100, max = 100, allowZero = true } = options;
  const errors = [];
  const warnings = [];
  
  if (points === null || points === undefined) {
    errors.push('Points is required');
    return createValidationResult(false, errors, warnings);
  }
  
  const numPoints = Number(points);
  
  if (isNaN(numPoints)) {
    errors.push('Points must be a number');
    return createValidationResult(false, errors, warnings);
  }
  
  if (!allowZero && numPoints === 0) {
    warnings.push('Points cannot be zero');
  }
  
  if (numPoints < min) {
    errors.push(`Points cannot be less than ${min}`);
  }
  
  if (numPoints > max) {
    errors.push(`Points cannot be more than ${max}`);
  }
  
  return createValidationResult(errors.length === 0, errors, warnings);
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {ValidationResult} Validation result
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  const errors = [];
  const warnings = [];
  
  if (!file) {
    errors.push('No file provided');
    return createValidationResult(false, errors, warnings);
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    errors.push(`File size cannot exceed ${maxSizeMB}MB`);
  }
  
  if (file.size === 0) {
    errors.push('File cannot be empty');
  }
  
  return createValidationResult(errors.length === 0, errors, warnings);
};

export default {
  createValidationResult,
  validateRequiredFields,
  validateEmail,
  validatePhone,
  validateStudentId,
  validateDateRange,
  validatePoints,
  validateFileSize
};
