# HR Role Setup Instructions

## Quick Setup

### Method 1: Using Firebase Console (Easiest)

1. Open Firebase Console
2. Go to Firestore Database
3. Navigate to `users` collection
4. Find the user document you want to make HR
5. Click "Edit Document"
6. Add a new field:
   - Field: `role`
   - Type: `string`
   - Value: `hr`
7. Click "Update"
8. User will be HR on next login

### Method 2: Using Firestore Rules (Programmatic)

Add this to your Cloud Functions or admin script:

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

async function makeUserHR(email) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log('User not found');
    return;
  }
  
  const userDoc = snapshot.docs[0];
  await userDoc.ref.update({
    role: 'hr',
    isHR: true
  });
  
  console.log(`User ${email} is now HR`);
}

// Usage
makeUserHR('hr@example.com');
```

### Method 3: Using Dashboard (If you have admin panel)

1. Login as admin
2. Go to Dashboard → Users
3. Find the user
4. Click "Edit"
5. Change role to "HR"
6. Save

---

## HR User Document Structure

```json
{
  "uid": "abc123",
  "email": "hr@example.com",
  "displayName": "HR Manager",
  "role": "hr",
  "isHR": true,
  "createdAt": "2024-11-08T...",
  "enrolledClasses": []
}
```

**Note**: Either `role: 'hr'` OR `isHR: true` will work. The system checks both.

---

## Roles Hierarchy

1. **Admin** (`role: 'admin'` or admin claim)
   - Full system access
   - Can do everything

2. **HR** (`role: 'hr'` or `isHR: true`)
   - Monitor attendance
   - Edit attendance records
   - Export reports
   - Chat with students/instructors
   - Send announcements

3. **Instructor** (`role: 'instructor'` or `isInstructor: true`)
   - Manage their classes
   - Start/end attendance sessions
   - View student progress
   - Grade assignments

4. **Student** (default, no special role)
   - Scan attendance
   - View personal records
   - Submit assignments
   - Chat

---

## Testing HR Access

1. **Create a test HR user**:
   ```javascript
   // In Firebase Console or script
   {
     "email": "test-hr@example.com",
     "role": "hr",
     "displayName": "Test HR"
   }
   ```

2. **Login with that user**

3. **Check navigation menu**:
   - Should see "HR Attendance" link
   - Should NOT see "Dashboard" (admin only)

4. **Go to `/hr-attendance`**:
   - Should see all sessions
   - Should be able to edit records

5. **Try editing a record**:
   - Click a session
   - Click "Edit" on a student
   - Change status, add reason
   - Click "Save"
   - Should update successfully

---

## Firestore Rules for HR

Make sure your Firestore rules allow HR to read/write attendance:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is HR
    function isHR() {
      return request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'hr' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isHR == true
      );
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    // Attendance sessions - HR and admin can read all
    match /attendanceSessions/{sessionId} {
      allow read: if request.auth != null;
      allow write: if isAdmin() || isHR();
      
      // Marks subcollection
      match /marks/{markId} {
        allow read: if request.auth != null;
        allow write: if isAdmin() || isHR() || request.auth.uid == markId;
      }
    }
    
    // Users collection - HR can read all users
    match /users/{userId} {
      allow read: if request.auth != null && (
        request.auth.uid == userId || 
        isAdmin() || 
        isHR()
      );
      allow write: if request.auth.uid == userId || isAdmin();
    }
  }
}
```

---

## HR Permissions Summary

### Can Do:
✅ View all attendance sessions
✅ View all student attendance records
✅ Edit attendance status (present, late, absent, leave)
✅ Add reasons and feedback
✅ Export attendance reports (CSV)
✅ Filter by class, date, status
✅ Chat with students and instructors
✅ Send announcements (future feature)

### Cannot Do:
❌ Delete users
❌ Create classes
❌ Modify grades
❌ Access admin dashboard
❌ Change system settings
❌ Impersonate users

---

## Multiple HR Users

You can have multiple HR users:

```javascript
// User 1
{
  "email": "hr1@example.com",
  "role": "hr",
  "displayName": "HR Manager 1"
}

// User 2
{
  "email": "hr2@example.com",
  "role": "hr",
  "displayName": "HR Manager 2"
}
```

All HR users have the same permissions.

---

## Removing HR Access

To remove HR access from a user:

1. Open their user document in Firestore
2. Change `role` from `"hr"` to `"student"`
3. Or delete the `role` field
4. Or set `isHR` to `false`
5. User will lose HR access on next login

---

## Troubleshooting

### HR user can't access /hr-attendance:
- Check user document has `role: 'hr'` or `isHR: true`
- Check Firestore rules allow HR reads
- Clear browser cache and re-login

### HR can't edit records:
- Check Firestore rules allow HR writes
- Verify user is authenticated
- Check browser console for errors

### HR menu not showing:
- Verify AuthContext is detecting HR role
- Check SideDrawer is using `isHR` from context
- Re-login to refresh auth state

---

## Best Practices

1. **Limit HR users**: Only give HR access to trusted personnel
2. **Audit trail**: HR edits are tracked with `updatedBy` field
3. **Regular reviews**: Periodically review who has HR access
4. **Training**: Train HR users on the system before giving access
5. **Backup**: Always export data before bulk edits

---

## Future Enhancements

- HR dashboard with analytics
- Bulk edit attendance
- Automated reports (weekly/monthly)
- HR announcements section
- Attendance alerts (low attendance warnings)

---

**Need Help?** Check the main ATTENDANCE_SYSTEM_GUIDE.md for more details.
