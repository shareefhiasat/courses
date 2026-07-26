# Quick Seed Guide - Student Dashboard Data

## Prerequisites
- PostgreSQL running (lms-qaf-app-db container)
- Backend `.env` configured with database connection
- Node.js 22.x installed

## Run Complete Seed

```bash
cd /Users/shareef/Projects/GitHub/Personal/courses
node scripts/database/complete-reset-and-seed.cjs
```

**What it does:**
- Clears ALL existing data
- Seeds 16 steps including:
  - Users (super admin, HR, admins, instructors, students)
  - Academic data (programs, subjects, classes)
  - Sample resources, announcements
  - Penalties, participations, behaviors
  - **Student enrollments**
  - **Student marks (realistic data across 4 performance tiers)**
  - **60 days of attendance records (weighted distribution)**

**Expected Output:**
```
✅ Created X student marks records
✅ Created X total attendance records

📊 Final State:
  - Users: ~20+
  - Classes: ~10+
  - Enrollments: ~50+
  - Student Marks: ~50+
  - Attendance Records: ~2000+
```

## Run Individual Seeds (Optional)

### Marks Only
```bash
node scripts/database/create-sample-marks.cjs
```

### Attendance Only
```bash
node scripts/database/create-sample-attendance.cjs
```

## Test Users

After seeding, you'll have:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Super Admin | shareef.hiasat@gmail.com | (Keycloak) | All data |
| HR | hr@example.com | (Keycloak) | All students |
| Admin | admin@example.com | (Keycloak) | Scoped data |
| Instructor | instructor@example.com | (Keycloak) | Own classes |
| Student | student1@example.com | (Keycloak) | Own data only |

## Verify Data

### Check Database
```bash
docker exec -it lms-qaf-app-db psql -U military_lms -d military_lms

-- Check marks
SELECT COUNT(*) FROM student_marks;

-- Check attendance
SELECT COUNT(*) FROM attendance;

-- Check enrollments
SELECT COUNT(*) FROM enrollment;
```

### Check Frontend
1. Start frontend: `cd client && node node_modules/vite/bin/vite.js --host`
2. Navigate to `https://localhost:5174/student-dashboard`
3. Login as different roles to test visibility

## Troubleshooting

### "Super admin not found"
Run: `node scripts/database/create-super-admin.cjs`

### "No enrollments found"
Run: `node scripts/database/create-enrollments.cjs`

### "Marks already exist"
The script skips existing marks. To recreate:
```sql
DELETE FROM student_marks;
```
Then run marks seed again.

### "Attendance already exists"
The script skips existing attendance. To recreate:
```sql
DELETE FROM attendance;
```
Then run attendance seed again.

## Performance Tips

- Complete seed takes ~2-5 minutes depending on data volume
- Attendance seed creates ~40 records per student (weekdays only)
- Marks seed creates 1 record per enrollment
- All scripts are idempotent (safe to run multiple times)
