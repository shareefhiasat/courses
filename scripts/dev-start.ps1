# Military LMS Development Environment Startup Script

# Change to project root directory
Set-Location $PSScriptRoot\..

Write-Host "Starting Military LMS Development Environment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info > $null 2>&1
} catch {
    Write-Host "ERROR: Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "Creating necessary directories..." -ForegroundColor Blue
New-Item -ItemType Directory -Force -Path "logs", "uploads", "backups" | Out-Null

# Start all services
Write-Host "Starting Docker containers..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

# Check service health
Write-Host "Checking service health..." -ForegroundColor Cyan

$mongodbCheck = try { docker-compose -f docker-compose.dev.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" 2>$null } catch { $null }
Write-Host "   MongoDB: $(if ($LASTEXITCODE -eq 0) { 'Ready' } else { 'Not ready' })"

$keycloakCheck = try { Invoke-WebRequest -Uri "http://localhost:8080/realms/master" -UseBasicParsing -TimeoutSec 5 2>$null } catch { $null }
Write-Host "   Keycloak: $(if ($keycloakCheck) { 'Ready' } else { 'Starting...' })"

$minioCheck = try { Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5 2>$null } catch { $null }
Write-Host "   MinIO: $(if ($minioCheck) { 'Ready' } else { 'Not ready' })"

$redisCheck = try { docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping 2>$null } catch { $null }
Write-Host "   Redis: $(if ($redisCheck -eq "PONG") { 'Ready' } else { 'Not ready' })"

$elasticsearchCheck = try { Invoke-WebRequest -Uri "http://localhost:9200/_cluster/health" -UseBasicParsing -TimeoutSec 5 2>$null } catch { $null }
Write-Host "   Elasticsearch: $(if ($elasticsearchCheck) { 'Ready' } else { 'Not ready' })"

# Run database migrations
Write-Host "Running database migrations..." -ForegroundColor Blue
try {
    docker-compose -f docker-compose.dev.yml exec -T backend npx prisma db push 2>$null
    Write-Host "Database migrations completed" -ForegroundColor Green
} catch {
    Write-Host "Database migrations failed" -ForegroundColor Red
}

# Seed database with Firestore data
Write-Host "Importing Firestore data to MongoDB..." -ForegroundColor Green
try {
    docker-compose -f docker-compose.dev.yml exec -T backend node /app/scripts/import-firestore-data.js 2>$null
    Write-Host "✅ Firestore data imported successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Firestore import failed or data already exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Available services:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000"
Write-Host "   Backend API: http://localhost:5000"
Write-Host "   Keycloak Admin: http://localhost:8080/admin"
Write-Host "   MinIO Console: http://localhost:9001"
Write-Host "   Kibana: http://localhost:5601"
Write-Host "   MailDev: http://localhost:1080"
Write-Host "   Jasper Reports: http://localhost:8081"
Write-Host ""
Write-Host "Default Credentials:" -ForegroundColor Yellow
Write-Host "   MongoDB: admin / admin123"
Write-Host "   MinIO: minioadmin / minioadmin"
Write-Host "   Redis: (no auth)"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose -f docker-compose.dev.yml logs -f [service]"
Write-Host "   Stop services: docker-compose -f docker-compose.dev.yml down"
Write-Host "   Reset database: docker-compose -f docker-compose.dev.yml down -v; .\scripts\dev-start.ps1"
Write-Host "   Access backend: docker-compose -f docker-compose.dev.yml exec backend bash"
Write-Host "   Access database: docker-compose -f docker-compose.dev.yml exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin"
Write-Host "   Prisma Studio: docker-compose -f docker-compose.dev.yml exec backend npx prisma studio --hostname 0.0.0.0"
Write-Host ""
Write-Host "Quick Development Tips:" -ForegroundColor Magenta
Write-Host "   - Frontend hot-reload is enabled"
Write-Host "   - Backend auto-restarts on file changes"
Write-Host "   - Database changes are auto-migrated with Prisma"
Write-Host "   - All logs are sent to ELK stack"
Write-Host "   - Email testing via MailDev at http://localhost:1080"
