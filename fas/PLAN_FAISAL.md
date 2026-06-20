# Scheduling Summary Dashboard Enhancement Plan
This plan enhances the existing SummaryDashboardPage with comprehensive scheduling statistics, break session management, holiday tracking, and official teacher effort reports with role-based access control and auto-refresh functionality.
## Overview
Enhance the existing SummaryDashboardPage to provide a comprehensive scheduling summary with break sessions, holidays, teacher effort reports, and role-based data visibility. Add shortcuts from scheduling screens and implement auto-refresh with countdown timer.
## Current State Analysis
**Existing Components:**
- `SummaryDashboardPage.jsx` - Basic dashboard with teacher/classroom/session counts
- `SchedulingCalendarPage.jsx` - Full scheduling calendar with availability panels
- `SchedulingDefinedAvailabilityCards.jsx` - Availability display cards
- Existing scheduling services and utilities
**Missing Features:**
- Break session tracking and display
- Holiday management and impact analysis
- Teacher effort reports with detailed metrics
- Auto-refresh with countdown timer
- Role-based data filtering
- Export to PDF/Excel with QAF branding
## Implementation Plan
### Phase 1: Data Model Extensions
#### 1.1 Add Break Session Model
```prisma
model BreakSession {
  id                Int       @id @default(autoincrement())
  programId         Int
  teacherProfileId  Int?
  classroomId       Int?
  timeSlotId        Int
  date              DateTime
  breakType         String    // "TeaBreak", "PrayerBreak", "LunchBreak", "Other"
  notes             String?
  isRecurring       Boolean   @default(false)
  recurrencePattern String?
  isActive          Boolean   @default(true)
  createdBy         Int?
  updatedBy         Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  program           Program                  @relation(fields: [programId], references: [id])
  teacherProfile    SchedulingTeacherProfile? @relation(fields: [teacherProfileId], references: [id])
  classroom         SchedulingClassroom?     @relation(fields: [classroomId], references: [id])
  timeSlot          SchedulingTimeSlot       @relation(fields: [timeSlotId], references: [id])
  
  @@unique([timeSlotId, date, teacherProfileId, classroomId])
  @@index([date])
  @@index([teacherProfileId, date])
  @@index([classroomId, date])
  @@map("break_sessions")
}
```
#### 1.2 Add Holiday Model
```prisma
model SchedulingHoliday {
  id                Int       @id @default(autoincrement())
  programId         Int?
  descriptionEn     String
  descriptionAr     String?
  type              String    // "PublicHoliday", "NationalDay", "SemesterBreak", "SummerVacation", "WinterBreak", "Other"
  startDate         DateTime
  endDate           DateTime
  isRecurring       Boolean   @default(false)
  recurrencePattern String?
  isActive          Boolean   @default(true)
  createdBy         Int?
  updatedBy         Int?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  program           Program? @relation(fields: [programId], references: [id])
  
  @@map("scheduling_holidays")
}
```
#### 1.3 Extend Existing Models
```prisma
// Extend Program model
model Program {
  // ... existing fields
  breakSessions     BreakSession[]
  schedulingHolidays SchedulingHoliday[]
}
// Extend SchedulingTimeSlot model
model SchedulingTimeSlot {
  // ... existing fields
  breakSessions     BreakSession[]
}
// Extend SchedulingClassroom model
model SchedulingClassroom {
  // ... existing fields
  breakSessions     BreakSession[]
}
// Extend SchedulingTeacherProfile model
model SchedulingTeacherProfile {
  // ... existing fields
  breakSessions     BreakSession[]
}
```
### Phase 2: Backend Services
#### 2.1 Break Session Service
- `createBreakSession()` - Create single or recurring break
- `updateBreakSession()` - Modify break details
- `deleteBreakSession()` - Remove break session
- `getBreakSessionsByDateRange()` - Query breaks for summary
- `getBreakSessionsByTeacher()` - Teacher-specific breaks
- `getBreakTypeDistribution()` - Statistics by break type
#### 2.2 Holiday Service
- `createHoliday()` - Add holiday with recurrence
- `updateHoliday()` - Modify holiday details
- `deleteHoliday()` - Remove holiday
- `getHolidaysByDateRange()` - Query holidays for summary
- `getUpcomingHolidays()` - Next 5 holidays
- `getHolidayImpact()` - Calculate sessions affected by holidays
#### 2.3 Teacher Effort Report Service
- `getTeacherEffortSummary()` - Aggregate teacher statistics
- `getTeacherSessionDetails()` - Detailed session list
- `getTeacherBreakSummary()` - Break sessions by type
- `getTeacherHolidayImpact()` - Sessions missed due to holidays
- `getTeacherSubjectDistribution()` - Sessions by subject
- `getTeacherClassroomUtilization()` - Classroom usage stats
- `exportTeacherEffortPDF()` - Generate PDF with QAF branding
- `exportTeacherEffortExcel()` - Generate Excel/CSV export
#### 2.4 Enhanced Dashboard Service
- `getSchedulingSummary()` - Comprehensive scheduling stats
- `getBreakSessionSummary()` - Break session statistics
- `getHolidaySummary()` - Holiday statistics
- `getTeacherWorkloadSummary()` - Teacher workload metrics
- `getClassroomUtilizationSummary()` - Classroom utilization
### Phase 3: Frontend Components
#### 3.1 Enhanced SummaryDashboardPage
**New Sections:**
- **Break Sessions Widget**
  - Today's break sessions timeline
  - Break type distribution (tea, prayer, lunch)
  - Weekly/monthly break statistics
  - Quick action: manage break sessions
