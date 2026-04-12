# Database Schema Migration Summary

## Date: March 26, 2026

## Overview
This migration restructures the database to use proper foreign key constraints for all lookup tables instead of string enums, removes the instructor field from subjects (moved to classes), and adds new models for penalties and behaviors.

---

## 🔄 Major Changes

### 1. **Subject Model Restructuring**

#### Removed Fields:
- `instructorId` - Instructors are now assigned at the Class level, not Subject level
- `instructor` relation

#### Changed Fields:
- `type`: Changed from `String` to `Int` (now references `SubjectTypes` table)
- `requirementType`: Changed from `String` to `Int` (now references `RequirementTypes` table)

#### Added Fields:
- `typeId`: Integer FK to `SubjectTypes`
- `requirementTypeId`: Integer FK to `RequirementTypes`

#### New Relations:
- `subjectType`: Relation to `SubjectTypes` table
- `requirementType`: Relation to `RequirementTypes` table

---

### 2. **New Lookup Tables Created**

#### SubjectTypes
- Replaces string enum for subject types
- Fields: `id`, `code`, `nameEn`, `nameAr`, `description`, `isActive`, audit fields
- Initial values: CORE, ELECTIVE, SPECIALIZATION

#### RequirementTypes
- Replaces string enum for requirement types
- Fields: `id`, `code`, `nameEn`, `nameAr`, `description`, `isActive`, audit fields
- Initial values: MANDATORY, OPTIONAL, PREREQUISITE

#### PenaltyTypes
- New lookup table for penalty classifications
- Fields: `id`, `code`, `nameEn`, `nameAr`, `description`, `severity`, `color`, `isActive`, audit fields
- Initial values: LATE_SUBMISSION, ABSENCE, MISCONDUCT, CHEATING, PLAGIARISM, DISRUPTION, DRESS_CODE

#### BehaviorTypes
- New lookup table for behavior classifications
- Fields: `id`, `code`, `nameEn`, `nameAr`, `description`, `category`, `points`, `color`, `isActive`, audit fields
- Initial values: EXCELLENT_PARTICIPATION, HELPING_PEERS, LEADERSHIP, CREATIVITY, IMPROVEMENT, DISRUPTIVE, DISRESPECTFUL, UNPREPARED

#### PriorityTypes
- New lookup table for announcement priorities
- Fields: `id`, `code`, `nameEn`, `nameAr`, `description`, `level`, `color`, `isActive`, audit fields
- Initial values: LOW, NORMAL, HIGH, URGENT, CRITICAL

#### ResourceTypes
- New lookup table for resource file types
- Fields: `id`, `code`, `nameEn`, `nameAr`, `description`, `icon`, `isActive`, audit fields
- Initial values: DOCUMENT, VIDEO, AUDIO, IMAGE, PRESENTATION, SPREADSHEET, LINK, ARCHIVE

#### CategoryTypes
- New lookup table for resource categories
- Fields: `id`, `code`, `nameEn`, `nameAr`, `description`, `icon`, `isActive`, audit fields
- Initial values: LECTURE_NOTES, ASSIGNMENT, READING, REFERENCE, TUTORIAL, EXAM_PREP, SUPPLEMENTARY

---

### 3. **Announcement Model Updates**

#### Changed Fields:
- `priority`: Changed from `String` to `Int` (now references `PriorityTypes` table)

#### Added Fields:
- `priorityId`: Integer FK to `PriorityTypes`

#### New Relations:
- `priority`: Relation to `PriorityTypes` table

---

### 4. **Resource Model Updates**

#### Removed Fields:
- `fileType`: Removed (now handled by `typeId`)
- `category`: Changed from `String?` to FK

#### Changed Fields:
- `type`: Changed from `String` to `Int` (now references `ResourceTypes` table)
- `category`: Changed from `String?` to `Int?` (now references `CategoryTypes` table)

#### Added Fields:
- `typeId`: Integer FK to `ResourceTypes`
- `categoryId`: Integer FK to `CategoryTypes` (optional)

#### New Relations:
- `resourceType`: Relation to `ResourceTypes` table
- `category`: Relation to `CategoryTypes` table (optional)

---

### 5. **New Operational Models**

#### Penalty Model
New model for tracking student penalties with full audit trail.

