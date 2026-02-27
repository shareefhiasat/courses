import { getQatarTimestampString } from './qatarDate';

/**
 * Generates standardized audit fields for document creation.
 * Uses Qatari time strings and simple UID strings for audit trail.
 * 
 * @param {Object} user - The currently logged in user object (from auth or business layer)
 * @returns {Object} Audit fields to spread into new documents
 */
export const getCreateAuditData = (user) => {
  const timestampString = getQatarTimestampString();
  const userUid = user?.uid || 'system';
  
  return {
    createdAt: timestampString,
    updatedAt: timestampString,
    createdBy: userUid,
    updatedBy: userUid
  };
};

/**
 * Generates standardized audit fields for document updates.
 * 
 * @param {Object} user - The currently logged in user object
 * @returns {Object} Audit fields to spread into updated documents
 */
export const getUpdateAuditData = (user) => {
  return {
    updatedAt: getQatarTimestampString(),
    updatedBy: user?.uid || 'system'
  };
};
