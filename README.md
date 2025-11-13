# Computer Science Learning Hub

An interactive learning platform for university-level computer science courses, featuring training exercises, quizzes, progress tracking, and multilingual support (English/Arabic).

## Features

- **🌐 Multilingual Support**: Full English/Arabic localization with RTL support
- **🔐 Firebase Authentication**: Email/password and passwordless email link sign-in
- **📊 Cloud Progress Tracking**: Real-time progress sync across devices
- **🎯 Activity Management**: Show/hide activities, due dates, quiz/homework/training types
- **📈 Grading System**: Instructor can assign grades with custom max scores per activity
- **🔔 Announcements**: Real-time notifications with HTML content support
- **👥 User Management**: Admin dashboard with student progress oversight
- **🏆 Leaderboards**: Cloud-based scoring for training activities
- **📱 Responsive Design**: Mobile-optimized interface
- **⏰ Timezone Aware**: All dates display in user's local timezone

## Quick Start

### Local Development
1. **Clone and serve**:
   ```bash
   git clone <your-repo-url>
   cd courses
   npx serve . -l 3000
   ```
   Open http://localhost:3000

2. **Firebase Setup** (required for full functionality):
   - Create Firebase project at https://console.firebase.google.com
   - Enable Authentication → Email/Password + Email link (passwordless)
   - Create Firestore Database
   - Add authorized domains: `localhost:3000` and `yourusername.github.io`
   - Update `firebase-config.js` with your config
   - Set Firestore security rules (see below)

### Production Deployment

#### Option A: Firebase Hosting (Recommended)
Client is built with Vite in `client/` and hosted by Firebase.

Build and deploy (PowerShell-safe):

```powershell
# From repo root
cd client
npm ci
npm run build

# Back to repo root, deploy Hosting (serves client/dist)
cd ..
firebase deploy --only hosting --project <your-project-id>

# If you need to deploy rules and indexes
firebase deploy --only "firestore" --project <your-project-id>

# If you need to deploy Cloud Functions
cd functions
npm ci
cd ..
firebase deploy --only "functions" --project <your-project-id>

# Deploy multiple targets in one command (PowerShell requires quotes):
firebase deploy --only "hosting,firestore,functions" --project <your-project-id>
```

Notes:
- Hosting public dir is `client/dist` (see `firebase.json`).
- For SPAs, rewrites already route `**` to `/index.html`.
- Use quotes around comma-separated targets in PowerShell.

#### Option B: GitHub Pages
- Push to `main` branch → auto-deploys to GitHub Pages
- Live at: `https://shareefhiasat.github.io/courses/`

## Firebase Configuration

### 1. Update firebase-config.js
Replace the config object with your Firebase project settings:
```javascript
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

### 2. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Replace with your admin email(s) - MUST be lowercase
    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email == "your-admin@email.com"
      );
    }

    // Activities: public read, admin write
    match /activities/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Announcements: public read, admin write  
    match /announcements/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // User progress: own data + admin access
    match /users/{userId} {
      allow read, write: if isSignedIn() && (
        request.auth.uid == userId || isAdmin()
      );
    }

    // Config (allowlist): public read, admin write
    match /config/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Leaderboard: public read, signed-in write
    match /leaderboard/{doc} {
      allow read: if true;
      allow write: if isSignedIn();
    }
  }
}
```

### 3. Firestore Collections Structure

**activities** collection:
```javascript
{
  id: "py-variables-quiz",
  course: "python", // "python" | "computing" | "algorithm" | "general"
  title_en: "Python Variables Quiz",
  title_ar: "اختبار متغيرات بايثون", 
  description_en: "Test your knowledge...",
  description_ar: "اختبر معرفتك...",
  type: "quiz", // "quiz" | "homework" | "training"
  url: "https://wordwall.net/...",
  image: "https://...",
  difficulty: "beginner", // "beginner" | "intermediate" | "advanced"
  tags: ["python", "variables"],
  show: true, // false to hide from students
  dueDate: "2025-10-15T23:59:00+03:00", // ISO string, hides after due
  allowRetake: false, // true for training, false for quiz/homework
  order: 10 // for sorting
}
```

**announcements** collection:
```javascript
{
  title: "Quiz 1 Available",
  html: "<p>Complete by <strong>Tuesday 9 PM</strong></p>",
  link: "https://shareefhiasat.github.io/courses/#quiz1",
  createdAt: serverTimestamp()
}
```

## User Workflow