**Fields:**
- `id`: Primary key
- `userId`: FK to User (student receiving penalty)
- `classId`: FK to Class (optional)
- `typeId`: FK to PenaltyTypes
- `reason`: Text description
- `reasonAr`: Arabic description (optional)
- `points`: Penalty points
- `issuedBy`: FK to User (who issued the penalty)
- `issuedAt`: Timestamp
- `expiresAt`: Optional expiration date
- `isActive`: Boolean flag
- `createdBy`, `updatedBy`: Audit fields
- `createdAt`, `updatedAt`: Timestamps

**Relations:**
- `user`: Student who received the penalty
- `class`: Class where penalty was issued (optional)
- `penaltyType`: Type of penalty
- `issuer`: User who issued the penalty
- `creator`, `updater`: Audit trail users

#### Behavior Model
New model for tracking student behaviors (positive and negative) with full audit trail.

**Fields:**
- `id`: Primary key
- `userId`: FK to User (student)
- `classId`: FK to Class (optional)
- `typeId`: FK to BehaviorTypes
- `description`: Text description
- `descriptionAr`: Arabic description (optional)
- `points`: Behavior points (can be positive or negative)
- `recordedBy`: FK to User (who recorded the behavior)
- `recordedAt`: Timestamp
- `isActive`: Boolean flag
- `createdBy`, `updatedBy`: Audit fields
- `createdAt`, `updatedAt`: Timestamps

**Relations:**
- `user`: Student whose behavior was recorded
- `class`: Class where behavior occurred (optional)
- `behaviorType`: Type of behavior
- `recorder`: User who recorded the behavior
- `creator`, `updater`: Audit trail users

---

### 6. **Class Model Updates**

#### Added Relations:
- `penalties`: One-to-many relation to Penalty model
- `behaviors`: One-to-many relation to Behavior model

---

### 7. **User Model Updates**

#### Added Relations for New Lookup Tables:
- `createdSubjectTypes`, `updatedSubjectTypes`
- `createdRequirementTypes`, `updatedRequirementTypes`
- `createdPenaltyTypes`, `updatedPenaltyTypes`
- `createdBehaviorTypes`, `updatedBehaviorTypes`
- `createdPriorityTypes`, `updatedPriorityTypes`
- `createdResourceTypes`, `updatedResourceTypes`
- `createdCategoryTypes`, `updatedCategoryTypes`

#### Added Relations for New Operational Models:
- `createdPenalties`, `updatedPenalties`: Audit trail for penalties
- `issuedPenalties`: Penalties issued by this user
- `penalties`: Penalties received by this user
- `createdBehaviors`, `updatedBehaviors`: Audit trail for behaviors
- `recordedBehaviors`: Behaviors recorded by this user
- `behaviors`: Behaviors of this user

#### Removed Relations:
- `instructorSubjects`: Removed (instructors now assigned at class level)

---

## 📊 Database Seeding

All lookup tables have been seeded with initial data:

| Table | Count | Values |
|-------|-------|--------|
| SubjectTypes | 3 | CORE, ELECTIVE, SPECIALIZATION |
| RequirementTypes | 3 | MANDATORY, OPTIONAL, PREREQUISITE |
| PenaltyTypes | 7 | LATE_SUBMISSION, ABSENCE, MISCONDUCT, CHEATING, PLAGIARISM, DISRUPTION, DRESS_CODE |
| BehaviorTypes | 8 | EXCELLENT_PARTICIPATION, HELPING_PEERS, LEADERSHIP, CREATIVITY, IMPROVEMENT, DISRUPTIVE, DISRESPECTFUL, UNPREPARED |
| PriorityTypes | 5 | LOW, NORMAL, HIGH, URGENT, CRITICAL |
| ResourceTypes | 8 | DOCUMENT, VIDEO, AUDIO, IMAGE, PRESENTATION, SPREADSHEET, LINK, ARCHIVE |
| CategoryTypes | 7 | LECTURE_NOTES, ASSIGNMENT, READING, REFERENCE, TUTORIAL, EXAM_PREP, SUPPLEMENTARY |

---

## 🔧 Required Frontend/Backend Updates

