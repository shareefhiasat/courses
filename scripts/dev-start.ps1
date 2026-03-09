# Military LMS Development Environment Startup Script

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Military LMS Development"

# Change to project root
Set-Location $PSScriptRoot\..

Write-Host "Starting Military LMS Development Environment..." -ForegroundColor Green

# Check Docker
try {
    docker info > $null 2>&1
} catch {
    Write-Host "ERROR: Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Clean up previous containers
Write-Host "Cleaning up previous containers..." -ForegroundColor Blue
docker-compose -f scripts/docker/docker-compose.dev.yml down -v 2>$null

# Start infrastructure
Write-Host "Starting infrastructure services..." -ForegroundColor Blue
docker-compose -f scripts/docker/docker-compose.dev.yml up -d

# Wait for MongoDB
Write-Host "Waiting for MongoDB..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Initialize MongoDB replica set
Write-Host "Initializing MongoDB replica set..." -ForegroundColor Blue
try {
    $rsStatus = docker exec lms-qaf-mongodb mongosh --eval "rs.status()" 2>$null
    if ($rsStatus -match "ok: 1") {
        Write-Host "MongoDB replica set already initialized" -ForegroundColor Green
    } else {
        docker exec lms-qaf-mongodb mongosh --eval "rs.initiate()" 2>$null
        Start-Sleep -Seconds 5
        Write-Host "MongoDB replica set initialized" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not initialize replica set (MongoDB may still be starting)" -ForegroundColor Yellow
}

# Wait for all services
Write-Host "Waiting for all services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Start Frontend and API Server
Write-Host "Starting application services..." -ForegroundColor Blue
Set-Location client

# Start API Server in background
Start-Process -FilePath "pnpm" -ArgumentList "run", "api" -WindowStyle Minimized

# Start Frontend in background
Start-Process -FilePath "pnpm" -ArgumentList "run", "dev" -WindowStyle Minimized

Set-Location ..

# Check service health
Write-Host "Checking service health..." -ForegroundColor Cyan

$mongodbCheck = try { docker exec lms-qaf-mongodb mongosh --eval "db.adminCommand('ping')" 2>$null } catch { $null }
Write-Host "   MongoDB: $(if ($LASTEXITCODE -eq 0) { 'Ready' } else { 'Not ready' })"

$redisCheck = try { docker exec lms-qaf-redis redis-cli ping 2>$null } catch { $null }
Write-Host "   Redis: $(if ($redisCheck -eq "PONG") { 'Ready' } else { 'Not ready' })"

$keycloakCheck = try { Invoke-WebRequest -Uri "http://localhost:8080/realms/master" -UseBasicParsing -TimeoutSec 5 2>$null } catch { $null }
Write-Host "   Keycloak: $(if ($keycloakCheck) { 'Ready' } else { 'Starting...' })"

$minioCheck = try { Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5 2>$null } catch { $null }
Write-Host "   MinIO: $(if ($minioCheck) { 'Ready' } else { 'Not ready' })"

$elasticsearchCheck = try { Invoke-WebRequest -Uri "http://localhost:9200/_cluster/health" -UseBasicParsing -TimeoutSec 5 2>$null } catch { $null }
Write-Host "   Elasticsearch: $(if ($elasticsearchCheck) { 'Ready' } else { 'Starting...' })"

$kibanaCheck = try { Invoke-WebRequest -Uri "http://localhost:5601/api/status" -UseBasicParsing -TimeoutSec 5 2>$null } catch { $null }
Write-Host "   Kibana: $(if ($kibanaCheck) { 'Ready' } else { 'Starting...' })"

$grafanaCheck = try { Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5 2>$null } catch { $null }
Write-Host "   Grafana: $(if ($grafanaCheck) { 'Ready' } else { 'Starting...' })"

$maildevCheck = try { Invoke-WebRequest -Uri "http://localhost:1080" -UseBasicParsing -TimeoutSec 5 2>$null } catch { $null }
Write-Host "   MailDev: $(if ($maildevCheck) { 'Ready' } else { 'Starting...' })"

Write-Host ""
Write-Host "Development Environment Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:   http://localhost:5174"
Write-Host "   API Server: https://localhost:3000"
Write-Host "   Swagger:    https://localhost:3000/api-docs"
Write-Host "   Prisma:    http://localhost:5555 (when running pnpm run db:studio)"
Write-Host ""
Write-Host "Infrastructure Services:" -ForegroundColor Cyan
Write-Host "   MongoDB:   localhost:27017 (Replica Set: rs0)"
Write-Host "   Redis:     localhost:6379"
Write-Host "   MinIO:     http://localhost:9000 / http://localhost:9001"
Write-Host "   Keycloak:  http://localhost:8080 / http://localhost:8080/admin"
Write-Host ""
Write-Host "Monitoring & Logging:" -ForegroundColor Cyan
Write-Host "   Kibana:        http://localhost:5601 (Logs)"
Write-Host "   Grafana:       http://localhost:3002 (Metrics)"
Write-Host "   Prometheus:    http://localhost:9091 (Metrics)"
Write-Host "   Elasticsearch: http://localhost:9200 (Search)"
Write-Host "   MailDev:       http://localhost:1080 (Email)"
Write-Host ""
Write-Host "Default Credentials:" -ForegroundColor Yellow
Write-Host "   MongoDB:   admin / admin123"
Write-Host "   MinIO:     minioadmin / minioadmin"
Write-Host "   Keycloak:  admin / admin123"
Write-Host "   Grafana:   admin / admin123"
Write-Host "   Redis:     Password: redis123"
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "   Stop everything:     docker-compose -f scripts/docker/docker-compose.dev.yml down"
Write-Host "   View logs:           docker-compose -f scripts/docker/docker-compose.dev.yml logs -f [service]"
Write-Host "   Access MongoDB:      docker exec lms-qaf-mongodb mongosh"
Write-Host "   Restart services:    docker-compose -f scripts/docker/docker-compose.dev.yml restart"
Write-Host ""
Write-Host "Development Tips:" -ForegroundColor Magenta
Write-Host "   - Frontend hot-reload enabled"
Write-Host "   - API server auto-restarts on changes"
Write-Host "   - MongoDB replica set enabled for Prisma transactions"
Write-Host "   - All services accessible via localhost"
Write-Host "   - Winston logs to Kibana via Logstash"
Write-Host "   - Email testing via MailDev"
Write-Host ""
Write-Host "Quick Test:" -ForegroundColor Green
Write-Host "   Test Categories: https://localhost:5174/dashboard?tab=categories"
Write-Host "   Test API:        curl https://localhost:3000/api/v1/health"
Write-Host "   Test Swagger:     https://localhost:3000/api-docs"
