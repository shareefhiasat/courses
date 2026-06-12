#!/bin/bash

# Script to extract and restore data from backup to current database
# Backup location: /Users/shareef/Projects/GitHub/Personal/courses/backups/volumes-20260329-205419/app-db.sql

BACKUP_FILE="/Users/shareef/Projects/GitHub/Personal/courses/backups/volumes-20260329-205419/app-db.sql"
OUTPUT_FILE="/tmp/restore-data-v2.sql"

# Tables that exist in both backup and current schema with compatible structure
TABLES_TO_RESTORE=(
    "academic_terms"
    "activity_log_action_types"
    "activity_types"
    "assessment_types"
    "attendance_status_types"
    "behavior_types"
    "category_types"
    "config_types"
    "enrollment_status_types"
    "help_items"
    "participation_types"
    "penalty_types"
    "priority_types"
    "question_difficulty_types"
    "question_types"
    "quiz_status_types"
    "requirement_types"
    "resource_types"
    "schedule_types"
    "subject_types"
    "submission_status_types"
    "target_audience_types"
    "template_types"
    "user_roles"
    "user_status_types"
)

echo "-- Data restoration script generated at $(date)" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "-- Disabling triggers for faster import" >> "$OUTPUT_FILE"
echo "SET session_replication_role = 'replica';" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Extract data for tables without differences
for table in "${TABLES_TO_RESTORE[@]}"; do
    echo "Extracting data for $table..."
    awk "/^COPY public\\.$table /,/^\\\\.$/" "$BACKUP_FILE" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done

# Extract subjects data (should be compatible)
echo "Extracting data for subjects..."
awk '/^COPY public\.subjects /,/^\\.$/' "$BACKUP_FILE" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "-- Re-enabling triggers" >> "$OUTPUT_FILE"
echo "SET session_replication_role = 'origin';" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "-- Updating sequences" >> "$OUTPUT_FILE"
echo "SELECT setval('public.subjects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.subjects));" >> "$OUTPUT_FILE"

echo "Data extraction complete. Output file: $OUTPUT_FILE"
echo "To import, run: docker exec -i lms-qaf-app-db psql -U military_lms -d military_lms < $OUTPUT_FILE"
