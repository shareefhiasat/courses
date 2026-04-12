# 📂 Database Scripts Guide

## Overview
This directory contains all database management scripts for the Military LMS system. These scripts handle database initialization, data seeding, and maintenance operations.

## 🆕 **Newly Created Scripts** (Created 2026-03-30)

### 1. `create-super-admin.cjs`
**Purpose**: Creates the super admin user account
**Details**:
- Creates user: shareef.hiasat@gmail.com (Shareef Hiasat)
- Assigns SUPER_ADMIN role via roleAssignments table
- Checks for existing user before creation
- Uses proper many-to-many role assignment structure

**Usage**: `node scripts/database/create-super-admin.cjs`

### 2. `create-basic-data.cjs`
**Purpose**: Creates basic academic structure
**Details**:
- **Programs** (3): CS, IT, Software Engineering bachelor degrees
- **Subjects** (6): CS101 through CS302 with proper credits
- **Classes** (3): CS101-001, CS101-002, CS102-001
- All entities linked with proper foreign keys
- Creator relationships established

**Usage**: `node scripts/database/create-basic-data.cjs`

### 3. `create-test-students.cjs`
**Purpose**: Creates test users for development
**Details**:
- **Students** (3): Ahmed Mohammed, Fatima Ali, Mohammed Khalid
- **Instructor** (1): Dr. Sarah Johnson
- Proper role assignments via roleAssignments table
- Student numbers: STU001, STU002, STU003

**Usage**: `node scripts/database/create-test-students.cjs`

### 4. `create-enrollments.cjs`
**Purpose**: Creates student enrollments in classes
**Details**:
- Enrolls each student in a different class (round-robin)
- Follows schema requirements (userId, programId, subjectId, classId, statusId)
- Respects unique constraint on (userId, classId)
- Uses ENROLLED status for all

**Usage**: `node scripts/database/create-enrollments.cjs`

## 📋 **Existing Scripts** (Previously Created)

### 5. `drop-all-collections.cjs`
**Purpose**: Drops all database collections/tables
**Details**:
- Complete database reset
- Removes all data and tables
- Used before fresh database setup

**Usage**: `node scripts/database/drop-all-collections.cjs`

### 6. `clear-database.mjs`
**Purpose**: Clears data from all tables
**Details**:
- Removes all data but keeps table structure
- Less destructive than dropping collections
- Useful for data reset during development

**Usage**: `node scripts/database/clear-database.mjs`

### 7. `migrate-help-items.cjs`
**Purpose**: Migrates help system data
**Details**:
- Handles help items migration
- Preserves help system functionality
- Used during schema updates

**Usage**: `node scripts/database/migrate-help-items.cjs`

### 8. `test-prisma.js`
**Purpose**: Tests Prisma database connection
**Details**:
- Verifies database connectivity
- Tests basic Prisma operations
- Used for troubleshooting

**Usage**: `node scripts/database/test-prisma.js`

### 9. `test-runner.js`
**Purpose**: Runs database tests
**Details**:
- Comprehensive test suite
- Validates data integrity
- Tests relationships and constraints

**Usage**: `node scripts/database/test-runner.js`

## 🔄 **Complete Database Setup Workflow**

### Fresh Database Setup
```bash
# 1. Start with clean database
node scripts/database/drop-all-collections.cjs

# 2. Create schema
npx prisma db push
npx prisma generate

# 3. Seed lookup tables (existing)
npx tsx prisma/seed-all.ts

# 4. Create core data (NEW)
node scripts/database/create-super-admin.cjs
node scripts/database/create-basic-data.cjs
node scripts/database/create-test-students.cjs
node scripts/database/create-enrollments.cjs
```

### Data Reset (Keep Schema)
```bash
# Clear only data, keep structure
node scripts/database/clear-database.mjs

# Re-seed data
npx tsx prisma/seed-all.ts
node scripts/database/create-super-admin.cjs
node scripts/database/create-basic-data.cjs
node scripts/database/create-test-students.cjs
node scripts/database/create-enrollments.cjs
```

## 📊 **What Each Script Creates**

| Script | Tables Affected | Records Created |
|--------|------------------|-----------------|
| `seed-all.ts` | 26 lookup tables | ~100 total records |
| `create-super-admin.cjs` | users, roleAssignments | 1 user, 1 role assignment |
| `create-basic-data.cjs` | programs, subjects, classes | 3 programs, 6 subjects, 3 classes |
| `create-test-students.cjs` | users, roleAssignments | 4 users, 4 role assignments |
| `create-enrollments.cjs` | enrollments | 3 enrollments |

## 🔧 **Script Dependencies**

### Execution Order Matters
1. **Must run first**: `seed-all.ts` (creates lookup tables)
2. **Must run second**: `create-super-admin.cjs` (creates user ID=1)
3. **Can run in any order after**: basic-data, test-students, enrollments

### Why This Order
- Lookup tables provide foreign key references
- Super admin (user ID=1) is creator for other entities
- Basic data creates programs/subjects needed for enrollments
- Test users needed for enrollments
- Enrollments depend on classes and users existing

## 🚨 **Important Notes**

### Schema Compatibility
- All new scripts use the updated schema with roleAssignments
- Old scripts may need updates for schema changes
- Always check foreign key constraints

### Error Handling
- All scripts include existence checks
- No duplicate data creation
- Clear error messages for troubleshooting

### Data Relationships
- Users → roleAssignments → roles (many-to-many)
- Subjects → programs (many-to-one)
- Classes → programs + subjects (many-to-one)
- Enrollments → users + classes (many-to-many)

## 📝 **Maintenance**

### Adding New Scripts
1. Follow naming convention: `create-{entity}.cjs`
2. Include existence checks
3. Use proper foreign key relationships
4. Add to this documentation

### Updating Scripts
1. Test on development database first
2. Backup production data before running
3. Update documentation accordingly
4. Test script dependencies

---

**Last Updated**: 2026-03-30  
**Created By**: Database Recovery Process  
**Purpose**: Complete database restoration and documentation
