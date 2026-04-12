# 🗄️ Fresh Database Setup

## Quick Commands

### 1. Drop All Collections
```bash
node scripts/drop-all-collections.cjs
```

### 2. Push Prisma Schema
```bash
npx prisma db push
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Seed All Lookup Tables
```bash
npx tsx prisma/seed-all.ts
```

### 5. Create Super Admin User
```bash
node scripts/database/create-super-admin.cjs
```
**Important**: All subsequent scripts now dynamically retrieve the super admin ID (currently 6) instead of using hardcoded values. This ensures all created records are properly attributed to Shareef (shareef.hiasat@gmail.com).

### 6. Create Basic Academic Data
```bash
node scripts/database/create-basic-data.cjs
```

### 7. Create Test Instructors
```bash
node scripts/database/create-test-instructors.cjs
```

### 8. Create Test HR Users
```bash
node scripts/database/create-test-hr.cjs
```

### 9. Create Test Admin Users
```bash
node scripts/database/create-test-admins.cjs
```

### 10. Create Sample Resources
```bash
node scripts/database/create-sample-resources.cjs
```

### 11. Create Sample Announcements
```bash
node scripts/database/create-sample-announcements.cjs
```

### 12. Create Sample Penalties
```bash
node scripts/database/create-sample-penalties.cjs
```

### 13. Create Sample Participations
```bash
node scripts/database/create-sample-participations.cjs
```

### 14. Create Sample Behaviors
```bash
node scripts/database/create-sample-behaviors.cjs
```

### 15. Create Student Enrollments
```bash
node scripts/database/create-enrollments.cjs
```

## Complete Process

```bash
# 1. Stop all servers
taskkill /F /IM node.exe /T

# 2. Drop all collections
node scripts/drop-all-collections.cjs

# 3. Push Prisma schema
npx prisma db push

# 4. Generate client
npx prisma generate

# 5. Seed all lookup tables (27 tables)
npx tsx prisma/seed-all.ts

# 6. Create super admin user
node scripts/database/create-super-admin.cjs

# 7. Create basic academic data (programs, subjects, classes)
node scripts/database/create-basic-data.cjs

# 8. Create test instructors
node scripts/database/create-test-instructors.cjs

# 9. Create test HR users
node scripts/database/create-test-hr.cjs

# 10. Create test admin users
node scripts/database/create-test-admins.cjs

# 11. Create sample resources
node scripts/database/create-sample-resources.cjs

# 12. Create sample announcements
node scripts/database/create-sample-announcements.cjs

# 13. Create sample penalties
node scripts/database/create-sample-penalties.cjs

# 14. Create sample participations
node scripts/database/create-sample-participations.cjs

# 15. Create sample behaviors
node scripts/database/create-sample-behaviors.cjs

# 16. Create student enrollments
node scripts/database/create-enrollments.cjs

