# Schema Analysis and Required Fixes

## Date: March 26, 2026

---

## 🔍 **ISSUES IDENTIFIED**

### **1. Field Naming Convention Issues**
- ✅ **GOOD**: `nameEn`, `nameAr`, `titleEn`, `titleAr`, `contentEn`, `contentAr` 
- ❌ **BAD**: `description`, `descriptionAr` (should be `descriptionEn`, `descriptionAr`)
- ❌ **BAD**: `question`, `questionAr` (should be `questionEn`, `questionAr`)

### **2. Missing Lookup Conversions**
- ❌ **Question.type**: Still using String instead of FK to QuestionTypes lookup
- ❌ **Announcement.targetAudience**: Still using String instead of FK to TargetAudienceTypes lookup

### **3. Missing Audit Relations**
- ❌ Some models missing `creator`/`updater` relations in User model
- ❌ Some models missing proper audit trail setup

### **4. Missing Required Lookup Tables**
- ❌ **QuestionTypes** (for Question.type field)
- ❌ **TargetAudienceTypes** (for Announcement.targetAudience field)

---

## 📋 **DETAILED ANALYSIS**

### **Models Needing Field Name Fixes:**

#### **1. Question Model (lines 789-810)**
```prisma
// CURRENT (BAD):
type          String   @default("multiple_choice")
questionEn    String
questionAr    String?

// SHOULD BE:
typeId        Int      // FK to QuestionTypes
questionEn    String
questionAr    String?
```

#### **2. Announcement Model (lines 737-761)**
```prisma
// CURRENT (BAD):
targetAudience String         @default("all")

// SHOULD BE:
targetAudienceId Int          // FK to TargetAudienceTypes
```

### **Models Needing Audit Relations Added to User Model:**
The User model is missing several relations for new lookup tables and operational models.

---

## 🔧 **REQUIRED FIXES**

### **1. Create Missing Lookup Tables**

#### **QuestionTypes Lookup Table**
```prisma
model QuestionTypes {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  nameEn      String
  nameAr      String?
  description String?
  isActive    Boolean  @default(true)
  createdBy   Int?
  updatedBy   Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  creator     User?    @relation("QuestionTypesCreator", fields: [createdBy], references: [id])
  updater     User?    @relation("QuestionTypesUpdater", fields: [updatedBy], references: [id])
  questions   Question[]

  @@map("question_types")
}
```

#### **TargetAudienceTypes Lookup Table**
```prisma
model TargetAudienceTypes {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  nameEn      String
  nameAr      String?
  description String?
  isActive    Boolean  @default(true)
  createdBy   Int?
  updatedBy   Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  creator     User?    @relation("TargetAudienceTypesCreator", fields: [createdBy], references: [id])
  updater     User?    @relation("TargetAudienceTypesUpdater", fields: [updatedBy], references: [id])
  announcements Announcement[]

  @@map("target_audience_types")
}
```

### **2. Fix Question Model**
```prisma
model Question {
  id            Int      @id @default(autoincrement())
  quizId        Int
  questionEn    String
  questionAr    String?
  typeId        Int      // Changed from String to Int FK
  options       String?
  correctAnswer String?
  points        Float    @default(1)
  order         Int      @default(0)
  isActive      Boolean  @default(true)
  createdBy     Int
  updatedBy     Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  answers       Answer[]
  creator       User     @relation("QuestionCreator", fields: [createdBy], references: [id])
  quiz          Quiz     @relation(fields: [quizId], references: [id])
  questionType  QuestionTypes @relation(fields: [typeId], references: [id]) // New relation
  updater       User?    @relation("QuestionUpdater", fields: [updatedBy], references: [id])

  @@map("questions")
}
```

### **3. Fix Announcement Model**
```prisma
model Announcement {
  id              Int            @id @default(autoincrement())
  titleEn         String
  titleAr         String?
  priorityId      Int
  targetAudienceId Int           // Changed from String to Int FK
  programId       Int?
  classId         Int?
  isActive        Boolean        @default(true)
  createdBy       Int
  updatedBy       Int?
  publishAt       DateTime?
  expiresAt       DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  descriptionEn   String?        // Fixed naming
  descriptionAr   String?        // Fixed naming
  class           Class?         @relation(fields: [classId], references: [id])
  creator         User           @relation("AnnouncementCreator", fields: [createdBy], references: [id])
  program         Program?       @relation(fields: [programId], references: [id])
  priority        PriorityTypes  @relation(fields: [priorityId], references: [id])
  targetAudience  TargetAudienceTypes @relation(fields: [targetAudienceId], references: [id]) // New relation
  updater         User?          @relation("AnnouncementUpdater", fields: [updatedBy], references: [id])

  @@map("announcements")
}
```

