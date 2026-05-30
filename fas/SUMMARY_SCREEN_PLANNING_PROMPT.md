# Summary Screen Planning Prompt

Copy and use this prompt to request a comprehensive summary screen design for your LMS project with integrated scheduling features.

---

## Prompt

I need to design a comprehensive **Summary Dashboard Screen** for my educational management system (LMS) with integrated scheduling capabilities.

## Context

### Existing System Architecture
My system uses **PostgreSQL** with **Prisma ORM** and has the following core models:

**User & Authentication:**
- User (with Keycloak integration, roles, preferences)
- UserRoles, UserRoleAssignment
- UserStatusTypes

**Academic Structure:**
- Program (degree programs with duration, credits)
- Subject (with credits, types, requirements)
- Class (with instructor, location, capacity, term/year)
- Enrollment (with status tracking)
- AcademicTerms

**Learning Activities:**
- Activity (assignments, quizzes with types)
- Submission (with status, grading)
- Quiz, Question, Answer, QuizAttempt
- Attendance, StandupAttendance
- Behavior, Penalty, Participation

**Resources & Communication:**
- Resource (with categories, types, downloads)
- Announcement (with priority, target audience)
- HelpItems

**Assessment & Grading:**
- MarksDistribution (mid-term, final, homework, etc.)
- StudentMarks (with history tracking)
- StudentMarksHistory (audit trail)

**File Management:**
- File, FileVersion, Folder
- FileShare, PublicLink
- FileComment, FileActivity
- UserFilePreference

**Workflow Engine:**
- WorkflowDefinition, WorkflowStage
- WorkflowInstance, WorkflowStep
- WorkflowHistory (audit trail)

**Notifications:**
- Notification (with categories, priorities)
- NotificationDelivery
- NotificationPreference

**Access Control:**
- Screen, Operation
- RolePermission

### New Scheduling Module (To Be Integrated)
I'm adding a QAF-style scheduling subsystem with these models:

**Scheduling Core:**
- SchedulingTeacherProfile (teacher availability, subject mapping, status)
- SchedulingClassroom (capacity, location, available days, equipment)
- SchedulingTimeSlot (periods, breaks, bilingual labels)
- SchedulingHoliday (date ranges, types, recurring)
- ScheduleSession (actual scheduled sessions with conflicts detection)

**Course Hierarchy:**
- SchedulingCourseCategory (top-level categories)
- SchedulingCourseSubCategory (sub-categories)
- SchedulingCourse (actual courses with program linkage)

**Backup System:**
- SchedulingBackup (full/course-specific backups with versioning)

### Scheduling Features
- Conflict detection (teacher, classroom, max sessions, holidays, weekends)
- Hierarchical course structure (Category → Sub-category → Course)
- QAF-formatted printing with official branding
- Backup & restore with Thursday reminders
- Multiple schedule views (table, week, day, month)
- Time slot management with breaks
- Teacher availability management
- Classroom utilization tracking

## Request

Please design a **comprehensive summary dashboard screen** that provides administrators and instructors with a high-level overview of the entire system, integrating both existing LMS data and the new scheduling capabilities.

## Requirements

### 1. Overall Layout
Design a logical, intuitive layout considering:
- **Primary audience**: Administrators and instructors
- **Screen sizes**: Responsive from 768px to 2560px
- **Information hierarchy**: Most critical metrics prominently displayed
- **Navigation**: Quick access to detailed views
- **Bilingual support**: English (LTR) and Arabic (RTL) toggle

### 2. Key Metrics/Statistics
Identify and propose the most valuable aggregated data points to display, grouped by category:

**Academic Overview:**
- Total active users (by role: students, instructors, admins)
- Active programs count
- Total subjects/courses
- Active classes this term
- Enrollment statistics (by program, by status)

**Scheduling Overview:**
- Total teachers with scheduling profiles
- Total available classrooms
- Today's scheduled sessions
- Sessions this week/month
- Upcoming holidays (next 5)
- Conflict alerts (if any)

**Learning Activities:**
- Pending submissions count
- Pending grading count
- Active quizzes
- Today's attendance rate
- Recent announcements (high priority)

**File Management:**
- Total files in system
- Storage usage
- Recent file activities
- Active workflows (by status)
- Pending approvals

