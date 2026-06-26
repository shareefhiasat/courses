# Scheduling Module

## Business Context
The Scheduling module manages the entire class scheduling lifecycle: classrooms, time slots, holidays, teacher availability, and session booking. It includes conflict detection, classroom availability checking, and summary dashboards for workload and utilization analysis.

## Sub-Modules

### Classrooms (`module:classrooms`)
Manage physical classroom spaces with capacity, equipment, and availability status.

### Time Slots (`module:time-slots`)
Define schedulable time periods per program (e.g., 08:00-09:30, 10:00-11:30).

### Holidays (`module:holidays`)
Manage holiday calendar per program. Holidays affect scheduling and attendance.

### Teacher Availability (`module:teacher-availability`)
Track which instructors are available on which days/times.

### Schedule Sessions (`module:schedule-sessions`)
Book class sessions in classrooms with time slots. Includes conflict detection.

### Scheduling Summary (`module:scheduling-summary`)
Dashboard with break sessions, holidays summary, teacher workload, classroom utilization, and effort reports. Supports PDF/Excel export.

## API Routes
See `TEST_MATRIX.md` for the full route list (40+ routes across sub-modules).

## UI Pages
- `/scheduling-calendar` — SchedulingCalendarPage with tabs:
  - Classes tab
  - Classrooms tab
  - Time Slots tab
  - Holidays tab
  - Teacher Availability tab
  - Sessions tab
- `/scheduling-summary` — Summary dashboard

## Business Rules
- **Conflict detection**: Can't book same classroom at same time for different classes
- **Teacher availability**: Can't assign instructor during unavailable times
- **Holiday exclusion**: No sessions on holidays
- **Classroom capacity**: Session enrollment ≤ classroom capacity
- **Bulk scheduling**: Create recurring sessions in one operation
- **Export**: PDF and Excel reports for compliance

## Test Coverage
- **API tests**: `specs/scheduling-api.spec.js` — 20 tests across all sub-modules
- **Test IDs**: TC-CLRM-*, TC-TS-*, TC-HOL-*, TC-TA-*, TC-SS-*, TC-SSUM-*

## Known Issues
None discovered yet.

## Related Modules
- `module:classes` — Classes being scheduled
- `module:attendance` — Sessions generate attendance records
- `module:instructor-history` — Session history per instructor