### Students
1. **Sign up/Login**: Use email from allowlist, or passwordless email link
2. **Browse Activities**: See only visible activities not past due date
3. **Complete Work**: Click activity → opens Wordwall → mark "Done" when finished
4. **Track Progress**: View completion dates, grades, and reviewed status
5. **Leaderboards**: Submit scores for training activities

### Instructors  
1. **Dashboard Access**: Login with admin email → dashboard.html
2. **Manage Users**: View all student progress, set grades, mark reviewed
3. **Manage Activities**: Add/edit via Firestore Console (or build admin UI)
4. **Send Announcements**: Post to announcements collection
5. **Allowlist Control**: Edit allowed/admin emails via Dashboard → Allowlist tab

## Project Structure

```
courses/
├── index.html                 # Main student interface
├── dashboard.html             # Instructor dashboard  
├── admin.html                 # Legacy JSON editor (optional)
├── assets/js/
│   ├── app.js                # Main app (auth, activities, progress)
│   └── dashboard.js          # Admin dashboard logic
├── data/
│   ├── activities.json       # Fallback data (empty by default)
│   └── allowlist.json        # Local allowlist (fallback)
├── firebase-config.js         # Firebase SDK and helpers
├── firebase-setup.md          # Detailed setup guide
└── .github/workflows/static.yml # Auto-deployment
```

## Key Features Explained

### Multilingual & RTL
- Language toggle in top bar switches EN ⟷ AR
- RTL layout automatically applied for Arabic
- All dates formatted per user's locale and timezone
- Activity titles/descriptions support separate EN/AR fields

### Grading System
- Instructors set grade + max score per activity per student
- Supports different max scores (e.g., Quiz 1: /10, Quiz 2: /15)
- Grade history with grader email and timestamp
- Total score calculation across all activities

### Activity Management
- **show**: false hides activity from students
- **dueDate**: activities disappear after due date
- **type**: "quiz" (single attempt), "homework" (no retake), "training" (practice + leaderboard)
- **allowRetake**: overrides default retry behavior

## Deployment (GitHub Pages — Free)
This repository is already configured to deploy via GitHub Actions to GitHub Pages on every push to `main` using `.github/workflows/static.yml`.

Steps:
1. Commit your changes.
2. Push to `main`.
3. GitHub Actions will build and publish automatically. You can check progress under the **Actions** tab.
4. Your site will be available at: `https://<your-username>.github.io/courses/`.

GitHub Pages is free for public repositories.

## CI/CD for Firebase (GitHub Actions)

- Workflow: `.github/workflows/firebase-deploy.yml`
- Secrets: add `FIREBASE_TOKEN` under GitHub → Settings → Secrets and variables → Actions → New repository secret.
- The workflow uses Node 22, installs Firebase CLI, installs functions deps, then deploys:
  - Firestore rules (`firestore.rules`)
  - Storage rules (`storage.rules`)
  - Cloud Functions (`functions/`)

## Security Checklist (Public Repo)

- `firebase-config.js` is safe to commit. It contains public web config; security is enforced by Rules + Functions.
- Never commit credentials:
  - Service account JSONs, API keys for third-party services, tokens → keep ONLY in GitHub Actions Secrets.
- `.gitignore` already excludes:
  - `node_modules/`, logs, build artifacts, `.env*`, service-account keys (e.g., `*.key.json`, `service-account.json`).
- Backend protections in place:
  - Server-side allowlist on signup (Cloud Functions `beforeUserCreated`).
  - Admin custom claim via allowlist; Firestore/Storage rules use `request.auth.token.admin`.
  - Sign-in blocker (Cloud Functions `beforeUserSignedIn`) requires verified email for non-admins.

## Local Run Cheatsheet

```bash
# Start a local static server (port 3000)
 npx serve . -l 3000

# Alternative port
 npx serve . -l 8080

# Optional simple server via Python
 python -m http.server 8080
```

## Test Plan

1. Authentication
   - Sign up with email NOT in `config/allowlist.allowedEmails` → expect blocked.
   - Add email to `allowedEmails` → signup succeeds.
   - Try sign-in with unverified non-admin email → expect blocked until verified.
   - Add email to `adminEmails` → sign out/in → Admin Panel appears.

2. Admin Panel
   - Add activity with EN/AR titles, `visible`, `allowRetake`, `order`, and datepicker fields.
   - Save → expect toast success, document in `activities` updated.
   - Delete an activity → expect toast success, doc removed.

