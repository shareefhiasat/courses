# Military LMS Service Management Script
# Purpose: Start/stop backend and frontend services

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action = "start"
)

Write-Host "Military LMS Service Management" -ForegroundColor Green
Write-Host "Action: $Action" -ForegroundColor Yellow
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to kill processes on specific port
function Kill-PortProcess {
    param([int]$Port)
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($process) {
        $pid = $process.OwningProcess
        Write-Host "Killing process $pid on port $Port" -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

# Function to stop services
function Stop-Services {
    Write-Host "Stopping all services..." -ForegroundColor Red
    
    # Kill Node processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "Killing Node processes..." -ForegroundColor Yellow
        $nodeProcesses | Stop-Process -Force
        Write-Host "Node processes stopped" -ForegroundColor Green
    }
    
    # Remove jobs
    Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
    Write-Host "Background jobs cleared" -ForegroundColor Green
}

# Function to show service status
function Show-Status {
    Write-Host "Service Status:" -ForegroundColor Cyan
    Write-Host ""
    
    # Check backend
    if (Test-Port -Port 8080) {
        Write-Host "Backend API: RUNNING (http://localhost:8080)" -ForegroundColor Green
        try {
            $healthResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -TimeoutSec 5
            Write-Host "  Server: $($healthResponse.server)" -ForegroundColor Gray
            Write-Host "  Version: $($healthResponse.version)" -ForegroundColor Gray
            Write-Host "  Environment: $($healthResponse.environment)" -ForegroundColor Gray
        }
        catch {
            Write-Host "  Health check failed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Backend API: STOPPED" -ForegroundColor Red
    }
    
    # Check frontend
    if (Test-Port -Port 3000) {
        Write-Host "Frontend: RUNNING (http://localhost:3000)" -ForegroundColor Green
    } else {
        Write-Host "Frontend: STOPPED" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Available URLs:" -ForegroundColor Cyan
    Write-Host "  Backend API: http://localhost:8080/api/v1" -ForegroundColor Gray
    Write-Host "  Swagger Docs: http://localhost:8080/api-docs" -ForegroundColor Gray
    Write-Host "  Health Check: http://localhost:8080/api/health" -ForegroundColor Gray
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Gray
}

# Main execution
switch ($Action) {
    "start" {
        Write-Host "Starting services..." -ForegroundColor Blue
        Write-Host "Backend API will be available at: http://localhost:8080" -ForegroundColor Green
        Write-Host "Swagger Documentation: http://localhost:8080/api-docs" -ForegroundColor Green
        Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Green
        Write-Host ""
        Write-Host "To start services manually:" -ForegroundColor Cyan
        Write-Host "1. Backend: pnpm api:dev" -ForegroundColor Gray
        Write-Host "2. Frontend: cd client && pnpm dev" -ForegroundColor Gray
    }
    
    "stop" {
        Stop-Services
        Write-Host ""
        Write-Host "All services stopped" -ForegroundColor Green
    }
    
    "restart" {
        Stop-Services
        Write-Host "Services stopped. Restart manually:" -ForegroundColor Yellow
        Write-Host "1. Backend: pnpm api:dev" -ForegroundColor Gray
        Write-Host "2. Frontend: cd client && pnpm dev" -ForegroundColor Gray
    }
    
    "status" {
        Show-Status
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
