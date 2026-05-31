# Story 1.1: Database Schema for Workflow Documents

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system,
I want a database schema to store workflow documents, comments, and status history,
so that the workflow system can persist and track all attendance document submissions.

## Acceptance Criteria

1. **Given** the Prisma schema exists
   **When** I add WorkflowDocument, WorkflowComment, and WorkflowStatusHistory models
   **Then** the models are created with all required fields (id, workflowType, title, description, status, fileId, submitterId, currentAssigneeId, classId, instructorId, date, program, subject, timestamps, auditFields)
   
2. **And** WorkflowComment has fields for workflowDocumentId, authorId, comment, action, createdAt
   
3. **And** WorkflowStatusHistory has fields for workflowDocumentId, fromStatus, toStatus, actorId, reason, createdAt
   
4. **And** all foreign key relationships are properly defined
   
5. **And** enums are created for WorkflowType (ATTENDANCE_DAILY, ATTENDANCE_WEEKLY, GENERAL) and WorkflowStatus (DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, AMENDED, CLOSED)
   
6. **And** Prisma db push successfully creates the tables

## Tasks / Subtasks

- [x] Add WorkflowType enum to schema (ATTENDANCE_DAILY, ATTENDANCE_WEEKLY, GENERAL) (AC: 5)
- [x] Add WorkflowDocumentStatus enum to schema (DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, AMENDED, CLOSED) (AC: 5)
  - [x] Note: Created separate WorkflowDocumentStatus enum to avoid breaking existing WorkflowStatus enum used by WorkflowInstance system
- [x] Create WorkflowDocument model with all required fields (AC: 1)
  - [x] id: Int @id @default(autoincrement())
  - [x] workflowType: WorkflowType
  - [x] title: String
  - [x] description: String?
  - [x] status: WorkflowDocumentStatus @default(DRAFT)
  - [x] fileId: String? (reference to File model from MinIO system - UUID type)
  - [x] submitterId: Int (reference to User)
  - [x] currentAssigneeId: Int? (reference to User)
  - [x] classId: Int? (reference to Class)
  - [x] instructorId: Int? (reference to User)
  - [x] date: DateTime?
  - [x] program: String?
  - [x] subject: String?
  - [x] reviewCycleCount: Int @default(0)
  - [x] createdBy: Int?
  - [x] updatedBy: Int?
  - [x] createdAt: DateTime @default(now())
  - [x] updatedAt: DateTime @updatedAt
  - [x] Add foreign key relations to User (submitter, currentAssignee, instructor), Class, and File
- [x] Create WorkflowComment model (AC: 2)
  - [x] id: Int @id @default(autoincrement())
  - [x] workflowDocumentId: Int
  - [x] authorId: Int (reference to User)
  - [x] comment: String
  - [x] action: String? (e.g., "APPROVED", "REJECTED", "AMENDED", "COMMENT")
  - [x] createdAt: DateTime @default(now())
  - [x] Add foreign key relations to WorkflowDocument and User
- [x] Create WorkflowStatusHistory model (AC: 3)
  - [x] id: Int @id @default(autoincrement())
  - [x] workflowDocumentId: Int
  - [x] fromStatus: WorkflowDocumentStatus?
  - [x] toStatus: WorkflowDocumentStatus
  - [x] actorId: Int (reference to User)
  - [x] reason: String?
  - [x] createdAt: DateTime @default(now())
  - [x] Add foreign key relations to WorkflowDocument and User
- [x] Run `npx prisma generate --schema=client/prisma/schema.prisma` to generate Prisma client (AC: 6)
- [x] Run `npx prisma db push --schema=client/prisma/schema.prisma` to create tables in database (AC: 6)
- [x] Verify tables created successfully in PostgreSQL (AC: 6)

### Review Findings

