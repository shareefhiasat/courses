# LMS Scheduling Features Implementation Plan

## Overview
This document outlines the implementation plan for integrating QAF-style scheduling features into the existing LMS system, based on the EduSchedule QAF SRS requirements.

---

## 1. Data Model Extensions

### 1.1 New Prisma Models

```prisma
// ============================================================================
// SCHEDULING MODULE MODELS
// ============================================================================

model SchedulingTeacherProfile {
  id                Int       @id @default(autoincrement())
  userId            Int       @unique  // Links to User model
  availableDays     String[]  // ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  subjectIds        Int[]     // Array of subject IDs this teacher can teach
  status            String    @default("Active")  // Active, OnLeave, Inactive
  maxSessionsPerDay Int      @default(3)
  contactPhone      String?
  contactEmail      String?
  notes             String?
  isActive          Boolean   @default(true)
  createdBy         Int?
  updatedBy         Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation("SchedulingTeacherProfileUser", fields: [userId], references: [id], onDelete: Cascade)
  scheduleSessions  ScheduleSession[]
  
  @@map("scheduling_teacher_profiles")
}

model SchedulingClassroom {
  id                Int       @id @default(autoincrement())
  programId         Int?     // Optional: classroom can be program-specific
  nameEn            String
  nameAr            String?
  capacity          Int
  locationEn        String?
  locationAr        String?
  availableDays     String[]  // ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  status            String    @default("Available")  // Available, UnderMaintenance, Closed
  equipment         String[]  // ["Projector", "Whiteboard", "Computers", etc.]
  isActive          Boolean   @default(true)
  createdBy         Int?
  updatedBy         Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  program           Program?  @relation("SchedulingClassroomProgram", fields: [programId], references: [id])
  scheduleSessions  ScheduleSession[]
  
  @@map("scheduling_classrooms")
}

model SchedulingTimeSlot {
  id                Int       @id @default(autoincrement())
  programId         Int?     // Optional: time slots can be program-specific
  labelEn           String
  labelAr           String?
  startTime         String    // "09:00"
  endTime           String    // "09:50"
  duration          Int       // in minutes
  isBreakSlot       Boolean   @default(false)
  breakType         String?   // "TeaBreak", "PrayerBreak", "LunchBreak"
  sortOrder         Int       @default(0)
  isActive          Boolean   @default(true)
  createdBy         Int?
  updatedBy         Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  program           Program?  @relation("SchedulingTimeSlotProgram", fields: [programId], references: [id])
  scheduleSessions  ScheduleSession[]
  
  @@unique([programId, sortOrder])
  @@map("scheduling_time_slots")
}

model SchedulingHoliday {
  id                Int       @id @default(autoincrement())
  programId         Int?     // Optional: holidays can be program-specific
  descriptionEn     String
  descriptionAr     String?
  type              String    // PublicHoliday, NationalDay, SemesterBreak, SummerVacation, WinterBreak, Other
  startDate         DateTime
  endDate           DateTime
  isRecurring       Boolean   @default(false)
  recurrencePattern String?   // "yearly", "monthly", etc.
  isActive          Boolean   @default(true)
  createdBy         Int?
  updatedBy         Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  program           Program?  @relation("SchedulingHolidayProgram", fields: [programId], references: [id])
  
  @@map("scheduling_holidays")
}

model ScheduleSession {
  id                Int       @id @default(autoincrement())
  programId         Int
  classId           Int
  subjectId         Int
  teacherProfileId  Int
  classroomId       Int
  timeSlotId        Int
  date              DateTime
  notes             String?
  isCancelled       Boolean   @default(false)
  cancelledAt       DateTime?
  cancelReason      String?
  isActive          Boolean   @default(true)
  createdBy         Int?
  updatedBy         Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  program           Program                  @relation(fields: [programId], references: [id])
  class             Class                    @relation(fields: [classId], references: [id])
  subject           Subject                  @relation(fields: [subjectId], references: [id])
  teacherProfile    SchedulingTeacherProfile @relation(fields: [teacherProfileId], references: [id])
  classroom         SchedulingClassroom      @relation(fields: [classroomId], references: [id])
  timeSlot          SchedulingTimeSlot       @relation(fields: [timeSlotId], references: [id])
  
  @@unique([classId, timeSlotId, date])
  @@index([date])
  @@index([teacherProfileId, date])
  @@index([classroomId, date])
  @@map("schedule_sessions")
}

model SchedulingCourseCategory {
  id                Int       @id @default(autoincrement())
  code              String    @unique
  nameEn            String
  nameAr            String?
  descriptionEn     String?
  descriptionAr     String?
  sortOrder         Int       @default(0)
  isActive          Boolean   @default(true)
  createdBy         Int?
  updatedBy         Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  subCategories     SchedulingCourseSubCategory[]
  
  @@map("scheduling_course_categories")
}

model SchedulingCourseSubCategory {
  id                Int       @id @default(autoincrement())
  categoryId        Int
  code              String    @unique
  nameEn            String
  nameAr            String?
  descriptionEn     String?
  descriptionAr     String?
  sortOrder         Int       @default(0)
  isActive          Boolean   @default(true)
  createdBy         Int?
  updatedBy         Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  category          SchedulingCourseCategory @relation(fields: [categoryId], references: [id])
  courses           SchedulingCourse[]
  
  @@map("scheduling_course_sub_categories")
}

model SchedulingCourse {
  id                Int       @id @default(autoincrement())
  subCategoryId     Int
  programId         Int?     // Links to actual Program
  code              String    @unique
  nameEn            String
  nameAr            String?
  descriptionEn     String?
  descriptionAr     String?
  icon              String?
  isActive          Boolean   @default(true)
  createdBy         Int?
  updatedBy         Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  subCategory       SchedulingCourseSubCategory @relation(fields: [subCategoryId], references: [id])
  program           Program?                     @relation("SchedulingCourseProgram", fields: [programId], references: [id])
  scheduleSessions  ScheduleSession[]
  
  @@map("scheduling_courses")
}

model SchedulingBackup {
  id                Int       @id @default(autoincrement())
  backupType        String    // "FULL", "COURSE"
  courseId          Int?      // For course-specific backups
  version           String    @default("2.0")
  data              Json      // Full backup data
  fileName          String
  fileSize          Int
  checksum          String?
  createdBy         Int
  createdAt         DateTime  @default(now())
  
  creator           User      @relation(fields: [createdBy], references: [id])
  
  @@map("scheduling_backups")
}
```

