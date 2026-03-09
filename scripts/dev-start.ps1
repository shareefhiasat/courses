# Military LMS Development Environment Startup Script

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Military LMS Development"

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

# Clean up previous containers
Write-Host "Cleaning up previous containers..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml down -v 2>$null

# Prune Docker system
Write-Host "Pruning Docker system..." -ForegroundColor Blue
docker system prune -f 2>$null

# Create necessary directories
Write-Host "Creating necessary directories..." -ForegroundColor Blue
New-Item -ItemType Directory -Force -Path "logs", "uploads", "backups" | Out-Null

# Start infrastructure services only
Write-Host "Starting Docker containers..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

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

$keycloakDbCheck = try { docker-compose -f docker-compose.dev.yml exec -T keycloak-db pg_isready -U keycloak -d keycloak 2>$null } catch { $null }
Write-Host "   Keycloak DB: $(if ($keycloakDbCheck) { 'Ready' } else { 'Not ready' })"

Write-Host ""
Write-Host "Infrastructure is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. From project root run: pnpm run dev"
Write-Host "   2. Visit: http://localhost:3000"
Write-Host ""
Write-Host "Available Infrastructure Services:" -ForegroundColor Cyan
Write-Host "   MongoDB:     localhost:27017"
Write-Host "   Redis:       localhost:6379"
Write-Host "   MinIO:       http://localhost:9000 (API) / http://localhost:9001 (Console)"
Write-Host "   Keycloak:    http://localhost:8080 (Auth) / http://localhost:8080/admin (Admin)"
Write-Host "   PostgreSQL:  localhost:5432 (Keycloak DB)"
Write-Host ""
Write-Host "Default Credentials:" -ForegroundColor Yellow
Write-Host "   MongoDB:     admin / admin123"
Write-Host "   MinIO:       minioadmin / minioadmin"
Write-Host "   Keycloak:    admin / admin123"
Write-Host "   Redis:       Password: redis123"
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:           docker-compose -f docker-compose.dev.yml logs -f [service]"
Write-Host "   Stop services:       docker-compose -f docker-compose.dev.yml down"
Write-Host "   Reset everything:     docker-compose -f docker-compose.dev.yml down -v; docker system prune -f"
Write-Host "   Access MongoDB:      docker-compose -f docker-compose.dev.yml exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin"
Write-Host "   Access Redis:        docker-compose -f docker-compose.dev.yml exec redis redis-cli -a redis123"
Write-Host "   Access MinIO:         docker-compose -f docker-compose.dev.yml exec minio mc ls local"
Write-Host ""
Write-Host "Application Commands:" -ForegroundColor Magenta
Write-Host "   Start frontend:      pnpm run dev"
Write-Host "   Generate Prisma:     pnpm run db:generate"
Write-Host "   Prisma Studio:       pnpm run db:studio"
Write-Host "   Build for prod:      pnpm run build"
Write-Host ""
Write-Host "Architecture Info:" -ForegroundColor Magenta
Write-Host "   - Single Vite build (Frontend plus Database Services)"
Write-Host "   - Infrastructure runs in Docker only"
Write-Host "   - No backend container needed"
Write-Host "   - Application connects to localhost services"
Write-Host ""
Write-Host "Development Tips:" -ForegroundColor Magenta
Write-Host "   - Frontend hot-reload is enabled"
Write-Host "   - Prisma auto-generates client on schema changes"
Write-Host "   - Database operations use MongoDB via Prisma"
Write-Host "   - All services accessible via localhost"
