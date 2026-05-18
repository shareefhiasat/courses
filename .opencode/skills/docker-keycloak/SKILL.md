# Docker & Keycloak Management Skill

## Description
Manages Docker infrastructure (PostgreSQL, MinIO, Redis, Keycloak, Nginx) and Keycloak identity provider operations for the Military LMS.

## Stack
- Docker Compose (`scripts/docker/docker-compose.yml`, project: `qaf-lms`)
- Containers: `lms-qaf-app-db`, `lms-qaf-keycloak`, `lms-qaf-keycloak-db`, `lms-qaf-minio`, `lms-qaf-redis`, `lms-qaf-nginx`
- Keycloak realm: `military-lms`, admin: `admin/admin123`

## Scripts
- `scripts/docker/docker-manager.sh` — Docker lifecycle (up/down/logs/reset)
- `scripts/database/db-manager.sh` — PostgreSQL operations (query/import/export)
- `scripts/keycloak/keycloak-manager.sh` — Keycloak user/realm management

## Steps

### 1. Check Docker Services
```bash
docker ps --filter "name=lms-qaf" --format "table {{.Names}}\t{{.Status}}"
```

### 2. Start/Stop Services
```bash
bash scripts/docker/docker-manager.sh up    # Start all services
bash scripts/docker/docker-manager.sh down  # Stop all services
bash scripts/docker/docker-manager.sh logs nginx  # View service logs
```

### 3. Database Operations
```bash
bash scripts/database/db-manager.sh list           # List tables
bash scripts/database/db-manager.sh count users    # Row count
bash scripts/database/db-manager.sh import backup.sql  # Import SQL
bash scripts/database/db-manager.sh export         # Export database
```

### 4. Keycloak Operations
```bash
bash scripts/keycloak/keycloak-manager.sh status          # Check health
bash scripts/keycloak/keycloak-manager.sh users           # List users
bash scripts/keycloak/keycloak-manager.sh user-get admin  # Search user
bash scripts/keycloak/keycloak-manager.sh user-reset-pw shareef.hiasat@gmail.com Jordan123
```

### 5. Application
```bash
# Backend
node backend/server.js

# Frontend
cd client && node node_modules/vite/bin/vite.js --host
```

## Troubleshooting
- If containers won't start, check ports: `lsof -i :5432 -i :8080 -i :6379 -i :9000`
- If database is empty, import: `bash scripts/database/db-manager.sh import /path/to/backup.sql`
- If Keycloak login fails, reset user password via admin console or script
- Prisma issues: `npx prisma generate --schema=client/prisma/schema.prisma`
