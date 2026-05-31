# Corner Cases - Story 1.2: Daily Attendance Export and Submission

**Generated:** 2026-05-23  
**Purpose:** Document edge cases and issues for future resolution

## Decision Needed (Requires User Input)

### 1. Button only enabled for completed classes
- **Location:** `AttendancePage.jsx:898`
- **Issue:** Button disabled when `!sessionId` but doesn't check if class is "completed"
- **Question:** What defines a "completed" class? Is it based on session end time, attendance threshold, or a status field?
- **Impact:** Business logic clarification needed

### 2. MinIO integration approach
- **Location:** `backend/services/workflowDocumentService.js:uploadFileToMinIO`
- **Issue:** Current implementation uses placeholder fileId
- **Decision:** Should File model integration be completed in Story 1.2 or deferred to follow-up story?
- **User Note:** User indicated this should be a follow-up story

## Patch Items (Fixable Without User Input)

### 3. Upload to lms-workflow bucket not implemented
- **Location:** `backend/services/workflowDocumentService.js:uploadFileToMinIO`
- **Issue:** Function returns placeholder fileId without actual MinIO upload
- **Status:** Defer to follow-up story per user request
- **AC Violation:** Yes

### 4. Enable versioning not implemented
- **Location:** `backend/services/workflowDocumentService.js:uploadFileToMinIO`
- **Issue:** No versioning logic exists
- **Status:** Defer to follow-up story with File model integration
- **AC Violation:** Yes

### 5. Display document preview in dialog
- **Location:** `AttendancePage.jsx:916-1000`
- **Issue:** Dialog shows no filename or size preview
- **Fix:** Add preview display showing filename and size before submission
- **AC Violation:** Yes

### 6. Provide link to workflow inbox
- **Location:** `AttendancePage.jsx:878`
- **Issue:** Success alert shows document ID but no link
- **Fix:** Add link to workflow inbox (or note that inbox doesn't exist yet - defer to future story)
- **AC Violation:** Yes

### 7. Missing guard for failed attendance data fetch
- **Location:** `AttendancePage.jsx:861-862`
- **Issue:** If `getAttendanceMarksForExport` returns `success:false`, empty array is submitted without error
- **Fix:** Add check for `result.success` before proceeding
- **Guard:** `if (!result.success) { setErr(result.error || 'Failed to fetch attendance data'); return; }`

### 8. Missing guard for undefined classId
- **Location:** `AttendancePage.jsx:867`
- **Issue:** Both `selectedClass.id` and `selectedClass.docId` could be undefined
- **Fix:** Add validation before submission
- **Guard:** `const classId = selectedClass.id || selectedClass.docId; if (!classId) { setErr('Invalid class ID'); return; }`

### 9. Missing guard for undefined program/subject
- **Location:** `AttendancePage.jsx:870-871`
- **Issue:** Both fallbacks could be undefined
- **Fix:** Provide default values or validate before submission
- **Guard:** `const program = selectedClass.program || programFilter || 'Unknown'; const subject = selectedClass.subject || subjectFilter || 'Unknown';`

### 10. Missing guard for Excel generation failure
- **Location:** `client/src/services/business/workflowDocumentService.js:generateAttendanceExcelReport`
- **Issue:** If `exportGeneric` returns null, blobToBase64 will fail
- **Fix:** Add null check before blobToBase64
- **Guard:** `if (!blob) { throw new Error('Excel generation failed'); }`

### 11. Missing FileReader error handler
- **Location:** `client/src/services/business/workflowDocumentService.js:blobToBase64`
- **Issue:** FileReader has no onerror handler
- **Fix:** Add error handler to reject promise
- **Guard:** `reader.onerror = () => reject(new Error('Failed to read file'));`

### 12. Missing guard for undefined user.id
- **Location:** `AttendancePage.jsx:872`
- **Issue:** `user.id` could be undefined
- **Fix:** Add validation before submission
- **Guard:** `if (!user?.id) { setErr('User not authenticated'); return; }`

### 13. Missing validation for base64 fileData size
- **Location:** `backend/controllers/workflowDocuments.js:46-52`
- **Issue:** No size validation for base64 fileData
- **Fix:** Add max size check
- **Guard:** `if (!fileData || fileData.length > MAX_FILE_SIZE) { return res.status(400).json({ error: 'Invalid file data' }); }`

### 14. Replace alert() with proper notification
- **Location:** `AttendancePage.jsx:878`
- **Issue:** Using browser alert() is poor UX
- **Fix:** Use proper notification component from the UI library

## Defer Items (Pre-existing or Follow-up Stories)

### 15. ARCHITECTURE_GUIDE.md changes unrelated to Story 1.2
- **Location:** `ARCHITECTURE_GUIDE.md`
- **Issue:** Massive architecture guide updates should be in separate commit
- **Status:** Commit hygiene issue, not functional

### 16. Prisma schema changes from Story 1.1 included
- **Location:** `client/prisma/schema.prisma`
- **Issue:** WorkflowDocument models are from previous story
- **Status:** Expected - Story 1.2 builds on Story 1.1

### 17. MinIO bucket existence check
- **Location:** `backend/services/workflowDocumentService.js:uploadFileToMinIO`
- **Issue:** Should call `ensureBucket` before upload
- **Status:** Part of File model integration follow-up

### 18. Prisma transaction for atomicity
- **Location:** `backend/db/workflowDocuments-postgres.js:create`
- **Issue:** Should use transaction to rollback file upload if DB fails
- **Status:** Part of File model integration follow-up

### 19. Notification error logging
- **Location:** `backend/controllers/workflowDocuments.js:84-94`
- **Issue:** Notification failure is caught but only logged to console
- **Status:** Minor improvement, not critical

### 20. Dialog not reusable
- **Location:** `AttendancePage.jsx:916-1000`
- **Issue:** Dialog is inline instead of reusable component
- **Status:** Code quality issue, not functional

## Summary

- **Total Issues:** 20
- **Decision Needed:** 2
- **Patch (Fixable):** 12
- **Defer (Follow-up):** 6
- **AC Violations:** 4 (items 3, 4, 5, 6)

## Recommendations

1. **Immediate (Sprint):** Fix patch items 7-14 (edge case guards) - these are low-effort, high-value safety improvements
2. **Follow-up Story:** Create dedicated story for File model integration with MinIO (addresses items 3, 4, 17, 18)
3. **Future Story:** Workflow inbox page (addresses item 6)
4. **Code Quality:** Address items 14, 19, 20 in future cleanup
5. **User Decision:** Clarify items 1 and 2 with user before proceeding
