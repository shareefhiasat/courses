/**
 * Usage Examples for Simplified Audit Types
 */

import { auditHelpers, WithAudit, WithAuditAndUser } from './audit';

// Example 1: Creating a new record with audit fields
const userId = 123;

const newProgramData = {
  code: 'CS101',
  nameEn: 'Computer Science 101',
  // ... other fields
  ...auditHelpers.create(userId) // Adds createdBy and updatedBy
};

// Example 2: Updating a record with audit fields
const updateData = {
  nameEn: 'Computer Science Fundamentals',
  ...auditHelpers.update(userId) // Only updates updatedBy
};

// Example 3: Type usage with Prisma models
type ProgramWithAudit = WithAudit<{
  id: number;
  code: string;
  nameEn: string;
}>;

type ProgramWithAuditAndUser = WithAuditAndUser<{
  id: number;
  code: string;
  nameEn: string;
}>;

// Example 4: Checking if object has audit fields
function processRecord(record: any) {
  if (auditHelpers.hasAuditFields(record)) {
    // TypeScript knows record has audit fields
    const auditInfo = auditHelpers.formatAuditInfo(record);
    console.log(`Created by ${auditInfo.createdBy} at ${auditInfo.created}`);
  }
}

// Example 5: Using in API responses
interface ApiResponse<T> {
  data: T[];
  total: number;
  success: boolean;
}

// Usage with audit fields
const programsResponse: ApiResponse<ProgramWithAudit> = {
  data: [],
  total: 0,
  success: false
};
