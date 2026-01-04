# How to Deploy Firestore Rules

## Prerequisites
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in your project (if not done): `firebase init`

## Deploy Rules

### Option 1: Using Firebase CLI (Recommended)
```bash
# Navigate to your project root
cd E:\QAF\Github\courses

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Or deploy everything
firebase deploy
```

### Option 2: Using Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project
3. Navigate to **Firestore Database** > **Rules** tab
4. Click **Edit rules**
5. Copy the contents of `firestore.rules` file
6. Paste into the editor
7. Click **Publish**

### Option 3: Using VS Code Extension
1. Install "Firebase" extension in VS Code
2. Open `firestore.rules` file
3. Click the "Deploy" button in the editor

## Verify Rules
After deploying, test your rules:
1. Go to Firebase Console > Firestore Database > Rules
2. Click **Rules Playground** tab
3. Test different scenarios (read, write, delete) for different user roles

## Common Issues

### Permission Denied Errors
- Make sure the user's custom claims are set correctly (instructor, hr, admin)
- Check that `isAdmin()`, `isSignedIn()`, etc. helper functions are working
- Verify the user's token has the correct claims

### Rules Not Updating
- Wait a few seconds after deploying (rules can take up to 1 minute to propagate)
- Clear browser cache and refresh
- Check Firebase Console to confirm rules were deployed

## Testing Rules Locally
```bash
# Start Firestore emulator
firebase emulators:start --only firestore

# Test rules in emulator
# Rules are automatically loaded from firestore.rules
```

