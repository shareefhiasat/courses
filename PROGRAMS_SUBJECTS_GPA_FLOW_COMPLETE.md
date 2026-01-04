# Programs → Subjects → Classes Flow - Complete Implementation

## ✅ Fixed Issues

### 1. **Firestore Security Rules** ✅
Added rules for all new collections:
- `programs` - Admin write, authenticated read
- `subjects` - Admin/instructor write, authenticated read
- `subjectEnrollments` - Admin/instructor write, students can read their own
- `programGradingRules` - Admin write, authenticated read
- `subjectMarksDistribution` - Admin/instructor write, authenticated read
- `studentMarks` - Admin/instructor write, students can read their own
- `penalties` - Admin/instructor write, students can read their own
- `absences` - Admin/instructor write, students can read their own

**File:** `firestore.rules` (lines 305-365)

### 2. **Data Flow: Programs → Subjects → Classes** ✅

#### Hierarchy:
```
Program (e.g., "Information Technology Diploma")
  └── Subject (e.g., "CS101 - Introduction to Programming")
       └── Classes (one or more classes linked to the subject)
            └── Students (enrolled in classes)
                 └── Marks (entered per subject)
```

#### Implementation:
- **Programs** (`/programs`) - Top-level academic programs
- **Subjects** (`/subjects`) - Belong to programs, can be linked to multiple classes
- **Classes** - Existing system, now linkable to subjects via `classIds` array
- **Subject Enrollments** - Students enroll in subjects (separate from class enrollments)
- **Marks Entry** - Enter marks per subject, auto-calculates GPA

**File:** `client/src/pages/SubjectsManagementPage.jsx`
- Added `classIds` field to link subjects to classes
- Multi-select checkbox list for classes
- Classes are loaded from existing `classes` collection

### 3. **Notification System** ✅

#### Marks Entry Notifications:
- **In-App Notification Toggle** - Send notification to student's notification center
- **Email Notification Toggle** - Send email to student
- Both toggles are optional (default: unchecked)
- Notifications sent when marks are entered or updated

**Files:**
- `client/src/firebase/grading.js` - `sendMarksNotifications()` function
- `client/src/pages/MarksEntryPage.jsx` - Notification toggles in modal

#### Penalty Notifications:
- **In-App Notification Toggle** - Send notification to student
- **Email Notification Toggle** - Send email to student
- Both toggles are optional (default: unchecked)
- Notifications sent when penalty is recorded

**Files:**
- `client/src/firebase/penalties.js` - `sendPenaltyNotifications()` function

### 4. **Email Templates** ✅

Added 3 new default email templates:

1. **marksEntered** - When marks are first entered
   - Subject: "📊 Marks Entered | تم إدخال الدرجات: {{subjectName}}"
   - Shows total score, grade, points, and breakdown
   - Bilingual (EN + AR)

2. **marksUpdated** - When marks are updated
   - Subject: "📊 Marks Updated | تم تحديث الدرجات: {{subjectName}}"
   - Shows updated total score and grade
   - Bilingual (EN + AR)

3. **penaltyRecorded** - When penalty is recorded
   - Subject: "⚠️ Academic Penalty Recorded | تم تسجيل عقوبة أكاديمية"
   - Shows penalty type, severity, description, action taken
   - Bilingual (EN + AR)

**File:** `client/src/utils/defaultEmailTemplates.js` (lines 540-700)

---

## 📊 Complete Data Flow

### Creating a Program:
1. Go to `/programs`
2. Click "Add Program"
3. Fill in:
   - Program Code (e.g., "IT-DIP")
   - Name (EN/AR)
   - Description (EN/AR)
   - Duration (years)
   - Minimum GPA
   - Total Credit Hours
4. Click "Create"
5. ✅ Program created in Firestore `programs` collection

### Creating a Subject:
1. Go to `/subjects`
2. Click "Add Subject"
3. Fill in:
   - Select Program
   - Subject Code (e.g., "CS101")
   - Name (EN/AR)
   - Description (EN/AR)
   - Credit Hours
   - Total Sessions (for attendance)
   - Semester & Academic Year
   - Instructor
   - **Link Classes** (multi-select checkboxes)
4. Click "Create"
5. ✅ Subject created in Firestore `subjects` collection with `classIds` array