### Backend Services to Create:
1. **PenaltyTypes Service** (`backend/db/penaltyTypes-postgres.js`)
2. **BehaviorTypes Service** (`backend/db/behaviorTypes-postgres.js`)
3. **PriorityTypes Service** (`backend/db/priorityTypes-postgres.js`)
4. **ResourceTypes Service** (`backend/db/resourceTypes-postgres.js`)
5. **CategoryTypes Service** (`backend/db/categoryTypes-postgres.js`)
6. **Penalty Service** (`backend/db/penalties-postgres.js`)
7. **Behavior Service** (`backend/db/behaviors-postgres.js`)

### Backend Controllers to Create:
1. **PenaltyTypes Controller** (`backend/controllers/penaltyTypes.js`)
2. **BehaviorTypes Controller** (`backend/controllers/behaviorTypes.js`)
3. **PriorityTypes Controller** (`backend/controllers/priorityTypes.js`)
4. **ResourceTypes Controller** (`backend/controllers/resourceTypes.js`)
5. **CategoryTypes Controller** (`backend/controllers/categoryTypes.js`)
6. **Penalty Controller** (`backend/controllers/penalties.js`)
7. **Behavior Controller** (`backend/controllers/behaviors.js`)

### Backend Routes to Create:
1. **PenaltyTypes Routes** (`backend/routes/penaltyTypes.js`)
2. **BehaviorTypes Routes** (`backend/routes/behaviorTypes.js`)
3. **PriorityTypes Routes** (`backend/routes/priorityTypes.js`)
4. **ResourceTypes Routes** (`backend/routes/resourceTypes.js`)
5. **CategoryTypes Routes** (`backend/routes/categoryTypes.js`)
6. **Penalty Routes** (`backend/routes/penalties.js`)
7. **Behavior Routes** (`backend/routes/behaviors.js`)

### Frontend Updates Required:

#### SubjectsPage.jsx
- Update form to use integer IDs from SubjectTypes and RequirementTypes lookups
- Remove instructor field from subject form
- Update grid columns to display lookup values correctly

#### AnnouncementsPage (if exists)
- Update priority field to use integer ID from PriorityTypes lookup
- Update dropdown to fetch from `/api/v1/priority-types`

#### ResourcesPage (if exists)
- Update type field to use integer ID from ResourceTypes lookup
- Update category field to use integer ID from CategoryTypes lookup
- Update dropdowns to fetch from `/api/v1/resource-types` and `/api/v1/category-types`

#### New Pages to Create:
1. **PenaltiesPage** - Manage student penalties
2. **BehaviorsPage** - Track student behaviors
3. **ParticipationPage** - Track class participation (uses Behavior model)

---

## ✅ Migration Checklist

- [x] Update Prisma schema
- [x] Create new lookup tables
- [x] Create new operational models (Penalty, Behavior)
- [x] Update existing models (Subject, Announcement, Resource)
- [x] Update seed file with new lookup data
- [x] Run database migration (`prisma db push --force-reset`)
- [x] Seed database with lookup data
- [ ] Create backend services for new models
- [ ] Create backend controllers for new models
- [ ] Create backend routes for new models
- [ ] Update server.js to mount new routes
- [ ] Update frontend pages to use new lookup tables
- [ ] Create new frontend pages (Penalties, Behaviors, Participation)
- [ ] Test all CRUD operations
- [ ] Verify foreign key constraints
- [ ] Test data integrity

---

## 🎯 Benefits of This Migration

1. **Data Integrity**: Foreign key constraints ensure referential integrity
2. **Flexibility**: Easy to add new types without code changes
3. **Localization**: All lookup values support English and Arabic
4. **Audit Trail**: Full audit trail for all lookup tables and operational data
5. **Scalability**: Proper normalization allows for better performance
6. **Maintainability**: Centralized lookup management
7. **Consistency**: All dropdowns use the same pattern across the application
8. **Type Safety**: Integer IDs prevent typos and invalid values

---

## 📝 Notes

- All existing data was deleted during migration (database reset)
- All lookup tables follow the same pattern: `id`, `code`, `nameEn`, `nameAr`, `description`, `isActive`, audit fields
- All operational models include full audit trail: `createdBy`, `updatedBy`, `createdAt`, `updatedAt`
- Instructor assignment moved from Subject to Class level for better flexibility
- Penalty and Behavior models support optional class association for school-wide tracking
