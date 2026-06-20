# Phase 1: Scheduling Calendar - Data Integrity & History Tracking

## Epic: Instructor & Session Management

### Story 1: Instructor Assignment History Tracking

**As an** Admin/HR Officer  
**I want** complete history of instructor assignments  
**So that** I can generate accurate reports and track teaching workload

**Acceptance Criteria:**

**AC-1.1:** Create InstructorAssignmentHistory table
- Fields: id, classId, sessionId, oldInstructorId, newInstructorId, effectiveFrom, effectiveTo, changedBy, changedAt, reason, isActive
- Foreign keys to Class, ScheduledSession, User tables
- Index on classId, sessionId for fast queries

**AC-1.2:** Track instructor changes on session update
- When `session.instructorId` changes, insert history record
- Record old and new instructor IDs
- Capture `changedBy` from current user
- Set `effectiveFrom` to session.startDateTime
- Optional reason field (for future use)

**AC-1.3:** Track instructor changes on class update
- When `class.instructorId` changes, insert history record
- Link to class, not session
- Same fields as session tracking

**AC-1.4:** Query API for instructor history
- GET `/api/v1/instructor-history/:classId` - returns all changes for a class
- GET `/api/v1/instructor-history/instructor/:instructorId` - returns all classes taught
- GET `/api/v1/instructor-history/session/:sessionId` - returns changes for specific session
- Response includes instructor names, dates, and change metadata

**AC-1.5:** Access control
- Admin, HR, Super Admin: can view all history
- Instructor: can view only their own history
- Students: no access

**Files to Modify:**
- `client/prisma/schema.prisma` - add InstructorAssignmentHistory model
- `backend/db/instructor-history-postgres.js` - new CRUD operations
- `backend/services/instructorHistoryService.js` - new business logic
- `backend/routes/instructor-history.js` - new API endpoints
- `backend/db/scheduled-session-postgres.js` - add history tracking on update
- `backend/db/class-postgres.js` - add history tracking on update

---

### Story 2: Soft Delete for Sessions with Attendance Protection

**As an** Admin  
**I want** to delete sessions without losing attendance data  
**So that** compliance and audit requirements are met

**Acceptance Criteria:**

**AC-2.1:** Add soft delete fields to ScheduledSession
- Add `deletedAt` TIMESTAMP NULL
- Add `deletedBy` INTEGER REFERENCES User(id)
- Add `deletionReason` TEXT NULL
- Migration script to add fields

**AC-2.2:** Implement soft delete logic
- DELETE endpoint sets `deletedAt = NOW()` and `deletedBy = currentUser.id`
- Never hard delete from database
- Soft deleted sessions excluded from calendar queries by default
- Add `includeDeleted` query param for admin views

**AC-2.3:** Attendance protection check
- Before soft delete, check if session has attendance records
- If attendance exists, require `deletionReason`
- Log deletion with reason in audit trail
- Attendance records remain untouched

**AC-2.4:** UI changes
- Delete button shows confirmation modal
- If attendance exists, modal shows warning and reason field (required)
- Success message: "Session deleted (attendance preserved)"
- Deleted sessions shown with strikethrough in admin view

**AC-2.5:** Restore capability (admin only)
- Add "Restore" button in admin view for soft-deleted sessions
- Clears `deletedAt` and `deletedBy`
- Logs restoration in audit trail

**Files to Modify:**
- `client/prisma/schema.prisma` - add soft delete fields
- `backend/db/scheduled-session-postgres.js` - modify delete, add restore
- `backend/services/scheduledSessionService.js` - add attendance check
- `backend/routes/scheduled-session.js` - update delete endpoint
- `client/src/pages/SchedulingCalendarPage.jsx` - add deletion modal with reason
- `client/src/services/scheduledSessionService.js` - update delete API call

---

### Story 3: Session Status Workflow

**As an** Instructor  
**I want** to mark sessions as cancelled or completed  
**So that** the schedule reflects actual class status

