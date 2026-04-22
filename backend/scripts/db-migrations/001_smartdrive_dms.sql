-- ============================================================================
-- SmartDrive DMS — post-prisma-push migration
--
-- RUN ORDER:
--   1. `npx prisma db push --schema=client/prisma/schema.prisma`
--      (creates new tables / columns / Prisma-expressible indexes)
--   2. This script (adds tsvector trigger, partial unique indexes, data
--      migration from deprecated tables, seed data).
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- ============================================================================

-- Required extensions (no-op if already installed).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 0. Add searchVector column (if Prisma hasn't been run yet)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'searchVector'
  ) THEN
    ALTER TABLE files ADD COLUMN "searchVector" tsvector;
    RAISE NOTICE 'Added searchVector column to files table';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Full-text search vector on files (Prisma: Unsupported("tsvector"))
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION files_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."folderPath", '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_files_search ON files;
CREATE TRIGGER trg_files_search
  BEFORE INSERT OR UPDATE OF name, "folderPath"
  ON files
  FOR EACH ROW EXECUTE FUNCTION files_search_trigger();

-- Backfill existing rows.
UPDATE files
SET "searchVector" =
  setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("folderPath", '')), 'B')
WHERE "searchVector" IS NULL;

-- GIN index for tsvector lookups.
CREATE INDEX IF NOT EXISTS idx_files_search_vector
  ON files USING gin ("searchVector");

-- Prefix search on folder paths.
CREATE INDEX IF NOT EXISTS idx_folders_path_trgm
  ON folders USING gin (path gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 2. Enforce "exactly one current version per file" at DB level.
--    Prisma can only express full unique indexes, not partial ones.
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS ux_file_versions_current;
CREATE UNIQUE INDEX ux_file_versions_current
  ON file_versions ("fileId")
  WHERE "isCurrent" = TRUE;

-- ---------------------------------------------------------------------------
-- 3. Share ACL sanity constraints Prisma can't express.
-- ---------------------------------------------------------------------------
ALTER TABLE file_shares
  DROP CONSTRAINT IF EXISTS chk_shares_target;
ALTER TABLE file_shares
  ADD CONSTRAINT chk_shares_target
  CHECK ("fileId" IS NOT NULL OR "folderId" IS NOT NULL);

ALTER TABLE file_shares
  DROP CONSTRAINT IF EXISTS chk_shares_subject;
ALTER TABLE file_shares
  ADD CONSTRAINT chk_shares_subject
  CHECK (
    ("subjectType" = 'USER' AND "subjectUserId" IS NOT NULL AND "subjectRole" IS NULL) OR
    ("subjectType" = 'ROLE' AND "subjectRole"   IS NOT NULL AND "subjectUserId" IS NULL)
  );

-- Partial uniqueness for user & role shares (per file AND folder scope).
DROP INDEX IF EXISTS ux_share_user_file;
CREATE UNIQUE INDEX ux_share_user_file
  ON file_shares ("fileId", "subjectUserId")
  WHERE "subjectType" = 'USER' AND "fileId" IS NOT NULL;

DROP INDEX IF EXISTS ux_share_user_folder;
CREATE UNIQUE INDEX ux_share_user_folder
  ON file_shares ("folderId", "subjectUserId")
  WHERE "subjectType" = 'USER' AND "folderId" IS NOT NULL;

DROP INDEX IF EXISTS ux_share_role_file;
CREATE UNIQUE INDEX ux_share_role_file
  ON file_shares ("fileId", "subjectRole")
  WHERE "subjectType" = 'ROLE' AND "fileId" IS NOT NULL;

DROP INDEX IF EXISTS ux_share_role_folder;
CREATE UNIQUE INDEX ux_share_role_folder
  ON file_shares ("folderId", "subjectRole")
  WHERE "subjectType" = 'ROLE' AND "folderId" IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Public-link integrity & active-token index.
-- ---------------------------------------------------------------------------
ALTER TABLE public_links
  DROP CONSTRAINT IF EXISTS chk_public_links_target;
ALTER TABLE public_links
  ADD CONSTRAINT chk_public_links_target
  CHECK ("fileId" IS NOT NULL OR "folderId" IS NOT NULL);

DROP INDEX IF EXISTS idx_public_links_active_token;
CREATE INDEX idx_public_links_active_token
  ON public_links (token)
  WHERE "revokedAt" IS NULL;

-- ---------------------------------------------------------------------------
-- 5. Data migration: legacy `file_shares` data (if any).
-- ---------------------------------------------------------------------------
-- Note: If you have existing file_shares data, migrate it here.
-- Since we're using the file_shares table directly, no migration needed.

-- ---------------------------------------------------------------------------
-- 6. Data migration: embedded public-link columns on `files` -> `public_links`.
-- ---------------------------------------------------------------------------
INSERT INTO public_links
  (id, "fileId", token, "expiresAt", "createdById", "createdAt")
SELECT
  gen_random_uuid()::text,
  f.id,
  f."publicLinkToken",
  f."publicLinkExpiry",
  f."ownerId",
  f."createdAt"
FROM files f
WHERE f."publicLinkToken" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public_links pl WHERE pl.token = f."publicLinkToken"
  );

-- ---------------------------------------------------------------------------
-- 7. Seed: Attendance Report Approval workflow definition.
-- ---------------------------------------------------------------------------
WITH upsert_def AS (
  INSERT INTO workflow_definitions (id, code, name, description, "isActive", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    'ATTENDANCE_REPORT',
    'Attendance Report Approval',
    'Admin submits monthly attendance report; HR audits, approves or requests revisions; rejected reports return to Admin for re-upload; approved reports are filed.',
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id
)
INSERT INTO workflow_stages
  (id, "definitionId", "stageOrder", code, name, "assignedRole", "allowedActions",
   "onApproveGoto", "onRejectGoto", "isTerminalApproved", "slaHours")
SELECT gen_random_uuid()::text, d.id, s.stage_order, s.code, s.name,
       s.assigned_role, s.allowed_actions,
       s.on_approve_goto, s.on_reject_goto, s.is_terminal_approved, s.sla_hours
FROM upsert_def d
CROSS JOIN (VALUES
  (1, 'ADMIN_SUBMIT', 'Admin Submission', 'admin', ARRAY['SUBMIT'],                2,    NULL::int, FALSE, NULL::int),
  (2, 'HR_REVIEW',    'HR Review',         'hr',    ARRAY['APPROVE','REJECT'],      3,    1,         FALSE, 48),
  (3, 'HR_FILED',     'Filed',             'hr',    ARRAY[]::text[],                NULL, NULL,      TRUE,  NULL)
) AS s(stage_order, code, name, assigned_role, allowed_actions,
       on_approve_goto, on_reject_goto, is_terminal_approved, sla_hours)
ON CONFLICT ("definitionId", "stageOrder") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. NOTE — deprecated columns/table dropped in a LATER migration
--    (002_smartdrive_drop_legacy.sql) once application no longer reads them.
--    This ensures rollback safety.
-- ---------------------------------------------------------------------------
