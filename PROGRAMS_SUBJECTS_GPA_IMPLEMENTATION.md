# Programs, Subjects, and GPA System Implementation

## Overview

This document outlines the implementation of a comprehensive academic management system based on Arabic academic regulations, including Programs, Subjects, GPA grading, marks distribution, penalties, and absences tracking.

## Data Structure

### 1. Programs Collection (`programs`)

```javascript
{
  docId: string,
  name_en: string,
  name_ar: string,
  code: string,
  description_en?: string,
  description_ar?: string,
  duration_years: number, // e.g., 2 for diploma
  minGPA: number, // e.g., 1.5
  totalCreditHours: number, // e.g., 70
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. Subjects Collection (`subjects`)

```javascript
{
  docId: string,
  programId: string, // Reference to program
  code: string, // e.g., "CS101"
  name_en: string,
  name_ar: string,
  description_en?: string,
  description_ar?: string,
  creditHours: number,
  instructorId?: string, // Reference to user
  semester: string, // "fall" | "spring" | "summer"
  academicYear: string, // e.g., "2024-2025"
  totalSessions: number, // For attendance calculation
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3. Subject Enrollments (`subjectEnrollments`)

```javascript
{
  docId: string,
  studentId: string,
  subjectId: string,
  semester: string,
  academicYear: string,
  status: "active" | "completed" | "withdrawn" | "failed",
  isRetake: boolean,
  enrolledAt: Timestamp,
  updatedAt?: Timestamp
}
```

### 4. Program Grading Rules (`programGradingRules`)

```javascript
{
  docId: string, // Same as programId
  programId: string,
  gradingScale: Array<{
    grade: string,
    description_ar: string,
    description_en: string,
    minScore: number,
    maxScore: number,
    points: number
  }>,
  retakeGradingScale: Array<{...}>,
  useDefault: boolean
}
```

### 5. Subject Marks Distribution (`subjectMarksDistribution`)

```javascript
{
  docId: string, // Same as subjectId
  subjectId: string,
  midTermExam: number, // percentage, e.g., 20
  finalExam: number, // e.g., 40
  homework: number, // e.g., 5
  labsProjectResearch: number, // e.g., 10
  quizzes: number, // e.g., 5
  participation: number, // e.g., 10
  attendance: number, // e.g., 10
  total: 100,
  updatedAt: Timestamp
}
```

### 6. Student Marks (`studentMarks`)

```javascript
{
  docId: string,
  studentId: string,
  subjectId: string,
  semester: string,
  academicYear: string,
  marks: {
    midTermExam: number,
    finalExam: number,
    homework: number,
    labsProjectResearch: number,
    quizzes: number,
    participation: number,
    attendance: number
  },
  totalScore: number, // Calculated out of 100
  grade: string, // "A", "B+", "F", "FA", "FB", etc.
  points: number, // GPA points
  isRetake: boolean,
  instructorId: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 7. Absences (`absences`)

```javascript
{
  docId: string,
  studentId: string,
  subjectId: string,
  date: Timestamp,
  type: "with_excuse" | "without_excuse" | "bereavement" | "beyond_control",
  excuseDocument?: string, // URL or reference
  notes?: string,
  semester: string,
  academicYear: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 8. Penalties (`penalties`)

```javascript
{
  docId: string,
  studentId: string,
  subjectId?: string, // null if not subject-specific
  type: "cheating" | "attempted_cheating" | "impersonation" | "exam_disruption" | "forgery" | "other",
  description: string,
  severity: "warning" | "minor" | "major" | "severe",
  action: string, // What action was taken
  reportedBy: string, // instructorId or adminId
  date: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Grading Rules

### Regular Course Grading

- A (ممتاز): 90-100, 4.0 points
- B+ (جيد جداً مرتفع): 85-89, 3.5 points
- B (جيد جداً): 80-84, 3.0 points
- C+ (جيد مرتفع): 75-79, 2.5 points
- C (جيد): 70-74, 2.0 points
- D+ (مقبول مرتفع): 65-69, 1.5 points
- D (مقبول): 60-64, 1.0 points
- F (راسب): 0-59, 0.0 points
- WF (انسحاب إجباري): Mandatory Withdrawal
- FA (رسوب بسبب تغيبه): Failure due to absence from final exam
- FB (رسوب بسبب تجاوز نسبة الغياب): Failure due to exceeding 20% absence

### Retake Course Grading

- No A grade
- B+: 85-100, 3.5 points
- Rest same as regular grading

## Absence Rules

- Maximum 20% absence allowed (with or without excuse)
- Maximum 10% without excuse (half of total allowed)
- With official excuse: -0.25 points per session
- Without excuse: -0.50 points per session
- Bereavement: No deduction, 3 days leave
- Exceeding 20%: Automatic FB grade

## Default Marks Distribution

- Mid-term Exam: 20%
- Final Exam: 40%
- Homework: 5%
- Labs/Project/Research: 10%
- Quizzes: 5%
- Participation: 10%
- Attendance: 10%
- **Total: 100%**

## Implementation Files

### Firebase Services

1. `client/src/firebase/programs.js` ✅ Created
2. `client/src/firebase/grading.js` ✅ Created
3. `client/src/firebase/penalties.js` ✅ Created

### Dashboard Pages

1. `client/src/pages/ProgramsManagementPage.jsx` - Manage programs
2. `client/src/pages/SubjectsManagementPage.jsx` - Manage subjects
3. `client/src/pages/MarksEntryPage.jsx` - Instructor marks entry
4. `client/src/pages/GradingRulesPage.jsx` - Configure grading rules
5. `client/src/pages/AbsencesPenaltiesPage.jsx` - Track absences and penalties

### Integration

- Add new tabs to DashboardPage under "Academic" category
- Add routes in App.jsx
- Update SideDrawer navigation

## Features to Implement

### 1. Programs Management

- Create/Edit/Delete programs
- Set program requirements (min GPA, credit hours, duration)
- Configure custom grading rules per program
- View all subjects in a program

### 2. Subjects Management

- Create/Edit/Delete subjects
- Assign to programs
- Set marks distribution
- Assign instructors
- Set total sessions for attendance tracking
- Enable/disable enrollment

### 3. Enrollment System

- Enroll students in subjects
- Track enrollment status
- Mark as retake
- View student enrollments

### 4. Marks Entry (Instructor)

- Enter marks for each component
- Auto-calculate total score
- Auto-assign grade based on GPA rules
- Handle retake grading
- Save and update marks
- Send notifications on marks entry

### 5. Grading Rules Configuration

- View default grading rules
- Customize per program
- Preview grade calculations

### 6. Absences Tracking

- Record absences with type
- Calculate absence percentage
- Auto-flag if exceeds 20%
- Apply attendance deductions
- Generate absence reports

### 7. Penalties Management

- Record penalties
- Link to subjects or general
- Track penalty history
- Generate reports

### 8. Student View

- View enrolled subjects
- View marks and grades
- View absence records
- View penalties
- Calculate cumulative GPA

## Next Steps

1. Create ProgramsManagementPage
2. Create SubjectsManagementPage
3. Create MarksEntryPage
4. Create GradingRulesPage
5. Create AbsencesPenaltiesPage
6. Integrate into DashboardPage
7. Add routes
8. Update navigation
9. Add notifications for marks entry
10. Create student-facing views
