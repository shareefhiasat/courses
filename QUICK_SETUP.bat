@echo off
echo ========================================
echo QAF Attendance System - Quick Setup
echo ========================================
echo.

echo Step 1: Setting Firebase Secret...
echo.
cd functions
echo Please enter a random secret for ATTENDANCE_SECRET when prompted:
call firebase functions:secrets:set ATTENDANCE_SECRET
echo.

echo Step 2: Deploying Cloud Functions...
echo.
call firebase deploy --only functions
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo NEXT STEPS (Manual):
echo 1. Go to Firebase Console - Firestore
echo 2. Create 'config/allowlist' document with:
echo    {
echo      "adminEmails": ["shareef.hiasat@gmail.com"],
echo      "superAdmins": ["shareef.hiasat@gmail.com"]
echo    }
echo.
echo 3. Find your user document and add:
echo    {
echo      "role": "instructor",
echo      "isInstructor": true,
echo      "isSuperAdmin": true
echo    }
echo.
echo 4. Create classes (see IMPLEMENTATION_SUMMARY.md)
echo.
echo 5. Test attendance system!
echo.
pause