**Acceptance Criteria:**

**AC-3.1:** Add status enum to ScheduledSession
- Values: 'scheduled', 'in_progress', 'completed', 'cancelled'
- Default: 'scheduled'
- Migration to add enum type and column

**AC-3.2:** Status transitions
- scheduled → in_progress (when session starts, optional auto-trigger)
- in_progress → completed (when session ends)
- scheduled → cancelled (manual action)
- cancelled sessions cannot be uncancelled (use restore from soft delete instead)

**AC-3.3:** UI status indicators
- Color coding: scheduled (blue), in_progress (yellow), completed (green), cancelled (red)
- Status badge on calendar events
- Filter by status in calendar view

**AC-3.4:** Recurrence series cancellation
- Cancel single instance: only that session marked cancelled
- Cancel series: all future sessions marked cancelled
- Cancelled sessions skip in recurrence pattern (don't shift dates)

**AC-3.5:** Status change tracking
- Log status changes in InstructorAssignmentHistory (reuse table)
- Track who changed status and when
- Optional reason for cancellation

**Files to Modify:**
- `client/prisma/schema.prisma` - add status enum
- `backend/db/scheduled-session-postgres.js` - add status update logic
- `backend/services/scheduledSessionService.js` - add status transition validation
- `backend/routes/scheduled-session.js` - add status update endpoint
- `client/src/pages/SchedulingCalendarPage.jsx` - add status UI and filters
- `client/src/components/SessionStatusBadge.jsx` - new component for status display

---

### Story 4: Capacity Override with Warning

**As a** Scheduler  
**I want** to override room capacity limits when necessary  
**So that** I have operational flexibility

**Acceptance Criteria:**

**AC-4.1:** Capacity validation check
- Before saving session, compare `class.enrolledCount` vs `classroom.capacity`
- If enrolledCount > capacity, show warning modal
- Warning shows: room name, capacity, enrolled count, overflow amount

**AC-4.2:** Override capability
- Warning modal has "Override and Save" button
- Clicking override saves session with capacity flag
- Add `capacityOverridden` boolean to ScheduledSession
- Add `capacityOverrideReason` text field (optional)

**AC-4.3:** Capacity override logging
- Log all capacity overrides in audit trail
- Include: session, room, capacity, enrolled, who overrode, when, reason
- Queryable for reporting

**AC-4.4:** Capacity override reporting
- GET `/api/v1/reports/capacity-overrides` - list all overrides
- Filter by date range, classroom, instructor
- Export to CSV

**AC-4.5:** Visual indicators
- Sessions with capacity override show warning icon on calendar
- Hover tooltip shows capacity details
- Admin dashboard shows count of active overrides

**Files to Modify:**
- `client/prisma/schema.prisma` - add capacityOverridden, capacityOverrideReason
- `backend/services/schedulingEngine.js` - add capacity check to validation
- `backend/db/scheduled-session-postgres.js` - save override flags
- `client/src/pages/SchedulingCalendarPage.jsx` - add capacity warning modal
- `client/src/components/CapacityWarningModal.jsx` - new modal component
- `backend/routes/reports.js` - add capacity override report endpoint

---

### Story 5: Substitute Instructor on Class

**As an** Admin  
**I want** to assign a substitute instructor to a class  
**So that** both instructors can mark attendance and appear in reports

**Acceptance Criteria:**

**AC-5.1:** Add substitute instructor to Class model
- Add `substituteInstructorId` INTEGER NULL REFERENCES User(id)
- Migration to add field
- Substitute is optional

**AC-5.2:** Class screen UI updates
- Add "Substitute Instructor" dropdown on class edit form
- Shows only users with INSTRUCTOR role
- Can be null (no substitute)
- Save updates `class.substituteInstructorId`

**AC-5.3:** Attendance screen access
- Primary instructor can mark attendance (existing)
- Substitute instructor can also mark attendance (new)
- Both see class in their "My Classes" list
- Attendance record shows who marked it (primary or substitute)

**AC-5.4:** Scheduling calendar display
- Sessions show both instructors if substitute assigned
- Format: "John Doe (Primary), Jane Smith (Substitute)"
- Filter by instructor includes both primary and substitute

**AC-5.5:** Reporting
- Instructor workload report shows both primary and substitute hours
- Label clearly: "Primary: 40 hours, Substitute: 10 hours"
- Commander report shows both instructors for each class

**Files to Modify:**
- `client/prisma/schema.prisma` - add substituteInstructorId to Class
- `backend/db/class-postgres.js` - update class queries to include substitute
- `client/src/pages/ClassesPage.jsx` - add substitute instructor field
- `client/src/pages/AttendancePage.jsx` - allow substitute to mark attendance
- `client/src/pages/SchedulingCalendarPage.jsx` - display both instructors
- `backend/services/classService.js` - update class filtering for substitutes

---

### Story 6: Real-time Notifications for Schedule Changes

**As an** Instructor  
**I want** immediate email notification when my schedule changes  
**So that** I'm always aware of my teaching commitments

**Acceptance Criteria:**

**AC-6.1:** Notification triggers
- Session created with instructor → notify instructor
- Session updated (time/room changed) → notify instructor
- Session cancelled → notify instructor
- Session deleted → notify instructor
- Instructor changed → notify both old and new instructor

**AC-6.2:** Email template
- Subject: "Schedule Change: [Class Name] - [Date/Time]"
- Body includes: class name, date, time, room, change type, who made change
- Link to calendar view
- Professional military-appropriate formatting

**AC-6.3:** Notification preferences (future-ready)
- For now: all instructors receive all notifications
- Database structure ready for preferences (enable/disable per type)
- NotificationPreference table created but not exposed in UI yet

**AC-6.4:** Notification logging
- Log all sent notifications in NotificationLog table
- Track: recipient, type, sent time, delivery status
- Queryable for debugging

**AC-6.5:** Batch notifications
- If bulk operation affects multiple sessions, send one email per instructor
- Email lists all affected sessions
- Don't spam with individual emails

**Files to Modify:**
- `client/prisma/schema.prisma` - add NotificationLog, NotificationPreference tables
- `backend/services/notificationService.js` - new service for email sending
- `backend/db/notification-postgres.js` - new CRUD for notifications
- `backend/services/scheduledSessionService.js` - trigger notifications on changes
- `backend/templates/email/schedule-change.html` - new email template
- `backend/config/email.js` - email configuration (SMTP settings)

---

### Story 7: Recurrence Exception Handling

**As a** Scheduler  
**I want** to cancel individual sessions in a recurring series  
**So that** I can handle one-time exceptions without affecting the whole series

**Acceptance Criteria:**

**AC-7.1:** Recurrence series tracking
- Add `recurrenceSeriesId` UUID to ScheduledSession
- All sessions in a series share same UUID
- Generated when creating recurring series
- Null for one-time sessions

**AC-7.2:** Cancel single instance
- Right-click session → "Cancel This Session"
- Sets status = 'cancelled' for that session only
- Other sessions in series remain 'scheduled'
- Cancelled session still appears on calendar (with cancelled badge)

**AC-7.3:** Cancel series
- Right-click session → "Cancel This and All Future"
- Sets status = 'cancelled' for selected session and all future sessions in series
- Past sessions remain unchanged
- Confirmation modal shows count of affected sessions

**AC-7.4:** Skip cancelled in recurrence pattern
- When displaying calendar, cancelled sessions shown but greyed out
- When calculating "next session", skip cancelled instances
- Recurrence pattern doesn't shift dates (week 5 cancelled = no session that week)

**AC-7.5:** Restore cancelled session
- Admin can restore cancelled session (status → 'scheduled')
- Logs restoration in audit trail
- Notification sent to instructor

**Files to Modify:**
- `client/prisma/schema.prisma` - add recurrenceSeriesId
- `backend/db/scheduled-session-postgres.js` - add series cancellation logic
- `backend/services/scheduledSessionService.js` - add series queries
- `client/src/pages/SchedulingCalendarPage.jsx` - add cancel options to context menu
- `client/src/components/CancelSeriesModal.jsx` - new confirmation modal

---

### Story 8: Role-based Access Control for Calendar

**As an** Instructor  
**I want** to see only my own classes in the calendar  
**So that** I'm not overwhelmed with irrelevant information

**Acceptance Criteria:**

**AC-8.1:** Instructor view filtering
- When user role = INSTRUCTOR, filter sessions by:
  - `session.instructorId = currentUser.id` OR
  - `session.class.substituteInstructorId = currentUser.id`
- Shows only their assigned classes
- Cannot see other instructors' schedules

**AC-8.2:** Admin/HR/Super Admin view
- Roles: ADMIN, HR, SUPER_ADMIN see all sessions
- No filtering applied
- Can view all instructors, all rooms, all classes

**AC-8.3:** Availability view permissions
- Instructor: sees only their own availability
- Admin/HR/Super Admin: sees all instructors/rooms

**AC-8.4:** Export permissions
- Instructor: can export only their own schedule
- Admin/HR/Super Admin: can export any schedule
- Export respects same filters as calendar view

**AC-8.5:** History view permissions
- Instructor: can view only their own assignment history
- Admin/HR/Super Admin: can view all history
- API endpoints enforce role-based filtering

**Files to Modify:**
- `backend/middleware/roleCheck.js` - add role-based filtering middleware
- `backend/db/scheduled-session-postgres.js` - add role-based query filters
- `backend/routes/scheduled-session.js` - apply role middleware
- `backend/routes/instructor-history.js` - apply role filtering
- `client/src/pages/SchedulingCalendarPage.jsx` - apply client-side role checks
- `client/src/services/authService.js` - expose current user role

---

## Database Migrations

### Migration 1: InstructorAssignmentHistory Table
```sql
CREATE TABLE "InstructorAssignmentHistory" (
  "id" SERIAL PRIMARY KEY,
  "classId" INTEGER REFERENCES "Class"("id") ON DELETE CASCADE,
  "sessionId" INTEGER REFERENCES "ScheduledSession"("id") ON DELETE SET NULL,
  "oldInstructorId" INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
  "newInstructorId" INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
  "effectiveFrom" TIMESTAMP NOT NULL,
  "effectiveTo" TIMESTAMP,
  "changedBy" INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
  "changedAt" TIMESTAMP DEFAULT NOW(),
  "reason" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_instructor_history_class" ON "InstructorAssignmentHistory"("classId");
CREATE INDEX "idx_instructor_history_session" ON "InstructorAssignmentHistory"("sessionId");
CREATE INDEX "idx_instructor_history_instructor" ON "InstructorAssignmentHistory"("newInstructorId");
```

### Migration 2: ScheduledSession Soft Delete & Status
```sql
ALTER TABLE "ScheduledSession" ADD COLUMN "deletedAt" TIMESTAMP NULL;
ALTER TABLE "ScheduledSession" ADD COLUMN "deletedBy" INTEGER REFERENCES "User"("id");
ALTER TABLE "ScheduledSession" ADD COLUMN "deletionReason" TEXT NULL;

CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
ALTER TABLE "ScheduledSession" ADD COLUMN "status" "SessionStatus" DEFAULT 'scheduled';

ALTER TABLE "ScheduledSession" ADD COLUMN "capacityOverridden" BOOLEAN DEFAULT FALSE;
ALTER TABLE "ScheduledSession" ADD COLUMN "capacityOverrideReason" TEXT NULL;

ALTER TABLE "ScheduledSession" ADD COLUMN "recurrenceSeriesId" UUID NULL;

CREATE INDEX "idx_scheduled_session_deleted" ON "ScheduledSession"("deletedAt");
CREATE INDEX "idx_scheduled_session_status" ON "ScheduledSession"("status");
CREATE INDEX "idx_scheduled_session_series" ON "ScheduledSession"("recurrenceSeriesId");
```

### Migration 3: Class Substitute Instructor
```sql
ALTER TABLE "Class" ADD COLUMN "substituteInstructorId" INTEGER REFERENCES "User"("id") ON DELETE SET NULL;

CREATE INDEX "idx_class_substitute" ON "Class"("substituteInstructorId");
```

### Migration 4: Notification Tables
```sql
CREATE TABLE "NotificationLog" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "sentAt" TIMESTAMP DEFAULT NOW(),
  "deliveryStatus" VARCHAR(20) DEFAULT 'sent',
  "sessionId" INTEGER REFERENCES "ScheduledSession"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "NotificationPreference" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"("id") ON DELETE CASCADE,
  "notificationType" VARCHAR(50) NOT NULL,
  "enabled" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", "notificationType")
);

CREATE INDEX "idx_notification_log_user" ON "NotificationLog"("userId");
CREATE INDEX "idx_notification_log_session" ON "NotificationLog"("sessionId");
```

---

## Testing Checklist

### Story 1: Instructor History
- [ ] Create session with instructor → history record created
- [ ] Update session instructor → history record created with old/new
- [ ] Query history by class → returns all changes
- [ ] Query history by instructor → returns all classes taught
- [ ] Instructor cannot access other instructor's history
- [ ] Admin can access all history

### Story 2: Soft Delete
- [ ] Delete session without attendance → soft deleted
- [ ] Delete session with attendance → requires reason
- [ ] Soft deleted session hidden from calendar
- [ ] Admin can view soft deleted sessions
- [ ] Admin can restore soft deleted session
- [ ] Attendance records preserved after soft delete

### Story 3: Session Status
- [ ] Create session → status = 'scheduled'
- [ ] Cancel session → status = 'cancelled'
- [ ] Complete session → status = 'completed'
- [ ] Cancelled sessions show with red badge
- [ ] Filter calendar by status works
- [ ] Cancel series → all future sessions cancelled

### Story 4: Capacity Override
- [ ] Enroll 50 students, assign 30-seat room → warning shown
- [ ] Override capacity → session saved with flag
- [ ] Capacity override logged in audit trail
- [ ] Calendar shows warning icon for overridden sessions
- [ ] Report shows all capacity overrides

### Story 5: Substitute Instructor
- [ ] Assign substitute to class → saved correctly
- [ ] Primary instructor sees class in "My Classes"
- [ ] Substitute instructor sees class in "My Classes"
- [ ] Both can mark attendance
- [ ] Calendar shows both instructors
- [ ] Report shows both instructors with hours

### Story 6: Notifications
- [ ] Create session → instructor receives email
- [ ] Update session time → instructor receives email
- [ ] Cancel session → instructor receives email
- [ ] Change instructor → both old and new receive email
- [ ] Email template renders correctly
- [ ] Notification logged in database

### Story 7: Recurrence Exceptions
- [ ] Create 10-week series → all sessions have same seriesId
- [ ] Cancel week 5 → only that session cancelled
- [ ] Cancel week 5 and future → weeks 5-10 cancelled
- [ ] Cancelled session shows greyed out on calendar
- [ ] Restore cancelled session → status back to scheduled

### Story 8: Role-based Access
- [ ] Instructor sees only their sessions
- [ ] Admin sees all sessions
- [ ] Instructor cannot access other instructor's history
- [ ] Export respects role permissions
- [ ] API endpoints enforce role filtering

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Database migrations tested
- [ ] API documentation updated
- [ ] Code reviewed and approved
- [ ] Deployed to staging environment
- [ ] User acceptance testing completed
- [ ] Production deployment completed
- [ ] Monitoring and alerts configured
