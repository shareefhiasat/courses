# 🔄 Database Redo Guide

## When to Redo the Database

You should redo the database when:
- Schema changes require fresh data
- Foreign key constraints are broken
- Data corruption or inconsistencies
- Starting fresh development environment
- Testing migration scripts

## 🚨 **BEFORE YOU START**

### Backup Current Data (if needed)
```bash
# Export current data
pg_dump -h localhost -U postgres -d courses_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Stop All Services
```bash
# Stop all Node.js processes
taskkill /F /IM node.exe /T

# Stop PostgreSQL if needed
# Check services.msc for PostgreSQL service
```

## 🗑️ **Complete Database Reset**

### Option 1: Full Reset (Recommended)
```bash
# Navigate to project root
cd E:\QAF\Github\courses

# 1. Drop all collections/tables
node scripts/database/drop-all-collections.cjs

# 2. Push fresh schema
npx prisma db push

# 3. Generate Prisma client
npx prisma generate
```

### Option 2: Clear Data Only (Keep Schema)
```bash
# Clear data but keep table structure
node scripts/database/clear-database.mjs
```

## 🌱 **Complete Data Seeding**

### Step-by-Step Seeding (Recommended Order)
```bash
# 1. Seed all lookup tables (27 tables)
npx tsx prisma/seed-all.ts

# 2. Create super admin user
node scripts/database/create-super-admin.cjs

# 3. Create basic academic data
node scripts/database/create-basic-data.cjs

# 4. Create test students (3 students)
node scripts/database/create-test-students.cjs

# 5. Create test instructors (3 instructors)
node scripts/database/create-test-instructors.cjs

# 6. Create student enrollments
node scripts/database/create-enrollments.cjs
```

### All-in-One Script
```bash
# Run complete setup (create this script)
node scripts/database/complete-setup.cjs
```

## 📊 **What Gets Created**

### Lookup Tables (27 total)
- ✅ User Roles (5): SUPER_ADMIN, ADMIN, HR, INSTRUCTOR, STUDENT
- ✅ User Status Types (4): ACTIVE, INACTIVE, SUSPENDED, PENDING
- ✅ Enrollment Status Types (7): ENROLLED, PENDING, APPROVED, REJECTED, COMPLETED, DROPPED, SUSPENDED
- ✅ Subject Types (3): CORE, ELECTIVE, LABORATORY
- ✅ Requirement Types (3): MANDATORY, OPTIONAL, PREREQUISITE
- ✅ Penalty Types (7): LATE_SUBMISSION, ABSENCE, MISCONDUCT, CHEATING, PLAGIARISM, DISRUPTION, DRESS_CODE
- ✅ Behavior Types (8): EXCELLENT_PARTICIPATION, HELPING_PEERS, LEADERSHIP, CREATIVITY, IMPROVEMENT, DISRUPTIVE, DISRESPECTFUL, UNPREPARED
- ✅ Priority Types (5): LOW, NORMAL, HIGH, URGENT, CRITICAL
- ✅ Resource Types (8): DOCUMENT, VIDEO, AUDIO, IMAGE, PRESENTATION, SPREADSHEET, LINK, ARCHIVE
- ✅ Category Types (7): LECTURE_NOTES, ASSIGNMENT, READING, REFERENCE, TUTORIAL, EXAM_PREP, SUPPLEMENTARY
- ✅ Question Types (5): MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY, FILL_BLANK
- ✅ Target Audience Types (6): ALL, STUDENTS, INSTRUCTORS, ADMIN, PROGRAM, CLASS
- ✅ **Participation Types (5): ATTENDANCE, DISCUSSION, PRESENTATION, GROUP_WORK, PROJECT** - NEW!
- ✅ Activity Types (8): LECTURE, LAB, SEMINAR, WORKSHOP, EXAM, ASSIGNMENT, PROJECT, PRESENTATION
- ✅ Activity Log Action Types (9): CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ENROLL, WITHDRAW, SUBMIT, GRADE
- ✅ Assessment Types (8): QUIZ, MIDTERM, FINAL, ASSIGNMENT, PROJECT, PARTICIPATION, PRESENTATION, LAB_WORK
- ✅ Quiz Status Types (6): DRAFT, PUBLISHED, ACTIVE, CLOSED, GRADED, ARCHIVED
- ✅ Question Difficulty Types (4): EASY, MEDIUM, HARD, EXPERT
- ✅ Schedule Types (6): REGULAR, MAKEUP, EXTRA, REVIEW, LAB, TUTORIAL
- ✅ Template Types (5): EMAIL, SMS, CERTIFICATE, REPORT, FORM
- ✅ Config Types (5): SYSTEM, ACADEMIC, NOTIFICATION, SECURITY, INTEGRATION
- ✅ Attendance Status Types (6): PRESENT, ABSENT, LATE, EXCUSED, SICK_LEAVE, EARLY_DEPARTURE
- ✅ Submission Status Types (7): DRAFT, SUBMITTED, UNDER_REVIEW, GRADED, RETURNED, APPROVED, LATE
- ✅ Academic Terms (3): 2024-FALL, 2025-SPRING, 2025-SUMMER

### Core Data
- ✅ **Super Admin**: shareef.hiasat@gmail.com (Shareef Hiasat)
- ✅ **Programs** (3): CS, IT, Software Engineering
- ✅ **Subjects** (6): CS101-CS302
- ✅ **Classes** (3): CS101-001, CS101-002, CS102-001

### Test Users
- ✅ **Students** (3): Ahmed Mohammed, Fatima Ali, Mohammed Khalid
- ✅ **Instructors** (3): Dr. Sarah Johnson, Prof. Michael Chen, Dr. Emily Williams

### Enrollments
- ✅ 3 student enrollments in classes

## 🔧 **Common Issues & Solutions**

### Issue: Foreign Key Constraint Violations
**Solution**: Always seed in the correct order:
1. Lookup tables first
2. Super admin (creates user ID=1)
3. Programs/subjects/classes
4. Users
5. Enrollments

### Issue: RoleAssignment Errors
**Solution**: Ensure roleAssignments table is populated before creating users

### Issue: Missing Lookups
**Solution**: Check if all lookup tables are seeded before creating dependent data

### Issue: Duplicate Data
**Solution**: Scripts check for existing data before creating

## 🧪 **Verification**

### Test the Database
```bash
# Test database connection
node scripts/database/test-prisma.js

