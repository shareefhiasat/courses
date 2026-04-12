# Backup Docker Volumes Script
# Run this to backup important volumes before major changes

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Docker Volumes Backup"

Set-Location $PSScriptRoot\..

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "backups\volumes-$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Write-Host "Creating volume backups in $backupDir..." -ForegroundColor Green

# Keycloak database (most important)
Write-Host "Backing up Keycloak database..." -ForegroundColor Blue
docker exec lms-qaf-keycloak-db pg_dump -U keycloak keycloak > "$backupDir\keycloak-db.sql"

# Application database
Write-Host "Backing up Application database..." -ForegroundColor Blue
docker exec lms-qaf-app-db pg_dump -U military_lms military_lms > "$backupDir\app-db.sql"

# Nextcloud database
Write-Host "Backing up Nextcloud database..." -ForegroundColor Blue
docker exec lms-qaf-nextcloud-db pg_dump -U nextcloud nextcloud > "$backupDir\nextcloud-db.sql"

# MinIO data (files)
Write-Host "Backing up MinIO data..." -ForegroundColor Blue
docker run --rm -v docker_minio_dev_data:/source -v "${PWD}:/backup" alpine tar czf /backup/$backupDir/minio-data.tar.gz -C /source .

# Nextcloud data
Write-Host "Backing up Nextcloud data..." -ForegroundColor Blue
docker run --rm -v docker_nextcloud_data:/source -v "${PWD}:/backup" alpine tar czf /backup/$backupDir/nextcloud-data.tar.gz -C /source .

Write-Host ""
Write-Host "Backup completed!" -ForegroundColor Green
Write-Host "Location: $backupDir"
Write-Host ""
Write-Host "To restore Keycloak:" -ForegroundColor Yellow
Write-Host "  docker exec -i lms-qaf-keycloak-db psql -U keycloak keycloak < $backupDir\keycloak-db.sql"
Write-Host ""
Write-Host "To restore App DB:" -ForegroundColor Yellow
Write-Host "  docker exec -i lms-qaf-app-db psql -U military_lms military_lms < $backupDir\app-db.sql"
