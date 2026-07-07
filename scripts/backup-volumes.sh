#!/bin/bash
set -euo pipefail

# Backup Docker Volumes Script for macOS/Linux
# Run this before major changes or as a routine backup

# Move to repo root (where this script lives in scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

timestamp=$(date +%Y%m%d-%H%M%S)
backupDir="backups/volumes-$timestamp"
mkdir -p "$backupDir"

echo "Creating volume backups in $backupDir..."

# Keycloak database (most important)
echo "Backing up Keycloak database..."
docker exec lms-qaf-keycloak-db pg_dump -U keycloak keycloak > "$backupDir/keycloak-db.sql"

# Application database (Prisma/PostgreSQL)
echo "Backing up Application database..."
docker exec lms-qaf-app-db pg_dump -U military_lms military_lms > "$backupDir/app-db.sql"

# MinIO data (files)
echo "Backing up MinIO data..."
docker run --rm -v qaf-lms_minio_data:/source -v "${PWD}:/backup" alpine tar czf "/backup/$backupDir/minio-data.tar.gz" -C /source .

# Redis data (optional, can usually be recreated)
echo "Backing up Redis data..."
docker exec lms-qaf-redis redis-cli -a redis123 --raw SAVE >/dev/null 2>&1 || true
docker run --rm -v qaf-lms_redis_data:/source -v "${PWD}:/backup" alpine tar czf "/backup/$backupDir/redis-data.tar.gz" -C /source . 2>/dev/null || echo "Redis backup skipped (optional)."

echo ""
echo "Backup completed!"
echo "Location: $backupDir"
echo ""
echo "To restore Keycloak DB:"
echo "  docker exec -i lms-qaf-keycloak-db psql -U keycloak keycloak < $backupDir/keycloak-db.sql"
echo ""
echo "To restore App DB:"
echo "  docker exec -i lms-qaf-app-db psql -U military_lms military_lms < $backupDir/app-db.sql"