### 1.2 Existing Model Extensions

```prisma
// Extend User model with scheduling relations
model User {
  // ... existing fields ...
  schedulingTeacherProfile SchedulingTeacherProfile?
  schedulingBackups         SchedulingBackup[]
  
  // ... existing relations ...
}

// Extend Program model with scheduling relations
model Program {
  // ... existing fields ...
  schedulingClassrooms  SchedulingClassroom[]
  schedulingTimeSlots   SchedulingTimeSlot[]
  schedulingHolidays     SchedulingHoliday[]
  schedulingCourses      SchedulingCourse[]
  
  // ... existing relations ...
}

// Extend Class model with scheduling relations
model Class {
  // ... existing fields ...
  scheduleSessions ScheduleSession[]
  
  // ... existing relations ...
}

// Extend Subject model with scheduling relations
model Subject {
  // ... existing fields ...
  scheduleSessions ScheduleSession[]
  
  // ... existing relations ...
}
```

---

## 2. Conflict Detection System

### 2.1 Conflict Detection Service

```typescript
// services/schedulingConflictDetection.ts

export interface ConflictResult {
  hasConflict: boolean;
  conflictType?: 'teacher' | 'classroom' | 'max_sessions' | 'holiday' | 'weekend';
  message: string;
  messageAr: string;
  details?: any;
}

export class SchedulingConflictDetection {
  
  /**
   * Check for all conflicts before creating a schedule session
   */
  async checkSessionConflicts(sessionData: {
    teacherProfileId: number;
    classroomId: number;
    timeSlotId: number;
    date: Date;
    programId: number;
  }): Promise<ConflictResult[]> {
    const conflicts: ConflictResult[] = [];
    
    // 1. Teacher conflict
    const teacherConflict = await this.checkTeacherConflict(sessionData);
    if (teacherConflict.hasConflict) conflicts.push(teacherConflict);
    
    // 2. Classroom conflict
    const classroomConflict = await this.checkClassroomConflict(sessionData);
    if (classroomConflict.hasConflict) conflicts.push(classroomConflict);
    
    // 3. Max sessions per teacher per day
    const maxSessionsConflict = await this.checkMaxSessionsPerDay(sessionData);
    if (maxSessionsConflict.hasConflict) conflicts.push(maxSessionsConflict);
    
    // 4. Holiday conflict
    const holidayConflict = await this.checkHolidayConflict(sessionData);
    if (holidayConflict.hasConflict) conflicts.push(holidayConflict);
    
    // 5. Weekend conflict
    const weekendConflict = await this.checkWeekendConflict(sessionData);
    if (weekendConflict.hasConflict) conflicts.push(weekendConflict);
    
    return conflicts;
  }
  
  /**
   * Check if teacher is already scheduled at this time
   */
  private async checkTeacherConflict(sessionData: any): Promise<ConflictResult> {
    const existing = await prisma.scheduleSession.findFirst({
      where: {
        teacherProfileId: sessionData.teacherProfileId,
        timeSlotId: sessionData.timeSlotId,
        date: sessionData.date,
        isCancelled: false
      }
    });
    
    if (existing) {
      return {
        hasConflict: true,
        conflictType: 'teacher',
        message: 'Teacher conflict: already scheduled in this slot.',
        messageAr: 'تعارض: المعلم محجوز في هذه الحصة.',
        details: { existingSessionId: existing.id }
      };
    }
    
    return { hasConflict: false, message: '', messageAr: '' };
  }
  
  /**
   * Check if classroom is already booked at this time
   */
  private async checkClassroomConflict(sessionData: any): Promise<ConflictResult> {
    const existing = await prisma.scheduleSession.findFirst({
      where: {
        classroomId: sessionData.classroomId,
        timeSlotId: sessionData.timeSlotId,
        date: sessionData.date,
        isCancelled: false
      }
    });
    
    if (existing) {
      return {
        hasConflict: true,
        conflictType: 'classroom',
        message: 'Classroom conflict: already booked in this slot.',
        messageAr: 'تعارض: الفصل محجوز في هذه الحصة.',
        details: { existingSessionId: existing.id }
      };
    }
    
    return { hasConflict: false, message: '', messageAr: '' };
  }
  
  /**
   * Check if teacher exceeds max sessions per day (default: 3)
   */
  private async checkMaxSessionsPerDay(sessionData: any): Promise<ConflictResult> {
    const teacherProfile = await prisma.schedulingTeacherProfile.findUnique({
      where: { id: sessionData.teacherProfileId }
    });
    
    const maxSessions = teacherProfile?.maxSessionsPerDay || 3;
    
    const sessionCount = await prisma.scheduleSession.count({
      where: {
        teacherProfileId: sessionData.teacherProfileId,
        date: sessionData.date,
        isCancelled: false
      }
    });
    
    if (sessionCount >= maxSessions) {
      return {
        hasConflict: true,
        conflictType: 'max_sessions',
        message: `Teacher already has ${sessionCount} sessions today. Maximum ${maxSessions} sessions per teacher per day.`,
        messageAr: `المعلم لديه ${sessionCount} حصص اليوم بالفعل. الحد الأقصى ${maxSessions} حصص في اليوم الواحد.`,
        details: { currentCount: sessionCount, maxAllowed: maxSessions }
      };
    }
    
    return { hasConflict: false, message: '', messageAr: '' };
  }
  
  /**
   * Check if date falls on a holiday
   */
  private async checkHolidayConflict(sessionData: any): Promise<ConflictResult> {
    const holiday = await prisma.schedulingHoliday.findFirst({
      where: {
        programId: sessionData.programId,
        startDate: { lte: sessionData.date },
        endDate: { gte: sessionData.date },
        isActive: true
      }
    });
    
    if (holiday) {
      return {
        hasConflict: true,
        conflictType: 'holiday',
        message: `This date falls on a holiday: ${holiday.descriptionEn}. Cannot schedule.`,
        messageAr: `هذا التاريخ يوافق إجازة رسمية: ${holiday.descriptionAr}. لا يمكن الجدولة.`,
        details: { holidayId: holiday.id, holidayName: holiday.descriptionEn }
      };
    }
    
    return { hasConflict: false, message: '', messageAr: '' };
  }
  
  /**
   * Check if date is Friday (5) or Saturday (6)
   */
  private async checkWeekendConflict(sessionData: any): Promise<ConflictResult> {
    const dayOfWeek = sessionData.date.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return {
        hasConflict: true,
        conflictType: 'weekend',
        message: 'Friday and Saturday are weekend days. Cannot schedule.',
        messageAr: 'الجمعة والسبت أيام إجازة أسبوعية. لا يمكن الجدولة.',
        details: { dayOfWeek }
      };
    }
    
    return { hasConflict: false, message: '', messageAr: '' };
  }
}
```

