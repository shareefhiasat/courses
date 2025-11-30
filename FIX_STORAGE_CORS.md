# Fix Firebase Storage CORS Error

## Problem
Voice messages and image uploads in chat are failing with CORS errors:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'http://localhost:5174' has been blocked by CORS policy
```

## Solution

### Option 1: Using gsutil (Recommended)

1. **Install Google Cloud SDK** (includes gsutil):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Run the installer
   - Follow the setup wizard

2. **Authenticate with your Google account**:
   ```bash
   gcloud auth login
   ```

3. **Set your Firebase project**:
   ```bash
   gcloud config set project main-one-32026
   ```

4. **Apply CORS configuration**:
   ```bash
   gsutil cors set cors.json gs://main-one-32026.appspot.com
   ```

5. **Verify CORS is set**:
   ```bash
   gsutil cors get gs://main-one-32026.appspot.com
   ```

### Option 2: Using Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `main-one-32026`
3. Go to **Storage** in the left sidebar
4. Click on **Rules** tab
5. The CORS configuration needs to be set via `gsutil` (Option 1)

   **Note:** Firebase Console doesn't have a UI for CORS configuration, 
   you must use `gsutil` command line tool.

### Option 3: Temporary Workaround (Development Only)

If you need to test immediately without installing gsutil:

1. Deploy your app to Firebase Hosting (production URL)
2. The production URL (`https://main-one-32026.web.app`) is already 
   in the CORS configuration
3. Test voice/image uploads on the deployed version

**This is NOT a permanent solution** - you should still install gsutil 
and apply CORS for localhost development.

## What the CORS Configuration Does

The `cors.json` file allows these origins to access Firebase Storage:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:5174` (Vite dev server alternate port)
- `https://main-one-32026.web.app` (Production)
- `https://main-one-32026.firebaseapp.com` (Production alternate)

It allows these HTTP methods:
- GET, HEAD, POST, PUT, DELETE, OPTIONS

And exposes these response headers needed for uploads:
- Content-Type, Authorization, x-goog-* headers

## Verification

After applying CORS, test by:
1. Refresh your localhost app
2. Try sending a voice message in chat
3. Try uploading an image in chat
4. Check browser console - CORS errors should be gone

## Troubleshooting

If CORS errors persist after applying configuration:
1. Wait 1-2 minutes for changes to propagate
2. Clear browser cache and hard reload (Ctrl+Shift+R)
3. Check that you applied CORS to the correct bucket
4. Verify the bucket name: `gs://main-one-32026.appspot.com`
