/**
 * Centralized Backend Constants
 * 
 * PURPOSE: Single entry point for all backend constants
 * Improves maintainability and reduces import confusion
 */

// Error constants
export * from './activity-errors.js';
export * from './prisma-errors.js';

// Service-specific constants
export * from './driveConstants.js';
export * from './fileConstants.js';
export * from './attendanceConstants.js';
export * from './enrollmentConstants.js';
