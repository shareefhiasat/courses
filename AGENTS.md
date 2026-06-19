# Military LMS - Agent Instructions

## Project Overview
- **Type**: Full-stack LMS application (Node.js/Express backend + React frontend)
- **Tech Stack**: PostgreSQL, Keycloak, MinIO, Redis, Docker
- **Port**: Backend 8001, Frontend 5174 (HTTPS)

## Quick Start

### Prerequisites
- Docker running with containers: `lms-qaf-app-db`, `lms-qaf-keycloak`, `lms-qaf-minio`, `lms-qaf-redis`
- Node.js 22.x with pnpm

### Starting the Application

**Start Backend:**
```bash
# Generate Prisma client first (if schema changed)
npx prisma generate --schema=client/prisma/schema.prisma

# Start backend
node backend/server.js
```

**Start Frontend:**
```bash
cd client
node node_modules/vite/bin/vite.js --host
```

### Docker Services
All services use `qaf-lms` project name with `lms-qaf-` prefix:
```bash
# Start all services
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml up -d

# Check status
docker ps

# View logs
docker logs lms-qaf-app-db
docker logs lms-qaf-keycloak
```

## Environment Files
- `.env` - Backend config
- `client/.env` - Frontend config

## Key Services
| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:8001 | - |
| Frontend | https://localhost:5174 | Keycloak login |
| Keycloak | http://localhost:8080 | admin/admin123 |
| MinIO | http://localhost:9000 | minioadmin/minioadmin |
| App DB | localhost:5432 | military_lms/military_lms123 |

## Common Tasks

### Database Operations
```bash
# Access database
docker exec -it lms-qaf-app-db psql -U military_lms -d military_lms

# Import database from backup
docker exec -i lms-qaf-app-db psql -U military_lms -d military_lms < backup.sql
```

### Check Logs
```bash
# Backend logs
tail -f /tmp/backend.log

# Docker logs
docker logs lms-qaf-nginx --tail 50
docker logs lms-qaf-app-db --tail 50
docker logs lms-qaf-keycloak --tail 50
```

### Restart Services
```bash
# Restart backend
pkill -f "node backend/server.js"
node backend/server.js

# Restart frontend
pkill -f "vite"
cd client && node node_modules/vite/bin/vite.js --host

# Restart docker services
docker restart lms-qaf-keycloak lms-qaf-app-db
```

## Agent Team
The project has a team of specialized agents in `.opencode/agents/`:
- **reviewer** — Code review, architecture decisions, implementation guidance, strategic oversight
- **devops** — Docker, Nginx, MinIO, PostgreSQL, Keycloak, Redis, monitoring infrastructure
- **qa** — Testing, Allure reports, bug analysis
- **design** — UI/UX guidance, component design, accessibility

Skills available in `.opencode/skills/`: docker, postgres, keycloak, minio, monitoring, testing

## Cursor IDE Setup

BMAD Method is configured for Cursor alongside OpenCode:

| Layer | Location | Purpose |
|-------|----------|---------|
| Rules | `.cursor/rules/` | Always-on + file-scoped implementation rules |
| Skills | `.cursor/skills/` | Symlinks to `.agents/skills/` (BMAD) and `.opencode/skills/` (infra) |
| MCP | `.cursor/mcp.json` | postgres, docker, prisma, git servers for this project |
| Context | `_bmad-output/project-context.md` | Authoritative AI implementation rules (read first) |
| Agents | `_bmad/custom/bmad-agent-*.toml` | Team persona overrides for Amelia & Winston |

**Invoke agents:** Ask Cursor to use skill `bmad-agent-dev` (Amelia) or `bmad-agent-architect` (Winston). Use `bmad-help` when unsure which workflow to run.

**MCP note:** Project MCP in `.cursor/mcp.json` complements your global `~/.cursor/mcp.json`. Enable project MCP in Cursor Settings → MCP if servers don't appear automatically.

## Issues Workflow
1. Create issue on GitHub with label `bug` or `feature`
2. Create branch from issue
3. Make changes and test locally
4. Create PR referencing the issue
5. OpenCode will review when you mention `/oc` or `/opencode` in PR comment