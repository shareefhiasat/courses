-- Drop old Nextcloud and Workflow tables
DROP TABLE IF EXISTS "nextcloud_accounts" CASCADE;
DROP TABLE IF EXISTS "private_workspace_links" CASCADE;
DROP TABLE IF EXISTS "workflow_inbox_items" CASCADE;
DROP TABLE IF EXISTS "workflow_actions" CASCADE;
DROP TABLE IF EXISTS "workflow_versions" CASCADE;
DROP TABLE IF EXISTS "workflow_documents" CASCADE;
DROP TABLE IF EXISTS "file_shares" CASCADE;
DROP TABLE IF EXISTS "file_activities" CASCADE;
DROP TABLE IF EXISTS "file_comments" CASCADE;
DROP TABLE IF EXISTS "files" CASCADE;