### **4. Add Missing Relations to User Model**
The User model needs these additional relations added:

```prisma
// Add to User model:
createdQuestionTypes       QuestionTypes[]       @relation("QuestionTypesCreator")
updatedQuestionTypes       QuestionTypes[]       @relation("QuestionTypesUpdater")
createdTargetAudienceTypes TargetAudienceTypes[] @relation("TargetAudienceTypesCreator")
updatedTargetAudienceTypes TargetAudienceTypes[] @relation("TargetAudienceTypesUpdater")
```

### **5. Update Seed File**
Add these new lookup tables to seed file:

```typescript
// Question Types
const QUESTION_TYPES = [
  { code: 'MULTIPLE_CHOICE', nameEn: 'Multiple Choice', nameAr: 'اختيار من متعدد', description: 'Multiple choice question' },
  { code: 'TRUE_FALSE', nameEn: 'True/False', nameAr: 'صح/خطأ', description: 'True or false question' },
  { code: 'SHORT_ANSWER', nameEn: 'Short Answer', nameAr: 'إجابة قصيرة', description: 'Short answer question' },
  { code: 'ESSAY', nameEn: 'Essay', nameAr: 'مقال', description: 'Essay question' },
  { code: 'FILL_BLANK', nameEn: 'Fill in the Blank', nameAr: 'املأ الفراغ', description: 'Fill in the blank question' }
] as const;

// Target Audience Types
const TARGET_AUDIENCE_TYPES = [
  { code: 'ALL', nameEn: 'All Users', nameAr: 'جميع المستخدمين', description: 'All system users' },
  { code: 'STUDENTS', nameEn: 'Students', nameAr: 'الطلاب', description: 'Students only' },
  { code: 'INSTRUCTORS', nameEn: 'Instructors', nameAr: 'المدربون', description: 'Instructors only' },
  { code: 'ADMIN', nameEn: 'Administrators', nameAr: 'المسؤولون', description: 'Administrators only' },
  { code: 'PROGRAM', nameEn: 'Program Specific', nameAr: 'برنامج محدد', description: 'Specific program users' },
  { code: 'CLASS', nameEn: 'Class Specific', nameAr: 'فصل محدد', description: 'Specific class users' }
] as const;
```

---

## 🎯 **IMPLEMENTATION PLAN**

### **Phase 1: Schema Updates**
1. Add QuestionTypes and TargetAudienceTypes lookup tables
2. Update Question model to use typeId instead of type
3. Update Announcement model to use targetAudienceId instead of targetAudience
4. Fix field naming conventions (description → descriptionEn/descriptionAr)
5. Add missing relations to User model

### **Phase 2: Database Migration**
1. Run `prisma db push --force-reset` to apply schema changes
2. Update seed file with new lookup data
3. Run seed script to populate new lookup tables

### **Phase 3: Backend Updates**
1. Update Question database service to use new schema
2. Update Announcement database service to use new schema
3. Create QuestionTypes and TargetAudienceTypes services
4. Update all include statements

### **Phase 4: Frontend Updates**
1. Update Question pages to use lookup dropdowns
2. Update Announcement pages to use lookup dropdowns
3. Fix any remaining field naming issues

---

## 📊 **IMPACT**

### **Benefits:**
- ✅ Consistent field naming across all models
- ✅ All type fields use proper FK constraints
- ✅ Better data integrity and performance
- ✅ Proper audit trails for all models
- ✅ Easier localization management

### **Models Affected:**
- Question (major changes)
- Announcement (minor changes)
- User (relation additions)
- 2 new lookup tables
- Backend services for affected models
- Frontend pages for affected models

---

## ⚠️ **BREAKING CHANGES**

This will require:
1. Database reset (all existing data will be deleted)
2. Backend service updates
3. Frontend form updates
4. API contract changes for Question and Announcement

---

**Status: 🔄 READY FOR IMPLEMENTATION**
