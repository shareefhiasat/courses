# Military LMS Service Management Script
# Purpose: Start/stop backend and frontend services with proper environment configuration

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action = "start",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "production")]
    [string]$Environment = "development"
)

Write-Host "🚀 Military LMS Service Management" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
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
        Write-Host "🔧 Killing process $pid on port $Port" -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

# Function to start backend
function Start-Backend {
    Write-Host "🔧 Starting Backend API Server..." -ForegroundColor Blue
    
    # Check if port 8080 is available
    if (Test-Port -Port 8080) {
        Write-Host "⚠️ Port 8080 is already in use. Killing existing process..." -ForegroundColor Yellow
        Kill-PortProcess -Port 8080
        Start-Sleep -Seconds 2
    }
    
    # Start backend server
    Write-Host "📡 Backend API will be available at: http://localhost:8080" -ForegroundColor Green
    Write-Host "📚 Swagger Documentation: http://localhost:8080/api-docs" -ForegroundColor Green
    
    Set-Location $PSScriptRoot
    $backendJob = Start-Job -ScriptBlock {
        param($ProjectRoot)
        Set-Location $ProjectRoot
        pnpm api:dev
    } -ArgumentList $PSScriptRoot
    
    Write-Host "✅ Backend server started (Job ID: $($backendJob.Id))" -ForegroundColor Green
    return $backendJob
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🔧 Starting Frontend Development Server..." -ForegroundColor Blue
    
    # Check if port 3000 is available
    if (Test-Port -Port 3000) {
        Write-Host "⚠️ Port 3000 is already in use. Killing existing process..." -ForegroundColor Yellow
        Kill-PortProcess -Port 3000
        Start-Sleep -Seconds 2
    }
    
    # Start frontend server
    Write-Host "🌐 Frontend will be available at: http://localhost:3000" -ForegroundColor Green
    
    Set-Location (Join-Path $PSScriptRoot "client")
    $frontendJob = Start-Job -ScriptBlock {
        param($ClientDir)
        Set-Location $ClientDir
        pnpm dev
    } -ArgumentList (Join-Path $PSScriptRoot "client")
    
    Set-Location $PSScriptRoot
    Write-Host "✅ Frontend server started (Job ID: $($frontendJob.Id))" -ForegroundColor Green
    return $frontendJob
}

# Function to stop services
function Stop-Services {
    Write-Host "🛑 Stopping all services..." -ForegroundColor Red
    
    # Kill Node processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "🔧 Killing Node processes..." -ForegroundColor Yellow
        $nodeProcesses | Stop-Process -Force
        Write-Host "✅ Node processes stopped" -ForegroundColor Green
    }
    
    # Remove jobs
    Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Background jobs cleared" -ForegroundColor Green
}

# Function to show service status
function Show-Status {
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    Write-Host ""
    
    # Check backend
    if (Test-Port -Port 8080) {
        Write-Host "✅ Backend API: RUNNING (http://localhost:8080)" -ForegroundColor Green
        try {
            $healthResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -TimeoutSec 5
            Write-Host "   Server: $($healthResponse.server)" -ForegroundColor Gray
            Write-Host "   Version: $($healthResponse.version)" -ForegroundColor Gray
            Write-Host "   Environment: $($healthResponse.environment)" -ForegroundColor Gray
        }
        catch {
            Write-Host "   ⚠️ Health check failed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Backend API: STOPPED" -ForegroundColor Red
    }
    
    # Check frontend
    if (Test-Port -Port 3000) {
        Write-Host "✅ Frontend: RUNNING (http://localhost:3000)" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend: STOPPED" -ForegroundColor Red
    }
    
    # Show jobs
    $jobs = Get-Job
    if ($jobs) {
        Write-Host ""
        Write-Host "📋 Background Jobs:" -ForegroundColor Cyan
        foreach ($job in $jobs) {
            $status = if ($job.State -eq "Running") { "🟢 RUNNING" } else { "🔴 STOPPED" }
            Write-Host "   Job $($job.Id): $status - $($job.Name)" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "📚 Available URLs:" -ForegroundColor Cyan
    Write-Host "   Backend API: http://localhost:8080/api/v1" -ForegroundColor Gray
    Write-Host "   Swagger Docs: http://localhost:8080/api-docs" -ForegroundColor Gray
    Write-Host "   Health Check: http://localhost:8080/api/health" -ForegroundColor Gray
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
}

# Main execution
switch ($Action) {
    "start" {
        Stop-Services
        Start-Sleep -Seconds 2
        $backendJob = Start-Backend
        Start-Sleep -Seconds 3
        $frontendJob = Start-Frontend
        
        Write-Host ""
        Write-Host "🎉 Services started successfully!" -ForegroundColor Green
        Write-Host "Use '$($MyInvocation.MyCommand.Name) status' to check status" -ForegroundColor Cyan
        Write-Host "Use '$($MyInvocation.MyCommand.Name) stop' to stop all services" -ForegroundColor Cyan
    }
    
    "stop" {
        Stop-Services
        Write-Host ""
        Write-Host "🛑 All services stopped" -ForegroundColor Green
    }
    
    "restart" {
        Stop-Services
        Start-Sleep -Seconds 2
        $backendJob = Start-Backend
        Start-Sleep -Seconds 3
        $frontendJob = Start-Frontend
        Write-Host ""
        Write-Host "🔄 Services restarted successfully!" -ForegroundColor Green
    }
    
    "status" {
        Show-Status
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