---

## 3. Hierarchical Course Structure

### 3.1 Course Hierarchy Service

```typescript
// services/schedulingCourseHierarchy.ts

export class SchedulingCourseHierarchy {
  
  /**
   * Get full course hierarchy tree
   */
  async getCourseHierarchy(programId?: number) {
    const categories = await prisma.schedulingCourseCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            courses: {
              where: programId ? { programId } : undefined,
              where: { isActive: true },
              include: {
                program: true
              }
            }
          }
        }
      }
    });
    
    return categories;
  }
  
  /**
   * Get courses grouped by category for dropdown with optgroup
   */
  async getCoursesForDropdown(programId?: number) {
    const hierarchy = await this.getCourseHierarchy(programId);
    
    return hierarchy.map(category => ({
      label: category.nameEn,
      labelAr: category.nameAr,
      options: category.subCategories.flatMap(sub => 
        sub.courses.map(course => ({
          value: course.id,
          label: course.nameEn,
          labelAr: course.nameAr,
          subCategory: sub.nameEn,
          subCategoryAr: sub.nameAr
        }))
      )
    }));
  }
  
  /**
   * Initialize default course structure
   */
  async initializeDefaultCourses() {
    // Officers Category
    const officersCat = await prisma.schedulingCourseCategory.create({
      data: {
        code: 'OFFICERS',
        nameEn: 'Officers',
        nameAr: 'الضباط',
        sortOrder: 1
      }
    });
    
    const officersSub = await prisma.schedulingCourseSubCategory.create({
      data: {
        categoryId: officersCat.id,
        code: 'OFFICERS_MAIN',
        nameEn: 'Officers',
        nameAr: 'الضباط',
        sortOrder: 1
      }
    });
    
    // Foundation Course
    await prisma.schedulingCourse.create({
      data: {
        subCategoryId: officersSub.id,
        code: 'OFFICERS_FOUNDATION',
        nameEn: 'Foundation Course',
        nameAr: 'دورة الأساسيات',
        icon: '🎖️'
      }
    });
    
    // Advanced Course
    await prisma.schedulingCourse.create({
      data: {
        subCategoryId: officersSub.id,
        code: 'OFFICERS_ADVANCE',
        nameEn: 'Advanced Course',
        nameAr: 'الدورة المتقدمة',
        icon: '🎖️'
      }
    });
    
    // Females Category
    const femalesCat = await prisma.schedulingCourseCategory.create({
      data: {
        code: 'FEMALES',
        nameEn: 'Females',
        nameAr: 'الإناث',
        sortOrder: 2
      }
    });
    
    // Females - Officers Sub-category
    const femalesOfficersSub = await prisma.schedulingCourseSubCategory.create({
      data: {
        categoryId: femalesCat.id,
        code: 'FEMALES_OFFICERS',
        nameEn: 'Females - Officers',
        nameAr: 'الإناث - الضباط',
        sortOrder: 1
      }
    });
    
    // Females - Other Ranks Sub-category
    const femalesOtherSub = await prisma.schedulingCourseSubCategory.create({
      data: {
        categoryId: femalesCat.id,
        code: 'FEMALES_OTHER',
        nameEn: 'Females - Other Ranks',
        nameAr: 'الإناث - الرتب الأخرى',
        sortOrder: 2
      }
    });
    
    // ... create courses for each sub-category
    
    // Other Ranks Category
    const otherRanksCat = await prisma.schedulingCourseCategory.create({
      data: {
        code: 'OTHER_RANKS',
        nameEn: 'Other Ranks',
        nameAr: 'الرتب الأخرى',
        sortOrder: 3
      }
    });
    
    // ... create sub-categories and courses
  }
}
```

