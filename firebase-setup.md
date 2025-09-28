# Firebase Setup Guide

## Step 1: Create Firebase Project (Free)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `cs-learning-hub`
4. Disable Google Analytics (not needed)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to "Authentication" → "Get started"
2. Go to "Sign-in method" tab
3. Enable "Email/Password" provider
4. Save

## Step 3: Create Firestore Database

1. Go to "Firestore Database" → "Create database"
2. Choose "Start in test mode" (we'll secure it later)
3. Select closest location
4. Click "Done"

## Step 4: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Web" icon (</>) 
4. Register app name: `CS Learning Hub`
5. Copy the `firebaseConfig` object

## Step 5: Update Your Code

Replace the config in `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Step 6: Security Rules (Important!)

In Firestore Database → Rules, replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read leaderboard, only authenticated users can write
    match /leaderboard/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 7: Test

1. Open your site
2. Try creating an account
3. Submit a score
4. Check Firestore Console to see data

## Free Tier Limits

- **Authentication**: 10,000 phone auths/month (email/password is unlimited)
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Hosting**: 10GB transfer/month

Perfect for a university course!

## Alternative: Google Sheets Backend

If you prefer Google Sheets as a simple database:

1. Create a Google Sheet with columns: `timestamp`, `userId`, `activityId`, `score`, `nickname`
2. Use Google Apps Script to create a web app endpoint
3. Students submit scores via POST requests
4. Much simpler but less secure

Let me know which approach you prefer!
