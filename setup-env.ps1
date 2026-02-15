# Environment Setup Script for QAF Courses (Windows PowerShell)
# This script helps you set up secure environment variables

Write-Host "QAF Courses - Environment Setup Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if .env.local already exists
if (Test-Path ".env.local") {
    Write-Host "WARNING: .env.local already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite it? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit 1
    }
}

# Copy template to .env.local
Write-Host "Creating .env.local from template..." -ForegroundColor Green
Copy-Item ".env.example" ".env.local"

Write-Host ""
Write-Host "Please edit .env.local with your actual credentials:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Required for basic functionality:" -ForegroundColor White
Write-Host "   • VITE_DEFAULT_FROM_EMAIL=your-email@gmail.com" -ForegroundColor Gray
Write-Host "   • VITE_DEFAULT_REPLY_TO=your-email@gmail.com" -ForegroundColor Gray
Write-Host "   • VITE_TEST_EMAIL=your-test-email@gmail.com" -ForegroundColor Gray
Write-Host ""
Write-Host "   Required for Firebase:" -ForegroundColor White
Write-Host "   • VITE_FIREBASE_API_KEY=your-api-key" -ForegroundColor Gray
Write-Host "   • VITE_FIREBASE_PROJECT_ID=your-project-id" -ForegroundColor Gray
Write-Host "   • VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com" -ForegroundColor Gray
Write-Host "   • ... (other Firebase config)" -ForegroundColor Gray
Write-Host ""
Write-Host "   Optional services:" -ForegroundColor White
Write-Host "   • VITE_QSTASH_TOKEN=your-qstash-token (email service)" -ForegroundColor Gray
Write-Host "   • VITE_PUBLIC_POSTHOG_KEY=your-posthog-key (analytics)" -ForegroundColor Gray
Write-Host "   • VITE_SENTRY_DSN=your-sentry-dsn (error tracking)" -ForegroundColor Gray
Write-Host ""
Write-Host "See ENVIRONMENT_SETUP.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""

# Open in default editor
if (Get-Command code -ErrorAction SilentlyContinue) {
    Write-Host "Opening .env.local in VS Code..." -ForegroundColor Green
    code .env.local
} elseif (Get-Command notepad -ErrorAction SilentlyContinue) {
    Write-Host "Opening .env.local in Notepad..." -ForegroundColor Green
    notepad .env.local
} else {
    Write-Host "Please manually edit .env.local with your credentials" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup complete! After editing .env.local:" -ForegroundColor Green
Write-Host "   1. Run 'npm run dev' to test your setup" -ForegroundColor White
Write-Host "   2. Check the console for loaded environment variables" -ForegroundColor White
Write-Host "   3. Commit .env.example but NOT .env.local" -ForegroundColor White
Write-Host ""
Write-Host "Security reminder: Never commit .env.local to version control!" -ForegroundColor Red
