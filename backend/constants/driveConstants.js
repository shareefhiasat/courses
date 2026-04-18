/**
 * Drive System Constants
 * Centralized constants for bucket mappings and drive-related configurations
 */

/**
 * Map frontend bucket names to Prisma BucketType enum values
 * @param {string} bucket - Frontend bucket name (e.g., 'lms-shared')
 * @returns {string} - Prisma BucketType enum value (e.g., 'SHARED')
 */
export function mapBucketName(bucket) {
  const bucketMapping = {
    'lms-shared': 'SHARED',
    'lms-private': 'PRIVATE', 
    'lms-workflow': 'WORKFLOW'
  };
  
  return bucketMapping[bucket] || bucket;
}

/**
 * Drive bucket types
 */
export const DRIVE_BUCKETS = {
  SHARED: 'lms-shared',
  PRIVATE: 'lms-private',
  WORKFLOW: 'lms-workflow'
};

/**
 * Prisma BucketType enum values
 */
export const BUCKET_TYPES = {
  SHARED: 'SHARED',
  PRIVATE: 'PRIVATE',
  WORKFLOW: 'WORKFLOW'
};
