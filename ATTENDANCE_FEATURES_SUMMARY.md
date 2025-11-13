# Attendance System Features - Implementation Summary

## Overview
This document summarizes all the new features implemented for the attendance system, including HR role support, leave tracking, manual attendance override, role access management, and student profile summaries.

---

## 1. HR Role Support

### What is HR Role?
- HR (Human Resources) users can view and export attendance data across all classes
- They can view student profiles and add manual attendance corrections
- HR users have read-only access to attendance data with the ability to add notes and corrections

### How to Set Up HR Users
Add the following fields to a user document in Firestore (`users/{uid}`):
```json
{
  "isHR": true,
  "role": "hr"
}
```

### HR Navigation
HR users have access to:
- **HR Attendance** page (`/hr-attendance`) - View and export attendance across all classes
- **Analytics** page - View attendance statistics
- **Student Profile** page - View individual student performance
- **Chat** - Communication with students and instructors
- **Notifications** and **Profile Settings**

---

## 2. Leave Status for Students

### Feature Description
Students can now mark themselves as "Leave" when scanning attendance, with a reason and optional note.

### Leave Reasons
- **Medical** - For medical appointments or illness
- **Official** - For official university/government business
- **Other** - For other valid reasons

### How Students Use It
1. Go to **My Attendance** page
2. Select **Status**: "Leave" (instead of "Present")
3. Choose a **Leave Reason**: Medical, Official, or Other
4. Optionally add a **Note** with details
5. Scan QR code or enter manual code as usual

### Data Structure
Leave marks are stored in `attendanceSessions/{sid}/marks/{uid}`:
```json
{
  "uid": "student_uid",
  "status": "leave",
  "reason": "medical",
  "note": "Doctor appointment at 2pm",
  "at": "timestamp",
  "deviceHash": "..."
}
```

---

## 3. Manual Attendance Override

### Feature Description
HR, Instructors, Admins, and Super Admins can manually add or override attendance marks for any student in any session.

### Who Can Use It?
- Super Admin
- Admin
- HR
- Instructor (for their classes)

### Cloud Function
**Function Name**: `attendanceManualOverride`

**Parameters**:
```javascript
{
  sid: "session_id",        // Required
  uid: "student_uid",       // Required
  status: "present|absent|late|leave",  // Required
  reason: "medical|official|other",     // Optional (for leave)
  note: "Reason for override"          // Optional
}
```

**Example Call**:
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const manualOverride = httpsCallable(functions, 'attendanceManualOverride');