---

## 4. Print & Export System

### 4.1 Print Service

```typescript
// services/schedulingPrintService.ts

export class SchedulingPrintService {
  
  /**
   * Generate QAF-formatted weekly schedule HTML
   */
  async generateWeeklySchedulePrint(courseId: number, weekStart: Date) {
    const course = await prisma.schedulingCourse.findUnique({
      where: { id: courseId },
      include: {
        subCategory: {
          include: { category: true }
        },
        program: true
      }
    });
    
    // Get sessions for the week (Sunday-Thursday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const sessions = await prisma.scheduleSession.findMany({
      where: {
        courseId,
        date: { gte: weekStart, lte: weekEnd },
        isCancelled: false
      },
      include: {
        subject: true,
        teacherProfile: { include: { user: true } },
        classroom: true,
        timeSlot: true
      },
      orderBy: [
        { date: 'asc' },
        { timeSlot: { sortOrder: 'asc' } }
      ]
    });
    
    // Get time slots (excluding breaks)
    const timeSlots = await prisma.schedulingTimeSlot.findMany({
      where: {
        programId: course.programId,
        isBreakSlot: false,
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    // Get break slots for sidebar
    const breakSlots = await prisma.schedulingTimeSlot.findMany({
      where: {
        programId: course.programId,
        isBreakSlot: true,
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    // Generate HTML with QAF branding
    return this.generateQAFPrintHTML({
      course,
      sessions,
      timeSlots,
      breakSlots,
      weekStart,
      weekEnd
    });
  }
  
  /**
   * Generate QAF print HTML with official branding
   */
  private generateQAFPrintHTML(data: any): string {
    const { course, sessions, timeSlots, breakSlots, weekStart, weekEnd } = data;
    
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${course.nameEn} - Weekly Schedule</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    body {
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      font-size: 9px;
      direction: rtl;
    }
    .qaf-header {
      border-bottom: 3px double #1a3a28;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .qaf-logo {
      width: 50px;
      height: 50px;
    }
    .classified {
      color: #cc0000;
      font-weight: bold;
      border: 2px solid #cc0000;
      padding: 4px 12px;
      display: inline-block;
    }
    .schedule-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
    }
    .schedule-table th {
      background: #1a3a28;
      color: white;
      padding: 4px;
      text-align: center;
      border: 1px solid #1a3a28;
    }
    .schedule-table td {
      border: 1px solid #aaa;
      padding: 3px;
      text-align: center;
      vertical-align: middle;
    }
    .session-cell {
      background: #e8f0e8;
    }
    .session-subject {
      font-weight: bold;
      color: #1a3a28;
      display: block;
    }
    .session-teacher {
      color: #444;
      font-size: 7px;
      display: block;
    }
    .session-room {
      color: #777;
      font-size: 7px;
      display: block;
    }
    .break-sidebar {
      border: 2px solid #333;
      border-right: 3px double #333;
      border-left: 3px double #333;
      width: 30px;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      text-align: center;
      font-weight: bold;
      color: #1a3a28;
    }
    .qaf-footer {
      border-top: 2px solid #1a3a28;
      margin-top: 10px;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
    }
    .signature-line {
      text-align: center;
      min-width: 150px;
    }
    .signature-title {
      font-weight: bold;
      margin-bottom: 20px;
    }
    .signature-name {
      border-top: 1px solid #555;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="qaf-header">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="/qaf-logo.png" class="qaf-logo" alt="QAF Logo">
        <div>
          <div style="font-weight: bold; font-size: 14px; color: #1a3a28;">
            سلاح الإشارة الأميري القطري
          </div>
          <div style="font-size: 11px; color: #333;">
            مدرسة الإشارة وتقنية المعلومات
          </div>
        </div>
      </div>
      <div class="classified">RESTRICTED</div>
    </div>
  </div>
  
  <div style="background: #e8f0e8; padding: 4px 8px; border-right: 3px solid #1a3a28; margin-bottom: 10px;">
    <strong>${course.nameAr}</strong> - ${this.formatDateRange(weekStart, weekEnd)}
  </div>
  
  <table class="schedule-table">
    <thead>
      <tr>
        <th style="width: 60px;">الحصة</th>
        <th style="width: 80px;">الأحد</th>
        <th style="width: 80px;">الإثنين</th>
        <th style="width: 80px;">الثلاثاء</th>
        <th style="width: 80px;">الأربعاء</th>
        <th style="width: 80px;">الخميس</th>
        <th class="break-sidebar">استراحات</th>
      </tr>
    </thead>
    <tbody>
      ${this.generateScheduleRows(sessions, timeSlots, breakSlots)}
    </tbody>
  </table>
  
  <div class="qaf-footer">
    <div class="signature-line">
      <div class="signature-title">قائد المدرسة</div>
      <div class="signature-name">الاسم / الرتبة</div>
    </div>
    <div class="signature-line">
      <div class="signature-title">رئيس الشعبة التعليمية</div>
      <div class="signature-name">الاسم / الرتبة</div>
    </div>
    <div class="signature-line">
      <div class="signature-title">مدير الجدول</div>
      <div class="signature-name">الاسم / الرتبة</div>
    </div>
  </div>
</body>
</html>
    `;
  }
  
  /**
   * Export schedule to CSV
   */
  async exportScheduleToCSV(courseId: number, filters: any) {
    const sessions = await prisma.scheduleSession.findMany({
      where: {
        courseId,
        ...filters
      },
      include: {
        subject: true,
        teacherProfile: { include: { user: true } },
        classroom: true,
        timeSlot: true
      },
      orderBy: [
        { date: 'asc' },
        { timeSlot: { sortOrder: 'asc' } }
      ]
    });
    
    const headers = ['Date', 'Day', 'Period', 'Time', 'Subject', 'Teacher', 'Classroom', 'Notes'];
    const rows = sessions.map(s => [
      s.date.toISOString().split('T')[0],
      this.getDayName(s.date),
      s.timeSlot.labelEn,
      `${s.timeSlot.startTime} - ${s.timeSlot.endTime}`,
      s.subject.nameEn,
      s.teacherProfile.user.displayName || s.teacherProfile.user.email,
      s.classroom.nameEn,
      s.notes || ''
    ]);
    
    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    return csv;
  }
}
```

---

## 5. Backup & Restore System

### 5.1 Backup Service

```typescript
// services/schedulingBackupService.ts

