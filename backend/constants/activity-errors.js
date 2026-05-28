/**
 * File Activity Error Codes
 * 
 * Standardized error codes for file activity operations
 */

export const ACTIVITY_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  ACCESS_DENIED: 'ACCESS_DENIED',
  GET_ACTIVITIES_FAILED: 'GET_ACTIVITIES_FAILED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
};

export const ACTIVITY_ERROR_MESSAGES = {
  [ACTIVITY_ERROR_CODES.UNAUTHORIZED]: 'User not authenticated',
  [ACTIVITY_ERROR_CODES.FILE_NOT_FOUND]: 'File not found',
  [ACTIVITY_ERROR_CODES.ACCESS_DENIED]: 'You do not have access to this file',
  [ACTIVITY_ERROR_CODES.GET_ACTIVITIES_FAILED]: 'Failed to get file activities',
  [ACTIVITY_ERROR_CODES.USER_NOT_FOUND]: 'User not found',
};