await manualOverride({
  sid: 'session123',
  uid: 'student456',
  status: 'present',
  note: 'Student was present but scanner failed'
});
```

### Data Structure
Manual overrides add these fields to the mark:
```json
{
  "uid": "student_uid",
  "status": "present",
  "overriddenBy": "admin_uid",
  "overriddenAt": "timestamp",
  "manual": true,
  "note": "Scanner malfunction - student was present"
}
```

An event is also logged:
```json
{
  "type": "manual_override",
  "uid": "student_uid",
  "status": "present",
  "actor": "admin_uid",
  "note": "...",
  "at": "timestamp"
}
```

---

## 4. Role Access Management (Super Admin)

### Feature Description
Super Admins can control which screens/pages are visible to each role (admin, instructor, hr, student).

### Access
- **Page**: `/role-access`
- **Who**: Super Admin only
- **Navigation**: Admin menu → Role Access

### How It Works
1. Super Admin goes to Role Access page
2. Sees a grid of all screens × all roles
3. Toggles each screen on/off for each role
4. Clicks "Save Role Access"
5. Changes are stored in `config/roleScreens` document

### Default Configuration
```json
{
  "admin": {
    "dashboard": true,
    "attendance": true,
    "analytics": true,
    "studentProfile": true,
    "roleAccess": true,
    "hrAttendance": true,
    ...
  },
  "instructor": {
    "attendance": true,
    "analytics": true,
    "studentProfile": true,
    "classSchedule": true,
    ...
  },
  "hr": {
    "hrAttendance": true,
    "analytics": true,
    "studentProfile": true,
    ...
  },
  "student": {
    "myAttendance": true,
    "activities": true,
    "studentProfile": true,
    ...
  }
}
```

### Available Screens
- Dashboard
- Activities
- Resources
- Classes
- Attendance (Instructor)
- My Attendance (Student)
- HR Attendance
- Analytics
- Student Profile
- Class Schedule
- Manage Enrollments
- Chat
- Leaderboard
- Progress
- Enrollments
- Notifications
- Profile Settings

---

## 5. Student Profile Summary

### Feature Description
Comprehensive view of a student's attendance and performance across all classes.

### Access
- **Page**: `/student-profile?uid={student_uid}`
- **Who**: Students (own profile), HR, Instructors, Admins, Super Admins
- **Navigation**: All role menus → Student Profile

### Features

#### Attendance Summary (Per Class)
- Total sessions
- Present count
- Absent count
- Late count
- Leave count
- Attendance rate (%)

#### Performance Summary
Three categories tracked:
1. **Homework Performance**
   - Completed / Total
   - Average grade

2. **Quiz Performance**
   - Completed / Total
   - Average grade

3. **Activity Performance**
   - Completed / Total
   - Average grade

### Data Sources
- **Attendance**: `attendanceSessions` collection + `marks` subcollections
- **Performance**: `submissions` collection + `activities` collection

### Student View
Students can view their own profile without the `uid` parameter:
- URL: `/student-profile` (automatically shows their own data)
- Read-only view of their attendance and performance

---

## 6. Enhanced Cloud Functions

### attendanceScan (Extended)
Now supports leave status:

**New Parameters**:
```javascript
{
  sid: "session_id",
  token: "attendance_token",
  deviceHash: "device_hash",
  status: "present|leave",     // NEW
  reason: "medical|official|other",  // NEW (for leave)
  note: "Optional note"         // NEW
}
```

### attendanceManualOverride (New)
Allows authorized users to manually add/override attendance marks.

**Parameters**:
```javascript
{
  sid: "session_id",
  uid: "student_uid",
  status: "present|absent|late|leave",
  reason: "medical|official|other",  // Optional
  note: "Override reason"            // Optional
}
```

**Permissions**:
- Checks if user is admin (via claim or allowlist)
- Checks if user has `isHR`, `isInstructor`, or `isSuperAdmin` flag
- Logs all overrides with actor information

---

## 7. Translation Keys Added

### English
```javascript
hr: 'HR'
hr_attendance: 'HR Attendance'
leave: 'Leave'
leave_reason: 'Leave Reason'
medical: 'Medical'
official: 'Official'
other: 'Other'
manual_override: 'Manual Override'
add_manual_attendance: 'Add Manual Attendance'
override_attendance: 'Override Attendance'
select_student: 'Select Student'
attendance_note: 'Note'
attendance_reason: 'Reason'
actor: 'Actor'
overridden_by: 'Overridden By'
student_profile: 'Student Profile'
attendance_summary: 'Attendance Summary'
performance_summary: 'Performance Summary'
total_sessions: 'Total Sessions'
present_count: 'Present'
absent_count: 'Absent'
late_count: 'Late'
leave_count: 'Leave'
attendance_rate: 'Attendance Rate'
homework_performance: 'Homework Performance'
quiz_performance: 'Quiz Performance'
activity_performance: 'Activity Performance'
average_grade: 'Average Grade'
completed_count: 'Completed'
pending_count: 'Pending'
role_access: 'Role Access'
manage_role_screens: 'Manage Role Screens'
enable_disable_screens: 'Enable/Disable Screens per Role'
screen_name: 'Screen Name'
enabled: 'Enabled'
disabled: 'Disabled'
save_role_access: 'Save Role Access'
role_access_updated: 'Role access updated successfully'
```

### Arabic
All keys have Arabic translations (see LangContext.jsx)

---

## 8. Files Modified/Created

### New Files
1. `client/src/pages/RoleAccessPage.jsx` - Role access management UI
2. `client/src/pages/StudentProfilePage.jsx` - Student profile summary
3. `ATTENDANCE_FEATURES_SUMMARY.md` - This document

### Modified Files
1. `functions/index.js` - Extended attendanceScan, added attendanceManualOverride
2. `client/src/contexts/LangContext.jsx` - Added translations, fixed duplicates
3. `client/src/contexts/AuthContext.jsx` - Already had isHR support
4. `client/src/pages/StudentAttendancePage.jsx` - Added leave status UI
5. `client/src/components/SideDrawer.jsx` - Added new navigation links
6. `client/src/App.jsx` - Added new routes

---

## 9. Deployment Steps

### 1. Install Dependencies
```bash
npm ci
npm ci --prefix client
npm ci --prefix functions
```

### 2. Build Client
```bash
npm run build
```

### 3. Deploy to Firebase
```bash
firebase deploy --only "hosting,firestore,functions" --project main-one-32026
```

### 4. Configure Super Admin
Add to user document in Firestore:
```json
{
  "isSuperAdmin": true,
  "isInstructor": true,
  "role": "instructor"
}
```

### 5. Configure HR Users
Add to user documents:
```json
{
  "isHR": true,
  "role": "hr"
}
```

### 6. Set Default Role Screens (Optional)
The system will auto-create defaults on first access to Role Access page.

---

## 10. Testing Checklist

### Student Features
- [ ] Student can select "Leave" status when scanning attendance
- [ ] Student can choose leave reason (medical/official/other)
- [ ] Student can add optional note for leave
- [ ] Student can view their own profile at `/student-profile`
- [ ] Student profile shows attendance summary per class
- [ ] Student profile shows performance metrics

### HR Features
- [ ] HR user can access HR Attendance page
- [ ] HR can view attendance across all classes
- [ ] HR can view student profiles
- [ ] HR can export attendance data
- [ ] HR navigation menu shows correct links

### Admin/Instructor Features
- [ ] Can manually override attendance marks
- [ ] Manual override logs actor and note
- [ ] Can view student profiles with ?uid parameter
- [ ] Instructor can see their classes' attendance

### Super Admin Features
- [ ] Can access Role Access page
- [ ] Can toggle screens on/off for each role
- [ ] Changes persist and affect navigation
- [ ] All admin features work

### Cloud Functions
- [ ] attendanceScan accepts leave status
- [ ] attendanceManualOverride works with proper permissions
- [ ] Manual overrides create event logs
- [ ] Permission checks work correctly

---

## 11. Future Enhancements

### Planned Features
1. **Manual Override UI in HRAttendancePage**
   - Modal to add/override marks directly from HR page
   - Student selector dropdown
   - Status and reason fields
   - Note field

2. **Attendance Reports**
   - Export with leave reasons and notes
   - Filter by date range, class, status
   - Include override information

3. **Student Profile Enhancements**
   - Timeline view of attendance events
   - Charts and graphs
   - Export student summary as PDF

4. **Role Screen Toggles Enforcement**
   - Route guards based on roleScreens config
   - Hide disabled screens from navigation
   - Redirect if user tries to access disabled screen

---

## 12. Role Clarification

### Admin
- Platform management
- User management
- Content management
- Full access to all features

### Super Admin
- All admin privileges
- Can configure role access
- Can manage which screens each role sees
- Typically also an instructor

### Instructor
- Teaching role
- Manage their classes
- Start/close attendance sessions
- View/export attendance for their classes
- Manage enrollments
- Manual attendance override

### HR
- View attendance across all classes
- View student profiles
- Export attendance data
- Add manual corrections with notes
- Read-only access to most features

### Student
- Scan attendance (present or leave)
- View their own attendance history
- View their own profile
- Access learning materials
- Submit assignments

---

## Support

For questions or issues, refer to:
- `IMPLEMENTATION_SUMMARY.md` - Overall system documentation
- `ATTENDANCE_SYSTEM_GUIDE.md` - Attendance system guide
- `SETUP_FIREBASE.md` - Firebase setup instructions

---

**Last Updated**: November 11, 2025
**Version**: 2.0