- **Holidays Widget**
  - Upcoming holidays list (next 5)
  - Holiday type indicators with icons
  - Holiday impact on scheduling
  - Visual calendar preview
  - Quick action: manage holidays
- **Teacher Effort Reports Section**
  - Teacher selection dropdown
  - Summary cards: sessions, breaks, holidays, teaching hours
  - Subject distribution breakdown (list view)
  - Break type distribution (list view)
  - Holiday impact analysis
  - Export buttons (PDF, Excel)
- **Auto-Refresh Bar**
  - Countdown timer (30s default)
  - Dropdown for refresh intervals (15s, 30s, 1m, 5m, off)
  - Manual refresh button
  - Last updated timestamp
- **Time Range Selector**
  - Today, This Week, This Month, Custom Range
  - Date range picker for custom selection
  - Apply filter button
**Role-Based Views:**
- **Super Admin / HR**: See all teachers, all programs, all statistics
- **Admin**: See their assigned programs, teachers in their programs
- **Teacher**: See only their own statistics, their sessions, their breaks
- **Instructor**: Same as teacher view
#### 3.2 Break Session Management Components
- `BreakSessionModal.jsx` - Create/edit break session
- `BreakSessionTimeline.jsx` - Visual timeline of breaks
- `BreakTypeDistributionCard.jsx` - Statistics by break type
- `BreakSessionList.jsx` - Table view of break sessions
#### 3.3 Holiday Management Components
- `HolidayModal.jsx` - Create/edit holiday
- `HolidayCalendarPreview.jsx` - Visual calendar with holidays
- `HolidayImpactCard.jsx` - Show affected sessions
- `UpcomingHolidaysList.jsx` - List of next 5 holidays
#### 3.4 Teacher Effort Report Components
- `TeacherEffortSummary.jsx` - Main summary cards
- `TeacherSessionDetails.jsx` - Detailed session list view
- `TeacherSubjectDistribution.jsx` - Subject breakdown list
- `TeacherBreakSummary.jsx` - Break sessions by type list
- `TeacherHolidayImpact.jsx` - Holiday impact analysis
- `TeacherEffortExport.jsx` - Export functionality
#### 3.5 Auto-Refresh Component
- `AutoRefreshBar.jsx` - Countdown timer with dropdown
- Configurable intervals
- Visual progress indicator
- Manual refresh trigger
### Phase 4: Navigation & Shortcuts
#### 4.1 Add Navigation Items
- Main menu: "Scheduling Summary" → opens SummaryDashboardPage
- SchedulingCalendarPage: Add "View Summary" button
- SchedulingAvailabilityPanel: Add "View Summary" button
- DashboardPage: Add "Scheduling Summary" widget card
#### 4.2 Instructor Shortcut
- On instructor cards in scheduling screens
- Add "View Workload" button
- Opens SummaryDashboardPage pre-filtered for that instructor
- Shows only that instructor's statistics
### Phase 5: Export Functionality
#### 5.1 PDF Export (QAF Branding)
- Use existing print service patterns
- QAF header with logo and organization name
- "RESTRICTED" classification badge
- Official footer with signature lines
- Bilingual support (English/Arabic)
- Teacher name, rank, department
- Summary statistics tables
- Session breakdown by subject
- Break sessions by type
- Holiday impact analysis
- Teaching hours calculation
#### 5.2 Excel/CSV Export
- Tabular data export
- Multiple sheets for different sections
- Summary sheet with key metrics
- Sessions sheet with details
- Breaks sheet with breakdown
- Holidays sheet with impact
- Subject distribution sheet
### Phase 6: API Endpoints
```
GET  /api/v1/scheduling/break-sessions
POST /api/v1/scheduling/break-sessions
PUT  /api/v1/scheduling/break-sessions/:id
DELETE /api/v1/scheduling/break-sessions/:id
GET  /api/v1/scheduling/holidays
POST /api/v1/scheduling/holidays
PUT  /api/v1/scheduling/holidays/:id
DELETE /api/v1/scheduling/holidays/:id
GET  /api/v1/scheduling/teacher-effort/:teacherId
GET  /api/v1/scheduling/teacher-effort/:teacherId/export/pdf
GET  /api/v1/scheduling/teacher-effort/:teacherId/export/excel
GET  /api/v1/scheduling/summary
GET  /api/v1/scheduling/summary/break-sessions
GET  /api/v1/scheduling/summary/holidays
GET  /api/v1/scheduling/summary/teacher-workload
GET  /api/v1/scheduling/summary/classroom-utilization
```
### Phase 7: Localization
Add translation keys for:
- Break session types (TeaBreak, PrayerBreak, LunchBreak, Other)
- Holiday types (PublicHoliday, NationalDay, SemesterBreak, etc.)
- Teacher effort report labels
- Auto-refresh intervals
- Export options
- Time range options
- All new UI elements
### Phase 8: Testing & Deployment
#### 8.1 Unit Tests
- Break session service tests
- Holiday service tests
- Teacher effort report calculations
- Auto-refresh component tests
- Export functionality tests
#### 8.2 Integration Tests
- End-to-end dashboard loading
- Break session creation and display
- Holiday creation and impact calculation
- Teacher effort report generation
- Export functionality
- Role-based access control
#### 8.3 Performance Optimization
- Database query optimization with proper indexes
- Caching for summary statistics
- Lazy loading for heavy components
- Debounced auto-refresh
## Implementation Priority
**Phase 1 (High Priority):**
1. Data model extensions
2. Break session service
3. Holiday service
4. Basic dashboard widgets (breaks, holidays)
**Phase 2 (High Priority):**
5. Teacher effort report service
6. Teacher effort report components
7. Export functionality (PDF)
**Phase 3 (Medium Priority):**
8. Auto-refresh component
9. Time range selector
10. Role-based filtering
**Phase 4 (Medium Priority):**
11. Navigation shortcuts
12. Instructor workload shortcut
13. Excel export
**Phase 5 (Low Priority):**
14. Advanced visualizations
15. Custom report templates
16. Scheduled report generation
## Technical Considerations
**Performance:**
- Use database indexes for date-range queries
- Implement caching for summary statistics
- Lazy load detailed lists
- Debounce auto-refresh to prevent excessive API calls
**Security:**
- Role-based data filtering at service layer
- Validate user permissions for teacher data access
- Audit trail for report generation
- Secure file exports with proper headers
**Accessibility:**
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- Screen reader support for charts and tables
- Proper color contrast ratios
**Bilingual Support:**
- All labels in English and Arabic
- RTL/LTR layout switching
- Arabic-Indic numerals in Arabic mode
- Proper text alignment
## Success Criteria
1. Break sessions can be created, viewed, and managed
2. Holidays are displayed with clear visual indicators
3. Teacher effort reports show comprehensive statistics
4. Export to PDF with QAF branding works correctly
5. Export to Excel/CSV works correctly
6. Auto-refresh with countdown timer functions properly
7. Role-based access control restricts data appropriately
8. Navigation shortcuts work from all specified locations
9. Instructor workload shortcut opens filtered view
10. All features support English and Arabic