#!/bin/bash

# Script to restore data using INSERT with ON CONFLICT to handle existing data
# Backup location: /Users/shareef/Projects/GitHub/Personal/courses/backups/volumes-20260329-205419/app-db.sql

BACKUP_FILE="/Users/shareef/Projects/GitHub/Personal/courses/backups/volumes-20260329-205419/app-db.sql"
OUTPUT_FILE="/tmp/restore-data-v7.sql"

echo "-- Data restoration script generated at $(date)" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "-- Using INSERT with ON CONFLICT to handle existing data" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Convert programs (with column mapping for new fields)
# Backup columns: id, code, nameEn, nameAr, descriptionEn, descriptionAr, durationYears, minGPA, totalCreditHours, isActive, createdBy, updatedBy, createdAt, updatedAt
# Current columns: id, code, nameEn, nameAr, descriptionEn, descriptionAr, durationYears, minGPA, totalCreditHours, durationType, durationValue, startDate, endDate, categoryId, targetAudience, isActive, createdBy, updatedBy, createdAt, updatedAt
echo "Converting programs..."
awk '/^COPY public\.programs /,/^\\.$/' "$BACKUP_FILE" | \
sed '1d;$d' | \
while IFS=$'\t' read -ra values; do
    if [ ${#values[@]} -gt 0 ]; then
        # values: 0:id, 1:code, 2:nameEn, 3:nameAr, 4:descriptionEn, 5:descriptionAr, 6:durationYears, 7:minGPA, 8:totalCreditHours, 9:isActive, 10:createdBy, 11:updatedBy, 12:createdAt, 13:updatedAt
        echo "INSERT INTO public.programs (id, code, \"nameEn\", \"nameAr\", \"descriptionEn\", \"descriptionAr\", \"durationYears\", \"minGPA\", \"totalCreditHours\", \"durationType\", \"durationValue\", \"startDate\", \"endDate\", \"categoryId\", \"targetAudience\", \"isActive\", \"createdBy\", \"updatedBy\", \"createdAt\", \"updatedAt\") VALUES ("
        
        # Original columns (0-8)
        for i in 0 1 2 3 4 5 6 7 8; do
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
            echo -n ", "
        done
        
        # New flexible scheduling fields
        echo -n "'ACADEMIC_SEMESTER', NULL, NULL, NULL, NULL, NULL, "
        
        # Original columns (9-13): isActive, createdBy, updatedBy, createdAt, updatedAt
        for i in 9 10 11 12 13; do
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
            if [ $i -lt 13 ]; then
                echo -n ", "
            fi
        done
        
        echo ") ON CONFLICT (id) DO NOTHING;"
    fi
done >> "$OUTPUT_FILE"

# Convert classes (with column mapping for capacity field)
# Backup columns: id, code, nameEn, nameAr, maxCapacity, isActive, programId, subjectId, instructorId, createdBy, updatedBy, createdAt, updatedAt, descriptionAr, descriptionEn, locationAr, locationEn, ownerEmail, term, year
# Current columns: id, code, nameEn, nameAr, maxCapacity, capacity, isActive, programId, subjectId, instructorId, createdBy, updatedBy, createdAt, updatedAt, descriptionAr, descriptionEn, locationAr, locationEn, ownerEmail, term, year, schedule
echo "Converting classes..."
awk '/^COPY public\.classes /,/^\\.$/' "$BACKUP_FILE" | \
sed '1d;$d' | \
while IFS=$'\t' read -ra values; do
    if [ ${#values[@]} -gt 0 ]; then
        # values: 0:id, 1:code, 2:nameEn, 3:nameAr, 4:maxCapacity, 5:isActive, 6:programId, 7:subjectId, 8:instructorId, 9:createdBy, 10:updatedBy, 11:createdAt, 12:updatedAt, 13:descriptionAr, 14:descriptionEn, 15:locationAr, 16:locationEn, 17:ownerEmail, 18:term, 19:year
        echo "INSERT INTO public.classes (id, code, \"nameEn\", \"nameAr\", \"maxCapacity\", capacity, \"isActive\", \"programId\", \"subjectId\", \"instructorId\", \"createdBy\", \"updatedBy\", \"createdAt\", \"updatedAt\", \"descriptionAr\", \"descriptionEn\", \"locationAr\", \"locationEn\", \"ownerEmail\", term, year, schedule) VALUES ("
        
        # Original columns (0-4): id, code, nameEn, nameAr, maxCapacity
        for i in 0 1 2 3 4; do
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
            echo -n ", "
        done
        
        # New capacity field (use maxCapacity as default)
        maxcap="${values[4]}"
        if [ "$maxcap" = "\\N" ]; then
            echo -n "NULL, "
        else
            echo -n "$maxcap, "
        fi
        
        # Original columns (5-19): isActive, programId, subjectId, instructorId, createdBy, updatedBy, createdAt, updatedAt, descriptionAr, descriptionEn, locationAr, locationEn, ownerEmail, term, year
        for i in 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19; do
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
            if [ $i -lt 19 ]; then
                echo -n ", "
            fi
        done
        
        # New schedule field
        echo -n ", NULL"
        
        echo ") ON CONFLICT (id) DO NOTHING;"
    fi
done >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "-- Updating sequences" >> "$OUTPUT_FILE"
echo "SELECT setval('public.programs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.programs));" >> "$OUTPUT_FILE"
echo "SELECT setval('public.classes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.classes));" >> "$OUTPUT_FILE"

echo "Data extraction complete. Output file: $OUTPUT_FILE"
echo "To import, run: docker exec -i lms-qaf-app-db psql -U military_lms -d military_lms < $OUTPUT_FILE"
