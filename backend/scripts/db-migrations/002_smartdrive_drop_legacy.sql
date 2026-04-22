-- ============================================================================
-- SmartDrive DMS — Stage 2: drop deprecated schema
--
-- WHEN TO RUN: After 001_smartdrive_dms.sql has been applied AND the backend
-- services have been updated to read/write only the new tables. Verify:
--   - `file_shares` has all rows from legacy data
--   - `public_links` has all rows from legacy `files.publicLinkToken`
--   - No service reads `files.publicLinkToken`
--
-- Run AFTER updating schema.prisma to remove:
--   - `model FileShare`
--   - `File.publicLinkToken` / `File.publicLinkExpiry`
-- …then `npx prisma db push`.
--
-- This file is provided as documentation; Prisma will drop the columns/table
-- when `prisma db push` runs with the updated schema. The SQL below is an
-- idempotent safety net you can run manually if `db push` is not used.
-- ============================================================================

-- 1. Drop legacy file_shares table.
DROP TABLE IF EXISTS file_shares CASCADE;

-- 2. Drop deprecated public-link columns from files.
ALTER TABLE files DROP COLUMN IF EXISTS "publicLinkToken";
ALTER TABLE files DROP COLUMN IF EXISTS "publicLinkExpiry";

-- 3. Drop the now-unused WorkflowStatus enum.
DROP TYPE IF EXISTS "WorkflowStatus";