**System Health:**
- System notifications (unread)
- Backup status (last backup date)
- Active users online
- System performance metrics

### 3. Scheduling Integration
Design how the new scheduling features should be summarized:

**Today's Schedule Widget:**
- Show today's sessions in timeline format
- Color-code by subject or teacher
- Quick action: view full schedule

**Teacher Load Visualization:**
- Chart showing sessions per teacher this month
- Highlight teachers approaching max sessions
- Drill-down to teacher details

**Classroom Utilization:**
- Utilization rate per classroom
- Underutilized/overutilized rooms
- Quick action: view classroom schedule

**Upcoming Holidays:**
- List next 5 holidays with dates and durations
- Visual calendar preview
- Impact on scheduling

**Conflict Alerts:**
- Active scheduling conflicts (if any)
- Quick resolution actions
- Conflict trend over time

**Course Selection:**
- Active course selector (if multi-course system)
- Quick course switching
- Course-specific stats

### 4. Actionable Insights
Propose quick actions and navigation shortcuts:

**Quick Actions:**
- Add new user
- Create new class
- Schedule new session
- Upload file
- Send announcement
- Generate report
- Backup data

**Navigation Shortcuts:**
- View all submissions
- Manage enrollments
- Schedule management
- File browser
- Workflow inbox
- Settings

**Alerts & Reminders:**
- Pending items requiring attention
- Deadline reminders
- System notifications
- Backup reminder (Thursday)

### 5. Personalization/Customization
Consider user-specific customization:

**User Role Adaptation:**
- Admin sees everything
- Instructor sees their classes, students, grading queue
- Student sees their schedule, assignments, grades

**Widget Customization:**
- Drag-and-drop widget arrangement
- Show/hide widgets based on preference
- Widget size options (small, medium, large)

**Saved Filters:**
- Save commonly used filter combinations
- Quick filter presets

### 6. Data Visualization
Suggest appropriate chart types for different data:

**Teacher Load:** Bar chart (sessions per teacher)
**Subject Distribution:** Pie chart (sessions by subject)
**Enrollment Trends:** Line chart (enrollments over time)
**Attendance Rates:** Gauge chart (daily/monthly average)
**Submission Status:** Stacked bar (pending, submitted, graded)
**Classroom Utilization:** Heat map (room × time slot)
**Workflow Status:** Donut chart (pending, approved, rejected)
**File Storage:** Area chart (storage growth over time)

### 7. Bilingual Support
Ensure all proposed elements support:

- Language toggle (English/Arabic)
- RTL/LTR layout switching
- Arabic-Indic numerals in Arabic mode
- Translated labels and messages
- Proper text alignment

### 8. Technical Considerations

**Performance:**
- Lazy loading for heavy widgets
- Caching strategies for aggregated data
- Real-time updates (WebSocket/polling)
- Optimized database queries

**Security:**
- Role-based data visibility
- Sensitive data masking
- Audit trail for dashboard actions

**Accessibility:**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast requirements

## Deliverables

Please provide:

1. **Layout Wireframe**: Visual representation of the dashboard structure
2. **Widget Specifications**: Detailed description of each widget with data sources
3. **Component Hierarchy**: React component structure (if applicable)
4. **API Requirements**: Endpoints needed for dashboard data
5. **State Management**: How to handle dashboard state and updates
6. **Mock Data**: Sample data for visualization
7. **Implementation Priority**: Phased rollout plan

## Additional Context

- The system uses React/Next.js for frontend
- Prisma with PostgreSQL for backend
- Keycloak for authentication
- Existing UI component library (specify if any)
- Current dashboard exists but needs enhancement with scheduling integration

---

## Expected Response Format

Please structure your response as:

1. **Dashboard Overview**: High-level concept and goals
2. **Layout Design**: Detailed layout specification with zones
3. **Widget Catalog**: Complete list of proposed widgets with specs
4. **Data Architecture**: API endpoints and data flow
5. **Technical Implementation**: Component structure and state management
6. **Implementation Roadmap**: Phased development plan
7. **Mockups/Examples**: Visual representations where helpful

Focus on creating an actionable, production-ready design that can be directly implemented by our development team.
