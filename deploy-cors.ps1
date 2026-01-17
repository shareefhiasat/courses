# PowerShell script to deploy CORS configuration to Firebase Storage
# This script uses Firebase REST API to set CORS configuration

$projectId = "main-one-32026"
$bucketName = "main-one-32026.appspot.com"

# Get Firebase auth token
Write-Host "Getting Firebase auth token..."
$authToken = firebase login:ci
if (-not $authToken) {
    # Try to get token from existing session
    $authToken = firebase login:print
}

if (-not $authToken) {
    Write-Host "Please run 'firebase login' first to authenticate"
    exit 1
}

# CORS configuration
$corsConfig = @"
[
    {
        "origin": [
            "http://localhost:5173",
            "http://localhost:5174", 
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:3000",
            "https://main-one-32026.web.app",
            "https://main-one-32026.firebaseapp.com",
            "https://qaf.academy",
            "*"
        ],
        "method": ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "responseHeader": [
            "Content-Type",
            "Authorization",
            "x-goog-resumable",
            "x-goog-upload-url", 
            "x-goog-upload-status",
            "x-goog-upload-offset",
            "x-goog-upload-command",
            "x-goog-upload-protocol",
            "x-firebase-appcheck",
            "x-goog-meta-*",
            "Content-Length",
            "Content-Encoding",
            "Accept",
            "Accept-Encoding",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "Cache-Control",
            "Content-Disposition"
        ],
        "maxAgeSeconds": 3600
    }
]
"@

# Set CORS configuration using Google Cloud Storage API
$url = "https://storage.googleapis.com/storage/v1/b/$bucketName?fields=cors"
$headers = @{
    "Authorization" = "Bearer $authToken"
    "Content-Type" = "application/json"
}

Write-Host "Deploying CORS configuration to Firebase Storage..."
try {
    $response = Invoke-RestMethod -Uri $url -Method Patch -Headers $headers -Body $corsConfig
    Write-Host "✅ CORS configuration deployed successfully!"
    Write-Host "Response: $response"
} catch {
    Write-Host "❌ Failed to deploy CORS configuration: $_"
    Write-Host "You may need to set up CORS manually in the Firebase Console:"
    Write-Host "1. Go to Firebase Console → Storage → Configuration"
    Write-Host "2. Upload the cors.json file manually"
}
