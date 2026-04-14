# Generate self-signed SSL certificates for local development
# Usage: .\scripts\docker\generate-ssl-certs.ps1

$ErrorActionPreference = "Stop"

Write-Host "Generating self-signed SSL certificates for local development..." -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$sslDir = Join-Path $projectRoot "docker\nginx\ssl"

# Create SSL directory if it doesn't exist
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir -Force | Out-Null
    Write-Host "Created SSL directory: $sslDir" -ForegroundColor Green
}

$certPath = Join-Path $sslDir "cert.pem"
$keyPath = Join-Path $sslDir "key.pem"

# Check if certificates already exist
if ((Test-Path $certPath) -and (Test-Path $keyPath)) {
    $response = Read-Host "SSL certificates already exist. Overwrite? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Skipping certificate generation." -ForegroundColor Yellow
        exit
    }
}

# Generate self-signed certificate using OpenSSL
# Note: OpenSSL must be installed and in PATH
Write-Host "Generating certificate..." -ForegroundColor Cyan

openssl req -x509 -newkey rsa:4096 -keyout $keyPath -out $certPath -days 365 -nodes `
    -subj "/C=QA/ST=Doha/L=Doha/O=MilitaryLMS/OU=Development/CN=localhost" `
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSL certificates generated successfully!" -ForegroundColor Green
    Write-Host "Certificate: $certPath" -ForegroundColor Gray
    Write-Host "Private Key: $keyPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  These are self-signed certificates for development only." -ForegroundColor Yellow
    Write-Host "   Your browser will show a security warning - this is expected." -ForegroundColor Yellow
    Write-Host "   For production, use certificates from your cyber team (F5 wildcard)." -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to generate SSL certificates." -ForegroundColor Red
    Write-Host "Make sure OpenSSL is installed and in your PATH." -ForegroundColor Red
    exit 1
}
