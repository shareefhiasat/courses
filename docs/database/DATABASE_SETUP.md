# 🗄️ Database Setup Guide - Prisma as Source of Truth

## Overview
This guide establishes Prisma schema as the single source of truth for the LMS database. All collections are kept and will be polished when reached during development.

---

## 🎯 Core Principle

**Prisma Schema = Source of Truth**
- All database structure is defined in `prisma/schema.prisma`
- GraphQL schema is derived from Prisma schema
- All collections are preserved (no deletions)
- Duplicate collections are consolidated
- Each feature is polished when implemented

---

## 📋 Collections (All Preserved)

### **Core Academic Entities**
- ✅ **User** - User management and authentication
- ✅ **Program** - Academic programs
- ✅ **Subject** - Course subjects
- ✅ **Class** - Individual classes
- ✅ **Enrollment** - Student enrollments

### **Learning & Assessment**
- ✅ **Activity** - Learning activities
- ✅ **Attendance** - Attendance tracking
- ✅ **Announcement** - Course announcements
- ✅ **Quiz** - Quizzes and exams
- ✅ **Question** - Quiz questions
- ✅ **QuestionBank** - Question repository
- ✅ **QuizResult** - Quiz results
- ✅ **QuizSubmission** - Student submissions
- ✅ **Submission** - Assignment submissions

### **Communication**
- ✅ **Chat** - Messaging system
- ✅ **DirectRoom** - Direct chat rooms
- ✅ **Email** - Email system
- ✅ **EmailTemplate** - Email templates
- ✅ **Notification** - Push notifications
- ✅ **NotificationLog** - Notification history

### **Behavior & Discipline**
- ✅ **Behavior** - Student behavior tracking
- ✅ **Penalty** - Penalty management
- ✅ **ActivityLog** - Activity logging

### **Content Management**
- ✅ **File** - File storage
- ✅ **Resource** - Learning resources
- ✅ **Bookmark** - User bookmarks
- ✅ **Template** - Document templates
- ✅ **Schedule** - Scheduling system

### **Gamification**
- ✅ **Gamification** - Points and achievements

---

## 🔄 Consolidation Process

### **Step 1: Remove Duplicate Collections**
Some collections exist in both singular and plural forms. We'll consolidate:

| Singular → Plural | Action |
|------------------|--------|
| program → programs | Move data to programs |
| subject → subjects | Move data to subjects |
| class → classes | Move data to classes |
| user → users | Move data to users |
| enrollment → enrollments | Move data to enrollments |
| activity → activities | Move data to activities |
| attendance → attendances | Move data to attendances |
| announcement → announcements | Move data to announcements |

### **Step 2: Run Consolidation Script**
```bash
# Consolidate duplicate collections
node scripts/consolidate-database.cjs
```

### **Step 3: Sync Prisma Schema**
```bash
# Push Prisma schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

---

## 📧 Email Configuration (MailTrap)

### **MailTrap Settings**
```javascript
// .env file
MAILTRAP_HOST="smtp.mailtrap.io"
MAILTRAP_PORT=2525
MAILTRAP_USER="your-mailtrap-username"
MAILTRAP_PASS="your-mailtrap-password"
MAILTRAP_FROM_EMAIL="noreply@lms.dev"
MAILTRAP_FROM_NAME="LMS Development"
```

### **SMTP Configuration**
```javascript
// services/emailService.cjs
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});
```

---

## 🚀 Quick Start Commands

```bash
# 1. Stop all servers
taskkill /F /IM node.exe /T

# 2. Consolidate duplicate collections
node scripts/consolidate-database.cjs

# 3. Verify super admin
node scripts/verify-super-admin.cjs

# 4. Sync Prisma schema
npx prisma db push

# 5. Generate Prisma client
npx prisma generate

# 6. Start GraphQL server
node working-graphql-server.cjs

# 7. Start dev server
npm run dev
```

---

## 📊 Database State After Setup

```
lms_dev (MongoDB)
├── users (1 record - super admin)
├── programs (0 records)
├── subjects (0 records)
├── classes (0 records)
├── enrollments (0 records)
├── activities (0 records)
├── attendances (0 records)
├── announcements (0 records)
├── quizzes (0 records)
├── questions (0 records)
├── questionBanks (0 records)
├── quizResults (0 records)
├── quizSubmissions (0 records)
├── submissions (0 records)
├── chats (0 records)
├── directRooms (0 records)
├── emails (0 records)
├── emailTemplates (0 records)
├── notifications (0 records)
├── notificationLogs (0 records)
├── behaviors (0 records)
├── penalties (0 records)
├── activityLogs (0 records)
├── files (0 records)
├── resources (0 records)
├── bookmarks (0 records)
├── templates (0 records)
├── schedules (0 records)
└── gamifications (0 records)
```

---

## 🧪 Testing Strategy

### **Phase 1: Core CRUD**
1. **Programs** - Create, Read, Update, Delete
2. **Subjects** - Create, Read, Update, Delete
3. **Classes** - Create, Read, Update, Delete
4. **Users** - Create, Read, Update, Delete

### **Phase 2: Learning Features**
1. **Activities** - Assignment management
2. **Attendance** - Attendance tracking
3. **Announcements** - Course announcements

### **Phase 3: Assessment**
1. **Quizzes** - Quiz creation and management
2. **Questions** - Question bank management
3. **Quiz Results** - Result tracking

### **Phase 4: Communication**
1. **Chat** - Messaging system
2. **Email** - Email notifications
3. **Notifications** - Push notifications

### **Phase 5: Advanced Features**
1. **Files** - File management
2. **Resources** - Learning resources
3. **Gamification** - Points and achievements

---

## 🔧 Development Workflow

### **When Working on a Feature:**

1. **Check Prisma Schema**
   ```bash
   # Review the model in prisma/schema.prisma
   # Ensure fields match UI requirements
   ```

2. **Update GraphQL Schema**
   ```bash
   # Update graphql/schema.graphql to match Prisma
   # Keep field names consistent
   ```

3. **Update Resolvers**
   ```bash
   # Update working-graphql-server.cjs resolvers
   # Handle new fields and relationships
   ```

4. **Update Queries/Mutations**
   ```bash
   # Update src/services/graphql/queries/
   # Add new queries and mutations
   ```

5. **Test with E2E**
   ```bash
   # Run Playwright tests
   npx playwright test tests/e2e/
   ```

6. **Polish UI**
   ```bash
   # Update React components
   # Add new fields to forms
   # Update table columns
   ```

---

## 📝 Notes

- **No Collection Deletion**: All collections are preserved
- **Incremental Polishing**: Each feature is polished when implemented
- **Prisma First**: Always start with Prisma schema changes
- **GraphQL Sync**: GraphQL schema follows Prisma schema
- **Test Coverage**: E2E tests for each feature
- **Email Ready**: MailTrap configuration preserved
- **Super Admin**: Single super admin user preserved

---

## 🎯 Success Criteria

- [ ] Database has no duplicate collections
- [ ] Prisma schema is source of truth
- [ ] GraphQL schema matches Prisma
- [ ] Super admin can login
- [ ] Core CRUD operations work
- [ ] Email system is configured
- [ ] E2E tests pass for implemented features
- [ ] No console errors
- [ ] Performance is acceptable
