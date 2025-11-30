# QAF Attendance System - Complete Flow Explanation

## Overview
The attendance system uses QR codes with rotating tokens for secure, real-time attendance tracking. Students can scan QR codes or manually enter codes to mark their attendance.

## System Components

### 1. **Instructor/HR Side** (`/attendance` page)
- **Purpose**: Create and manage attendance sessions
- **Access**: Admin, Instructor, HR roles only
- **Features**:
  - Select a class
  - Start/End attendance session
  - Generate rotating QR codes (rotates every 30 seconds by default)
  - Display manual 6-digit code
  - View real-time attendance count
  - Export attendance records

### 2. **Student Side** (`/my-attendance` page)
- **Purpose**: Mark attendance by scanning QR or entering manual code
- **Access**: All authenticated users (students)
- **Features**:
  - Camera-based QR scanner
  - Manual code entry (6-digit or full link)
  - Select attendance status (Present / Leave)
  - If Leave: Select reason (Medical / Official / Other) and add optional note
  - View attendance history

## How It Works

### Step 1: Instructor Starts Session
1. Instructor goes to `/attendance`
2. Selects a class from dropdown
3. Clicks "Start Session"
4. System generates:
   - Session ID (sid)
   - Rotating JWT token (t) - changes every 30 seconds
   - QR code containing: `https://yoursite.com/my-attendance?sid=SESSION_ID&t=TOKEN`
   - 6-digit manual code (last 6 chars of token)

### Step 2: Student Marks Attendance

**Option A: QR Code Scan**
1. Student opens `/my-attendance` on their phone
2. Browser requests camera permission
3. Student points camera at instructor's QR code
4. System automatically detects and scans QR
5. Extracts `sid` and `t` from QR payload
6. Calls Firebase function `attendanceScan`

**Option B: Manual Entry**
1. Student opens `/my-attendance`
2. Enters 6-digit code shown on instructor's screen
3. OR pastes full link: `https://yoursite.com/my-attendance?sid=...&t=...`
4. Clicks "Submit"
5. System parses code/link and calls `attendanceScan`

**Option C: Magic Link (Direct Access)**
1. Instructor clicks "Copy Student Link" button
2. Shares link via WhatsApp/Email/SMS
3. Student clicks link → opens `/my-attendance?sid=...&t=...`
4. System auto-detects URL parameters
5. If student is logged in → auto-submits attendance
6. If NOT logged in → redirects to login, then back to attendance page

### Step 3: Backend Validation (`attendanceScan` function)
```javascript
exports.attendanceScan = onCall(async (req) => {
  // 1. Check user is authenticated
  if (!req.auth) throw new Error('auth_required');
  
  // 2. Verify token is valid and not expired
  const v = verifyToken(token);
  if (!v.ok) throw new Error('invalid_token');
  
  // 3. Check session exists and is open
  const session = await getSession(sid);
  if (session.status !== 'open') throw new Error('session_closed');
  
  // 4. Device binding check (if enabled)
  if (strictDeviceBinding) {
    // Ensure student uses same device throughout session
    // Prevents sharing QR codes
  }
  
  // 5. Record attendance
  await recordMark({
    uid: req.auth.uid,
    status: 'present' | 'leave',
    reason: 'medical' | 'official' | 'other', // if leave
    note: 'optional note',
    deviceHash: 'device fingerprint',
    timestamp: now()
  });
  
  return { ok: true };
});
```

## Attendance Statuses

### Current Statuses (in code):
- **present**: Student is present
- **leave**: Student is on leave

### Requested Additional Statuses:
You mentioned needing these statuses for metrics:

1. **Present** ✅ (already exists)
2. **Leave** ✅ (already exists)
   - With excuse (medical, official)
   - Without excuse (other)
3. **Sick Leave** (medical - already covered under leave reason)
4. **Official Leave** (already covered under leave reason)
5. **Humanitarian Leave** (needs to be added)

### Recommended Status Structure:
```javascript
// Main status
status: 'present' | 'absent' | 'leave' | 'late'

// If status === 'leave', add reason:
reason: 'medical' | 'official' | 'humanitarian' | 'personal'

// Add excuse flag for metrics:
excused: true | false

// Optional note for details
note: 'Doctor appointment' | 'Family emergency' | etc.
```

