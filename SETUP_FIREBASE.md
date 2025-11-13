# Firebase Setup Instructions

## 1. Set Environment Variables for Cloud Functions

Run these commands in your terminal:

```bash
cd functions
firebase functions:secrets:set ATTENDANCE_SECRET
# When prompted, enter a random secret (e.g., "my-super-secret-key-12345")

# If you haven't set these already:
firebase functions:config:set gmail.email="your-email@gmail.com"
firebase functions:config:set gmail.password="your-app-password"
firebase functions:config:set site.url="https://your-site.com"
```

## 2. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

## 3. Set Super Admin

In Firestore Console:
1. Go to `config` collection
2. Create/edit `allowlist` document
3. Add field:
   ```json
   {
     "adminEmails": ["shareef.hiasat@gmail.com"],
     "superAdmins": ["shareef.hiasat@gmail.com"]
   }
   ```

## 4. Create Instructor Role

In Firestore Console:
1. Go to `users` collection
2. Find user with email `shareef.hiasat@gmail.com`
3. Add fields:
   ```json
   {
     "role": "instructor",
     "isInstructor": true,
     "isSuperAdmin": true
   }
   ```

## 5. Create Classes

Run this in Firebase Console (Firestore):

```javascript
// Class 1: Introduction to computing
{
  "name": "Introduction to computing",
  "code": "CS101",
  "term": "Fall 2025",
  "year": "2025",
  "owner": "shareef.hiasat@gmail.com",
  "createdAt": new Date(),
  "students": 0
}

// Class 2: Programming Python I
{
  "name": "Programming Python I",
  "code": "CS102",
  "term": "Fall 2025",
  "year": "2025",
  "owner": "shareef.hiasat@gmail.com",
  "createdAt": new Date(),
  "students": 2
}
```

## 6. Fix Duplicate Key Warning

The warning about duplicate `select_user` key in LangContext.jsx needs to be fixed manually.

## Troubleshooting

### Attendance Scan 500 Error
- Make sure `ATTENDANCE_SECRET` is set
- Redeploy functions after setting secrets
- Check Cloud Functions logs: `firebase functions:log`

### Student Can't See Classes
- Check `enrolledClasses` array in user document
- Make sure class IDs match exactly

### Manual Entry Not Working
- Make sure session is active
- Token must be valid (not expired)
- Check device hash is being sent