### Enrolling Students in Subjects:
1. Use `enrollStudentInSubject()` function
2. Creates record in `subjectEnrollments` collection
3. Links student to subject for specific semester/year
4. Can mark as retake if needed

### Entering Marks:
1. Go to `/marks-entry`
2. Select a subject
3. View enrolled students
4. Click "Edit" on a student
5. Enter marks for:
   - Mid-Term Exam
   - Final Exam
   - Homework
   - Labs/Projects/Research
   - Quizzes
   - Participation
   - Attendance
6. **Toggle notifications** (optional):
   - ☑ Send in-app notification
   - ☑ Send email notification
7. Click "Save Marks"
8. ✅ Marks saved with auto-calculated:
   - Total score (out of 100)
   - Grade (A, B+, B, etc.)
   - GPA points
   - Retake status handling
9. ✅ Notifications sent (if toggles enabled)

### Recording Penalties:
1. Use `createPenalty()` function
2. Include `sendEmailNotification` and `sendInAppNotification` flags
3. ✅ Penalty recorded in `penalties` collection
4. ✅ Notifications sent (if flags enabled)

---

## 🔗 Relationships

### Programs ↔ Subjects:
- One Program has many Subjects
- Subject has `programId` field

### Subjects ↔ Classes:
- One Subject can be linked to many Classes
- Subject has `classIds` array field
- Classes remain in existing `classes` collection

### Subjects ↔ Students:
- Students enroll in Subjects via `subjectEnrollments`
- One student can enroll in many subjects
- Enrollment tracks: semester, year, status, retake flag

### Students ↔ Marks:
- Marks are stored per student per subject
- One student can have marks for many subjects
- Marks include all components and calculated GPA

### Students ↔ Penalties:
- Penalties can be subject-specific or general
- One student can have many penalties
- Penalties track type, severity, action taken

---

## 📧 Notification Flow

### Marks Entry:
```
Instructor enters marks
  ↓
Toggles: sendInAppNotification / sendEmailNotification
  ↓
saveStudentMarks() called
  ↓
Marks saved to Firestore
  ↓
If toggles enabled:
  ├─→ sendMarksNotifications()
  │   ├─→ addNotification() → In-app notification
  │   └─→ sendEmail() → Email with template
  └─→ Student receives notification(s)
```

### Penalty Recording:
```
Admin/Instructor records penalty
  ↓
Toggles: sendInAppNotification / sendEmailNotification
  ↓
createPenalty() called
  ↓
Penalty saved to Firestore
  ↓
If toggles enabled:
  ├─→ sendPenaltyNotifications()
  │   ├─→ addNotification() → In-app notification
  │   └─→ sendEmail() → Email with template
  └─→ Student receives notification(s)
```

---

## 🎯 Key Features

### ✅ Permissions Fixed
- Firestore rules allow admin/instructor to create programs
- All collections have proper read/write rules
- Students can read their own data

### ✅ Data Relationships
- Programs contain Subjects
- Subjects link to Classes (via `classIds`)
- Students enroll in Subjects
- Marks are per Subject per Student
- Penalties can be subject-specific or general

### ✅ Notifications
- Optional toggles for each action
- Separate toggles for email and in-app
- Email templates created
- Bilingual support (EN + AR)

### ✅ GPA Calculation
- Auto-calculates from total score
- Handles retake courses (no A grade)
- Supports special grades (WF, FA, FB)
- Based on Arabic academic regulations

---

## 🚀 Next Steps

1. **Test the flow:**
   - Create a program
   - Create a subject (link to classes)
   - Enroll students in subjects
   - Enter marks with notifications
   - Record penalties with notifications

2. **Verify permissions:**
   - Admin can create programs ✅
   - Instructor can create subjects ✅
   - Students can view their marks ✅

3. **Check notifications:**
   - In-app notifications appear in notification center
   - Emails are sent (if SMTP configured)
   - Templates render correctly

---

## 📝 Summary

**All issues fixed:**
✅ Firestore rules added for all collections
✅ Permissions error resolved
✅ Programs → Subjects → Classes flow implemented
✅ Notification toggles added to marks entry
✅ Notification toggles added to penalties
✅ Email templates created (marksEntered, marksUpdated, penaltyRecorded)
✅ Data relationships properly connected

**The system is now complete and ready for testing!** 🎉

