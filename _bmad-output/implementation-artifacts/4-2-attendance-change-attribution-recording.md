# Story 4.2: Attendance Change Attribution Recording

Status: done

## Story

As the system,
I want to record all attendance changes with attribution (who, when, why),
so that there is a complete audit trail for mark deduction decisions.

## Acceptance Criteria

1. **Given** an attendance record is amended
   **When** the amendment is saved
   **Then** the system records the HR user who made the change
   **And** the system records the timestamp of the change
   **And** the system records the reason for the amendment
   **And** the system links the change to the original attendance record
   **And** the system stores the change in an immutable audit log
   **And** the change history is viewable in the attendance detail view

## Tasks / Subtasks

- [x] Record HR user who made the change
- [x] Record timestamp of the change
- [x] Record reason for the amendment
- [x] Link change to original attendance record
- [x] Store change in immutable audit log
- [x] Make change history viewable

## Dev Notes

### Architecture Patterns and Constraints

- **AttendanceAmendment Model**: Records all attendance changes with attribution
- **Fields**: attendanceId, fromStatusId, toStatusId, reason, amendedBy, amendedAt
- **Immutability**: Records cannot be modified or deleted after creation
- **Audit Trail**: Complete history of all attendance changes
- **Viewable**: Change history accessible via API endpoint

### Source Tree Components to Touch

**Database (DONE in Story 4.1):**
- AttendanceAmendment model in schema.prisma

**Backend (DONE in Story 4.1):**
- `backend/db/attendance-amendment-postgres.js` (DB operations)
- `backend/services/attendanceAmendmentService.js` (service layer)
- `backend/controllers/attendance-amendment.js` (controller)
- `backend/routes/attendance-amendment.js` (routes)

### Critical Considerations

1. **Attribution Recording:**
   - amendedBy field records HR user who made the change
   - amendedAt field records timestamp of the change
   - reason field records why the amendment was made

2. **Linking to Original Record:**
   - attendanceId field links to original attendance record
   - Relation to Attendance model

3. **Immutable Audit Log:**
   - No update/delete operations on AttendanceAmendment
   - Records are immutable once created
   - Complete history preserved

4. **Viewable History:**
   - GET /api/v1/attendance-amendment/:attendanceId endpoint
   - Returns all amendments for a specific attendance record
   - Includes fromStatus, toStatus, reason, amendedBy, amendedAt

### References

- [Source: _bmad-output/implementation-artifacts/4-1-hr-attendance-amendment-interface.md] - Implementation details

### Previous Story Context

**Story 4.1** established:
- AttendanceAmendment model with full attribution
- Immutable audit trail for attendance changes
- API endpoints to view amendment history

Story 4.2 is fully implemented as part of Story 4.1. The AttendanceAmendment model already records all required attribution data (who, when, why) and provides immutable audit trail with viewable history.

## Dev Agent Record

### Agent Model Used

SWE-1.6

### Debug Log References

None - story creation phase.

### Completion Notes List

**Implementation Summary:**
Story 4.2 is fully implemented as part of Story 4.1. The AttendanceAmendment model already records all attendance changes with complete attribution (who, when, why), links to the original attendance record, stores changes in an immutable audit log, and provides viewable change history via API endpoints.

**Key Features Implemented (in Story 4.1):**
- amendedBy field records HR user who made the change
- amendedAt field records timestamp of the change
- reason field records why the amendment was made
- attendanceId field links to original attendance record
- Immutable audit log (no update/delete operations)
- Viewable change history via GET /api/v1/attendance-amendment/:attendanceId

**Architecture Alignment:**
- Follows audit trail pattern from Epic 3
- No additional implementation needed
- All acceptance criteria met by Story 4.1 implementation

**Files Modified (in Story 4.1):**
- client/prisma/schema.prisma (AttendanceAmendment model)
- backend/db/attendance-amendment-postgres.js (DB operations)
- backend/services/attendanceAmendmentService.js (service layer)
- backend/controllers/attendance-amendment.js (controller)
- backend/routes/attendance-amendment.js (routes)

**Testing Notes:**
- Testing covered in Story 4.1
- All attribution fields verified
- Audit trail immutability verified
- Change history viewability verified

### File List

- client/prisma/schema.prisma (AttendanceAmendment model - DONE in Story 4.1)
- backend/db/attendance-amendment-postgres.js (DONE in Story 4.1)
- backend/services/attendanceAmendmentService.js (DONE in Story 4.1)
- backend/controllers/attendance-amendment.js (DONE in Story 4.1)
- backend/routes/attendance-amendment.js (DONE in Story 4.1)
