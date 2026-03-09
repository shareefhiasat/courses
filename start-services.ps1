# Start Services Script for Courses Project
# This script starts all required services

Write-Host "🚀 Starting Courses Services..." -ForegroundColor Green

# Start MongoDB Replica Set (No Auth)
Write-Host "📦 Starting MongoDB Replica Set..." -ForegroundColor Blue
docker stop courses-mongodb 2>$null
docker rm courses-mongodb 2>$null
docker run -d --name courses-mongodb -p 27017:27017 --restart always mongo:7.0 --replSet rs0 --bind_ip_all

# Wait for MongoDB
Start-Sleep -Seconds 5

# Initialize replica set
Write-Host "🔧 Initializing MongoDB Replica Set..." -ForegroundColor Blue
docker exec courses-mongodb mongosh --eval "rs.initiate()" 2>$null
Start-Sleep -Seconds 3

# Check status
Write-Host "🔍 Checking MongoDB Status..." -ForegroundColor Blue
docker exec courses-mongodb mongosh --eval "rs.status()" --quiet

# Start API Server
Write-Host "🔧 Starting API Server..." -ForegroundColor Blue
Set-Location client
Start-Process -FilePath "pnpm" -ArgumentList "run", "api" -WindowStyle Minimized
Set-Location ..

# Start Frontend
Write-Host "🌐 Starting Frontend..." -ForegroundColor Blue
Set-Location client
Start-Process -FilePath "pnpm" -ArgumentList "run", "dev" -WindowStyle Minimized
Set-Location ..

Write-Host ""
Write-Host "✅ All Services Started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: https://localhost:5174" -ForegroundColor Cyan
Write-Host "🔧 API Server: https://localhost:3000" -ForegroundColor Cyan
Write-Host "📊 MongoDB: localhost:27017 (Replica Set: rs0)" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Test Commands:" -ForegroundColor Yellow
Write-Host "  curl https://localhost:3000/api/v1/health" -ForegroundColor Gray
Write-Host "  curl https://localhost:3000/api/v1/categories" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Logs:" -ForegroundColor Yellow
Write-Host "  MongoDB: docker logs courses-mongodb -f" -ForegroundColor Gray
Write-Host "  API Server: Check terminal window" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 Stop Services:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.mongodb.yml down" -ForegroundColor Gray
Write-Host "  Stop API Server: Ctrl+C in terminal" -ForegroundColor Gray
Write-Host "  Stop Frontend: Ctrl+C in terminal" -ForegroundColor Gray