## Security Features

### 1. Token Rotation
- QR token changes every 30 seconds
- Prevents screenshot sharing
- Old tokens become invalid

### 2. Device Binding (Strict Mode)
- Each student can only scan from ONE device per session
- If student tries to scan from different device → blocked
- Prevents students from sharing QR codes with absent friends

### 3. Session Time Limits
- Sessions auto-close after configured duration (default 15 minutes)
- Late arrivals can be marked if "Late Mode" is enabled

### 4. Authentication Required
- Students MUST be logged in to mark attendance
- Backend verifies Firebase Auth token
- No anonymous attendance marking

## Current Issues & Fixes Needed

### Issue 1: 500 Error on `/my-attendance`
**Cause**: Token verification failing or session not found
**Fix**: 
- Check if session is still open
- Verify token hasn't expired
- Ensure user is authenticated before scanning

### Issue 2: UI Improvements Needed
1. ✅ Remove "attendance" title at top
2. ✅ Remove duplicate "Year" label
3. ✅ Remove "Term" label
4. ✅ Remove "Select Class" section with icon (not needed for students)
5. ✅ Add more leave statuses (humanitarian, personal)
6. ✅ Add excuse flag for metrics

### Issue 3: Manual Code Flow Unclear
**Current**: Student can enter 6-digit code OR full link
**Problem**: Not clear what happens after entering code
**Solution**: 
- Make it clear that manual entry is alternative to QR scan
- Show loading state after submission
- Display success/error message clearly

## Data Structure

### attendanceSessions Collection
```javascript
{
  sid: 'unique-session-id',
  classId: 'class-id',
  instructorId: 'instructor-uid',
  status: 'open' | 'closed',
  createdAt: timestamp,
  closedAt: timestamp,
  rotationSeconds: 30,
  strictDeviceBinding: true,
  lateMode: false,
  
  // Subcollection: marks
  marks: {
    [studentUid]: {
      uid: 'student-uid',
      status: 'present' | 'leave' | 'late',
      reason: 'medical' | 'official' | 'humanitarian',
      excused: true | false,
      note: 'optional note',
      deviceHash: 'device-fingerprint',
      at: timestamp
    }
  },
  
  // Subcollection: events (for audit trail)
  events: [
    {
      type: 'anomaly_device_change' | 'manual_override',
      uid: 'student-uid',
      at: timestamp,
      details: {}
    }
  ]
}
```

## Metrics & Reporting

### Available Metrics:
1. **Attendance Rate**: `(present + excused_leave) / total_students * 100`
2. **Absence Rate**: `(unexcused_leave + absent) / total_students * 100`
3. **Leave Breakdown**:
   - Medical leaves
   - Official leaves
   - Humanitarian leaves
   - Personal leaves
4. **Excuse Rate**: `excused_leaves / total_leaves * 100`
5. **Device Anomalies**: Count of device change attempts
6. **Late Arrivals**: Count of students marked late

## Recommendations

### For Students:
1. Always use the same device for attendance
2. Scan QR immediately when session starts
3. If camera doesn't work, use manual code entry
4. If on leave, select appropriate reason and add note

### For Instructors:
1. Start session at beginning of class
2. Keep QR visible for 2-3 minutes
3. Enable "Late Mode" after session for late arrivals
4. Review attendance anomalies regularly
5. Use manual override for legitimate exceptions

### For HR/Admin:
1. Configure rotation time based on class size
2. Enable strict device binding for high-security scenarios
3. Export attendance regularly for backup
4. Monitor anomaly events for potential cheating
5. Generate reports by leave type for policy decisions

## Next Steps

1. ✅ Fix 500 error by improving error handling
2. ✅ Add humanitarian/personal leave reasons
3. ✅ Add excuse flag to leave records
4. ✅ Improve UI labels and remove redundant elements
5. ✅ Add clear success/error messages
6. ⏳ Add attendance analytics dashboard
7. ⏳ Add bulk attendance import/export
8. ⏳ Add attendance notifications (email/SMS)
9. ⏳ Add attendance appeals system