# 17. Start servers
node working-graphql-server.cjs
npm run dev
```

## Result
- Clean database with all Prisma-defined tables
- All 27 lookup tables populated with data (added ParticipationTypes)
- Super admin user created (shareef.hiasat@gmail.com)
- 3 academic programs, 6 subjects, 3 classes with assigned instructors
- 10 test users: 1 Super Admin, 3 Instructors, 3 Students, 2 HR, 2 Admin
- 8 sample resources (documents, videos, presentations, links)
- 9 sample announcements (different priorities and audiences)
- 10 sample penalties (various infractions)
- 15 sample participation records (attendance, discussions, presentations)
- 15 sample behavior records (positive and negative)
- Student enrollments created
- Ready for testing and development

## Script Explanations

### 1. `prisma/seed-all.ts`
**Purpose**: Seeds all 27 lookup tables with essential data
**Creates**:
- User Roles (SUPER_ADMIN, ADMIN, HR, INSTRUCTOR, STUDENT)
- User Status Types (ACTIVE, INACTIVE, SUSPENDED, PENDING)
- Enrollment Status Types (ENROLLED, PENDING, APPROVED, REJECTED, etc.)
- Subject Types, Requirement Types, Priority Types
- Penalty Types (LATE_SUBMISSION, ABSENCE, CHEATING, etc.)
- Behavior Types (EXCELLENT_PARTICIPATION, DISRUPTIVE, etc.)
- Resource Types, Category Types, Question Types
- **Participation Types (ATTENDANCE, DISCUSSION, PRESENTATION, etc.)** - NEW!
- Activity Types, Assessment Types, Quiz Status Types
- Schedule Types, Template Types, Config Types
- Attendance Status Types, Submission Status Types
- Academic Terms (2024-FALL, 2025-SPRING, 2025-SUMMER)

**Usage**: `npx tsx prisma/seed-all.ts`

### 2. `scripts/database/create-super-admin.cjs`
**Purpose**: Creates the super admin user account
**Creates**:
- User: shareef.hiasat@gmail.com (Shareef Hiasat)
- Role: SUPER_ADMIN
- Status: Active
- Role assignment linking user to role

**Key Features**:
- Checks if user already exists before creating
- Uses the new roleAssignments relationship structure
- Provides detailed user information output

**Usage**: `node scripts/database/create-super-admin.cjs`

### 3. `scripts/database/create-basic-data.cjs`
**Purpose**: Creates basic academic structure (programs, subjects, classes)
**Creates**:
- **Programs** (3):
  - Bachelor of Science in Computer Science
  - Bachelor of Science in Information Technology
  - Bachelor of Science in Software Engineering
- **Subjects** (6):
  - CS101: Introduction to Computer Science
  - CS102: Programming Fundamentals
  - CS201: Data Structures and Algorithms
  - CS202: Database Systems
  - CS301: Software Engineering
  - CS302: Web Development
- **Classes** (3):
  - CS101-001, CS101-002 (two sections of CS101)
  - CS102-001 (one section of CS102)

**Key Features**:
- All subjects linked to CS program
- Proper foreign key relationships (programId, typeId, requirementTypeId)
- Creator relationships established

**Usage**: `node scripts/database/create-basic-data.cjs`

### 4. `scripts/database/create-test-students.cjs`
**Purpose**: Creates test students for development and testing
**Creates**:
- **Students** (3):
  - Ahmed Mohammed (student1@example.com)
  - Fatima Ali (student2@example.com)
  - Mohammed Khalid (student3@example.com)

**Key Features**:
- Students have STUDENT role via roleAssignments
- Student numbers assigned (STU001, STU002, STU003)
- All users marked as active

**Usage**: `node scripts/database/create-test-students.cjs`

### 5. `scripts/database/create-test-instructors.cjs`
**Purpose**: Creates test instructors for development and testing
**Creates**:
- **Instructors** (3):
  - Dr. Sarah Johnson (instructor1@example.com)
  - Prof. Michael Chen (instructor2@example.com)
  - Dr. Emily Williams (instructor3@example.com)

**Key Features**:
- Instructors have INSTRUCTOR role via roleAssignments
- All users marked as active
- Separate from students for proper role testing

**Usage**: `node scripts/database/create-test-instructors.cjs`

### 6. `scripts/database/create-enrollments.cjs`
**Purpose**: Creates student enrollments in classes
**Creates**:
- Student-to-class enrollments following the schema requirements
- Each student enrolled in a different class (round-robin)
- ENROLLED status for all enrollments

**Key Features**:
- Respects unique constraint on (userId, classId)
- Includes all required fields: userId, programId, subjectId, classId, statusId
- Proper creator relationships

**Usage**: `node scripts/database/create-enrollments.cjs`

### 7. `scripts/database/create-test-hr.cjs`
**Purpose**: Creates test HR users for development and testing
**Creates**:
- **HR Users** (2):
  - John Anderson (hr.manager@example.com)
  - Maria Garcia (hr.coordinator@example.com)

**Key Features**:
- HR users have HR role via roleAssignments
- All users marked as active
- Ready for HR functionality testing

**Usage**: `node scripts/database/create-test-hr.cjs`

### 8. `scripts/database/create-test-admins.cjs`
**Purpose**: Creates test Admin users for development and testing
**Creates**:
- **Admin Users** (2):
  - Robert Taylor (admin.system@example.com)
  - Jennifer Lee (admin.academic@example.com)

**Key Features**:
- Admin users have ADMIN role via roleAssignments
- All users marked as active
- Ready for admin functionality testing

**Usage**: `node scripts/database/create-test-admins.cjs`

### 9. `scripts/database/create-sample-resources.cjs`
**Purpose**: Creates sample resources for testing resource management functionality
**Creates**:
- **Resources** (8):
  - Lecture notes, video tutorials, reference guides
  - Lab manuals, presentations, external links
  - Audio lectures, exam preparation archives
- Covers different resource types (DOCUMENT, VIDEO, PRESENTATION, LINK, AUDIO, ARCHIVE)
- Associated with various classes and subjects

**Key Features**:
- Multiple resource types and categories
- Different target audiences (class-specific, program-wide)
- Proper creator relationships using SUPER_ADMIN
- URLs and metadata for each resource

**Usage**: `node scripts/database/create-sample-resources.cjs`

### 10. `scripts/database/create-sample-announcements.cjs`
**Purpose**: Creates sample announcements for testing announcement system
**Creates**:
- **Announcements** (9):
  - System-wide announcements (maintenance, features)
  - Program-specific announcements (guest lectures)
  - Class-specific announcements (exams, assignments)
  - Instructor announcements (office hours)
  - Urgent announcements (room changes)
- Different priority levels (HIGH, NORMAL, URGENT)
- Various target audiences (ALL, PROGRAM, CLASS, STUDENTS)

**Key Features**:
- Scheduled announcements with publish dates
- Bilingual content (English/Arabic)
- Priority-based filtering
- Target audience filtering

**Usage**: `node scripts/database/create-sample-announcements.cjs`

### 11. `scripts/database/create-sample-penalties.cjs`
**Purpose**: Creates sample penalty records for testing penalty system
**Creates**:
- **Penalties** (10):
  - Late submissions, absences, misconduct
  - Cheating, plagiarism, disruptions
  - Dress code violations
- Different penalty types and severity levels
- Point values assigned to each penalty

**Key Features**:
- Multiple penalty types covered
- Various point values (0-30 points)
- Comments and descriptions for each penalty
- Associated with different students and classes

**Usage**: `node scripts/database/create-sample-penalties.cjs`

### 12. `scripts/database/create-sample-participations.cjs`
**Purpose**: Creates sample participation records for testing participation tracking
**Creates**:
- **Participations** (15):
  - Attendance records (present, late, absent)
  - Discussion participations
  - Presentations and group work
  - Project participations
- Different participation types and point values
- Comments and feedback for each participation

**Key Features**:
- All participation types covered
- Point-based scoring system
- Bilingual descriptions
- Multiple students and classes represented

**Usage**: `node scripts/database/create-sample-participations.cjs`

### 13. `scripts/database/create-sample-behaviors.cjs`
**Purpose**: Creates sample behavior records for testing behavior tracking
**Creates**:
- **Behaviors** (15):
  - Positive behaviors (excellent participation, helping peers, leadership, creativity, improvement)
  - Negative behaviors (disruptive, disrespectful, unprepared)
  - Mixed behaviors for realistic scenarios
- Point values assigned (positive and negative)

**Key Features**:
- Balance of positive and negative behaviors
- Point-based behavior tracking
- Detailed descriptions and comments
- Multiple students and classes affected

**Usage**: `node scripts/database/create-sample-behaviors.cjs`

## Helper Functions

### `scripts/database/helpers/getSuperAdmin.cjs`
**Purpose**: Helper function to dynamically retrieve the super admin user ID
**Features**:
- Returns the super admin user ID (currently 6)
- Used by all user creation scripts to set proper `createdBy` values
- Ensures all records are attributed to Shareef (shareef.hiasat@gmail.com)
- Prevents hardcoded ID issues

**Usage**: Automatically imported by user creation scripts

## Database Schema Notes

### Role Assignment Structure
The database uses a many-to-many relationship between users and roles through the `roleAssignments` table:
- Users can have multiple roles
- Each role assignment includes userId, roleId, and timestamps
- This replaces the old direct roleId field in users table

### Enrollment Structure
Enrollments are class-based (not program-based):
- Each enrollment links a user to a specific class
- Includes programId and subjectId for reporting
- Unique constraint prevents duplicate enrollments in same class

### Foreign Key Relationships
All entities maintain proper foreign key relationships:
- Subjects belong to programs
- Classes belong to programs and subjects
- Enrollments link users to classes
- All created/updated actions track the user who made them
