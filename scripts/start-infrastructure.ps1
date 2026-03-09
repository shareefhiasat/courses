# Simple Infrastructure Start Script

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Military LMS Infrastructure"

Write-Host "Starting Military LMS Infrastructure..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info > $null 2>&1
} catch {
    Write-Host "ERROR: Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Change to project root
Set-Location $PSScriptRoot\..

# Clean up and start fresh
Write-Host "Cleaning up containers..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml down -v 2>$null

# Start infrastructure services
Write-Host "Starting infrastructure services..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml up -d

# Wait for services
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Infrastructure ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. From project root run: pnpm run dev"
Write-Host "   2. Visit: http://localhost:5174"
Write-Host ""
Write-Host "Services available:" -ForegroundColor Cyan
Write-Host "   MongoDB: localhost:27017"
Write-Host "   Redis: localhost:6379"
Write-Host "   MinIO: http://localhost:9000 / http://localhost:9001"
Write-Host "   Keycloak: http://localhost:8080"
Write-Host ""
Write-Host "Credentials:" -ForegroundColor Yellow
Write-Host "   MongoDB: admin / admin123"
Write-Host "   MinIO: minioadmin / minioadmin"
Write-Host "   Keycloak: admin / admin123"
