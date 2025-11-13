# Attendance System - Complete Guide

## Overview
The attendance system uses rotating QR codes for secure, real-time attendance tracking. Students scan QR codes during class sessions, and the system prevents cheating through device binding and token rotation.

---

## Roles & Access

### 1. **Admin**
- Full system access
- Configure attendance settings (rotation time, session duration, device binding)
- Start/end sessions for any class
- View all attendance data

### 2. **HR (Human Resources)**
- Monitor attendance across all classes
- Add reasons and feedback for absences/late arrivals
- Export attendance reports
- Audit attendance records
- Send announcements (via chat with HR section)

### 3. **Instructor**
- Start/end attendance sessions for their classes
- View real-time scan count
- Enable "Late Mode" after session ends
- Export session CSV
- View student progress

### 4. **Student**
- Scan QR codes to mark attendance
- View personal attendance history
- Filter by class, status, date range
- Export personal attendance CSV

---

## How It Works

### For Instructors/Admin:

1. **Select a Class**
   - Use filters: Term, Year, Instructor (for admin/HR)
   - Classes shown with term/year/code info
   - Selected class is highlighted

2. **Start Session**
   - Click "Start Session" button
   - QR code generates immediately
   - Token rotates every X seconds (default: 30s)
   - Real-time scan counter shows how many students scanned

3. **During Session**
   - QR code auto-refreshes (students must scan during active window)
   - Monitor scan count in real-time
   - Copy student link for sharing
   - Export CSV anytime

4. **End Session**
   - Click "End Session" to close
   - Optionally enable "Late Mode" for late arrivals

5. **Late Mode**
   - Allows students to scan after session ends
   - Marks them as "late" instead of "present"
   - Useful for students who arrive after class starts

### For Students:

1. **Access /my-attendance page**
   - Camera opens automatically (if supported)
   - Or use manual entry field

2. **Scan QR Code**
   - Point camera at instructor's QR code
   - Or paste the link manually
   - Instant confirmation message

3. **View History**
   - See all past attendance records
   - Filter by class, status, date
   - Export personal CSV

---

## Attendance Settings (Admin Only)

### QR Rotation Seconds (10-120)
- How often the QR token changes
- Default: 30 seconds
- Shorter = more secure, more writes
- Longer = less secure, fewer writes

### Session Duration (5-180 minutes)
- How long the session stays open
- Default: 15 minutes
- Auto-closes after this time

### Strict Device Binding
- **Enabled**: Each student can only scan from ONE device per session
  - Prevents students from sharing QR codes
  - Recommended for exams/important sessions
- **Disabled**: Students can scan from multiple devices
  - Useful if students might switch devices

---

## Cost Analysis

### Firestore Writes:
- **QR Rotation**: 1 write per rotation
  - 30s rotation + 15min session = ~30 writes/session
  - Cost: ~$0.0006 per session (negligible)
  
- **Student Scans**: 1 write per scan
  - 50 students = 50 writes
  - Cost: ~$0.001 per session

### Total Cost per Session: ~$0.002 (less than 1 cent)

**For 100 sessions/month**: ~$0.20/month

This is extremely minimal and not a concern.

---

## Attendance Statuses

### For Students:
1. **Present** (Attended) - Scanned during active session
2. **Late** - Scanned during late mode
3. **Absent** - Did not scan
4. **Leave** - Approved absence (set by HR/instructor)

### HR Can Add:
- **Reason**: Why absent/late (e.g., "Medical appointment")
- **Feedback**: Additional notes for records

---

## HR Features

### HR Attendance Page (`/hr-attendance`)
1. **View All Sessions**
   - Filter by class, date range
   - See session status (open/closed)
   - Click to view details

2. **Session Details**
   - Summary stats: Present, Late, Absent, Leave counts
   - List of all students with status
   - Edit individual records

3. **Edit Attendance**
   - Change status (present → late, absent → leave, etc.)
   - Add reason (e.g., "Doctor's note provided")
   - Add feedback (e.g., "Excused absence")
   - Changes tracked with HR user ID

4. **Export Reports**
   - CSV export with all details
   - Includes: UID, Name, Email, Status, Reason, Feedback, Timestamp

---

## Class Schedules (Future Feature)

### Planned Features:
1. **Schedule Days**: SUN/TUE/THU or MON/WED
2. **Class Times**: Start time, End time
3. **Holidays**: Mark specific dates as holidays
4. **Instructor Absent**: Mark days when instructor is absent
   - Students not marked absent on these days

### Benefits:
- Auto-mark absences for students who don't scan
- Don't count absences on holidays/instructor absent days
- Better attendance analytics

---

## Student Enrollment Controls

### For Instructors:
1. **Disable Student Access** (per class)
   - Student can't access class chat
   - Student can't see class activities
   - Student can't submit assignments
   - Useful for suspended students

2. **Re-enable Access**
   - Restore full access anytime

### Implementation:
- Add `disabledStudents: [uid1, uid2]` array to class document
- Check this array before showing class content

---

## OTP Login (Future Feature)

