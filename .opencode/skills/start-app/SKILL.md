# Start Application Skill

## Description
Starts the Military LMS application (backend and frontend) and Docker services.

## Usage
Load this skill when the user wants to start the application or needs help with the development environment.

## Steps

### 1. Check Docker Services
```bash
# Check if containers are running
docker ps --filter "name=lms-qaf" --format "table {{.Names}}\t{{.Status}}"
```

If not running, start them:
```bash
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml up -d
```

Wait for services to be healthy:
```bash
sleep 10
docker ps --filter "name=lms-qaf"
```

### 2. Start Backend
```bash
# Check if backend is already running
lsof -i :8001

# If not running, start it
nohup node backend/server.js > /tmp/backend.log 2>&1 &
sleep 3
lsof -i :8001
```

### 3. Start Frontend
```bash
# Check if frontend is already running
lsof -i :5174

# If not running, start it
cd client
nohup node node_modules/vite/bin/vite.js --host > /tmp/vite.log 2>&1 &
cd ..
sleep 3
lsof -i :5174
```

### 4. Verify
```bash
# Test backend
curl -s http://localhost:8001/api/v1/health || echo "Backend not responding"

# Test frontend (should redirect to Keycloak)
curl -sk https://localhost:5174 | head -c 100
```

## Expected Results
- Backend running at http://localhost:8001
- Frontend running at https://localhost:5174
- Keycloak at http://localhost:8080

## Troubleshooting

### Backend won't start
```bash
# Check if Prisma client is generated
npx prisma generate --schema=client/prisma/schema.prisma

# Check logs
cat /tmp/backend.log
```

### Database connection errors
```bash
# Check database is accessible
docker exec lms-qaf-app-db psql -U military_lms -d military_lms -c "SELECT 1;"

# Check database has data
docker exec lms-qaf-app-db psql -U military_lms -d military_lms -c "SELECT COUNT(*) FROM users;"
```

### Port already in use
```bash
# Find what's using the port
lsof -i :8001
lsof -i :5174

# Kill the process if needed
pkill -f "node backend/server.js"
pkill -f "vite"
```