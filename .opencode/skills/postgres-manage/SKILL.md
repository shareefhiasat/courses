# PostgreSQL Management Skill

## Description
Manages the Military LMS PostgreSQL database — querying, importing, exporting, maintenance.

## Connection Details
- **Container:** `lms-qaf-app-db`
- **Database:** `military_lms`
- **User:** `military_lms`
- **Password:** `military_lms123`
- **Port:** 5432
- **Prisma Schema:** `client/prisma/schema.prisma`

## Operations

### Interactive Shell
```bash
docker exec -it lms-qaf-app-db psql -U military_lms -d military_lms
```

### Run SQL Query
```bash
docker exec lms-qaf-app-db psql -U military_lms -d military_lms -c "SELECT * FROM users LIMIT 10;"
```

### List Tables
```bash
docker exec lms-qaf-app-db psql -U military_lms -d military_lms -c "\dt"
```

### Describe Table Structure
```bash
docker exec lms-qaf-app-db psql -U military_lms -d military_lms -c "\d <table_name>"
```

### Count Rows in Table
```bash
docker exec lms-qaf-app-db psql -U military_lms -d military_lms -c "SELECT COUNT(*) FROM <table_name>;"
```

### Search Tables
```bash
docker exec lms-qaf-app-db psql -U military_lms -d military_lms -c "\dt *<search>*"
```

### Export Full Database
```bash
docker exec lms-qaf-app-db pg_dump -U military_lms -d military_lms > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Export Single Table
```bash
docker exec lms-qaf-app-db pg_dump -U military_lms -d military_lms --table=<table_name> --data-only > <table>_data.sql
```

### Import SQL File
```bash
docker exec -i lms-qaf-app-db psql -U military_lms -d military_lms < /path/to/backup.sql
```

### Health Check
```bash
docker exec lms-qaf-app-db pg_isready -U military_lms -d military_lms
```

## Prisma Operations

### Generate Client (after schema changes)
```bash
npx prisma generate --schema=client/prisma/schema.prisma
```

### Open Prisma Studio
```bash
cd client && npx prisma studio
```

### Push Schema to DB
```bash
npx prisma db push --schema=client/prisma/schema.prisma
```

### View Migration History
```bash
npx prisma migrate status --schema=client/prisma/schema.prisma
```

## Key Tables
- `users` — application users
- `programs` — course programs
- `subjects` — subjects within programs
- `classes` — class groups
- `enrollments` — student enrollments
- `announcements` — course announcements

## Troubleshooting
- **Connection refused:** container may not be running (`docker ps`)
- **Auth failed:** check credentials in `.env` match compose file
- **Missing tables:** run Prisma migrations or import a backup
- **Disk full:** `docker exec lms-qaf-app-db df -h /var/lib/postgresql/data`
- **Slow queries:** use `EXPLAIN ANALYZE` before queries