### For Students:
1. **Request OTP**
   - Enter email/phone
   - Receive one-time password
   - Enter OTP to login

2. **Benefits**:
   - No password to remember
   - More secure than passwords
   - Prevents account sharing

### Implementation:
- Use Firebase Auth Phone/Email OTP
- Store preference in user document
- Optional per student

---

## My-Attendance Page

### Purpose:
- **For Students**: Scan QR codes and view personal history
- **For Instructors/HR**: View attendance records (if needed)

### Features:
- QR Scanner (camera-based)
- Manual entry field (paste link)
- Attendance history with filters
- Export personal CSV
- Real-time scan confirmation

### Configurable Visibility:
- **Class Level**: Instructor can hide/show attendance history for entire class
- **User Level**: Student can choose to hide their own history
- Controlled via class settings and user preferences

---

## Testing Guide

### As Instructor:
1. Login as instructor
2. Go to `/attendance`
3. Select a class
4. Click "Start Session"
5. QR code appears
6. Copy student link
7. Open in incognito/another browser
8. Scan or paste link
9. Check scan counter increases
10. Click "Export CSV"
11. Click "End Session"

### As Student:
1. Login as student
2. Go to `/my-attendance`
3. Allow camera access
4. Scan QR code from instructor's screen
5. See confirmation message
6. Check attendance history below
7. Filter by class/date
8. Export CSV

### As HR:
1. Login as HR user (set `role: 'hr'` in user document)
2. Go to `/hr-attendance`
3. See all sessions
4. Click a session
5. View attendance details
6. Click "Edit" on a student
7. Change status, add reason/feedback
8. Click "Save"
9. Export CSV

---

## Button Labels Clarification

### On Attendance Page:
- **📋 Copy Student Link**: Copies the attendance URL to clipboard (students paste this in browser)
- **📊 Export CSV**: Downloads attendance data as CSV file (for records/analysis)

### Clear and descriptive with emojis for better UX!

---

## Guidelines Section

The attendance page now includes an in-UI guidelines section explaining:
- How to start a session
- How students scan
- QR rotation security
- Device binding
- Late mode usage
- Export functionality
- Cost information

This ensures instructors understand the system without needing external documentation.

---

## Navigation Updates

### Student Menu:
- Home
- Activities
- Progress
- Leaderboard
- Chat
- Resources
- My Classes
- **My Attendance** ← New!
- Notifications
- Settings

### Instructor Menu:
- Home
- Activities
- **Attendance** ← Enhanced!
- Student Progress
- Leaderboard
- Chat
- Resources
- Notifications
- Settings

### HR Menu:
- Home
- **HR Attendance** ← New!
- HR Reports (future)
- Chat
- Notifications
- Settings

### Admin Menu:
- (All existing features)
- **Attendance** ← Enhanced!

---

## Summary of Changes

### ✅ Completed:
1. ✅ Added HR role to AuthContext
2. ✅ Created HR navigation links
3. ✅ Enhanced AttendancePage with:
   - Better class picker with term/year/instructor filters
   - Real-time attendance count
   - Guidelines section
   - Late mode toggle
   - Improved UI/UX
4. ✅ Created HRAttendancePage with:
   - Session monitoring
   - Attendance editing
   - Reason/feedback fields
   - Export functionality
5. ✅ Updated SideDrawer for HR/Instructor roles
6. ✅ Added routes for HR pages

### 📋 Pending (Future Enhancements):
1. Class schedules (days, times, holidays)
2. Student enrollment disable/enable
3. OTP login for students
4. Configurable attendance visibility
5. Auto-mark absences based on schedule
6. HR announcements section

---

## Next Steps

1. **Deploy Cloud Functions** (if not already done)
   - `attendanceCreateSession`
   - `attendanceScan`
   - `attendanceCloseSession`

2. **Set Environment Variable**
   - `ATTENDANCE_SECRET` in Cloud Functions config

3. **Create HR Users**
   - Set `role: 'hr'` in user documents
   - Or `isHR: true`

4. **Test the System**
   - Follow testing guide above
   - Verify QR rotation works
   - Check device binding
   - Test HR editing features

5. **Optional: Implement Pending Features**
   - Class schedules
   - OTP login
   - Enrollment controls

---

## Troubleshooting

### QR Code Not Generating:
- Check Cloud Functions are deployed
- Verify `ATTENDANCE_SECRET` is set
- Check browser console for errors

### Students Can't Scan:
- Ensure session is active (not ended)
- Check camera permissions
- Try manual entry as fallback

### Scan Count Not Updating:
- Check Firestore rules allow reads
- Verify real-time listener is active
- Check browser console

### HR Can't Edit:
- Verify user has `role: 'hr'` or `isHR: true`
- Check Firestore rules allow HR writes
- Ensure session exists

---

## Contact & Support

For issues or questions:
1. Check browser console for errors
2. Verify Firestore rules
3. Check Cloud Functions logs
4. Review this guide

---

**Last Updated**: November 2024
**Version**: 2.0
