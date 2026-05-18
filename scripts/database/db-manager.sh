#!/bin/bash
set -euo pipefail

CONTAINER="lms-qaf-app-db"
DB_USER="military_lms"
DB_NAME="military_lms"

cmd=${1:-prompt}

case "$cmd" in
  prompt|connect)
    echo "Connecting to PostgreSQL..."
    docker exec -it "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
    ;;
  query|sql)
    shift
    docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$*"
    ;;
  list|tables)
    docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"
    ;;
  describe)
    shift
    docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "\d $1"
    ;;
  count)
    shift
    docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM $1;"
    ;;
  import|restore)
    shift
    file="$1"
    if [ ! -f "$file" ]; then
      echo "Error: File not found: $file"
      exit 1
    fi
    echo "Importing $file into $DB_NAME..."
    docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$file"
    echo "Done."
    ;;
  export|backup)
    shift
    out="${1:-backup_$(date +%Y%m%d_%H%M%S).sql}"
    docker exec -i "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$out"
    echo "Exported to: $out"
    ;;
  health|check)
    docker exec -i "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME"
    ;;
  *)
    echo "Usage: $0 {prompt|query|list|describe|count|import|export|health}"
    echo ""
    echo "  prompt    - Open interactive psql shell"
    echo "  query     - Run SQL query: $0 query 'SELECT * FROM users;'"
    echo "  list      - List all tables"
    echo "  describe  - Describe table: $0 describe users"
    echo "  count     - Count rows: $0 count users"
    echo "  import    - Import SQL file: $0 import backup.sql"
    echo "  export    - Export database to file"
    echo "  health    - Check database connectivity"
    exit 1
    ;;
esac
