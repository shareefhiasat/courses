# SmartDrive DMS — DB Migrations

These scripts support the SmartDrive Document Management System rebuild.
They are **post-Prisma-push** migrations: Prisma creates tables/columns/indexes
that it can express, and these SQL files add what Prisma cannot
(tsvector triggers, partial unique indexes, CHECK constraints, data migrations,
seed data).

## Files

| # | File | Purpose | When |
|---|------|---------|------|
| 001 | `001_smartdrive_dms.sql` | tsvector trigger, partial indexes, CHECK constraints, data migration from legacy `file_shares`/`files.publicLinkToken`, seed Attendance Report workflow | **Required** after first `prisma db push` that adds the new models |
| 002 | `002_smartdrive_drop_legacy.sql` | Drop legacy `file_shares` table and `files.publicLinkToken`/`publicLinkExpiry` columns and `WorkflowStatus` enum | After services switch to new tables AND schema.prisma has been updated to remove them |

## Apply order

```powershell
# 1. Sync Prisma schema to DB (creates new tables/columns/indexes).
npx prisma db push --schema=client/prisma/schema.prisma

# 2. Regenerate Prisma client.
npx prisma generate --schema=client/prisma/schema.prisma

# 3. Apply SQL migration 001.
$env:PGPASSWORD="..."
psql -h localhost -U postgres -d <dbname> -f backend/scripts/db-migrations/001_smartdrive_dms.sql

# Later, after services are switched over:
# 4. Remove legacy Prisma models (FileShare, File.publicLinkToken/Expiry),
#    push again, then optionally run 002_smartdrive_drop_legacy.sql.
```

## Idempotency

Both scripts use `IF EXISTS` / `IF NOT EXISTS` / `ON CONFLICT` guards, so
re-running them is safe.

## Why two stages?

Running the drop alongside the data migration in a single transaction means
any rollback loses the old rows. Keeping them separated lets us:

1. Ship the new tables first (001).
2. Switch services to read from the new tables.
3. Verify in production that no reader/writer still touches the legacy shapes.
4. Drop legacy shapes (002) confidently.