export class SchedulingBackupService {
  
  /**
   * Create full backup of all scheduling data
   */
  async createFullBackup(userId: number): Promise<string> {
    const backupData = {
      _type: 'QAF_FULL_BACKUP',
      _version: '2.0',
      _date: new Date().toISOString(),
      
      // Shared data (across all courses)
      shared: {
        teachers: await prisma.schedulingTeacherProfile.findMany({
          include: { user: true }
        }),
        subjects: await prisma.subject.findMany()
      },
      
      // Course definitions
      coursesList: await prisma.schedulingCourse.findMany({
        include: {
          subCategory: {
            include: { category: true }
          }
        }
      }),
      
      categoriesList: await prisma.schedulingCourseCategory.findMany(),
      
      // Current course selection
      currentCourseId: null, // Would come from user preferences
      
      // Per-course data
      courses: {}
    };
    
    // Get all courses and their data
    const courses = await prisma.schedulingCourse.findMany();
    for (const course of courses) {
      backupData.courses[course.id] = {
        classrooms: await prisma.schedulingClassroom.findMany({
          where: { programId: course.programId }
        }),
        timeSlots: await prisma.schedulingTimeSlot.findMany({
          where: { programId: course.programId }
        }),
        holidays: await prisma.schedulingHoliday.findMany({
          where: { programId: course.programId }
        }),
        schedule: await prisma.scheduleSession.findMany({
          where: { courseId: course.id },
          include: {
            subject: true,
            teacherProfile: { include: { user: true } },
            classroom: true,
            timeSlot: true
          }
        })
      };
    }
    
    // Save backup record
    const backup = await prisma.schedulingBackup.create({
      data: {
        backupType: 'FULL',
        version: '2.0',
        data: backupData as any,
        fileName: `eduschedule-backup-${new Date().toISOString().split('T')[0]}.json`,
        fileSize: JSON.stringify(backupData).length,
        checksum: this.generateChecksum(backupData),
        createdBy: userId
      }
    });
    
    return backup.id.toString();
  }
  
  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: number, userId: number): Promise<void> {
    const backup = await prisma.schedulingBackup.findUnique({
      where: { id: backupId }
    });
    
    if (!backup) {
      throw new Error('Backup not found');
    }
    
    const data = backup.data as any;
    
    // Validate backup format
    if (data._type !== 'QAF_FULL_BACKUP') {
      throw new Error('Invalid backup format');
    }
    
    // Restore shared data
    await this.restoreSharedData(data.shared);
    
    // Restore course structure
    await this.restoreCourseStructure(data.coursesList, data.categoriesList);
    
    // Restore per-course data
    for (const [courseId, courseData] of Object.entries(data.courses)) {
      await this.restoreCourseData(parseInt(courseId), courseData as any);
    }
    
    // Log restore action
    await this.logRestoreAction(backupId, userId);
  }
  
  /**
   * Check if backup reminder should show (Thursday)
   */
  async shouldShowBackupReminder(): Promise<boolean> {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 4 = Thursday
    
    if (dayOfWeek !== 4) return false;
    
    // Check if backup already done this week
    const lastBackup = await prisma.schedulingBackup.findFirst({
      where: {
        createdBy: userId, // Would need to pass userId
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return !lastBackup;
  }
  
  private generateChecksum(data: any): string {
    // Simple checksum implementation
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 32);
  }
  
  private async restoreSharedData(shared: any) {
    // Restore teachers
    for (const teacher of shared.teachers) {
      await prisma.schedulingTeacherProfile.upsert({
        where: { userId: teacher.userId },
        update: teacher,
        create: teacher
      });
    }
    
    // Restore subjects
    for (const subject of shared.subjects) {
      await prisma.subject.upsert({
        where: { id: subject.id },
        update: subject,
        create: subject
      });
    }
  }
  
  private async restoreCourseStructure(courses: any[], categories: any[]) {
    // Implementation for restoring course hierarchy
  }
  
  private async restoreCourseData(courseId: number, data: any) {
    // Implementation for restoring course-specific data
  }
  
  private async logRestoreAction(backupId: number, userId: number) {
    // Log the restore action for audit trail
  }
}
```

---

## 6. Scheduling-Specific Views

### 6.1 View Components Structure

```
components/scheduling/
├── SchedulingDashboard/
│   ├── index.tsx
│   ├── StatCards.tsx
│   ├── TodaySchedule.tsx
│   ├── UpcomingHolidays.tsx
│   ├── TeacherLoadChart.tsx
│   └── SubjectSessionsChart.tsx
├── ScheduleViews/
│   ├── TableView.tsx          # Grid format
│   ├── WeekView.tsx           # Sunday-Thursday, color-coded
│   ├── DayView.tsx            # Single day with navigation
│   ├── MonthView.tsx          # Calendar with session badges
│   └── CalendarDetailPopup.tsx # Click on date for details
├── ScheduleManagement/
│   ├── SessionForm.tsx        # Create/edit session
│   ├── ConflictAlert.tsx      # Show conflicts
│   ├── BulkScheduler.tsx      # Bulk scheduling tool
│   └── ScheduleFilters.tsx    # Filter by teacher/room/subject
└── SchedulingReports/
    ├── WeeklyScheduleReport.tsx
    ├── TeacherScheduleReport.tsx
    ├── ClassroomUtilizationReport.tsx
    └── ConflictReport.tsx
```

---

## 7. Time Slot Management

### 7.1 Default Time Slot Configuration

```typescript
// services/schedulingTimeSlotService.ts

export class SchedulingTimeSlotService {
  
  /**
   * Initialize default time slots for a program
   */
  async initializeDefaultTimeSlots(programId: number) {
    const defaultSlots = [
      // Teaching periods (7 periods)
      { labelEn: 'Period 1', labelAr: 'الحصة الأولى', start: '07:30', end: '08:20', duration: 50, sortOrder: 1 },
      { labelEn: 'Period 2', labelAr: 'الحصة الثانية', start: '08:25', end: '09:15', duration: 50, sortOrder: 2 },
      { labelEn: 'Period 3', labelAr: 'الحصة الثالثة', start: '10:05', end: '10:55', duration: 50, sortOrder: 3 },
      { labelEn: 'Period 4', labelAr: 'الحصة الرابعة', start: '11:00', end: '11:50', duration: 50, sortOrder: 4 },
      { labelEn: 'Period 5', labelAr: 'الحصة الخامسة', start: '12:05', end: '12:55', duration: 50, sortOrder: 5 },
      { labelEn: 'Period 6', labelAr: 'الحصة السادسة', start: '13:00', end: '13:50', duration: 50, sortOrder: 6 },
      { labelEn: 'Period 7', labelAr: 'الحصة السابعة', start: '13:55', end: '14:45', duration: 50, sortOrder: 7 },
      
      // Break slots (not schedulable)
      { labelEn: 'Tea Break', labelAr: 'استراحة شاي', start: '09:20', end: '10:00', duration: 40, isBreakSlot: true, breakType: 'TeaBreak', sortOrder: 2.5 },
      { labelEn: 'Prayer Break', labelAr: 'استراحة صلاة', start: '11:55', end: '12:05', duration: 10, isBreakSlot: true, breakType: 'PrayerBreak', sortOrder: 4.5 }
    ];
    
    for (const slot of defaultSlots) {
      await prisma.schedulingTimeSlot.create({
        data: {
          programId,
          ...slot
        }
      });
    }
  }
  
  /**
   * Get schedulable time slots (excludes breaks)
   */
  async getSchedulableTimeSlots(programId: number) {
    return prisma.schedulingTimeSlot.findMany({
      where: {
        programId,
        isBreakSlot: false,
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    });
  }
  
  /**
   * Get break slots for print sidebar
   */
  async getBreakSlots(programId: number) {
    return prisma.schedulingTimeSlot.findMany({
      where: {
        programId,
        isBreakSlot: true,
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    });
  }
}
```

---

## 8. Teacher Availability Management

### 8.1 Teacher Profile Service

```typescript
// services/schedulingTeacherService.ts

export class SchedulingTeacherService {
  
  /**
   * Create or update teacher scheduling profile
   */
  async upsertTeacherProfile(data: {
    userId: number;
    availableDays: string[];
    subjectIds: number[];
    status: string;
    maxSessionsPerDay?: number;
    contactPhone?: string;
    contactEmail?: string;
    notes?: string;
  }) {
    return prisma.schedulingTeacherProfile.upsert({
      where: { userId: data.userId },
      update: data,
      create: data
    });
  }
  
  /**
   * Get teacher profile with user info
   */
  async getTeacherProfile(userId: number) {
    return prisma.schedulingTeacherProfile.findUnique({
      where: { userId },
      include: {
        user: true
      }
    });
  }
  
  /**
   * Get available teachers for a subject and time slot
   */
  async getAvailableTeachers(subjectId: number, date: Date, timeSlotId: number) {
    // Get teachers who can teach this subject
    const teachers = await prisma.schedulingTeacherProfile.findMany({
      where: {
        subjectIds: { has: subjectId },
        status: 'Active',
        isActive: true
      },
      include: {
        user: true
      }
    });
    
    // Filter by availability
    const dayOfWeek = this.getDayName(date);
    const availableTeachers = teachers.filter(teacher => 
      teacher.availableDays.includes(dayOfWeek)
    );
    
    // Filter out already scheduled teachers
    const scheduledTeacherIds = await prisma.scheduleSession.findMany({
      where: {
        timeSlotId,
        date,
        isCancelled: false
      },
      select: { teacherProfileId: true }
    });
    
    const scheduledIds = new Set(scheduledTeacherIds.map(s => s.teacherProfileId));
    
    return availableTeachers.filter(t => !scheduledIds.has(t.id));
  }
  
  /**
   * Get teacher load for a month
   */
  async getTeacherLoad(teacherProfileId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const sessions = await prisma.scheduleSession.findMany({
      where: {
        teacherProfileId,
        date: { gte: startDate, lte: endDate },
        isCancelled: false
      },
      include: {
        subject: true
      }
    });
    
    // Group by subject
    const bySubject = sessions.reduce((acc, session) => {
      const subjectName = session.subject.nameEn;
      acc[subjectName] = (acc[subjectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalSessions: sessions.length,
      bySubject,
      sessions
    };
  }
}
```

---

## 9. Classroom Management

### 9.1 Classroom Service

```typescript
// services/schedulingClassroomService.ts

export class SchedulingClassroomService {
  
  /**
   * Create or update classroom
   */
  async upsertClassroom(data: {
    programId?: number;
    nameEn: string;
    nameAr?: string;
    capacity: number;
    locationEn?: string;
    locationAr?: string;
    availableDays: string[];
    status: string;
    equipment?: string[];
  }) {
    return prisma.schedulingClassroom.upsert({
      where: { id: data.id || 0 }, // Assuming id is passed for update
      update: data,
      create: data
    });
  }
  
  /**
   * Get available classrooms for a time slot
   */
  async getAvailableClassrooms(date: Date, timeSlotId: number, programId?: number) {
    const dayOfWeek = this.getDayName(date);
    
    const classrooms = await prisma.schedulingClassroom.findMany({
      where: {
        programId: programId || undefined,
        availableDays: { has: dayOfWeek },
        status: 'Available',
        isActive: true
      }
    });
    
    // Filter out already booked classrooms
    const bookedRoomIds = await prisma.scheduleSession.findMany({
      where: {
        timeSlotId,
        date,
        isCancelled: false
      },
      select: { classroomId: true }
    });
    
    const bookedIds = new Set(bookedRoomIds.map(s => s.classroomId));
    
    return classrooms.filter(c => !bookedIds.has(c.id));
  }
  
  /**
   * Get classroom utilization report
   */
  async getClassroomUtilization(classroomId: number, startDate: Date, endDate: Date) {
    const sessions = await prisma.scheduleSession.findMany({
      where: {
        classroomId,
        date: { gte: startDate, lte: endDate },
        isCancelled: false
      }
    });
    
    const totalSlots = await this.getTotalSlotsInPeriod(startDate, endDate);
    const utilization = (sessions.length / totalSlots) * 100;
    
    return {
      classroomId,
      totalSessions: sessions.length,
      totalSlots,
      utilizationPercentage: utilization.toFixed(2),
      sessions
    };
  }
}
```

---

## 10. Dashboard Scheduling Stats

### 10.1 Dashboard Stats Service

```typescript
// services/schedulingDashboardService.ts

export class SchedulingDashboardService {
  
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(userId: number, courseId?: number) {
    const today = new Date();
    const weekStart = this.getWeekStart(today);
    const weekEnd = this.getWeekEnd(today);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      // Core counts
      totalTeachers: await prisma.schedulingTeacherProfile.count({
        where: { isActive: true, status: 'Active' }
      }),
      totalSubjects: await prisma.subject.count({ where: { isActive: true } }),
      totalClassrooms: await prisma.schedulingClassroom.count({
        where: { isActive: true, status: 'Available' }
      }),
      
      // Session counts
      sessionsThisWeek: await prisma.scheduleSession.count({
        where: {
          courseId,
          date: { gte: weekStart, lte: weekEnd },
          isCancelled: false
        }
      }),
      sessionsThisMonth: await prisma.scheduleSession.count({
        where: {
          courseId,
          date: { gte: monthStart, lte: monthEnd },
          isCancelled: false
        }
      }),
      
      // Today's schedule
      todaySchedule: await this.getTodaySchedule(courseId, today),
      
      // Upcoming holidays
      upcomingHolidays: await this.getUpcomingHolidays(courseId, today),
      
      // Teacher load chart data
      teacherLoadChart: await this.getTeacherLoadChart(courseId, monthStart, monthEnd),
      
      // Subject sessions chart data
      subjectSessionsChart: await this.getSubjectSessionsChart(courseId, monthStart, monthEnd)
    };
  }
  
  private async getTodaySchedule(courseId: number | undefined, date: Date) {
    return prisma.scheduleSession.findMany({
      where: {
        courseId,
        date,
        isCancelled: false
      },
      include: {
        subject: true,
        teacherProfile: { include: { user: true } },
        classroom: true,
        timeSlot: true
      },
      orderBy: { timeSlot: { sortOrder: 'asc' } }
    });
  }
  
  private async getUpcomingHolidays(courseId: number | undefined, date: Date) {
    return prisma.schedulingHoliday.findMany({
      where: {
        programId: courseId ? undefined : undefined, // Would need to get programId from course
        startDate: { gte: date },
        isActive: true
      },
      orderBy: { startDate: 'asc' },
      take: 5
    });
  }
  
  private async getTeacherLoadChart(courseId: number | undefined, startDate: Date, endDate: Date) {
    const sessions = await prisma.scheduleSession.findMany({
      where: {
        courseId,
        date: { gte: startDate, lte: endDate },
        isCancelled: false
      },
      include: {
        teacherProfile: { include: { user: true } }
      }
    });
    
    // Group by teacher
    const byTeacher = sessions.reduce((acc, session) => {
      const teacherName = session.teacherProfile.user.displayName || session.teacherProfile.user.email;
      acc[teacherName] = (acc[teacherName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(byTeacher).map(([name, count]) => ({ name, count }));
  }
  
  private async getSubjectSessionsChart(courseId: number | undefined, startDate: Date, endDate: Date) {
    const sessions = await prisma.scheduleSession.findMany({
      where: {
        courseId,
        date: { gte: startDate, lte: endDate },
        isCancelled: false
      },
      include: { subject: true }
    });
    
    const bySubject = sessions.reduce((acc, session) => {
      const subjectName = session.subject.nameEn;
      acc[subjectName] = (acc[subjectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(bySubject).map(([name, count]) => ({ name, count }));
  }
  
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust for Sunday being 0
    return new Date(d.setDate(diff));
  }
  
  private getWeekEnd(date: Date): Date {
    const start = this.getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Saturday
    return end;
  }
}
```

---

## Implementation Phases

### Phase 1: Data Models (Week 1-2)
- Add new Prisma models
- Run migrations
- Create seed data scripts
- Test model relationships

### Phase 2: Core Services (Week 3-4)
- Conflict detection service
- Teacher profile service
- Classroom service
- Time slot service
- Holiday service

### Phase 3: API Endpoints (Week 5-6)
- REST API for all scheduling operations
- GraphQL schema (if using GraphQL)
- Authentication & authorization integration
- Input validation

### Phase 4: UI Components (Week 7-8)
- Dashboard with stats
- Schedule views (table, week, day, month)
- Session management forms
- Teacher/classroom/time slot management pages

### Phase 5: Advanced Features (Week 9-10)
- Print & export system
- Backup & restore
- Course hierarchy management
- Bulk scheduling tools

### Phase 6: Testing & Deployment (Week 11-12)
- Unit tests
- Integration tests
- E2E tests
- Performance optimization
- Documentation

---

## Notes

- This implementation integrates with the existing LMS structure
- Uses existing User, Program, Subject, Class models where possible
- Maintains bilingual support (nameEn/nameAr pattern)
- Follows existing patterns for createdBy/updatedBy audit fields
- Compatible with existing role-based access control
