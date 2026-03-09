# Stop Services Script for Courses Project
# This script stops all running services

Write-Host "🛑 Stopping Courses Services..." -ForegroundColor Red

# Stop MongoDB
Write-Host "📦 Stopping MongoDB..." -ForegroundColor Blue
docker stop courses-mongodb 2>$null
docker rm courses-mongodb 2>$null

# Stop API Server and Frontend
Write-Host "🔧 Stopping API Server and Frontend..." -ForegroundColor Blue
Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.MainWindowTitle -like "*pnpm*"} | Stop-Process -Force

Write-Host ""
Write-Host "✅ All Services Stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Services Status:" -ForegroundColor Yellow
Write-Host "  MongoDB: Stopped" -ForegroundColor Gray
Write-Host "  API Server: Stopped" -ForegroundColor Gray
Write-Host "  Frontend: Stopped" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Start Again:" -ForegroundColor Yellow
Write-Host "  ./start-services.ps1" -ForegroundColor Gray
