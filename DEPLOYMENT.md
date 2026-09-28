# Military LMS — Offline Server Deployment Guide

> **IMPORTANT**: This guide is for deploying on an **offline server with no internet access** (air-gapped / red network).
> All Docker images and the Ollama LLM model must be pre-loaded onto the server before starting services.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Pre-Load Docker Images (On a Machine With Internet)](#2-pre-load-docker-images)
3. [Transfer Files to Offline Server](#3-transfer-files-to-offline-server)
4. [Environment Configuration](#4-environment-configuration)
5. [Start Docker Services](#5-start-docker-services)
6. [Load the Ollama LLM Model (Offline)](#6-load-the-ollama-llm-model-offline)
7. [Start the Backend](#7-start-the-backend)
8. [Start the Frontend](#8-start-the-frontend)
9. [Verify All Services](#9-verify-all-services)
10. [Service Port Reference](#10-service-port-reference)
11. [AI Assistant Architecture](#11-ai-assistant-architecture)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

### Server Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| OS | Linux (Ubuntu 22.04+ / RHEL 8+) | Ubuntu 24.04 LTS |
| RAM | 16 GB | 32 GB (Qwen3 14B + ELK stack) |
| CPU | 4 cores | 8 cores |
| Disk | 50 GB | 100 GB (Ollama 14B model + MinIO + DB) |
| Docker | 24.0+ | 26.0+ |
| Docker Compose | v2.20+ | v2.26+ |
| Node.js | 22.x | 22.x |
| pnpm | 9.x | 10.x |

### Software to Install Before Starting

On the offline server, ensure these are pre-installed (download installers on an internet-connected machine and transfer):

- **Docker Engine** 24.0+
- **Docker Compose** v2 (plugin or standalone)
- **Node.js** 22.x (from tarball or package)
- **pnpm** 9.x+ (`npm install -g pnpm` if npm is available, or transfer the package)

---

## 2. Pre-Load Docker Images

> **Do this on a machine WITH internet access.**

### 2.1 Pull All Required Images

```bash
# Core services
docker pull nginx:alpine
docker pull postgres:15-alpine
docker pull redis:7-alpine
docker pull minio/minio:latest
docker pull quay.io/keycloak/keycloak:26.0

# AI Assistant (Offline LLM)
docker pull ollama/ollama:latest

# Monitoring (optional for production, recommended)
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.11.0
docker pull docker.elastic.co/logstash/logstash:8.11.0
docker pull docker.elastic.co/kibana/kibana:8.11.0
docker pull grafana/grafana:10.2.0
docker pull prom/prometheus:v2.48.0

# Document editing (optional)
docker pull collabora/code:25.04.9.4

# Development/testing (optional for production)
docker pull maildev/maildev:latest
docker pull frankescobar/allure-docker-service:latest
```

### 2.2 Export Images to Tar Files

```bash
mkdir -p docker-images

# Core (required)
docker save nginx:alpine -o docker-images/nginx-alpine.tar
docker save postgres:15-alpine -o docker-images/postgres-15-alpine.tar
docker save redis:7-alpine -o docker-images/redis-7-alpine.tar
docker save minio/minio:latest -o docker-images/minio.tar
docker save quay.io/keycloak/keycloak:26.0 -o docker-images/keycloak-26.0.tar

# AI Assistant (required for AI features)
docker save ollama/ollama:latest -o docker-images/ollama.tar

# Monitoring (recommended)
docker save docker.elastic.co/elasticsearch/elasticsearch:8.11.0 -o docker-images/elasticsearch-8.11.0.tar
docker save docker.elastic.co/logstash/logstash:8.11.0 -o docker-images/logstash-8.11.0.tar
docker save docker.elastic.co/kibana/kibana:8.11.0 -o docker-images/kibana-8.11.0.tar
docker save grafana/grafana:10.2.0 -o docker-images/grafana-10.2.0.tar
docker save prom/prometheus:v2.48.0 -o docker-images/prometheus-v2.48.0.tar

# Document editing (optional)
docker save collabora/code:25.04.9.4 -o docker-images/collabora-25.04.tar

# Dev/testing (optional for production)
docker save maildev/maildev:latest -o docker-images/maildev.tar
docker save frankescobar/allure-docker-service:latest -o docker-images/allure.tar
```

### 2.3 Pre-Download the Ollama LLM Model

The Ollama model (`qwen3:14b`, ~9.2 GB) must be pre-downloaded on an internet-connected machine that has Ollama running:

```bash
# On internet-connected machine:
# 1. Start Ollama temporarily
docker run -d --name ollama-temp -p 11434:11434 -v ollama_temp_data:/root/.ollama ollama/ollama:latest

# 2. Wait for it to be ready
sleep 5

# 3. Pull the model
curl -X POST http://localhost:11434/api/pull -d '{"name": "qwen3:14b"}'

# 4. Wait for download to complete (check progress)
# The model is ~9.2GB, this may take several minutes

# 5. Export the model data
docker stop ollama-temp
docker cp ollama_temp_data:/root/.ollama ./ollama-models
# Or export as a volume tar:
docker run --rm -v ollama_temp_data:/data -v $(pwd):/backup alpine tar czf /backup/ollama-models.tar.gz -C /data .

# 6. Cleanup
docker rm ollama-temp
docker volume rm ollama_temp_data
```

You should now have `ollama-models.tar.gz` (~9.2 GB) containing the pre-downloaded model.

---

## 3. Transfer Files to Offline Server

Transfer the following to the offline server:

```
project-root/
├── docker-images/              # All .tar files from step 2.2
│   ├── nginx-alpine.tar
│   ├── postgres-15-alpine.tar
│   ├── redis-7-alpine.tar
│   ├── minio.tar
│   ├── keycloak-26.0.tar
│   ├── ollama.tar
│   ├── elasticsearch-8.11.0.tar    # (if using monitoring)
│   ├── logstash-8.11.0.tar         # (if using monitoring)
│   ├── kibana-8.11.0.tar           # (if using monitoring)
│   ├── grafana-10.2.0.tar          # (if using monitoring)
│   ├── prometheus-v2.48.0.tar      # (if using monitoring)
│   ├── collabora-25.04.tar         # (if using document editing)
│   ├── maildev.tar                 # (if using dev tools)
│   └── allure.tar                  # (if using test reports)
├── ollama-models.tar.gz         # Pre-downloaded LLM model from step 2.3
├── scripts/docker/              # docker-compose.yml and configs
├── backend/                     # Backend source code
├── client/                      # Frontend source code
├── .env                         # Environment configuration
├── client/.env                  # Frontend environment
├── client/prisma/               # Prisma schema and migrations
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

### 3.1 Load Docker Images on Offline Server

```bash
# Load all images (required)
docker load -i docker-images/nginx-alpine.tar
docker load -i docker-images/postgres-15-alpine.tar
docker load -i docker-images/redis-7-alpine.tar
docker load -i docker-images/minio.tar
docker load -i docker-images/keycloak-26.0.tar
docker load -i docker-images/ollama.tar

# Load monitoring images (recommended)
docker load -i docker-images/elasticsearch-8.11.0.tar
docker load -i docker-images/logstash-8.11.0.tar
docker load -i docker-images/kibana-8.11.0.tar
docker load -i docker-images/grafana-10.2.0.tar
docker load -i docker-images/prometheus-v2.48.0.tar

# Load optional images
docker load -i docker-images/collabora-25.04.tar
docker load -i docker-images/maildev.tar
docker load -i docker-images/allure.tar

# Verify all images are loaded
docker images
```

### 3.2 Install Node.js Dependencies (Offline)

```bash
# Option A: Transfer node_modules from a machine with same OS/arch
# On internet machine:
tar czf node_modules.tar.gz node_modules client/node_modules
# Transfer and extract on server:
tar xzf node_modules.tar.gz

# Option B: Use pnpm with offline cache
# On internet machine:
pnpm install
pnpm --offline install --frozen-lockfile
# Transfer the pnpm store:
tar czf pnpm-store.tar.gz ~/.local/share/pnpm/store
# On offline server:
mkdir -p ~/.local/share/pnpm
tar xzf pnpm-store.tar.gz -C ~/.local/share/pnpm
pnpm install --offline --frozen-lockfile
```

---

## 4. Environment Configuration

### 4.1 Backend `.env` (Project Root)

Edit `.env` with your server's IP/hostname. Below are the critical variables:

```env
# Server
PORT=8001
NODE_ENV=production
DISABLE_HTTPS=false

# Database
DATABASE_URL="postgresql://military_lms:military_lms123@localhost:5432/military_lms"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=military_lms
DB_USERNAME=military_lms
DB_PASSWORD=military_lms123

# Frontend (use your server's IP or domain)
FRONTEND_URL=https://YOUR_SERVER_IP:5174
CORS_ORIGIN=https://YOUR_SERVER_IP:5174

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=military-lms-app
KEYCLOAK_ADMIN_PASSWORD=CHANGE_THIS_PASSWORD

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=CHANGE_THIS_PASSWORD
MINIO_PUBLIC_ENDPOINT=http://YOUR_SERVER_IP:9000

# Redis (for AI cache + rate limiting)
REDIS_PASSWORD=CHANGE_THIS_PASSWORD
REDIS_URL=redis://:CHANGE_THIS_PASSWORD@localhost:6379

# Ollama (Offline LLM for AI Assistant)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:14b
OLLAMA_TIMEOUT_MS=60000

# AI Cache
AI_CACHE_TTL_SECONDS=300

# Security — CHANGE THESE IN PRODUCTION
JWT_SECRET=generate-a-strong-random-secret-here
API_SECRET_KEY=generate-a-strong-random-key-here
WOPI_SECRET=generate-a-strong-wopi-secret-here

# Disable Swagger in production
ENABLE_SWAGGER=false
```

### 4.2 Frontend `client/.env`

```env
VITE_API_BASE_URL=http://YOUR_SERVER_IP:8001
VITE_API_VERSION=v1
VITE_KEYCLOAK_URL=http://YOUR_SERVER_IP:8080
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=military-lms-app
VITE_KEYCLOAK_REDIRECT_URI=https://YOUR_SERVER_IP:5174
```

> **Note**: Replace `YOUR_SERVER_IP` with the actual server IP address or hostname.
> If using a domain name, use that instead.

---

## 5. Start Docker Services

### 5.1 Start All Services

```bash
# From project root
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml up -d
```

### 5.2 Start Only Required Services (Minimal Production)

```bash
# Core services only (no monitoring, no dev tools)
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml up -d \
  nginx app-db keycloak-db redis minio keycloak ollama
```

### 5.3 Verify Containers Are Running

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output (minimal):
```
NAMES                    STATUS         PORTS
lms-qaf-nginx            Up             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
lms-qaf-app-db           Up             0.0.0.0:5432->5432/tcp
lms-qaf-keycloak-db      Up             5432/tcp
lms-qaf-redis            Up             0.0.0.0:6379->6379/tcp
lms-qaf-minio            Up             0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
lms-qaf-keycloak         Up             0.0.0.0:8080->8080/tcp
lms-qaf-ollama           Up             0.0.0.0:11434->11434/tcp
```

---

## 6. Load the Ollama LLM Model (Offline)

> The model was pre-downloaded in [Step 2.3](#23-pre-download-the-ollama-llm-model).

### 6.1 Load Model into the Running Ollama Container

```bash
# Extract the model data into the Ollama container's volume
docker exec lms-qaf-ollama mkdir -p /root/.ollama

# Copy the pre-downloaded model into the container
docker cp ollama-models.tar.gz lms-qaf-ollama:/tmp/
docker exec lms-qaf-ollama tar xzf /tmp/ollama-models.tar.gz -C /root/.ollama
docker exec lms-qaf-ollama rm /tmp/ollama-models.tar.gz

# Restart Ollama to pick up the model
docker restart lms-qaf-ollama

# Wait for Ollama to be ready
sleep 10
```

### 6.2 Verify the Model Is Available

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Expected response should include qwen3:14b:
# {"models":[{"name":"qwen3:14b","size":...}]}
```

### 6.3 Alternative: Load Model via Ollama CLI

If the tar approach doesn't work, you can use the Ollama CLI inside the container:

```bash
# If you have the model as a .gguf file
docker exec lms-qaf-ollama ollama create qwen3:14b -f /path/to/Modelfile
```

---

## 7. Start the Backend

### 7.1 Generate Prisma Client

```bash
# From project root
npx prisma generate --schema=client/prisma/schema.prisma
```

### 7.2 Run Database Migrations (First Time Only)

```bash
# Apply existing migrations
npx prisma migrate deploy --schema=client/prisma/schema.prisma

# Or if setting up from scratch:
npx prisma db push --schema=client/prisma/schema.prisma
```

### 7.3 Seed Database (First Time Only)

```bash
# Seed lookup tables
node prisma/seed-all.ts

# Seed comprehensive data (programs, users, classes, etc.)
node comprehensive-seed-v2.js
```

### 7.4 Start the Backend Server

```bash
# Production
node backend/server.js

# Or with process manager (recommended for production)
# Using pm2:
pm2 start backend/server.js --name lms-backend
pm2 save
pm2 startup

# Or using systemd (create /etc/systemd/system/lms-backend.service):
# [Unit]
# Description=Military LMS Backend
# After=docker.service
# 
# [Service]
# Type=simple
# WorkingDirectory=/path/to/courses
# ExecStart=/usr/bin/node backend/server.js
# Restart=always
# RestartSec=10
# Environment=NODE_ENV=production
# 
# [Install]
# WantedBy=multi-user.target
```

The backend will be available at `http://YOUR_SERVER_IP:8001`.

---

## 8. Start the Frontend

### 8.1 Build for Production

```bash
cd client
pnpm run build
```

### 8.2 Serve the Built Files

```bash
# Option A: Use a static file server
npx serve dist -l 5174

# Option B: Use Nginx (already in docker-compose)
# The Nginx container can serve the built frontend
# Copy the build output to the Nginx volume:
docker cp client/dist/. lms-qaf-nginx:/usr/share/nginx/html/

# Option C: Use Vite preview
cd client
node node_modules/vite/bin/vite.js preview --host --port 5174
```

### 8.3 Development Mode (if needed on server)

```bash
cd client
node node_modules/vite/bin/vite.js --host
```

The frontend will be available at `https://YOUR_SERVER_IP:5174`.

---

## 9. Verify All Services

### 9.1 Health Check Script

```bash
#!/bin/bash
echo "=== Military LMS Service Health Check ==="

echo -n "Backend API (8001):     "
curl -sf http://localhost:8001/api/v1/health && echo "OK" || echo "FAIL"

echo -n "Frontend (5174):         "
curl -sfk https://localhost:5174 > /dev/null && echo "OK" || echo "FAIL"

echo -n "Keycloak (8080):         "
curl -sf http://localhost:8080/realms/master > /dev/null && echo "OK" || echo "FAIL"

echo -n "PostgreSQL (5432):       "
docker exec lms-qaf-app-db pg_isready -U military_lms && echo "OK" || echo "FAIL"

echo -n "Redis (6379):            "
docker exec lms-qaf-redis redis-cli -a redis123 ping 2>/dev/null | grep -q PONG && echo "OK" || echo "FAIL"

echo -n "MinIO (9000):            "
curl -sf http://localhost:9000/minio/health/live > /dev/null && echo "OK" || echo "FAIL"

echo -n "Ollama LLM (11434):      "
curl -sf http://localhost:11434/api/tags > /dev/null && echo "OK" || echo "FAIL"

echo "=== Done ==="
```

### 9.2 Test the AI Assistant

```bash
# Test AI query endpoint (requires auth token)
curl -X POST http://localhost:8001/api/v1/ai/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEYCLOAK_TOKEN" \
  -d '{"message": "How many students are enrolled?", "lang": "en"}'
```

---

## 10. Service Port Reference

### Required Services

| Service | Container Name | Port | Protocol | Purpose |
|---------|---------------|------|----------|---------|
| Backend API | (node process) | 8001 | HTTP | REST API server |
| Frontend | (node/nginx) | 5174 | HTTPS | React web application |
| PostgreSQL | lms-qaf-app-db | 5432 | TCP | Main application database |
| Keycloak DB | lms-qaf-keycloak-db | — (internal) | TCP | Keycloak database |
| Keycloak | lms-qaf-keycloak | 8080 | HTTP | Authentication & authorization |
| Redis | lms-qaf-redis | 6379 | TCP | AI cache + rate limiting + sessions |
| MinIO | lms-qaf-minio | 9000, 9001 | HTTP | Object storage (files, documents) |
| Nginx | lms-qaf-nginx | 80, 443 | HTTP/HTTPS | Reverse proxy + SSL termination |
| **Ollama** | **lms-qaf-ollama** | **11434** | **HTTP** | **Offline LLM (Qwen 2.5:3b) for AI Assistant** |

### Monitoring Services (Optional)

| Service | Container Name | Port | Protocol | Purpose |
|---------|---------------|------|----------|---------|
| Elasticsearch | lms-qaf-elasticsearch | 9200, 9300 | HTTP/TCP | Log indexing + search |
| Logstash | lms-qaf-logstash | 5000 | TCP/UDP | Log pipeline |
| Kibana | lms-qaf-kibana | 5601 | HTTP | Log visualization |
| Grafana | lms-qaf-grafana | 3002 | HTTP | Metrics dashboards |
| Prometheus | lms-qaf-prometheus | 9091 | HTTP | Metrics collection |

### Optional Services

| Service | Container Name | Port | Protocol | Purpose |
|---------|---------------|------|----------|---------|
| Collabora | lms-qaf-collabora | 9980 | HTTP | Document editing in browser |
| MailDev | lms-qaf-maildev | 1080, 1025 | HTTP/SMTP | Email testing (dev only) |
| Allure | lms-qaf-allure | 5050, 4040 | HTTP | Test reports (dev only) |

### Firewall Rules

On the offline server, configure the firewall to allow:

```bash
# Required ports (open to users)
sudo ufw allow 80/tcp      # Nginx HTTP
sudo ufw allow 443/tcp     # Nginx HTTPS
sudo ufw allow 5174/tcp    # Frontend (if not behind Nginx)
sudo ufw allow 8001/tcp    # Backend API (if not behind Nginx)
sudo ufw allow 8080/tcp    # Keycloak (if not behind Nginx)

# Internal only (restrict to localhost)
sudo ufw deny 5432/tcp     # PostgreSQL — internal only
sudo ufw deny 6379/tcp     # Redis — internal only
sudo ufw deny 9000/tcp     # MinIO — internal only (use presigned URLs)
sudo ufw deny 11434/tcp    # Ollama — internal only
```

> **Security**: Only expose ports 80/443 (Nginx) to external users. All other services
> should be accessible only from localhost or the Docker network.

---

## 11. AI Assistant Architecture

### What Was Added

The AI Assistant was enhanced from simple keyword matching to a **full agentic LLM with tool calling**:

### Components

| Component | File | Purpose |
|-----------|------|---------|
| **LLM Engine** | `backend/ai/llmEngine.js` | Full agentic flow: question → LLM tool calls → DB query → natural language answer |
| **Redis Cache** | `backend/ai/cache.js` | Caches LLM answers by question hash + user scope (5-min TTL) |
| **LLM Parser** | `backend/ai/llmParser.js` | Intent classification + date range mapping (used by engine) |
| **Rule-based Parser** | `backend/ai/parser.js` | Fallback when Ollama is unavailable |
| **Permission Layer** | `backend/ai/permissions.js` | Per-tool access control (Admin, HR, Super Admin) |
| **Scope Layer** | `backend/ai/scope.js` | User data scope (classes, programs) enforcement |
| **10 AI Tools** | `backend/ai/tools/*.js` | Database query tools (attendance, marks, schedule, etc.) |
| **Service** | `backend/services/aiQueryService.js` | Orchestrates LLM engine → fallback to rule-based |
| **Frontend Dialog** | `client/src/components/ai/AiQueryDialog.jsx` | Bilingual AI Q&A interface |
| **Ollama Setup Script** | `scripts/docker/setup-ollama.sh` | Pulls qwen2.5:3b model |

### Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `ioredis` | ^6.0.0 | Redis client for AI answer caching |
| `ollama/ollama` (Docker) | latest | Offline LLM inference server |
| `qwen3:14b` (Ollama model) | 14b | Multilingual (119 languages) LLM model with native tool calling (~9.2 GB) |

### How It Works (Agentic Flow)

```
User Question (AR/EN)
        │
        ▼
┌─────────────────────┐
│  Redis Cache Check  │──── Hit ────► Return cached answer
└─────────────────────┘
        │ Miss
        ▼
┌─────────────────────┐
│  Ollama Available?  │──── No ────► Rule-based parser + template answers
└─────────────────────┘
        │ Yes
        ▼
┌─────────────────────┐
│  Build System Prompt │  (includes user's scoped classes/programs)
│  + 10 Tool Defs     │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Call Ollama /chat  │  (with tools parameter for function calling)
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  LLM returns        │  e.g. getAttendanceSummary({dateRange: "last_month"})
│  tool_calls         │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Execute Tool       │  (scoped DB query with permission checks)
│  → Real data        │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Feed data to LLM   │  (role: "tool" message with JSON results)
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  LLM generates      │  (natural language, not templates!)
│  NL answer          │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Cache in Redis     │  (5-min TTL, keyed by user + question hash)
└─────────────────────┘
        │
        ▼
    Return answer
```

### Environment Variables for AI

```env
# Ollama LLM
OLLAMA_URL=http://localhost:11434     # Ollama API endpoint
OLLAMA_MODEL=qwen3:14b                 # Model name (119 languages, native tool calling)
OLLAMA_TIMEOUT_MS=60000               # LLM request timeout (60s — 14B model needs more time)

# Redis Cache
REDIS_URL=redis://:PASSWORD@localhost:6379
AI_CACHE_TTL_SECONDS=300              # Cache TTL (5 minutes)
```

### Graceful Degradation

- **Ollama unavailable** → Falls back to rule-based parser + template answers
- **Redis unavailable** → Caching silently disabled, queries still work
- **LLM returns invalid response** → Falls back to rule-based parser
- **Permission denied** → Returns access denied message (both LLM and fallback)

---

## 12. Troubleshooting

### Ollama / AI Assistant

| Issue | Cause | Solution |
|-------|-------|----------|
| AI answers are template-based | Ollama not running | `docker start lms-qaf-ollama` |
| AI says "could not understand" | Model not loaded | Follow [Step 6](#6-load-the-ollama-llm-model-offline) |
| AI responses are slow | Model loading or low RAM | Wait 60s for first request (14B model), or upgrade RAM |
| Cache not working | Redis not running | `docker start lms-qaf-redis` |
| `curl: (7) Failed to connect to localhost:11434` | Ollama container down | `docker compose -p qaf-lms -f scripts/docker/docker-compose.yml restart ollama` |

### Database

```bash
# Check PostgreSQL
docker exec lms-qaf-app-db psql -U military_lms -d military_lms -c "SELECT 1;"

# Check Redis
docker exec lms-qaf-redis redis-cli -a redis123 ping
```

### Keycloak

```bash
# Check Keycloak
curl http://localhost:8080/realms/master

# Keycloak admin console
# URL: http://YOUR_SERVER_IP:8080
# Username: admin
# Password: (value of KEYCLOAK_ADMIN_PASSWORD in .env)
```

### MinIO

```bash
# Check MinIO
curl http://localhost:9000/minio/health/live

# MinIO console
# URL: http://YOUR_SERVER_IP:9001
# Username: minioadmin
# Password: (value of MINIO_SECRET_KEY in .env)
```

### Logs

```bash
# Backend logs
tail -f /tmp/backend.log
# Or if using pm2:
pm2 logs lms-backend

# Docker service logs
docker logs lms-qaf-ollama --tail 50
docker logs lms-qaf-keycloak --tail 50
docker logs lms-qaf-app-db --tail 50
docker logs lms-qaf-redis --tail 50
docker logs lms-qaf-nginx --tail 50
```

### Restart Services

```bash
# Restart all Docker services
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml restart

# Restart specific service
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml restart ollama

# Restart backend
pkill -f "node backend/server.js"
node backend/server.js

# Restart frontend
pkill -f "vite"
cd client && node node_modules/vite/bin/vite.js --host
```

---

## Quick Start Summary (For Experienced Operators)

```bash
# 1. Load Docker images
for f in docker-images/*.tar; do docker load -i "$f"; done

# 2. Start Docker services
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml up -d

# 3. Load Ollama model
docker cp ollama-models.tar.gz lms-qaf-ollama:/tmp/
docker exec lms-qaf-ollama tar xzf /tmp/ollama-models.tar.gz -C /root/.ollama
docker restart lms-qaf-ollama

# 4. Generate Prisma client
npx prisma generate --schema=client/prisma/schema.prisma

# 5. Run database migrations
npx prisma migrate deploy --schema=client/prisma/schema.prisma

# 6. Start backend
node backend/server.js &

# 7. Build and start frontend
cd client && pnpm run build && npx serve dist -l 5174 &

# 8. Verify
curl http://localhost:8001/api/v1/health
curl http://localhost:11434/api/tags
```

---

*Last Updated: 2026-08-23*
*Version: 3.0 — Offline LLM (Qwen3 14B) + Redis Cache + Full Agentic AI*
