# Scheduling Calendar UX Improvements

## Issues Fixed

### Issue 1: Drag & Drop Date/Time ✅
**Problem:** When dragging a class from sidebar to calendar, the date was incorrect (showing June 20 instead of actual drop date).

**Solution:**
- Added console logging to debug drop coordinates
- Calculate actual date from drop position using calendar grid
- Extract day index from X coordinate and calculate date from week start
- Logs show: drop coordinates, calculated date, final times, instructor/classroom status

**Console Output:**
```
📍 [DROP DEBUG] Drop event: { clientX, clientY, currentDate, currentView }
📅 [DROP DEBUG] Calculated date: { dayIndex, calculatedDate, weekStart }
⏰ [DROP DEBUG] Final times: { start, end, instructor, classroom }
```

### Issue 2: Smart Classroom/Instructor Assignment ✅
**Problem:** 
- Sidebar shows "missing classroom" but modal shows classroom
- Need ability to schedule without instructor/classroom
- Need to update class record when assigning for first time
- Concern about broken relations when changing instructor mid-semester

**Solution:**
1. **Optional Fields:** Instructor and classroom are now optional when creating sessions
2. **Smart Updates:** If class has no instructor/classroom, assigning one updates the class record automatically
3. **Visual Hints:** Shows "💡 Will update class record with this instructor/classroom" when applicable
4. **Validation:** Requires at least one (instructor OR classroom) to prevent empty sessions
5. **Read-only on Edit:** When editing existing sessions, instructor/classroom are read-only (prevents accidental changes)

**Backend Changes:**
- Allow null `instructorId` and `classroomId` in session creation
- Auto-update class record if instructor/classroom not set
- Only check conflicts for resources that are assigned
- Transaction-based to ensure atomicity

**Next Steps for Audit Trail:**
- Create `InstructorAssignmentHistory` table to track instructor changes
- Record: classId, oldInstructorId, newInstructorId, changedBy, changedAt, reason
- Use for incentive reports and commander summaries

### Issue 3: Availability View Mode 🚧 (Planned)
**Problem:** Need easy way to see instructor/room availability across time.

**Planned Solution:**
- Add new view mode: "Availability"
- Show timeline grid with instructor/room names on Y-axis
- Display scheduled sessions as blocks
- Color coding:
  - 🟢 Green: Available
  - 🔴 Red: Fully booked
  - 🟡 Yellow: Partially busy
- Switch between instructor and room views
- Show capacity and location info for rooms

## Testing Scenarios

### Scenario 1: Create Session with No Instructor/Classroom
1. Drag class "CS101 Section A" (has no instructor/classroom) to calendar
2. Verify modal shows:
   - "Instructor (optional)"
   - "Classroom (optional)"
3. Select only instructor
4. Click "Create Session"
5. Verify:
   - Session created successfully
   - Class record updated with instructor
   - Console shows: `[ScheduledSession DB] Updating class X with instructor Y`

### Scenario 2: Create Session with Existing Instructor
1. Drag class "ME101 Section A" (already has instructor) to calendar
2. Verify modal shows pre-selected instructor
3. No "💡 Will update" hint shown
4. Create session
5. Verify class record unchanged

### Scenario 3: Edit Session (Read-only Resources)
1. Click existing session
2. Verify modal shows:
   - "Update Session" title
   - Instructor shown as read-only text
   - Classroom shown as read-only text
3. Change only start/end times
4. Click "Update Session"
5. Verify times updated, instructor/classroom unchanged

### Scenario 4: Drop Date Calculation
1. Drag class to Monday column
2. Check console: `📅 [DROP DEBUG] Calculated date`
3. Verify `dayIndex: 0` and date is Monday
4. Drag to Friday
5. Verify `dayIndex: 4` and date is Friday

### Scenario 5: Conflict Detection with Partial Resources
1. Create session with only instructor (no classroom)
2. Try to create another session with same instructor at same time
3. Verify error: "Instructor is already scheduled for this time"
4. Create session with different instructor, same time
5. Verify success (no classroom conflict)

## Database Schema (Future)

### InstructorAssignmentHistory Table
```sql
CREATE TABLE "InstructorAssignmentHistory" (
  "id" SERIAL PRIMARY KEY,
  "classId" INTEGER NOT NULL REFERENCES "Class"("id"),
  "oldInstructorId" INTEGER REFERENCES "User"("id"),
  "newInstructorId" INTEGER REFERENCES "User"("id"),
  "effectiveFrom" TIMESTAMP NOT NULL,
  "effectiveTo" TIMESTAMP,
  "changedBy" INTEGER REFERENCES "User"("id"),
  "changedAt" TIMESTAMP DEFAULT NOW(),
  "reason" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE
);
```

**Use Cases:**
- Track instructor changes for incentive calculations
- Generate reports: "Instructor X taught Class Y from Date A to Date B"
- Commander summary: Total classes per instructor per semester
- Audit trail for accountability

## Files Modified

### Frontend
- `client/src/pages/SchedulingCalendarPage.jsx`
  - Added drop position calculation
  - Made instructor/classroom optional
  - Added console logging
  - Added visual hints for class updates
  - Made resources read-only when editing

### Backend
- `backend/db/scheduled-session-postgres.js`
  - Allow null instructor/classroom
  - Auto-update class record on first assignment
  - Conditional conflict checking
  - Enhanced logging

### Scripts
- `scripts/delete-all-sessions.js` - Utility to clear all sessions

## Next Steps

1. ✅ Test drag & drop date calculation
2. ✅ Test optional instructor/classroom
3. ✅ Test class record updates
4. 🚧 Implement Availability View Mode
5. 🚧 Create InstructorAssignmentHistory table
6. 🚧 Add instructor change tracking
7. 🚧 Build incentive reports
