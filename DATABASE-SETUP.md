# Military LMS Database Setup Guide

## 🔧 Database Configuration

### **📋 Database Name Convention**
- **Database Name**: `military_lms` (used consistently across all configurations)
- **Docker Container**: `lms-qaf-app-db`
- **Port**: `5432`
- **User**: `military_lms`
- **Password**: `military_lms123`

### **🔗 Configuration Files**
- **`.env`**: Application database connection
- **`scripts/docker/docker-compose.dev.yml`**: Docker database setup
- **`prisma/schema.prisma`**: Prisma schema definition

### **⚠️ Important Notes**
- All database references must use `military_lms`
- Docker automatically creates the database on startup
- No manual database creation required
- User and database names are now the same for simplicity

### **Initial Setup**
```bash
# Complete database reset and seeding (recommended for initial setup)
pnpm db:reset

# Manual seeding (if tables already exist)
pnpm db:seed
```

### **Database Commands**
```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes to database (includes client generation)
pnpm db:push

# Create and run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio

# Complete database reset and reseed (includes all steps)
pnpm db:reset
```

## 📋 Seeded Lookup Tables

The comprehensive seed script initializes all lookup tables with production-ready data:

### **User Management**
- **User Roles** (5): SUPER_ADMIN, ADMIN, HR, INSTRUCTOR, STUDENT
- **User Status Types** (4): ACTIVE, INACTIVE, SUSPENDED, PENDING

### **Academic Management**
- **Enrollment Status Types** (7): ENROLLED, PENDING, APPROVED, REJECTED, COMPLETED, DROPPED, SUSPENDED
- **Assessment Types** (8): QUIZ, MIDTERM, FINAL, ASSIGNMENT, PROJECT, PARTICIPATION, PRESENTATION, LAB_WORK
- **Academic Terms** (3): 2024-FALL, 2025-SPRING, 2025-SUMMER

### **Activity & Content Management**
- **Activity Types** (8): LECTURE, LAB, SEMINAR, WORKSHOP, EXAM, ASSIGNMENT, PROJECT, PRESENTATION
- **Activity Log Action Types** (9): CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ENROLL, WITHDRAW, SUBMIT, GRADE
- **Quiz Status Types** (6): DRAFT, PUBLISHED, ACTIVE, CLOSED, GRADED, ARCHIVED
- **Question Difficulty Types** (4): EASY, MEDIUM, HARD, EXPERT

### **Scheduling & Templates**
- **Schedule Types** (6): REGULAR, MAKEUP, EXTRA, REVIEW, LAB, TUTORIAL
- **Template Types** (5): EMAIL, SMS, CERTIFICATE, REPORT, FORM

### **System Configuration**
- **Config Types** (5): SYSTEM, ACADEMIC, NOTIFICATION, SECURITY, INTEGRATION
- **Attendance Status Types** (6): PRESENT, ABSENT, LATE, EXCUSED, SICK_LEAVE, EARLY_DEPARTURE
- **Submission Status Types** (7): DRAFT, SUBMITTED, UNDER_REVIEW, GRADED, RETURNED, APPROVED, LATE

## 🏗️ Architecture

### **Seed Script Location**
```
prisma/seed-all.ts - Comprehensive seeding script
```

### **Database Schema**
```
prisma/schema.prisma - Single consolidated schema
```

### **Error Handling**
- **Backend**: `backend/constants/prisma-errors.js` - Centralized Prisma error handling
- **User-friendly messages** for all common Prisma errors
- **Proper error codes** and handling patterns

## 🔄 Reset Workflow

The `pnpm db:reset` command performs these steps:
1. **Database Reset**: Clears all data and tables
2. **Schema Push**: Recreates all tables from schema
3. **Client Generation**: Regenerates Prisma client
4. **Comprehensive Seeding**: Populates all lookup tables

## 🎯 Role System

### **Available Roles**
- `SUPER_ADMIN`: Full system access
- `ADMIN`: System administration
- `HR`: Human resources management
- `INSTRUCTOR`: Course instruction and management
- `STUDENT`: Student access

### **Usage in Code**
```javascript
// Find role by code
const adminRole = await prisma.userRoles.findFirst({ 
  where: { code: 'ADMIN' } 
});

// Create user with role
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roleId: adminRole.id
  }
});
```

## 🛠️ Development Workflow

### **Schema Changes**
1. Update `prisma/schema.prisma`
2. Run `pnpm db:push` to apply changes
3. Run `pnpm db:seed` to reseed lookup data

### **Complete Reset**
```bash
# When you need to start fresh (e.g., after major schema changes)
pnpm db:reset
```

### **Adding New Lookup Data**
1. Add constants to `prisma/seed-all.ts`
2. Add to `seedAll()` function call order
3. Run `pnpm db:seed` to test

## ✅ Benefits

- **Single Source of Truth**: All lookup data in one script
- **Consistent Environment**: Same data across dev/staging/prod
- **Easy Reset**: One command to start fresh
- **Proper Relationships**: All foreign keys properly established
- **Production Ready**: Real-world data for testing
- **Bilingual Support**: English and Arabic names
- **Audit Ready**: All tables support audit fields

## 🚨 Important Notes

- **No Staff/Guest Roles**: Only 4 essential roles as requested
- **No Manual Role Creation**: Backend expects roles to exist from seed
- **Migration Style**: Seed runs after schema changes, not as separate migrations
- **Error Handling**: Backend will throw helpful errors if roles missing

## 📞 Support

If you encounter issues:
1. Run `pnpm db:reset` for clean start
2. Check PostgreSQL connection in `.env`
3. Verify schema matches expected structure
4. Review seed script for any data conflicts
