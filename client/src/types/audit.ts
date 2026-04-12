/**
 * Unified Audit Field Types for Prisma Models
 * 
 * Simplified audit types with minimal duplication for all models
 */

// Base audit fields interface
export interface AuditFields {
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Audit fields with user relationships
export interface AuditFieldsWithUser extends AuditFields {
  creator?: {
    id: number;
    displayName?: string | null;
    email: string;
  } | null;
  updater?: {
    id: number;
    displayName?: string | null;
    email: string;
  } | null;
}

// Helper functions for audit operations
export const auditHelpers = {
  // Create audit input for new records
  create: (userId: number) => ({
    createdBy: userId,
    updatedBy: userId
  }),

  // Create audit input for updates
  update: (userId: number) => ({
    updatedBy: userId
  }),

  // Check if object has audit fields
  hasAuditFields: (obj: any): obj is AuditFields => 
    obj && 
    typeof obj.createdAt === 'object' &&
    typeof obj.updatedAt === 'object' &&
    (obj.createdBy === undefined || typeof obj.createdBy === 'number') &&
    (obj.updatedBy === undefined || typeof obj.updatedBy === 'number'),

  // Format audit information for display
  formatAuditInfo: (record: AuditFieldsWithUser) => {
    const creator = record.creator?.displayName || record.creator?.email || 'Unknown';
    const updater = record.updater?.displayName || record.updater?.email || 'Unknown';
    
    return {
      created: new Date(record.createdAt).toLocaleString(),
      updated: new Date(record.updatedAt).toLocaleString(),
      createdBy: creator,
      updatedBy: updater
    };
  }
} as const;

// Type helpers
export type WithAudit<T> = T & AuditFields;
export type WithAuditAndUser<T> = T & AuditFieldsWithUser;