- [x] [Review][Patch] No database constraint to prevent negative reviewCycleCount [client/prisma/schema.prisma:1860] — deferred to application-level validation (Prisma doesn't support check constraints)
- [x] [Review][Patch] No check constraint to ensure fromStatus != toStatus in status history [client/prisma/schema.prisma:1900] — deferred to application-level validation (Prisma doesn't support check constraints)
- [x] [Review][Patch] Missing indexes for common query patterns (workflowType+status, date+status, program+subject) [client/prisma/schema.prisma:1874-1877] — applied composite indexes

## Dev Notes

### Architecture Patterns and Constraints

- **Prisma ORM**: Use Prisma 5.22 with PostgreSQL provider
- **Database Operations**: Use `db push` only, NO migrations (per project-context.md)
- **Schema Location**: `client/prisma/schema.prisma`
- **Existing Models**: The schema already has User, Class, File models that will be referenced
- **Existing Enums**: WorkflowStatus enum exists (lines 123-128) with values DRAFT, REVIEW, APPROVED, REJECTED - need to extend or replace with new workflow-specific values
- **File Model Integration**: Use existing File model from MinIO system (see MINIO_MIGRATION.md for File model structure)
- **Audit Fields Pattern**: Follow existing pattern with createdBy, updatedBy, createdAt, updatedAt on all models
- **Foreign Key Relations**: Use @@map for table names and proper @relation fields

### Source Tree Components to Touch

- **File**: `client/prisma/schema.prisma` (UPDATE - add new models and enums)
- **No backend code changes** - this is purely database schema work

### Testing Standards Summary

- No test framework currently configured (per project-context.md)
- All new code must be written testable by design
- Manual verification: Run `npx prisma studio` to inspect created tables
- Verify foreign key relationships work correctly
- Test enum values are properly constrained

### Project Structure Notes

- **Schema File**: `client/prisma/schema.prisma` (single file, not sharded)
- **Prisma Client Generation**: Must run after schema changes: `npx prisma generate --schema=client/prisma/schema.prisma`
- **Database Push**: Use `npx prisma db push --schema=client/prisma/schema.prisma` (NO migrations)
- **Backend Restart**: Required after schema changes (per project-context.md)
- **Naming Convention**: Use camelCase for field names, PascalCase for model names
- **Table Names**: Use @@map with snake_case for database table names

### Critical Considerations

1. **Existing WorkflowStatus Enum Conflict**: The schema already has a WorkflowStatus enum (lines 123-128) with different values. Options:
   - Option A: Rename existing enum to WorkflowInstanceStatus (already exists as WorkflowInstanceStatus on lines 142-148)
   - Option B: Replace existing WorkflowStatus with new values
   - **Recommended**: Use the new WorkflowStatus enum values as specified in the story, since the existing one appears to be for a different workflow system (WorkflowInstance)

2. **File Model Reference**: The fileId field should reference the existing File model from the MinIO Smart Drive system. Check File model structure in schema to ensure correct field name (likely `id` as Int).

3. **User References**: All user ID fields (submitterId, currentAssigneeId, instructorId, authorId, actorId) should reference the User model's `id` field (Int).

4. **Class Reference**: The classId field should reference the Class model's `id` field (Int).

5. **Audit Trail**: WorkflowStatusHistory should be immutable - consider adding a constraint or note that records should never be updated/deleted (only inserted).

### References

- [Source: _bmad-output/project-context.md#Critical Implementation Rules] - Prisma db push only, no migrations
- [Source: _bmad-output/project-context.md#Prisma] - Column renames = drop+add, no rollback path
- [Source: client/prisma/schema.prisma#lines 123-128] - Existing WorkflowStatus enum
- [Source: client/prisma/schema.prisma#lines 142-148] - Existing WorkflowInstanceStatus enum
- [Source: MINIO_MIGRATION.md] - File model structure from MinIO system
- [Source: _bmad-output/planning-artifacts/prds/prd-courses-2026-05-23/prd.md#F1] - Document naming convention and workflow requirements

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Debug Log References

### Completion Notes List

- Created WorkflowType enum with values: ATTENDANCE_DAILY, ATTENDANCE_WEEKLY, GENERAL
- Created WorkflowDocumentStatus enum with values: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, AMENDED, CLOSED
  - Note: Created separate enum to avoid breaking existing WorkflowStatus enum used by WorkflowInstance system
- Created WorkflowDocument model with all required fields and foreign key relations
- Created WorkflowComment model with foreign key relations to WorkflowDocument and User
- Created WorkflowStatusHistory model with foreign key relations to WorkflowDocument and User
- Added reverse relations to User model (4 new relations), File model (1 new relation), and Class model (1 new relation)
- Generated Prisma client successfully
- Pushed schema to database successfully
- Verified all three tables created in PostgreSQL with correct structure and foreign key constraints
- All foreign key constraints properly configured with appropriate CASCADE/SET NULL behaviors

### File List

- client/prisma/schema.prisma (UPDATE)