3. UI/UX
   - Auth bar: single Submit button toggles Login/Sign Up, overlay spinner shows during auth.
   - Announcements dropdown: opens left in English, right in Arabic.
   - Avatar aligns to the far right on desktop.

4. Rules
   - As a non-admin, writes to `activities` should be denied by Firestore rules.
   - Storage uploads allowed only in permitted paths (own submissions/avatars).

5. CI/CD
   - Push to `main` → confirm GitHub Actions runs:
     - Static site deploy (Pages)
     - Firebase deploy (rules + functions)


## Roadmap (Future)
- Cloud-backed authentication (username/password) and shared progress/leaderboards across devices.
  - Recommendation: Firebase Authentication (Email/Password, no OAuth required) + Firestore for progress + Callable Cloud Functions for secure writes.
  - Alternative: Google Apps Script + Google Sheets as a lightweight backend; expose a web app endpoint to accept score/progress posts.
- Role-based views (Instructor dashboards for analytics).
- Import/export activities from CSV or Google Sheets.

## Local Development
You can open `index.html` directly in a browser. For fetch of local JSON to work reliably, use a simple static server:
- Python: `python -m http.server 8080`
- Node: `npx serve .`

Then open `http://localhost:8080/`.

## License
MIT

## Attendance System (MVP)

### Story: A Secure, Fair Check‑In
An instructor opens attendance for a class and projects a QR code. Every 30 seconds, the QR silently changes to block screenshots. Students scan it and get instant confirmation. One student tries to send a screenshot to a late friend; it fails because the token expired. Another student attempts from a second device; the system blocks it and alerts the instructor. At the end of the 15‑minute window, the session closes automatically, present/absent are finalized, and students receive notifications in their preferred language.

### Design Overview
- **Rotating signed tokens (anti‑screenshot)**
  - Short‑lived token (default 30s) signed by Cloud Function (JWT/HMAC).
  - QR payload: `qaf://attend?sid={sessionId}&t={token}`.
  - Tokens rotate on a timer; old tokens are rejected.
- **Session window (attendance period)**
  - Default 15 minutes; accepts check‑ins only while `status = open`.
  - Instructor can end early or extend.
- **Strict device binding (optional, recommended Default: ON)**
  - First successful check‑in stores a device fingerprint hash.
  - Subsequent attempts from a different device are blocked and flagged.
- **Anomaly detection (alerts to instructor)**
  - Multiple students from the same device in short time.
  - Device change attempts for the same student.
  - Suspicious geo/IP change (coarse, privacy‑respecting).
- **Real‑time notifications**
  - Students: badge awards, attendance recorded, absent at session close.
  - Instructors: device anomalies, session about to expire.
  - Language: per‑user preference `users/{uid}.notifLang` with values `auto|en|ar`.

### Defaults and Admin Settings
- Rotation interval: **30 seconds** (configurable)
- Session duration: **15 minutes** (configurable)
- Location: Firestore `config/attendance`
  ```json
  {
    "rotationSeconds": 30,
    "sessionMinutes": 15,
    "strictDeviceBinding": true
  }
  ```
- Dashboard exposes controls for the above. Client reads from `config/attendance` with a cached fallback to these defaults.

### Data Model
- `attendanceSessions/{sessionId}`
  - `classId`, `createdBy`, `status` (open|closed), `startTime`, `endTime`
  - `rotationSeconds`, `expiresAt`, `nonce`
- `attendance/{classId}/{date}/{studentId}`
  - `checkedInAt`, `deviceHash`, `ipHash`, `status` (present|absent)
- `attendanceEvents/{sessionId}/{eventId}`
  - `type` (badge|penalty|anomaly), `details`, `createdAt`

### Flow
1. Instructor starts a session → Cloud Function creates `attendanceSessions/*` and issues first signed token.
2. QR shows token; rotates every N seconds. Mobile scans → calls callable `attend.scan(sid, token)`.
3. Function verifies signature/expiry, session `open`, enrollment, and device binding.
4. Write attendance record; send real‑time notification (language from `notifLang`, else UI language).
5. On session end (time or manual), mark remaining students absent; notify.

### Security Notes
- Signing happens server‑side only; no secrets in the client.
- Firestore rules restrict attendance writes to callable Functions.
- All user identifiers and device/IP data are hashed when stored.

### Testing Checklist
- Token screenshot reuse fails after rotation.
- Second‑device attempt is blocked and instructor notified.
- Rotation/session settings change in Dashboard are reflected without redeploy.
- Notifications appear in English/Arabic per user’s `notifLang` or UI language.
