# Import Military LMS Realm into existing Keycloak
Write-Host "🔐 Importing Military LMS realm into Keycloak..." -ForegroundColor Green

# Get admin token
Write-Host "🔑 Getting admin token..." -ForegroundColor Yellow
$tokenResponse = curl -X POST http://localhost:8080/realms/master/protocol/openid-connect/token -H "Content-Type: application/x-www-form-urlencoded" -d "grant_type=password&username=admin&password=admin&client_id=admin-cli"
$token = ($tokenResponse | ConvertFrom-Json).access_token

if (-not $token) {
    Write-Host "❌ Failed to get admin token" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Admin token obtained" -ForegroundColor Green

# Check if realm already exists
Write-Host "🔍 Checking if realm exists..." -ForegroundColor Yellow
try {
    $existingRealm = curl -H "Authorization: Bearer $token" http://localhost:8080/admin/realms/military-lms 2>$null
    if ($existingRealm -and $existingRealm -notmatch "404") {
        Write-Host "⚠️  Realm already exists, deleting..." -ForegroundColor Yellow
        
        # Delete existing realm
        curl -X DELETE -H "Authorization: Bearer $token" http://localhost:8080/admin/realms/military-lms
        Write-Host "✅ Existing realm deleted" -ForegroundColor Green
        
        # Wait a moment
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "✅ Realm does not exist, creating new one" -ForegroundColor Green
}

# Import new realm
Write-Host "📥 Importing new realm..." -ForegroundColor Yellow
$importResponse = curl -X POST http://localhost:8080/admin/realms -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d @realm-military-lms.json

if ($importResponse -match "201|200") {
    Write-Host "🎉 Realm imported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Realm Details:" -ForegroundColor Cyan
    Write-Host "📍 Realm: military-lms" -ForegroundColor White
    Write-Host "🔗 Client: military-lms-app" -ForegroundColor White
    Write-Host "👤 Super Admin: shareef.hiasat@gmail.com" -ForegroundColor White
    Write-Host "🔐 Password: Test123@" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 URLs:" -ForegroundColor Cyan
    Write-Host "📱 Keycloak Admin: http://localhost:8080/admin" -ForegroundColor White
    Write-Host "🔐 Login URL: http://localhost:8080/realms/military-lms/protocol/openid-connect/auth" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Ready for integration!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to import realm" -ForegroundColor Red
    Write-Host "Response: $importResponse" -ForegroundColor Red
    exit 1
}
