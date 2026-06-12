#!/bin/bash

# Script to restore data using INSERT with ON CONFLICT to handle existing data
# Backup location: /Users/shareef/Projects/GitHub/Personal/courses/backups/volumes-20260329-205419/app-db.sql

BACKUP_FILE="/Users/shareef/Projects/GitHub/Personal/courses/backups/volumes-20260329-205419/app-db.sql"
OUTPUT_FILE="/tmp/restore-data-v6.sql"

echo "-- Data restoration script generated at $(date)" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "-- Using INSERT with ON CONFLICT to handle existing data" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Convert programs (with column mapping for new fields)
echo "Converting programs..."
awk '/^COPY public\.programs /,/^\\.$/' "$BACKUP_FILE" | \
sed '1d;$d' | \
while IFS=$'\t' read -ra values; do
    if [ ${#values[@]} -gt 0 ]; then
        echo "INSERT INTO public.programs (id, code, \"nameEn\", \"nameAr\", \"descriptionEn\", \"descriptionAr\", \"durationYears\", \"minGPA\", \"totalCreditHours\", \"durationType\", \"durationValue\", \"startDate\", \"endDate\", \"categoryId\", \"targetAudience\", \"isActive\", \"createdBy\", \"updatedBy\", \"createdAt\", \"updatedAt\") VALUES ("
        for i in "${!values[@]}"; do
            val="${values[$i]}"
            if [ "$val" = "\\N" ]; then
                echo -n "NULL"
            elif [[ "$val" =~ ^[0-9]+$ ]] && [ "$val" -eq "$val" ] 2>/dev/null; then
                echo -n "$val"
            elif [[ "$val" =~ ^[0-9]+\.[0-9]+$ ]]; then
                echo -n "$val"
            elif [[ "$val" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2} ]]; then
                echo -n "'$val'"
            elif [ "$val" = "t" ]; then
                echo -n "true"
            elif [ "$val" = "f" ]; then
                echo -n "false"
            else
                val="${val//\'/\'\'}"
                echo -n "'$val'"
            fi
            if [ $i -lt $((${#values[@]} - 1)) ]; then
                echo -n ", "
            fi
        done
        # Add NULL for new flexible scheduling fields (durationType, durationValue, startDate, endDate, categoryId, targetAudience)
        echo ", 'ACADEMIC_SEMESTER', NULL, NULL, NULL, NULL, NULL) ON CONFLICT (id) DO NOTHING;"
    fi
done >> "$OUTPUT_FILE"

# Convert classes (with column mapping for capacity field)
echo "Converting classes..."
awk '/^COPY public\.classes /,/^\\.$/' "$BACKUP_FILE" | \
sed '1d;$d' | \
while IFS=$'\t' read -ra values; do
    if [ ${#values[@]} -gt 0 ]; then
        echo "INSERT INTO public.classes (id, code, \"nameEn\", \"nameAr\", \"maxCapacity\", capacity, \"isActive\", \"programId\", \"subjectId\", \"instructorId\", \"createdBy\", \"updatedBy\", \"createdAt\", \"updatedAt\", \"descriptionAr\", \"descriptionEn\", \"locationAr\", \"locationEn\", \"ownerEmail\", term, year, schedule) VALUES ("
        for i in "${!values[@]}"; do
            val="${values[$i]}"
            if [ "$val" = "\\N" ]; then
                echo -n "NULL"
            elif [[ "$val" =~ ^[0-9]+$ ]] && [ "$val" -eq "$val" ] 2>/dev/null; then
                echo -n "$val"
            elif [[ "$val" =~ ^[0-9]+\.[0-9]+$ ]]; then
                echo -n "$val"
            elif [[ "$val" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2} ]]; then
                echo -n "'$val'"
            elif [ "$val" = "t" ]; then
                echo -n "true"
            elif [ "$val" = "f" ]; then
                echo -n "false"
            else
                val="${val//\'/\'\'}"
                echo -n "'$val'"
            fi
            if [ $i -lt $((${#values[@]} - 1)) ]; then
                echo -n ", "
            fi
        done
        # Add NULL for capacity and schedule fields
        echo ", NULL, NULL) ON CONFLICT (id) DO NOTHING;"
    fi
done >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "-- Updating sequences" >> "$OUTPUT_FILE"
echo "SELECT setval('public.programs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.programs));" >> "$OUTPUT_FILE"
echo "SELECT setval('public.classes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.classes));" >> "$OUTPUT_FILE"

echo "Data extraction complete. Output file: $OUTPUT_FILE"
echo "To import, run: docker exec -i lms-qaf-app-db psql -U military_lms -d military_lms < $OUTPUT_FILE"
