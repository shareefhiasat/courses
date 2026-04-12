/**
 * Prisma Error Codes and Constants
 * 
 * Reference: https://www.prisma.io/docs/reference/api-reference/error-reference
 */

// Common Prisma Error Codes
export const PRISMA_ERRORS = {
  // Record not found
  RECORD_NOT_FOUND: 'P2025',
  
  // Unique constraint failed
  UNIQUE_CONSTRAINT_FAILED: 'P2002',
  
  // Foreign key constraint failed  
  FOREIGN_KEY_CONSTRAINT_FAILED: 'P2003',
  
  // Null constraint failed
  NULL_CONSTRAINT_FAILED: 'P2014',
  
  // Database connection errors
  CONNECTION_FAILED: 'P1001',
  DATABASE_UNREACHABLE: 'P1002',
  
  // Query interpretation errors
  QUERY_INTERPRETATION_ERROR: 'P2005',
  INVALID_QUERY_VALUE: 'P2006',
  INVALID_INPUT_VALUE: 'P2008',
  INVALID_WHERE_VALUE: 'P2010',
  
  // Transaction errors
  TRANSACTION_START_FAILED: 'P2024',
  TRANSACTION_ROLLBACK_FAILED: 'P2027'
};

// User-friendly error messages
export const ERROR_MESSAGES = {
  [PRISMA_ERRORS.RECORD_NOT_FOUND]: 'Record not found',
  [PRISMA_ERRORS.UNIQUE_CONSTRAINT_FAILED]: 'A record with this value already exists',
  [PRISMA_ERRORS.FOREIGN_KEY_CONSTRAINT_FAILED]: 'Referenced record does not exist',
  [PRISMA_ERRORS.NULL_CONSTRAINT_FAILED]: 'Required field cannot be empty',
  [PRISMA_ERRORS.CONNECTION_FAILED]: 'Database connection failed',
  [PRISMA_ERRORS.DATABASE_UNREACHABLE]: 'Database is unreachable',
  [PRISMA_ERRORS.QUERY_INTERPRETATION_ERROR]: 'Invalid query format',
  [PRISMA_ERRORS.INVALID_QUERY_VALUE]: 'Invalid query parameter value',
  [PRISMA_ERRORS.INVALID_INPUT_VALUE]: 'Invalid input value',
  [PRISMA_ERRORS.INVALID_WHERE_VALUE]: 'Invalid filter value',
  [PRISMA_ERRORS.TRANSACTION_START_FAILED]: 'Failed to start transaction',
  [PRISMA_ERRORS.TRANSACTION_ROLLBACK_FAILED]: 'Failed to rollback transaction'
};

// Helper function to get user-friendly error message
export function getPrismaErrorMessage(error) {
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  
  // Fallback to error message or generic message
  return error.message || 'An unexpected error occurred';
}

// Helper function to check if error is a specific Prisma error
export function isPrismaError(error, errorCode) {
  return error.code === errorCode;
}
