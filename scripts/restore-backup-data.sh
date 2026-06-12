#!/bin/bash

# Script to extract and restore data from backup to current database
# Backup location: /Users/shareef/Projects/GitHub/Personal/courses/backups/volumes-20260329-205419/app-db.sql

BACKUP_FILE="/Users/shareef/Projects/GitHub/Personal/courses/backups/volumes-20260329-205419/app-db.sql"
OUTPUT_FILE="/tmp/restore-data.sql"

# Tables that exist in both backup and current schema (data-only restore)
# We'll skip tables that have structural differences or don't exist in current schema
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

# Tables with column differences - need special handling
TABLES_WITH_DIFFS=(
    "users"           # Current has additional image fields
    "programs"        # Current has flexible scheduling fields
    "classes"         # Current has capacity field
    "subjects"        # Should be compatible
)

echo "# Data restoration script generated at $(date)" > "$OUTPUT_FILE"
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

# Extract users data (handle column differences)
echo "Extracting data for users (with column mapping)..."
awk '/^COPY public\.users /,/^\\.$/' "$BACKUP_FILE" | \
    sed 's/COPY public\.users (id, email, "firstName", "lastName", "displayName", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "keycloakId", "realName", sequence, "studentNumber") FROM stdin;/COPY public.users (id, email, "firstName", "lastName", "displayName", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt", "keycloakId", "realName", sequence, "studentNumber", additionalImageUrl, militaryIdImageUrl, profileImageUrl, qidImageUrl) FROM stdin;/' | \
    sed 's/\t$/\t\\N\t\\N\t\\N\t\\N/' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Extract programs data (handle column differences)
echo "Extracting data for programs (with column mapping)..."
awk '/^COPY public\.programs /,/^\\.$/' "$BACKUP_FILE" | \
    sed 's/COPY public\.programs (id, code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "durationYears", "minGPA", "totalCreditHours", "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;/COPY public.programs (id, code, "nameEn", "nameAr", "descriptionEn", "descriptionAr", "durationYears", "minGPA", "totalCreditHours, durationType, durationValue, startDate, endDate, categoryId, targetAudience, "isActive", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;/' | \
    sed 's/\t$/\tACADEMIC_SEMESTER\t\\N\t\\N\t\\N\t\\N\t\\N/' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Extract classes data (handle column differences)
echo "Extracting data for classes (with column mapping)..."
awk '/^COPY public\.classes /,/^\\.$/' "$BACKUP_FILE" | \
    sed 's/COPY public\.classes (id, code, "nameEn", "nameAr", "maxCapacity", "isActive", "programId", "subjectId", "instructorId", "createdBy", "updatedBy", "createdAt", "updatedAt", "descriptionAr", "descriptionEn", "locationAr", "locationEn", "ownerEmail", term, year) FROM stdin;/COPY public.classes (id, code, "nameEn", "nameAr", "maxCapacity, capacity, "isActive", "programId", "subjectId", "instructorId", "createdBy", "updatedBy", "createdAt", "updatedAt", "descriptionAr", "descriptionEn", "locationAr", "locationEn", "ownerEmail", term, year, schedule) FROM stdin;/' | \
    sed 's/\tmaxCapacity/\tmaxCapacity\tmaxCapacity/' | \
    sed 's/\t$/\tNULL/' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Extract subjects data (should be compatible)
echo "Extracting data for subjects..."
awk '/^COPY public\.subjects /,/^\\.$/' "$BACKUP_FILE" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "-- Re-enabling triggers" >> "$OUTPUT_FILE"
echo "SET session_replication_role = 'origin';" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "-- Updating sequences" >> "$OUTPUT_FILE"
echo "SELECT setval('public.users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.users));" >> "$OUTPUT_FILE"
echo "SELECT setval('public.programs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.programs));" >> "$OUTPUT_FILE"
echo "SELECT setval('public.classes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.classes));" >> "$OUTPUT_FILE"
echo "SELECT setval('public.subjects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.subjects));" >> "$OUTPUT_FILE"

echo "Data extraction complete. Output file: $OUTPUT_FILE"
echo "To import, run: docker exec -i lms-qaf-app-db psql -U military_lms -d military_lms < $OUTPUT_FILE"