# Run comprehensive tests
node scripts/database/test-runner.js
```

### Verify Data Counts
```sql
-- Check lookup tables
SELECT table_name, COUNT(*) as record_count 
FROM information_schema.tables 
LEFT JOIN (
    SELECT 'user_roles' as table_name, COUNT(*) as record_count FROM user_roles
    UNION ALL
    SELECT 'user_status_types', COUNT(*) FROM user_status_types
    -- Add all lookup tables
) counts ON information_schema.tables.table_name = counts.table_name
WHERE table_schema = 'public'
GROUP BY table_name, record_count;
```

### Verify Users
```bash
# Check super admin
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({where: {email: 'shareef.hiasat@gmail.com'}, include: {roleAssignments: {include: {role: true}}}})
  .then(user => console.log('Super Admin:', user))
  .finally(() => prisma.$disconnect());
"
```

## 🚀 **Start Services**

After successful database setup:
```bash
# Start backend
cd E:\QAF\Github\courses\backend
npm start

# Start frontend (new terminal)
cd E:\QAF\Github\courses\client
npm run dev

# Access application
http://localhost:5175 (or whatever port is assigned)
```

## 📝 **Quick Reference Commands**

### Emergency Reset
```bash
node scripts/database/drop-all-collections.cjs && npx prisma db push && npx prisma generate
```

### Quick Seed
```bash
npx tsx prisma/seed-all.ts && node scripts/database/create-super-admin.cjs
```

### Full Test Data
```bash
node scripts/database/create-basic-data.cjs && node scripts/database/create-test-students.cjs && node scripts/database/create-test-instructors.cjs && node scripts/database/create-enrollments.cjs
```

---

**Last Updated**: 2026-03-30  
**Version**: 2.0 (Added ParticipationTypes, separated instructors)
