/**
 * SLA (Service Level Agreement) Utilities
 * 
 * PURPOSE: Calculate SLA status and color coding for workflow documents
 * SLA THRESHOLD: 72 hours (3 days) for document review
 * COLOR CODING:
 *   - Green: < 24 hours (within first day)
 *   - Yellow: 24-48 hours (1-2 days)
 *   - Orange: 48-72 hours (2-3 days)
 *   - Red: > 72 hours (overdue)
 */

/**
 * Calculate hours elapsed since submission
 * @param {string|Date} submittedAt - Submission timestamp
 * @returns {number} Hours elapsed
 */
export const calculateHoursElapsed = (submittedAt) => {
  if (!submittedAt) return 0;
  
  const submitted = new Date(submittedAt);
  const now = new Date();
  const elapsedMs = now - submitted;
  return elapsedMs / (1000 * 60 * 60); // Convert to hours
};

/**
 * Get SLA status based on hours elapsed
 * @param {number} hoursElapsed - Hours elapsed since submission
 * @returns {string} SLA status: 'green', 'yellow', 'orange', 'red'
 */
export const getSlaStatus = (hoursElapsed) => {
  if (hoursElapsed < 24) return 'green';
  if (hoursElapsed < 48) return 'yellow';
  if (hoursElapsed < 72) return 'orange';
  return 'red';
};

/**
 * Get SLA status for a document based on submittedAt
 * @param {string|Date} submittedAt - Submission timestamp
 * @returns {string} SLA status: 'green', 'yellow', 'orange', 'red'
 */
export const getSlaStatusFromTimestamp = (submittedAt) => {
  const hoursElapsed = calculateHoursElapsed(submittedAt);
  return getSlaStatus(hoursElapsed);
};

/**
 * Get badge variant for SLA status
 * @param {string} slaStatus - SLA status from getSlaStatus
 * @returns {string} Badge variant: 'success', 'warning', 'secondary', 'destructive'
 */
export const getSlaBadgeVariant = (slaStatus) => {
  switch (slaStatus) {
    case 'green':
      return 'success';
    case 'yellow':
      return 'warning';
    case 'orange':
      return 'secondary';
    case 'red':
      return 'destructive';
    default:
      return 'secondary';
  }
};

/**
 * Get time elapsed in human-readable format
 * @param {string|Date} submittedAt - Submission timestamp
 * @returns {string} Time elapsed (e.g., "2 hours ago", "1 day ago")
 */
export const getTimeElapsed = (submittedAt) => {
  if (!submittedAt) return 'N/A';
  
  const submitted = new Date(submittedAt);
  const now = new Date();
  const elapsedMs = now - submitted;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedDays = Math.floor(elapsedHours / 24);
  
  if (elapsedDays > 0) {
    return `${elapsedDays} day${elapsedDays > 1 ? 's' : ''} ago`;
  }
  if (elapsedHours > 0) {
    return `${elapsedHours} hour${elapsedHours > 1 ? 's' : ''} ago`;
  }
  if (elapsedMinutes > 0) {
    return `${elapsedMinutes} minute${elapsedMinutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
};

/**
 * Get SLA info object for a document
 * @param {string|Date} submittedAt - Submission timestamp
 * @returns {Object} SLA info with status, variant, hoursElapsed, timeElapsed, hoursRemaining
 */
export const getSlaInfo = (submittedAt) => {
  const hoursElapsed = calculateHoursElapsed(submittedAt);
  const slaStatus = getSlaStatus(hoursElapsed);
  const badgeVariant = getSlaBadgeVariant(slaStatus);
  const timeElapsed = getTimeElapsed(submittedAt);
  const hoursRemaining = Math.max(0, 72 - hoursElapsed); // SLA is 72 hours
  
  return {
    hoursElapsed,
    hoursRemaining,
    slaStatus,
    badgeVariant,
    timeElapsed,
    isOverdue: slaStatus === 'red'
  };
};

/**
 * Sort documents by SLA urgency (overdue first, then by hours elapsed)
 * @param {Array} documents - Array of workflow documents
 * @returns {Array} Sorted documents
 */
export const sortBySlaUrgency = (documents) => {
  return [...documents].sort((a, b) => {
    const hoursA = calculateHoursElapsed(a.submittedAt);
    const hoursB = calculateHoursElapsed(b.submittedAt);
    
    // Sort by hours elapsed (descending - oldest first)
    return hoursB - hoursA;
  });
};

export default {
  calculateHoursElapsed,
  getSlaStatus,
  getSlaStatusFromTimestamp,
  getSlaBadgeVariant,
  getTimeElapsed,
  getSlaInfo,
  sortBySlaUrgency
};
